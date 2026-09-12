<?php

namespace App\Domains\MasterData\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NavigationCatalogController extends Controller
{
    /**
     * Retrieve resolved, permission-filtered 4-level navigation catalog.
     * GET /api/v1/navigation/catalog
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $cacheKey = "nav_catalog_user_" . ($user ? $user->id : "guest");

        $resolvedModules = Cache::remember($cacheKey, 3600, function () use ($user) {
            $rawModules = config('rmg_navigation.modules', []);
            $modules = [];

            foreach ($rawModules as $mod) {
                $resolvedSubmodules = [];

                foreach ($mod['submodules'] as $sub) {
                    if (isset($sub['required_roles']) && !$this->hasAnyRole($user, $sub['required_roles'])) {
                        continue;
                    }
                    if (isset($sub['required_permissions']) && !$this->hasAnyPermission($user, $sub['required_permissions'])) {
                        continue;
                    }

                    $resolvedClusters = [];
                    $totalAvailableMenus = 0;

                    foreach ($sub['clusters'] as $cluster) {
                        $resolvedMenus = [];

                        foreach ($cluster['menus'] as $menu) {
                            $roleAllowed = !isset($menu['required_roles']) || $this->hasAnyRole($user, $menu['required_roles']);
                            $permAllowed = !isset($menu['required_permissions']) || $this->hasAnyPermission($user, $menu['required_permissions']);

                            if ($roleAllowed && $permAllowed) {
                                $resolvedMenus[] = $menu;
                                $totalAvailableMenus++;
                            }
                        }

                        if (!empty($resolvedMenus)) {
                            $clusterCopy = $cluster;
                            $clusterCopy['menus'] = $resolvedMenus;
                            $resolvedClusters[] = $clusterCopy;
                        }
                    }

                    if (!empty($resolvedClusters)) {
                        $subCopy = $sub;
                        $subCopy['clusters'] = $resolvedClusters;
                        $subCopy['total_menus'] = $totalAvailableMenus;
                        $resolvedSubmodules[] = $subCopy;
                    }
                }

                if (!empty($resolvedSubmodules)) {
                    $modCopy = $mod;
                    $modCopy['submodules'] = $resolvedSubmodules;
                    $modules[] = $modCopy;
                }
            }

            return $modules;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Navigation catalog retrieved successfully.',
            'data' => $resolvedModules,
        ]);
    }

    private function hasAnyRole($user, array $roles): bool
    {
        if (!$user) return false;
        if (method_exists($user, 'hasAnyRole')) {
            return $user->hasAnyRole($roles);
        }
        $userRole = strtolower($user->role ?? '');
        return in_array($userRole, array_map('strtolower', $roles));
    }

    private function hasAnyPermission($user, array $permissions): bool
    {
        if (!$user) return false;
        // Superadmin bypass
        if (strtolower($user->role ?? '') === 'superadmin') {
            return true;
        }
        if (method_exists($user, 'canAny')) {
            return $user->canAny($permissions);
        }
        // If user has direct permissions array or Spatie method
        if (method_exists($user, 'hasAnyPermission')) {
            return $user->hasAnyPermission($permissions);
        }
        return true;
    }
}
