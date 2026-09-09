<?php

namespace App\Domains\MasterData\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAgentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'min:2', 'max:150'],
            'country'         => ['required', 'string', 'min:2', 'max:100'],
            'contact_person'  => ['nullable', 'string', 'max:100'],
            'email'           => ['nullable', 'email', 'max:100'],
            'phone'           => ['nullable', 'string', 'max:30'],
            'address'         => ['nullable', 'string', 'max:500'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_active'       => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'            => 'Agent / Buying House name is required.',
            'country.required'         => 'Country is required.',
            'email.email'              => 'Please provide a valid email address.',
            'commission_rate.numeric'  => 'Commission rate must be a valid number.',
            'commission_rate.min'      => 'Commission rate cannot be negative.',
            'commission_rate.max'      => 'Commission rate cannot exceed 100%.',
        ];
    }
}
