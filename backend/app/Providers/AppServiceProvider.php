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
        // 0. Ensure Windows TEMP environment variables are passed to PHP CLI server subprocess
        if (class_exists(\Illuminate\Foundation\Console\ServeCommand::class)) {
            \Illuminate\Foundation\Console\ServeCommand::$passthroughVariables = array_merge(
                \Illuminate\Foundation\Console\ServeCommand::$passthroughVariables,
                ['TEMP', 'TMP', 'SystemDrive', 'USERPROFILE']
            );
        }

        // 1. Super Admin Wildcard Bypass (Backend Architecture Rule)
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return ($user->hasRole('superadmin') || $user->hasRole('Super Admin')) ? true : null;
        });

        // 2. DDD Domain Auto-Policy Discovery
        \Illuminate\Support\Facades\Gate::guessPolicyNamesUsing(function (string $modelClass) {
            return str_replace('\\Models\\', '\\Policies\\', $modelClass) . 'Policy';
        });

        // 3. Enterprise Rate Limiters
        // Login Brute-Force Shield: 5 requests per minute per email/IP
        \Illuminate\Support\Facades\RateLimiter::for('login', function (\Illuminate\Http\Request $request) {
            $key = (string) $request->input('login', $request->ip());
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($key);
        });

        // Standard API Rate Limiter: 120 requests per minute
        \Illuminate\Support\Facades\RateLimiter::for('api', function (\Illuminate\Http\Request $request) {
            return \Illuminate\Cache\RateLimiting\Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });
    }
}
