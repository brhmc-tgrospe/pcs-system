<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
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

    public function test_superadmin_can_access_users_management(): void
    {
        $superadmin = User::factory()->superAdmin()->create();

        $response = $this->actingAs($superadmin)->get('/users');
        $response->assertStatus(200);
    }

    public function test_superadmin_receives_user_list_where_developer_accounts_are_filtered_out(): void
    {
        $superadmin = User::factory()->superAdmin()->create();
        $developer = User::factory()->create(['role' => 'developer']);
        $admin = User::factory()->create(['role' => 'administrator']);
        $staff = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($superadmin)->get('/users');

        $response->assertInertia(fn (Assert $page) => $page
            ->component('ManageUsers')
            ->has('users', 3)
            ->where('users', fn ($users) => collect($users)->every(fn ($u) => $u['role'] !== 'developer'))
        );
    }

    public function test_superadmin_can_create_administrator_and_staff_users(): void
    {
        $superadmin = User::factory()->superAdmin()->create();

        $adminData = [
            'username' => 'new_admin_user',
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'new_admin@example.com',
            'password' => 'secret123',
            'role' => 'administrator',
        ];

        $responseAdmin = $this->actingAs($superadmin)->post('/users', $adminData);
        $responseAdmin->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'username' => 'new_admin_user',
            'role' => 'administrator',
        ]);

        $staffData = [
            'username' => 'new_staff_user',
            'first_name' => 'Staff',
            'last_name' => 'User',
            'email' => 'new_staff@example.com',
            'password' => 'secret123',
            'role' => 'user',
        ];

        $responseStaff = $this->actingAs($superadmin)->post('/users', $staffData);
        $responseStaff->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'username' => 'new_staff_user',
            'role' => 'user',
        ]);
    }

    public function test_superadmin_cannot_create_superadmin_or_developer(): void
    {
        $superadmin = User::factory()->superAdmin()->create();

        $superadminData = [
            'username' => 'another_superadmin',
            'first_name' => 'Another',
            'last_name' => 'Superadmin',
            'email' => 'super2@example.com',
            'password' => 'secret123',
            'role' => 'superadmin',
        ];

        $responseSuper = $this->actingAs($superadmin)->post('/users', $superadminData);
        $responseSuper->assertSessionHas('error');
        $this->assertDatabaseMissing('users', ['username' => 'another_superadmin']);

        $developerData = [
            'username' => 'another_developer',
            'first_name' => 'Another',
            'last_name' => 'Developer',
            'email' => 'dev2@example.com',
            'password' => 'secret123',
            'role' => 'developer',
        ];

        $responseDev = $this->actingAs($superadmin)->post('/users', $developerData);
        $responseDev->assertSessionHas('error');
        $this->assertDatabaseMissing('users', ['username' => 'another_developer']);
    }

    public function test_superadmin_can_edit_and_delete_administrator(): void
    {
        $superadmin = User::factory()->superAdmin()->create();
        $admin = User::factory()->create([
            'role' => 'administrator',
            'first_name' => 'Before',
        ]);

        $updateResponse = $this->actingAs($superadmin)->put("/users/{$admin->id}", [
            'username' => $admin->username,
            'first_name' => 'After',
            'last_name' => $admin->last_name,
            'email' => $admin->email,
            'role' => 'administrator',
        ]);

        $updateResponse->assertSessionHas('success');
        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'first_name' => 'After',
        ]);

        $deleteResponse = $this->actingAs($superadmin)->delete("/users/{$admin->id}");
        $deleteResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('users', ['id' => $admin->id]);
    }

    public function test_superadmin_cannot_edit_or_delete_another_superadmin_or_developer(): void
    {
        $superadmin1 = User::factory()->superAdmin()->create();
        $superadmin2 = User::factory()->superAdmin()->create(['first_name' => 'InitialSuper']);
        $dev = User::factory()->create(['role' => 'developer', 'first_name' => 'InitialDev']);

        // Cannot edit another superadmin
        $editSuper = $this->actingAs($superadmin1)->put("/users/{$superadmin2->id}", [
            'username' => $superadmin2->username,
            'first_name' => 'HackedSuper',
            'last_name' => $superadmin2->last_name,
            'email' => $superadmin2->email,
            'role' => 'administrator',
        ]);
        $editSuper->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $superadmin2->id, 'first_name' => 'InitialSuper']);

        // Cannot edit developer
        $editDev = $this->actingAs($superadmin1)->put("/users/{$dev->id}", [
            'username' => $dev->username,
            'first_name' => 'HackedDev',
            'last_name' => $dev->last_name,
            'email' => $dev->email,
            'role' => 'administrator',
        ]);
        $editDev->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $dev->id, 'first_name' => 'InitialDev']);

        // Cannot delete another superadmin
        $delSuper = $this->actingAs($superadmin1)->delete("/users/{$superadmin2->id}");
        $delSuper->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $superadmin2->id]);

        // Cannot delete developer
        $delDev = $this->actingAs($superadmin1)->delete("/users/{$dev->id}");
        $delDev->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $dev->id]);
    }

    public function test_superadmin_cannot_impersonate_another_user(): void
    {
        $superadmin = User::factory()->superAdmin()->create();
        $staff = User::factory()->create(['role' => 'user']);

        $this->actingAs($superadmin)->post("/impersonate/{$staff->id}")
            ->assertStatus(403);
    }

    public function test_administrator_cannot_create_administrator_account(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);

        $response = $this->actingAs($admin)->post('/users', [
            'username' => 'attempted_admin',
            'first_name' => 'Attempted',
            'last_name' => 'Admin',
            'email' => 'attempted_admin@example.com',
            'password' => 'secret123',
            'role' => 'administrator',
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('users', ['username' => 'attempted_admin']);
    }

    public function test_administrator_cannot_edit_another_admin_superadmin_or_developer(): void
    {
        $admin1 = User::factory()->create(['role' => 'administrator']);
        $admin2 = User::factory()->create(['role' => 'administrator']);
        $superadmin = User::factory()->superAdmin()->create();
        $dev = User::factory()->create(['role' => 'developer']);

        $responseAdmin = $this->actingAs($admin1)->put("/users/{$admin2->id}", [
            'username' => 'updated_admin',
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'role' => 'user',
        ]);
        $responseAdmin->assertSessionHas('error');

        $responseSuper = $this->actingAs($admin1)->put("/users/{$superadmin->id}", [
            'username' => 'updated_super',
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'super@example.com',
            'role' => 'user',
        ]);
        $responseSuper->assertSessionHas('error');

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

    public function test_index_passes_can_edit_can_delete_and_assignable_roles_in_props(): void
    {
        $superadmin = User::factory()->superAdmin()->create(['username' => 'super_alice']);
        $admin = User::factory()->create(['role' => 'administrator', 'username' => 'admin_bob']);
        $staff = User::factory()->create(['role' => 'user', 'username' => 'staff_charlie']);
        $dev = User::factory()->create(['role' => 'developer', 'username' => 'dev_dave']);

        // 1. Superadmin checks
        $this->actingAs($superadmin)->get('/users')
            ->assertInertia(fn (Assert $page) => $page
                ->component('ManageUsers')
                ->where('assignable_roles', ['user', 'administrator'])
                ->has('users', 3)
                ->where('users', function ($users) use ($admin, $superadmin, $staff) {
                    $adminProp = collect($users)->firstWhere('id', $admin->id);
                    $superProp = collect($users)->firstWhere('id', $superadmin->id);
                    $staffProp = collect($users)->firstWhere('id', $staff->id);

                    return $adminProp['can_edit'] === true
                        && $adminProp['can_delete'] === true
                        && $superProp['can_edit'] === false
                        && $superProp['can_delete'] === false // cannot delete self
                        && $staffProp['can_edit'] === true
                        && $staffProp['can_delete'] === true;
                })
            );

        // 2. Admin checks
        $this->actingAs($admin)->get('/users')
            ->assertInertia(fn (Assert $page) => $page
                ->component('ManageUsers')
                ->where('assignable_roles', ['user'])
                ->where('users', function ($users) use ($admin, $superadmin, $staff) {
                    $adminProp = collect($users)->firstWhere('id', $admin->id);
                    $superProp = collect($users)->firstWhere('id', $superadmin->id);
                    $staffProp = collect($users)->firstWhere('id', $staff->id);

                    return $adminProp['can_edit'] === false
                        && $adminProp['can_delete'] === false
                        && $superProp['can_edit'] === false
                        && $superProp['can_delete'] === false
                        && $staffProp['can_edit'] === true
                        && $staffProp['can_delete'] === true;
                })
            );

        // 3. Developer checks
        $this->actingAs($dev)->get('/users')
            ->assertInertia(fn (Assert $page) => $page
                ->component('ManageUsers')
                ->where('assignable_roles', ['user', 'administrator', 'superadmin', 'developer'])
                ->where('users', function ($users) use ($admin, $superadmin) {
                    $adminProp = collect($users)->firstWhere('id', $admin->id);
                    $superProp = collect($users)->firstWhere('id', $superadmin->id);

                    return $adminProp['can_edit'] === true
                        && $adminProp['can_delete'] === true
                        && $superProp['can_edit'] === true
                        && $superProp['can_delete'] === true;
                })
            );
    }
}
