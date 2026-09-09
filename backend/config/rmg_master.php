<?php

return [

    /*
    |--------------------------------------------------------------------------
    | TraceFlow RMG — Centralized Master Metadata & Domain Configuration
    |--------------------------------------------------------------------------
    | Single Source of Truth for woven classifications, garment items, fabric
    | constructions, industrial wash treatments, commercial seasons, and size scales.
    */

    // 100% Woven Apparel Categories
    'woven_categories' => [
        'Woven Tops (Shirts/Blouses)',
        'Woven Bottoms (Trousers/Chinos)',
        'Denim & Jeans',
        'Cargo & Utility Shorts',
        'Outerwear / Woven Jackets',
    ],

    // Category-Dependent Woven Garment Items
    'category_items' => [
        'Woven Tops (Shirts/Blouses)' => [
            'Formal Dress Shirt',
            'Casual Button-Down Shirt',
            'Flannel Overshirt',
            'Short-Sleeve Resort Shirt',
            'Woven Tunic / Blouse',
        ],
        'Woven Bottoms (Trousers/Chinos)' => [
            'Casual Chino Pant',
            'Slim Fit Stretch Chino',
            'Tailored Dress Trouser',
            'Pleated Work Trouser',
            'Jogger Woven Pant',
        ],
        'Denim & Jeans' => [
            '5-Pocket Denim Jeans',
            'Slim Tapered Denim Pant',
            'Relaxed Fit Denim Jeans',
            'Denim Trucker Jacket',
            'Denim Carpenter Pant',
        ],
        'Cargo & Utility Shorts' => [
            'Cargo Utility Pant',
            'Multi-Pocket Cargo Shorts',
            'Bermuda Shorts',
            'Chino Casual Shorts',
            'Tactical Field Shorts',
        ],
        'Outerwear / Woven Jackets' => [
            'Woven Blazer / Suit Jacket',
            'Harrington Cotton Jacket',
            'Field Parka / Windbreaker',
            'Safari Utility Overshirt',
            'Puffer Woven Vest',
        ],
    ],

    // Flat fallback list of all unique garment items
    'garment_items' => [
        'Casual Chino Pant',
        '5-Pocket Denim Jeans',
        'Cargo Utility Pant',
        'Bermuda Shorts',
        'Formal Dress Shirt',
        'Casual Button-Down Shirt',
        'Flannel Overshirt',
        'Woven Blazer / Jacket',
    ],

    // Popular Fabric Weaves & Technical Constructions
    'fabric_constructions' => [
        '100% Cotton Twill (240 GSM)',
        '98% Cotton 2% Spandex Stretch Twill',
        '100% Cotton Poplin (120 GSM)',
        '100% Cotton Oxford Weave',
        '100% Cotton Indigo Denim (12 oz)',
        '99% Cotton 1% Elastane Denim',
        '65% Polyester 35% Cotton (TC) Twill',
        '100% Linen Plain Weave',
    ],

    // Industrial Wet & Dry Garment Wash Types
    'wash_types' => [
        'None / Raw / Rinse',
        'Enzyme Wash',
        'Stone Enzyme Wash',
        'Bleach Wash',
        'Acid Wash',
        'Tint & Distress',
        'Resin 3D Crinkle',
    ],

    // Commercial & Fashion Delivery Seasons
    'seasons' => [
        'eu' => [
            'Spring/Summer',
            'Autumn/Winter',
            'Pre-Fall',
            'Holiday',
            'All Seasons / Carry Over',
        ],
        'us' => [
            'Spring',
            'Summer',
            'Fall',
            'Holiday',
            'Resort / Cruise',
            'Back to School',
            'All Seasons / Carry Over',
        ],
        'years' => [
            '2025',
            '2026',
            '2027',
            '2028',
            '2029',
            '2030',
        ],
    ],

    // Standard Industrial Apparel Size Scales
    'size_scales' => [
        "Men's Tops" => ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        'Waist (Inches)' => ['28', '30', '32', '34', '36', '38', '40'],
        'Waist x Inseam' => ['30x32', '32x32', '34x32', '36x32', '38x32'],
    ],

    // Commercial Sourcing & Banking Payment Terms
    'payment_terms' => [
        'LC at Sight',
        'Usance LC 30 Days',
        'Usance LC 60 Days',
        'Usance LC 90 Days',
        'TT / Advance',
        'Open Account (CAD)',
    ],

    // Style Lifecycle Statuses
    'style_statuses' => [
        'Development' => 'Development (TechPack Review)',
        'Sampling' => 'Sampling (Proto / Fit)',
        'Confirmed' => 'Confirmed (Ready for PO)',
        'Bulk_Approved' => 'Bulk Approved (In Production)',
        'Discontinued' => 'Discontinued',
    ],
];
