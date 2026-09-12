<?php

namespace Tests\Feature;

use App\Models\Buyer;
use App\Models\Company;
use App\Models\PurchaseOrder;
use App\Models\Style;
use App\Models\StyleColor;
use App\Models\StyleSize;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PurchaseOrderIntegrationTest extends TestCase
{
    protected User $user;
    protected Company $company;
    protected Buyer $buyer;
    protected Style $style;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::first() ?? User::factory()->create();
        Sanctum::actingAs($this->user, ['*']);

        $this->style = Style::with(['colors', 'sizes', 'buyer', 'company'])->first();
        $this->company = $this->style->company;
        $this->buyer = $this->style->buyer;
    }

    public function test_can_fetch_next_order_code(): void
    {
        $response = $this->getJson("/api/v1/orders/next-code?company_id={$this->company->id}");
        $response->assertStatus(200);
        $response->assertJsonStructure(['success', 'next_code', 'company_code']);
        $this->assertStringContainsString('-ORD-', $response->json('next_code'));
    }

    public function test_can_create_purchase_order_with_color_size_matrix(): void
    {
        $colors = $this->style->colors;
        $sizes = $this->style->sizes;

        $c1 = $colors->first();
        $s1 = $sizes->first();
        $s2 = $sizes->skip(1)->first();

        $poNumber = 'TEST-PO-' . time();
        $payload = [
            'company_id'            => $this->company->id,
            'buyer_id'              => $this->buyer->id,
            'style_id'              => $this->style->id,
            'buyer_po_number'       => $poNumber,
            'order_placement_date'  => date('Y-m-d'),
            'factory_delivery_date' => date('Y-m-d', strtotime('+30 days')),
            'buyer_delivery_date'   => date('Y-m-d', strtotime('+35 days')),
            'currency'              => 'USD',
            'unit_price'            => 14.50,
            'total_order_qty'       => 1500,
            'shipment_mode'         => 'SEA',
            'delivery_destination'  => 'Hamburg Port',
            'status'                => 'Draft',
            'breakdowns'            => [
                [
                    'style_color_id'    => $c1->id,
                    'style_size_id'     => $s1->id,
                    'order_qty'         => 1000,
                    'excess_percentage' => 3.0,
                ],
                [
                    'style_color_id'    => $c1->id,
                    'style_size_id'     => $s2 ? $s2->id : $s1->id,
                    'order_qty'         => 500,
                    'excess_percentage' => 3.0,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);
        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.buyer_po_number', $poNumber);
        $response->assertJsonPath('data.total_order_qty', 1500);

        $orderId = $response->json('data.id');
        $this->assertDatabaseHas('purchase_orders', [
            'id' => $orderId,
            'buyer_po_number' => $poNumber,
            'order_qty' => 1500,
        ]);

        $this->assertDatabaseHas('po_breakdowns', [
            'purchase_order_id' => $orderId,
            'quantity' => 1000,
        ]);

        // Test Show PO
        $showResponse = $this->getJson("/api/v1/orders/{$orderId}");
        $showResponse->assertStatus(200);
        $showResponse->assertJsonPath('data.id', $orderId);
        $showResponse->assertJsonPath('data.total_order_qty', 1500);

        // Test Update PO
        $updatePayload = [
            'unit_price' => 15.00,
            'status' => 'Confirmed',
        ];
        $updateResponse = $this->putJson("/api/v1/orders/{$orderId}", $updatePayload);
        $updateResponse->assertStatus(200);
        $updateResponse->assertJsonPath('data.status', 'Confirmed');

        // Test List PO
        $listResponse = $this->getJson("/api/v1/orders?search={$poNumber}");
        $listResponse->assertStatus(200);
        $this->assertCount(1, $listResponse->json('data'));

        // Clean up
        $deleteResponse = $this->deleteJson("/api/v1/orders/{$orderId}");
        $deleteResponse->assertStatus(200);
    }
}
