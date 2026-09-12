<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CompanySeeder extends Seeder
{
    /**
     * Seed operating companies.
     */
    public function run(): void
    {
        $this->command->info('🏢 Seeding Operating Company (International Trading Services Ltd)...');

        $company = Company::where('code', 'ITSL')->first();

        if ($company) {
            $company->update([
                'name' => 'International Trading Services Ltd',
                'legal_name' => 'International Trading Services Ltd',
                'tax_id' => 'ITSL-BIN-990812345',
                'email' => 'info@itsl-bd.com',
                'phone' => '+8801711000000',
                'address' => 'House #12, Road #5, Sector #3, Uttara, Dhaka-1230, Bangladesh',
                'is_active' => true,
                'is_default' => false,
            ]);
        } else {
            $company = Company::create([
                'uuid' => (string) Str::uuid(),
                'code' => 'ITSL',
                'name' => 'International Trading Services Ltd',
                'legal_name' => 'International Trading Services Ltd',
                'tax_id' => 'ITSL-BIN-990812345',
                'email' => 'info@itsl-bd.com',
                'phone' => '+8801711000000',
                'address' => 'House #12, Road #5, Sector #3, Uttara, Dhaka-1230, Bangladesh',
                'is_active' => true,
                'is_default' => false,
            ]);
        }

        $this->command->info("   -> Operating Company: {$company->name} (Code: {$company->code} | ID: {$company->id}) successfully created.");
    }
}
