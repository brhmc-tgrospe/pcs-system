<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\SavedReport;
use App\Services\SavedReportService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SavedReportController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        protected SavedReportService $savedReportService
    ) {}

    /**
     * Display a listing of saved reports.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', SavedReport::class);

        // Opportunistic cleanup of soft-deleted reports older than 30 days
        $this->savedReportService->pruneExpired();

        $user = $request->user();
        $canManageTrash = $user->isAdministrative() || $user->isDeveloper();

        $status = $request->query('status', 'active');
        if ($status === 'trashed' && ! $canManageTrash) {
            $status = 'active';
        }

        $search = $request->query('search', '');
        $sortField = $request->query('sort_field', 'created_at');
        $sortDirection = $request->query('sort_direction', 'desc');
        $perPage = (int) $request->query('per_page', 10);

        $allowedSorts = ['contract_name', 'project_ref_no', 'item_count', 'file_size', 'created_at'];
        if (! in_array($sortField, $allowedSorts, true)) {
            $sortField = 'created_at';
        }

        $allowedPerPage = [10, 25, 50, 100];
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = 10;
        }

        $filters = [
            'search' => $search,
            'status' => $status,
        ];

        $reports = SavedReport::with('user:id,username,first_name,last_name,role')
            ->filter($filters)
            ->orderBy($sortField, $sortDirection === 'asc' ? 'asc' : 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $activeCount = SavedReport::count();
        $trashedCount = $canManageTrash ? SavedReport::onlyTrashed()->count() : 0;

        return Inertia::render('SavedReports', [
            'reports' => $reports,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
            'counts' => [
                'active' => $activeCount,
                'trashed' => $trashedCount,
            ],
        ]);
    }

    /**
     * Store a new saved report uploaded from ReportView.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', SavedReport::class);

        $validated = $request->validate([
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:25600'],
            'contract_name' => ['required', 'string', 'max:255'],
            'project_ref_no' => ['nullable', 'string', 'max:255'],
            'item_count' => ['nullable', 'integer', 'min:0'],
            'metadata' => ['nullable'],
        ]);

        $report = $this->savedReportService->saveReport(
            $request->user(),
            $request->file('pdf'),
            $validated
        );

        return back()->with('success', "Report '{$report->contract_name}' saved to Saved Reports successfully.");
    }

    /**
     * View the saved report PDF inline in a new tab.
     */
    public function show(SavedReport $savedReport): BinaryFileResponse
    {
        $this->authorize('view', $savedReport);

        if (! Storage::disk('public')->exists($savedReport->file_path)) {
            abort(404, 'The requested report PDF file was not found on the server.');
        }

        return response()->file(Storage::disk('public')->path($savedReport->file_path), [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $savedReport->file_name . '"',
        ]);
    }

    /**
     * Download the saved report PDF.
     */
    public function download(SavedReport $savedReport): StreamedResponse
    {
        $this->authorize('view', $savedReport);

        if (! Storage::disk('public')->exists($savedReport->file_path)) {
            abort(404, 'The requested report PDF file was not found on the server.');
        }

        return Storage::disk('public')->download($savedReport->file_path, $savedReport->file_name);
    }

    /**
     * Soft delete a saved report.
     * Allowed: administrator, superadmin, developer.
     */
    public function destroy(SavedReport $savedReport): RedirectResponse
    {
        $this->authorize('delete', $savedReport);

        $name = $savedReport->contract_name;
        $savedReport->delete();

        ActivityLog::log('report_deleted', "Moved report '{$name}' to trash.");

        return back()->with('success', "Report '{$name}' moved to trash.");
    }

    /**
     * Restore a soft-deleted report.
     * Allowed: Developer ONLY.
     */
    public function restore(int $id): RedirectResponse
    {
        $this->authorize('restoreAny', SavedReport::class);

        $savedReport = SavedReport::onlyTrashed()->findOrFail($id);
        $this->authorize('restore', $savedReport);

        $savedReport->restore();

        ActivityLog::log('report_restored', "Restored report '{$savedReport->contract_name}' from trash.");

        return back()->with('success', "Report '{$savedReport->contract_name}' restored successfully.");
    }

    /**
     * Permanently delete a report and remove its file.
     * Allowed: Developer ONLY.
     */
    public function forceDelete(int $id): RedirectResponse
    {
        $this->authorize('forceDeleteAny', SavedReport::class);

        $savedReport = SavedReport::onlyTrashed()->findOrFail($id);
        $this->authorize('forceDelete', $savedReport);

        $name = $savedReport->contract_name;
        $savedReport->forceDelete();

        ActivityLog::log('report_force_deleted', "Permanently deleted report '{$name}'.");

        return back()->with('success', "Report '{$name}' permanently deleted.");
    }

    /**
     * Bulk soft-delete saved reports.
     * Allowed: administrator, superadmin, developer.
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $this->authorize('deleteAny', SavedReport::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:saved_reports,id'],
        ]);

        $reports = SavedReport::whereIn('id', $validated['ids'])->get();
        $count = 0;
        foreach ($reports as $report) {
            $report->delete();
            $count++;
        }

        ActivityLog::log('report_bulk_deleted', "Moved {$count} report(s) to trash.");

        return back()->with('success', "{$count} report(s) moved to trash.");
    }

    /**
     * Bulk restore soft-deleted reports.
     * Allowed: Developer ONLY.
     */
    public function bulkRestore(Request $request): RedirectResponse
    {
        $this->authorize('restoreAny', SavedReport::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $count = SavedReport::onlyTrashed()
            ->whereIn('id', $validated['ids'])
            ->restore();

        ActivityLog::log('report_bulk_restored', "Restored {$count} report(s) from trash.");

        return back()->with('success', "{$count} report(s) restored successfully.");
    }

    /**
     * Bulk permanently delete soft-deleted reports and their PDF files.
     * Allowed: Developer ONLY.
     */
    public function bulkForceDelete(Request $request): RedirectResponse
    {
        $this->authorize('forceDeleteAny', SavedReport::class);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $reports = SavedReport::onlyTrashed()->whereIn('id', $validated['ids'])->get();
        $count = 0;
        foreach ($reports as $report) {
            $report->forceDelete();
            $count++;
        }

        ActivityLog::log('report_bulk_force_deleted', "Permanently deleted {$count} report(s).");

        return back()->with('success', "{$count} report(s) permanently deleted.");
    }
}
