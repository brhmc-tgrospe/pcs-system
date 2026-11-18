<?php

namespace Tests\Feature;

use App\Models\SavedReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SavedReportTest extends TestCase
{
    use RefreshDatabase;

    private User $developer;
    private User $admin;
    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

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

    public function test_guest_is_redirected_to_login_when_accessing_saved_reports(): void
    {
        $response = $this->get('/saved-reports');
        $response->assertRedirect('/login');
    }

    public function test_all_authenticated_roles_can_view_saved_reports_index(): void
    {
        $this->actingAs($this->staff)->get('/saved-reports')->assertOk();
        $this->actingAs($this->admin)->get('/saved-reports')->assertOk();
        $this->actingAs($this->developer)->get('/saved-reports')->assertOk();
    }

    public function test_user_can_save_a_pdf_report(): void
    {
        $file = UploadedFile::fake()->create('abstract_report.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->staff)->post('/saved-reports', [
            'pdf' => $file,
            'contract_name' => 'Procurement of Hospital Linens',
            'project_ref_no' => 'PB 2026-99',
            'item_count' => 15,
            'metadata' => json_encode(['test' => true]),
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('saved_reports', [
            'contract_name' => 'Procurement of Hospital Linens',
            'project_ref_no' => 'PB 2026-99',
            'user_id' => $this->staff->id,
            'item_count' => 15,
        ]);

        $saved = SavedReport::where('project_ref_no', 'PB 2026-99')->first();
        $this->assertNotNull($saved);
        Storage::disk('public')->assertExists($saved->file_path);
    }

    public function test_staff_cannot_soft_delete_saved_reports(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');
        $path = $file->store('saved_reports', 'public');
        $report = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Medical Supplies',
            'file_name' => 'report.pdf',
            'file_path' => $path,
            'file_size' => 100,
            'item_count' => 5,
        ]);

        $response = $this->actingAs($this->staff)->delete("/saved-reports/{$report->id}");
        $response->assertForbidden();
        $this->assertNotSoftDeleted('saved_reports', ['id' => $report->id]);
    }

    public function test_admin_and_developer_can_soft_delete_saved_reports(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');
        $path = $file->store('saved_reports', 'public');
        $report = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Medical Supplies',
            'file_name' => 'report.pdf',
            'file_path' => $path,
            'file_size' => 100,
            'item_count' => 5,
        ]);

        $response = $this->actingAs($this->admin)->delete("/saved-reports/{$report->id}");
        $response->assertSessionHas('success');
        $this->assertSoftDeleted('saved_reports', ['id' => $report->id]);
    }

    public function test_only_developers_can_restore_soft_deleted_reports(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');
        $path = $file->store('saved_reports', 'public');
        $report = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Medical Supplies',
            'file_name' => 'report.pdf',
            'file_path' => $path,
            'file_size' => 100,
            'item_count' => 5,
        ]);
        $report->delete();

        // Staff fails
        $this->actingAs($this->staff)->post("/saved-reports/{$report->id}/restore")
            ->assertForbidden();

        // Admin fails (Only developer allowed per specification)
        $this->actingAs($this->admin)->post("/saved-reports/{$report->id}/restore")
            ->assertForbidden();

        // Developer succeeds
        $this->actingAs($this->developer)->post("/saved-reports/{$report->id}/restore")
            ->assertSessionHas('success');

        $this->assertNotSoftDeleted('saved_reports', ['id' => $report->id]);
    }

    public function test_only_developers_can_permanently_delete_reports_and_file_is_removed(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');
        $path = $file->store('saved_reports', 'public');
        $report = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Medical Supplies',
            'file_name' => 'report.pdf',
            'file_path' => $path,
            'file_size' => 100,
            'item_count' => 5,
        ]);
        $report->delete();

        // Staff fails
        $this->actingAs($this->staff)->delete("/saved-reports/{$report->id}/force")
            ->assertForbidden();

        // Admin fails
        $this->actingAs($this->admin)->delete("/saved-reports/{$report->id}/force")
            ->assertForbidden();

        Storage::disk('public')->assertExists($path);

        // Developer succeeds
        $this->actingAs($this->developer)->delete("/saved-reports/{$report->id}/force")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('saved_reports', ['id' => $report->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_bulk_delete_and_bulk_restore_permissions(): void
    {
        $r1 = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Report 1',
            'file_name' => 'r1.pdf',
            'file_path' => 'saved_reports/r1.pdf',
            'file_size' => 100,
            'item_count' => 1,
        ]);
        $r2 = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Report 2',
            'file_name' => 'r2.pdf',
            'file_path' => 'saved_reports/r2.pdf',
            'file_size' => 100,
            'item_count' => 2,
        ]);

        // Staff cannot bulk delete
        $this->actingAs($this->staff)->post('/saved-reports/bulk/delete', [
            'ids' => [$r1->id, $r2->id],
        ])->assertForbidden();

        // Admin can bulk delete
        $this->actingAs($this->admin)->post('/saved-reports/bulk/delete', [
            'ids' => [$r1->id, $r2->id],
        ])->assertSessionHas('success');

        $this->assertSoftDeleted('saved_reports', ['id' => $r1->id]);
        $this->assertSoftDeleted('saved_reports', ['id' => $r2->id]);

        // Admin cannot bulk restore
        $this->actingAs($this->admin)->post('/saved-reports/bulk/restore', [
            'ids' => [$r1->id, $r2->id],
        ])->assertForbidden();

        // Developer can bulk restore
        $this->actingAs($this->developer)->post('/saved-reports/bulk/restore', [
            'ids' => [$r1->id, $r2->id],
        ])->assertSessionHas('success');

        $this->assertNotSoftDeleted('saved_reports', ['id' => $r1->id]);
        $this->assertNotSoftDeleted('saved_reports', ['id' => $r2->id]);
    }

    public function test_bulk_force_delete_only_allowed_for_developers(): void
    {
        $r1 = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Report 1',
            'file_name' => 'r1.pdf',
            'file_path' => 'saved_reports/r1.pdf',
            'file_size' => 100,
            'item_count' => 1,
        ]);
        $r1->delete();

        // Admin fails
        $this->actingAs($this->admin)->post('/saved-reports/bulk/force', [
            'ids' => [$r1->id],
        ])->assertForbidden();

        // Developer succeeds
        $this->actingAs($this->developer)->post('/saved-reports/bulk/force', [
            'ids' => [$r1->id],
        ])->assertSessionHas('success');

        $this->assertDatabaseMissing('saved_reports', ['id' => $r1->id]);
    }

    public function test_pruning_removes_soft_deleted_reports_older_than_30_days(): void
    {
        $file = UploadedFile::fake()->create('old_report.pdf', 100, 'application/pdf');
        $path = $file->store('saved_reports', 'public');

        $oldReport = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Old Report',
            'file_name' => 'old_report.pdf',
            'file_path' => $path,
            'file_size' => 100,
            'item_count' => 1,
        ]);
        $oldReport->delete();

        // Backdate deleted_at to 31 days ago
        $oldReport->deleted_at = now()->subDays(31);
        $oldReport->saveQuietly();

        // Recent deleted report (5 days ago)
        $recentReport = SavedReport::create([
            'user_id' => $this->admin->id,
            'contract_name' => 'Recent Report',
            'file_name' => 'recent_report.pdf',
            'file_path' => 'saved_reports/recent_report.pdf',
            'file_size' => 100,
            'item_count' => 1,
        ]);
        $recentReport->delete();
        $recentReport->deleted_at = now()->subDays(5);
        $recentReport->saveQuietly();

        // Visiting index triggers pruneExpired
        $this->actingAs($this->staff)->get('/saved-reports')->assertOk();

        $this->assertDatabaseMissing('saved_reports', ['id' => $oldReport->id]);
        Storage::disk('public')->assertMissing($path);

        $this->assertDatabaseHas('saved_reports', ['id' => $recentReport->id]);
    }
}
