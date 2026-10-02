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
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'ip_address' => request()->ip(),
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
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
        if (! $user) {
            return $query->whereRaw('0 = 1');
        }

        if ($user->isDeveloper()) {
            return $query;
        }

        if ($user->isAdmin()) {
            return $query
                // Never show impersonation events to administrators
                ->whereNotIn('action', ['impersonation_started', 'impersonation_ended'])
                // Exclude any log where the actor is a developer
                ->whereDoesntHave('user', function (Builder $uq) {
                    $uq->where('role', 'developer');
                })
                // Only allow logs where user is admin or staff, or system logs (null user_id)
                ->where(function (Builder $q) {
                    $q->whereNull('user_id')
                        ->orWhereHas('user', function (Builder $uq) {
                            $uq->whereIn('role', ['administrator', 'user']);
                        });
                })
                // Exclude logs where the subject is a developer (regardless of subject_type casing/class)
                ->where(function (Builder $q) {
                    $q->whereNotIn('subject_type', ['User', 'App\\Models\\User', 'user'])
                        ->orWhereNull('subject_type')
                        ->orWhereDoesntHave('subjectUser', function (Builder $suq) {
                            $suq->where('role', 'developer');
                        });
                })
                // Exclude any log whose description mentions a developer or a developer username
                ->where(function (Builder $q) {
                    $devUsernames = User::where('role', 'developer')->pluck('username')->filter()->all();
                    $q->where('description', 'not like', '%Developer %')
                        ->where('description', 'not like', "%Developer '%");
                    foreach ($devUsernames as $devUsername) {
                        $q->where('description', 'not like', "%'{$devUsername}'%")
                            ->where('description', 'not like', "%User {$devUsername} %");
                    }
                });
        }

        if ($user->isStaff()) {
            return $query->where(function (Builder $q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereIn('action', ['category_created', 'item_created']);
            });
        }

        return $query->whereRaw('0 = 1');
    }
}
