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
        Schema::table('items', function (Blueprint $table) {
            $table->renameColumn('unit_price', 'unit_cost');
            $table->decimal('quantity', 10, 2)->default(1)->after('unit_type');
            $table->decimal('abc', 15, 2)->default(0)->after('quantity'); // Will be updated
            $table->dropColumn(['specifications', 'is_active', 'price_referral']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->longText('description')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->renameColumn('unit_cost', 'unit_price');
            $table->dropColumn(['quantity', 'abc']);
            
            $table->json('specifications')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('price_referral')->nullable();
        });

        Schema::table('items', function (Blueprint $table) {
            $table->text('description')->nullable()->change();
        });
    }
};
