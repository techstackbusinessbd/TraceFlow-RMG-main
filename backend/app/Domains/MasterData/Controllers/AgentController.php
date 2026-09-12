<?php

namespace App\Domains\MasterData\Controllers;

use App\Domains\MasterData\Requests\StoreAgentRequest;
use App\Domains\MasterData\Requests\UpdateAgentRequest;
use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    /**
     * Display a paginated, searchable, and filterable list of Buying Agents.
     * GET /api/v1/agents
     */
    public function index(Request $request): JsonResponse
    {
        $query = Agent::query()->with(['company:id,code,name'])->withCount(['buyers', 'activeBuyers']);

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
        $allowedSorts = ['id', 'code', 'name', 'country', 'contact_person', 'email', 'commission_rate', 'is_active', 'created_at', 'buyers_count'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('name', 'asc');
        }

        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 25, 50, 100], true) ? $perPage : 10;

        $agents = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $agents->items(),
            'pagination' => [
                'current_page' => $agents->currentPage(),
                'last_page' => $agents->lastPage(),
                'per_page' => $agents->perPage(),
                'total' => $agents->total(),
                'from' => $agents->firstItem() ?? 0,
                'to' => $agents->lastItem() ?? 0,
            ],
        ]);
    }

    /**
     * Preview the next auto-generated Agent Code for a company.
     * GET /api/v1/agents/next-code
     */
    public function nextCode(Request $request): JsonResponse
    {
        $companyId = $request->query('company_id');
        $company = $companyId ? Company::find($companyId) : Company::where('is_default', true)->first();

        if (!$company) {
            $company = Company::first();
        }

        $companyCode = $company ? $company->code : 'CMP';
        $nextCode = $this->generateNextAgentCode($companyCode);

        return response()->json([
            'status' => 'success',
            'data' => [
                'next_code' => $nextCode,
                'company_code' => $companyCode,
            ],
        ]);
    }

    /**
     * Store a newly created Agent.
     * POST /api/v1/agents
     */
    public function store(StoreAgentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $company = Company::findOrFail($validated['company_id']);

        return DB::transaction(function () use ($validated, $company) {
            $autoCode = $this->generateNextAgentCode($company->code);

            $agent = Agent::create([
                'company_id'      => $company->id,
                'code'            => $autoCode,
                'name'            => trim($validated['name']),
                'country'         => trim($validated['country']),
                'contact_person'  => $validated['contact_person'] ?? null,
                'email'           => $validated['email'] ?? null,
                'phone'           => $validated['phone'] ?? null,
                'address'         => $validated['address'] ?? null,
                'commission_rate' => $validated['commission_rate'] ?? null,
                'is_active'       => $validated['is_active'] ?? true,
            ]);

            $agent->load(['company:id,code,name']);

            return response()->json([
                'status' => 'success',
                'message' => "Buying Agent '{$agent->name}' ({$agent->code}) created successfully.",
                'data' => $agent,
            ], 201);
        });
    }

    /**
    /**
     * Resolve agent by UUID or fallback ID.
     */
     private function resolveAgent(string|int $identifier): Agent
     {
         if (is_numeric($identifier)) {
             return Agent::where('id', (int) $identifier)->firstOrFail();
         }

         if (Str::isUuid((string) $identifier)) {
             return Agent::where('uuid', (string) $identifier)->firstOrFail();
         }

         return Agent::where('code', (string) $identifier)->firstOrFail();
     }

    /**
     * Display a specific Agent with its associated buyers.
     * GET /api/v1/agents/{agent}
     */
    public function show(string|int $id): JsonResponse
    {
        $query = Agent::with(['company:id,code,name', 'buyers:id,uuid,company_id,agent_id,code,name,country,is_active']);

        if (is_numeric($id)) {
            $agent = $query->where('id', (int) $id)->firstOrFail();
        } elseif (Str::isUuid((string) $id)) {
            $agent = $query->where('uuid', (string) $id)->firstOrFail();
        } else {
            $agent = $query->where('code', (string) $id)->firstOrFail();
        }

        return response()->json([
            'status' => 'success',
            'data' => $agent,
        ]);
    }

    /**
     * Update an existing Agent.
     * PUT /api/v1/agents/{agent}
     */
    public function update(UpdateAgentRequest $request, string|int $id): JsonResponse
    {
        $agent = $this->resolveAgent($id);
        $validated = $request->validated();

        $updateData = [
            'name'            => trim($validated['name']),
            'country'         => trim($validated['country']),
            'contact_person'  => $validated['contact_person'] ?? null,
            'email'           => $validated['email'] ?? null,
            'phone'           => $validated['phone'] ?? null,
            'address'         => $validated['address'] ?? null,
            'commission_rate' => $validated['commission_rate'] ?? null,
            'is_active'       => $validated['is_active'] ?? $agent->is_active,
        ];

        // Only superadmin can reassign company_id
        if (isset($validated['company_id']) && (int) $validated['company_id'] !== (int) $agent->company_id) {
            $user = $request->user();
            $isSuperAdmin = $user && ($user->hasRole('superadmin') || $user->roles()->where('name', 'superadmin')->exists());
            if ($isSuperAdmin) {
                $newCompany = Company::findOrFail($validated['company_id']);
                $updateData['company_id'] = $newCompany->id;
                $updateData['code'] = $this->generateNextAgentCode($newCompany->code);
            }
        }

        $agent->update($updateData);

        $agent->load(['company:id,code,name', 'buyers']);

        return response()->json([
            'status' => 'success',
            'message' => "Buying Agent '{$agent->name}' updated successfully.",
            'data' => $agent,
        ]);
    }

    /**
     * Delete an Agent (Soft delete).
     * DELETE /api/v1/agents/{agent}
     */
    public function destroy(string|int $id): JsonResponse
    {
        $query = Agent::withCount('buyers');

        if (is_numeric($id)) {
            $agent = $query->where('id', (int) $id)->firstOrFail();
        } elseif (Str::isUuid((string) $id)) {
            $agent = $query->where('uuid', (string) $id)->firstOrFail();
        } else {
            $agent = $query->where('code', (string) $id)->firstOrFail();
        }

        if ($agent->buyers_count > 0) {
            return response()->json([
                'status' => 'error',
                'message' => "Cannot delete Buying Agent '{$agent->name}' because it is linked to {$agent->buyers_count} registered buyer(s).",
            ], 422);
        }

        $agent->delete();

        return response()->json([
            'status' => 'success',
            'message' => "Buying Agent '{$agent->name}' ({$agent->code}) deleted successfully.",
        ]);
    }

    /**
     * Toggle Agent Active Status.
     * PATCH /api/v1/agents/{agent}/toggle-status
     */
    public function toggleStatus(string|int $id): JsonResponse
    {
        $agent = $this->resolveAgent($id);
        $agent->is_active = !$agent->is_active;
        $agent->save();

        $statusLabel = $agent->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'status' => 'success',
            'message' => "Buying Agent '{$agent->name}' {$statusLabel} successfully.",
            'data' => [
                'id' => $agent->id,
                'uuid' => $agent->uuid,
                'is_active' => $agent->is_active,
            ],
        ]);
    }

    /**
     * Generate the next intelligent sequential Agent Code: {COMPANY_CODE}-AGT-{001}
     */
    private function generateNextAgentCode(string $companyCode): string
    {
        $prefix = strtoupper(trim($companyCode)) . '-AGT-';

        $latestAgent = Agent::withTrashed()
            ->where('code', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if (!$latestAgent) {
            return "{$prefix}001";
        }

        $numPart = (int) substr($latestAgent->code, strlen($prefix));
        $nextSeq = str_pad((string) ($numPart + 1), 3, '0', STR_PAD_LEFT);

        return "{$prefix}{$nextSeq}";
    }
}
