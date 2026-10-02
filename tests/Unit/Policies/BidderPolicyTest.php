<?php

namespace Tests\Unit\Policies;

use App\Models\Bidder;
use App\Models\User;
use App\Policies\BidderPolicy;
use Tests\TestCase;

class BidderPolicyTest extends TestCase
{
    private BidderPolicy $policy;

    private User $developer;

    private User $admin;

    private User $staff;

    private Bidder $bidder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new BidderPolicy;
        $this->developer = new User(['role' => 'developer']);
        $this->admin = new User(['role' => 'administrator']);
        $this->staff = new User(['role' => 'user']);
        $this->bidder = new Bidder;
    }

    public function test_all_can_view_bidders(): void
    {
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->developer));

        $this->assertTrue($this->policy->view($this->staff, $this->bidder));
        $this->assertTrue($this->policy->view($this->admin, $this->bidder));
        $this->assertTrue($this->policy->view($this->developer, $this->bidder));
    }

    public function test_staff_cannot_create_or_modify_bidders(): void
    {
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->update($this->staff, $this->bidder));
        $this->assertFalse($this->policy->delete($this->staff, $this->bidder));
        $this->assertFalse($this->policy->restore($this->staff, $this->bidder));
    }

    public function test_admin_and_developer_can_create_and_update_bidders(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->update($this->admin, $this->bidder));
        $this->assertTrue($this->policy->delete($this->admin, $this->bidder));
        $this->assertTrue($this->policy->restore($this->admin, $this->bidder));

        $this->assertTrue($this->policy->create($this->developer));
        $this->assertTrue($this->policy->update($this->developer, $this->bidder));
        $this->assertTrue($this->policy->delete($this->developer, $this->bidder));
        $this->assertTrue($this->policy->restore($this->developer, $this->bidder));
    }
}
