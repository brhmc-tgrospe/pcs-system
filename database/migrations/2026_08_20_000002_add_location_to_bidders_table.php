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
        if (Schema::hasTable('bidders')) {
            Schema::table('bidders', function (Blueprint $table) {
                if (! Schema::hasColumn('bidders', 'location')) {
                    $table->string('location')->nullable()->after('address');
                }
                if (! Schema::hasColumn('bidders', 'brand_name')) {
                    $table->string('brand_name')->nullable()->after('address');
                }
                if (! Schema::hasColumn('bidders', 'country_of_origin')) {
                    $table->string('country_of_origin')->nullable()->after('brand_name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('bidders')) {
            Schema::table('bidders', function (Blueprint $table) {
                if (Schema::hasColumn('bidders', 'country_of_origin')) {
                    $table->dropColumn('country_of_origin');
                }
                if (Schema::hasColumn('bidders', 'brand_name')) {
                    $table->dropColumn('brand_name');
                }
                if (Schema::hasColumn('bidders', 'location')) {
                    $table->dropColumn('location');
                }
            });
        }
    }
};
