<?php

use App\Domains\MasterData\Controllers\BuyerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Buyer & Brand Directory Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for Buyers CRUD & Brand association.
| Zero-Trust Spatie permission middleware enforced on every route.
*/

Route::middleware('auth:sanctum')->prefix('buyers')->group(function () {
    // Next system-generated code preview
    Route::get('/next-code', [BuyerController::class, 'nextCode'])
        ->middleware('permission:master_data.buyers.profile.create');

    // Standard CRUD
    Route::get('/', [BuyerController::class, 'index'])
        ->middleware('permission:master_data.buyers.profile.view');
    Route::post('/', [BuyerController::class, 'store'])
        ->middleware('permission:master_data.buyers.profile.create');
    Route::get('/{buyer}', [BuyerController::class, 'show'])
        ->middleware('permission:master_data.buyers.profile.view');
    Route::put('/{buyer}', [BuyerController::class, 'update'])
        ->middleware('permission:master_data.buyers.profile.update');
    Route::delete('/{buyer}', [BuyerController::class, 'destroy'])
        ->middleware('permission:master_data.buyers.profile.delete');

    // Status toggle (PATCH)
    Route::patch('/{buyer}/toggle-status', [BuyerController::class, 'toggleStatus'])
        ->middleware('permission:master_data.buyers.profile.update');
});
