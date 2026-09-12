<?php

namespace App\Domains\MasterData\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreColorMasterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id'   => ['nullable', 'exists:companies,id'],
            'buyer_id'     => ['nullable', 'exists:buyers,id'],
            'color_code'   => ['required', 'string', 'max:30'],
            'color_name'   => ['required', 'string', 'max:100'],
            'pantone_ref'  => ['nullable', 'string', 'max:50'],
            'hex_code'     => ['nullable', 'string', 'max:20'],
            'is_active'    => ['boolean'],
        ];
    }
}
