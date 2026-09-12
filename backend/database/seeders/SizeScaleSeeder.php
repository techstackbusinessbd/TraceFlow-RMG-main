<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\ColorMaster;
use App\Models\SizeScale;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SizeScaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('📏 Seeding Size Scales & Colors Master Library for ITSL...');

        $company = Company::where('code', 'ITSL')->first() ?? Company::where('code', '!=', 'PLT')->first();
        $companyId = $company ? $company->id : null;
        $prefix = $company ? strtoupper($company->code) : 'ITSL';

        // 1. Standard Size Scales for Woven Product Categories (SRS-RMG-M02-SIZE-MASTER-CORE-02 Compliant)
        $scales = [
            // Woven Tops
            [
                'code'        => "{$prefix}-SZS-01",
                'name'        => "Men's Tops (Alpha Scale: XS-4XL)",
                'category'    => "Woven Tops (Shirts/Blouses)",
                'description' => "Standard alpha sizing for dress shirts, casual shirts, and overshirts.",
                'entries'     => ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'],
            ],
            [
                'code'        => "{$prefix}-SZS-02",
                'name'        => "Men's Formal Dress Shirt (Neck Inch)",
                'category'    => "Woven Tops (Shirts/Blouses)",
                'description' => "Collar neck inch sizing for formal business woven shirts.",
                'entries'     => ['14.5', '15.0', '15.5', '16.0', '16.5', '17.0', '17.5', '18.0'],
            ],
            [
                'code'        => "{$prefix}-SZS-03",
                'name'        => "Men's Formal Shirt EU Collar (cm)",
                'category'    => "Woven Tops (Shirts/Blouses)",
                'description' => "European metric collar centimeter scale for tailored dress shirts.",
                'entries'     => ['37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
            ],
            [
                'code'        => "{$prefix}-SZS-04",
                'name'        => "Women's Woven Tops (Alpha: XXS-XXL)",
                'category'    => "Woven Tops (Shirts/Blouses)",
                'description' => "Standard alpha scale for women's woven tunics, shirts, and blouses.",
                'entries'     => ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
            ],
            [
                'code'        => "{$prefix}-SZS-05",
                'name'        => "Women's Tops / Blouses (US Numeric: 0-16)",
                'category'    => "Woven Tops (Shirts/Blouses)",
                'description' => "US numeric sizing for women's woven blouses and shirts.",
                'entries'     => ['0', '2', '4', '6', '8', '10', '12', '14', '16'],
            ],

            // Woven Bottoms, Chinos & Trousers
            [
                'code'        => "{$prefix}-SZS-06",
                'name'        => "Men's Chinos / Trousers Waist (Inches: 28-42)",
                'category'    => "Woven Bottoms (Trousers/Chinos)",
                'description' => "Standard single-dimension waist scale for chinos, trousers, and workwear pants.",
                'entries'     => ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42'],
            ],
            [
                'code'        => "{$prefix}-SZS-07",
                'name'        => "Woven Bottoms / Joggers (Alpha: S-3XL)",
                'category'    => "Woven Bottoms (Trousers/Chinos)",
                'description' => "Alpha sizing for elastic waist woven joggers and utility bottoms.",
                'entries'     => ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
            ],
            [
                'code'        => "{$prefix}-SZS-08",
                'name'        => "Women's Chinos / Pants Waist (Inches: 24-34)",
                'category'    => "Woven Bottoms (Trousers/Chinos)",
                'description' => "Standard waist scale for women's woven trousers and capris.",
                'entries'     => ['24', '25', '26', '27', '28', '29', '30', '31', '32', '34'],
            ],

            // Denim & Jeans 2D Waist x Inseam Matrix
            [
                'code'        => "{$prefix}-SZS-09",
                'name'        => "Denim 2D Waist × Inseam (Standard: 30x30 to 38x34)",
                'category'    => "Denim & Jeans",
                'description' => "Dual-dimension waist x inseam length matrix for denim jeans and 5-pocket pants.",
                'entries'     => [
                    '30x30', '30x32',
                    '32x30', '32x32', '32x34',
                    '34x30', '34x32', '34x34',
                    '36x32', '36x34',
                    '38x32', '38x34',
                ],
            ],
            [
                'code'        => "{$prefix}-SZS-10",
                'name'        => "Denim Extended Scale (Big & Tall: 38-44)",
                'category'    => "Denim & Jeans",
                'description' => "Extended dual-dimension matrix for Big & Tall denim jeans lines.",
                'entries'     => [
                    '38x32', '38x34',
                    '40x32', '40x34',
                    '42x32', '42x34',
                    '44x32', '44x34',
                ],
            ],

            // Cargo & Utility Shorts
            [
                'code'        => "{$prefix}-SZS-11",
                'name'        => "Cargo & Utility Shorts Waist (30-40)",
                'category'    => "Cargo & Utility Shorts",
                'description' => "Waist scale for cargo shorts, bermuda shorts, and field shorts.",
                'entries'     => ['30', '32', '34', '36', '38', '40'],
            ],

            // Tailored Suiting & Outerwear
            [
                'code'        => "{$prefix}-SZS-12",
                'name'        => "Men's Tailored Suiting (Chest + Fit: 36S-44L)",
                'category'    => "Outerwear / Woven Jackets",
                'description' => "Chest dimension with fit length suffix (Short, Regular, Long) for woven suits and blazers.",
                'entries'     => ['36S', '38S', '38R', '40S', '40R', '40L', '42R', '42L', '44R', '44L'],
            ],
            [
                'code'        => "{$prefix}-SZS-13",
                'name'        => "Men's European Tailored Drop (EU: 44-58)",
                'category'    => "Outerwear / Woven Jackets",
                'description' => "European drop sizing scale for tailored woven jackets and suits.",
                'entries'     => ['44', '46', '48', '50', '52', '54', '56', '58'],
            ],
            [
                'code'        => "{$prefix}-SZS-14",
                'name'        => "Outerwear / Woven Jackets (Alpha: S-3XL)",
                'category'    => "Outerwear / Woven Jackets",
                'description' => "Sizing scale for casual woven parkas, windbreakers, and light jackets.",
                'entries'     => ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
            ],

            // Kids & Toddler Woven Wear
            [
                'code'        => "{$prefix}-SZS-15",
                'name'        => "Baby Infant Months (0-3M to 18-24M)",
                'category'    => "Universal",
                'description' => "Age months scale for infant woven rompers, bodysuits, and baby shirts.",
                'entries'     => ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'],
            ],
            [
                'code'        => "{$prefix}-SZS-16",
                'name'        => "Toddler Woven Scale (2T-5T)",
                'category'    => "Universal",
                'description' => "US toddler sizing for young children woven shirts, pants, and shorts.",
                'entries'     => ['2T', '3T', '4T', '5T'],
            ],
            [
                'code'        => "{$prefix}-SZS-17",
                'name'        => "Kids Junior Woven (4-5Y to 14Y)",
                'category'    => "Universal",
                'description' => "Junior age years scale for kids woven apparel and school uniforms.",
                'entries'     => ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y', '14Y'],
            ],
            [
                'code'        => "{$prefix}-SZS-18",
                'name'        => "Kids Height EU Metric (92cm-152cm)",
                'category'    => "Universal",
                'description' => "European body height metric scale (cm) for junior woven garments.",
                'entries'     => ['92', '98', '104', '110', '116', '122', '128', '134', '140', '146', '152'],
            ],
        ];

        foreach ($scales as $sData) {
            $scale = SizeScale::where('code', $sData['code'])->first();

            if ($scale) {
                $scale->update([
                    'company_id'  => $companyId,
                    'name'        => $sData['name'],
                    'category'    => $sData['category'],
                    'description' => $sData['description'],
                    'is_active'   => true,
                ]);
            } else {
                $scale = SizeScale::create([
                    'uuid'        => (string) Str::uuid(),
                    'code'        => $sData['code'],
                    'company_id'  => $companyId,
                    'name'        => $sData['name'],
                    'category'    => $sData['category'],
                    'description' => $sData['description'],
                    'is_active'   => true,
                ]);
            }

            // Populate entries
            $scale->entries()->delete();
            foreach ($sData['entries'] as $idx => $sizeName) {
                $scale->entries()->create([
                    'size_name'  => $sizeName,
                    'sort_order' => $idx + 1,
                ]);
            }

            $this->command->info("   -> Size Scale: {$scale->name} (Code: {$scale->code} | Category: {$scale->category} | UUID: {$scale->uuid})");
        }

        // 2. Standard Global Colors Master Library
        $colors = [
            ['color_code' => 'BLK-01', 'color_name' => 'Jet Black', 'pantone_ref' => '19-0303 TCX', 'hex_code' => '#111827'],
            ['color_code' => 'BLK-02', 'color_name' => 'Washed Vintage Black', 'pantone_ref' => '19-4007 TCX', 'hex_code' => '#1f2937'],
            ['color_code' => 'NVY-01', 'color_name' => 'Midnight Navy', 'pantone_ref' => '19-4010 TCX', 'hex_code' => '#1e3a8a'],
            ['color_code' => 'NVY-02', 'color_name' => 'Classic Dark Navy', 'pantone_ref' => '19-3921 TCX', 'hex_code' => '#172554'],
            ['color_code' => 'WHT-01', 'color_name' => 'Optical White', 'pantone_ref' => '11-0601 TCX', 'hex_code' => '#f8fafc'],
            ['color_code' => 'KHK-01', 'color_name' => 'British Khaki', 'pantone_ref' => '16-0924 TCX', 'hex_code' => '#a18262'],
            ['color_code' => 'OLV-01', 'color_name' => 'Military Olive Green', 'pantone_ref' => '18-0527 TCX', 'hex_code' => '#3f4f34'],
            ['color_code' => 'GRY-01', 'color_name' => 'Heather Charcoal Grey', 'pantone_ref' => '18-4005 TCX', 'hex_code' => '#4b5563'],
            ['color_code' => 'BLU-01', 'color_name' => 'Vintage Indigo Blue', 'pantone_ref' => '19-4024 TCX', 'hex_code' => '#2563eb'],
            ['color_code' => 'BEI-01', 'color_name' => 'Stone Sand Beige', 'pantone_ref' => '13-0905 TCX', 'hex_code' => '#d6c7b2'],
        ];

        foreach ($colors as $c) {
            $color = ColorMaster::where('color_code', $c['color_code'])->first();

            if ($color) {
                $color->update([
                    'company_id'  => $companyId,
                    'color_name'  => $c['color_name'],
                    'pantone_ref' => $c['pantone_ref'],
                    'hex_code'    => $c['hex_code'],
                    'is_active'   => true,
                ]);
            } else {
                $color = ColorMaster::create([
                    'uuid'        => (string) Str::uuid(),
                    'company_id'  => $companyId,
                    'color_code'  => $c['color_code'],
                    'color_name'  => $c['color_name'],
                    'pantone_ref' => $c['pantone_ref'],
                    'hex_code'    => $c['hex_code'],
                    'is_active'   => true,
                ]);
            }
        }

        $this->command->info("   -> Colors Master Library (" . count($colors) . " colors) seeded successfully.");
    }
}
