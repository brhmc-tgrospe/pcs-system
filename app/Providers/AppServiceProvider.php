<?php

namespace App\Providers;

use App\Services\Backup\Contracts\DatabaseDumperInterface;
use App\Services\Backup\MySqlDatabaseDumper;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            DatabaseDumperInterface::class,
            MySqlDatabaseDumper::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
