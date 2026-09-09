<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — TraceFlow RMG Enterprise Gateway
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    require __DIR__ . '/api/v1/auth.php';
    require __DIR__ . '/api/v1/companies.php';
    require __DIR__ . '/api/v1/users.php';
    require __DIR__ . '/api/v1/roles.php';
    require __DIR__ . '/api/v1/agents.php';
    require __DIR__ . '/api/v1/buyers.php';
    require __DIR__ . '/api/v1/styles.php';
});
