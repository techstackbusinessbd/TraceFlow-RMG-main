<?php

namespace Database\Seeders;

use App\Models\Company;
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

        // 2. Provision Core System Company (Platform Owner)
        $this->command->info('🏢 Provisioning System Core Company (Platform Owner)...');
        $platformOwnerCompany = Company::updateOrCreate(
            ['code' => 'PLT'],
            [
                'name' => 'Platform Owner',
                'legal_name' => 'TraceFlow RMG Platform Owner Limited',
                'tax_id' => 'PLT-BIN-000000001',
                'email' => 'platform@traceflow-rmg.com',
                'phone' => '+8801700000000',
                'address' => 'Central Platform Infrastructure & IT Architecture Headquarters',
                'is_active' => true,
                'is_default' => true,
            ]
        );
        $this->command->info("   -> Company: Platform Owner (Code: PLT | ID: {$platformOwnerCompany->id})");

        // 3. Discover & Seed 4-Tier Domain Permissions
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

        // 4. Seed Default 3 Core Enterprise Roles: superadmin, admin, standarduser
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

        // 5. Provision Default 3 Users with strict company affiliation (Platform Owner)
        $this->command->info('3️⃣ Provisioning Default 3 Users under Platform Owner...');
        
        // User 1: Superadmin (Role: superadmin | Company: Platform Owner)
        $superAdminUser = User::updateOrCreate(
            ['username' => 'superadmin'],
            [
                'company_id' => $platformOwnerCompany->id,
                'emp_id' => '255776', // Manual factory employee ID
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
        $this->command->info("   -> [1/3] User: superadmin (Role: superadmin | Company: Platform Owner | Manual Emp ID: 255776)");

        // User 2: Admin (Role: admin | Company: Platform Owner)
        $adminUser = User::updateOrCreate(
            ['username' => 'admin'],
            [
                'company_id' => $platformOwnerCompany->id,
                'emp_id' => '100492', // Manual factory employee ID
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
        $this->command->info("   -> [2/3] User: admin (Role: admin | Company: Platform Owner | Manual Emp ID: 100492)");

        // User 3: Standard User (Role: standarduser | Company: Platform Owner)
        $standardUser = User::updateOrCreate(
            ['username' => 'standarduser'],
            [
                'company_id' => $platformOwnerCompany->id,
                'emp_id' => '883015', // Manual factory employee ID
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
        $this->command->info("   -> [3/3] User: standard user (username: standarduser | Role: standarduser | Company: Platform Owner | Manual Emp ID: 883015)");

        $this->command->info('🎉 TraceFlow RMG — System Boot Seeding (1 Company, 3 Roles & 3 Users) Completed Successfully!');

        // 6. Seed Operating Company (International Trading Services Ltd)
        $this->call(CompanySeeder::class);

        // 7. Seed Operating Buying Agent (Li & Fung under ITSL)
        $this->call(AgentSeeder::class);

        // 8. Seed Buyer (American Eagle Outfitters) & Brands (AEO, aerie)
        $this->call(BuyerSeeder::class);

        // 9. Seed Size Scales & Colors Master Library (Product Categories)
        $this->call(SizeScaleSeeder::class);

        // 10. Seed 100% Woven Garment Styles (Product Categories & Items under AEO & ITSL)
        $this->call(StyleSeeder::class);
    }
}
