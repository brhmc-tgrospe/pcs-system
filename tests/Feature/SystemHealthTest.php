<?php

namespace Tests\Feature;

use App\Models\BackupHistory;
use App\Models\BackupSchedule;
use App\Models\User;
use App\Services\Backup\BackupArchiveService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class SystemHealthTest extends TestCase
{
    use RefreshDatabase;

    private User $developer;
    private User $admin;
    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        $this->developer = User::factory()->create([
            'username' => 'dev_user',
            'role' => 'developer',
        ]);

        $this->admin = User::factory()->create([
            'username' => 'admin_user',
            'role' => 'administrator',
        ]);

        $this->staff = User::factory()->create([
            'username' => 'staff_user',
            'role' => 'user',
        ]);
    }

    protected function tearDown(): void
    {
        // Clean up any test backup files created
        $backupsDir = storage_path('app/backups');
        if (File::exists($backupsDir)) {
            $files = File::files($backupsDir);
            foreach ($files as $file) {
                if (str_starts_with($file->getFilename(), 'PCS_test_')) {
                    @unlink($file->getRealPath());
                }
            }
        }

        parent::tearDown();
    }

    public function test_guest_is_redirected_to_login_when_accessing_system_health(): void
    {
        $response = $this->get('/system-health');
        $response->assertRedirect('/login');
    }

    public function test_non_developer_roles_are_forbidden_from_system_health(): void
    {
        $this->actingAs($this->staff)->get('/system-health')->assertForbidden();
        $this->actingAs($this->admin)->get('/system-health')->assertForbidden();
    }

    public function test_developer_can_view_system_health_dashboard(): void
    {
        $response = $this->actingAs($this->developer)->get('/system-health');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('SystemHealth/Index')
            ->has('health')
            ->has('schedule')
            ->has('backupHistories')
            ->has('hasActiveBackup')
        );
    }

    public function test_developer_can_create_synchronous_backup(): void
    {
        $response = $this->actingAs($this->developer)->post('/system-health/backup', [
            'sync' => true,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_histories', [
            'triggered_by' => $this->developer->id,
            'status' => 'completed',
        ]);

        $history = BackupHistory::where('triggered_by', $this->developer->id)->first();
        $this->assertNotNull($history);
        $this->assertFileExists(storage_path("app/{$history->file_path}"));

        // Cleanup
        if (file_exists(storage_path("app/{$history->file_path}"))) {
            @unlink(storage_path("app/{$history->file_path}"));
        }
    }

    public function test_system_strictly_enforces_max_4_backup_retention(): void
    {
        $archiveService = app(BackupArchiveService::class);
        $backupsDir = storage_path('app/backups');
        if (! File::exists($backupsDir)) {
            File::makeDirectory($backupsDir, 0755, true);
        }

        // Seed 5 completed backup files & records
        $createdRecords = [];
        for ($i = 1; $i <= 5; $i++) {
            $filename = "PCS_test_2026-11-11_00000{$i}.zip";
            $relativePath = "backups/{$filename}";
            $fullPath = storage_path("app/{$relativePath}");
            file_put_contents($fullPath, "dummy backup {$i}");

            $record = BackupHistory::create([
                'filename' => $filename,
                'file_path' => $relativePath,
                'file_size' => filesize($fullPath),
                'status' => 'completed',
                'triggered_by' => $this->developer->id,
                'created_at' => now()->addMinutes($i),
            ]);

            $createdRecords[] = $record;
        }

        $this->assertEquals(5, BackupHistory::where('status', 'completed')->count());

        $pruned = $archiveService->enforceRetention();

        $this->assertEquals(1, $pruned);
        $this->assertEquals(4, BackupHistory::where('status', 'completed')->count());

        // Oldest record (index 0) should be pruned
        $this->assertDatabaseMissing('backup_histories', ['id' => $createdRecords[0]->id]);
        $this->assertFileDoesNotExist(storage_path("app/{$createdRecords[0]->file_path}"));

        // Newest records should still exist
        $this->assertDatabaseHas('backup_histories', ['id' => $createdRecords[4]->id]);
        $this->assertFileExists(storage_path("app/{$createdRecords[4]->file_path}"));

        // Clean up remaining test files
        for ($i = 1; $i <= 4; $i++) {
            $p = storage_path("app/{$createdRecords[$i]->file_path}");
            if (file_exists($p)) {
                @unlink($p);
            }
        }
    }

    public function test_developer_can_download_completed_backup(): void
    {
        $filename = 'PCS_test_download.zip';
        $relativePath = "backups/{$filename}";
        $fullPath = storage_path("app/{$relativePath}");

        if (! File::exists(dirname($fullPath))) {
            File::makeDirectory(dirname($fullPath), 0755, true);
        }
        file_put_contents($fullPath, 'dummy zip content');

        $history = BackupHistory::create([
            'filename' => $filename,
            'file_path' => $relativePath,
            'file_size' => 17,
            'status' => 'completed',
            'triggered_by' => $this->developer->id,
        ]);

        $response = $this->actingAs($this->developer)->get("/system-health/backup/{$history->id}/download");

        $response->assertOk();
        $response->assertHeader('content-disposition', "attachment; filename={$filename}");

        if (file_exists($fullPath)) {
            @unlink($fullPath);
        }
    }

    public function test_developer_cannot_download_uncompleted_backup(): void
    {
        $history = BackupHistory::create([
            'filename' => 'PCS_test_running.zip',
            'file_path' => 'backups/PCS_test_running.zip',
            'status' => 'running',
            'triggered_by' => $this->developer->id,
        ]);

        $response = $this->actingAs($this->developer)->get("/system-health/backup/{$history->id}/download");

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_developer_can_delete_backup(): void
    {
        $filename = 'PCS_test_delete.zip';
        $relativePath = "backups/{$filename}";
        $fullPath = storage_path("app/{$relativePath}");

        if (! File::exists(dirname($fullPath))) {
            File::makeDirectory(dirname($fullPath), 0755, true);
        }
        file_put_contents($fullPath, 'dummy content');

        $history = BackupHistory::create([
            'filename' => $filename,
            'file_path' => $relativePath,
            'status' => 'completed',
            'triggered_by' => $this->developer->id,
        ]);

        $response = $this->actingAs($this->developer)->delete("/system-health/backup/{$history->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('backup_histories', ['id' => $history->id]);
        $this->assertFileDoesNotExist($fullPath);
    }

    public function test_developer_can_update_backup_schedule(): void
    {
        $payload = [
            'is_enabled' => true,
            'frequency' => 'monthly',
            'day_of_month' => 15,
            'day_of_week' => 0,
            'execution_time' => '03:30',
        ];

        $response = $this->actingAs($this->developer)->put('/system-health/schedule', $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_schedules', [
            'is_enabled' => true,
            'frequency' => 'monthly',
            'day_of_month' => 15,
            'execution_time' => '03:30',
        ]);
    }

    public function test_scheduled_backup_command_runs_successfully(): void
    {
        BackupSchedule::create([
            'is_enabled' => true,
            'frequency' => 'weekly',
            'day_of_week' => 0,
            'execution_time' => '02:00',
        ]);

        $this->artisan('backup:run-scheduled', ['--force' => true])
            ->assertSuccessful();
    }
}
