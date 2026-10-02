<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InertiaCapabilitiesTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_receives_correct_capability_map(): void
    {
        $staff = User::factory()->create(['role' => 'user']);

        $this->actingAs($staff)
            ->get('/catalog')
            ->assertInertia(fn (Assert $page) => $page
                ->has('auth.user.can')
                ->where('auth.user.can.manage_items', false)
                ->where('auth.user.can.force_delete', false)
                ->where('auth.user.can.manage_users', false)
                ->where('auth.user.can.impersonate', false)
            );
    }

    public function test_admin_receives_correct_capability_map(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);

        $this->actingAs($admin)
            ->get('/catalog')
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.can.manage_items', true)
                ->where('auth.user.can.force_delete', false)
                ->where('auth.user.can.manage_users', true)
                ->where('auth.user.can.impersonate', false)
            );
    }

    public function test_developer_receives_all_true_capabilities(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);

        $this->actingAs($dev)
            ->get('/catalog')
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.can.manage_items', true)
                ->where('auth.user.can.force_delete', true)
                ->where('auth.user.can.manage_users', true)
                ->where('auth.user.can.impersonate', true)
            );
    }
}
