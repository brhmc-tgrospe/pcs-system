<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_cannot_view_user_management(): void
    {
        $staff = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($staff)->get('/users');
        $response->assertStatus(403);
    }

    public function test_admin_can_view_user_management(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);

        $response = $this->actingAs($admin)->get('/users');
        $response->assertStatus(200);
    }

    public function test_admin_cannot_edit_another_admin_or_developer(): void
    {
        $admin1 = User::factory()->create(['role' => 'administrator']);
        $admin2 = User::factory()->create(['role' => 'administrator']);
        $dev = User::factory()->create(['role' => 'developer']);

        $response = $this->actingAs($admin1)->put("/users/{$admin2->id}", [
            'username' => 'updated_admin',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'role' => 'user',
        ]);
        $response->assertSessionHas('error');

        $responseDev = $this->actingAs($admin1)->put("/users/{$dev->id}", [
            'username' => 'updated_dev',
            'first_name' => 'Dev',
            'last_name' => 'User',
            'email' => 'dev@example.com',
            'role' => 'user',
        ]);
        $responseDev->assertSessionHas('error');
    }

    public function test_developer_can_impersonate_but_admin_cannot(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);
        $admin = User::factory()->create(['role' => 'administrator']);
        $staff = User::factory()->create(['role' => 'user']);

        $this->actingAs($admin)->post("/impersonate/{$staff->id}")
            ->assertStatus(403);

        $this->actingAs($dev)->post("/impersonate/{$staff->id}")
            ->assertRedirect(route('catalog'));
    }
}
