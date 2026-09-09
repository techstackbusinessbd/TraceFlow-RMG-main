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
        Schema::table('buyers', function (Blueprint $table) {
            $table->string('buyer_type', 20)->default('direct')->after('company_id'); // 'direct' | 'agent'
            $table->foreignId('agent_id')->nullable()->after('buyer_type')->constrained('agents')->nullOnDelete();

            $table->index(['company_id', 'buyer_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buyers', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
            $table->dropIndex(['company_id', 'buyer_type']);
            $table->dropColumn(['buyer_type', 'agent_id']);
        });
    }
};
