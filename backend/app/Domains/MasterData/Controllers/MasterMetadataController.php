<?php

namespace App\Domains\MasterData\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class MasterMetadataController extends Controller
{
    /**
     * Retrieve centralized RMG master metadata dictionary.
     * GET /api/v1/master/metadata
     */
    public function index(): JsonResponse
    {
        // Cache master metadata for 24 hours (86400 seconds)
        $metadata = Cache::remember('rmg_master_metadata', 86400, function () {
            return [
                'woven_categories' => config('rmg_master.woven_categories', []),
                'category_items' => config('rmg_master.category_items', []),
                'garment_items' => config('rmg_master.garment_items', []),
                'fabric_constructions' => config('rmg_master.fabric_constructions', []),
                'wash_types' => config('rmg_master.wash_types', []),
                'seasons' => config('rmg_master.seasons', []),
                'size_scales' => config('rmg_master.size_scales', []),
                'payment_terms' => config('rmg_master.payment_terms', []),
                'uom_scales' => config('rmg_master.uom_scales', []),
                'style_statuses' => config('rmg_master.style_statuses', []),
            ];
        });

        return response()->json([
            'status' => 'success',
            'message' => 'RMG master metadata retrieved successfully.',
            'data' => $metadata,
        ]);
    }
}
