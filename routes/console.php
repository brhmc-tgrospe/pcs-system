<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Daily cleanup of soft-deleted saved reports older than 30 days
Schedule::command('model:prune', ['--model' => [App\Models\SavedReport::class]])->daily();

// Automated System Health & Database Backup Evaluator
Schedule::command('backup:run-scheduled')->everyMinute();
