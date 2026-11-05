# Super Administrator Role Architecture Specification

**Status:** Approved  
**Date:** 2026-11-05  
**Topic:** 4-Tier RBAC Extension (Introducing `superadmin` role)  

---

## 1. Executive Summary & Purpose

The system currently enforces a 3-tier Role-Based Access Control (RBAC) model:
- **Developer (`developer`)**
- **Administrator (`administrator`)**
- **Staff (`user`)**

To allow senior management to manage Administrator accounts and perform permanent purges of soft-deleted catalog items/categories without exposing technical, code-level, or system maintenance capabilities, we introduce a fourth role tier: **Super Administrator (`superadmin`)**.

---

## 2. Decision Log

| # | Topic | Decision | Alternatives Considered | Rationale |
|---|---|---|---|---|
| **D1** | **Role Identifier** | `'superadmin'` (Display: "Super Administrator") | `'super_administrator'`, `'superadmin'` | Clean, standard string key compatible with current `string('role')` column. |
| **D2** | **Permanent Deletions Scope** | Soft-deleted Items & Categories only | Items, Categories & Bidders; full entity purge | Aligns with existing `forceDelete` soft-delete purge architecture. |
| **D3** | **Administrator Management** | Superadmin has full CRUD over Admins & Staff | Creation-only; or Edit-without-delete | Provides complete operational management without requiring Developer intervention. |
| **D4** | **Activity Log Isolation** | Developers hidden from Superadmins; Superadmins hidden from Admins | Superadmins see all; or Admins see Superadmins | Preserves strict upward privacy and technical isolation between tiers. |
| **D5** | **Impersonation Boundary** | Strictly Developer-only | Superadmin impersonating Staff/Admin | Prevents unauthorized account takeover at operational tier. |
| **D6** | **User List Visibility** | Superadmin is read-only for Admins; Developer is hidden from both | Superadmin hidden from Admin; or Developer visible read-only | Admins need to know who senior management is without ability to mutate them. |
| **D7** | **Architecture Pattern** | Approach 1: Native Policy & Role Helper Extension | Numeric Rank system; Spatie-like Permission Matrix | Highly idiomatic Laravel, zero regressions, builds directly upon existing codebase patterns. |

---

## 3. Four-Tier Authorization Matrix

| Capability | Staff (`user`) | Administrator (`administrator`) | Super Administrator (`superadmin`) | Developer (`developer`) |
|---|:---:|:---:|:---:|:---:|
| **View Catalog Items & Categories** | Yes | Yes | Yes | Yes |
| **Create / Edit / Soft-Delete Items** | ❌ No | Yes | Yes | Yes |
| **Permanent Purge Items (`forceDelete`)** | ❌ No | ❌ No | **Yes** | **Yes** |
| **Permanent Purge Categories (`forceDelete`)** | ❌ No | ❌ No | **Yes** | **Yes** |
| **Manage Bidders & Signatories** | ❌ No | Yes | Yes | Yes |
| **View Manage Users Page** | ❌ No | Yes (Admins/Staff) | Yes (Superadmins/Admins/Staff) | Yes (All tiers) |
| **Create Staff Accounts** | ❌ No | Yes | Yes | Yes |
| **Create Administrator Accounts** | ❌ No | ❌ No | **Yes** | **Yes** |
| **Create Superadmin Accounts** | ❌ No | ❌ No | ❌ No | **Yes** |
| **Create Developer Accounts** | ❌ No | ❌ No | ❌ No | **Yes** |
| **Edit / Delete Administrator Accounts** | ❌ No | ❌ No | **Yes** | **Yes** |
| **Edit / Delete Superadmin Accounts** | ❌ No | ❌ No | ❌ No | **Yes** |
| **User Impersonation** | ❌ No | ❌ No | ❌ No | **Yes** (Developer-only) |
| **Activity Log Visibility** | Own logs only | Admin + Staff logs | Superadmin + Admin + Staff logs | All logs (Unrestricted) |

---

## 4. Technical Specifications

### 4.1 Data Model (`app/Models/User.php`)
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

### 4.2 Resource Policies
* **`ItemPolicy` & `CategoryPolicy`:**
  * Update `forceDelete` and `forceDeleteAny` to check:
    ```php
    return $user->isDeveloper() || $user->isSuperAdmin();
    ```
  * Update `create`, `update`, `delete`, `restore` to allow `$user->isAdmin() || $user->isSuperAdmin() || $user->isDeveloper()`.

* **`UserPolicy`:**
  * `viewAny`: `$authUser->isAdmin() || $authUser->isSuperAdmin() || $authUser->isDeveloper()`
  * `create`: `$authUser->isAdmin() || $authUser->isSuperAdmin() || $authUser->isDeveloper()`
  * `update`:
    - Developer: `true`
    - Superadmin: `$targetUser->isAdmin() || $targetUser->isStaff()`
    - Administrator: `$targetUser->isStaff()`
  * `delete`:
    - Self-deletion: `false`
    - Developer: `true`
    - Superadmin: `$targetUser->isAdmin() || $targetUser->isStaff()`
    - Administrator: `$targetUser->isStaff()`
  * `impersonate`: `$authUser->isDeveloper()`

### 4.3 Activity Log Scope (`app/Models/ActivityLog.php::scopeVisibleTo`)
* **Developer:** Full query without restrictions.
* **Superadmin:**
  * Excludes logs with action in `['impersonation_started', 'impersonation_ended']`.
  * Excludes logs where actor `role === 'developer'`.
  * Excludes logs where `subjectUser` has `role === 'developer'`.
  * Excludes system/null-user logs referencing Developer keywords/usernames.
* **Administrator:**
  * Excludes impersonation actions.
  * Excludes logs where actor `role` is in `['developer', 'superadmin']`.
  * Excludes logs where `subjectUser` has `role` in `['developer', 'superadmin']`.
  * Excludes system/null-user logs referencing Developer or Superadmin keywords/usernames.
* **Staff:** Confined to own logs + item/category creation events.

### 4.4 Controllers
* **`UserController`:**
  * `index`:
    * Scopes user list: Developers see all; Superadmins and Admins filter out Developers (`role != 'developer'`).
    * Exposes explicit per-user flags: `can_edit => $authUser->can('update', $u)` and `can_delete => $authUser->can('delete', $u)`.
    * Exposes `assignable_roles` to Inertia props:
      * Developer: `['user', 'administrator', 'superadmin', 'developer']`
      * Superadmin: `['user', 'administrator']`
      * Administrator: `['user']`
  * `store` & `update`:
    * Role assignment strictly validated against caller permissions.
    * Returns user-friendly redirect/error messages if unauthorized role assignment is attempted.

### 4.5 Frontend (`resources/js/Pages/ManageUsers.jsx`, `CatalogApp.jsx`)
* Render "Super Administrator" badge with distinct visual styling.
* Dynamically populate role selector in modal using `assignable_roles`.
* Disable or hide Edit/Delete action buttons if `can_edit` / `can_delete` is false.
* Bind catalog permanent delete action to `auth.user.can.force_delete`.

---

## 5. Automated Verification Plan

1. **Unit Tests:**
   * `tests/Unit/Policies/UserPolicyTest.php`: Assert all 4-role permutations for `create`, `update`, `delete`, `impersonate`.
   * `tests/Unit/Policies/ItemPolicyTest.php` & `CategoryPolicyTest.php`: Assert Superadmin can force-delete while Admin cannot.
2. **Feature Tests:**
   * `tests/Feature/UserControllerTest.php`:
     * Superadmin creating and updating Admin accounts.
     * Admin receiving error/403 when trying to create an Admin.
     * Superadmin receiving error/403 when trying to create Superadmin or Developer.
     * Impersonation remaining restricted to Developers.
   * `tests/Feature/ActivityLogVisibilityTest.php`:
     * Superadmins seeing Admins and Staff, but not Developers.
     * Admins seeing Staff and other Admins, but neither Developers nor Superadmins.
     * Developers seeing everything.
