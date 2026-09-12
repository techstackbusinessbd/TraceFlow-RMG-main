<?php

namespace App\Domains\MasterData\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\SizeScale;
use App\Domains\MasterData\Requests\StoreSizeScaleRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SizeScaleController extends Controller
{
    /**
     * Display a listing of Size Scales.
     * GET /api/v1/size-scales
     */
    public function index(Request $request): JsonResponse
    {
        $query = SizeScale::with(['entries', 'company:id,code,name']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($companyId = $request->query('company_id')) {
            $query->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)->orWhereNull('company_id');
            });
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        $status = $request->query('status');
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $sortField = $request->query('sort_by', 'created_at');
        $sortDirection = strtolower($request->query('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['name', 'code', 'category', 'is_active', 'created_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        $perPage = (int) $request->query('per_page', 25);
        $scales = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $scales->items(),
            'meta'    => [
                'current_page' => $scales->currentPage(),
                'last_page'    => $scales->lastPage(),
                'per_page'     => $scales->perPage(),
                'total'        => $scales->total(),
            ],
        ]);
    }

    /**
     * Store a newly created Size Scale.
     * POST /api/v1/size-scales
     */
    public function store(StoreSizeScaleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $scale = DB::transaction(function () use ($validated) {
            $companyId = $validated['company_id'] ?? null;
            $company = $companyId ? Company::find($companyId) : Company::where('code', '!=', 'PLT')->first();
            $prefix = $company ? strtoupper($company->code) : 'AWL';

            $lastScale = SizeScale::withTrashed()
                ->where('code', 'like', "{$prefix}-SZS-%")
                ->orderByRaw('LENGTH(code) DESC, code DESC')
                ->lockForUpdate()
                ->first();

            $nextNum = 1;
            if ($lastScale && preg_match('/-(\d+)$/', $lastScale->code, $m)) {
                $nextNum = ((int) $m[1]) + 1;
            }
            $code = sprintf('%s-SZS-%02d', $prefix, $nextNum);

            $scale = SizeScale::create([
                'company_id'  => $companyId,
                'code'        => $code,
                'name'        => $validated['name'],
                'category'    => $validated['category'],
                'description' => $validated['description'] ?? null,
                'is_active'   => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['entries'] as $idx => $sizeName) {
                $scale->entries()->create([
                    'size_name'  => trim($sizeName),
                    'sort_order' => $idx + 1,
                ]);
            }

            return $scale->load('entries');
        });

        return response()->json([
            'success' => true,
            'message' => 'Size Scale created successfully.',
            'data'    => $scale,
        ], 201);
    }

    /**
     * Display the specified Size Scale.
     * GET /api/v1/size-scales/{id}
     */
    public function show(string $id): JsonResponse
    {
        $scale = SizeScale::with('entries')
            ->where('id', $id)
            ->orWhere('uuid', $id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data'    => $scale,
        ]);
    }

    /**
     * Update the specified Size Scale.
     * PUT /api/v1/size-scales/{id}
     */
    public function update(StoreSizeScaleRequest $request, string $id): JsonResponse
    {
        $scale = SizeScale::where('id', $id)->orWhere('uuid', $id)->firstOrFail();
        $validated = $request->validated();

        DB::transaction(function () use ($scale, $validated) {
            $scale->update([
                'name'        => $validated['name'],
                'category'    => $validated['category'],
                'description' => $validated['description'] ?? null,
                'is_active'   => $validated['is_active'] ?? $scale->is_active,
            ]);

            if (isset($validated['entries'])) {
                $scale->entries()->delete();
                foreach ($validated['entries'] as $idx => $sizeName) {
                    $scale->entries()->create([
                        'size_name'  => trim($sizeName),
                        'sort_order' => $idx + 1,
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Size Scale updated successfully.',
            'data'    => $scale->fresh('entries'),
        ]);
    }

    /**
     * Remove the specified Size Scale.
     * DELETE /api/v1/size-scales/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $scale = SizeScale::where('id', $id)->orWhere('uuid', $id)->firstOrFail();
        $scale->delete();

        return response()->json([
            'success' => true,
            'message' => 'Size Scale deleted successfully.',
        ]);
    }
}
