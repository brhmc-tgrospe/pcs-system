<?php

namespace Tests\Unit\Policies;

use App\Models\Item;
use App\Models\User;
use App\Policies\ItemPolicy;
use Tests\TestCase;

class ItemPolicyTest extends TestCase
{
    private ItemPolicy $policy;

    private User $developer;

    private User $superadmin;

    private User $admin;

    private User $staff;

    private Item $item;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new ItemPolicy;
        $this->developer = new User(['role' => 'developer']);
        $this->superadmin = new User(['role' => 'superadmin']);
        $this->admin = new User(['role' => 'administrator']);
        $this->staff = new User(['role' => 'user']);
        $this->item = new Item;
    }

    public function test_all_authenticated_users_can_view_items(): void
    {
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->superadmin));
        $this->assertTrue($this->policy->viewAny($this->developer));

        $this->assertTrue($this->policy->view($this->staff, $this->item));
        $this->assertTrue($this->policy->view($this->admin, $this->item));
        $this->assertTrue($this->policy->view($this->superadmin, $this->item));
        $this->assertTrue($this->policy->view($this->developer, $this->item));
    }

    public function test_staff_cannot_create_update_or_delete_items(): void
    {
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->update($this->staff, $this->item));
        $this->assertFalse($this->policy->delete($this->staff, $this->item));
        $this->assertFalse($this->policy->deleteAny($this->staff));
        $this->assertFalse($this->policy->restore($this->staff, $this->item));
        $this->assertFalse($this->policy->restoreAny($this->staff));
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->item));
        $this->assertFalse($this->policy->forceDeleteAny($this->staff));
    }

    public function test_admin_can_manage_items_but_cannot_force_delete(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->update($this->admin, $this->item));
        $this->assertTrue($this->policy->delete($this->admin, $this->item));
        $this->assertTrue($this->policy->deleteAny($this->admin));
        $this->assertTrue($this->policy->restore($this->admin, $this->item));
        $this->assertTrue($this->policy->restoreAny($this->admin));
        $this->assertFalse($this->policy->forceDelete($this->admin, $this->item));
        $this->assertFalse($this->policy->forceDeleteAny($this->admin));
    }

    public function test_superadmin_can_manage_items_and_force_delete(): void
    {
        $this->assertTrue($this->policy->create($this->superadmin));
        $this->assertTrue($this->policy->update($this->superadmin, $this->item));
        $this->assertTrue($this->policy->delete($this->superadmin, $this->item));
        $this->assertTrue($this->policy->deleteAny($this->superadmin));
        $this->assertTrue($this->policy->restore($this->superadmin, $this->item));
        $this->assertTrue($this->policy->restoreAny($this->superadmin));
        $this->assertTrue($this->policy->forceDelete($this->superadmin, $this->item));
        $this->assertTrue($this->policy->forceDeleteAny($this->superadmin));
    }

    public function test_developer_can_perform_all_actions_including_force_delete(): void
    {
        $this->assertTrue($this->policy->create($this->developer));
        $this->assertTrue($this->policy->update($this->developer, $this->item));
        $this->assertTrue($this->policy->delete($this->developer, $this->item));
        $this->assertTrue($this->policy->deleteAny($this->developer));
        $this->assertTrue($this->policy->restore($this->developer, $this->item));
        $this->assertTrue($this->policy->restoreAny($this->developer));
        $this->assertTrue($this->policy->forceDelete($this->developer, $this->item));
        $this->assertTrue($this->policy->forceDeleteAny($this->developer));
    }
}
