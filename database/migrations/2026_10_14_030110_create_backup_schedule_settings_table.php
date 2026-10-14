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
        Schema::create('backup_schedule_settings', function (Blueprint $table) {
            $table->id();
            $table->enum('frequency', ['weekly', 'monthly'])->default('weekly');
            $table->unsignedTinyInteger('day')->default(0); // 0=Sunday for weekly; 1-31 for monthly
            $table->string('time', 5)->default('02:00'); // 'HH:mm' 24-hour format
            $table->boolean('is_enabled')->default(true);
            $table->timestamp('last_run_at')->nullable();
            $table->string('last_status')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('backup_schedule_settings');
    }
};
