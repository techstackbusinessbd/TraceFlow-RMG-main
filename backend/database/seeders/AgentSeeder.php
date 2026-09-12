<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AgentSeeder extends Seeder
{
    /**
     * Seed buying agents.
     */
    public function run(): void
    {
        $this->command->info('🤝 Seeding Buying Agent for ITSL (Li & Fung)...');

        $company = Company::where('code', 'ITSL')->first();

        if (!$company) {
            $this->command->error('❌ Company with code ITSL not found! Please run CompanySeeder first.');
            return;
        }

        $code = "{$company->code}-AGT-001";

        $agent = Agent::where('company_id', $company->id)
            ->where('name', 'Li & Fung')
            ->first();

        if ($agent) {
            $agent->update([
                'code' => $code,
                'country' => 'Hong Kong',
                'contact_person' => 'Spencer Fung',
                'email' => 'contact@lifung.com',
                'phone' => '+85223002300',
                'address' => 'LiFung Tower, 888 Cheung Sha Wan Road, Kowloon, Hong Kong',
                'commission_rate' => 5.00,
                'is_active' => true,
            ]);
        } else {
            $agent = Agent::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $company->id,
                'name' => 'Li & Fung',
                'code' => $code,
                'country' => 'Hong Kong',
                'contact_person' => 'Spencer Fung',
                'email' => 'contact@lifung.com',
                'phone' => '+85223002300',
                'address' => 'LiFung Tower, 888 Cheung Sha Wan Road, Kowloon, Hong Kong',
                'commission_rate' => 5.00,
                'is_active' => true,
            ]);
        }

        $this->command->info("   -> Buying Agent: {$agent->name} (Code: {$agent->code} | Company: {$company->code}) created successfully.");
    }
}
