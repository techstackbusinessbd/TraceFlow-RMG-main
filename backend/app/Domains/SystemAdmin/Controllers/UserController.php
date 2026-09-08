<?php

namespace App\Domains\SystemAdmin\Controllers;

use App\Domains\SystemAdmin\Requests\StoreUserRequest;
use App\Domains\SystemAdmin\Requests\UpdateUserRequest;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a paginated, searchable, filterable and sortable list of Users.
     * GET /api/v1/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with(['company:id,code,name,is_default', 'roles:id,name']);

        // Search Filter (name, username, emp_id, email, phone)
        if ($search = trim($request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('username', 'ilike', "%{$search}%")
                  ->orWhere('emp_id', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('department', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        // Company Filter
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        // Role Filter
        if ($role = $request->query('role')) {
            $query->whereHas('roles', function ($q) use ($role) {
                $q->where('name', $role);
            });
        }

        // Department Filter
        if ($department = $request->query('department')) {
            $query->where('department', $department);
        }

        // Status Filter
        $status = $request->query('status');
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        // Sorting
        $sortField = $request->query('sort_field', 'created_at');
        $sortDirection = strtolower($request->query('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'emp_id', 'name', 'username', 'email', 'department', 'is_active', 'created_at'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = (int) $request->query('per_page', 10);
        $perPage = in_array($perPage, [10, 15, 25, 50, 100], true) ? $perPage : 10;

        $users = $query->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'from' => $users->firstItem() ?? 0,
                'to' => $users->lastItem() ?? 0,
            ],
        ]);
    }

    /**
     * Store a newly created User.
     * POST /api/v1/users
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $roles = $validated['roles'];
        unset($validated['roles']);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = $validated['is_active'] ?? true;

        DB::beginTransaction();
        try {
            $user = User::create($validated);
            $user->syncRoles($roles);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "User account '{$user->username}' created successfully.",
                'data' => $user->load(['company:id,code,name,is_default', 'roles:id,name']),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create user account: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display detailed profile of a specific user.
     * GET /api/v1/users/{id}
     */
    public function show($id): JsonResponse
    {
        $user = User::with(['company:id,code,name,legal_name,is_default', 'roles:id,name'])->findOrFail($id);

        $directPermissions = $user->getDirectPermissions()->pluck('name');
        $rolePermissions = $user->getPermissionsViaRoles()->pluck('name')->unique()->values();

        $userData = $user->toArray();
        $userData['direct_permissions'] = $directPermissions;
        $userData['role_permissions'] = $rolePermissions;
        $userData['all_permissions'] = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'status' => 'success',
            'data' => $userData,
        ]);
    }

    /**
     * Update specified user details.
     * PUT /api/v1/users/{id}
     */
    public function update(UpdateUserRequest $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $validated = $request->validated();
        $roles = $validated['roles'] ?? null;
        unset($validated['roles']);

        // Check if updating password
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
            $validated['password_changed_at'] = now();
        } else {
            unset($validated['password']);
        }

        // Protection: Default Superadmin (username: superadmin) cannot be deactivated
        if ($user->username === 'superadmin' && isset($validated['is_active']) && !$validated['is_active']) {
            return response()->json([
                'status' => 'error',
                'message' => 'The root Super Administrator account is protected and cannot be deactivated.',
                'errors' => [
                    'is_active' => ['The root Super Administrator account cannot be deactivated.'],
                ],
            ], 422);
        }

        // Protection: User cannot deactivate themselves
        if ($request->user() && $request->user()->id === $user->id && isset($validated['is_active']) && !$validated['is_active']) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot deactivate your own account while currently logged in.',
                'errors' => [
                    'is_active' => ['You cannot deactivate your own account.'],
                ],
            ], 422);
        }

        DB::beginTransaction();
        try {
            $user->update($validated);

            if ($roles !== null) {
                // Ensure root superadmin never loses the superadmin role
                if ($user->username === 'superadmin' && !in_array('superadmin', $roles, true)) {
                    $roles[] = 'superadmin';
                }
                $user->syncRoles($roles);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "User account '{$user->username}' updated successfully.",
                'data' => $user->fresh(['company:id,code,name,is_default', 'roles:id,name']),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user account: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Soft delete a user account.
     * DELETE /api/v1/users/{id}
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Protection 1: Root superadmin cannot be deleted
        if ($user->username === 'superadmin') {
            return response()->json([
                'status' => 'error',
                'message' => 'The root Super Administrator account is permanent and cannot be deleted.',
            ], 422);
        }

        // Protection 2: Cannot delete own logged-in account
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot delete your own account while currently logged in.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => "User '{$user->name}' ({$user->username}) deleted successfully.",
        ]);
    }

    /**
     * Toggle active/inactive status.
     * PATCH /api/v1/users/{id}/toggle-status
     */
    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Protection 1: Root superadmin cannot be deactivated
        if ($user->username === 'superadmin' && $user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'The root Super Administrator account cannot be deactivated.',
            ], 422);
        }

        // Protection 2: Cannot deactivate self
        if ($request->user() && $request->user()->id === $user->id && $user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'You cannot deactivate your own account.',
            ], 422);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        $statusText = $user->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'status' => 'success',
            'message' => "User '{$user->name}' {$statusText} successfully.",
            'data' => [
                'id' => $user->id,
                'is_active' => $user->is_active,
            ],
        ]);
    }

    /**
     * Get lookup metadata for User creation/edit (Active Companies & Roles).
     * GET /api/v1/users/meta/roles-companies
     */
    public function metadata(): JsonResponse
    {
        $companies = Company::where('is_active', true)
            ->select('id', 'code', 'name', 'is_default')
            ->orderBy('name', 'asc')
            ->get();

        $roles = Role::select('id', 'name')->orderBy('name', 'asc')->get();

        $departments = User::whereNotNull('department')
            ->select('department')
            ->distinct()
            ->orderBy('department', 'asc')
            ->pluck('department');

        return response()->json([
            'status' => 'success',
            'data' => [
                'companies' => $companies,
                'roles' => $roles,
                'departments' => $departments,
            ],
        ]);
    }

    /**
     * Get user direct and inherited permissions breakdown.
     * GET /api/v1/users/{id}/permissions
     */
    public function getUserPermissions($id): JsonResponse
    {
        $user = User::with(['roles:id,name'])->findOrFail($id);

        $directPermissions = $user->getDirectPermissions()->pluck('name');
        $rolePermissions = $user->getPermissionsViaRoles()->pluck('name')->unique()->values();

        return response()->json([
            'status' => 'success',
            'data' => [
                'user_id' => $user->id,
                'username' => $user->username,
                'name' => $user->name,
                'roles' => $user->roles->pluck('name'),
                'direct_permissions' => $directPermissions,
                'role_permissions' => $rolePermissions,
                'all_permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }

    /**
     * Synchronize custom direct permissions for a specific user.
     * PUT /api/v1/users/{id}/permissions
     */
    public function syncUserPermissions(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Security: Root superadmin permissions cannot be modified
        if ($user->username === 'superadmin') {
            return response()->json([
                'status' => 'error',
                'message' => 'The root Super Administrator automatically possesses all system permissions.',
            ], 422);
        }

        $validated = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $permissions = $validated['permissions'];

        // Security check: non-superadmin users cannot be granted .force_delete permissions
        $permissions = array_filter($permissions, function ($perm) {
            return !str_ends_with($perm, '.force_delete');
        });

        $user->syncPermissions($permissions);

        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'status' => 'success',
            'message' => "Custom permissions for user '{$user->name}' updated successfully.",
            'data' => [
                'direct_permissions' => $user->getDirectPermissions()->pluck('name'),
                'role_permissions' => $user->getPermissionsViaRoles()->pluck('name')->unique()->values(),
                'all_permissions' => $user->getAllPermissions()->pluck('name'),
            ],
        ]);
    }
}
