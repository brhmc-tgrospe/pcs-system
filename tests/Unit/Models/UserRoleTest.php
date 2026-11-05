<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Tests\TestCase;

class UserRoleTest extends TestCase
{
    public function test_user_role_helpers_identify_roles_correctly(): void
    {
        $dev = new User(['role' => 'developer']);
        $superadmin = new User(['role' => 'superadmin']);
        $admin = new User(['role' => 'administrator']);
        $staff = new User(['role' => 'user']);

        $this->assertTrue($dev->isDeveloper());
        $this->assertFalse($dev->isSuperAdmin());
        $this->assertFalse($dev->isAdmin());
        $this->assertFalse($dev->isStaff());

        $this->assertFalse($superadmin->isDeveloper());
        $this->assertTrue($superadmin->isSuperAdmin());
        $this->assertFalse($superadmin->isAdmin());
        $this->assertFalse($superadmin->isStaff());

        $this->assertFalse($admin->isDeveloper());
        $this->assertFalse($admin->isSuperAdmin());
        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isStaff());

        $this->assertFalse($staff->isDeveloper());
        $this->assertFalse($staff->isSuperAdmin());
        $this->assertFalse($staff->isAdmin());
        $this->assertTrue($staff->isStaff());
    }

    public function test_is_administrative_identifies_administrative_roles(): void
    {
        $superadmin = new User(['role' => 'superadmin']);
        $admin = new User(['role' => 'administrator']);
        $dev = new User(['role' => 'developer']);
        $staff = new User(['role' => 'user']);

        $this->assertTrue($superadmin->isAdministrative());
        $this->assertTrue($admin->isAdministrative());
        $this->assertFalse($dev->isAdministrative());
        $this->assertFalse($staff->isAdministrative());
    }

    public function test_user_factory_super_admin_state(): void
    {
        $user = User::factory()->superAdmin()->make();

        $this->assertSame('superadmin', $user->role);
        $this->assertTrue($user->isSuperAdmin());
        $this->assertTrue($user->isAdministrative());
    }
}
