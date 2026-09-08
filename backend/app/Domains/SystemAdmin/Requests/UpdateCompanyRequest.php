<?php

namespace App\Domains\SystemAdmin\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
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
     * Pure Server-Side Validation: Clear, strict rules for updating Sister Company.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $companyId = $this->route('company') ?? $this->route('id');

        return [
            'code' => [
                'sometimes',
                'string',
                'min:2',
                'max:10',
                'regex:/^[A-Z0-9\-]+$/',
                Rule::unique('companies', 'code')->ignore($companyId),
            ],
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'legal_name' => ['nullable', 'string', 'max:180'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['boolean'],
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
            'name.required' => 'Company Name is required.',
            'name.min' => 'Company Name must be at least 2 characters.',
            'name.max' => 'Company Name may not exceed 150 characters.',
            'code.unique' => 'This Company Code is already registered for another company.',
            'code.regex' => 'Company Code may only contain uppercase letters, numbers, and hyphens.',
            'email.email' => 'Please provide a valid official email address.',
        ];
    }
}
