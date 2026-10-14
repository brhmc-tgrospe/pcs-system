<?php

namespace Tests\Feature;

use App\Jobs\CreateSystemBackupJob;
use App\Models\User;
use App\Services\Backup\BackupArchiveService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;
use ZipArchive;

class DeveloperBackupTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        // Clean up test backup files from storage
        $backupsDir = storage_path('app/backups');
        if (File::exists($backupsDir)) {
            $files = File::files($backupsDir);
            foreach ($files as $file) {
                if (str_starts_with($file->getFilename(), 'backup_test_') || str_starts_with($file->getFilename(), 'PCS_test_')) {
                    @unlink($file->getPathname());
                }
            }
        }

        parent::tearDown();
    }

    public function test_guests_and_regular_users_and_admins_cannot_access_backup_endpoints(): void
    {
        $staff = User::factory()->create(['role' => 'user']);
        $admin = User::factory()->create(['role' => 'administrator']);

        // Guests
        $this->get('/system-health')->assertRedirect('/login');
        $this->get('/developer/backups')->assertRedirect('/login');
        $this->post('/developer/backups/trigger')->assertRedirect('/login');

        // Regular Staff
        $this->actingAs($staff)->get('/system-health')->assertStatus(403);
        $this->actingAs($staff)->get('/developer/backups')->assertStatus(403);
        $this->actingAs($staff)->post('/developer/backups/trigger')->assertStatus(403);
        $this->actingAs($staff)->get('/developer/backups/status')->assertStatus(403);
        $this->actingAs($staff)->put('/developer/backups/schedule', [
            'frequency' => 'weekly',
            'day' => 0,
            'time' => '02:00',
            'is_enabled' => true,
        ])->assertStatus(403);

        // Administrator (Only Developer is permitted)
        $this->actingAs($admin)->get('/system-health')->assertStatus(403);
        $this->actingAs($admin)->get('/developer/backups')->assertStatus(403);
        $this->actingAs($admin)->post('/developer/backups/trigger')->assertStatus(403);
        $this->actingAs($admin)->get('/developer/backups/status')->assertStatus(403);
        $this->actingAs($admin)->put('/developer/backups/schedule', [
            'frequency' => 'weekly',
            'day' => 0,
            'time' => '02:00',
            'is_enabled' => true,
        ])->assertStatus(403);
    }

    public function test_developer_can_access_dedicated_system_health_page(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);

        $response = $this->actingAs($dev)->get('/system-health');

        $response->assertStatus(200);
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->component('SystemHealth')
            ->has('backups')
            ->has('backupSchedule')
            ->has('backupStatus')
            ->has('systemHealth')
        );
    }

    public function test_developer_can_view_backups_list_and_status(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);

        $response = $this->actingAs($dev)->getJson('/developer/backups');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'backups',
                'schedule' => ['frequency', 'day', 'time', 'is_enabled'],
                'status' => ['status', 'progress_percent', 'step_message'],
            ]);
    }

    public function test_developer_can_trigger_backup_job(): void
    {
        Queue::fake();

        $dev = User::factory()->create(['role' => 'developer']);

        $response = $this->actingAs($dev)->postJson('/developer/backups/trigger');

        $response->assertStatus(202)
            ->assertJson([
                'status' => 'running',
            ]);

        Queue::assertPushed(CreateSystemBackupJob::class);
    }

    public function test_backup_archive_service_generates_zip_with_database_and_health_json(): void
    {
        /** @var BackupArchiveService $service */
        $service = app(BackupArchiveService::class);

        $filename = $service->createBackup();

        $path = storage_path('app/backups/'.$filename);
        $this->assertFileExists($path);

        // Verify ZIP contents
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($path) === true);

        $this->assertNotFalse($zip->locateName('database.sql.gz'), 'ZIP must contain database.sql.gz');
        $this->assertNotFalse($zip->locateName('system_health.json'), 'ZIP must contain system_health.json');

        // Verify system_health.json has required schema
        $healthContent = $zip->getFromName('system_health.json');
        $this->assertNotEmpty($healthContent);
        $healthData = json_decode($healthContent, true);
        $this->assertArrayHasKey('host', $healthData);
        $this->assertArrayHasKey('database', $healthData);
        $this->assertArrayHasKey('storage', $healthData);
        $this->assertArrayHasKey('queue_and_jobs', $healthData);

        $zip->close();

        // Cleanup
        @unlink($path);
    }

    public function test_retention_policy_strictly_caps_at_4_backups(): void
    {
        $backupsDir = storage_path('app/backups');
        if (! File::exists($backupsDir)) {
            File::makeDirectory($backupsDir, 0755, true);
        }

        // Clean any existing archives before test
        $existing = File::files($backupsDir);
        foreach ($existing as $file) {
            if (preg_match(BackupArchiveService::FILENAME_PATTERN, $file->getFilename())) {
                @unlink($file->getPathname());
            }
        }

        // Create 5 dummy backup zip files with stepped modification times
        $filenames = [
            'PCS_2026-10-01_010000.zip', // Oldest
            'PCS_2026-10-02_010000.zip',
            'PCS_2026-10-03_010000.zip',
            'PCS_2026-10-04_010000.zip',
            'PCS_2026-10-05_010000.zip', // Newest
        ];

        foreach ($filenames as $index => $fname) {
            $fpath = $backupsDir.DIRECTORY_SEPARATOR.$fname;
            $zip = new ZipArchive;
            $zip->open($fpath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            $zip->addFromString('test.txt', 'sample');
            $zip->close();
            // Assign sequential mtime
            touch($fpath, time() - ((count($filenames) - $index) * 100));
        }

        /** @var BackupArchiveService $service */
        $service = app(BackupArchiveService::class);

        $this->assertCount(5, $service->listBackups());

        // Run pruning
        $pruned = $service->pruneOldBackups();

        $this->assertEquals(1, $pruned);

        $remaining = $service->listBackups();
        $this->assertCount(4, $remaining);

        // Verify the oldest file was unlinked
        $this->assertFileDoesNotExist($backupsDir.DIRECTORY_SEPARATOR.'PCS_2026-10-01_010000.zip');
        // Verify newest remains
        $this->assertFileExists($backupsDir.DIRECTORY_SEPARATOR.'PCS_2026-10-05_010000.zip');

        // Cleanup remaining dummy files
        foreach ($remaining as $item) {
            @unlink(storage_path('app/backups/'.$item['filename']));
        }
    }

    public function test_developer_can_download_backup_archive(): void
    {
        $backupsDir = storage_path('app/backups');
        if (! File::exists($backupsDir)) {
            File::makeDirectory($backupsDir, 0755, true);
        }

        $filename = 'PCS_2026-10-14_099999.zip';
        $path = $backupsDir.DIRECTORY_SEPARATOR.$filename;

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('readme.txt', 'test content');
        $zip->close();

        $dev = User::factory()->create(['role' => 'developer']);

        $response = $this->actingAs($dev)->get("/developer/backups/{$filename}/download");

        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename='.$filename);

        @unlink($path);
    }

    public function test_developer_can_delete_backup_archive(): void
    {
        $backupsDir = storage_path('app/backups');
        if (! File::exists($backupsDir)) {
            File::makeDirectory($backupsDir, 0755, true);
        }

        $filename = 'PCS_2026-10-14_088888.zip';
        $path = $backupsDir.DIRECTORY_SEPARATOR.$filename;

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('readme.txt', 'test content');
        $zip->close();

        $dev = User::factory()->create(['role' => 'developer']);

        $response = $this->actingAs($dev)->deleteJson("/developer/backups/{$filename}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Backup archive deleted successfully.']);

        $this->assertFileDoesNotExist($path);
    }

    public function test_developer_can_update_backup_schedule(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);

        $response = $this->actingAs($dev)->putJson('/developer/backups/schedule', [
            'frequency' => 'monthly',
            'day' => 15,
            'time' => '03:45',
            'is_enabled' => true,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('backup_schedule_settings', [
            'frequency' => 'monthly',
            'day' => 15,
            'time' => '03:45',
            'is_enabled' => true,
        ]);
    }

    public function test_backup_created_uses_utc_plus_8_timezone(): void
    {
        /** @var BackupArchiveService $service */
        $service = app(BackupArchiveService::class);

        $nowManila = Carbon::now(BackupArchiveService::TIMEZONE);
        $filename = $service->createBackup();

        // Filename should match the PCS_Date_TimeOfBackup pattern with Asia/Manila (UTC+8) date prefix
        $expectedPrefix = 'PCS_'.$nowManila->format('Y-m-d');
        $this->assertStringStartsWith($expectedPrefix, $filename);
        $this->assertMatchesRegularExpression('/^PCS_\d{4}-\d{2}-\d{2}_\d{6}\.zip$/', $filename);

        $backups = $service->listBackups();
        $this->assertNotEmpty($backups);

        $latest = $backups[0];
        $this->assertEquals($filename, $latest['filename']);
        // Verify created_at has +08:00 offset
        $this->assertStringContainsString('+08:00', $latest['created_at']);
        // Verify formatted date contains explicit UTC+8 label
        $this->assertStringContainsString('(UTC+8)', $latest['created_at_formatted']);

        // Inspect system_health.json inside the ZIP
        $zipPath = storage_path('app/backups/'.$filename);
        $zip = new ZipArchive;
        $this->assertTrue($zip->open($zipPath) === true);
        $healthContent = $zip->getFromName('system_health.json');
        $healthData = json_decode($healthContent, true);
        $this->assertStringContainsString('+08:00', $healthData['captured_at']);
        $this->assertEquals('Asia/Manila', $healthData['timezone']);
        $zip->close();

        @unlink($zipPath);
    }
}
