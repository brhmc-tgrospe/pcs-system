<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ActivityLogVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private User $developer;

    private User $admin;

    private User $secondAdmin;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->developer = User::factory()->create(['role' => 'developer', 'username' => 'dev_lead']);
        $this->admin = User::factory()->create(['role' => 'administrator', 'username' => 'admin_officer']);
        $this->secondAdmin = User::factory()->create(['role' => 'administrator', 'username' => 'second_admin']);
        $this->staff = User::factory()->create(['role' => 'user', 'username' => 'staff_encoder']);
    }

    public function test_admin_cannot_see_developer_login_or_logout_activity(): void
    {
        $this->actingAs($this->developer);
        ActivityLog::log('login', 'User dev_lead logged in.');
        ActivityLog::log('logout', 'User dev_lead logged out.');

        $this->actingAs($this->admin);
        ActivityLog::log('login', 'User admin_officer logged in.');

        $visibleLogs = ActivityLog::visibleTo($this->admin)->get();

        $this->assertTrue($visibleLogs->contains('description', 'User admin_officer logged in.'));
        $this->assertFalse($visibleLogs->contains('description', 'User dev_lead logged in.'));
        $this->assertFalse($visibleLogs->contains('description', 'User dev_lead logged out.'));
    }

    public function test_admin_cannot_see_developer_impersonation_logs(): void
    {
        $this->actingAs($this->developer);
        ActivityLog::log('impersonation_started', "Developer 'dev_lead' started impersonating user '{$this->staff->username}'.", 'User', $this->staff->id);
        ActivityLog::log('impersonation_ended', "Developer 'dev_lead' stopped impersonating '{$this->staff->username}'.", 'User', $this->staff->id);

        $visibleLogs = ActivityLog::visibleTo($this->admin)->get();

        $this->assertFalse($visibleLogs->contains('action', 'impersonation_started'));
        $this->assertFalse($visibleLogs->contains('action', 'impersonation_ended'));
        $this->assertCount(0, $visibleLogs);
    }

    public function test_admin_cannot_see_developer_item_or_category_mutations(): void
    {
        $this->actingAs($this->developer);
        Category::create([
            'name' => 'Dev Category',
            'cat_code' => 'DC-01',
            'description' => 'Category created by dev',
        ]);

        $visibleLogs = ActivityLog::visibleTo($this->admin)->get();
        $this->assertFalse($visibleLogs->contains('description', "Category 'Dev Category' was created."));
    }

    public function test_admin_cannot_see_developer_user_management_logs(): void
    {
        $this->actingAs($this->developer);
        $newStaff = User::factory()->create(['role' => 'user', 'username' => 'new_encoder']);
        ActivityLog::log('user_created', "User '{$newStaff->username}' was created with role '{$newStaff->role}'.", 'User', $newStaff->id);

        $newAdmin = User::factory()->create(['role' => 'administrator', 'username' => 'new_admin']);
        ActivityLog::log('user_created', "User '{$newAdmin->username}' was created with role '{$newAdmin->role}'.", 'User', $newAdmin->id);

        $visibleLogs = ActivityLog::visibleTo($this->admin)->get();
        $this->assertFalse($visibleLogs->contains('description', "User 'new_encoder' was created with role 'user'."));
        $this->assertFalse($visibleLogs->contains('description', "User 'new_admin' was created with role 'administrator'."));
    }

    public function test_admin_cannot_see_logs_where_developer_is_the_subject_regardless_of_type_casing(): void
    {
        // Subject type as 'User'
        ActivityLog::create([
            'user_id' => null,
            'action' => 'user_updated',
            'description' => "User 'dev_lead' profile was updated.",
            'subject_type' => 'User',
            'subject_id' => $this->developer->id,
            'ip_address' => '127.0.0.1',
        ]);

        // Subject type as FQCN 'App\Models\User'
        ActivityLog::create([
            'user_id' => null,
            'action' => 'user_updated',
            'description' => 'Developer account setting modified.',
            'subject_type' => 'App\\Models\\User',
            'subject_id' => $this->developer->id,
            'ip_address' => '127.0.0.1',
        ]);

        $visibleLogs = ActivityLog::visibleTo($this->admin)->get();
        $this->assertFalse($visibleLogs->contains('description', "User 'dev_lead' profile was updated."));
        $this->assertFalse($visibleLogs->contains('description', 'Developer account setting modified.'));
    }

    public function test_admin_cannot_see_null_user_logs_mentioning_developer_or_dev_username(): void
    {
        ActivityLog::create([
            'user_id' => null,
            'action' => 'system_maintenance',
            'description' => "Developer 'dev_lead' ran maintenance command.",
            'subject_type' => null,
            'subject_id' => null,
            'ip_address' => '127.0.0.1',
        ]);

        $visibleLogs = ActivityLog::visibleTo($this->admin)->get();
        $this->assertFalse($visibleLogs->contains('description', "Developer 'dev_lead' ran maintenance command."));
    }

    public function test_admin_via_activity_logs_http_endpoint_never_receives_developer_logs(): void
    {
        $this->actingAs($this->developer);
        ActivityLog::log('item_created', 'Item A created by dev.', 'Item', 1);

        $this->actingAs($this->secondAdmin);
        ActivityLog::log('item_created', 'Item B created by second admin.', 'Item', 2);

        $this->actingAs($this->admin)
            ->get('/activity-logs')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityLogs')
                ->has('logs.data', 1)
                ->where('logs.data.0.description', 'Item B created by second admin.')
            );
    }

    public function test_admin_searching_for_developer_yields_zero_results(): void
    {
        $this->actingAs($this->developer);
        ActivityLog::log('item_created', 'Item X created by dev_lead.', 'Item', 10);

        $this->actingAs($this->admin)
            ->get('/activity-logs?search=dev_lead')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('ActivityLogs')
                ->has('logs.data', 0)
            );
    }

    public function test_developer_can_view_all_logs_including_own_and_others(): void
    {
        $this->actingAs($this->developer);
        ActivityLog::log('item_created', 'Item Dev created.', 'Item', 1);

        $this->actingAs($this->admin);
        ActivityLog::log('item_created', 'Item Admin created.', 'Item', 2);

        $visibleLogs = ActivityLog::visibleTo($this->developer)->get();
        $this->assertTrue($visibleLogs->contains('description', 'Item Dev created.'));
        $this->assertTrue($visibleLogs->contains('description', 'Item Admin created.'));
    }

    public function test_admin_can_see_staff_and_other_admin_activities(): void
    {
        $this->actingAs($this->staff);
        ActivityLog::log('report_printed', 'Staff printed canvass report.', 'Report', 1);

        $this->actingAs($this->secondAdmin);
        ActivityLog::log('category_created', 'Second Admin created category.', 'Category', 1);

        $visibleLogs = ActivityLog::visibleTo($this->admin)->get();
        $this->assertTrue($visibleLogs->contains('description', 'Staff printed canvass report.'));
        $this->assertTrue($visibleLogs->contains('description', 'Second Admin created category.'));
    }
}
