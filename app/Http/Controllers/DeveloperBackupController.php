<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateBackupScheduleRequest;
use App\Jobs\CreateSystemBackupJob;
use App\Models\ActivityLog;
use App\Services\Backup\BackupArchiveService;
use App\Services\Backup\BackupScheduleService;
use App\Services\Backup\SystemHealthCollector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class DeveloperBackupController extends Controller
{
    public function __construct(
        protected BackupArchiveService $archiveService,
        protected BackupScheduleService $scheduleService,
        protected SystemHealthCollector $healthCollector
    ) {}

    /**
     * Render the dedicated System Health & Backups Inertia page.
     */
    public function page(): Response
    {
        return Inertia::render('SystemHealth', [
            'backups' => $this->archiveService->listBackups(),
            'backupSchedule' => $this->scheduleService->getSchedule(),
            'backupStatus' => Cache::get(CreateSystemBackupJob::CACHE_KEY, [
                'status' => 'idle',
                'progress_percent' => 0,
                'step_message' => 'Idle',
                'filename' => null,
                'error_message' => null,
                'started_at' => null,
                'finished_at' => null,
            ]),
            'systemHealth' => $this->healthCollector->collect(),
        ]);
    }

    /**
     * Get backup overview data (retained list, schedule, status).
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'backups' => $this->archiveService->listBackups(),
            'schedule' => $this->scheduleService->getSchedule(),
            'status' => Cache::get(CreateSystemBackupJob::CACHE_KEY, [
                'status' => 'idle',
                'progress_percent' => 0,
                'step_message' => 'Idle',
                'filename' => null,
                'error_message' => null,
                'started_at' => null,
                'finished_at' => null,
            ]),
        ]);
    }

    /**
     * Trigger on-demand backup generation (synchronous by default, async if ?async=1).
     */
    public function trigger(Request $request): JsonResponse|RedirectResponse
    {
        // Prevent concurrent backup jobs
        $currentState = Cache::get(CreateSystemBackupJob::CACHE_KEY, []);
        if (($currentState['status'] ?? '') === 'running') {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'A backup process is already running.',
                ], 409);
            }

            return back()->with('error', 'A backup process is already running.');
        }

        if ($request->boolean('async')) {
            CreateSystemBackupJob::dispatch('manual');

            ActivityLog::log('system_backup_triggered', 'Developer initiated an asynchronous on-demand database backup.');

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'System backup job has been dispatched.',
                    'status' => 'running',
                ], 202);
            }

            return back()->with('success', 'Backup generation initiated.');
        }

        @set_time_limit(300);

        try {
            CreateSystemBackupJob::dispatchSync('manual');

            ActivityLog::log('system_backup_triggered', 'Developer generated an on-demand database backup.');

            $latestStatus = Cache::get(CreateSystemBackupJob::CACHE_KEY, [
                'status' => 'completed',
                'progress_percent' => 100,
                'step_message' => 'Backup created successfully.',
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'System backup created successfully.',
                    'status' => $latestStatus,
                    'backups' => $this->archiveService->listBackups(),
                ], 200);
            }

            return back()->with('success', 'Backup created successfully.');
        } catch (\Throwable $e) {
            ActivityLog::log('system_backup_failed', 'On-demand backup generation failed: '.$e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Backup generation failed: '.$e->getMessage(),
                ], 500);
            }

            return back()->with('error', 'Backup generation failed: '.$e->getMessage());
        }
    }

    /**
     * Poll real-time backup job execution status.
     */
    public function status(): JsonResponse
    {
        $status = Cache::get(CreateSystemBackupJob::CACHE_KEY, [
            'status' => 'idle',
            'progress_percent' => 0,
            'step_message' => 'Idle',
            'filename' => null,
            'error_message' => null,
            'started_at' => null,
            'finished_at' => null,
        ]);

        return response()->json($status);
    }

    /**
     * Stream secure file download of a retained backup archive.
     */
    public function download(string $filename): BinaryFileResponse|JsonResponse
    {
        $path = $this->archiveService->getBackupPath($filename);

        if (! $path) {
            return response()->json(['error' => 'Backup file not found or invalid filename.'], 404);
        }

        ActivityLog::log('system_backup_downloaded', "Developer downloaded backup archive: {$filename}");

        return response()->download($path, $filename, [
            'Content-Type' => 'application/zip',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    /**
     * Delete an individual retained backup archive.
     */
    public function destroy(string $filename): RedirectResponse|JsonResponse
    {
        $deleted = $this->archiveService->deleteBackup($filename);

        if (! $deleted) {
            if (request()->wantsJson()) {
                return response()->json(['error' => 'Failed to delete backup file.'], 404);
            }

            return back()->with('error', 'Backup archive not found or could not be deleted.');
        }

        ActivityLog::log('system_backup_deleted', "Developer deleted backup archive: {$filename}");

        if (request()->wantsJson()) {
            return response()->json([
                'message' => 'Backup archive deleted successfully.',
                'backups' => $this->archiveService->listBackups(),
            ]);
        }

        return back()->with('success', 'Backup archive deleted successfully.');
    }

    /**
     * Update automated backup schedule preferences.
     */
    public function updateSchedule(UpdateBackupScheduleRequest $request): RedirectResponse|JsonResponse
    {
        $updated = $this->scheduleService->updateSchedule($request->validated());

        ActivityLog::log('backup_schedule_updated', 'Developer updated automated backup schedule configuration.');

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Backup schedule updated successfully.',
                'schedule' => $updated,
            ]);
        }

        return back()->with('success', 'Backup schedule updated successfully.');
    }
}
