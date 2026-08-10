<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ImpersonationController;
use App\Http\Controllers\PrintReportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Public / Guest
Route::redirect('/', '/login');

// Authenticated routes
Route::middleware(['auth'])->group(function () {

    // Main catalog app
    Route::get('/catalog', [CatalogController::class, 'index'])->name('catalog');
    Route::get('/catalog/search', [SearchController::class, 'index'])->name('catalog.search');

    // Category CRUD (admin + developer)
    Route::middleware(['role:administrator,developer'])->group(function () {
        Route::post('/catalog/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('/catalog/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/catalog/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');
        Route::post('/catalog/categories/{id}/restore', [CategoryController::class, 'restore'])->name('categories.restore');
        Route::delete('/catalog/categories/{id}/force', [CategoryController::class, 'forceDelete'])->name('categories.forceDelete');
        Route::post('/catalog/categories/bulk/delete', [CategoryController::class, 'bulkDelete'])->name('categories.bulkDelete');
        Route::post('/catalog/categories/bulk/restore', [CategoryController::class, 'bulkRestore'])->name('categories.bulkRestore');
        Route::post('/catalog/categories/bulk/force', [CategoryController::class, 'bulkForceDelete'])->name('categories.bulkForceDelete');

        // Item CRUD
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

    // Impersonation & User Management (developer only)
    Route::middleware(['role:administrator,developer'])->group(function () {
        // User Management
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');

        // Bidders Management
        Route::get('/catalog/bidders', [\App\Http\Controllers\BidderController::class, 'index'])->name('bidders.index');
        Route::post('/catalog/bidders', [\App\Http\Controllers\BidderController::class, 'store'])->name('bidders.store');
        Route::put('/catalog/bidders/{bidder}', [\App\Http\Controllers\BidderController::class, 'update'])->name('bidders.update');
        Route::delete('/catalog/bidders/{bidder}', [\App\Http\Controllers\BidderController::class, 'destroy'])->name('bidders.destroy');
        Route::post('/catalog/bidders/{id}/restore', [\App\Http\Controllers\BidderController::class, 'restore'])->name('bidders.restore');
    });

    Route::middleware(['role:developer'])->group(function () {
        // Impersonation (start)
        Route::post('/impersonate/{user}', [ImpersonationController::class, 'impersonate'])->name('impersonate.start');
    });

    // Print report logging & view
    Route::post('/report/log', [PrintReportController::class, 'store'])->name('report.log');
    Route::get('/report/view', [PrintReportController::class, 'show'])->name('report.view');

    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    // Settings routes
    Route::get('/settings', [App\Http\Controllers\SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings', [App\Http\Controllers\SettingsController::class, 'update'])->name('settings.update');
});

require __DIR__.'/auth.php';
