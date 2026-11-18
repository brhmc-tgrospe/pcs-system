# PCS v1 — Development Directives & Skills Protocol

This project is the **Property Custody & Condemnation System (PCS v1)** for **Bicol Regional Hospital and Medical Center (BRHMC)**.
Tech Stack: **Laravel 13** (PHP 8.3+), **Inertia.js v2**, **React 18**, **Tailwind CSS**, **Headless UI**, **Lucide React**, **PHPUnit 12**.

All coding, refactoring, architectural decisions, and testing in this repository **MUST** adhere to the following global skills and development protocols:

---

## 1. Planning & Architectural Standards
* **`concise-planning` & `writing-plans`**: For multi-step features or changes, define an atomic, reviewable checklist before modifying code.
* **`software-architecture`**:
  * Clean Architecture & DDD: Decouple domain business logic from framework drivers and UI.
  * Library-First Approach: Always verify and use existing packages before building custom helpers.
  * Code Quality: Enforce early returns, avoid deep nesting, decompose long functions (>80 lines) and long files (>200 lines).
* **`clean-code`**: Meaningful naming, small single-responsibility functions, and eliminating side effects.

---

## 2. Backend Development (Laravel & PHP 8.3+)
* **`cc-skill-backend-patterns` & `laravel-expert`**:
  * Thin Controllers: Delegate business logic to dedicated Action/Service classes.
  * Validation: Always use Form Requests for input validation.
  * Authorization: Enforce Model Policies and Gates on every resource route.
  * Eloquent Relations: Always eager-load relations (`with(...)`) to prevent N+1 query bottlenecks.
* **`php-pro`**: Leverage modern PHP 8.3+ features (Enums, match expressions, typed properties, memory-efficient generators for processing large CSV inventory imports).

---

## 3. Frontend Development (Inertia.js & React 18)
* **`cc-skill-frontend-patterns` & `react-patterns`**:
  * Component composition over inheritance.
  * Clear separation between container (logic/state) and presentational components.
  * Custom hooks for re-usable stateful logic.
* **`cmis-table-patterns`**:
  * Standard data table and catalog UX for hospital inventories.
  * Global search box with debounced querying (300–350ms) via Inertia `router.get(..., { preserveState: true, preserveScroll: true, replace: true })`.
  * `SortableHeader` supporting ascending, descending, and neutral states.
  * `Pagination` component with dynamic page sizes (`10, 25, 50, 100`) and the standard entry counter: `"Showing {from} to {to} of {total} entries"`.
* **`tailwind-patterns`**: Maintainable utility classes, `@tailwindcss/forms` integration, and consistent brand styling with BRHMC colors.

---

## 4. Database & Performance Optimization
* **`database-design`**: Maintain 3NF schema normalization, strict foreign key constraints, proper index strategies, and soft-delete safeguards.
* **`sql-optimization-patterns`**: Index foreign keys and frequently filtered columns (`status`, `category_id`, `signatory_id`); optimize Eloquent audit trails (`activity_logs`).

---

## 5. Security & RBAC Enforcement
* **`laravel-security-audit` & `security-auditor`**:
  * Enforce strict Role-Based Access Control as defined in [`docs/rbac-specification.md`](file:///d:/pcs-v1/docs/rbac-specification.md).
  * Prevent mass-assignment vulnerabilities (`$fillable`), protect against IDOR on hospital property and bidding items, and secure all API/web endpoints.
* **`web-security-testing`**: Validate against OWASP Top 10 vulnerabilities, verify CSRF handling, and sanitize user inputs.

---

## 6. Testing, Debugging & Verification Discipline
* **`tdd-workflow`**: Follow Red-Green-Refactor testing cycle with PHPUnit (`php artisan test`).
* **Always run tests**: Whenever new code is written or existing code is modified, run test suites to ensure zero regressions (aligning with `.cursorrules`).
* **`systematic-debugging`**: NEVER apply quick-fix symptom patches. Find and verify root cause before making changes.
* **`verification-before-completion`**:
  * **The Iron Law**: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.
  * Always execute the actual verification command (`php artisan test`, `npm run build`, linters, VCS diffs) and inspect the full output and exit code before stating a task, phase, or fix is complete.
  * Never claim success based on assumption, partial checks, or "should work". State claims strictly with fresh evidence.
