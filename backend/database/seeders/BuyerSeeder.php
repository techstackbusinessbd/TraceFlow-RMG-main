<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Buyer;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BuyerSeeder extends Seeder
{
    /**
     * Seed Buyer and associated Brands.
     */
    public function run(): void
    {
        $this->command->info('🛍️ Seeding Buyer (American Eagle Outfitters) & Brands (AEO, aerie)...');

        $company = Company::where('code', 'ITSL')->first();

        if (!$company) {
            $this->command->error('❌ Company ITSL not found! Please run CompanySeeder first.');
            return;
        }

        // Check if Li & Fung agent exists under ITSL
        $agent = Agent::where('company_id', $company->id)
            ->where('name', 'like', '%Li & Fung%')
            ->first();

        $code = "{$company->code}-BYR-001";

        $buyer = Buyer::where('company_id', $company->id)
            ->where('name', 'American Eagle Outfitters')
            ->first();

        if ($buyer) {
            $buyer->update([
                'code' => $code,
                'buyer_type' => $agent ? 'agent' : 'direct',
                'agent_id' => $agent?->id,
                'country' => 'United States',
                'contact_person' => 'Jay Schottenstein',
                'email' => 'sourcing@aeo.com',
                'phone' => '+1 412 432 3300',
                'address' => '77 Hot Metal Street, Pittsburgh, PA 15203, United States',
                'payment_terms' => 'LC 60 Days',
                'is_active' => true,
            ]);
        } else {
            $buyer = Buyer::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'name' => 'American Eagle Outfitters',
                'code' => $code,
                'buyer_type' => $agent ? 'agent' : 'direct',
                'agent_id' => $agent?->id,
                'country' => 'United States',
                'contact_person' => 'Jay Schottenstein',
                'email' => 'sourcing@aeo.com',
                'phone' => '+1 412 432 3300',
                'address' => '77 Hot Metal Street, Pittsburgh, PA 15203, United States',
                'payment_terms' => 'LC 60 Days',
                'is_active' => true,
            ]);
        }

        $this->command->info("   -> Buyer: {$buyer->name} (Code: {$buyer->code} | UUID: {$buyer->uuid} | Type: {$buyer->buyer_type} | Agent: " . ($agent?->name ?? 'None') . ")");

        // Seed Brands: AEO, aerie
        $brands = ['AEO', 'Aerie'];

        foreach ($brands as $brandName) {
            $brand = $buyer->brands()->where('name', $brandName)->first();
            if ($brand) {
                $brand->update([
                    'code' => strtoupper(substr($brandName, 0, 4)),
                    'is_active' => true,
                ]);
            } else {
                $brand = $buyer->brands()->create([
                    'uuid' => (string) Str::uuid(),
                    'name' => $brandName,
                    'code' => strtoupper(substr($brandName, 0, 4)),
                    'is_active' => true,
                ]);
            }
            $this->command->info("      * Brand: {$brand->name} (Code: {$brand->code} | UUID: {$brand->uuid} | Buyer: {$buyer->name})");
        }

        $this->command->info("   -> Buyer & Brands seeded successfully.");
    }
}
