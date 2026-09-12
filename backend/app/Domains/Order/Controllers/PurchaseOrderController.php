<?php

namespace App\Domains\Order\Controllers;

use App\Domains\Order\Requests\StorePurchaseOrderRequest;
use App\Domains\Order\Requests\UpdatePurchaseOrderRequest;
use App\Http\Controllers\Controller;
use App\Models\Buyer;
use App\Models\Company;
use App\Models\PoBreakdown;
use App\Models\PurchaseOrder;
use App\Models\Style;
use App\Models\StyleColor;
use App\Models\StyleSize;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    /**
     * Resolve PO by UUID or primary integer ID without triggering PostgreSQL UUID parse errors.
     */
    private function resolveOrder(string|int $identifier): PurchaseOrder
    {
        if (is_numeric($identifier)) {
            return PurchaseOrder::where('id', (int) $identifier)->firstOrFail();
        }

        if (Str::isUuid($identifier)) {
            return PurchaseOrder::where('uuid', $identifier)->firstOrFail();
        }

        return PurchaseOrder::where('order_code', $identifier)->firstOrFail();
    }

    /**
     * Intelligent sequential Order Code generator:
     * Formula: [CompanyShortCode]-ORD-[YY]-[SequentialNumber]
     * e.g. SDL-ORD-26-0001
     * GET /api/v1/orders/next-code
     */
    public function nextCode(Request $request): JsonResponse
    {
        $companyId = $request->query('company_id');
        $company = $companyId ? Company::find($companyId) : Company::where('is_default', true)->first();

        if (!$company) {
            $company = Company::first();
        }

        $shortCode = $company ? strtoupper($company->code) : 'AWL';
        $year = date('y');
        $prefix = "{$shortCode}-ORD-{$year}-";

        $lastOrder = PurchaseOrder::withTrashed()
            ->where('order_code', 'like', "{$prefix}%")
            ->orderByRaw('LENGTH(order_code) DESC, order_code DESC')
            ->first();

        $nextNumber = 1;
        if ($lastOrder && preg_match('/-(\d+)$/', $lastOrder->order_code, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        $code = $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'next_code' => $code,
            'company_code' => $shortCode,
        ]);
    }

    /**
     * List all Purchase Orders with filters, sorting, and pagination.
     * GET /api/v1/orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = PurchaseOrder::with([
            'company:id,uuid,name,code',
            'buyer:id,uuid,name,code',
            'style:id,uuid,code,buyer_style_no,style_name',
        ]);

        // Search Filter (order_code, buyer_po_number, style code/name, buyer name)
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_code', 'ilike', "%{$search}%")
                  ->orWhere('buyer_po_number', 'ilike', "%{$search}%")
                  ->orWhere('season_name', 'ilike', "%{$search}%")
                  ->orWhereHas('buyer', function ($bq) use ($search) {
                      $bq->where('name', 'ilike', "%{$search}%")
                         ->orWhere('code', 'ilike', "%{$search}%");
                  })
                  ->orWhereHas('style', function ($sq) use ($search) {
                      $sq->where('buyer_style_no', 'ilike', "%{$search}%")
                         ->orWhere('style_name', 'ilike', "%{$search}%")
                         ->orWhere('code', 'ilike', "%{$search}%");
                  });
            });
        }

        // Filter by Company
        if ($companyId = $request->query('company_id')) {
            $query->where('company_id', $companyId);
        }

        // Filter by Buyer
        if ($buyerId = $request->query('buyer_id')) {
            if (!is_numeric($buyerId)) {
                $buyer = Buyer::where('uuid', $buyerId)->first();
                $buyerId = $buyer ? $buyer->id : 0;
            }
            $query->where('buyer_id', $buyerId);
        }

        // Filter by Style
        if ($styleId = $request->query('style_id')) {
            if (!is_numeric($styleId)) {
                $style = Style::where('uuid', $styleId)->first();
                $styleId = $style ? $style->id : 0;
            }
            $query->where('style_id', $styleId);
        }

        // Filter by Status
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Filter by Entry Mode
        if ($entryMode = $request->query('entry_mode')) {
            $query->where('entry_mode', $entryMode);
        }

        // Sorting
        $allowedSorts = ['order_code', 'buyer_po_number', 'order_qty', 'delivery_date', 'ex_factory_date', 'status', 'created_at'];
        $sortField = $request->query('sort_by', 'created_at');
        $sortDir = strtolower($request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDir);
        } else {
            $query->latest();
        }

        $perPage = max(5, min(100, (int) $request->query('per_page', 15)));
        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
            ],
        ]);
    }

    /**
     * Store a newly created Purchase Order along with Color-Size Breakdown matrix.
     * POST /api/v1/orders
     */
    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $order = DB::transaction(function () use ($validated, $request) {
            $company = Company::findOrFail($validated['company_id']);
            $shortCode = strtoupper($company->code);
            $year = date('y');
            $prefix = "{$shortCode}-ORD-{$year}-";

            // Determine next intelligent sequential code
            $lastOrder = PurchaseOrder::withTrashed()
                ->where('order_code', 'like', "{$prefix}%")
                ->orderByRaw('LENGTH(order_code) DESC, order_code DESC')
                ->lockForUpdate()
                ->first();

            $nextNumber = 1;
            if ($lastOrder && preg_match('/-(\d+)$/', $lastOrder->order_code, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            $orderCode = $prefix . str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);

            // Create Master PO
            $po = PurchaseOrder::create([
                'company_id'       => $validated['company_id'],
                'buyer_id'         => $validated['buyer_id'],
                'style_id'         => $validated['style_id'],
                'order_code'       => $orderCode,
                'buyer_po_number'  => trim($validated['buyer_po_number']),
                'season_name'      => $validated['season_name'],
                'order_qty'        => $validated['order_qty'],
                'unit_price'       => $validated['unit_price'],
                'currency'         => $validated['currency'],
                'order_date'       => $validated['order_date'],
                'ex_factory_date'  => $validated['ex_factory_date'],
                'delivery_date'    => $validated['delivery_date'],
                'shipment_mode'    => $validated['shipment_mode'],
                'destination_port' => $validated['destination_port'] ?? null,
                'po_file_url'      => $validated['po_file_url'] ?? null,
                'po_file_name'     => $validated['po_file_name'] ?? null,
                'po_file_size'     => $validated['po_file_size'] ?? null,
                'entry_mode'       => $validated['entry_mode'],
                'status'           => $validated['status'],
                'remarks'          => $validated['remarks'] ?? null,
                'created_by'       => $request->user()?->id,
            ]);

            // Insert Matrix Breakdowns
            foreach ($validated['breakdowns'] as $index => $item) {
                PoBreakdown::create([
                    'purchase_order_id' => $po->id,
                    'color_id'          => $item['color_id'] ?? null,
                    'color_code'        => $item['color_code'],
                    'color_name'        => $item['color_name'],
                    'size_name'         => $item['size_name'],
                    'size_sort_order'   => $item['size_sort_order'] ?? $index,
                    'quantity'          => $item['quantity'],
                    'excess_cut_pct'    => $item['excess_cut_pct'] ?? 0.00,
                ]);
            }

            return $po;
        });

        $order->load(['company', 'buyer', 'style', 'breakdowns']);

        return response()->json([
            'success' => true,
            'message' => 'Purchase Order created successfully with color-size ratio matrix.',
            'data' => $order,
        ], 201);
    }

    /**
     * Show single Purchase Order with complete 2D matrix details.
     * GET /api/v1/orders/{order}
     */
    public function show(string|int $orderId): JsonResponse
    {
        $order = $this->resolveOrder($orderId);
        $order->load(['company', 'buyer', 'style.colors', 'style.sizes', 'breakdowns']);

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Update an existing Purchase Order.
     * PUT /api/v1/orders/{order}
     */
    public function update(UpdatePurchaseOrderRequest $request, string|int $orderId): JsonResponse
    {
        $order = $this->resolveOrder($orderId);

        // Referential Guard: Cannot edit breakdown if production has commenced
        if (in_array($order->status, ['In_Cutting', 'In_Sewing', 'Shipped']) && $request->has('breakdowns')) {
            return response()->json([
                'success' => false,
                'message' => "Order {$order->order_code} is currently {$order->status}. Color-size breakdowns cannot be modified after cutting issuance.",
            ], 403);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($order, $validated, $request) {
            $orderData = collect($validated)->except(['breakdowns'])->toArray();
            $orderData['updated_by'] = $request->user()?->id;

            $order->update($orderData);

            // Replace breakdowns if provided
            if (isset($validated['breakdowns']) && is_array($validated['breakdowns'])) {
                $order->breakdowns()->delete();

                foreach ($validated['breakdowns'] as $index => $item) {
                    PoBreakdown::create([
                        'purchase_order_id' => $order->id,
                        'color_id'          => $item['color_id'] ?? null,
                        'color_code'        => $item['color_code'],
                        'color_name'        => $item['color_name'],
                        'size_name'         => $item['size_name'],
                        'size_sort_order'   => $item['size_sort_order'] ?? $index,
                        'quantity'          => $item['quantity'],
                        'excess_cut_pct'    => $item['excess_cut_pct'] ?? 0.00,
                    ]);
                }
            }
        });

        $order->load(['company', 'buyer', 'style', 'breakdowns']);

        return response()->json([
            'success' => true,
            'message' => 'Purchase Order updated successfully.',
            'data' => $order,
        ]);
    }

    /**
     * Delete a Purchase Order.
     * DELETE /api/v1/orders/{order}
     */
    public function destroy(string|int $orderId): JsonResponse
    {
        $order = $this->resolveOrder($orderId);

        if (in_array($order->status, ['In_Cutting', 'In_Sewing', 'Shipped'])) {
            return response()->json([
                'success' => false,
                'message' => "Order {$order->order_code} cannot be deleted because it is already in active production ({$order->status}).",
            ], 403);
        }

        $order->delete();

        return response()->json([
            'success' => true,
            'message' => "Purchase Order {$order->order_code} deleted successfully.",
        ]);
    }

    /**
     * Upload an official Buyer Purchase Order Document (PDF, XLSX, XLS, CSV).
     * POST /api/v1/orders/upload-document
     */
    public function uploadDocument(Request $request): JsonResponse
    {
        $request->validate([
            'file' => [
                'required',
                'file',
                'mimes:pdf,xlsx,xls,csv',
                'max:25600', // 25 MB max
            ],
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $size = $file->getSize();
        $extension = $file->getClientOriginalExtension();
        $uniqueName = 'po_doc_' . time() . '_' . Str::random(10) . '.' . $extension;

        $path = $file->storeAs('purchase_orders', $uniqueName, 'public');
        $url = asset('storage/' . $path);

        return response()->json([
            'success' => true,
            'message' => 'PO document uploaded successfully.',
            'data' => [
                'file_url'  => $url,
                'file_name' => $originalName,
                'file_size' => $size,
            ],
        ]);
    }

    /**
     * Download pre-filled Excel Template for a specific style's colorways & size scale.
     * GET /api/v1/orders/template/{styleId}
     */
    public function downloadTemplate(string|int $styleId)
    {
        $styleQuery = is_numeric($styleId)
            ? Style::where('id', (int) $styleId)
            : (Str::isUuid($styleId) ? Style::where('uuid', $styleId) : Style::where('code', $styleId));

        $style = $styleQuery->with(['colors', 'sizes'])->firstOrFail();

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('PO_Ratio_Breakdown');

        // Headers
        $sheet->setCellValue('A1', 'Color Code');
        $sheet->setCellValue('B1', 'Color Name');

        $colIndex = 3; // Starting at Column 'C'
        $sizes = $style->sizes;
        foreach ($sizes as $size) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex);
            $sheet->setCellValue("{$colLetter}1", $size->size_name);
            $colIndex++;
        }

        // Rows for colors
        $rowIndex = 2;
        $colors = $style->colors;
        foreach ($colors as $color) {
            $sheet->setCellValue("A{$rowIndex}", $color->color_code);
            $sheet->setCellValue("B{$rowIndex}", $color->color_name);

            // Default 0 for each size
            for ($c = 3; $c < $colIndex; $c++) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($c);
                $sheet->setCellValue("{$colLetter}{$rowIndex}", 0);
            }
            $rowIndex++;
        }

        // Style the headers
        $lastCol = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIndex - 1);
        $sheet->getStyle("A1:{$lastCol}1")->getFont()->setBold(true);

        $fileName = "PO_Template_{$style->buyer_style_no}.xlsx";

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header("Content-Disposition: attachment; filename=\"{$fileName}\"");
        header('Cache-Control: max-age=0');

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save('php://output');
        exit;
    }

    /**
     * Parse an uploaded Excel or PDF file and extract color-size matrix quantities.
     * POST /api/v1/orders/parse-file
     */
    public function parseFile(Request $request): JsonResponse
    {
        $request->validate([
            'file'     => ['required', 'file', 'mimes:xlsx,xls,csv,pdf', 'max:25600'],
            'style_id' => ['required'],
        ]);

        $rawStyleId = $request->input('style_id');
        $styleQuery = is_numeric($rawStyleId)
            ? Style::where('id', (int) $rawStyleId)
            : (Str::isUuid($rawStyleId) ? Style::where('uuid', $rawStyleId) : Style::where('code', $rawStyleId));

        $style = $styleQuery->with(['colors', 'sizes'])->firstOrFail();

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());

        $extractedBreakdowns = [];
        $extractedPoNumber = null;
        $extractedTotalQty = 0;

        if (in_array($ext, ['xlsx', 'xls', 'csv'])) {
            // Parse Excel
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            if (count($rows) > 1) {
                // Build quick lookup maps for style colors and sizes
                $colorMap = [];
                foreach ($style->colors as $c) {
                    $colorMap[strtolower(trim($c->color_name))] = $c->id;
                    $colorMap[strtolower(trim($c->color_code))] = $c->id;
                }

                $sizeMap = [];
                foreach ($style->sizes as $s) {
                    $sizeMap[strtolower(trim($s->size_name))] = $s->id;
                }

                // Known standard garment sizes to help detect the header row
                $knownSizeKeywords = [
                    'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', '3xl', '4xl', '5xl',
                    '26', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46',
                    '28/30', '30/32', '32/32', '32/34', '34/32', '34/34', '36/32', '36/34',
                ];

                // 1. Detect the actual Size Header Row
                $headerRowIdx = 1;
                $maxSizeMatches = 0;
                $bestSizeCols = [];

                foreach ($rows as $rIdx => $row) {
                    $candidateCols = [];
                    $matches = 0;

                    foreach ($row as $colLetter => $cellVal) {
                        $trimmed = strtolower(trim((string)$cellVal));
                        if (empty($trimmed)) continue;

                        // Check if it matches existing style sizes or standard garment sizes
                        if (isset($sizeMap[$trimmed]) || in_array($trimmed, $knownSizeKeywords)) {
                            $matches++;
                            $candidateCols[$colLetter] = trim((string)$cellVal);
                        }
                    }

                    if ($matches > $maxSizeMatches) {
                        $maxSizeMatches = $matches;
                        $headerRowIdx = $rIdx;
                        $bestSizeCols = $candidateCols;
                    }
                }

                // If no high-confidence size match was found, fall back to row 1 (columns C and beyond)
                if ($maxSizeMatches === 0) {
                    $headerRow = $rows[1] ?? [];
                    foreach ($headerRow as $colLetter => $headerVal) {
                        if (in_array($colLetter, ['A', 'B'])) continue;
                        $val = trim((string)$headerVal);
                        if (!empty($val)) {
                            $bestSizeCols[$colLetter] = $val;
                        }
                    }
                    $headerRowIdx = 1;
                }

                $sizeCols = $bestSizeCols;

                // Stopwords to filter out non-color rows (grand totals, summaries, headers)
                $ignoreRowKeywords = [
                    'total', 'grand total', 'po total', 'dzn total', 'pack total', 'summery', 'summary',
                    'ship date', 'file no', 'phd date', 'delivery date', 'order qty', 'country', 'port',
                    'remarks', 'sub total', 'subtotal', 'excess', 'cut qty'
                ];

                $matrix = [];
                $unmappedColors = [];
                $unmappedSizes = [];
                $newColorwaysToCreate = [];
                $newSizesToCreate = [];

                // 2. Map existing style sizes without auto-provisioning random sheet sizes into Style library
                foreach ($sizeCols as $colLetter => $sizeName) {
                    $cleanSize = trim($sizeName);
                    if (empty($cleanSize)) continue;
                    $lowerSize = strtolower($cleanSize);
                    // Match existing
                    if (!isset($sizeMap[$lowerSize])) {
                        // Check if existing style size matches without spaces/dashes
                        $altMatch = $style->sizes->first(function ($s) use ($lowerSize) {
                            return strtolower($s->size_name) === $lowerSize ||
                                   str_replace([' ', '-', 'x'], '', strtolower($s->size_name)) === str_replace([' ', '-', 'x'], '', $lowerSize);
                        });
                        if ($altMatch) {
                            $sizeMap[$lowerSize] = $altMatch->id;
                        }
                    }
                }

                // 3. Process data rows below the detected header row
                for ($r = $headerRowIdx + 1; $r <= count($rows); $r++) {
                    $row = $rows[$r] ?? [];

                    // Identify color name / code across column A, B, C before sizes start
                    $colorCode = trim((string)($row['A'] ?? ''));
                    $colorName = trim((string)($row['B'] ?? ''));

                    if (empty($colorName) && !empty($colorCode)) {
                        $colorName = $colorCode;
                    }

                    if (empty($colorName)) continue;

                    // Skip numeric-only values (these are PO Numbers, not colors!)
                    if (is_numeric($colorName) || preg_match('/^[0-9\-_]+$/', $colorName)) {
                        continue;
                    }

                    // Check if this row contains summary / stopword text or day/country names
                    $lowerColor = strtolower($colorName);
                    $shouldIgnore = false;
                    foreach ($ignoreRowKeywords as $kw) {
                        if (str_contains($lowerColor, $kw)) {
                            $shouldIgnore = true;
                            break;
                        }
                    }
                    if ($shouldIgnore) continue;

                    // Match strictly against existing Style colors (do NOT pollute the style master library with arbitrary rows)
                    $matchedColorId = $colorMap[$lowerColor] ?? ($colorMap[strtolower($colorCode)] ?? null);

                    if (!$matchedColorId) {
                        // Try matching style color names partially
                        $partialMatch = $style->colors->first(function ($c) use ($lowerColor) {
                            return str_contains(strtolower($c->color_name), $lowerColor) || str_contains($lowerColor, strtolower($c->color_name));
                        });
                        if ($partialMatch) {
                            $matchedColorId = $partialMatch->id;
                        }
                    }

                    // If still not matched, check if it's the only color or fallback to first color of style
                    if (!$matchedColorId && $style->colors->isNotEmpty()) {
                        $matchedColorId = $style->colors->first()->id;
                    }

                    if (!$matchedColorId) {
                        continue; // Cannot map row without a valid style color
                    }

                    // Extract quantities for each size column
                    foreach ($sizeCols as $colLetter => $sizeName) {
                        $qty = (int) ($row[$colLetter] ?? 0);
                        if ($qty > 0) {
                            $matchedSizeId = $sizeMap[strtolower(trim($sizeName))] ?? null;

                            $extractedBreakdowns[] = [
                                'style_color_id' => $matchedColorId,
                                'style_size_id'  => $matchedSizeId,
                                'color_code'     => $colorCode ?: 'CLR-01',
                                'color_name'     => $colorName,
                                'size_name'      => $sizeName,
                                'order_qty'      => $qty,
                            ];
                            $extractedTotalQty += $qty;

                            if ($matchedColorId && $matchedSizeId) {
                                if (!isset($matrix[$matchedColorId])) {
                                    $matrix[$matchedColorId] = [];
                                }
                                $matrix[$matchedColorId][$matchedSizeId] = ($matrix[$matchedColorId][$matchedSizeId] ?? 0) + $qty;
                            }
                        }
                    }
                }

                // Refresh style relations if new items were added
                if (!empty($newColorwaysToCreate) || !empty($newSizesToCreate)) {
                    $style->load(['colors', 'sizes']);
                }

                // Scan sheet for Header Metadata: Dates, FOB, Currency, PO Numbers, Destination
                $detectedPoNumbers = [];
                $detectedDeliveryDate = null;
                $detectedOrderDate = null;
                $detectedCurrency = 'USD';
                $detectedFob = null;
                $detectedSeason = null;
                $detectedDestination = null;

                $fullSheetText = '';
                foreach (array_slice($rows, 0, 30) as $scanRow) {
                    $rowStr = implode(' ', array_filter($scanRow));
                    $fullSheetText .= ' ' . $rowStr;

                    // Match Delivery/Ship Date e.g. "Ship Date:14-09-2026" or "2026-09-14"
                    if (!$detectedDeliveryDate && preg_match('/(?:ship\s*date|delivery\s*date|ex[-\s]*factory)[:\s]*([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{2,4}|[0-9]{4}[-\/\.][0-9]{1,2}[0-9]{1,2})/i', $rowStr, $dMatch)) {
                        try {
                            $detectedDeliveryDate = \Carbon\Carbon::parse($dMatch[1])->format('Y-m-d');
                        } catch (\Exception $e) {}
                    }

                    // Match Season e.g. "Summer 2026", "Fall 2026"
                    if (!$detectedSeason && preg_match('/(?:season)[:\s]*([A-Za-z0-9\/\s\-]+)/i', $rowStr, $sMatch)) {
                        $detectedSeason = trim(substr($sMatch[1], 0, 40));
                    }

                    // Match FOB / Price e.g. "FOB: $5.50" or "Unit Price: 5.50"
                    if (!$detectedFob && preg_match('/(?:fob|unit\s*price|price)[:\s]*\$?\s*([0-9]+(?:\.[0-9]+)?)/i', $rowStr, $pMatch)) {
                        $detectedFob = (float) $pMatch[1];
                    }
                }

                // Extract multiple PO Numbers e.g. numbers starting with 137, or labeled PO#
                if (preg_match_all('/(?:po\s*#?|order\s*#?[:\s]*)?([1-9][0-9]{6,8})/i', $fullSheetText, $poMatches)) {
                    $candidatePos = array_values(array_unique($poMatches[1]));
                    // Filter out numbers that match quantities or years
                    foreach ($candidatePos as $cPo) {
                        if (strlen($cPo) >= 6 && strlen($cPo) <= 10) {
                            $detectedPoNumbers[] = $cPo;
                        }
                    }
                }

                if (count($detectedPoNumbers) > 0) {
                    $extractedPoNumber = $detectedPoNumbers[0];
                }

                // Check for destination country keywords in sheet
                $commonCountries = ['Germany', 'USA', 'United States', 'UK', 'France', 'Spain', 'Italy', 'Canada', 'Mexico', 'Saudi Arabia', 'UAE', 'Kuwait', 'Japan'];
                foreach ($commonCountries as $cc) {
                    if (stripos($fullSheetText, $cc) !== false) {
                        $detectedDestination = $cc;
                        break;
                    }
                }
            }
        } elseif ($ext === 'pdf') {
            // Parse PDF text structure
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($file->getRealPath());
            $text = $pdf->getText();

            // Try extracting PO Number regex e.g. PO# 12345 or PO-9801
            if (preg_match('/(?:PO|P\.O\.|Purchase\s+Order)(?:\s*(?:#|No|Number)?[:\s]+)([A-Z0-9\-_]+)/i', $text, $matches)) {
                $extractedPoNumber = trim($matches[1]);
            }

            // Extract Delivery Date from PDF
            if (preg_match('/(?:delivery|ship|ex[-\s]*factory)(?:\s*date)?[:\s]+([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{2,4}|[0-9]{4}[-\/\.][0-9]{1,2}[-\/\.][0-9]{1,2})/i', $text, $dMatches)) {
                try {
                    $detectedDeliveryDate = \Carbon\Carbon::parse($dMatches[1])->format('Y-m-d');
                } catch (\Exception $e) {}
            }

            // Map standard colors & sizes from style
            $matrix = [];
            foreach ($style->colors as $c) {
                foreach ($style->sizes as $s) {
                    $extractedBreakdowns[] = [
                        'style_color_id' => $c->id,
                        'style_size_id'  => $s->id,
                        'color_id'       => $c->id,
                        'color_code'     => $c->color_code,
                        'color_name'     => $c->color_name,
                        'size_name'      => $s->size_name,
                        'order_qty'      => 0,
                    ];
                }
            }
        }

        // Build Multi-PO Groups if multiple PO numbers were detected
        $multiPoGroups = [];
        if (!empty($detectedPoNumbers) && count($detectedPoNumbers) > 1) {
            foreach ($detectedPoNumbers as $pNum) {
                $multiPoGroups[] = [
                    'buyer_po_number'       => $pNum,
                    'destination_country'   => $detectedDestination,
                    'delivery_date'         => $detectedDeliveryDate,
                    'unit_price'            => $detectedFob ?: (float)($style->base_smv ? round($style->base_smv * 0.25, 2) : 5.00),
                    'currency'              => $detectedCurrency ?: 'USD',
                    'season_name'           => $detectedSeason ?: $style->season,
                    'order_qty'             => (int) round($extractedTotalQty / count($detectedPoNumbers)),
                    'breakdowns'            => $extractedBreakdowns,
                    'matrix'                => $matrix ?? [],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'PO document parsed successfully.',
            'data' => [
                'buyer_po_number'       => $extractedPoNumber,
                'total_order_qty'       => $extractedTotalQty,
                'detected_po_numbers'   => array_values(array_unique($detectedPoNumbers ?? [])),
                'factory_delivery_date' => $detectedDeliveryDate,
                'buyer_delivery_date'   => $detectedDeliveryDate,
                'season_name'           => $detectedSeason ?: $style->season,
                'unit_price'            => $detectedFob,
                'currency'              => $detectedCurrency ?: 'USD',
                'delivery_destination'  => $detectedDestination,
                'extracted_po_number'   => $extractedPoNumber,
                'extracted_total_qty'   => $extractedTotalQty,
                'breakdowns'            => $extractedBreakdowns,
                'matrix'                => $matrix ?? [],
                'multi_po_groups'       => $multiPoGroups,
                'new_colors_created'    => !empty($newColorwaysToCreate) ? count($newColorwaysToCreate) : 0,
                'new_sizes_created'     => !empty($newSizesToCreate) ? count($newSizesToCreate) : 0,
                'style_colors'          => $style->colors,
                'style_sizes'           => $style->sizes,
            ],
        ]);
    }

    /**
     * Batch store multiple Purchase Orders simultaneously from multi-PO sheet.
     * POST /api/v1/orders/batch-store
     */
    public function batchStore(Request $request): JsonResponse
    {
        $request->validate([
            'company_id'          => ['required', 'exists:companies,id'],
            'buyer_id'            => ['required', 'exists:buyers,id'],
            'style_id'            => ['required', 'exists:styles,id'],
            'orders'              => ['required', 'array', 'min:1'],
            'orders.*.buyer_po_number' => ['required', 'string', 'max:100'],
            'orders.*.order_qty'       => ['required', 'integer', 'min:1'],
            'orders.*.breakdowns'      => ['required', 'array', 'min:1'],
        ]);

        $companyId = (int) $request->input('company_id');
        $buyerId = (int) $request->input('buyer_id');
        $styleId = (int) $request->input('style_id');
        $ordersData = $request->input('orders');

        $company = Company::findOrFail($companyId);
        $shortCode = strtoupper($company->code);
        $year = date('y');
        $prefix = "{$shortCode}-ORD-{$year}-";

        $savedOrders = DB::transaction(function () use ($companyId, $buyerId, $styleId, $ordersData, $prefix, $request) {
            $createdList = [];

            // Pre-load style colors and sizes for mapping
            $style = Style::with(['colors', 'sizes'])->find($styleId);
            $colorsMap = $style ? $style->colors->keyBy('id') : collect();
            $sizesMap = $style ? $style->sizes->keyBy('id') : collect();

            // Get base sequential number
            $lastOrder = PurchaseOrder::withTrashed()
                ->where('order_code', 'like', "{$prefix}%")
                ->orderByRaw('LENGTH(order_code) DESC, order_code DESC')
                ->lockForUpdate()
                ->first();

            $nextNumber = 1;
            if ($lastOrder && preg_match('/-(\d+)$/', $lastOrder->order_code, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }

            foreach ($ordersData as $oData) {
                $orderCode = $prefix . str_pad((string) $nextNumber++, 4, '0', STR_PAD_LEFT);

                $po = PurchaseOrder::create([
                    'company_id'       => $companyId,
                    'buyer_id'         => $buyerId,
                    'style_id'         => $styleId,
                    'order_code'       => $orderCode,
                    'buyer_po_number'  => trim($oData['buyer_po_number']),
                    'season_name'      => $oData['season_name'] ?? ($style?->season ?: 'General ' . date('Y')),
                    'order_qty'        => (int) $oData['order_qty'],
                    'unit_price'       => (float) ($oData['unit_price'] ?? 0.00),
                    'currency'         => $oData['currency'] ?? 'USD',
                    'order_date'       => $oData['order_date'] ?? date('Y-m-d'),
                    'ex_factory_date'  => $oData['ex_factory_date'] ?? date('Y-m-d', strtotime('+30 days')),
                    'delivery_date'    => $oData['delivery_date'] ?? date('Y-m-d', strtotime('+35 days')),
                    'shipment_mode'    => $oData['shipment_mode'] ?? 'Sea',
                    'destination_port' => $oData['destination_port'] ?? ($oData['delivery_destination'] ?? null),
                    'po_file_url'      => $oData['po_file_url'] ?? null,
                    'po_file_name'     => $oData['po_file_name'] ?? null,
                    'po_file_size'     => $oData['po_file_size'] ?? null,
                    'entry_mode'       => $oData['entry_mode'] ?? 'Excel_Import',
                    'status'           => $oData['status'] ?? 'Confirmed',
                    'remarks'          => $oData['remarks'] ?? ($oData['entry_mode'] === 'Manual_Matrix' ? 'Manual Multi-PO Matrix Entry' : 'Batch imported via Smart PO Import Engine'),
                    'created_by'       => $request->user()?->id,
                ]);

                foreach ($oData['breakdowns'] as $index => $bItem) {
                    $cId = $bItem['style_color_id'] ?? ($bItem['color_id'] ?? null);
                    $sId = $bItem['style_size_id'] ?? ($bItem['size_id'] ?? null);

                    $styleColor = $cId ? $colorsMap->get($cId) : null;
                    $styleSize = $sId ? $sizesMap->get($sId) : null;

                    $colorCode = $bItem['color_code'] ?? ($styleColor?->color_code ?? 'CLR-01');
                    $colorName = $bItem['color_name'] ?? ($styleColor?->color_name ?? 'Standard Color');
                    $sizeName = $bItem['size_name'] ?? ($styleSize?->size_name ?? 'STD');
                    $sortOrder = $bItem['size_sort_order'] ?? ($styleSize?->sort_order ?? $index);

                    PoBreakdown::create([
                        'purchase_order_id' => $po->id,
                        'color_id'          => $cId,
                        'color_code'        => $colorCode,
                        'color_name'        => $colorName,
                        'size_name'         => $sizeName,
                        'size_sort_order'   => $sortOrder,
                        'quantity'          => (int) ($bItem['order_qty'] ?? ($bItem['quantity'] ?? 0)),
                        'excess_cut_pct'    => (float) ($bItem['excess_cut_pct'] ?? ($bItem['excess_percentage'] ?? 0.00)),
                    ]);
                }

                $createdList[] = $po;
            }

            return $createdList;
        });

        return response()->json([
            'success' => true,
            'message' => count($savedOrders) . ' Purchase Orders created successfully in batch.',
            'data'    => $savedOrders,
        ], 201);
    }
}
