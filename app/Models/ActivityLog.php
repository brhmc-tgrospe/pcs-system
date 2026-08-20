<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

class ActivityLog extends Model
{
    protected $guarded = [];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function log(string $action, ?string $description = null, ?string $subjectType = null, ?int $subjectId = null): void
    {
        $userId = session('impersonator_id') ?? Auth::id();

        self::create([
            'user_id'      => $userId,
            'action'       => $action,
            'description'  => $description,
            'ip_address'   => request()->ip(),
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subjectUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'subject_id');
    }

    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if (!$user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->role === 'developer') {
            return $query;
        }

        if ($user->role === 'administrator') {
            return $query
                ->where(function (Builder $q) {
                    $q->whereNull('user_id')
                      ->orWhereHas('user', function (Builder $uq) {
                          $uq->whereIn('role', ['administrator', 'user']);
                      });
                })
                ->where(function (Builder $q) {
                    $q->where('subject_type', '!=', 'User')
                      ->orWhereNull('subject_type')
                      ->orWhereDoesntHave('subjectUser', function (Builder $suq) {
                          $suq->where('role', 'developer');
                      });
                });
        }

        if ($user->role === 'user') {
            return $query->where(function (Builder $q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhereIn('action', ['category_created', 'item_created']);
            });
        }

        return $query->whereRaw('0 = 1');
    }
}