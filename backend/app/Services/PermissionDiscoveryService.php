<?php

namespace App\Services;

use Illuminate\Support\Str;

class PermissionDiscoveryService
{
    /**
     * Scan all Domains in app/Domains and discover their permissions.php manifests.
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
