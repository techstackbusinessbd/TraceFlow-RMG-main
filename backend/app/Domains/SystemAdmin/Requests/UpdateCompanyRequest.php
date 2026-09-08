<?php

namespace App\Domains\SystemAdmin\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
     *
     * Pure Server-Side Validation.
     * Company Code is STRICTLY system-generated and IMMUTABLE after creation — it is NEVER accepted from client input.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // NOTE: 'code' is intentionally ABSENT — company codes are immutable after creation.
            'name'       => ['required', 'string', 'min:2', 'max:150'],
            'legal_name' => ['nullable', 'string', 'max:180'],
            'tax_id'     => ['nullable', 'string', 'max:50'],
            'email'      => ['nullable', 'email', 'max:100'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'address'    => ['nullable', 'string', 'max:500'],
            'is_active'  => ['sometimes', 'boolean'],
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
            'name.min'      => 'Company Name must be at least 2 characters.',
            'name.max'      => 'Company Name may not exceed 150 characters.',
            'email.email'   => 'Please provide a valid official email address.',
        ];
    }
}
