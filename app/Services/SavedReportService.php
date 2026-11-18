<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\SavedReport;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SavedReportService
{
    /**
     * Store an uploaded PDF report and create its database record.
     */
    public function saveReport(User $user, UploadedFile $file, array $data): SavedReport
    {
        $contractName = $data['contract_name'] ?? 'Official Report';
        $safeName = Str::slug($contractName);
        if (empty($safeName)) {
            $safeName = 'official_report';
        }

        $timestamp = now()->format('Ymd_His');
        $fileName = "{$safeName}_{$timestamp}.pdf";
        $directory = 'saved_reports';

        // Store the physical PDF inside storage/app/public/saved_reports
        $filePath = $file->storeAs($directory, $fileName, 'public');

        $metadata = null;
        if (! empty($data['metadata'])) {
            $metadata = is_string($data['metadata'])
                ? json_decode($data['metadata'], true)
                : $data['metadata'];
        }

        $savedReport = SavedReport::create([
            'user_id' => $user->id,
            'contract_name' => $contractName,
            'project_ref_no' => $data['project_ref_no'] ?? null,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'item_count' => (int) ($data['item_count'] ?? 0),
            'metadata' => $metadata,
        ]);

        ActivityLog::log(
            'report_saved',
            "Saved PDF report for '{$contractName}' with {$savedReport->item_count} item(s)."
        );

        return $savedReport;
    }

    /**
     * Permanently remove soft-deleted reports older than 30 days.
     */
    public function pruneExpired(): int
    {
        $expired = SavedReport::onlyTrashed()
            ->where('deleted_at', '<=', now()->subDays(30))
            ->get();

        $count = 0;
        foreach ($expired as $report) {
            $report->forceDelete();
            $count++;
        }

        return $count;
    }
}
