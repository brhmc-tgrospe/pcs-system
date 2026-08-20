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
        if (Schema::hasTable('bidders') && !Schema::hasColumn('bidders', 'location')) {
            Schema::table('bidders', function (Blueprint $table) {
                $table->string('location')->nullable()->after('address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('bidders') && Schema::hasColumn('bidders', 'location')) {
            Schema::table('bidders', function (Blueprint $table) {
                $table->dropColumn('location');
            });
        }
    }
};
