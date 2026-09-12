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
        Schema::table('styles', function (Blueprint $table) {
            $table->string('fabric_type')->nullable()->change();
            $table->decimal('base_smv', 5, 2)->default(0.00)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('styles', function (Blueprint $table) {
            $table->string('fabric_type')->nullable(false)->change();
            $table->decimal('base_smv', 5, 2)->default(0.00)->nullable(false)->change();
        });
    }
};
