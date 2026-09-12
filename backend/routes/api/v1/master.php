<?php

use App\Domains\MasterData\Controllers\MasterMetadataController;
use App\Domains\MasterData\Controllers\SizeScaleController;
use App\Domains\MasterData\Controllers\ColorMasterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| RMG Master Metadata Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for central enterprise dictionary & options.
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('master')->group(function () {
        Route::get('/metadata', [MasterMetadataController::class, 'index']);
    });

    // Size Scale Master CRUD
    Route::apiResource('size-scales', SizeScaleController::class);

    // Color Library Master Lookup & Store
    Route::get('colors/lookup', [ColorMasterController::class, 'lookup']);
    Route::post('colors', [ColorMasterController::class, 'store']);

    // Centralized Navigation Catalog
    Route::get('navigation/catalog', [\App\Domains\MasterData\Controllers\NavigationCatalogController::class, 'index']);
});
