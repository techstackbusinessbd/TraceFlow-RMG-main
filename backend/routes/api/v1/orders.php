<?php

use App\Domains\Order\Controllers\PurchaseOrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Next sequential intelligent entity code preview
    Route::get('/orders/next-code', [PurchaseOrderController::class, 'nextCode']);

    // Download dynamic pre-filled Excel template for specific Style
    Route::get('/orders/template/{style}', [PurchaseOrderController::class, 'downloadTemplate']);

    // Upload & attach buyer purchase order document (PDF, Excel, Image)
    Route::post('/orders/upload-document', [PurchaseOrderController::class, 'uploadDocument']);

    // Parse uploaded PO file (.xlsx, .csv, .pdf) for auto-fill & verification
    Route::post('/orders/parse-file', [PurchaseOrderController::class, 'parseFile']);

    // Batch store multiple Purchase Orders from multi-PO sheet
    Route::post('/orders/batch-store', [PurchaseOrderController::class, 'batchStore']);

    // Dedicated Purchase Orders RESTful CRUD
    Route::apiResource('orders', PurchaseOrderController::class);
});
