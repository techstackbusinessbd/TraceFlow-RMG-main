<?php

namespace App\Domains\MasterData\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBuyerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'buyer_type'      => ['required', 'string', 'in:direct,agent'],
            'agent_id'        => ['required_if:buyer_type,agent', 'nullable', 'integer', 'exists:agents,id'],
            'name'            => ['required', 'string', 'min:2', 'max:150'],
            'country'         => ['required', 'string', 'min:2', 'max:100'],
            'contact_person'  => ['nullable', 'string', 'max:100'],
            'email'           => ['nullable', 'email', 'max:100'],
            'phone'           => ['nullable', 'string', 'max:30'],
            'address'         => ['nullable', 'string', 'max:500'],
            'payment_terms'   => ['nullable', 'string', 'max:60'],
            'is_active'       => ['sometimes', 'boolean'],
            'brands'          => ['nullable', 'array'],
            'brands.*.id'     => ['nullable', 'integer'],
            'brands.*.name'   => ['required_with:brands', 'string', 'min:1', 'max:100'],
            'brands.*.code'   => ['nullable', 'string', 'max:30'],
        ];
    }

    public function messages(): array
    {
        return [
            'buyer_type.required'   => 'Buyer type (Direct or Via Agent) is required.',
            'buyer_type.in'         => 'Buyer type must be either Direct or Via Agent.',
            'agent_id.required_if'  => 'Please select a Buying Agent when buyer type is Via Agent.',
            'agent_id.exists'       => 'Selected buying agent does not exist.',
            'name.required'         => 'Buyer name is required.',
            'country.required'      => 'Country is required.',
            'email.email'           => 'Please provide a valid email address.',
        ];
    }
}
