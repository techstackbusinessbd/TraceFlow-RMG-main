<?php

namespace App\Domains\SystemAdmin\Controllers;

use App\Http\Controllers\Controller;
use App\Services\PermissionDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    /**
     * Display a list of roles with assigned permissions count and user count.
     * GET /api/v1/roles
     */
    public function index(Request $request): JsonResponse
    {
        $query = Role::query()->withCount(['permissions', 'users']);

        if ($search = trim($request->query('search', ''))) {
            $query->where('name', 'ilike', "%{$search}%");
        }

        $roles = $query->orderBy('id', 'asc')->get();

        // System core roles
        $systemRoles = ['superadmin', 'admin', 'standarduser'];

        $data = $roles->map(function ($role) use ($systemRoles) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'is_system' => in_array($role->name, $systemRoles, true),
                'permissions_count' => $role->permissions_count,
                'users_count' => $role->users_count,
                'created_at' => $role->created_at,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $data,
        ]);
    }

    /**
     * Store a newly created Custom Enterprise Role.
     * POST /api/v1/roles
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'alpha_dash', 'min:3', 'max:50', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ], [
            'name.required' => 'Role name is required.',
            'name.alpha_dash' => 'Role name may only contain letters, numbers, dashes and underscores.',
            'name.unique' => 'A role with this name already exists.',
        ]);

        $roleName = strtolower(trim($validated['name']));

        DB::beginTransaction();
        try {
            $role = Role::create([
                'name' => $roleName,
                'guard_name' => 'web',
            ]);

            if (!empty($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }

            app(PermissionRegistrar::class)->forgetCachedPermissions();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => "Role '{$role->name}' created successfully.",
                'data' => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'is_system' => false,
                    'permissions_count' => count($validated['permissions'] ?? []),
                    'users_count' => 0,
                    'created_at' => $role->created_at,
                ],
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create role: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display role details with its active permission names.
     * GET /api/v1/roles/{id}
     */
    public function show($id): JsonResponse
    {
        $role = Role::with(['permissions:id,name'])->withCount(['users'])->findOrFail($id);
        $systemRoles = ['superadmin', 'admin', 'standarduser'];

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'is_system' => in_array($role->name, $systemRoles, true),
                'users_count' => $role->users_count,
                'permissions' => $role->permissions->pluck('name'),
                'created_at' => $role->created_at,
            ],
        ]);
    }

    /**
     * Update role name. System roles cannot be renamed.
     * PUT /api/v1/roles/{id}
     */
    public function update(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        $systemRoles = ['superadmin', 'admin', 'standarduser'];

        if (in_array($role->name, $systemRoles, true)) {
            return response()->json([
                'status' => 'error',
                'message' => "System core role '{$role->name}' cannot be renamed.",
            ], 422);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'alpha_dash', 'min:3', 'max:50', 'unique:roles,name,' . $role->id],
        ]);

        $role->name = strtolower(trim($validated['name']));
        $role->save();

        return response()->json([
            'status' => 'success',
            'message' => "Role renamed to '{$role->name}' successfully.",
            'data' => $role,
        ]);
    }

    /**
     * Delete a custom role. System roles and roles with assigned users cannot be deleted.
     * DELETE /api/v1/roles/{id}
     */
    public function destroy($id): JsonResponse
    {
        $role = Role::withCount('users')->findOrFail($id);
        $systemRoles = ['superadmin', 'admin', 'standarduser'];

        if (in_array($role->name, $systemRoles, true)) {
            return response()->json([
                'status' => 'error',
                'message' => "System core role '{$role->name}' is protected and cannot be deleted.",
            ], 422);
        }

        if ($role->users_count > 0) {
            return response()->json([
                'status' => 'error',
                'message' => "Cannot delete role '{$role->name}'. It is currently assigned to {$role->users_count} user account(s). Please reassign users first.",
            ], 422);
        }

        $role->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'status' => 'success',
            'message' => "Role '{$role->name}' deleted successfully.",
        ]);
    }

    /**
     * Get structured 4-tier permission tree catalog grouped by module and submodule.
     * GET /api/v1/permissions/tree
     */
    public function permissionTree(PermissionDiscoveryService $discovery): JsonResponse
    {
        $catalog = $discovery->discoverAll();
        $dbPermissions = Permission::all()->keyBy('name');

        $tree = [];

        foreach ($catalog as $moduleSlug => $moduleManifest) {
            $moduleLabel = $moduleManifest['label'] ?? ucfirst(str_replace('_', ' ', $moduleSlug));
            $submodules = [];

            foreach ($moduleManifest['submodules'] ?? [] as $subSlug => $subManifest) {
                $subLabel = $subManifest['label'] ?? ucfirst(str_replace('_', ' ', $subSlug));
                $resources = [];

                foreach ($subManifest['resources'] ?? [] as $resSlug => $resManifest) {
                    $resLabel = $resManifest['label'] ?? ucfirst(str_replace('_', ' ', $resSlug));
                    $actions = [];

                    foreach ($resManifest['actions'] ?? [] as $actSlug => $actDesc) {
                        $actionName = is_numeric($actSlug) ? $actDesc : $actSlug;
                        $fullName = "{$moduleSlug}.{$subSlug}.{$resSlug}.{$actionName}";
                        $existsInDb = $dbPermissions->has($fullName);

                        $actions[] = [
                            'name' => $fullName,
                            'action' => $actionName,
                            'description' => is_string($actDesc) && !is_numeric($actSlug) ? $actDesc : ucfirst($actionName),
                            'exists' => $existsInDb,
                        ];
                    }

                    $resources[] = [
                        'slug' => $resSlug,
                        'label' => $resLabel,
                        'actions' => $actions,
                    ];
                }

                $submodules[] = [
                    'slug' => $subSlug,
                    'label' => $subLabel,
                    'resources' => $resources,
                ];
            }

            $tree[] = [
                'slug' => $moduleSlug,
                'label' => $moduleLabel,
                'submodules' => $submodules,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => $tree,
        ]);
    }

    /**
     * Sync permissions matrix for a role.
     * PUT /api/v1/roles/{id}/matrix
     */
    public function syncMatrix(Request $request, $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        if ($role->name === 'superadmin') {
            return response()->json([
                'status' => 'error',
                'message' => 'The superadmin role automatically possesses all system permissions and its matrix is permanent.',
            ], 422);
        }

        $validated = $request->validate([
            'permissions' => ['present', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        // Security check: non-superadmin roles cannot be granted .force_delete permissions
        $permissions = $validated['permissions'];
        if ($role->name !== 'superadmin') {
            $permissions = array_filter($permissions, function ($perm) {
                return !str_ends_with($perm, '.force_delete');
            });
        }

        $role->syncPermissions($permissions);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'status' => 'success',
            'message' => "Permission matrix for role '{$role->name}' updated successfully.",
            'data' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions_count' => count($permissions),
                'permissions' => array_values($permissions),
            ],
        ]);
    }
}
