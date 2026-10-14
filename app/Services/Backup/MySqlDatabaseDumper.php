<?php

namespace App\Services\Backup\Contracts;

namespace App\Services\Backup;

use App\Services\Backup\Contracts\DatabaseDumperInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\Process\Process;

class MySqlDatabaseDumper implements DatabaseDumperInterface
{
    /**
     * Dump database to a compressed .sql.gz file.
     *
     * @throws RuntimeException
     */
    public function dump(string $targetGzPath): bool
    {
        $connectionConfig = config('database.connections.'.config('database.default'));
        $driver = $connectionConfig['driver'] ?? '';

        if ($driver === 'sqlite') {
            return $this->dumpSqlite($targetGzPath);
        }

        if ($driver !== 'mysql') {
            throw new RuntimeException("Unsupported database connection driver: {$driver}.");
        }

        $binary = $this->resolveBinaryPath();

        if ($binary !== null) {
            return $this->dumpViaBinary($binary, $connectionConfig, $targetGzPath);
        }

        Log::warning('mysqldump binary not found. Falling back to pure PHP chunked streaming dumper.');

        return $this->dumpViaPdoFallback($targetGzPath);
    }

    /**
     * Stream dump using mysqldump binary piped directly into gzip.
     */
    protected function dumpViaBinary(string $binary, array $config, string $targetGzPath): bool
    {
        $host = $config['host'] ?? '127.0.0.1';
        $port = (string) ($config['port'] ?? '3306');
        $database = $config['database'] ?? '';
        $username = $config['username'] ?? 'root';
        $password = $config['password'] ?? '';
        $charset = $config['charset'] ?? 'utf8mb4';

        // Write credentials to a temporary secure option file to avoid CLI exposure
        $tempCnf = tempnam(sys_get_temp_dir(), 'mycnf_');
        $cnfContent = "[client]\nuser = \"{$username}\"\npassword = \"{$password}\"\n";
        file_put_contents($tempCnf, $cnfContent);

        $gzHandle = gzopen($targetGzPath, 'wb6');
        if (! $gzHandle) {
            @unlink($tempCnf);
            throw new RuntimeException("Failed to open gzip stream for writing: {$targetGzPath}");
        }

        $command = [
            $binary,
            "--defaults-extra-file={$tempCnf}",
            "--host={$host}",
            "--port={$port}",
            "--default-character-set={$charset}",
            '--single-transaction',
            '--quick',
            '--skip-lock-tables',
            '--routines',
            '--triggers',
            $database,
        ];

        try {
            $process = new Process($command);
            $process->setTimeout(1800); // 30 minutes max for massive databases

            $process->run(function ($type, $buffer) use ($gzHandle) {
                if ($type === Process::OUT) {
                    gzwrite($gzHandle, $buffer);
                }
            });

            gzclose($gzHandle);

            if (! $process->isSuccessful()) {
                @unlink($targetGzPath);
                throw new RuntimeException('mysqldump failed: '.$process->getErrorOutput());
            }

            return true;
        } finally {
            if (file_exists($tempCnf)) {
                @unlink($tempCnf);
            }
        }
    }

    /**
     * Fallback streaming dumper using PDO cursor and gzip stream.
     */
    protected function dumpViaPdoFallback(string $targetGzPath): bool
    {
        $gz = gzopen($targetGzPath, 'wb6');
        if (! $gz) {
            throw new RuntimeException("Failed to open fallback gzip file: {$targetGzPath}");
        }

        try {
            gzwrite($gz, "-- PCS Database Backup (PHP Fallback Stream)\n");
            gzwrite($gz, '-- Generated: '.date('Y-m-d H:i:s')."\n");
            gzwrite($gz, "SET FOREIGN_KEY_CHECKS=0;\n\n");

            $pdo = DB::connection()->getPdo();
            $tablesStatement = $pdo->query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
            $tables = $tablesStatement->fetchAll(\PDO::FETCH_COLUMN);

            foreach ($tables as $table) {
                // Drop and create table
                gzwrite($gz, "DROP TABLE IF EXISTS `{$table}`;\n");
                $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch(\PDO::FETCH_ASSOC);
                $createSql = $createStmt['Create Table'] ?? '';
                gzwrite($gz, "{$createSql};\n\n");

                // Stream rows with cursor
                $cursor = DB::table($table)->cursor();
                $chunk = [];
                foreach ($cursor as $row) {
                    $rowArray = (array) $row;
                    $chunk[] = '('.implode(', ', array_map(function ($val) use ($pdo) {
                        return $val === null ? 'NULL' : $pdo->quote($val);
                    }, $rowArray)).')';

                    if (count($chunk) >= 200) {
                        $this->writeInsertChunk($gz, $table, array_keys($rowArray), $chunk);
                        $chunk = [];
                    }
                }

                if (! empty($chunk) && isset($rowArray)) {
                    $this->writeInsertChunk($gz, $table, array_keys($rowArray), $chunk);
                }

                gzwrite($gz, "\n\n");
            }

            gzwrite($gz, "SET FOREIGN_KEY_CHECKS=1;\n");
            gzclose($gz);

            return true;
        } catch (\Throwable $e) {
            gzclose($gz);
            @unlink($targetGzPath);
            throw new RuntimeException('Fallback PDO dump failed: '.$e->getMessage(), 0, $e);
        }
    }

    protected function writeInsertChunk($gz, string $table, array $columns, array $rows): void
    {
        $cols = '`'.implode('`, `', $columns).'`';
        $sql = "INSERT INTO `{$table}` ({$cols}) VALUES\n".implode(",\n", $rows).";\n";
        gzwrite($gz, $sql);
    }

    /**
     * Locate mysqldump binary across common environments.
     */
    protected function resolveBinaryPath(): ?string
    {
        $custom = env('MYSQLDUMP_PATH');
        if ($custom && file_exists($custom)) {
            return $custom;
        }

        $candidates = [
            'C:\\xampp\\mysql\\bin\\mysqldump.exe',
            'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
            'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe',
            '/usr/bin/mysqldump',
            '/usr/local/bin/mysqldump',
            '/usr/local/mysql/bin/mysqldump',
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) {
                return $candidate;
            }
        }

        // Check system PATH
        $process = Process::fromShellCommandLine(PHP_OS_FAMILY === 'Windows' ? 'where mysqldump' : 'which mysqldump');
        $process->run();
        if ($process->isSuccessful()) {
            $lines = explode("\n", trim($process->getOutput()));
            if (! empty($lines[0]) && file_exists(trim($lines[0]))) {
                return trim($lines[0]);
            }
        }

        return null;
    }

    /**
     * Stream SQLite database dump directly into gzip stream.
     */
    protected function dumpSqlite(string $targetGzPath): bool
    {
        $gz = gzopen($targetGzPath, 'wb6');
        if (! $gz) {
            throw new RuntimeException("Failed to open gzip stream for SQLite dump: {$targetGzPath}");
        }

        try {
            gzwrite($gz, "-- PCS Database Backup (SQLite Stream)\n");
            gzwrite($gz, '-- Generated: '.date('Y-m-d H:i:s')."\n\n");

            $pdo = DB::connection()->getPdo();
            $stmt = $pdo->query("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            $tables = $stmt->fetchAll(\PDO::FETCH_ASSOC);

            foreach ($tables as $t) {
                $tableName = $t['name'];
                $createSql = $t['sql'];

                gzwrite($gz, "DROP TABLE IF EXISTS \"{$tableName}\";\n");
                gzwrite($gz, "{$createSql};\n\n");

                $cursor = DB::table($tableName)->cursor();
                $chunk = [];
                $columns = [];

                foreach ($cursor as $row) {
                    $rowArray = (array) $row;
                    $columns = array_keys($rowArray);
                    $chunk[] = '('.implode(', ', array_map(function ($val) use ($pdo) {
                        return $val === null ? 'NULL' : $pdo->quote($val);
                    }, $rowArray)).')';

                    if (count($chunk) >= 200) {
                        $this->writeInsertChunkSqlite($gz, $tableName, $columns, $chunk);
                        $chunk = [];
                    }
                }

                if (! empty($chunk) && ! empty($columns)) {
                    $this->writeInsertChunkSqlite($gz, $tableName, $columns, $chunk);
                }

                gzwrite($gz, "\n\n");
            }

            gzclose($gz);

            return true;
        } catch (\Throwable $e) {
            gzclose($gz);
            @unlink($targetGzPath);
            throw new RuntimeException('SQLite dump failed: '.$e->getMessage(), 0, $e);
        }
    }

    protected function writeInsertChunkSqlite($gz, string $table, array $columns, array $rows): void
    {
        $cols = '"'.implode('", "', $columns).'"';
        $sql = "INSERT INTO \"{$table}\" ({$cols}) VALUES\n".implode(",\n", $rows).";\n";
        gzwrite($gz, $sql);
    }
}
