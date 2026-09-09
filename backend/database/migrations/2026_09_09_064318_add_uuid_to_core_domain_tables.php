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
        $tables = ['companies', 'users', 'agents', 'buyers', 'brands'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                if (!Schema::hasColumn($tableName, 'uuid')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->uuid('uuid')->nullable()->after('id');
                    });
                }

                // Backfill existing rows
                $rows = DB::table($tableName)->whereNull('uuid')->get(['id']);
                foreach ($rows as $row) {
                    DB::table($tableName)
                        ->where('id', $row->id)
                        ->update(['uuid' => (string) Illuminate\Support\Str::uuid()]);
                }

                // Add unique index
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unique('uuid');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['brands', 'buyers', 'agents', 'users', 'companies'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'uuid')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropUnique(['uuid']);
                    $table->dropColumn('uuid');
                });
            }
        }
    }
};
