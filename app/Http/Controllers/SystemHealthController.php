<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBackupScheduleRequest;
use App\Jobs\CreateBackupJob;
use App\Models\ActivityLog;
use App\Models\BackupHistory;
use App\Models\BackupSchedule;
use App\Services\Backup\BackupArchiveService;
use App\Services\Backup\SystemHealthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SystemHealthController extends Controller
{
    /**
     * Display the System Health Dashboard & Backup Manager.
     */
    public function index(SystemHealthService $healthService): Response
    {
        $health = $healthService->getHealthSnapshot();

        $schedule = BackupSchedule::firstOrCreate([], [
            'is_enabled' => false,
            'frequency' => 'weekly',
            'day_of_week' => 0, // Sunday
            'day_of_month' => 1,
            'execution_time' => '02:00',
        ]);

        $backupHistories = BackupHistory::with('user:id,first_name,last_name,username')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($item) {
                $userName = $item->user
                    ? (trim("{$item->user->first_name} {$item->user->last_name}") ?: $item->user->username)
                    : 'Automated Scheduler';

                return [
                    'id' => $item->id,
                    'filename' => $item->filename,
                    'file_size' => $item->file_size,
                    'file_size_formatted' => $item->formatted_file_size,
                    'status' => $item->status,
                    'error_message' => $item->error_message,
                    'health_summary' => $item->health_summary,
                    'created_at' => $item->created_at->setTimezone('Asia/Manila')->format('M d, Y h:i A'),
                    'created_at_relative' => $item->created_at->setTimezone('Asia/Manila')->diffForHumans(),
                    'triggered_by_name' => $userName,
                ];
            });

        $formattedLastRun = $schedule->last_run_at
            ? $schedule->last_run_at->setTimezone('Asia/Manila')->format('M d, Y h:i A')
            : null;

        $hasActiveBackup = BackupHistory::whereIn('status', ['pending', 'running'])->exists();

        return Inertia::render('SystemHealth/Index', [
            'health' => $health,
            'schedule' => $schedule,
            'formattedLastRun' => $formattedLastRun,
            'backupHistories' => $backupHistories,
            'hasActiveBackup' => $hasActiveBackup,
        ]);
    }

    /**
     * Trigger a new database backup.
     */
    public function storeBackup(Request $request, BackupArchiveService $archiveService): RedirectResponse
    {
        $hasActive = BackupHistory::whereIn('status', ['pending', 'running'])->exists();
        if ($hasActive) {
            return back()->with('error', 'A backup operation is already in progress. Please wait for it to complete.');
        }

        // Support direct synchronous execution if requested or fallback
        if ($request->boolean('sync')) {
            try {
                $history = $archiveService->createBackup(auth()->id());

                ActivityLog::log(
                    'system_backup_created',
                    "Database and system health backup created: {$history->filename}",
                    'App\Models\BackupHistory',
                    $history->id
                );

                return back()->with('success', 'Backup completed successfully!');
            } catch (\Throwable $e) {
                ActivityLog::log(
                    'system_backup_failed',
                    'Backup creation failed: '.$e->getMessage()
                );

                return back()->with('error', 'Backup failed: '.$e->getMessage());
            }
        }

        // Default: asynchronous queued job
        CreateBackupJob::dispatch(auth()->id());

        ActivityLog::log(
            'system_backup_triggered',
            'Developer queued database backup job.'
        );

        return back()->with('success', 'Backup job queued. Progress will update automatically on this page.');
    }

    /**
     * Download a completed backup archive.
     */
    public function downloadBackup(BackupHistory $history): BinaryFileResponse|RedirectResponse
    {
        if ($history->status !== 'completed') {
            return back()->with('error', 'This backup is not completed and cannot be downloaded.');
        }

        $fullPath = storage_path("app/{$history->file_path}");

        if (! file_exists($fullPath)) {
            return back()->with('error', 'Backup file does not exist on disk.');
        }

        ActivityLog::log(
            'system_backup_downloaded',
            "Downloaded backup archive: {$history->filename}",
            'App\Models\BackupHistory',
            $history->id
        );

        return response()->download($fullPath, $history->filename, [
            'Content-Type' => 'application/zip',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    /**
     * Delete a backup file and its history record.
     */
    public function destroyBackup(BackupHistory $history, BackupArchiveService $archiveService): RedirectResponse
    {
        $filename = $history->filename;
        $archiveService->deleteBackup($history);

        ActivityLog::log(
            'system_backup_deleted',
            "Deleted backup archive: {$filename}"
        );

        return back()->with('success', "Backup {$filename} has been deleted.");
    }

    /**
     * Update the automated backup schedule settings.
     */
    public function updateSchedule(UpdateBackupScheduleRequest $request): RedirectResponse
    {
        $schedule = BackupSchedule::firstOrCreate([]);
        $schedule->update($request->validated());

        ActivityLog::log(
            'backup_schedule_updated',
            'Updated automated backup schedule configuration.'
        );

        return back()->with('success', 'Backup schedule updated successfully.');
    }
}
