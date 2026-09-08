<?php

use App\Domains\SystemAdmin\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| User Management Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for User CRUD + Metadata lookups.
*/

Route::middleware('auth:sanctum')->prefix('users')->group(function () {
    // Lookup metadata for roles & active companies dropdowns
    Route::get('/meta/roles-companies', [UserController::class, 'metadata'])
        ->middleware('permission:system_admin.users.account.view');

    // Standard CRUD
    Route::get('/', [UserController::class, 'index'])
        ->middleware('permission:system_admin.users.account.view');
    Route::post('/', [UserController::class, 'store'])
        ->middleware('permission:system_admin.users.account.create');
    Route::get('/{user}', [UserController::class, 'show'])
        ->middleware('permission:system_admin.users.account.view');
    Route::put('/{user}', [UserController::class, 'update'])
        ->middleware('permission:system_admin.users.account.update');
    Route::delete('/{user}', [UserController::class, 'destroy'])
        ->middleware('permission:system_admin.users.account.delete');

    // Status toggle (PATCH)
    Route::patch('/{user}/toggle-status', [UserController::class, 'toggleStatus'])
        ->middleware('permission:system_admin.users.account.update');

    // Custom direct permissions per user (requires role edit permission)
    Route::get('/{user}/permissions', [UserController::class, 'getUserPermissions'])
        ->middleware('permission:system_admin.roles.matrix.update');
    Route::put('/{user}/permissions', [UserController::class, 'syncUserPermissions'])
        ->middleware('permission:system_admin.roles.matrix.update');
});
