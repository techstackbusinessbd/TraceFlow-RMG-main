<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class StyleColor extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'style_id',
        'color_code',
        'color_name',
        'pantone_ref',
        'hex_code',
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
            'is_active' => 'boolean',
        ];
    }

    public function style(): BelongsTo
    {
        return $this->belongsTo(Style::class);
    }
}
