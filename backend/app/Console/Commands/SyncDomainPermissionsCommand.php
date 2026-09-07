<?php

namespace App\Console\Commands;

use App\Services\PermissionDiscoveryService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class SyncDomainPermissionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permissions:sync {--dry-run : Only show discovered permissions without saving}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Zero-Touch auto-discovery and synchronization of 4-tier domain permissions into PostgreSQL';

    /**
     * Execute the console command.
     */
    public function handle(PermissionDiscoveryService $discoveryService): int
    {
        $this->info('🔍 Starting Zero-Touch Domain Permission Auto-Discovery...');

        $catalog = $discoveryService->discoverAll();
        $domainCount = count($catalog);
        $this->line("Found <fg=cyan>{$domainCount}</> domain manifests in app/Domains.");

        $permissions = $discoveryService->getFlattenedPermissions();
        $totalCount = count($permissions);

        $this->table(
            ['Full Permission String', 'Module', 'Submodule', 'Resource', 'Action'],
            array_slice($permissions, 0, 10)
        );

        if ($totalCount > 10) {
            $this->comment("... and " . ($totalCount - 10) . " more permissions.");
        }

        if ($this->option('dry-run')) {
            $this->warn("Dry-run mode enabled. No database records were modified.");
            return Command::SUCCESS;
        }

        $this->info("⚡ Synchronizing {$totalCount} permissions into database...");

        DB::transaction(function () use ($permissions) {
            foreach ($permissions as $perm) {
                Permission::updateOrCreate(
                    [
                        'name' => $perm['name'],
                        'guard_name' => 'web',
                    ],
                    [
                        'module_name' => $perm['module_name'],
                        'submodule_name' => $perm['submodule_name'],
                        'resource_name' => $perm['resource_name'],
                        'action_name' => $perm['action_name'],
                        'description' => $perm['description'],
                    ]
                );
            }
        });

        // Flush Spatie Permission Cache
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->info("✅ Successfully synchronized {$totalCount} domain permissions!");
        $this->info("🧹 Flushed RBAC cache tags.");

        return Command::SUCCESS;
    }
}
