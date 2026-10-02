<?php

namespace Tests\Unit\Models;

use App\Models\User;
use Tests\TestCase;

class UserRoleTest extends TestCase
{
    public function test_user_role_helpers_identify_roles_correctly(): void
    {
        $dev = new User(['role' => 'developer']);
        $admin = new User(['role' => 'administrator']);
        $staff = new User(['role' => 'user']);

        $this->assertTrue($dev->isDeveloper());
        $this->assertFalse($dev->isAdmin());
        $this->assertFalse($dev->isStaff());

        $this->assertFalse($admin->isDeveloper());
        $this->assertTrue($admin->isAdmin());
        $this->assertFalse($admin->isStaff());

        $this->assertFalse($staff->isDeveloper());
        $this->assertFalse($staff->isAdmin());
        $this->assertTrue($staff->isStaff());
    }
}
