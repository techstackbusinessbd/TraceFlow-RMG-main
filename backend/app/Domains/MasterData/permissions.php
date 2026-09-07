<?php

return [
    'label' => 'Master Data Management Library',
    'submodules' => [
        'buyers' => [
            'label' => 'Buyer & Brand Directory',
            'resources' => [
                'profile' => [
                    'label' => 'Buyer Profile',
                    'actions' => [
                        'view' => 'View Buyers List and Profile',
                        'create' => 'Create New Buyer',
                        'update' => 'Update Buyer Information',
                        'delete' => 'Soft Delete Buyer',
                        'export' => 'Export Buyers Data to Excel/CSV',
                    ],
                ],
                'brands' => [
                    'label' => 'Buyer Brands',
                    'actions' => [
                        'view' => 'View Buyer Brands',
                        'create' => 'Add New Brand to Buyer',
                        'update' => 'Update Brand Details',
                        'delete' => 'Remove Brand',
                    ],
                ],
            ],
        ],
        'styles' => [
            'label' => 'Style & Garment Library',
            'resources' => [
                'profile' => [
                    'label' => 'Style Catalog',
                    'actions' => [
                        'view' => 'View Styles and Tech Packs',
                        'create' => 'Register New Style',
                        'update' => 'Edit Style Specifications & SMV',
                        'delete' => 'Soft Delete Style',
                    ],
                ],
            ],
        ],
        'lines' => [
            'label' => 'Factory Floor Lines & Workstations',
            'resources' => [
                'setup' => [
                    'label' => 'Line Configuration',
                    'actions' => [
                        'view' => 'View Factory Sewing Lines',
                        'create' => 'Add New Production Line',
                        'update' => 'Update Line Capacity & Operators',
                        'delete' => 'Deactivate Line',
                    ],
                ],
            ],
        ],
    ],
];
