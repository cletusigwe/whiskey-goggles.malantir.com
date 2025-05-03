<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
}