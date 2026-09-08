<?php

namespace App\Domains\MasterData\Controllers;

use App\Domains\MasterData\Requests\StoreBuyerRequest;
use App\Domains\MasterData\Requests\UpdateBuyerRequest;
use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Buyer;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BuyerController extends Controller
{
    /**
     * Display a paginated, searchable, and filterable list of Buyers.
     * GET /api/v1/buyers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Buyer::query()->with(['company:id,code,name'])->withCount(['brands', 'activeBrands']);

        // Search Filter
        if ($search = trim($request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                  ->orWhere('name', 'ilike', "%{$search}%")
                  ->orWhere('country', 'ilike', "%{$search}%")
                  ->orWhere('contact_person', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        // Company Filter
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        // Status Filter
        $status = $request->query('status');
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        // Sorting
        $sortField = $request->query('sort_field', 'name');
        $sortDirection = strtolower($request->query('sort_direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $allowedSorts = ['id', 'code', 'name', 'country', 'contact_person', 'email', 'is_active', 'created_at', 'brands_count'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 25, 50, 100], true) ? $perPage : 10;

        $buyers = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $buyers->items(),
            'pagination' => [
                'current_page' => $buyers->currentPage(),
                'last_page' => $buyers->lastPage(),
                'per_page' => $buyers->perPage(),
                'total' => $buyers->total(),
                'from' => $buyers->firstItem() ?? 0,
                'to' => $buyers->lastItem() ?? 0,
            ],
        ]);
    }

    /**
     * Preview the next system auto-generated Buyer Code for a company.
     * GET /api/v1/buyers/next-code?company_id={id}
     */
    public function nextCode(Request $request): JsonResponse
    {
        $companyId = $request->query('company_id');
        $company = Company::find($companyId);

        if (!$company) {
            $company = Company::where('is_default', true)->first() ?? Company::first();
        }

        $nextCode = $this->generateNextBuyerCode($company ? $company->code : 'TF');

        return response()->json([
            'status' => 'success',
            'data' => [
                'next_code' => $nextCode,
                'company_code' => $company ? $company->code : 'TF',
            ],
        ]);
    }

    /**
     * Store a newly created Buyer with optional nested brands.
     * POST /api/v1/buyers
     */
    public function store(StoreBuyerRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $company = Company::findOrFail($validated['company_id']);

        return DB::transaction(function () use ($validated, $company) {
            $autoCode = $this->generateNextBuyerCode($company->code);

            $buyer = Buyer::create([
                'company_id'     => $company->id,
                'code'           => $autoCode,
                'name'           => trim($validated['name']),
                'country'        => trim($validated['country']),
                'contact_person' => $validated['contact_person'] ?? null,
                'email'          => $validated['email'] ?? null,
                'phone'          => $validated['phone'] ?? null,
                'address'        => $validated['address'] ?? null,
                'payment_terms'  => $validated['payment_terms'] ?? null,
                'is_active'      => $validated['is_active'] ?? true,
            ]);

            // Create associated brands if provided
            if (!empty($validated['brands']) && is_array($validated['brands'])) {
                foreach ($validated['brands'] as $brandData) {
                    if (!empty($brandData['name'])) {
                        $buyer->brands()->create([
                            'name'      => trim($brandData['name']),
                            'code'      => $brandData['code'] ?? null,
                            'is_active' => true,
                        ]);
                    }
                }
            }

            $buyer->load(['company:id,code,name', 'brands']);

            return response()->json([
                'status' => 'success',
                'message' => "Buyer '{$buyer->name}' ({$buyer->code}) created successfully.",
                'data' => $buyer,
            ], 201);
        });
    }

    /**
     * Display a specific Buyer with its brands and company.
     * GET /api/v1/buyers/{buyer}
     */
    public function show(int $id): JsonResponse
    {
        $buyer = Buyer::with(['company:id,code,name', 'brands'])->findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $buyer,
        ]);
    }

    /**
     * Update an existing Buyer and sync brands.
     * PUT /api/v1/buyers/{buyer}
     */
    public function update(UpdateBuyerRequest $request, int $id): JsonResponse
    {
        $buyer = Buyer::findOrFail($id);
        $validated = $request->validated();

        return DB::transaction(function () use ($buyer, $validated) {
            $buyer->update([
                'name'           => trim($validated['name']),
                'country'        => trim($validated['country']),
                'contact_person' => $validated['contact_person'] ?? null,
                'email'          => $validated['email'] ?? null,
                'phone'          => $validated['phone'] ?? null,
                'address'        => $validated['address'] ?? null,
                'payment_terms'  => $validated['payment_terms'] ?? null,
                'is_active'      => $validated['is_active'] ?? $buyer->is_active,
            ]);

            // Sync brands if passed
            if (isset($validated['brands']) && is_array($validated['brands'])) {
                $existingBrandIds = [];
                foreach ($validated['brands'] as $brandData) {
                    if (!empty($brandData['id'])) {
                        $brand = Brand::where('buyer_id', $buyer->id)->find($brandData['id']);
                        if ($brand) {
                            $brand->update([
                                'name' => trim($brandData['name']),
                                'code' => $brandData['code'] ?? $brand->code,
                            ]);
                            $existingBrandIds[] = $brand->id;
                        }
                    } else if (!empty($brandData['name'])) {
                        $newBrand = $buyer->brands()->create([
                            'name' => trim($brandData['name']),
                            'code' => $brandData['code'] ?? null,
                            'is_active' => true,
                        ]);
                        $existingBrandIds[] = $newBrand->id;
                    }
                }
                // Soft delete removed brands
                $buyer->brands()->whereNotIn('id', $existingBrandIds)->delete();
            }

            $buyer->load(['company:id,code,name', 'brands']);

            return response()->json([
                'status' => 'success',
                'message' => "Buyer '{$buyer->name}' updated successfully.",
                'data' => $buyer,
            ]);
        });
    }

    /**
     * Soft delete a Buyer.
     * DELETE /api/v1/buyers/{buyer}
     */
    public function destroy(int $id): JsonResponse
    {
        $buyer = Buyer::findOrFail($id);
        $buyerName = $buyer->name;
        $buyer->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Buyer '{$buyerName}' soft-deleted successfully.",
        ]);
    }

    /**
     * Toggle active/inactive status.
     * PATCH /api/v1/buyers/{buyer}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $buyer = Buyer::findOrFail($id);
        $buyer->is_active = !$buyer->is_active;
        $buyer->save();

        $statusText = $buyer->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'status' => 'success',
            'message' => "Buyer '{$buyer->name}' {$statusText} successfully.",
            'data' => [
                'id' => $buyer->id,
                'is_active' => $buyer->is_active,
            ],
        ]);
    }

    /**
     * Helper to compute next code: e.g. AWL-BYR-001
     */
    private function generateNextBuyerCode(string $companyCode): string
    {
        $prefix = strtoupper(trim($companyCode)) . '-BYR-';
        $latest = Buyer::withTrashed()
            ->where('code', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest && preg_match('/' . preg_quote($prefix, '/') . '(\d+)/', $latest->code, $matches)) {
            $nextSeq = (int) $matches[1] + 1;
        } else {
            $nextSeq = 1;
        }

        $code = $prefix . str_pad((string) $nextSeq, 3, '0', STR_PAD_LEFT);

        // Guarantee collision safety
        while (Buyer::withTrashed()->where('code', $code)->exists()) {
            $nextSeq++;
            $code = $prefix . str_pad((string) $nextSeq, 3, '0', STR_PAD_LEFT);
        }

        return $code;
    }
}
