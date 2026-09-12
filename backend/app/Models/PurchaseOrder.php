<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'purchase_orders';

    protected $fillable = [
        'uuid',
        'company_id',
        'buyer_id',
        'style_id',
        'order_code',
        'buyer_po_number',
        'season_name',
        'order_qty',
        'unit_price',
        'currency',
        'order_date',
        'ex_factory_date',
        'delivery_date',
        'shipment_mode',
        'destination_port',
        'po_file_url',
        'po_file_name',
        'po_file_size',
        'entry_mode',
        'status',
        'remarks',
        'created_by',
        'updated_by',
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
            'order_qty' => 'integer',
            'unit_price' => 'decimal:4',
            'order_date' => 'date:Y-m-d',
            'ex_factory_date' => 'date:Y-m-d',
            'delivery_date' => 'date:Y-m-d',
        ];
    }

    protected $appends = [
        'total_order_qty',
        'total_order_value',
        'order_placement_date',
        'factory_delivery_date',
        'buyer_delivery_date',
        'delivery_destination',
        'order_type',
    ];

    public function getTotalOrderQtyAttribute(): int
    {
        return (int) ($this->attributes['order_qty'] ?? 0);
    }

    public function getTotalOrderValueAttribute(): float
    {
        $qty = (int) ($this->attributes['order_qty'] ?? 0);
        $price = (float) ($this->attributes['unit_price'] ?? 0);
        return round($qty * $price, 2);
    }

    public function getOrderPlacementDateAttribute(): ?string
    {
        return isset($this->attributes['order_date']) ? substr((string)$this->attributes['order_date'], 0, 10) : null;
    }

    public function getFactoryDeliveryDateAttribute(): ?string
    {
        return isset($this->attributes['ex_factory_date']) ? substr((string)$this->attributes['ex_factory_date'], 0, 10) : null;
    }

    public function getBuyerDeliveryDateAttribute(): ?string
    {
        return isset($this->attributes['delivery_date']) ? substr((string)$this->attributes['delivery_date'], 0, 10) : null;
    }

    public function getDeliveryDestinationAttribute(): ?string
    {
        return $this->attributes['destination_port'] ?? null;
    }

    public function getOrderTypeAttribute(): string
    {
        return 'Regular';
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Buyer::class);
    }

    public function style(): BelongsTo
    {
        return $this->belongsTo(Style::class);
    }

    public function breakdowns(): HasMany
    {
        return $this->hasMany(PoBreakdown::class, 'purchase_order_id')->orderBy('color_code')->orderBy('size_sort_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
