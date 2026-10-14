<?php

namespace App\Services\Backup;

use App\Services\Backup\Contracts\DatabaseDumperInterface;
use Carbon\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use ZipArchive;

class BackupArchiveService
{
    public const MAX_RETAINED_BACKUPS = 4;

    public const TIMEZONE = 'Asia/Manila';

    public const FILENAME_PATTERN = '/^(?:PCS|backup)_\d{4}-\d{2}-\d{2}_\d{2}-?\d{2}-?\d{2}\.zip$/';

    public function __construct(
        protected DatabaseDumperInterface $dumper,
        protected SystemHealthCollector $healthCollector
    ) {}

    /**
     * Create a new backup archive, packaging MySQL dump and system health JSON.
     *
     * @param  (callable(int, string): void)|null  $progressCallback
     * @return string Generated filename (e.g. PCS_2026-10-14_130000.zip)
     *
     * @throws RuntimeException
     */
    public function createBackup(?callable $progressCallback = null): string
    {
        $this->notify($progressCallback, 10, 'Initializing backup environment...');

        $backupsDir = storage_path('app/backups');
        if (! File::exists($backupsDir)) {
            File::makeDirectory($backupsDir, 0755, true);
        }

        $timestamp = Carbon::now(self::TIMEZONE)->format('Y-m-d_His');
        $tempDir = $backupsDir.DIRECTORY_SEPARATOR.'tmp_'.uniqid('', true);
        File::makeDirectory($tempDir, 0755, true);

        $tempSqlGz = $tempDir.DIRECTORY_SEPARATOR.'database.sql.gz';
        $tempHealthJson = $tempDir.DIRECTORY_SEPARATOR.'system_health.json';
        $finalZipName = "PCS_{$timestamp}.zip";
        $finalZipPath = $backupsDir.DIRECTORY_SEPARATOR.$finalZipName;

        try {
            // Step 1: Dump database stream
            $this->notify($progressCallback, 30, 'Streaming database dump (zero-locking)...');
            $this->dumper->dump($tempSqlGz);

            // Step 2: Collect system health diagnostics
            $this->notify($progressCallback, 70, 'Collecting system health telemetry...');
            $healthData = $this->healthCollector->collect();
            file_put_contents($tempHealthJson, json_encode($healthData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            // Step 3: Bundle into Zip archive
            $this->notify($progressCallback, 85, 'Packaging and compressing archive...');
            $zip = new ZipArchive;
            $zipStatus = $zip->open($finalZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            if ($zipStatus !== true) {
                throw new RuntimeException("Failed to create ZIP archive at: {$finalZipPath} (code {$zipStatus})");
            }

            $zip->addFile($tempSqlGz, 'database.sql.gz');
            $zip->addFile($tempHealthJson, 'system_health.json');
            $zip->close();

            // Step 4: Prune oldest archives to strictly maintain max 4
            $this->notify($progressCallback, 95, 'Pruning old backups to maintain retention cap...');
            $this->pruneOldBackups();

            $this->notify($progressCallback, 100, 'Backup generated successfully.');

            Log::info("System backup created successfully: {$finalZipName}");

            return $finalZipName;
        } catch (\Throwable $e) {
            if (File::exists($finalZipPath)) {
                @unlink($finalZipPath);
            }
            Log::error('System backup generation failed: '.$e->getMessage(), [
                'exception' => $e,
            ]);
            throw new RuntimeException('Backup failed: '.$e->getMessage(), 0, $e);
        } finally {
            // Clean up temporary directory
            if (File::isDirectory($tempDir)) {
                File::deleteDirectory($tempDir);
            }
        }
    }

    /**
     * Enforce strict retention: retain only the latest 4 backups and delete older ones.
     */
    public function pruneOldBackups(): int
    {
        $backups = $this->listBackups();
        $prunedCount = 0;

        if (count($backups) > self::MAX_RETAINED_BACKUPS) {
            // Sliced from index 4 onwards are the excess oldest files
            $excess = array_slice($backups, self::MAX_RETAINED_BACKUPS);
            foreach ($excess as $backup) {
                $path = storage_path('app/backups/'.$backup['filename']);
                if (file_exists($path) && @unlink($path)) {
                    $prunedCount++;
                    Log::info('Pruned old backup to maintain retention cap of '.self::MAX_RETAINED_BACKUPS.": {$backup['filename']}");
                }
            }
        }

        return $prunedCount;
    }

    /**
     * List all retained backup archives sorted descending by creation time.
     *
     * @return array<int, array{filename: string, size_bytes: int, size_formatted: string, created_at: string, created_at_human: string}>
     */
    public function listBackups(): array
    {
        $backupsDir = storage_path('app/backups');
        if (! File::exists($backupsDir)) {
            return [];
        }

        $files = File::files($backupsDir);
        $backups = [];

        foreach ($files as $file) {
            $filename = $file->getFilename();
            if (preg_match(self::FILENAME_PATTERN, $filename)) {
                $sizeBytes = $file->getSize();

                if (preg_match('/^(?:PCS|backup)_(\d{4}-\d{2}-\d{2})_(\d{2})-?(\d{2})-?(\d{2})\.zip$/', $filename, $matches)) {
                    $dateStr = $matches[1].' '.$matches[2].':'.$matches[3].':'.$matches[4];
                    $carbon = Carbon::createFromFormat('Y-m-d H:i:s', $dateStr, self::TIMEZONE);
                } else {
                    $carbon = Carbon::createFromTimestamp($file->getMTime(), self::TIMEZONE);
                }

                $backups[] = [
                    'filename' => $filename,
                    'size_bytes' => $sizeBytes,
                    'size_formatted' => $this->formatBytes($sizeBytes),
                    'created_at' => $carbon->toIso8601String(),
                    'created_at_formatted' => $carbon->format('M d, Y h:i A').' (UTC+8)',
                    'created_at_human' => $carbon->diffForHumans(),
                    '_timestamp' => $carbon->timestamp,
                ];
            }
        }

        // Sort descending (newest first)
        usort($backups, fn ($a, $b) => $b['_timestamp'] <=> $a['_timestamp']);

        // Remove sorting helper key
        return array_map(function ($item) {
            unset($item['_timestamp']);

            return $item;
        }, $backups);
    }

    /**
     * Validate filename and delete the specified backup archive.
     */
    public function deleteBackup(string $filename): bool
    {
        if (! preg_match(self::FILENAME_PATTERN, $filename)) {
            throw new RuntimeException('Invalid backup filename format.');
        }

        $path = storage_path('app/backups/'.$filename);
        if (! file_exists($path)) {
            return false;
        }

        return @unlink($path);
    }

    /**
     * Get validated absolute path for safe download streaming.
     */
    public function getBackupPath(string $filename): ?string
    {
        if (! preg_match(self::FILENAME_PATTERN, $filename)) {
            return null;
        }

        $path = storage_path('app/backups/'.$filename);

        return file_exists($path) ? $path : null;
    }

    protected function notify(?callable $callback, int $percent, string $message): void
    {
        if ($callback !== null) {
            $callback($percent, $message);
        }
    }

    protected function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2).' '.$units[$pow];
    }
}
