<?php

return [
    'label' => 'System Administration & Security Engine',
    'submodules' => [
        'users' => [
            'label' => 'User Management & Accounts',
            'resources' => [
                'account' => [
                    'label' => 'User Account',
                    'actions' => [
                        'view' => 'View User Directory and Profile Details',
                        'create' => 'Create New User Account',
                        'update' => 'Update User Details and Permissions',
                        'delete' => 'Soft Delete User Account',
                        'restore' => 'Restore Soft Deleted Account',
                        'force_delete' => 'Permanent Hard Purge Account (Strict Super Admin Only)',
                    ],
                ],
            ],
        ],
        'roles' => [
            'label' => 'Role & Permission Governance',
            'resources' => [
                'matrix' => [
                    'label' => 'Permission Matrix',
                    'actions' => [
                        'view' => 'View Roles and Assigned Permissions',
                        'create' => 'Create New Enterprise Role',
                        'update' => 'Modify Role Permissions Matrix',
                        'delete' => 'Delete Non-System Roles',
                    ],
                ],
            ],
        ],
        'devices' => [
            'label' => 'Hardware Floor Tablets & Devices',
            'resources' => [
                'pairing' => [
                    'label' => 'Tablet Pairing & Telemetry',
                    'actions' => [
                        'view' => 'View Registered Floor Stations',
                        'pair' => 'Generate One-Time Cryptographic Pairing PIN',
                        'revoke' => 'Remote Instant Revocation & Wipe',
                    ],
                ],
            ],
        ],
    ],
];
