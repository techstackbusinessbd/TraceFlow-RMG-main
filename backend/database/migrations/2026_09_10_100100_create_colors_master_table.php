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
        // Global / Buyer-wise Color Master Library
        Schema::create('colors_master', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->foreignId('buyer_id')->nullable()->constrained('buyers')->onDelete('set null');
            
            // Color Code: e.g. BLK-01, NVY-01
            $table->string('color_code');
            
            // Color Name: e.g. Washed Vintage Black, Midnight Navy
            $table->string('color_name');
            
            // Optional Pantone reference: e.g. 19-4007 TCX
            $table->string('pantone_ref')->nullable();
            
            // Optional HEX Code for visual preview: e.g. #1f2937
            $table->string('hex_code')->nullable();
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_id', 'buyer_id', 'is_active']);
            $table->index(['color_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('colors_master');
    }
};
