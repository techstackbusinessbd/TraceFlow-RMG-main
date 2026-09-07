<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\PermissionDiscoveryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Fully idempotent: can run safely multiple times without duplication or errors.
     */
    public function run(PermissionDiscoveryService $discoveryService): void
    {
        $this->command->info('🚀 TraceFlow RMG — System Bootstrap Seeder Starting...');

        // 1. Reset cached roles and permissions
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // 2. Discover & Seed 4-Tier Domain Permissions
        $this->command->info('1️⃣ Discovering & Seeding 4-Tier Domain Permissions...');
        $permissions = $discoveryService->getFlattenedPermissions();

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
        $this->command->info("   -> Seeded " . count($permissions) . " permissions.");

        // 3. Seed Core Enterprise Roles
        $this->command->info('2️⃣ Provisioning Core Enterprise Roles...');
        
        $superAdminRole = Role::updateOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $systemAdminRole = Role::updateOrCreate(['name' => 'System Admin', 'guard_name' => 'web']);
        $factoryManagerRole = Role::updateOrCreate(['name' => 'Factory Manager', 'guard_name' => 'web']);
        $merchandiserRole = Role::updateOrCreate(['name' => 'Merchandiser Head', 'guard_name' => 'web']);
        $operatorRole = Role::updateOrCreate(['name' => 'Floor Operator', 'guard_name' => 'web']);

        // Assign all non-superadmin permissions to System Admin
        $systemAdminPerms = Permission::where('name', 'not like', '%.force_delete')->get();
        $systemAdminRole->syncPermissions($systemAdminPerms);

        // Assign master data permissions to Merchandiser Head
        $merchandiserPerms = Permission::where('module_name', 'master_data')->get();
        $merchandiserRole->syncPermissions($merchandiserPerms);

        $this->command->info('   -> Roles provisioned & mapped successfully.');

        // 4. Provision Root Super Admin User
        $this->command->info('3️⃣ Provisioning Root Super Administrator Account...');
        
        $rootUsername = env('SYSTEM_ROOT_ADMIN_USERNAME', 'superadmin');
        $rootEmpId = env('SYSTEM_ROOT_ADMIN_EMP_ID', 'AWL-ADM-0001');
        $rootEmail = env('SYSTEM_ROOT_ADMIN_EMAIL', 'superadmin@traceflow-rmg.com');
        $rootPassword = env('SYSTEM_ROOT_ADMIN_PASSWORD', 'SuperAdmin#2026!');

        $superAdminUser = User::updateOrCreate(
            ['username' => $rootUsername],
            [
                'emp_id' => $rootEmpId,
                'name' => 'Root System Administrator',
                'email' => $rootEmail,
                'password' => Hash::make($rootPassword),
                'department' => 'Executive & IT Architecture',
                'phone' => '+8801700000000',
                'is_active' => true,
                'must_change_password' => false,
            ]
        );

        $superAdminUser->assignRole($superAdminRole);
        $this->command->info("   -> Root Super Admin created: {$rootUsername} ({$rootEmpId})");

        // 5. Provision a Sample Factory System Admin for Testing
        $sysAdminUser = User::updateOrCreate(
            ['username' => 'sysadmin'],
            [
                'emp_id' => 'AWL-IT-0002',
                'name' => 'Factory IT Administrator',
                'email' => 'it.admin@traceflow-rmg.com',
                'password' => Hash::make('Admin#2026!'),
                'department' => 'IT & Systems',
                'phone' => '+8801700000001',
                'is_active' => true,
                'must_change_password' => false,
            ]
        );
        $sysAdminUser->assignRole($systemAdminRole);
        $this->command->info("   -> Factory IT Admin created: sysadmin (AWL-IT-0002)");

        $this->command->info('🎉 TraceFlow RMG — System Bootstrap Seeding Completed Successfully!');
    }
}
