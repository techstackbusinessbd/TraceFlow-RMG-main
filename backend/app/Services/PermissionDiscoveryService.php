<?php

namespace App\Services;

use Illuminate\Support\Str;

class PermissionDiscoveryService
{
    /**
     * Scan all Domains in app/Domains and discover their permissions.php manifests.
     * Enforces strict enterprise workflow serial ordering.
     *
     * @return array<string, array>
     */
    public function discoverAll(): array
    {
        $catalog = [];
        $domainPaths = glob(app_path('Domains/*'), GLOB_ONLYDIR);

        foreach ($domainPaths as $path) {
            $permFile = $path . '/permissions.php';
            $domainSlug = Str::snake(basename($path));

            if (file_exists($permFile)) {
                $manifest = require $permFile;
                $catalog[$domainSlug] = $manifest;
            }
        }

        // 1. Enterprise Module Serial Ordering Priority
        $modulePriority = [
            'system_admin' => 1,
            'master_data' => 2,
            'order' => 3,
            'warehouse' => 4,
            'cutting' => 5,
            'sewing' => 6,
            'qc' => 7,
        ];

        uksort($catalog, function ($a, $b) use ($modulePriority) {
            $pA = $modulePriority[$a] ?? 99;
            $pB = $modulePriority[$b] ?? 99;
            return $pA <=> $pB;
        });

        // 2. Submodule Serial Ordering Priority per Module
        $submodulePriority = [
            'system_admin' => [
                'users' => 1,
                'roles' => 2,
                'companies' => 3,
                'devices' => 4,
            ],
            'master_data' => [
                'buyers' => 1,
                'styles' => 2,
                'lines' => 3,
            ],
        ];

        foreach ($catalog as $modKey => &$modData) {
            if (isset($modData['submodules']) && isset($submodulePriority[$modKey])) {
                $pMap = $submodulePriority[$modKey];
                uksort($modData['submodules'], function ($sA, $sB) use ($pMap) {
                    $posA = $pMap[$sA] ?? 99;
                    $posB = $pMap[$sB] ?? 99;
                    return $posA <=> $posB;
                });
            }
        }
        unset($modData);

        return $catalog;
    }

    /**
     * Flatten discovered domain catalog into 4-tier structured list.
     *
     * @return array<int, array{name: string, module_name: string, submodule_name: string, resource_name: string, action_name: string, description: string}>
     */
    public function getFlattenedPermissions(): array
    {
        $catalog = $this->discoverAll();
        $permissions = [];

        foreach ($catalog as $moduleKey => $moduleData) {
            $submodules = $moduleData['submodules'] ?? [];

            foreach ($submodules as $submoduleKey => $submoduleData) {
                $resources = $submoduleData['resources'] ?? [];

                foreach ($resources as $resourceKey => $resourceData) {
                    $actions = $resourceData['actions'] ?? [];

                    foreach ($actions as $actionKey => $actionDesc) {
                        // Support both key-value ('view' => 'Desc') and plain array ('view', 'create')
                        $action = is_numeric($actionKey) ? $actionDesc : $actionKey;
                        $desc = is_string($actionDesc) && !is_numeric($actionKey) 
                            ? $actionDesc 
                            : ucfirst($action) . ' ' . ($resourceData['label'] ?? $resourceKey);

                        $fullName = "{$moduleKey}.{$submoduleKey}.{$resourceKey}.{$action}";

                        $permissions[] = [
                            'name' => $fullName,
                            'module_name' => $moduleKey,
                            'submodule_name' => $submoduleKey,
                            'resource_name' => $resourceKey,
                            'action_name' => $action,
                            'description' => $desc,
                        ];
                    }
                }
            }
        }

        return $permissions;
    }
}
