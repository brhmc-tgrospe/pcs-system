<?php

namespace App\Jobs;

use App\Models\BackupScheduleSetting;
use App\Services\Backup\BackupArchiveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CreateSystemBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public const CACHE_KEY = 'system_backup_state';

    public const LOCK_KEY = 'system_backup_lock';

    public $timeout = 1800; // 30 minutes max

    public $tries = 1;      // Do not auto-retry immediately to avoid compounding failure

    public function __construct(
        public string $triggeredBy = 'manual'
    ) {}

    public function handle(BackupArchiveService $archiveService): void
    {
        $lock = Cache::lock(self::LOCK_KEY, 1800);

        if (! $lock->get()) {
            Log::warning('Backup job skipped: Another backup is already in progress.');

            return;
        }

        $this->updateStatus([
            'status' => 'running',
            'progress_percent' => 5,
            'step_message' => 'Acquired lock. Preparing backup job...',
            'filename' => null,
            'error_message' => null,
            'started_at' => now(BackupArchiveService::TIMEZONE)->toIso8601String(),
            'finished_at' => null,
            'triggered_by' => $this->triggeredBy,
        ]);

        try {
            $filename = $archiveService->createBackup(function (int $percent, string $message) {
                $this->updateStatus([
                    'status' => 'running',
                    'progress_percent' => $percent,
                    'step_message' => $message,
                ]);
            });

            $this->updateStatus([
                'status' => 'completed',
                'progress_percent' => 100,
                'step_message' => 'Backup created successfully.',
                'filename' => $filename,
                'finished_at' => now(BackupArchiveService::TIMEZONE)->toIso8601String(),
            ]);

            // Update schedule setting model telemetry
            try {
                $schedule = BackupScheduleSetting::current();
                $schedule->update([
                    'last_run_at' => now(BackupArchiveService::TIMEZONE),
                    'last_status' => 'success',
                ]);
            } catch (\Throwable $ignored) {
                // Ignore telemetry write failure
            }
        } catch (\Throwable $e) {
            Log::error('System backup job failed: '.$e->getMessage(), [
                'exception' => $e,
            ]);

            $this->updateStatus([
                'status' => 'failed',
                'progress_percent' => 0,
                'step_message' => 'Backup failed.',
                'error_message' => $e->getMessage(),
                'finished_at' => now(BackupArchiveService::TIMEZONE)->toIso8601String(),
            ]);

            try {
                $schedule = BackupScheduleSetting::current();
                $schedule->update([
                    'last_run_at' => now(BackupArchiveService::TIMEZONE),
                    'last_status' => 'failed',
                ]);
            } catch (\Throwable $ignored) {
                // Ignore telemetry write failure
            }

            throw $e;
        } finally {
            $lock->release();
        }
    }

    /**
     * Atomically merge state into the cache.
     */
    protected function updateStatus(array $attributes): void
    {
        $current = Cache::get(self::CACHE_KEY, [
            'status' => 'idle',
            'progress_percent' => 0,
            'step_message' => 'Idle',
            'filename' => null,
            'error_message' => null,
            'started_at' => null,
            'finished_at' => null,
            'triggered_by' => null,
        ]);

        $updated = array_merge($current, $attributes);
        Cache::put(self::CACHE_KEY, $updated, now()->addHours(2));
    }
}
