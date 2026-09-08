<?php

namespace Database\Seeders;

use App\Models\Buyer;
use App\Models\Company;
use Illuminate\Database\Seeder;

class BuyerSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::where('is_default', true)->first() ?? Company::first();

        if (!$company) {
            return;
        }

        $buyers = [
            [
                'name' => 'H&M Hennes & Mauritz',
                'country' => 'Sweden',
                'contact_person' => 'Johan Lindberg',
                'email' => 'production.hm@hennes-mauritz.se',
                'phone' => '+46 8 796 55 00',
                'payment_terms' => 'LC 60 Days',
                'brands' => ['Divided', 'H&M Man', 'H&M Kids', 'COS'],
            ],
            [
                'name' => 'Zara (Inditex Group)',
                'country' => 'Spain',
                'contact_person' => 'Carlos Rodriguez',
                'email' => 'sourcing@inditex.com',
                'phone' => '+34 981 18 54 00',
                'payment_terms' => 'TT 45 Days',
                'brands' => ['Zara Basic', 'Zara TRF', 'Pull&Bear', 'Massimo Dutti', 'Bershka', 'Stradivarius'],
            ],
            [
                'name' => 'Marks & Spencer (M&S)',
                'country' => 'United Kingdom',
                'contact_person' => 'Sarah Jenkins',
                'email' => 'garments@marks-and-spencer.co.uk',
                'phone' => '+44 20 7935 4422',
                'payment_terms' => 'LC at Sight',
                'brands' => ['Autograph', 'Per Una'],
            ],
            [
                'name' => 'Next Retail Ltd',
                'country' => 'United Kingdom',
                'contact_person' => 'David Higgins',
                'email' => 'orders@next.co.uk',
                'phone' => '+44 116 284 2000',
                'payment_terms' => 'TT 60 Days',
                'brands' => ['Next Womenswear', 'Next Menswear', 'Next Childrenswear'],
            ],
            [
                'name' => 'PVH Corp',
                'country' => 'United States',
                'contact_person' => 'Michael Chang',
                'email' => 'procurement@pvh.com',
                'phone' => '+1 212 381 3500',
                'payment_terms' => 'LC 90 Days',
                'brands' => ['Tommy Hilfiger', 'Calvin Klein', 'Van Heusen', 'Arrow', 'IZOD'],
            ],
        ];

        $prefix = strtoupper(trim($company->code)) . '-BYR-';
        $seq = 1;

        foreach ($buyers as $bData) {
            $code = $prefix . str_pad((string)$seq++, 3, '0', STR_PAD_LEFT);
            $buyer = Buyer::updateOrCreate(
                ['company_id' => $company->id, 'name' => $bData['name']],
                [
                    'code' => $code,
                    'country' => $bData['country'],
                    'contact_person' => $bData['contact_person'],
                    'email' => $bData['email'],
                    'phone' => $bData['phone'],
                    'payment_terms' => $bData['payment_terms'],
                    'is_active' => true,
                ]
            );

            foreach ($bData['brands'] as $brandName) {
                $buyer->brands()->updateOrCreate(
                    ['name' => $brandName],
                    ['is_active' => true]
                );
            }
        }
    }
}
