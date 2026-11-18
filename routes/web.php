<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\BidderController;
use App\Http\Controllers\BidderImportController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ImpersonationController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ItemImportController;
use App\Http\Controllers\PrintReportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SavedReportController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SignatoryController;
use App\Http\Controllers\SystemHealthController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public / Guest
Route::redirect('/', '/login');

// Authenticated routes
Route::middleware(['auth'])->group(function () {

    // Main projects / catalog app
    Route::get('/catalog', [CatalogController::class, 'index'])->name('catalog');
    Route::get('/projects', [CatalogController::class, 'index'])->name('projects');
    Route::get('/catalog/search', [SearchController::class, 'index'])->name('catalog.search');
    Route::get('/projects/search', [SearchController::class, 'index'])->name('projects.search');

    // Category and Item Management (admin + developer, enforced by CategoryPolicy & ItemPolicy)
    Route::middleware(['role:administrator,superadmin,developer'])->group(function () {
        Route::post('/catalog/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('/catalog/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/catalog/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
        Route::post('/catalog/categories/{id}/restore', [CategoryController::class, 'restore'])->name('categories.restore');
        Route::delete('/catalog/categories/{id}/force', [CategoryController::class, 'forceDelete'])->name('categories.forceDelete');
        Route::post('/catalog/categories/bulk/delete', [CategoryController::class, 'bulkDelete'])->name('categories.bulkDelete');
        Route::post('/catalog/categories/bulk/restore', [CategoryController::class, 'bulkRestore'])->name('categories.bulkRestore');
        Route::post('/catalog/categories/bulk/force', [CategoryController::class, 'bulkForceDelete'])->name('categories.bulkForceDelete');

        // Item CRUD
        Route::post('/catalog/items/import', [ItemImportController::class, 'import'])->name('items.import');
        Route::post('/catalog/items', [ItemController::class, 'store'])->name('items.store');
        Route::put('/catalog/items/{item}', [ItemController::class, 'update'])->name('items.update');
        Route::delete('/catalog/items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');
        Route::post('/catalog/items/{id}/restore', [ItemController::class, 'restore'])->name('items.restore');
        Route::delete('/catalog/items/{id}/force', [ItemController::class, 'forceDelete'])->name('items.forceDelete');
        Route::post('/catalog/items/bulk/delete', [ItemController::class, 'bulkDelete'])->name('items.bulkDelete');
        Route::post('/catalog/items/bulk/restore', [ItemController::class, 'bulkRestore'])->name('items.bulkRestore');
        Route::post('/catalog/items/bulk/force', [ItemController::class, 'bulkForceDelete'])->name('items.bulkForceDelete');

        // Activity Logs
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');
    });

    // Leave impersonation (any authenticated user who is impersonating)
    Route::post('/impersonate/leave', [ImpersonationController::class, 'leave'])->name('impersonate.leave');

    // Impersonation & User Management
    Route::middleware(['role:administrator,superadmin,developer'])->group(function () {
        // User Management
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Bidders Management
        Route::post('/catalog/bidders/import', [BidderImportController::class, 'import'])->name('bidders.import');
        Route::get('/catalog/bidders', [BidderController::class, 'index'])->name('bidders.index');
        Route::post('/catalog/bidders', [BidderController::class, 'store'])->name('bidders.store');
        Route::put('/catalog/bidders/{bidder}', [BidderController::class, 'update'])->name('bidders.update');
        Route::delete('/catalog/bidders/{bidder}', [BidderController::class, 'destroy'])->name('bidders.destroy');
        Route::post('/catalog/bidders/{id}/restore', [BidderController::class, 'restore'])->name('bidders.restore');

        // Signatories Management (Admin & Developer only)
        Route::post('/settings/signatories', [SignatoryController::class, 'store'])->name('signatories.store');
        Route::put('/settings/signatories/{signatory}', [SignatoryController::class, 'update'])->name('signatories.update');
        Route::delete('/settings/signatories/{signatory}', [SignatoryController::class, 'destroy'])->name('signatories.destroy');
        Route::post('/settings/signatories/reorder', [SignatoryController::class, 'reorder'])->name('signatories.reorder');
    });

    Route::middleware(['role:developer'])->group(function () {
        // Impersonation (start)
        Route::post('/impersonate/{user}', [ImpersonationController::class, 'impersonate'])->name('impersonate.start');

        // Developer Backup & System Health Management
        Route::prefix('system-health')->name('system-health.')->group(function () {
            Route::get('/', [SystemHealthController::class, 'index'])->name('index');
            Route::post('/backup', [SystemHealthController::class, 'storeBackup'])->name('backup.store');
            Route::get('/backup/{history}/download', [SystemHealthController::class, 'downloadBackup'])->name('backup.download');
            Route::delete('/backup/{history}', [SystemHealthController::class, 'destroyBackup'])->name('backup.destroy');
            Route::put('/schedule', [SystemHealthController::class, 'updateSchedule'])->name('schedule.update');
        });
        // Named route alias for convenience
        Route::get('/system-health', [SystemHealthController::class, 'index'])->name('system-health');
    });

    // Print report logging & view
    Route::post('/report/log', [PrintReportController::class, 'store'])->name('report.log');
    Route::get('/report/view', [PrintReportController::class, 'show'])->name('report.view');

    // Saved Reports management
    Route::get('/saved-reports', [SavedReportController::class, 'index'])->name('saved-reports.index');
    Route::post('/saved-reports', [SavedReportController::class, 'store'])->name('saved-reports.store');
    Route::post('/saved-reports/bulk/delete', [SavedReportController::class, 'bulkDelete'])->name('saved-reports.bulkDelete');
    Route::post('/saved-reports/bulk/restore', [SavedReportController::class, 'bulkRestore'])->name('saved-reports.bulkRestore');
    Route::post('/saved-reports/bulk/force', [SavedReportController::class, 'bulkForceDelete'])->name('saved-reports.bulkForceDelete');
    Route::get('/saved-reports/{savedReport}/view', [SavedReportController::class, 'show'])->name('saved-reports.show')->whereNumber('savedReport');
    Route::get('/saved-reports/{savedReport}/download', [SavedReportController::class, 'download'])->name('saved-reports.download')->whereNumber('savedReport');
    Route::delete('/saved-reports/{savedReport}', [SavedReportController::class, 'destroy'])->name('saved-reports.destroy')->whereNumber('savedReport');
    Route::post('/saved-reports/{id}/restore', [SavedReportController::class, 'restore'])->name('saved-reports.restore')->whereNumber('id');
    Route::delete('/saved-reports/{id}/force', [SavedReportController::class, 'forceDelete'])->name('saved-reports.forceDelete')->whereNumber('id');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    // Settings routes
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
});

require __DIR__.'/auth.php';
