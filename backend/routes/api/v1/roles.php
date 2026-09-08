<?php

use App\Domains\SystemAdmin\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Role & Permission Matrix Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for enterprise roles & permission catalog.
*/

Route::middleware('auth:sanctum')->group(function () {
    // 4-tier structured permission tree (accessible to anyone who can view roles)
    Route::get('/permissions/tree', [RoleController::class, 'permissionTree'])
        ->middleware('permission:system_admin.roles.matrix.view');

    // Roles CRUD & Matrix
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index'])
            ->middleware('permission:system_admin.roles.matrix.view');
        Route::post('/', [RoleController::class, 'store'])
            ->middleware('permission:system_admin.roles.matrix.create');
        Route::get('/{role}', [RoleController::class, 'show'])
            ->middleware('permission:system_admin.roles.matrix.view');
        Route::put('/{role}', [RoleController::class, 'update'])
            ->middleware('permission:system_admin.roles.matrix.update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])
            ->middleware('permission:system_admin.roles.matrix.delete');

        // Permission matrix sync
        Route::put('/{role}/matrix', [RoleController::class, 'syncMatrix'])
            ->middleware('permission:system_admin.roles.matrix.update');
    });
});
