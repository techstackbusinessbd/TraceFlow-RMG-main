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
    Route::get('/next-code', [CompanyController::class, 'nextCode']);

    // Standard CRUD
    Route::get('/', [CompanyController::class, 'index']);
    Route::post('/', [CompanyController::class, 'store']);
    Route::get('/{company}', [CompanyController::class, 'show']);
    Route::put('/{company}', [CompanyController::class, 'update']);
    Route::delete('/{company}', [CompanyController::class, 'destroy']);

    // Status toggle (non-destructive, allowed as PATCH)
    Route::patch('/{company}/toggle-status', [CompanyController::class, 'toggleStatus']);
});
