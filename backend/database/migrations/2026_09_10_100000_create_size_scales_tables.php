<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Size Scale Groups Master
        Schema::create('size_scales', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            
            // System Auto-generated Code (e.g. AWL-SZS-01 or GLB-SZS-01)
            $table->string('code')->unique();
            
            // Commercial Scale Name: e.g. Men's Tops Alpha, Denim Waist (28-40)
            $table->string('name');
            
            // Garment Category scoping: 'Woven Tops', 'Woven Bottoms', 'Denim & Jeans', 'Universal'
            $table->string('category')->default('Universal');
            
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'is_active']);
            $table->index(['category', 'is_active']);
        });

        // 2. Size Scale Entries (Ordered Sizes belonging to Scale)
        Schema::create('size_scale_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('size_scale_id')->constrained('size_scales')->onDelete('cascade');
            $table->string('size_name'); // e.g. S, M, L, XL or 28, 30, 32
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['size_scale_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('size_scale_entries');
        Schema::dropIfExists('size_scales');
    }
};
