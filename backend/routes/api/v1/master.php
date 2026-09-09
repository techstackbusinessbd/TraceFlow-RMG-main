<?php

use App\Domains\MasterData\Controllers\MasterMetadataController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| RMG Master Metadata Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for central enterprise dictionary & options.
*/

Route::middleware('auth:sanctum')->prefix('master')->group(function () {
    Route::get('/metadata', [MasterMetadataController::class, 'index']);
});
