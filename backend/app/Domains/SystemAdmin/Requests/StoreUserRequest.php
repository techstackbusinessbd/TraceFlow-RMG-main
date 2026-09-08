<?php

namespace App\Domains\SystemAdmin\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            // Employee ID is strictly manual as per biometric card standard
            'emp_id' => ['required', 'string', 'max:50', 'unique:users,emp_id'],
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:60', 'unique:users,username'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'company_id' => ['required', 'exists:companies,id'],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', 'exists:roles,name'],
            'department' => ['nullable', 'string', 'max:80'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'emp_id.required' => 'Factory Employee ID (Punch Card / HR Badge) is required.',
            'emp_id.unique' => 'This Employee ID is already assigned to another user.',
            'username.required' => 'Login username is required.',
            'username.alpha_dash' => 'Username may only contain letters, numbers, dashes and underscores.',
            'username.unique' => 'This username is already taken.',
            'name.required' => 'Full user name is required.',
            'company_id.required' => 'Company affiliation is required.',
            'company_id.exists' => 'The selected company does not exist.',
            'roles.required' => 'At least one role must be assigned to the user.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}
