<?php

namespace App\Domains\MasterData\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSizeScaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_id'   => ['nullable', 'exists:companies,id'],
            'name'         => ['required', 'string', 'min:2', 'max:100'],
            'category'     => ['required', 'string', 'max:100'],
            'description'  => ['nullable', 'string', 'max:500'],
            'is_active'    => ['boolean'],
            'entries'      => ['required', 'array', 'min:1'],
            'entries.*'    => ['required', 'string', 'max:20'],
        ];
    }
}
