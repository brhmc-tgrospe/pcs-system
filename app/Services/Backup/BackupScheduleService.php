<?php

namespace App\Services\Backup;

use App\Models\BackupScheduleSetting;

class BackupScheduleService
{
    /**
     * Retrieve the current backup schedule settings.
     */
    public function getSchedule(): BackupScheduleSetting
    {
        return BackupScheduleSetting::current();
    }

    /**
     * Update the backup schedule configuration.
     *
     * @param  array{frequency: string, day: int, time: string, is_enabled: bool}  $data
     */
    public function updateSchedule(array $data): BackupScheduleSetting
    {
        $setting = $this->getSchedule();

        $setting->update([
            'frequency' => $data['frequency'] ?? $setting->frequency,
            'day' => (int) ($data['day'] ?? $setting->day),
            'time' => $data['time'] ?? $setting->time,
            'is_enabled' => (bool) ($data['is_enabled'] ?? $setting->is_enabled),
        ]);

        return $setting->fresh();
    }
}
