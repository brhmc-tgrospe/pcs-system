<?php

namespace Tests\Unit\Policies;

use App\Models\User;
use App\Policies\SignatoryPolicy;
use Tests\TestCase;

class SignatoryPolicyTest extends TestCase
{
    private SignatoryPolicy $policy;

    private User $developer;

    private User $superadmin;

    private User $admin;

    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new SignatoryPolicy;
        $this->developer = new User(['role' => 'developer']);
        $this->superadmin = new User(['role' => 'superadmin']);
        $this->admin = new User(['role' => 'administrator']);
        $this->staff = new User(['role' => 'user']);
    }

    public function test_staff_cannot_manage_signatories(): void
    {
        $this->assertFalse($this->policy->viewAny($this->staff));
        $this->assertFalse($this->policy->manage($this->staff));
    }

    public function test_admin_and_developer_can_manage_signatories(): void
    {
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->manage($this->admin));
        $this->assertTrue($this->policy->viewAny($this->developer));
        $this->assertTrue($this->policy->manage($this->developer));
    }

    public function test_superadmin_can_manage_signatories(): void
    {
        $this->assertTrue($this->policy->viewAny($this->superadmin));
        $this->assertTrue($this->policy->manage($this->superadmin));
    }
}
