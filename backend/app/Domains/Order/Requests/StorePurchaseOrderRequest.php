<?php

namespace App\Domains\Order\Requests;

use App\Models\Buyer;
use App\Models\Company;
use App\Models\Style;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare inputs before validation:
     * - Map aliases: total_order_qty -> order_qty, order_placement_date -> order_date, etc.
     * - Auto-fill season_name from Style if missing
     * - Auto-resolve breakdowns colors and sizes from StyleColor and StyleSize if style_color_id / style_size_id provided
     */
    protected function prepareForValidation(): void
    {
        $mergeData = [];

        // Order Qty
        if (!$this->has('order_qty') && $this->has('total_order_qty')) {
            $mergeData['order_qty'] = (int) $this->input('total_order_qty');
        }

        // Dates
        if (!$this->has('order_date') && $this->has('order_placement_date')) {
            $mergeData['order_date'] = $this->input('order_placement_date');
        }
        if (!$this->has('ex_factory_date') && $this->has('factory_delivery_date')) {
            $mergeData['ex_factory_date'] = $this->input('factory_delivery_date');
        }
        if (!$this->has('delivery_date') && $this->has('buyer_delivery_date')) {
            $mergeData['delivery_date'] = $this->input('buyer_delivery_date');
        }

        // Destination port
        if (!$this->has('destination_port') && $this->has('delivery_destination')) {
            $mergeData['destination_port'] = $this->input('delivery_destination');
        }

        // PO files
        if (!$this->has('po_file_url') && $this->has('po_document_url')) {
            $mergeData['po_file_url'] = $this->input('po_document_url');
        }
        if (!$this->has('po_file_name') && $this->has('po_document_name')) {
            $mergeData['po_file_name'] = $this->input('po_document_name');
        }
        if (!$this->has('po_file_size') && $this->has('po_document_size')) {
            $mergeData['po_file_size'] = $this->input('po_document_size');
        }

        // Default entry_mode and shipment_mode formatting
        if (!$this->has('entry_mode')) {
            $mergeData['entry_mode'] = 'Manual';
        }
        if ($this->has('shipment_mode')) {
            $modeMap = [
                'SEA' => 'Sea',
                'AIR' => 'Air',
                'ROAD' => 'Road',
                'SEA_AIR' => 'Sea-Air',
                'RAIL' => 'Road',
            ];
            $rawShipMode = (string) $this->input('shipment_mode');
            if (isset($modeMap[strtoupper($rawShipMode)])) {
                $mergeData['shipment_mode'] = $modeMap[strtoupper($rawShipMode)];
            }
        }

        // Resolve Style and Season Name if missing
        $styleId = $this->input('style_id');
        $style = null;
        if ($styleId) {
            $style = is_numeric($styleId)
                ? Style::with(['colors', 'sizes'])->find($styleId)
                : Style::with(['colors', 'sizes'])->where('uuid', $styleId)->first();
        }

        if (!$this->has('season_name') || empty($this->input('season_name'))) {
            $mergeData['season_name'] = $style?->season ?: 'General ' . date('Y');
        }

        // Auto-resolve breakdown items if style_color_id or style_size_id provided
        $breakdowns = $this->input('breakdowns');
        if (is_array($breakdowns) && $style) {
            $colorsMap = $style->colors->keyBy('id');
            $sizesMap = $style->sizes->keyBy('id');
            $updatedBreakdowns = [];

            foreach ($breakdowns as $b) {
                $colorId = $b['color_id'] ?? ($b['style_color_id'] ?? null);
                $sizeId = $b['size_id'] ?? ($b['style_size_id'] ?? null);
                $styleColor = $colorId ? $colorsMap->get($colorId) : null;
                $styleSize = $sizeId ? $sizesMap->get($sizeId) : null;

                $colorCode = $b['color_code'] ?? ($styleColor?->color_code ?? 'CLR-01');
                $colorName = $b['color_name'] ?? ($styleColor?->color_name ?? 'Standard');
                $sizeName = $b['size_name'] ?? ($styleSize?->size_name ?? 'STD');
                $sortOrder = $b['size_sort_order'] ?? ($styleSize?->sort_order ?? 0);
                $qty = (int) ($b['quantity'] ?? ($b['order_qty'] ?? 0));
                $excessCut = isset($b['excess_cut_pct']) ? (float) $b['excess_cut_pct'] : (float) ($b['excess_percentage'] ?? 0.0);

                $updatedBreakdowns[] = [
                    'color_id'        => $colorId,
                    'color_code'      => $colorCode,
                    'color_name'      => $colorName,
                    'size_name'       => $sizeName,
                    'size_sort_order' => $sortOrder,
                    'quantity'        => $qty,
                    'excess_cut_pct'  => $excessCut,
                ];
            }
            $mergeData['breakdowns'] = $updatedBreakdowns;
        }

        if (!empty($mergeData)) {
            $this->merge($mergeData);
        }
    }

    public function rules(): array
    {
        $buyerId = $this->input('buyer_id');
        if ($buyerId && !is_numeric($buyerId)) {
            $buyer = \Illuminate\Support\Str::isUuid((string)$buyerId)
                ? Buyer::where('uuid', (string)$buyerId)->first()
                : Buyer::where('code', (string)$buyerId)->first();
            $buyerId = $buyer ? $buyer->id : 0;
        }

        $styleId = $this->input('style_id');
        if ($styleId && !is_numeric($styleId)) {
            $style = \Illuminate\Support\Str::isUuid((string)$styleId)
                ? Style::where('uuid', (string)$styleId)->first()
                : Style::where('code', (string)$styleId)->first();
            $styleId = $style ? $style->id : 0;
        }

        $companyId = $this->input('company_id');
        if ($companyId && !is_numeric($companyId)) {
            $company = \Illuminate\Support\Str::isUuid((string)$companyId)
                ? Company::where('uuid', (string)$companyId)->first()
                : Company::where('code', (string)$companyId)->first();
            $companyId = $company ? $company->id : 0;
        }

        return [
            'company_id'       => ['required', 'exists:companies,id'],
            'buyer_id'         => ['required', 'exists:buyers,id'],
            'style_id'         => ['required', 'exists:styles,id'],
            'buyer_po_number'  => [
                'required',
                'string',
                'min:2',
                'max:100',
                Rule::unique('purchase_orders', 'buyer_po_number')
                    ->where('buyer_id', $buyerId)
                    ->whereNull('deleted_at'),
            ],
            'season_name'      => ['required', 'string', 'max:60'],
            'order_qty'        => ['required', 'integer', 'min:1'],
            'unit_price'       => ['required', 'numeric', 'min:0'],
            'currency'         => ['required', 'string', 'in:USD,EUR,GBP,BDT'],
            'order_date'       => ['required', 'date'],
            'ex_factory_date'  => ['required', 'date'],
            'delivery_date'    => ['required', 'date', 'after_or_equal:ex_factory_date'],
            'shipment_mode'    => ['required', 'string', 'in:Sea,Air,Sea-Air,Road'],
            'destination_port' => ['nullable', 'string', 'max:100'],
            'po_file_url'      => ['nullable', 'string', 'max:500'],
            'po_file_name'     => ['nullable', 'string', 'max:255'],
            'po_file_size'     => ['nullable', 'integer', 'min:0'],
            'entry_mode'       => ['required', 'string', 'in:Manual,Excel_Import,PDF_Import'],
            'status'           => ['required', 'string', 'in:Draft,Confirmed,In_Cutting,In_Sewing,Shipped,Cancelled'],
            'remarks'          => ['nullable', 'string', 'max:1000'],

            // Breakdown Matrix items: array of { color_code, color_name, size_name, size_sort_order, quantity, excess_cut_pct }
            'breakdowns'                   => ['required', 'array', 'min:1'],
            'breakdowns.*.color_id'        => ['nullable', 'integer'],
            'breakdowns.*.color_code'      => ['required', 'string', 'max:50'],
            'breakdowns.*.color_name'      => ['required', 'string', 'max:100'],
            'breakdowns.*.size_name'       => ['required', 'string', 'max:50'],
            'breakdowns.*.size_sort_order' => ['nullable', 'integer'],
            'breakdowns.*.quantity'        => ['required', 'integer', 'min:0'],
            'breakdowns.*.excess_cut_pct'  => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * Configure the validator instance.
     * Enforce Golden Mathematical Integrity: SUM(Breakdowns) === Total PO Quantity.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $totalOrderQty = (int) $this->input('order_qty', 0);
            $breakdowns = $this->input('breakdowns', []);

            if (is_array($breakdowns) && count($breakdowns) > 0) {
                $matrixSum = 0;
                foreach ($breakdowns as $item) {
                    $matrixSum += (int) ($item['quantity'] ?? 0);
                }

                if ($matrixSum !== $totalOrderQty) {
                    $diff = $matrixSum - $totalOrderQty;
                    $diffMsg = $diff > 0 
                        ? "exceeds total order quantity by {$diff} pcs" 
                        : "is short by " . abs($diff) . " pcs";

                    $validator->errors()->add(
                        'breakdowns',
                        "Golden Mathematical Mismatch: The sum of all color-size quantities ({$matrixSum} pcs) {$diffMsg} (Required Total: {$totalOrderQty} pcs)."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'buyer_po_number.unique' => 'This Buyer PO Number has already been registered for the selected Buyer.',
            'delivery_date.after_or_equal' => 'The Buyer Delivery Date must be on or after the Ex-Factory Date.',
            'order_qty.min' => 'Total order quantity must be at least 1 piece.',
            'breakdowns.required' => 'At least one color and size breakdown entry is required.',
        ];
    }
}
