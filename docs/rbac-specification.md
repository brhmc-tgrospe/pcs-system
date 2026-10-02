# RBAC Specification & Architecture Design
**System:** BRHMC - PCS (Project Catalog / Procurement System)  
**Roles:** Developer, Administrator, Staff (`user`)  
**Date:** September 30, 2026  
**Status:** Approved Design  

---

## 1. Understanding Summary

* **Objective:** Formalize and separate system functions across **Staff**, **Administrator**, and **Developer** using native Laravel Policies, Gates, and Inertia capability sharing.
* **Why it exists:** Replaces ad-hoc string comparisons in controllers and UI layouts with an auditable, testable, and centralized authorization architecture.
* **Target Users & Boundaries:**
  * **Staff (`user`):** Read-only consumers who search catalog items, review pricing/bidders, and generate/print project reports.
  * **Administrator (`administrator`):** Procurement managers handling catalog items, categories, bidder quotations, bid awarding, BAC signatories, and staff accounts.
  * **Developer (`developer`):** Technical custodians handling user impersonation, permanent data erasure (`forceDelete`), privileged user management, and system maintenance.
* **Key Constraints:**
  * Uses the existing `users.role` column (`user`, `administrator`, `developer`) backed by standard Laravel Policies without introducing third-party package dependencies (YAGNI).
  * Admins cannot modify or delete Developer or fellow Admin accounts; Admins cannot permanently hard-delete catalog items or bidders.
  * Activity logs remain strictly immutable for Admins and Staff.
* **Explicit Non-Goals:**
  * No dynamic database permission matrices or runtime permission-toggling UI.
  * No drafting/approval submission pipeline for Staff (Staff remains strictly read-only).
  * No multi-tenancy or public user self-registration.

---

## 2. Assumptions & Non-Functional Requirements

* **Scale:** Internal hospital network application serving approximately 20–100 active staff users, 3–5 administrators, and 1–2 developers, with tens of thousands of catalog items.
* **Performance:** Authorization rules evaluate instantly in-memory without extra database round-trips. Global permissions are shared via `HandleInertiaRequests` as a lightweight `auth.can` boolean map (< 1 KB payload).
* **Security:** Every mutation endpoint is strictly verified server-side through policy checks (`$this->authorize(...)`). UI visibility toggles in frontend components are treated strictly as UX conveniences, not security boundaries.
* **Reliability & Auditability:** All destructive business actions are soft-deletes with complete recovery workflows for Admins; permanent data purging is restricted to Developers and logged to `ActivityLog`.
* **Maintenance:** Domain logic follows Clean Architecture/DDD by isolating authorization rules into dedicated Laravel Policies (`ItemPolicy`, `CategoryPolicy`, `BidderPolicy`, `UserPolicy`).

---

## 3. Decision Log

| # | Decision | Alternatives Considered | Rationale |
|---|---|---|---|
| **1** | **Staff as Read-Only Consumers** | Contributor drafting; Department-scoped editing | Preserves data integrity; procurement master data remains strictly admin-curated. |
| **2** | **Enforcement via Laravel Policies & Gates** | Controller-level `if` checks; Heavy dynamic DB permissions package | Standard idiomatic Laravel, zero dependency bloat (YAGNI), testable and clean. |
| **3** | **Immutable Audit & Developer-Only Hard Purge** | Full Admin hard purge; Minimal safeguards | Prevents catastrophic data loss; guarantees tamper-resistant procurement logs. |
| **4** | **Dedicated Domain Policies + Inertia Capabilities** | Flat global gates; Numeric role hierarchy | Encapsulates model-instance checks cleanly (e.g., Admins managing Staff but not other Admins). |

---

## 4. Final Design Specification

### 4.1 Functional Responsibility Matrix

| Capability / Resource | Staff (`user`) | Admin (`administrator`) | Developer (`developer`) |
| :--- | :---: | :---: | :---: |
| **Dashboard** | View | View | View |
| **Catalog & Projects (Read)** | View, Search, Detail SlideOver | View, Search, Detail SlideOver | View, Search, Detail SlideOver |
| **Print Project Reports** | Yes (Select signatories & print) | Yes | Yes |
| **Item CRUD (Create, Edit)** | ❌ No | Yes | Yes |
| **Item Soft-Delete & Restore** | ❌ No | Yes | Yes |
| **Item Permanent Purge (`forceDelete`)** | ❌ No | ❌ No | **Yes** (Developer-only) |
| **Category Management** | ❌ No | Yes (CRUD + Restore) | Yes (+ Force Delete) |
| **Bidder Quotations & Awarding** | View awarded & quotes | Full Management | Full Management |
| **Signatories & System Settings** | ❌ No | Manage BAC signatories & order | Full Management |
| **Activity & Audit Logs** | ❌ No | View audit trail (Immutable) | View & Prune / Archive |
| **User Management** | ❌ No | Manage **Staff only** | Manage all roles (Staff, Admin, Dev) |
| **User Impersonation** | ❌ No | ❌ No | **Yes** (Troubleshooting only) |

---

### 4.2 Architecture & Implementation Structure

#### Layer 1: Model Helpers (`app/Models/User.php`)
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

#### Layer 2: Laravel Policies (`app/Policies/`)
* **`ItemPolicy` & `CategoryPolicy`:**
  * `viewAny`, `view`: `true` for all authenticated users.
  * `create`, `update`, `delete`, `restore`: `$user->isAdmin() || $user->isDeveloper()`.
  * `forceDelete`: `$user->isDeveloper()`.
* **`UserPolicy`:**
  * `viewAny`: `$user->isAdmin() || $user->isDeveloper()`.
  * `create`: `$user->isAdmin() || $user->isDeveloper()`. (Form validation enforces Admins can only assign `user`).
  * `update`, `delete`: `$user->isDeveloper() || ($user->isAdmin() && $targetUser->isStaff())`.
  * `impersonate`: `$user->isDeveloper()`.
* **`SignatoryPolicy`:**
  * `viewAny`, `manage`: `$user->isAdmin() || $user->isDeveloper()`.
* **`ActivityLogPolicy`:**
  * `viewAny`: `$user->isAdmin() || $user->isDeveloper()`.
  * `prune`: `$user->isDeveloper()`.

#### Layer 3: Client Capability Sharing (`app/Http/Middleware/HandleInertiaRequests.php`)
```php
'auth' => [
    'user' => $user ? [
        'id'         => $user->id,
        'username'   => $user->username,
        'first_name' => $user->first_name,
        'last_name'  => $user->last_name,
        'full_name'  => $user->full_name,
        'email'      => $user->email,
        'role'       => $user->role,
        'can'        => [
            'manage_items'      => $user->can('create', \App\Models\Item::class),
            'force_delete'      => $user->can('forceDeleteAny', \App\Models\Item::class),
            'manage_categories' => $user->can('create', \App\Models\Category::class),
            'manage_bidders'    => $user->can('create', \App\Models\Bidder::class),
            'manage_users'      => $user->can('viewAny', \App\Models\User::class),
            'view_logs'         => $user->can('viewAny', \App\Models\ActivityLog::class),
            'manage_settings'   => $user->can('manage', \App\Models\Signatory::class),
            'impersonate'       => $user->can('impersonate', \App\Models\User::class),
        ],
    ] : null,
],
```

#### Layer 4: Frontend UI Adaptation
* **Sidebar Navigation:** Replaces raw role checks (`isAdmin`) with `user.can.manage_items`, `user.can.manage_users`, etc.
* **Master Projects & Catalog:** Hides action buttons (New, Edit, Delete, Import) when `!user.can.manage_items`.
* **Manage Users:** Disables edit/delete buttons on Admin/Developer rows when the current user is an Admin; hides Impersonation trigger unless `user.can.impersonate`.

---

## 5. Security & Edge Case Handling

1. **Privilege Escalation:** Controller and FormRequest validation strictly rejects any Admin request trying to set `role: administrator` or `role: developer`.
2. **Account Immunity:** Admins cannot edit or delete other Admins or Developers. Attempting direct API manipulation throws an HTTP 403.
3. **Self-Preservation:** Users cannot delete their own account.
4. **Audit Trail Immutability:** Web-based log deletion/editing is blocked. All administrative mutations write an entry to `ActivityLog`.
5. **Impersonation Safety:** Impersonation sets `impersonator_id` in the session, downgrades active permissions to the target user, and provides a persistent exit banner.

---

## 6. Testing Strategy

1. **Unit Tests (`tests/Unit/Policies/`):**
   * Matrix tests verifying `ItemPolicy`, `UserPolicy`, `CategoryPolicy`, and `BidderPolicy` return expected booleans across all three roles.
2. **Feature Tests (`tests/Feature/Authorization/`):**
   * HTTP 403 assertions for Staff accessing mutating routes (`POST /catalog/items`, `POST /catalog/categories`).
   * HTTP 403 assertions for Admins attempting `forceDelete` or modifying other Admins.
   * HTTP 200/302 assertions for Developer privileged flows and impersonation transitions.
