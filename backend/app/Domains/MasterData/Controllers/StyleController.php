<?php

namespace App\Domains\MasterData\Controllers;

use App\Domains\MasterData\Requests\StoreStyleRequest;
use App\Domains\MasterData\Requests\UpdateStyleRequest;
use App\Http\Controllers\Controller;
use App\Models\Buyer;
use App\Models\Company;
use App\Models\Style;
use App\Models\StyleColor;
use App\Models\StyleSize;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StyleController extends Controller
{
    /**
     * Helper to resolve Style by UUID or integer ID.
     */
    private function resolveStyle(string|int $identifier): Style
    {
        return Style::where('uuid', $identifier)
            ->orWhere('id', is_numeric($identifier) ? (int)$identifier : 0)
            ->firstOrFail();
    }

    /**
     * Generate the next intelligent sequential Style Code for a company.
     * Formula: [CompanyShortCode]-STY-[YY]-[SequentialNumber]
     * e.g. AWL-STY-26-0001
     * GET /api/v1/styles/next-code
     */
    public function nextCode(Request $request): JsonResponse
    {
        $companyId = $request->query('company_id');
        $company = $companyId ? Company::find($companyId) : Company::where('is_default', true)->first();

        if (!$company) {
            $company = Company::first();
        }

        $shortCode = $company ? strtoupper($company->code) : 'AWL';
        $year = date('y'); // 2-digit year (e.g. 26)
        $prefix = "{$shortCode}-STY-{$year}-";

        // Query max sequential code matching prefix
        $lastStyle = Style::withTrashed()
            ->where('code', 'like', "{$prefix}%")
            ->orderByRaw('LENGTH(code) DESC, code DESC')
            ->first();

        $nextNumber = 1;
        if ($lastStyle && preg_match('/-(\d+)$/', $lastStyle->code, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        $code = $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $code,
                'company_id' => $company ? $company->id : 1,
                'company_code' => $shortCode,
            ],
        ]);
    }

    /**
     * Display a paginated, searchable, and filterable list of Woven Styles.
     * GET /api/v1/styles
     */
    public function index(Request $request): JsonResponse
    {
        $query = Style::query()
            ->with([
                'company:id,code,name',
                'buyer:id,uuid,code,name',
                'brand:id,uuid,name',
                'colors',
                'sizes',
            ])
            ->withCount(['colors', 'sizes']);

        // Search Filter
        if ($search = trim($request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                  ->orWhere('buyer_style_no', 'ilike', "%{$search}%")
                  ->orWhere('style_name', 'ilike', "%{$search}%")
                  ->orWhere('garment_item', 'ilike', "%{$search}%")
                  ->orWhere('fabric_type', 'ilike', "%{$search}%")
                  ->orWhere('season', 'ilike', "%{$search}%")
                  ->orWhereHas('buyer', function ($bq) use ($search) {
                      $bq->where('name', 'ilike', "%{$search}%")
                         ->orWhere('code', 'ilike', "%{$search}%");
                  });
            });
        }

        // Company Filter
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        // Buyer Filter
        if ($buyerId = $request->query('buyer_id')) {
            if (!is_numeric($buyerId)) {
                $buyer = Buyer::where('uuid', $buyerId)->first();
                $buyerId = $buyer ? $buyer->id : 0;
            }
            $query->where('buyer_id', $buyerId);
        }

        // Product Category Filter
        if ($category = $request->query('product_category')) {
            $query->where('product_category', $category);
        }

        // Season Filter
        if ($season = $request->query('season')) {
            $query->where('season', $season);
        }

        // Wash Type Filter
        if ($washType = $request->query('wash_type')) {
            $query->where('wash_type', $washType);
        }

        // Status Filter
        $status = $request->query('status');
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status && in_array($status, ['Development', 'Sampling', 'Confirmed', 'Bulk_Approved', 'Discontinued'])) {
            $query->where('status', $status);
        }

        // Sorting
        $allowedSorts = ['code', 'buyer_style_no', 'style_name', 'season', 'base_smv', 'is_active', 'created_at'];
        $sortField = $request->query('sort_by', 'created_at');
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir);
        } else {
            $query->latest();
        }

        $perPage = max(5, min(100, (int) $request->query('per_page', 15)));
        $styles = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $styles->items(),
            'meta' => [
                'current_page' => $styles->currentPage(),
                'last_page'    => $styles->lastPage(),
                'per_page'     => $styles->perPage(),
                'total'        => $styles->total(),
            ],
        ]);
    }

    /**
     * Store a newly created Woven Style along with colorways and size scale.
     * POST /api/v1/styles
     */
    public function store(StoreStyleRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $style = DB::transaction(function () use ($validated, $request) {
            $company = Company::findOrFail($validated['company_id']);
            $shortCode = strtoupper($company->code);
            $year = date('y');
            $prefix = "{$shortCode}-STY-{$year}-";

            // Determine unique code
            $lastStyle = Style::withTrashed()
                ->where('code', 'like', "{$prefix}%")
                ->orderByRaw('LENGTH(code) DESC, code DESC')
                ->lockForUpdate()
                ->first();

            $nextNumber = 1;
            if ($lastStyle && preg_match('/-(\d+)$/', $lastStyle->code, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }
            $code = $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);

            $styleData = collect($validated)->except(['colors', 'sizes'])->all();
            $styleData['code'] = $code;

            $style = Style::create($styleData);

            // Persist Colors
            if (!empty($validated['colors'])) {
                foreach ($validated['colors'] as $color) {
                    $style->colors()->create([
                        'color_code'  => trim($color['color_code']),
                        'color_name'  => trim($color['color_name']),
                        'pantone_ref' => isset($color['pantone_ref']) ? trim($color['pantone_ref']) : null,
                        'hex_code'    => isset($color['hex_code']) ? trim($color['hex_code']) : null,
                        'is_active'   => true,
                    ]);
                }
            }

            // Persist Sizes
            if (!empty($validated['sizes'])) {
                foreach ($validated['sizes'] as $idx => $size) {
                    $style->sizes()->create([
                        'size_name'  => trim($size['size_name']),
                        'sort_order' => isset($size['sort_order']) ? (int)$size['sort_order'] : $idx + 1,
                        'is_active'  => true,
                    ]);
                }
            }

            return $style;
        });

        $style->load(['company:id,code,name', 'buyer:id,uuid,code,name', 'brand:id,uuid,name', 'colors', 'sizes']);

        return response()->json([
            'success' => true,
            'message' => "Woven Style '{$style->style_name}' created successfully with code {$style->code}.",
            'data' => $style,
        ], 201);
    }

    /**
     * Display the specified Woven Style.
     * GET /api/v1/styles/{style}
     */
    public function show(string|int $id): JsonResponse
    {
        $style = $this->resolveStyle($id);
        $style->load([
            'company:id,code,name',
            'buyer:id,uuid,code,name,country',
            'brand:id,uuid,name',
            'colors',
            'sizes',
        ]);

        return response()->json([
            'success' => true,
            'data' => $style,
        ]);
    }

    /**
     * Update the specified Woven Style.
     * PUT /api/v1/styles/{style}
     */
    public function update(UpdateStyleRequest $request, string|int $id): JsonResponse
    {
        $style = $this->resolveStyle($id);
        $validated = $request->validated();

        DB::transaction(function () use ($style, $validated) {
            $styleData = collect($validated)->except(['colors', 'sizes'])->all();
            $style->update($styleData);

            // Sync Colors if provided
            if (isset($validated['colors'])) {
                $style->colors()->delete();
                foreach ($validated['colors'] as $color) {
                    $style->colors()->create([
                        'color_code'  => trim($color['color_code']),
                        'color_name'  => trim($color['color_name']),
                        'pantone_ref' => isset($color['pantone_ref']) ? trim($color['pantone_ref']) : null,
                        'hex_code'    => isset($color['hex_code']) ? trim($color['hex_code']) : null,
                        'is_active'   => true,
                    ]);
                }
            }

            // Sync Sizes if provided
            if (isset($validated['sizes'])) {
                $style->sizes()->delete();
                foreach ($validated['sizes'] as $idx => $size) {
                    $style->sizes()->create([
                        'size_name'  => trim($size['size_name']),
                        'sort_order' => isset($size['sort_order']) ? (int)$size['sort_order'] : $idx + 1,
                        'is_active'  => true,
                    ]);
                }
            }
        });

        $style->load(['company:id,code,name', 'buyer:id,uuid,code,name', 'brand:id,uuid,name', 'colors', 'sizes']);

        return response()->json([
            'success' => true,
            'message' => "Woven Style '{$style->style_name}' updated successfully.",
            'data' => $style,
        ]);
    }

    /**
     * Remove the specified Woven Style (soft delete).
     * DELETE /api/v1/styles/{style}
     */
    public function destroy(string|int $id): JsonResponse
    {
        $style = $this->resolveStyle($id);
        $style->delete();

        return response()->json([
            'success' => true,
            'message' => "Woven Style '{$style->code}' deleted successfully.",
        ]);
    }

    /**
     * Toggle the operational status of a Woven Style.
     * PATCH /api/v1/styles/{style}/toggle-status
     */
    public function toggleStatus(string|int $id): JsonResponse
    {
        $style = $this->resolveStyle($id);
        $style->is_active = !$style->is_active;
        $style->save();

        $statusText = $style->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'success' => true,
            'message' => "Woven Style '{$style->code}' has been {$statusText}.",
            'data' => [
                'id' => $style->id,
                'uuid' => $style->uuid,
                'is_active' => $style->is_active,
            ],
        ]);
    }

    /**
     * Fetch active styles for a specific buyer (Dropdown optimization).
     * GET /api/v1/styles/by-buyer/{buyerId}
     */
    public function byBuyer(string|int $buyerId): JsonResponse
    {
        $buyer = is_numeric($buyerId)
            ? Buyer::find($buyerId)
            : Buyer::where('uuid', $buyerId)->first();

        if (!$buyer) {
            return response()->json(['success' => false, 'data' => []], 404);
        }

        $styles = Style::where('buyer_id', $buyer->id)
            ->where('is_active', true)
            ->with(['colors:id,style_id,color_code,color_name', 'sizes:id,style_id,size_name,sort_order'])
            ->select(['id', 'uuid', 'code', 'buyer_style_no', 'style_name', 'product_category', 'base_smv', 'season'])
            ->orderBy('buyer_style_no')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $styles,
        ]);
    }
}
