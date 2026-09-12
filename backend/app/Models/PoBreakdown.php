<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PoBreakdown extends Model
{
    use HasFactory;

    protected $table = 'po_breakdowns';

    protected $fillable = [
        'uuid',
        'purchase_order_id',
        'color_id',
        'color_code',
        'color_name',
        'size_name',
        'size_sort_order',
        'quantity',
        'excess_cut_pct',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'size_sort_order' => 'integer',
            'excess_cut_pct' => 'decimal:2',
        ];
    }

    protected $appends = [
        'style_color_id',
        'style_size_id',
        'order_qty',
        'excess_percentage',
        'planned_cut_qty',
    ];

    public function getStyleColorIdAttribute(): ?int
    {
        return $this->attributes['color_id'] ?? null;
    }

    public function getStyleSizeIdAttribute(): ?int
    {
        // Try to find size id from style sizes if matching size_name
        return null;
    }

    public function getOrderQtyAttribute(): int
    {
        return (int) ($this->attributes['quantity'] ?? 0);
    }

    public function getExcessPercentageAttribute(): float
    {
        return (float) ($this->attributes['excess_cut_pct'] ?? 0.0);
    }

    public function getPlannedCutQtyAttribute(): int
    {
        $qty = (int) ($this->attributes['quantity'] ?? 0);
        $pct = (float) ($this->attributes['excess_cut_pct'] ?? 0.0);
        return (int) round($qty * (1 + ($pct / 100)));
    }

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function color(): BelongsTo
    {
        return $this->belongsTo(StyleColor::class, 'color_id');
    }
}
