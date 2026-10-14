<?php

use App\Jobs\CreateSystemBackupJob;
use App\Models\BackupScheduleSetting;
use App\Services\Backup\BackupArchiveService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Schema;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Dynamic System Backup Scheduler
try {
    if (Schema::hasTable('backup_schedule_settings')) {
        $setting = BackupScheduleSetting::current();
        if ($setting && $setting->is_enabled) {
            $event = Schedule::job(new CreateSystemBackupJob(triggeredBy: 'scheduler'))
                ->timezone(BackupArchiveService::TIMEZONE);

            if ($setting->frequency === 'weekly') {
                $event->weeklyOn($setting->day, $setting->time);
            } elseif ($setting->frequency === 'monthly') {
                $event->monthlyOn($setting->day, $setting->time);
            }
        }
    }
} catch (Throwable $e) {
    // Avoid crashing console commands if database is unavailable or being migrated
}
