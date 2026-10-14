<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BackupScheduleSetting extends Model
{
    protected $fillable = [
        'frequency',
        'day',
        'time',
        'is_enabled',
        'last_run_at',
        'last_status',
    ];

    protected $casts = [
        'day' => 'integer',
        'is_enabled' => 'boolean',
        'last_run_at' => 'datetime',
    ];

    /**
     * Get or create the singleton backup schedule setting instance.
     */
    public static function current(): self
    {
        return static::firstOrCreate([], [
            'frequency' => 'weekly',
            'day' => 0, // Sunday
            'time' => '02:00',
            'is_enabled' => true,
        ]);
    }
}
