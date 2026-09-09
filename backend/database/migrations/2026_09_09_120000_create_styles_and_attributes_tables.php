<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates dedicated 100% Woven Style Library, Colors, and Sizes tables.
     */
    public function up(): void
    {
        // 1. Woven Styles Master Table
        Schema::create('styles', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->constrained('companies')->onDelete('restrict');
            $table->foreignId('buyer_id')->constrained('buyers')->onDelete('restrict');
            $table->foreignId('brand_id')->nullable()->constrained('brands')->onDelete('set null');
            
            // System Auto-generated immutable tracking code: e.g. AWL-STY-26-0001
            $table->string('code')->unique();

            // Buyer given official style number / identifier: e.g. HM-9902
            $table->string('buyer_style_no');

            // Commercial descriptive name: e.g. Men's 5-Pocket Slim Denim Pant
            $table->string('style_name');

            // Exclusively 100% Woven categories
            // 'Woven Tops', 'Woven Bottoms', 'Denim & Jeans', 'Cargo & Shorts', 'Outerwear / Jackets'
            $table->string('product_category');

            // Specific garment item: e.g. Chino Pant, Cargo Short, Dress Shirt, Trucker Jacket
            $table->string('garment_item');

            // Woven fabric construction: e.g. 100% Cotton Twill, Denim (12 oz Spandex), Poplin, Canvas
            $table->string('fabric_type');

            // Season specification: e.g. Spring/Summer 2026
            $table->string('season');

            // Industrial Engineering (IE) Standard Minute Value
            $table->decimal('base_smv', 5, 2)->default(0.00);

            // Industrial Garment Wash Types
            // e.g. Raw / Rinse, Enzyme Wash, Stone Enzyme, Bleach Wash, Acid Wash, Tint & Distress
            $table->string('wash_type')->default('Raw / Rinse');

            $table->text('description')->nullable();

            // Lifecycle status: 'Development', 'Sampling', 'Confirmed', 'Bulk_Approved', 'Discontinued'
            $table->string('status')->default('Development');

            // Binary operational status
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Composite uniqueness: One buyer cannot have the same buyer_style_no twice
            $table->unique(['buyer_id', 'buyer_style_no', 'deleted_at'], 'unique_buyer_style_no');
            $table->index(['company_id', 'is_active']);
            $table->index(['buyer_id', 'is_active']);
        });

        // 2. Style Colorways (Child Table)
        Schema::create('style_colors', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('style_id')->constrained('styles')->onDelete('cascade');
            $table->string('color_code'); // e.g. BLK-01
            $table->string('color_name'); // e.g. Washed Vintage Black
            $table->string('pantone_ref')->nullable(); // e.g. 19-4007 TCX
            $table->string('hex_code')->nullable(); // e.g. #1A1A1A
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['style_id', 'is_active']);
        });

        // 3. Style Size Scale (Child Table)
        Schema::create('style_sizes', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('style_id')->constrained('styles')->onDelete('cascade');
            $table->string('size_name'); // e.g. 28, 30, 32 or S, M, L, XL
            $table->integer('sort_order')->default(0); // for ratio matrix sorting
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['style_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('style_sizes');
        Schema::dropIfExists('style_colors');
        Schema::dropIfExists('styles');
    }
};
