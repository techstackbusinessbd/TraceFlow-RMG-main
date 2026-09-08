<?php

use App\Domains\SystemAdmin\Controllers\CompanyController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Sister Company & Legal Entity Management Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for CRUD + next-code preview endpoint.
| All routes require authentication. Permission gates enforced in controller.
*/

Route::middleware('auth:sanctum')->prefix('companies')->group(function () {
    // Next system-generated code preview (must be before {company} route)
    Route::get('/next-code', [CompanyController::class, 'nextCode'])
        ->middleware('permission:system_admin.companies.profile.create');

    // Standard CRUD
    Route::get('/', [CompanyController::class, 'index'])
        ->middleware('permission:system_admin.companies.profile.view');
    Route::post('/', [CompanyController::class, 'store'])
        ->middleware('permission:system_admin.companies.profile.create');
    Route::get('/{company}', [CompanyController::class, 'show'])
        ->middleware('permission:system_admin.companies.profile.view');
    Route::put('/{company}', [CompanyController::class, 'update'])
        ->middleware('permission:system_admin.companies.profile.update');
    Route::delete('/{company}', [CompanyController::class, 'destroy'])
        ->middleware('permission:system_admin.companies.profile.delete');

    // Status toggle (non-destructive, allowed as PATCH)
    Route::patch('/{company}/toggle-status', [CompanyController::class, 'toggleStatus'])
        ->middleware('permission:system_admin.companies.profile.update');
});
