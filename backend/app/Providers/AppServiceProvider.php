<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // 1. Super Admin Wildcard Bypass (Backend Architecture Rule)
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return ($user->hasRole('superadmin') || $user->hasRole('Super Admin')) ? true : null;
        });

        // 2. DDD Domain Auto-Policy Discovery
        \Illuminate\Support\Facades\Gate::guessPolicyNamesUsing(function (string $modelClass) {
            return str_replace('\\Models\\', '\\Policies\\', $modelClass) . 'Policy';
        });
    }
}
