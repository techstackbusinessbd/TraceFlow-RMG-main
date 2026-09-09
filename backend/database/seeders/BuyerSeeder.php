<?php

namespace Database\Seeders;

use App\Models\Agent;
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

        // 1. Seed Sample Buying Agents / Buying Houses
        $agents = [
            [
                'name' => 'Li & Fung Sourcing Ltd',
                'country' => 'Hong Kong',
                'contact_person' => 'William Fung / Account Dir.',
                'email' => 'sourcing.hk@lifung.com',
                'phone' => '+852 2300 2300',
                'address' => 'LiFung Plaza, 868 Cheung Sha Wan Road, Kowloon, Hong Kong',
                'commission_rate' => 5.00,
            ],
            [
                'name' => 'Asmara International Ltd',
                'country' => 'Indonesia',
                'contact_person' => 'Rajesh Mehra',
                'email' => 'dhaka.office@asmaragroup.com',
                'phone' => '+880 2 988 5601',
                'address' => 'House 14, Road 11, Banani, Dhaka-1213, Bangladesh',
                'commission_rate' => 4.50,
            ],
            [
                'name' => 'Tex-Design Buying House',
                'country' => 'Bangladesh',
                'contact_person' => 'Kamal Hossain',
                'email' => 'kamal@texdesign-bd.com',
                'phone' => '+880 1711 000000',
                'address' => 'Sector 3, Uttara, Dhaka, Bangladesh',
                'commission_rate' => 3.00,
            ],
        ];

        $agentPrefix = strtoupper(trim($company->code)) . '-AGT-';
        $agentSeq = 1;
        $createdAgents = [];

        foreach ($agents as $aData) {
            $code = $agentPrefix . str_pad((string)$agentSeq++, 3, '0', STR_PAD_LEFT);
            $agent = Agent::updateOrCreate(
                ['company_id' => $company->id, 'name' => $aData['name']],
                [
                    'code' => $code,
                    'country' => $aData['country'],
                    'contact_person' => $aData['contact_person'],
                    'email' => $aData['email'],
                    'phone' => $aData['phone'],
                    'address' => $aData['address'],
                    'commission_rate' => $aData['commission_rate'],
                    'is_active' => true,
                ]
            );
            $createdAgents[$aData['name']] = $agent;
        }

        // 2. Seed Sample Buyers (Mix of Direct and Via Agent)
        $buyers = [
            [
                'name' => 'H&M Hennes & Mauritz',
                'buyer_type' => 'direct',
                'agent_name' => null,
                'country' => 'Sweden',
                'contact_person' => 'Johan Lindberg',
                'email' => 'production.hm@hennes-mauritz.se',
                'phone' => '+46 8 796 55 00',
                'payment_terms' => 'LC 60 Days',
                'brands' => ['Divided', 'H&M Man', 'H&M Kids', 'COS'],
            ],
            [
                'name' => 'Zara (Inditex Group)',
                'buyer_type' => 'direct',
                'agent_name' => null,
                'country' => 'Spain',
                'contact_person' => 'Carlos Rodriguez',
                'email' => 'sourcing@inditex.com',
                'phone' => '+34 981 18 54 00',
                'payment_terms' => 'TT 45 Days',
                'brands' => ['Zara Basic', 'Zara TRF', 'Pull&Bear', 'Massimo Dutti', 'Bershka', 'Stradivarius'],
            ],
            [
                'name' => 'Marks & Spencer (M&S)',
                'buyer_type' => 'direct',
                'agent_name' => null,
                'country' => 'United Kingdom',
                'contact_person' => 'Sarah Jenkins',
                'email' => 'garments@marks-and-spencer.co.uk',
                'phone' => '+44 20 7935 4422',
                'payment_terms' => 'LC at Sight',
                'brands' => ['Autograph', 'Per Una'],
            ],
            [
                'name' => 'Next Retail Ltd',
                'buyer_type' => 'agent',
                'agent_name' => 'Li & Fung Sourcing Ltd',
                'country' => 'United Kingdom',
                'contact_person' => 'David Higgins',
                'email' => 'orders@next.co.uk',
                'phone' => '+44 116 284 2000',
                'payment_terms' => 'TT 60 Days',
                'brands' => ['Next Womenswear', 'Next Menswear', 'Next Childrenswear'],
            ],
            [
                'name' => 'PVH Corp',
                'buyer_type' => 'agent',
                'agent_name' => 'Asmara International Ltd',
                'country' => 'United States',
                'contact_person' => 'Michael Chang',
                'email' => 'procurement@pvh.com',
                'phone' => '+1 212 381 3500',
                'payment_terms' => 'LC 90 Days',
                'brands' => ['Tommy Hilfiger', 'Calvin Klein', 'Van Heusen', 'Arrow', 'IZOD'],
            ],
        ];

        $buyerPrefix = strtoupper(trim($company->code)) . '-BYR-';
        $buyerSeq = 1;

        foreach ($buyers as $bData) {
            $code = $buyerPrefix . str_pad((string)$buyerSeq++, 3, '0', STR_PAD_LEFT);
            $agentId = !empty($bData['agent_name']) && isset($createdAgents[$bData['agent_name']])
                ? $createdAgents[$bData['agent_name']]->id
                : null;

            $buyer = Buyer::updateOrCreate(
                ['company_id' => $company->id, 'name' => $bData['name']],
                [
                    'code' => $code,
                    'buyer_type' => $bData['buyer_type'],
                    'agent_id' => $agentId,
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
