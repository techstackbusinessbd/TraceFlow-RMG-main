<?php

return [
    'label' => 'Order Management & Purchase Orders',
    'submodules' => [
        'purchase_orders' => [
            'label' => 'Buyer Purchase Orders & Matrix',
            'resources' => [
                'profile' => [
                    'label' => 'Purchase Order Execution',
                    'actions' => [
                        'view' => 'View Purchase Orders List and Matrix',
                        'create' => 'Create New Purchase Order (Manual or Import)',
                        'update' => 'Edit Purchase Order and Ratios',
                        'delete' => 'Soft Delete Purchase Order',
                        'confirm' => 'Confirm PO for Production and Cutting Release',
                        'export' => 'Export Purchase Orders and Matrix Breakdown',
                    ],
                ],
            ],
        ],
    ],
];
