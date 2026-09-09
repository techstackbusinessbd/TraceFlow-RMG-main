<?php

use App\Domains\MasterData\Controllers\StyleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Woven Style Library Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for Woven Style CRUD, Colorways & Size Scale.
| Zero-Trust Spatie permission middleware enforced on every route.
*/

Route::middleware('auth:sanctum')->prefix('styles')->group(function () {
    // Next system-generated style code preview
    Route::get('/next-code', [StyleController::class, 'nextCode'])
        ->middleware('permission:master_data.styles.profile.create');

    // Fetch active styles for a specific buyer (Dropdown optimization)
    Route::get('/by-buyer/{buyerId}', [StyleController::class, 'byBuyer'])
        ->middleware('permission:master_data.styles.profile.view');

    // Standard CRUD
    Route::get('/', [StyleController::class, 'index'])
        ->middleware('permission:master_data.styles.profile.view');
    Route::post('/', [StyleController::class, 'store'])
        ->middleware('permission:master_data.styles.profile.create');
    Route::get('/{style}', [StyleController::class, 'show'])
        ->middleware('permission:master_data.styles.profile.view');
    Route::put('/{style}', [StyleController::class, 'update'])
        ->middleware('permission:master_data.styles.profile.update');
    Route::delete('/{style}', [StyleController::class, 'destroy'])
        ->middleware('permission:master_data.styles.profile.delete');

    // Status toggle (PATCH)
    Route::patch('/{style}/toggle-status', [StyleController::class, 'toggleStatus'])
        ->middleware('permission:master_data.styles.profile.update');
});
