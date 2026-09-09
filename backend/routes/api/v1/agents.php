<?php

use App\Domains\MasterData\Controllers\AgentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Buying Agent / Buying House Directory Routes (API v1)
|--------------------------------------------------------------------------
| Sanctum-protected routes for Buying Agents CRUD.
| Zero-Trust Spatie permission middleware enforced on every route.
*/

Route::middleware('auth:sanctum')->prefix('agents')->group(function () {
    // Next system-generated code preview
    Route::get('/next-code', [AgentController::class, 'nextCode'])
        ->middleware('permission:master_data.agents.profile.create');

    // Standard CRUD
    Route::get('/', [AgentController::class, 'index'])
        ->middleware('permission:master_data.agents.profile.view');
    Route::post('/', [AgentController::class, 'store'])
        ->middleware('permission:master_data.agents.profile.create');
    Route::get('/{agent}', [AgentController::class, 'show'])
        ->middleware('permission:master_data.agents.profile.view');
    Route::put('/{agent}', [AgentController::class, 'update'])
        ->middleware('permission:master_data.agents.profile.update');
    Route::delete('/{agent}', [AgentController::class, 'destroy'])
        ->middleware('permission:master_data.agents.profile.delete');

    // Status toggle (PATCH)
    Route::patch('/{agent}/toggle-status', [AgentController::class, 'toggleStatus'])
        ->middleware('permission:master_data.agents.profile.update');
});
