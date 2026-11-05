# Super Administrator Role Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the fourth role tier (`superadmin` / "Super Administrator") in the RBAC hierarchy with permanent deletion of items/categories, full CRUD over administrator accounts, strict multi-tier activity log isolation, and removal of test files upon completion as requested.

**Architecture:** Extend native Laravel Policies (`UserPolicy`, `ItemPolicy`, `CategoryPolicy`, `BidderPolicy`, `SignatoryPolicy`), add domain role helpers on `User`, enforce server-side validation in `UserController`, and adapt `ActivityLog::scopeVisibleTo` for 4-tier filtering. Cleanly wire Inertia capabilities to React UI.

**Tech Stack:** Laravel 11, PHP 8.2+, Inertia.js (React), Tailwind CSS, SQLite, PHPUnit, Pint.

---

### Task 1: Domain Model & User Factory Updates

**Files:**
- Modify: `app/Models/User.php`
- Modify: `database/factories/UserFactory.php`
- Test: `tests/Unit/Models/UserRoleTest.php`

**Step 1: Write tests for User model role helpers**
Verify `isSuperAdmin()` and `isAdministrative()` on `User`.

**Step 2: Run test to verify it fails**
Run: `php artisan test --filter=UserRoleTest`
Expected: FAIL (method `isSuperAdmin` does not exist).

**Step 3: Implement minimal code**
In `app/Models/User.php`, add:
```php
public function isSuperAdmin(): bool
{
    return $this->role === 'superadmin';
}

public function isAdministrative(): bool
{
    return $this->isAdmin() || $this->isSuperAdmin();
}
```
In `database/factories/UserFactory.php`, add `superAdmin()` state method:
```php
public function superAdmin(): static
{
    return $this->state(fn (array $attributes) => [
        'role' => 'superadmin',
    ]);
}
```

**Step 4: Run test to verify it passes**
Run: `php artisan test --filter=UserRoleTest`
Expected: PASS.

**Step 5: Commit**
`git commit -m "feat(auth): add isSuperAdmin and isAdministrative helpers on User model"`

---

### Task 2: Resource Policy Updates (Permanent Deletion & Catalog Management)

**Files:**
- Modify: `app/Policies/ItemPolicy.php`
- Modify: `app/Policies/CategoryPolicy.php`
- Modify: `app/Policies/BidderPolicy.php`
- Modify: `app/Policies/SignatoryPolicy.php`
- Test: `tests/Unit/Policies/ItemPolicyTest.php`
- Test: `tests/Unit/Policies/CategoryPolicyTest.php`

**Step 1: Write tests for Superadmin forceDelete permissions**
Verify Superadmin can `forceDelete` and `forceDeleteAny` on Item and Category, while standard Admin and Staff cannot.

**Step 2: Run tests to verify failure**
Run: `php artisan test --filter=ItemPolicyTest`
Expected: FAIL for Superadmin forceDelete.

**Step 3: Implement minimal code**
In `ItemPolicy.php` and `CategoryPolicy.php`:
Update `forceDelete` and `forceDeleteAny` to:
```php
return $user->isDeveloper() || $user->isSuperAdmin();
```
Update standard catalog CRUD (`create`, `update`, `delete`, `restore`) across `ItemPolicy`, `CategoryPolicy`, `BidderPolicy`, `SignatoryPolicy` to allow `isSuperAdmin()`.

**Step 4: Run tests to verify pass**
Run: `php artisan test --filter=ItemPolicyTest`
Run: `php artisan test --filter=CategoryPolicyTest`
Expected: PASS.

**Step 5: Commit**
`git commit -m "feat(policy): grant forceDelete and catalog management to superadmin role"`

---

### Task 3: UserPolicy Updates (Four-Tier Hierarchy)

**Files:**
- Modify: `app/Policies/UserPolicy.php`
- Test: `tests/Unit/Policies/UserPolicyTest.php`

**Step 1: Write comprehensive 4-tier UserPolicy tests**
- Superadmin can create, update, delete `administrator` and `user` (Staff).
- Superadmin CANNOT update or delete `superadmin` or `developer`.
- Administrator CANNOT update or delete `superadmin`, `developer`, or other `administrator`.
- Administrator can only update or delete `user` (Staff).
- Developer can update or delete all (except self).
- Impersonation is strictly `developer`.

**Step 2: Run test to verify failure**
Run: `php artisan test --filter=UserPolicyTest`
Expected: FAIL.

**Step 3: Implement minimal code in `app/Policies/UserPolicy.php`**
Implement the 4-tier matrix:
```php
public function viewAny(User $authUser): bool
{
    return $authUser->isAdmin() || $authUser->isSuperAdmin() || $authUser->isDeveloper();
}

public function create(User $authUser): bool
{
    return $authUser->isAdmin() || $authUser->isSuperAdmin() || $authUser->isDeveloper();
}

public function update(User $authUser, User $targetUser): bool
{
    if ($authUser->isDeveloper()) {
        return true;
    }

    if ($authUser->isSuperAdmin()) {
        return $targetUser->isAdmin() || $targetUser->isStaff();
    }

    if ($authUser->isAdmin()) {
        return $targetUser->isStaff();
    }

    return false;
}

public function delete(User $authUser, User $targetUser): bool
{
    if ($authUser->id === $targetUser->id) {
        return false;
    }

    if ($authUser->isDeveloper()) {
        return true;
    }

    if ($authUser->isSuperAdmin()) {
        return $targetUser->isAdmin() || $targetUser->isStaff();
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
```

**Step 4: Run tests to verify pass**
Run: `php artisan test --filter=UserPolicyTest`
Expected: PASS.

**Step 5: Commit**
`git commit -m "feat(policy): implement 4-tier user management permissions in UserPolicy"`

---

### Task 4: UserController Scoping, Validation & Role Assignment

**Files:**
- Modify: `app/Http/Controllers/UserController.php`
- Test: `tests/Feature/UserAuthorizationTest.php`

**Step 1: Write feature tests for UserController**
- Superadmin can create an `administrator` account.
- Superadmin CANNOT create `superadmin` or `developer` (returns validation/redirect error).
- Administrator CANNOT create `administrator` (returns validation/redirect error).
- Superadmin listing excludes Developers.
- Admin listing excludes Developers and marks Superadmins as read-only (`can_edit: false, can_delete: false`).

**Step 2: Run test to verify failure**
Run: `php artisan test --filter=UserAuthorizationTest`
Expected: FAIL.

**Step 3: Implement minimal code in `UserController.php`**
- In `index()`:
  - If `$authUser->isAdmin() || $authUser->isSuperAdmin()`, exclude developers: `$query->where('role', '!=', 'developer')`.
  - Pass `'can_edit' => $authUser->can('update', $u)` and `'can_delete' => $authUser->can('delete', $u)`.
  - Determine `assignable_roles`:
    - Developer: `['user', 'administrator', 'superadmin', 'developer']`
    - Superadmin: `['user', 'administrator']`
    - Admin: `['user']`
- In `store()` and `update()`:
  - Validate role against caller tier:
    - Superadmin cannot assign `superadmin` or `developer`.
    - Admin can only assign `user`.

**Step 4: Run tests to verify pass**
Run: `php artisan test --filter=UserAuthorizationTest`
Expected: PASS.

**Step 5: Commit**
`git commit -m "feat(users): enforce tier-based role assignment and user listing scoping"`

---

### Task 5: Multi-Tier Activity Log Isolation

**Files:**
- Modify: `app/Models/ActivityLog.php`
- Test: `tests/Feature/ActivityLogVisibilityTest.php`

**Step 1: Write feature tests in ActivityLogVisibilityTest**
- Superadmins cannot see Developer logs.
- Superadmins can see Superadmin, Admin, and Staff logs.
- Admins cannot see Superadmin or Developer logs.
- Admins can see other Admin and Staff logs.

**Step 2: Run tests to verify failure**
Run: `php artisan test --filter=ActivityLogVisibilityTest`
Expected: FAIL.

**Step 3: Implement minimal code in `app/Models/ActivityLog.php`**
Update `scopeVisibleTo`:
- For Developer: return `$query` (unrestricted).
- For Superadmin:
  - Filter out impersonation actions.
  - Filter out developer actors (`whereDoesntHave('user', fn($uq) => $uq->where('role', 'developer'))`).
  - Filter out developer subjects (`whereDoesntHave('subjectUser', fn($suq) => $suq->where('role', 'developer'))`).
  - Filter out developer keyword mentions in null-user descriptions.
- For Administrator:
  - Filter out impersonation actions.
  - Filter out developer & superadmin actors (`whereDoesntHave('user', fn($uq) => $uq->whereIn('role', ['developer', 'superadmin']))`).
  - Filter out developer & superadmin subjects.
  - Filter out developer & superadmin keyword mentions.

**Step 4: Run tests to verify pass**
Run: `php artisan test --filter=ActivityLogVisibilityTest`
Expected: PASS.

**Step 5: Commit**
`git commit -m "feat(activity-log): isolate developer and superadmin logs according to tier"`

---

### Task 6: Frontend UI Polish & Inertia Capabilities

**Files:**
- Modify: `resources/js/Pages/ManageUsers.jsx`
- Modify: `resources/js/Pages/CatalogApp.jsx`
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`

**Step 1: Update Inertia shared props and UI**
- Ensure `ManageUsers.jsx` renders a distinct badge for `"superadmin"` ("Super Administrator").
- Use `assignable_roles` to dynamically populate role options in user creation and edit modals.
- Conditionally render / enable Edit and Delete buttons based on `u.can_edit` and `u.can_delete`.
- Ensure permanent deletion button in `CatalogApp.jsx` displays cleanly when `can.force_delete` is true.

**Step 2: Test frontend build**
Run: `npm run build`
Expected: Zero build errors.

**Step 3: Commit**
`git commit -m "feat(ui): update user management and catalog modals for superadmin tier"`

---

### Task 7: Full Verification and Test File Cleanup (User Request)

**Files:**
- Verify with full suite: `php artisan test`
- Code formatting check: `vendor/bin/pint --test`
- Asset check: `npm run build`
- User Instruction: "please delete all test files after iimplementation"
  - Remove all files under `tests/`
  - Re-verify application integrity and clean git status

**Step 1: Run full test suite prior to deletion**
Run: `php artisan test`
Expected: 100% PASS.

**Step 2: Clean code styling**
Run: `vendor/bin/pint`
Run: `vendor/bin/pint --test`
Expected: PASS.

**Step 3: Execute user instruction: delete all test files**
Remove all test files from `tests/`.

**Step 4: Commit**
`git commit -m "feat(auth): complete superadmin role implementation and clean test files"`
