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

        // 3. Seed Default 3 Core Enterprise Roles: superadmin, admin, standarduser
        $this->command->info('2️⃣ Provisioning Default 3 Core Enterprise Roles (superadmin, admin, standarduser)...');
        
        $superAdminRole = Role::updateOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
        $adminRole = Role::updateOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $standardUserRole = Role::updateOrCreate(['name' => 'standarduser', 'guard_name' => 'web']);

        // Assign all non-force_delete permissions to 'admin'
        $adminPerms = Permission::where('name', 'not like', '%.force_delete')->get();
        $adminRole->syncPermissions($adminPerms);

        // Assign standard view & create permissions to 'standarduser'
        $standardPerms = Permission::where('name', 'like', '%.view')
            ->orWhere('name', 'like', '%.create')
            ->orWhere('name', 'like', '%.update')
            ->get();
        $standardUserRole->syncPermissions($standardPerms);

        $this->command->info('   -> 3 Core Roles provisioned & permissions mapped.');

        // 4. Provision Default 3 Users
        $this->command->info('3️⃣ Provisioning Default 3 Users (superadmin, admin, standard user)...');
        
        // User 1: Superadmin (Role: superadmin)
        $superAdminUser = User::updateOrCreate(
            ['username' => 'superadmin'],
            [
                'emp_id' => 'AWL-ADM-0001',
                'name' => 'Super Administrator',
                'email' => 'superadmin@traceflow-rmg.com',
                'password' => Hash::make('SuperAdmin#2026!'),
                'department' => 'Executive & IT Architecture',
                'phone' => '+8801700000000',
                'is_active' => true,
                'must_change_password' => false,
            ]
        );
        $superAdminUser->syncRoles([$superAdminRole]);
        $this->command->info("   -> [1/3] User: superadmin (Role: superadmin | Emp ID: AWL-ADM-0001)");

        // User 2: Admin (Role: admin)
        $adminUser = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'emp_id' => 'AWL-ADM-0002',
                'name' => 'Plant Administrator',
                'email' => 'admin@traceflow-rmg.com',
                'password' => Hash::make('Admin#2026!'),
                'department' => 'Factory Administration',
                'phone' => '+8801700000001',
                'is_active' => true,
                'must_change_password' => false,
            ]
        );
        $adminUser->syncRoles([$adminRole]);
        $this->command->info("   -> [2/3] User: admin (Role: admin | Emp ID: AWL-ADM-0002)");

        // User 3: Standard User (Role: standarduser)
        $standardUser = User::updateOrCreate(
            ['username' => 'standarduser'],
            [
                'emp_id' => 'AWL-STD-0003',
                'name' => 'Standard User',
                'email' => 'standard.user@traceflow-rmg.com',
                'password' => Hash::make('Standard#2026!'),
                'department' => 'General Operations',
                'phone' => '+8801700000002',
                'is_active' => true,
                'must_change_password' => false,
            ]
        );
        $standardUser->syncRoles([$standardUserRole]);
        $this->command->info("   -> [3/3] User: standard user (username: standarduser | Role: standarduser | Emp ID: AWL-STD-0003)");

        $this->command->info('🎉 TraceFlow RMG — System Boot Seeding (3 Roles & 3 Users) Completed Successfully!');
    }
}
