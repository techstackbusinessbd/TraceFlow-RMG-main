<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SizeScaleEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'size_scale_id',
        'size_name',
        'sort_order',
    ];

    public function scale(): BelongsTo
    {
        return $this->belongsTo(SizeScale::class, 'size_scale_id');
    }
}
