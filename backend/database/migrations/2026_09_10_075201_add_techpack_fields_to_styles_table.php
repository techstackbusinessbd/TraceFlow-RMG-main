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
            $table->string('techpack_file_url', 500)->nullable()->after('description');
            $table->string('techpack_file_name', 255)->nullable()->after('techpack_file_url');
            $table->unsignedBigInteger('techpack_file_size')->nullable()->after('techpack_file_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('styles', function (Blueprint $table) {
            $table->dropColumn(['techpack_file_url', 'techpack_file_name', 'techpack_file_size']);
        });
    }
};
