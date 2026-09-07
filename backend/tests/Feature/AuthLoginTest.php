<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    /**
     * Test login using manual Employee ID (e.g. 255776).
     */
    public function test_user_can_login_with_manual_emp_id(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login_identifier' => '255776',
            'password' => 'SuperAdmin#2026!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.emp_id', '255776')
            ->assertJsonPath('data.user.username', 'superadmin')
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'emp_id', 'username', 'name', 'roles', 'permissions'],
                    'token',
                ],
            ]);
    }

    /**
     * Test login using Username (e.g. admin).
     */
    public function test_user_can_login_with_username(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login_identifier' => 'admin',
            'password' => 'Admin#2026!',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user.username', 'admin')
            ->assertJsonPath('data.user.emp_id', '100492');
    }

    /**
     * Test login failure with wrong password returns 422 with crisp error message.
     */
    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'login_identifier' => '255776',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['login_identifier']);
    }

    /**
     * Test authenticated me endpoint with Bearer token.
     */
    public function test_authenticated_user_can_access_me_endpoint(): void
    {
        $user = User::where('username', 'superadmin')->first();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('data.user.emp_id', '255776');
    }
}
