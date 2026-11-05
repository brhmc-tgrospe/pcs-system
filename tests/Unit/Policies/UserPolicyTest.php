<?php

namespace Tests\Unit\Policies;

use App\Models\User;
use App\Policies\UserPolicy;
use Tests\TestCase;

class UserPolicyTest extends TestCase
{
    private UserPolicy $policy;

    private User $developer;

    private User $superadmin;

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

        $this->superadmin = new User(['role' => 'superadmin']);
        $this->superadmin->id = 7;
    }

    public function test_view_any(): void
    {
        $this->assertFalse($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->superadmin));
        $this->assertTrue($this->policy->viewAny($this->developer));
    }

    public function test_create(): void
    {
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->create($this->superadmin));
        $this->assertTrue($this->policy->create($this->developer));
    }

    public function test_update(): void
    {
        $otherSuperadmin = new User(['role' => 'superadmin']);
        $otherSuperadmin->id = 8;

        $otherAdmin = new User(['role' => 'administrator']);
        $otherAdmin->id = 4;

        // Staff returns false for all targets
        $this->assertFalse($this->policy->update($this->staff, $this->staff));
        $this->assertFalse($this->policy->update($this->staff, $this->admin));
        $this->assertFalse($this->policy->update($this->staff, $this->superadmin));
        $this->assertFalse($this->policy->update($this->staff, $this->developer));

        // Developer returns true for all targets
        $this->assertTrue($this->policy->update($this->developer, $this->staff));
        $this->assertTrue($this->policy->update($this->developer, $this->admin));
        $this->assertTrue($this->policy->update($this->developer, $this->superadmin));
        $this->assertTrue($this->policy->update($this->developer, $this->developer));

        // Superadmin returns true for Staff and Admin, false for other Superadmins and Developers
        $this->assertTrue($this->policy->update($this->superadmin, $this->staff));
        $this->assertTrue($this->policy->update($this->superadmin, $this->admin));
        $this->assertFalse($this->policy->update($this->superadmin, $otherSuperadmin));
        $this->assertFalse($this->policy->update($this->superadmin, $this->developer));

        // Admin returns true for Staff, false for other Admins, Superadmins, and Developers
        $this->assertTrue($this->policy->update($this->admin, $this->staff));
        $this->assertFalse($this->policy->update($this->admin, $otherAdmin));
        $this->assertFalse($this->policy->update($this->admin, $this->superadmin));
        $this->assertFalse($this->policy->update($this->admin, $this->developer));
    }

    public function test_delete(): void
    {
        $otherSuperadmin = new User(['role' => 'superadmin']);
        $otherSuperadmin->id = 8;

        $otherDeveloper = new User(['role' => 'developer']);
        $otherDeveloper->id = 5;

        $otherAdmin = new User(['role' => 'administrator']);
        $otherAdmin->id = 4;

        $otherStaff = new User(['role' => 'user']);
        $otherStaff->id = 6;

        // Denies self-deletion for all roles
        $this->assertFalse($this->policy->delete($this->staff, $this->staff));
        $this->assertFalse($this->policy->delete($this->admin, $this->admin));
        $this->assertFalse($this->policy->delete($this->superadmin, $this->superadmin));
        $this->assertFalse($this->policy->delete($this->developer, $this->developer));

        // Developer returns true for others
        $this->assertTrue($this->policy->delete($this->developer, $this->staff));
        $this->assertTrue($this->policy->delete($this->developer, $this->admin));
        $this->assertTrue($this->policy->delete($this->developer, $this->superadmin));
        $this->assertTrue($this->policy->delete($this->developer, $otherDeveloper));

        // Superadmin returns true for Staff and Admin, false for other Superadmins and Developers
        $this->assertTrue($this->policy->delete($this->superadmin, $this->staff));
        $this->assertTrue($this->policy->delete($this->superadmin, $this->admin));
        $this->assertFalse($this->policy->delete($this->superadmin, $otherSuperadmin));
        $this->assertFalse($this->policy->delete($this->superadmin, $this->developer));

        // Admin returns true for Staff, false for other Admins, Superadmins, and Developers
        $this->assertTrue($this->policy->delete($this->admin, $this->staff));
        $this->assertFalse($this->policy->delete($this->admin, $otherAdmin));
        $this->assertFalse($this->policy->delete($this->admin, $this->superadmin));
        $this->assertFalse($this->policy->delete($this->admin, $this->developer));

        // Staff returns false for all targets
        $this->assertFalse($this->policy->delete($this->staff, $otherStaff));
        $this->assertFalse($this->policy->delete($this->staff, $this->admin));
        $this->assertFalse($this->policy->delete($this->staff, $this->superadmin));
        $this->assertFalse($this->policy->delete($this->staff, $this->developer));
    }

    public function test_impersonate(): void
    {
        $this->assertFalse($this->policy->impersonate($this->staff));
        $this->assertFalse($this->policy->impersonate($this->admin));
        $this->assertFalse($this->policy->impersonate($this->superadmin));
        $this->assertTrue($this->policy->impersonate($this->developer));
    }
}
