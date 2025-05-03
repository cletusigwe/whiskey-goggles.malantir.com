<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    use HasFactory;

    protected $fillable = ['brand_id'];

    public function whiskeys()
    {
        return $this->hasMany(Whiskey::class);
    }
}