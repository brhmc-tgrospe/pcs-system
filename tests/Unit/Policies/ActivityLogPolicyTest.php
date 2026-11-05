<?php

namespace Tests\Unit\Policies;

use App\Models\User;
use App\Policies\ActivityLogPolicy;
use Tests\TestCase;

class ActivityLogPolicyTest extends TestCase
{
    private ActivityLogPolicy $policy;

    private User $developer;

    private User $superadmin;

    private User $admin;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new ActivityLogPolicy;
        $this->developer = new User(['role' => 'developer']);
        $this->superadmin = new User(['role' => 'superadmin']);
        $this->admin = new User(['role' => 'administrator']);
        $this->staff = new User(['role' => 'user']);
    }

    public function test_staff_cannot_view_activity_logs(): void
    {
        $this->assertFalse($this->policy->viewAny($this->staff));
    }

    public function test_admin_can_view_activity_logs_but_cannot_prune(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertFalse($this->policy->prune($this->admin));
    }

    public function test_superadmin_can_view_activity_logs_but_cannot_prune(): void
    {
        $this->assertTrue($this->policy->viewAny($this->superadmin));
        $this->assertFalse($this->policy->prune($this->superadmin));
    }

    public function test_developer_can_view_and_prune_activity_logs(): void
    {
        $this->assertTrue($this->policy->viewAny($this->developer));
        $this->assertTrue($this->policy->prune($this->developer));
    }
}
