# RBAC Policy Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a 3-tier Role-Based Access Control (RBAC) architecture cleanly separating Developer, Administrator, and Staff (`user`) across BRHMC - PCS using native Laravel Policies, Gates, and Inertia capability sharing.

**Architecture:** Domain authorization logic is encapsulated in dedicated Laravel Policy classes (`ItemPolicy`, `CategoryPolicy`, `BidderPolicy`, `UserPolicy`, `SignatoryPolicy`, `ActivityLogPolicy`) alongside `User` model role helper methods. Global permissions are shared to the Inertia frontend via `HandleInertiaRequests` in an `auth.user.can` boolean map, replacing brittle hardcoded role strings across controllers and UI components.

**Tech Stack:** PHP 8.2+, Laravel 11, Inertia.js (React / TypeScript), Tailwind CSS, PHPUnit.

---

### Task 1: User Model Role Helper Methods & Unit Tests

**Files:**
- Modify: `app/Models/User.php:26-36`
- Test: `tests/Unit/Models/UserRoleTest.php`

**Step 1: Write the failing unit test**

Create `tests/Unit/Models/UserRoleTest.php`:
```php
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
```

**Step 2: Run test to verify it fails**

Run: `php artisan test --filter=UserRoleTest`  
Expected: FAIL (`Call to undefined method App\Models\User::isDeveloper()`)

**Step 3: Write minimal implementation**

In `app/Models/User.php`, add:
```php
    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'administrator';
    }

    public function isStaff(): bool
    {
        return $this->role === 'user';
    }
```

**Step 4: Run test to verify it passes**

Run: `php artisan test --filter=UserRoleTest`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/Models/User.php tests/Unit/Models/UserRoleTest.php
git commit -m "feat(auth): add role helper methods to User model with unit tests"
```

---

### Task 2: Item & Category Resource Policies

**Files:**
- Create: `app/Policies/ItemPolicy.php`
- Create: `app/Policies/CategoryPolicy.php`
- Test: `tests/Unit/Policies/ItemPolicyTest.php`

**Step 1: Write the failing policy unit test**

Create `tests/Unit/Policies/ItemPolicyTest.php`:
```php
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
    private User $admin;
    private User $staff;
    private Item $item;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new ItemPolicy();
        $this->developer = new User(['role' => 'developer']);
        $this->admin = new User(['role' => 'administrator']);
        $this->staff = new User(['role' => 'user']);
        $this->item = new Item();
    }

    public function test_all_authenticated_users_can_view_items(): void
    {
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->developer));

        $this->assertTrue($this->policy->view($this->staff, $this->item));
        $this->assertTrue($this->policy->view($this->admin, $this->item));
        $this->assertTrue($this->policy->view($this->developer, $this->item));
    }

    public function test_staff_cannot_create_update_or_delete_items(): void
    {
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->update($this->staff, $this->item));
        $this->assertFalse($this->policy->delete($this->staff, $this->item));
        $this->assertFalse($this->policy->restore($this->staff, $this->item));
        $this->assertFalse($this->policy->forceDelete($this->staff, $this->item));
    }

    public function test_admin_can_manage_items_but_cannot_force_delete(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->update($this->admin, $this->item));
        $this->assertTrue($this->policy->delete($this->admin, $this->item));
        $this->assertTrue($this->policy->restore($this->admin, $this->item));
        $this->assertFalse($this->policy->forceDelete($this->admin, $this->item));
        $this->assertFalse($this->policy->forceDeleteAny($this->admin));
    }

    public function test_developer_can_perform_all_actions_including_force_delete(): void
    {
        $this->assertTrue($this->policy->create($this->developer));
        $this->assertTrue($this->policy->update($this->developer, $this->item));
        $this->assertTrue($this->policy->delete($this->developer, $this->item));
        $this->assertTrue($this->policy->restore($this->developer, $this->item));
        $this->assertTrue($this->policy->forceDelete($this->developer, $this->item));
        $this->assertTrue($this->policy->forceDeleteAny($this->developer));
    }
}
```

**Step 2: Run test to verify it fails**

Run: `php artisan test --filter=ItemPolicyTest`  
Expected: FAIL (`Class "App\Policies\ItemPolicy" not found`)

**Step 3: Write minimal implementation**

Create `app/Policies/ItemPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\Item;
use App\Models\User;

class ItemPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Item $item): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function update(User $user, Item $item): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function delete(User $user, Item $item): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function restore(User $user, Item $item): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function forceDelete(User $user, Item $item): bool
    {
        return $user->isDeveloper();
    }

    public function forceDeleteAny(User $user): bool
    {
        return $user->isDeveloper();
    }
}
```

Create `app/Policies/CategoryPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Category $category): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function update(User $user, Category $category): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function delete(User $user, Category $category): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function restore(User $user, Category $category): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return $user->isDeveloper();
    }

    public function forceDeleteAny(User $user): bool
    {
        return $user->isDeveloper();
    }
}
```

**Step 4: Run test to verify it passes**

Run: `php artisan test --filter=ItemPolicyTest`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/Policies/ItemPolicy.php app/Policies/CategoryPolicy.php tests/Unit/Policies/ItemPolicyTest.php
git commit -m "feat(auth): create ItemPolicy and CategoryPolicy with unit tests"
```

---

### Task 3: Bidder, Signatory & ActivityLog Policies

**Files:**
- Create: `app/Policies/BidderPolicy.php`
- Create: `app/Policies/SignatoryPolicy.php`
- Create: `app/Policies/ActivityLogPolicy.php`
- Test: `tests/Unit/Policies/BidderPolicyTest.php`

**Step 1: Write the failing policy unit test**

Create `tests/Unit/Policies/BidderPolicyTest.php`:
```php
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
        $this->policy = new BidderPolicy();
        $this->developer = new User(['role' => 'developer']);
        $this->admin = new User(['role' => 'administrator']);
        $this->staff = new User(['role' => 'user']);
        $this->bidder = new Bidder();
    }

    public function test_all_can_view_bidders(): void
    {
        $this->assertTrue($this->policy->viewAny($this->staff));
        $this->assertTrue($this->policy->viewAny($this->admin));
        $this->assertTrue($this->policy->viewAny($this->developer));
    }

    public function test_staff_cannot_create_or_modify_bidders(): void
    {
        $this->assertFalse($this->policy->create($this->staff));
        $this->assertFalse($this->policy->update($this->staff, $this->bidder));
        $this->assertFalse($this->policy->delete($this->staff, $this->bidder));
    }

    public function test_admin_and_developer_can_create_and_update_bidders(): void
    {
        $this->assertTrue($this->policy->create($this->admin));
        $this->assertTrue($this->policy->update($this->admin, $this->bidder));
        $this->assertTrue($this->policy->create($this->developer));
        $this->assertTrue($this->policy->update($this->developer, $this->bidder));
    }
}
```

**Step 2: Run test to verify it fails**

Run: `php artisan test --filter=BidderPolicyTest`  
Expected: FAIL (`Class "App\Policies\BidderPolicy" not found`)

**Step 3: Write minimal implementation**

Create `app/Policies/BidderPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\Bidder;
use App\Models\User;

class BidderPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Bidder $bidder): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function update(User $user, Bidder $bidder): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function delete(User $user, Bidder $bidder): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function restore(User $user, Bidder $bidder): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }
}
```

Create `app/Policies/SignatoryPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\User;

class SignatoryPolicy
{
    public function manage(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }
}
```

Create `app/Policies/ActivityLogPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\User;

class ActivityLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->isDeveloper();
    }

    public function prune(User $user): bool
    {
        return $user->isDeveloper();
    }
}
```

**Step 4: Run test to verify it passes**

Run: `php artisan test --filter=BidderPolicyTest`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/Policies/BidderPolicy.php app/Policies/SignatoryPolicy.php app/Policies/ActivityLogPolicy.php tests/Unit/Policies/BidderPolicyTest.php
git commit -m "feat(auth): create Bidder, Signatory, and ActivityLog policies"
```

---

### Task 4: User Policy & Controller Authorization

**Files:**
- Create: `app/Policies/UserPolicy.php`
- Modify: `app/Http/Controllers/UserController.php`
- Test: `tests/Feature/UserAuthorizationTest.php`

**Step 1: Write the failing feature test**

Create `tests/Feature/UserAuthorizationTest.php`:
```php
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
```

**Step 2: Run test to verify it fails**

Run: `php artisan test --filter=UserAuthorizationTest`  
Expected: Check current output.

**Step 3: Create UserPolicy & Refactor UserController**

Create `app/Policies/UserPolicy.php`:
```php
<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $authUser): bool
    {
        return $authUser->isAdmin() || $authUser->isDeveloper();
    }

    public function create(User $authUser): bool
    {
        return $authUser->isAdmin() || $authUser->isDeveloper();
    }

    public function update(User $authUser, User $targetUser): bool
    {
        if ($authUser->isDeveloper()) {
            return true;
        }

        if ($authUser->isAdmin()) {
            // Admins can only manage Staff accounts
            return $targetUser->isStaff();
        }

        return false;
    }

    public function delete(User $authUser, User $targetUser): bool
    {
        if ($authUser->id === $targetUser->id) {
            return false; // Prevent self-deletion
        }

        if ($authUser->isDeveloper()) {
            return true;
        }

        if ($authUser->isAdmin()) {
            return $targetUser->isStaff();
        }

        return false;
    }

    public function impersonate(User $authUser): bool
    {
        return $authUser->isDeveloper();
    }
}
```

In `app/Http/Controllers/UserController.php`:
Call `$this->authorize('viewAny', User::class)` in `index()`, `$this->authorize('create', User::class)` in `store()`, `$this->authorize('update', $user)` in `update()`, and `$this->authorize('delete', $user)` in `destroy()`.

**Step 4: Run test to verify it passes**

Run: `php artisan test --filter=UserAuthorizationTest`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/Policies/UserPolicy.php app/Http/Controllers/UserController.php tests/Feature/UserAuthorizationTest.php
git commit -m "feat(auth): implement UserPolicy and authorize actions in UserController"
```

---

### Task 5: Controller & Route Policy Enforcement for Items & Categories

**Files:**
- Modify: `app/Http/Controllers/ItemController.php`
- Modify: `app/Http/Controllers/CategoryController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/ItemAuthorizationTest.php`

**Step 1: Write the failing feature test**

Create `tests/Feature/ItemAuthorizationTest.php`:
```php
<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->category = Category::create([
            'name' => 'General Supplies',
            'cat_code' => 'GEN-01',
            'description' => 'Test category'
        ]);
    }

    public function test_staff_cannot_create_items(): void
    {
        $staff = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($staff)->post('/catalog/items', [
            'name' => 'Surgical Gloves',
            'description' => 'Box of 100',
            'unit_type' => 'Box',
            'unit_cost' => 250,
            'quantity' => 10,
            'category_id' => $this->category->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_force_delete_item(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        $item = Item::create([
            'item_code' => 'ITM-001',
            'name' => 'Disposable Syringe',
            'description' => '10ml syringe',
            'unit_type' => 'Piece',
            'unit_cost' => 15,
            'quantity' => 100,
            'abc' => 1500,
            'category_id' => $this->category->id,
        ]);
        $item->delete(); // soft delete

        $response = $this->actingAs($admin)->delete("/catalog/items/{$item->id}/force");
        $response->assertStatus(403);
    }

    public function test_developer_can_force_delete_item(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);
        $item = Item::create([
            'item_code' => 'ITM-002',
            'name' => 'Saline Solution',
            'description' => '500ml',
            'unit_type' => 'Bottle',
            'unit_cost' => 50,
            'quantity' => 50,
            'abc' => 2500,
            'category_id' => $this->category->id,
        ]);
        $item->delete(); // soft delete

        $response = $this->actingAs($dev)->delete("/catalog/items/{$item->id}/force");
        $response->assertRedirect();
        $this->assertDatabaseMissing('items', ['id' => $item->id]);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `php artisan test --filter=ItemAuthorizationTest`  
Expected: FAIL (`403 != 302` on Staff or forceDelete)

**Step 3: Update ItemController & routes/web.php**

In `app/Http/Controllers/ItemController.php`:
* Add `$this->authorize('create', Item::class);` in `store()`.
* Add `$this->authorize('update', $item);` in `update()`.
* Add `$this->authorize('delete', $item);` in `destroy()`.
* Add `$this->authorize('restore', $item);` in `restore()`.
* Add `$this->authorize('forceDelete', $item);` in `forceDelete()`.
* Replace `if ($user->role !== 'developer')` with policy checks.

In `routes/web.php`:
* Update route group middleware to utilize standard gate/policy bindings:
  `Route::middleware(['can:create,App\Models\Item'])` or keep role middleware cleanly aligned with domain policies.

**Step 4: Run test to verify it passes**

Run: `php artisan test --filter=ItemAuthorizationTest`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/Http/Controllers/ItemController.php routes/web.php tests/Feature/ItemAuthorizationTest.php
git commit -m "feat(auth): enforce ItemPolicy in ItemController and routes"
```

---

### Task 6: Inertia Capabilities Sharing & TypeScript Types

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php:30-45`
- Modify: `resources/js/types.ts:8-18`
- Test: `tests/Feature/InertiaCapabilitiesTest.php`

**Step 1: Write the failing feature test**

Create `tests/Feature/InertiaCapabilitiesTest.php`:
```php
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
```

**Step 2: Run test to verify it fails**

Run: `php artisan test --filter=InertiaCapabilitiesTest`  
Expected: FAIL (`auth.user.can missing`)

**Step 3: Update HandleInertiaRequests and types.ts**

In `app/Http/Middleware/HandleInertiaRequests.php`:
Share the structured `can` capability map in `share()`:
```php
'auth' => [
    'user' => $request->user() ? [
        'id'               => $request->user()->id,
        'username'         => $request->user()->username,
        'first_name'       => $request->user()->first_name,
        'last_name'        => $request->user()->last_name,
        'full_name'        => $request->user()->full_name,
        'email'            => $request->user()->email,
        'role'             => $request->user()->role,
        'is_impersonating' => session()->has('impersonator_id'),
        'can'              => [
            'manage_items'      => $request->user()->can('create', \App\Models\Item::class),
            'force_delete'      => $request->user()->can('forceDeleteAny', \App\Models\Item::class),
            'manage_categories' => $request->user()->can('create', \App\Models\Category::class),
            'manage_bidders'    => $request->user()->can('create', \App\Models\Bidder::class),
            'manage_users'      => $request->user()->can('viewAny', \App\Models\User::class),
            'view_logs'         => $request->user()->can('viewAny', \App\Models\ActivityLog::class),
            'manage_settings'   => $request->user()->can('manage', \App\Models\Signatory::class),
            'impersonate'       => $request->user()->can('impersonate', \App\Models\User::class),
        ],
    ] : null,
],
```

In `resources/js/types.ts`:
```ts
export interface UserPermissions {
  manage_items: boolean;
  force_delete: boolean;
  manage_categories: boolean;
  manage_bidders: boolean;
  manage_users: boolean;
  view_logs: boolean;
  manage_settings: boolean;
  impersonate: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_impersonating: boolean;
  can: UserPermissions;
}
```

**Step 4: Run test to verify it passes**

Run: `php artisan test --filter=InertiaCapabilitiesTest`  
Expected: PASS

**Step 5: Commit**

```bash
git add app/Http/Middleware/HandleInertiaRequests.php resources/js/types.ts tests/Feature/InertiaCapabilitiesTest.php
git commit -m "feat(auth): share auth.user.can permissions via Inertia and update TypeScript interfaces"
```

---

### Task 7: Frontend UI Capability Integration

**Files:**
- Modify: `resources/js/Components/Sidebar.tsx:29-50`
- Modify: `resources/js/Components/ManageItems.tsx`
- Modify: `resources/js/Pages/ManageUsers.tsx`

**Step 1: Update Sidebar.tsx navigation**

Replace hardcoded `const isAdmin = user.role === 'administrator' || user.role === 'developer'` with capability flags:
```tsx
const canManageItems = user.can?.manage_items;
const canManageCategories = user.can?.manage_categories;
const canManageBidders = user.can?.manage_bidders;
const canManageUsers = user.can?.manage_users;
const canViewLogs = user.can?.view_logs;

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'catalog', label: 'Master Projects', icon: BookOpen },
  ...(canManageItems ? [{ id: 'manage_items', label: 'Manage Items', icon: Boxes }] : []),
  ...(canManageCategories ? [{ id: 'manage_categories', label: 'Categories', icon: Tags }] : []),
  ...(canManageBidders ? [{ id: 'bidders', label: 'Bidders', icon: Building, href: '/catalog/bidders' }] : []),
];

const reportItems = [
  { id: 'print_report', label: 'Print Project Report', icon: FileBarChart },
  ...(canViewLogs ? [{ id: 'activity_logs', label: 'Activity Logs', icon: Settings, href: '/activity-logs' }] : []),
  ...(canManageUsers ? [{ id: 'users', label: 'Manage Users', icon: Users, href: '/users' }] : []),
];
```

**Step 2: Update ManageItems.tsx for force delete trigger**

Guard the permanent delete button and danger modal so it is only rendered when `user.can?.force_delete` is `true`.

**Step 3: Update ManageUsers.tsx for Admin vs Developer privilege safety**

- In `ManageUsers.tsx`, when `!user.can?.impersonate`, do not display the "Impersonate" button.
- When current user is an Admin, lock the role selector to "user" / Staff, and render other Admins and Developers with disabled edit/delete actions.

**Step 4: Build assets and verify TypeScript compilation**

Run: `npm run build`  
Expected: Successful compile with 0 TypeScript or Vite build errors.

**Step 5: Commit**

```bash
git add resources/js/Components/Sidebar.tsx resources/js/Components/ManageItems.tsx resources/js/Pages/ManageUsers.tsx
git commit -m "feat(ui): bind UI elements, actions, and sidebar navigation to user.can capabilities"
```

---

### Task 8: Full Regression Test Suite Execution

**Files:**
- Test: All tests in `tests/`

**Step 1: Run complete test suite**

Run: `php artisan test`  
Expected: PASS (All Feature & Unit tests pass with 0 failures)

**Step 2: Verify git status and clean working tree**

Run: `git status`  
Expected: Clean working tree on appropriate branch.
