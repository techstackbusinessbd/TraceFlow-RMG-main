<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Buyer;
use App\Models\Company;
use App\Models\Style;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StyleSeeder extends Seeder
{
    /**
     * Run the database seeds for Realistic 100% Woven Styles.
     * Fully aligned with Product Categories, Garment Items, ITSL company, and AEO Buyer.
     */
    public function run(): void
    {
        $this->command->info('🧵 Seeding Woven Garments Styles Library (Product Categories & Items)...');

        $company = Company::where('code', 'ITSL')->first() ?? Company::where('code', '!=', 'PLT')->first();
        if (!$company) {
            $this->command->error('❌ No operational company found. Skipping StyleSeeder.');
            return;
        }

        // Get Buyer: American Eagle Outfitters
        $buyer = Buyer::where('company_id', $company->id)
            ->where('name', 'like', '%American Eagle%')
            ->first() ?? Buyer::where('company_id', $company->id)->first();

        if (!$buyer) {
            $this->command->error('❌ Buyer not found for company. Please run BuyerSeeder first.');
            return;
        }

        $aeoBrand = Brand::where('buyer_id', $buyer->id)->where('name', 'AEO')->first();
        $aerieBrand = Brand::where('buyer_id', $buyer->id)->where('name', 'aerie')->first();

        // 5 Core 100% Woven Product Categories & Garment Items
        $stylesData = [
            // 1. Category: Denim & Jeans | Item: 5-Pocket Denim Jeans
            [
                'brand_id'         => $aeoBrand?->id,
                'buyer_style_no'   => 'AEO-DNM-2601',
                'style_name'       => "AirFlex+ 5-Pocket Slim Taper Denim Jeans",
                'product_category' => 'Denim & Jeans',
                'garment_item'     => '5-Pocket Denim Jeans',
                'fabric_type'      => '98% Cotton 2% Spandex Indigo Denim (12.5 oz)',
                'season'           => 'Fall 2026',
                'base_smv'         => 18.50,
                'wash_type'        => 'Enzyme Wash, Bleach Wash, Tint & Distress',
                'description'      => "Authentic 5-pocket denim styling with 3D whiskers at front hip, local hand scraping, and stretch recovery.",
                'status'           => 'Bulk_Approved',
                'is_active'        => true,
                'colors' => [
                    ['color_code' => 'CLR-01', 'color_name' => 'Vintage Dark Indigo', 'pantone_ref' => '19-4024 TCX', 'hex_code' => '#1d2731'],
                    ['color_code' => 'CLR-02', 'color_name' => 'Washed Medium Blue', 'pantone_ref' => '18-4020 TCX', 'hex_code' => '#3b5978'],
                    ['color_code' => 'CLR-03', 'color_name' => 'Bleached Light Wash', 'pantone_ref' => '15-4008 TCX', 'hex_code' => '#8ca6c0'],
                ],
                'sizes' => ['30x30', '30x32', '32x30', '32x32', '34x32', '36x32'],
            ],

            // 2. Category: Woven Bottoms (Trousers/Chinos) | Item: Casual Chino Pant
            [
                'brand_id'         => $aeoBrand?->id,
                'buyer_style_no'   => 'AEO-CHN-2602',
                'style_name'       => "Flex Motion Casual Stretch Chino Pant",
                'product_category' => 'Woven Bottoms (Trousers/Chinos)',
                'garment_item'     => 'Casual Chino Pant',
                'fabric_type'      => '98% Cotton 2% Spandex Stretch Twill (240 GSM)',
                'season'           => 'Spring/Summer 2026',
                'base_smv'         => 14.25,
                'wash_type'        => 'Enzyme Wash, Silicone Softener',
                'description'      => "Slanted front slash pockets, button-through jet back pockets, clean interior waistband with Oxford piping.",
                'status'           => 'Confirmed',
                'is_active'        => true,
                'colors' => [
                    ['color_code' => 'CLR-04', 'color_name' => 'British Khaki', 'pantone_ref' => '16-1108 TCX', 'hex_code' => '#c2a688'],
                    ['color_code' => 'CLR-05', 'color_name' => 'Midnight Navy', 'pantone_ref' => '19-3923 TCX', 'hex_code' => '#1b2333'],
                    ['color_code' => 'CLR-06', 'color_name' => 'Military Olive Green', 'pantone_ref' => '18-0527 TCX', 'hex_code' => '#3f4f34'],
                ],
                'sizes' => ['28', '30', '32', '34', '36', '38'],
            ],

            // 3. Category: Woven Tops (Shirts/Blouses) | Item: Casual Button-Down Shirt
            [
                'brand_id'         => $aerieBrand?->id ?? $aeoBrand?->id,
                'buyer_style_no'   => 'AEO-SHT-2603',
                'style_name'       => "Classic Fit Yarn-Dyed Oxford Button-Down Shirt",
                'product_category' => 'Woven Tops (Shirts/Blouses)',
                'garment_item'     => 'Casual Button-Down Shirt',
                'fabric_type'      => '100% Cotton Yarn-Dyed Oxford (140 GSM)',
                'season'           => 'Autumn/Winter 2026',
                'base_smv'         => 16.80,
                'wash_type'        => 'None / Raw / Rinse',
                'description'      => "Classic button-down collar, box pleat with locker loop at back yoke, single chest pocket, curved hem.",
                'status'           => 'Bulk_Approved',
                'is_active'        => true,
                'colors' => [
                    ['color_code' => 'CLR-07', 'color_name' => 'Optical White', 'pantone_ref' => '11-0601 TCX', 'hex_code' => '#f8fafc'],
                    ['color_code' => 'CLR-08', 'color_name' => 'Sky Blue Chambray', 'pantone_ref' => '14-4115 TCX', 'hex_code' => '#9ec0db'],
                    ['color_code' => 'CLR-09', 'color_name' => 'French Navy Gingham', 'pantone_ref' => '19-4010 TCX', 'hex_code' => '#1e3a8a'],
                ],
                'sizes' => ['S', 'M', 'L', 'XL', '2XL'],
            ],

            // 4. Category: Cargo & Utility Shorts | Item: Multi-Pocket Cargo Shorts
            [
                'brand_id'         => $aeoBrand?->id,
                'buyer_style_no'   => 'AEO-CRG-2604',
                'style_name'       => "Rugged Ripstop Multi-Pocket Cargo Shorts",
                'product_category' => 'Cargo & Utility Shorts',
                'garment_item'     => 'Multi-Pocket Cargo Shorts',
                'fabric_type'      => '100% Cotton Ripstop (210 GSM)',
                'season'           => 'Spring/Summer 2026',
                'base_smv'         => 13.50,
                'wash_type'        => 'Stone Enzyme Wash, Tint & Distress',
                'description'      => "Gusseted dual cargo side pockets with concealed Velcro flaps, reinforced seat and triple needle seam stitching.",
                'status'           => 'Confirmed',
                'is_active'        => true,
                'colors' => [
                    ['color_code' => 'CLR-10', 'color_name' => 'Faded Khaki Camo', 'pantone_ref' => '16-0836 TCX', 'hex_code' => '#8f886f'],
                    ['color_code' => 'CLR-11', 'color_name' => 'Desert Sand', 'pantone_ref' => '13-0905 TCX', 'hex_code' => '#d6c7b2'],
                ],
                'sizes' => ['30', '32', '34', '36', '38'],
            ],

            // 5. Category: Outerwear / Woven Jackets | Item: Denim Trucker Jacket
            [
                'brand_id'         => $aeoBrand?->id,
                'buyer_style_no'   => 'AEO-JCK-2605',
                'style_name'       => "Heritage Raw Indigo Denim Trucker Jacket",
                'product_category' => 'Outerwear / Woven Jackets',
                'garment_item'     => 'Denim Trucker Jacket',
                'fabric_type'      => '100% Cotton Heavyweight Denim (13.5 oz)',
                'season'           => 'Autumn/Winter 2026',
                'base_smv'         => 24.00,
                'wash_type'        => 'Enzyme Wash, Resin 3D Crinkle',
                'description'      => "Point collar, metal shank button closure, flap chest pockets with button closures, adjustable side tabs at waist.",
                'status'           => 'Sampling',
                'is_active'        => true,
                'colors' => [
                    ['color_code' => 'CLR-12', 'color_name' => 'Raw Rigid Indigo', 'pantone_ref' => '19-4024 TCX', 'hex_code' => '#141c24'],
                    ['color_code' => 'CLR-13', 'color_name' => 'Washed Vintage Blue', 'pantone_ref' => '18-4020 TCX', 'hex_code' => '#324a64'],
                ],
                'sizes' => ['S', 'M', 'L', 'XL', '2XL'],
            ],
        ];

        $year = date('y');
        $shortCode = strtoupper($company->code);
        $prefix = "{$shortCode}-STY-{$year}-";

        foreach ($stylesData as $index => $item) {
            $seqNumber = $index + 1;
            $code = $prefix . str_pad((string) $seqNumber, 4, '0', STR_PAD_LEFT);

            $style = Style::where('company_id', $company->id)
                ->where('buyer_style_no', $item['buyer_style_no'])
                ->first();

            if ($style) {
                $style->update([
                    'code'             => $code,
                    'buyer_id'         => $buyer->id,
                    'brand_id'         => $item['brand_id'],
                    'style_name'       => $item['style_name'],
                    'product_category' => $item['product_category'],
                    'garment_item'     => $item['garment_item'],
                    'fabric_type'      => $item['fabric_type'],
                    'season'           => $item['season'],
                    'base_smv'         => $item['base_smv'],
                    'wash_type'        => $item['wash_type'],
                    'description'      => $item['description'],
                    'status'           => $item['status'],
                    'is_active'        => $item['is_active'],
                ]);
            } else {
                $style = Style::create([
                    'uuid'             => (string) Str::uuid(),
                    'company_id'       => $company->id,
                    'buyer_id'         => $buyer->id,
                    'brand_id'         => $item['brand_id'],
                    'code'             => $code,
                    'buyer_style_no'   => $item['buyer_style_no'],
                    'style_name'       => $item['style_name'],
                    'product_category' => $item['product_category'],
                    'garment_item'     => $item['garment_item'],
                    'fabric_type'      => $item['fabric_type'],
                    'season'           => $item['season'],
                    'base_smv'         => $item['base_smv'],
                    'wash_type'        => $item['wash_type'],
                    'description'      => $item['description'],
                    'status'           => $item['status'],
                    'is_active'        => $item['is_active'],
                ]);
            }

            // Sync Colors with explicit UUID
            $style->colors()->delete();
            foreach ($item['colors'] as $c) {
                $style->colors()->create([
                    'uuid'        => (string) Str::uuid(),
                    'color_code'  => $c['color_code'],
                    'color_name'  => $c['color_name'],
                    'pantone_ref' => $c['pantone_ref'],
                    'hex_code'    => $c['hex_code'],
                    'is_active'   => true,
                ]);
            }

            // Sync Sizes with explicit UUID
            $style->sizes()->delete();
            foreach ($item['sizes'] as $sIdx => $sizeName) {
                $style->sizes()->create([
                    'uuid'       => (string) Str::uuid(),
                    'size_name'  => $sizeName,
                    'sort_order' => $sIdx + 1,
                    'is_active'  => true,
                ]);
            }

            $this->command->info("   -> [{$style->code}] {$style->style_name} | Category: {$style->product_category} | Item: {$style->garment_item} (UUID: {$style->uuid})");
        }

        $this->command->info("🎉 Successfully seeded " . count($stylesData) . " Woven Garments Styles for {$company->name} ({$company->code}).");
    }
}
