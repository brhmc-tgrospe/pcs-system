<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Replace single string referral with a JSON array of referrals.
            // Using JSON type keeps the schema simple while supporting multiple entries.
            $table->json('price_referral')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            // Revert back to single string (first element) if rolling back.
            $table->string('price_referral', 50)->nullable()->change();
        });
    }
};
