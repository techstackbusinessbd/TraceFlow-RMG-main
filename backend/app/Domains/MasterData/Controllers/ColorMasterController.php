<?php

namespace App\Domains\MasterData\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ColorMaster;
use App\Domains\MasterData\Requests\StoreColorMasterRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ColorMasterController extends Controller
{
    /**
     * Fast Lookup / Auto-completion API for Color Library.
     * GET /api/v1/colors/lookup
     */
    public function lookup(Request $request): JsonResponse
    {
        $query = ColorMaster::where('is_active', true);

        if ($q = $request->query('query')) {
            $query->where(function ($b) use ($q) {
                $b->where('color_name', 'like', "%{$q}%")
                  ->orWhere('color_code', 'like', "%{$q}%")
                  ->orWhere('pantone_ref', 'like', "%{$q}%");
            });
        }

        if ($buyerId = $request->query('buyer_id')) {
            $query->where(function ($b) use ($buyerId) {
                $b->where('buyer_id', $buyerId)->orWhereNull('buyer_id');
            });
        }

        $colors = $query->orderBy('color_name', 'asc')->limit(30)->get();

        return response()->json([
            'success' => true,
            'data'    => $colors,
        ]);
    }

    /**
     * Store or get existing color in Master Library.
     * POST /api/v1/colors
     */
    public function store(StoreColorMasterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $color = ColorMaster::updateOrCreate(
            [
                'color_code' => trim($validated['color_code']),
                'company_id' => $validated['company_id'] ?? null,
                'buyer_id'   => $validated['buyer_id'] ?? null,
            ],
            [
                'color_name'  => trim($validated['color_name']),
                'pantone_ref' => isset($validated['pantone_ref']) ? trim($validated['pantone_ref']) : null,
                'hex_code'    => $validated['hex_code'] ?? null,
                'is_active'   => $validated['is_active'] ?? true,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Color saved to master library.',
            'data'    => $color,
        ], 201);
    }
}
