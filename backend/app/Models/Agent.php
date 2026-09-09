<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Agent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'company_id',
        'code',
        'name',
        'country',
        'contact_person',
        'email',
        'phone',
        'address',
        'commission_rate',
        'is_active',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'commission_rate' => 'float',
        ];
    }

    /**
     * Parent company entity.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Buyers associated through this agent.
     */
    public function buyers(): HasMany
    {
        return $this->hasMany(Buyer::class);
    }

    /**
     * Active buyers associated through this agent.
     */
    public function activeBuyers(): HasMany
    {
        return $this->hasMany(Buyer::class)->where('is_active', true);
    }
}
