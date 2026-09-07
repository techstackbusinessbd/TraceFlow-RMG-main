<?php

namespace App\Domains\SystemAdmin\Controllers;

use App\Domains\SystemAdmin\Requests\LoginRequest;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Web & Mobile Universal Login (POST /api/v1/auth/login)
     * Handles Tri-Identifier (Username / Employee ID / Email) authentication.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $identifier = trim($request->input('login_identifier'));
        $password = $request->input('password');

        // 1. Resolve User via Tri-Identifier Lookup
        $user = $this->resolveUserByIdentifier($identifier);

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'login_identifier' => ['Invalid credentials. Please verify your Employee ID / Username and password.'],
            ]);
        }

        // 2. Check Account Status
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'login_identifier' => ['Your account is deactivated. Contact factory IT administrator.'],
            ]);
        }

        // 3. Issue Sanctum API Token
        // Single Active Session Policy: revoke prior tokens
        $user->tokens()->delete();
        $token = $user->createToken('traceflow-auth-token')->plainTextToken;

        // 4. Update Last Login Telemetry
        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ])->save();

        // 5. Gather Roles and Flattened Permissions
        $roles = $user->getRoleNames();
        $permissions = $user->getAllPermissions()->pluck('name');

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'company_id' => $user->company_id,
                    'company_name' => $user->company?->name,
                    'emp_id' => $user->emp_id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department,
                    'must_change_password' => $user->must_change_password,
                    'roles' => $roles,
                    'permissions' => $permissions,
                ],
                'token' => $token,
            ],
        ]);
    }

    /**
     * Get Current Authenticated User (GET /api/v1/auth/me)
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('company');

        return response()->json([
            'status' => 'success',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'company_id' => $user->company_id,
                    'company_name' => $user->company?->name,
                    'emp_id' => $user->emp_id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ],
            ],
        ]);
    }

    /**
     * Update Current Authenticated User Profile (PUT /api/v1/auth/profile)
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'department' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $user->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'company_id' => $user->company_id,
                    'company_name' => $user->company?->name,
                    'emp_id' => $user->emp_id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'department' => $user->department,
                    'phone' => $user->phone,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ],
            ],
        ]);
    }

    /**
     * Change Password (PUT /api/v1/auth/password)
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password does not match our records.'],
            ]);
        }

        $user->forceFill([
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'password_changed_at' => now(),
            'must_change_password' => false,
        ])->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * Logout and Revoke Current Token (POST /api/v1/auth/logout)
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Resolve User by Email, Emp ID or Username.
     */
    protected function resolveUserByIdentifier(string $identifier): ?User
    {
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $identifier)->first();
        }

        return User::where('emp_id', $identifier)
            ->orWhere('username', $identifier)
            ->first();
    }
}
