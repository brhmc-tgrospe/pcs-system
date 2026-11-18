# System Health & Database Backup Specification (PCS v1)

**System:** Property Custody & Condemnation System (PCS v1)  
**Target Organization:** Bicol Regional Hospital and Medical Center (BRHMC)  
**Author:** AI Agent & Developer Pair  
**Date:** 2026-11-11  
**Status:** Approved / Validated Design  

---

## 1. Understanding Summary

* **What is being built:** A complete, production-grade **System Health Check & Database Backup Console** for PCS v1, porting the architecture and functionality 1-to-1 from `D:\hics` into PCS v1's stack (**Laravel 13 + React 18 / Inertia.js v2 + Tailwind CSS**).
* **Why it exists:** Provides real-time server vitals, storage utilization, and database table stats, alongside automated and on-demand zero-table-locking MySQL backup archives bundled with health diagnostics.
* **Who it is for:** Exclusively authenticated users with the `developer` role.
* **Key Features:**
  1. **Live Vitality Telemetry:** Server environment metrics (PHP, OS, RAM usage, memory limit, OPcache), drive storage usage with low-space alert (<1GB), and database metrics with an interactive "View Tables" breakdown modal.
  2. **Zero-Lock Database Backups:** Native `mysqldump` streaming (`--single-transaction --quick --skip-lock-tables`) with an automatic pure PHP PDO streaming fallback.
  3. **Strict 4-Backup Retention Cap:** Automatically prunes older backups to maintain at most 4 archives on disk.
  4. **Automated Scheduling:** Configurable weekly or monthly backup schedules at specific times in `Asia/Manila` (UTC+8).
  5. **Real-Time Monitoring:** 3-second auto-polling during active backup generation, secure downloads, and deletion with confirmation modals.
* **Key Constraints:**
  * Strict access control: Backend routes protected by `role:developer` middleware; frontend sidebar link displayed only when `user.role === 'developer'`.
  * Filename format: `PCS_YYYY-MM-DD_HHmmss.zip`.
  * Clean architectural replacement: Replaces old temporary `DeveloperBackupController` and cache-based state with HICS's database models (`BackupHistory`, `BackupSchedule`).
* **Explicit Non-Goals:**
  * Non-developer access is strictly prohibited (403 Forbidden).
  * Direct restore or SQL execution from the UI (archives are downloaded for safe CLI/offline restoration).
  * External cloud storage syncing (managed on local secure server storage).

---

## 2. Assumptions

1. **Database Schema:** We will create standard migrations for `backup_schedules` and `backup_histories` matching HICS's schema, and cleanly remove/drop the unused `backup_schedule_settings` table.
2. **Frontend Framework:** The UI is implemented in React 18 (`resources/js/Pages/SystemHealth/Index.tsx`), reproducing HICS's Vue 3 design, cards, tables modal, and polling logic.
3. **Audit Logging:** System backups, downloads, deletions, and schedule updates are audited using `ActivityLog::log()`.
4. **Execution Mode:** Dispatches queued job `CreateBackupJob` by default, but supports immediate synchronous execution via `?sync=1` for environments where `queue:work` is not actively running.

---

## 3. Decision Log

| ID | Decision Item | Selected Option | Alternatives Considered | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **DEC-01** | Architecture Parity | **Full 1-to-1 Parity with HICS** | Partial cache/file-based adaptation | Ensures identical reliability, database-backed history audit trail, and unified codebase patterns between HICS and PCS v1. |
| **DEC-02** | Legacy Scaffolding | **Clean Replacement** | Dual route compatibility | Completely deprecates and removes obsolete temporary controllers (`DeveloperBackupController`) and unused tables to prevent technical debt. |
| **DEC-03** | Execution Mode | **Queue with Sync option** | Strictly queued only | Allows background queue processing in production while providing immediate synchronous execution during local developer testing. |
| **DEC-04** | Access Control | **`role:developer` Gate** | Permission-based gate | Aligns with existing PCS v1 role hierarchy where Developer is the sole technical administrator role. |
| **DEC-05** | Retention Policy | **Strict 4-Backup Cap** | Configurable count | Prevents server storage exhaustion by strictly keeping only the 4 most recent archives. |

---

## 4. Final Design Specification

### 4.1 Database Layer

#### Table: `backup_schedules`
```sql
CREATE TABLE backup_schedules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    is_enabled BOOLEAN DEFAULT FALSE,
    frequency ENUM('weekly', 'monthly') DEFAULT 'weekly',
    day_of_week TINYINT UNSIGNED DEFAULT 0,
    day_of_month TINYINT UNSIGNED DEFAULT 1,
    execution_time VARCHAR(5) DEFAULT '02:00',
    last_run_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### Table: `backup_histories`
```sql
CREATE TABLE backup_histories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT UNSIGNED NULL,
    status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
    error_message TEXT NULL,
    triggered_by BIGINT UNSIGNED NULL,
    health_summary JSON NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (triggered_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### 4.2 Backend Services (`app/Services/Backup/`)

1. **`SystemHealthService`:**
   * Collects live metrics: Server (OS, PHP version, memory limits, RAM, OPcache), Storage (base path disk capacity, usage %, low space flag <1GB), Database (MySQL version, active threads, uptime, total size, table breakdown via `information_schema.TABLES`), and Application details.
   * Generates formatted Markdown report (`health_summary.md`).
2. **`DatabaseBackupService`:**
   * Resolves `mysqldump` binary across system PATH and Windows stacks (Laragon, XAMPP).
   * Runs `mysqldump --single-transaction --quick --skip-lock-tables --routines --triggers --default-character-set=utf8mb4`.
   * Falls back to PHP PDO streaming export if `mysqldump` is unavailable.
3. **`BackupArchiveService`:**
   * Pre-flight disk space check (>500MB).
   * Creates ZIP archive `PCS_YYYY-MM-DD_HHmmss.zip` containing:
     * `database/database_dump.sql`
     * `system_health/health_summary.json`
     * `system_health/health_summary.md`
     * `manifest.json` with SHA-256 hash and metadata.
   * Strictly enforces 4-backup retention cap (pruning excess files and history records).

### 4.3 Controller & Routing

* **Controller:** `App\Http\Controllers\SystemHealthController`
* **Routes:**
  * `GET /system-health` (`system-health.index`): Renders `SystemHealth/Index` with `health`, `schedule`, `backupHistories`, and `hasActiveBackup`.
  * `POST /system-health/backup` (`system-health.backup.store`): Dispatches `CreateBackupJob` (or runs sync if `?sync=1`).
  * `GET /system-health/backup/{history}/download` (`system-health.backup.download`): Streams ZIP download with `no-store, no-cache` headers.
  * `DELETE /system-health/backup/{history}` (`system-health.backup.destroy`): Deletes archive file and record.
  * `PUT /system-health/schedule` (`system-health.schedule.update`): Updates schedule configuration.

### 4.4 Console Commands & Jobs

* **`CreateBackupJob`:** Queued worker job handling archive generation in background.
* **`RunScheduledBackupCommand`:** `php artisan backup:run-scheduled` evaluates schedule criteria and triggers backup when due.

### 4.5 Frontend UI (`resources/js/Pages/SystemHealth/Index.tsx`)

* Layout based on `resources/js/Layouts` or standard PCS navigation shell.
* Header with "Refresh Metrics" and "Create Backup Now" buttons.
* Pulsing notification banner when backup is running.
* 3 Vitality Cards: Drive Storage (with progress bar), Database Vitality (with "View Tables" button), and Server Environment.
* Database Tables Breakdown Modal: Searchable list of all database tables with row counts and sizes.
* Automated Backup Schedule Form: Toggle, frequency, day, and execution time inputs.
* Retained Backup Archives Table: Max 4 slots, status badges, download link, and delete confirmation modal.
* 3-second auto-polling while an active backup is running.

### 4.6 Sidebar Link (`resources/js/Components/Sidebar.tsx`)

* Added under "Reports & Settings":
  `{ id: 'system_health', label: 'System Health', icon: Activity, href: '/system-health' }`
* Only displayed when `user.role === 'developer'`.

---

## 5. Verification & Testing Plan

1. **Unit & Feature Tests (`tests/Feature/SystemHealthTest.php`):**
   * Access control: Developer granted (200), non-developer rejected (403).
   * Synchronous backup creation: Generates valid ZIP with all 4 required files (`database_dump.sql`, `health_summary.json`, `health_summary.md`, `manifest.json`).
   * Retention enforcement: Creating 5 backups retains only the 4 most recent archives.
   * Archive download & deletion.
   * Schedule update persistence.
2. **Build Verification:**
   * `npm run build` succeeds with zero TypeScript / JSX errors.
   * `php artisan test` runs with 100% pass rate.
