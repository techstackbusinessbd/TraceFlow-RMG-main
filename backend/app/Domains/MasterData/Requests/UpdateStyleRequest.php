<?php

namespace App\Domains\MasterData\Requests;

use App\Models\Buyer;
use App\Models\Style;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStyleRequest extends FormRequest
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
        $styleIdentifier = $this->route('style');
        $style = is_numeric($styleIdentifier)
            ? Style::find($styleIdentifier)
            : Style::where('uuid', $styleIdentifier)->first();
        $styleId = $style ? $style->id : 0;

        $buyerId = $this->input('buyer_id', $style ? $style->buyer_id : 0);
        if ($buyerId && !is_numeric($buyerId)) {
            $buyer = Buyer::where('uuid', $buyerId)->first();
            $buyerId = $buyer ? $buyer->id : 0;
        }

        return [
            'company_id'       => ['sometimes', 'required', 'exists:companies,id'],
            'buyer_id'         => ['sometimes', 'required', 'exists:buyers,id'],
            'brand_id'         => ['nullable', 'exists:brands,id'],
            'buyer_style_no'   => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:50',
                Rule::unique('styles', 'buyer_style_no')
                    ->where('buyer_id', $buyerId)
                    ->whereNull('deleted_at')
                    ->ignore($styleId),
            ],
            'style_name'       => ['sometimes', 'required', 'string', 'min:3', 'max:150'],
            'product_category' => ['sometimes', 'required', 'string', 'max:100'],
            'garment_item'     => ['sometimes', 'required', 'string', 'max:100'],
            'fabric_type'      => ['sometimes', 'required', 'string', 'max:100'],
            'season'           => ['sometimes', 'required', 'string', 'max:50'],
            'base_smv'         => ['sometimes', 'required', 'numeric', 'min:0.01', 'max:999.99'],
            'wash_type'        => ['sometimes', 'required', 'string', 'max:100'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'status'           => ['sometimes', 'required', 'string', 'in:Development,Sampling,Confirmed,Bulk_Approved,Discontinued'],
            'is_active'        => ['boolean'],

            // Dynamic Colorways
            'colors'               => ['sometimes', 'array', 'min:1'],
            'colors.*.color_code'  => ['required_with:colors', 'string', 'max:30'],
            'colors.*.color_name'  => ['required_with:colors', 'string', 'max:100'],
            'colors.*.pantone_ref' => ['nullable', 'string', 'max:50'],
            'colors.*.hex_code'    => ['nullable', 'string', 'max:20'],

            // Dynamic Size Scale
            'sizes'                => ['sometimes', 'array', 'min:1'],
            'sizes.*.size_name'    => ['required_with:sizes', 'string', 'max:30'],
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
