<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SystemHealthCollector
{
    /**
     * Gather comprehensive system health diagnostics.
     */
    public function collect(): array
    {
        return [
            'captured_at' => now(BackupArchiveService::TIMEZONE)->toIso8601String(),
            'timezone' => BackupArchiveService::TIMEZONE,
            'host' => [
                'hostname' => gethostname() ?: 'unknown',
                'os' => PHP_OS.' ('.php_uname('s').' '.php_uname('r').')',
                'php_version' => PHP_VERSION,
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time').'s',
                'opcache_enabled' => function_exists('opcache_get_status') && ! empty(opcache_get_status()['opcache_enabled']),
                'critical_extensions' => [
                    'pdo_mysql' => extension_loaded('pdo_mysql'),
                    'zip' => extension_loaded('zip'),
                    'zlib' => extension_loaded('zlib'),
                    'mbstring' => extension_loaded('mbstring'),
                    'openssl' => extension_loaded('openssl'),
                ],
            ],
            'application' => [
                'name' => config('app.name'),
                'env' => app()->environment(),
                'debug' => (bool) config('app.debug'),
                'url' => config('app.url'),
                'timezone' => config('app.timezone'),
            ],
            'database' => $this->collectDatabaseHealth(),
            'storage' => $this->collectStorageHealth(),
            'queue_and_jobs' => $this->collectQueueHealth(),
        ];
    }

    protected function collectDatabaseHealth(): array
    {
        $dbName = config('database.connections.'.config('database.default').'.database');

        $mysqlVersion = 'unknown';
        try {
            $versionRow = DB::select('SELECT VERSION() as version');
            $mysqlVersion = $versionRow[0]->version ?? 'unknown';
        } catch (\Throwable $e) {
            // Silently fall back
        }

        $tables = [];
        $totalSizeMb = 0.0;

        try {
            $tableStats = DB::select('
                SELECT 
                    TABLE_NAME AS `table`,
                    TABLE_ROWS AS `rows`,
                    DATA_LENGTH AS `data_bytes`,
                    INDEX_LENGTH AS `index_bytes`,
                    (DATA_LENGTH + INDEX_LENGTH) AS `total_bytes`,
                    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS `size_mb`,
                    ROUND(DATA_LENGTH / 1024 / 1024, 2) AS `data_mb`,
                    ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS `index_mb`,
                    TABLE_COLLATION AS `collation`
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = ?
                ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
            ', [$dbName]);

            foreach ($tableStats as $stat) {
                $size = (float) ($stat->size_mb ?? 0);
                $totalSizeMb += $size;
                $dataBytes = (int) ($stat->data_bytes ?? 0);
                $indexBytes = (int) ($stat->index_bytes ?? 0);
                $totalBytes = (int) ($stat->total_bytes ?? ($dataBytes + $indexBytes));

                $tables[] = [
                    'table' => $stat->table,
                    'rows' => (int) ($stat->rows ?? 0),
                    'size_mb' => $size,
                    'data_mb' => (float) ($stat->data_mb ?? 0),
                    'index_mb' => (float) ($stat->index_mb ?? 0),
                    'data_bytes' => $dataBytes,
                    'index_bytes' => $indexBytes,
                    'total_bytes' => $totalBytes,
                    'data_size_formatted' => $this->formatBytes($dataBytes),
                    'index_size_formatted' => $this->formatBytes($indexBytes),
                    'total_size_formatted' => $this->formatBytes($totalBytes),
                    'collation' => $stat->collation ?? '',
                ];
            }
        } catch (\Throwable $e) {
            // Silently fall back
        }

        if (empty($tables) && config('database.default') === 'sqlite') {
            try {
                $sqliteTables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
                foreach ($sqliteTables as $t) {
                    $tableName = $t->name ?? '';
                    if ($tableName) {
                        $tables[] = [
                            'table' => $tableName,
                            'rows' => DB::table($tableName)->count(),
                            'size_mb' => 0.01,
                            'data_mb' => 0.01,
                            'index_mb' => 0.0,
                            'data_bytes' => 10240,
                            'index_bytes' => 0,
                            'total_bytes' => 10240,
                            'data_size_formatted' => '10 KB',
                            'index_size_formatted' => '0 KB',
                            'total_size_formatted' => '10 KB',
                            'collation' => 'binary',
                        ];
                    }
                }
            } catch (\Throwable $e) {
                // Silently fall back
            }
        }

        $migrationsCount = 0;
        try {
            if (Schema::hasTable('migrations')) {
                $migrationsCount = DB::table('migrations')->count();
            }
        } catch (\Throwable $e) {
            // Silently fall back
        }

        return [
            'default_connection' => config('database.default'),
            'database_name' => $dbName,
            'version' => $mysqlVersion,
            'total_size_mb' => round($totalSizeMb, 2),
            'tables_count' => count($tables),
            'tables' => $tables,
            'completed_migrations_count' => $migrationsCount,
        ];
    }

    protected function collectStorageHealth(): array
    {
        $storagePath = storage_path('app');
        $freeBytes = @disk_free_space($storagePath);
        $totalBytes = @disk_total_space($storagePath);

        return [
            'storage_path_writable' => is_writable($storagePath),
            'disk_free_gb' => $freeBytes !== false ? round($freeBytes / 1024 / 1024 / 1024, 2) : null,
            'disk_total_gb' => $totalBytes !== false ? round($totalBytes / 1024 / 1024 / 1024, 2) : null,
            'disk_used_percent' => ($freeBytes !== false && $totalBytes > 0)
                ? round(((1 - ($freeBytes / $totalBytes)) * 100), 1)
                : null,
        ];
    }

    protected function collectQueueHealth(): array
    {
        $pendingJobs = 0;
        $failedJobs = 0;

        try {
            if (Schema::hasTable('jobs')) {
                $pendingJobs = DB::table('jobs')->count();
            }
            if (Schema::hasTable('failed_jobs')) {
                $failedJobs = DB::table('failed_jobs')->count();
            }
        } catch (\Throwable $e) {
            // Silently fall back
        }

        return [
            'driver' => config('queue.default'),
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
        ];
    }

    public function formatBytes(int|float $bytes): string
    {
        $bytes = max((float) $bytes, 0);
        if ($bytes === 0.0) {
            return '0 KB';
        }
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $pow = floor(log($bytes) / log(1024));
        $pow = min((int) $pow, count($units) - 1);
        $val = $bytes / pow(1024, $pow);

        if ($pow <= 1 || $val >= 100) {
            return round($val).' '.$units[$pow];
        }

        return round($val, 1).' '.$units[$pow];
    }
}
