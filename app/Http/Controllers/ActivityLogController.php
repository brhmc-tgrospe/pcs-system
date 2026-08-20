<?php
namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = ActivityLog::with('user')->visibleTo($user)->latest();

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100])) {
            $perPage = 25;
        }

        $logs = $query->paginate($perPage)->withQueryString()->through(fn ($log) => [
            'id'           => $log->id,
            'action'       => $log->action,
            'description'  => $log->description,
            'subject_type' => $log->subject_type,
            'subject_id'   => $log->subject_id,
            'ip_address'   => $log->ip_address,
            'created_at'   => $log->created_at->toISOString(),
            'user'         => $log->user ? [
                'username'  => $log->user->username,
                'full_name' => $log->user->full_name,
            ] : null,
        ]);

        if ($request->wantsJson()) {
            return response()->json($logs);
        }

        return Inertia::render('ActivityLogs', [
            'logs'   => $logs,
            'search' => $request->string('search')->toString(),
        ]);
    }
}
