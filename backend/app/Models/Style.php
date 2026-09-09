<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Style extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'buyer_id',
        'brand_id',
        'code',
        'buyer_style_no',
        'style_name',
        'product_category',
        'garment_item',
        'fabric_type',
        'season',
        'base_smv',
        'wash_type',
        'description',
        'status',
        'is_active',
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
            'base_smv' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope to affiliated company.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Style owner / client.
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Buyer::class);
    }

    /**
     * Sub-brand affiliation.
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Colorways associated with this style.
     */
    public function colors(): HasMany
    {
        return $this->hasMany(StyleColor::class)->orderBy('id');
    }

    /**
     * Active colorways.
     */
    public function activeColors(): HasMany
    {
        return $this->hasMany(StyleColor::class)->where('is_active', true)->orderBy('id');
    }

    /**
     * Size scale associated with this style.
     */
    public function sizes(): HasMany
    {
        return $this->hasMany(StyleSize::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * Active sizes.
     */
    public function activeSizes(): HasMany
    {
        return $this->hasMany(StyleSize::class)->where('is_active', true)->orderBy('sort_order')->orderBy('id');
    }
}
