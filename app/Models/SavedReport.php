<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class SavedReport extends Model
{
    use HasFactory, SoftDeletes, Prunable;

    protected $fillable = [
        'user_id',
        'project_ref_no',
        'contract_name',
        'file_name',
        'file_path',
        'file_size',
        'item_count',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'file_size' => 'integer',
            'item_count' => 'integer',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::forceDeleting(function (SavedReport $report) {
            if ($report->file_path && Storage::disk('public')->exists($report->file_path)) {
                Storage::disk('public')->delete($report->file_path);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the prunable model query (auto-delete soft-deleted after 30 days).
     */
    public function prunable(): Builder
    {
        return static::onlyTrashed()->where('deleted_at', '<=', now()->subDays(30));
    }

    /**
     * Prepare the model for pruning.
     */
    protected function pruning(): void
    {
        if ($this->file_path && Storage::disk('public')->exists($this->file_path)) {
            Storage::disk('public')->delete($this->file_path);
        }
    }

    /**
     * Scope a query to search and filter saved reports.
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function ($q, $search) {
                $term = "%{$search}%";
                $q->where(function ($sub) use ($term) {
                    $sub->where('contract_name', 'like', $term)
                        ->orWhere('project_ref_no', 'like', $term)
                        ->orWhere('file_name', 'like', $term)
                        ->orWhereHas('user', function ($userQuery) use ($term) {
                            $userQuery->where('username', 'like', $term)
                                ->orWhere('first_name', 'like', $term)
                                ->orWhere('last_name', 'like', $term);
                        });
                });
            })
            ->when(($filters['status'] ?? 'active') === 'trashed', function ($q) {
                $q->onlyTrashed();
            }, function ($q) {
                $q->withoutTrashed();
            });
    }
}
