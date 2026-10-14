<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupArchiveService;
use Illuminate\Console\Command;

class RunSystemBackupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:backup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate an optimized database backup bundled with system health telemetry';

    /**
     * Execute the console command.
     */
    public function handle(BackupArchiveService $archiveService): int
    {
        $this->info('Starting system backup generation...');

        try {
            $filename = $archiveService->createBackup(function (int $percent, string $message) {
                $this->line("[{$percent}%] {$message}");
            });

            $this->info("Backup completed successfully: {$filename}");
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Backup generation failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
