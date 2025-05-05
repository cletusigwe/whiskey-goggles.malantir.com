<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class Whiskey extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'unique_name',
        'name',
        'size',
        'proof',
        'abv',
        'spirit_type',
        'brand_id',
        'popularity',
        'image_url',
        'avg_msrp',
        'fair_price',
        'shelf_price',
        'total_score',
        'wishlist_count',
        'vote_count',
        'bar_count',
        'ranking',
        'stock',
        'notes',
    ];

    public function images()
    {
        return $this->hasMany(Image::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public static function spiritTypes(bool $asArray = false): Collection|array
    {
        $types = self::query()
            ->whereNotNull('spirit_type')
            ->distinct()
            ->orderBy('spirit_type')
            ->pluck('spirit_type');

        return $asArray ? $types->values()->all() : $types;
    }
}
