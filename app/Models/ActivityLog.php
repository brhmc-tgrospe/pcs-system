<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
        self::create([
            'user_id'      => Auth::id(),
            'action'       => $action,
            'description'  => $description,
            'ip_address'   => request()->ip(),
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
        ]);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}