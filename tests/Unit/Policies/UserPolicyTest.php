<?php

namespace Tests\Unit\Policies;

use App\Models\User;
use App\Policies\UserPolicy;
use Tests\TestCase;

class UserPolicyTest extends TestCase
{
    private UserPolicy $policy;

    private User $developer;

    private User $admin;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new UserPolicy;

        $this->developer = new User(['role' => 'developer']);
        $this->developer->id = 1;

        $this->admin = new User(['role' => 'administrator']);
        $this->admin->id = 2;

        $this->staff = new User(['role' => 'user']);
        $this->staff->id = 3;
    }

    public function test_view_any(): void
    {
        $this->assertFalse($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->developer));
    }

    public function test_create(): void
    {
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->create($this->developer));
    }

    public function test_update(): void
    {
        // Staff returns false for all targets
        $this->assertFalse($this->policy->update($this->staff, $this->staff));
        $this->assertFalse($this->policy->update($this->staff, $this->admin));
        $this->assertFalse($this->policy->update($this->staff, $this->developer));

        // Developer returns true for all targets
        $this->assertTrue($this->policy->update($this->developer, $this->staff));
        $this->assertTrue($this->policy->update($this->developer, $this->admin));
        $this->assertTrue($this->policy->update($this->developer, $this->developer));

        // Admin returns true for Staff, false for other Admins and Developers
        $this->assertTrue($this->policy->update($this->admin, $this->staff));

        $otherAdmin = new User(['role' => 'administrator']);
        $otherAdmin->id = 4;
        $this->assertFalse($this->policy->update($this->admin, $otherAdmin));
        $this->assertFalse($this->policy->update($this->admin, $this->developer));
    }

    public function test_delete(): void
    {
        // Denies self-deletion for all roles
        $this->assertFalse($this->policy->delete($this->staff, $this->staff));
        $this->assertFalse($this->policy->delete($this->admin, $this->admin));
        $this->assertFalse($this->policy->delete($this->developer, $this->developer));

        // Developer returns true for others
        $this->assertTrue($this->policy->delete($this->developer, $this->staff));
        $this->assertTrue($this->policy->delete($this->developer, $this->admin));

        $otherDeveloper = new User(['role' => 'developer']);
        $otherDeveloper->id = 5;
        $this->assertTrue($this->policy->delete($this->developer, $otherDeveloper));

        // Admin returns true for Staff, false for other Admins and Developers
        $this->assertTrue($this->policy->delete($this->admin, $this->staff));

        $otherAdmin = new User(['role' => 'administrator']);
        $otherAdmin->id = 4;
        $this->assertFalse($this->policy->delete($this->admin, $otherAdmin));
        $this->assertFalse($this->policy->delete($this->admin, $this->developer));

        // Staff returns false for all targets
        $otherStaff = new User(['role' => 'user']);
        $otherStaff->id = 6;
        $this->assertFalse($this->policy->delete($this->staff, $otherStaff));
        $this->assertFalse($this->policy->delete($this->staff, $this->admin));
        $this->assertFalse($this->policy->delete($this->staff, $this->developer));
    }

    public function test_impersonate(): void
    {
        $this->assertFalse($this->policy->impersonate($this->staff));
        $this->assertFalse($this->policy->impersonate($this->admin));
        $this->assertTrue($this->policy->impersonate($this->developer));
    }
}
