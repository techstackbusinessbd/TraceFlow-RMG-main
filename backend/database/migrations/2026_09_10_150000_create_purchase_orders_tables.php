<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates dedicated purchase_orders and po_breakdowns tables.
     */
    public function up(): void
    {
        // 1. Purchase Orders Table
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained('companies')->onDelete('restrict');
            $table->foreignId('buyer_id')->constrained('buyers')->onDelete('restrict');
            $table->foreignId('style_id')->constrained('styles')->onDelete('restrict');
            
            // System Auto-generated immutable tracking code: [CompanyShortCode]-ORD-[YY]-[Sequential]
            // e.g. SDL-ORD-26-0001
            $table->string('order_code', 35)->unique();

            // Buyer's official Purchase Order Number: e.g. PO-88902, PO-LEVI-9921
            $table->string('buyer_po_number', 100);

            // Commercial Season specification: e.g. Summer 2026
            $table->string('season_name', 60);

            // Total PO gross pieces (Must be > 0)
            $table->unsignedInteger('order_qty');

            // Unit FOB Price per piece
            $table->decimal('unit_price', 10, 4)->default(0.0000);
            $table->string('currency', 10)->default('USD');

            // Key Commercial Milestone Dates
            $table->date('order_date');
            $table->date('ex_factory_date');
            $table->date('delivery_date');

            // Logistics & Shipment
            $table->string('shipment_mode', 20)->default('Sea'); // Sea, Air, Sea-Air, Road
            $table->string('destination_port', 100)->nullable();

            // Document Attachment (Original Buyer Sheet)
            $table->string('po_file_url', 500)->nullable();
            $table->string('po_file_name', 255)->nullable();
            $table->unsignedBigInteger('po_file_size')->nullable();

            // Entry Mode: 'Manual', 'Excel_Import', 'PDF_Import'
            $table->string('entry_mode', 20)->default('Manual');

            // Lifecycle status: 'Draft', 'Confirmed', 'In_Cutting', 'In_Sewing', 'Shipped', 'Cancelled'
            $table->string('status', 30)->default('Draft');

            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
            $table->softDeletes();

            // Composite uniqueness: One buyer cannot have the same buyer_po_number twice
            $table->unique(['buyer_id', 'buyer_po_number', 'deleted_at'], 'unique_buyer_po_number');
            $table->index(['company_id', 'status']);
            $table->index(['style_id', 'status']);
            $table->index(['buyer_id', 'delivery_date']);
        });

        // 2. PO Color & Size Breakdown Matrix (Child Table)
        Schema::create('po_breakdowns', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('cascade');
            
            // Reference to style_colors or colors_master if linked
            $table->foreignId('color_id')->nullable()->constrained('style_colors')->onDelete('set null');
            $table->string('color_code', 50);
            $table->string('color_name', 100);

            // Size specification
            $table->string('size_name', 50);
            $table->integer('size_sort_order')->default(0);

            // Intersected quantity in pieces
            $table->unsignedInteger('quantity')->default(0);

            // Planned excess cut percentage allowance (e.g. 3.00%)
            $table->decimal('excess_cut_pct', 5, 2)->default(0.00);

            $table->timestamps();

            $table->index(['purchase_order_id', 'color_code']);
            $table->index(['purchase_order_id', 'size_sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('po_breakdowns');
        Schema::dropIfExists('purchase_orders');
    }
};
