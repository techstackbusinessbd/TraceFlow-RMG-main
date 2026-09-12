<?php

namespace App\Domains\MasterData\Requests;

use App\Models\Buyer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStyleRequest extends FormRequest
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
        $buyerId = $this->input('buyer_id');
        // If buyer_id is UUID, resolve to integer ID
        if ($buyerId && !is_numeric($buyerId)) {
            $buyer = Buyer::where('uuid', $buyerId)->first();
            $buyerId = $buyer ? $buyer->id : 0;
        }

        return [
            'company_id'       => ['required', 'exists:companies,id'],
            'buyer_id'         => ['required', 'exists:buyers,id'],
            'brand_id'         => ['nullable', 'exists:brands,id'],
            'buyer_style_no'   => [
                'required',
                'string',
                'min:2',
                'max:50',
                Rule::unique('styles', 'buyer_style_no')
                    ->where('buyer_id', $buyerId)
                    ->whereNull('deleted_at'),
            ],
            'style_name'       => ['required', 'string', 'min:3', 'max:150'],
            'product_category' => ['required', 'string', 'max:100'],
            'garment_item'     => ['required', 'string', 'max:100'],
            'fabric_type'      => ['nullable', 'string', 'max:100'],
            'season'           => ['required', 'string', 'max:50'],
            'base_smv'         => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'wash_type'        => ['nullable', 'string', 'max:500'],
            'description'        => ['nullable', 'string', 'max:1000'],
            'techpack_file_url'  => ['nullable', 'string', 'max:500'],
            'techpack_file_name' => ['nullable', 'string', 'max:255'],
            'techpack_file_size' => ['nullable', 'integer', 'min:0'],
            'techpack_file'      => ['nullable', 'file', 'mimes:pdf,zip,rar,doc,docx,xls,xlsx,png,jpg,jpeg', 'max:25600'], // 25MB max
            'status'             => ['required', 'string', 'in:Development,Sampling,Confirmed,Bulk_Approved,Discontinued'],
            'is_active'          => ['boolean'],

            // Dynamic Colorways
            'colors'               => ['required', 'array', 'min:1'],
            'colors.*.color_code'  => ['required', 'string', 'max:30'],
            'colors.*.color_name'  => ['required', 'string', 'max:100'],
            'colors.*.pantone_ref' => ['nullable', 'string', 'max:50'],
            'colors.*.hex_code'    => ['nullable', 'string', 'max:20'],

            // Dynamic Size Scale
            'sizes'                => ['required', 'array', 'min:1'],
            'sizes.*.size_name'    => ['required', 'string', 'max:30'],
            'sizes.*.sort_order'   => ['nullable', 'integer'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'buyer_style_no.unique' => 'This Buyer already has an existing Style with this Style Number.',
            'colors.min'            => 'At least one colorway must be configured for this Style.',
            'sizes.min'             => 'At least one size must be configured in the size scale.',
            'base_smv.min'          => 'Base SMV must be greater than 0.00.',
        ];
    }
}
