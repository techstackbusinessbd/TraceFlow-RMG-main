<?php

namespace App\Domains\SystemAdmin\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     * Pure Server-Side Validation: Handles Tri-Identifier (Username / Employee ID / Email)
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'login_identifier' => ['required', 'string', 'max:150'],
            'password' => ['required', 'string'],
            'totp_code' => ['nullable', 'string', 'size:6'],
        ];
    }

    /**
     * Custom validation error messages adhering to zero-confusion microcopy.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'login_identifier.required' => 'Please enter your Employee ID, Username, or Email.',
            'password.required' => 'Please enter your password.',
            'totp_code.size' => 'Two-Factor Authenticator code must be exactly 6 digits.',
        ];
    }
}
