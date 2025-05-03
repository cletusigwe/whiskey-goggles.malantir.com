<?php

namespace App\Http\Controllers;

use App\Models\Image;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function index()
    {
        $history = Image::with('whiskey')->get()->map(function ($image) {
            return [
                'id' => $image->id,
                'name' => $image->whiskey->name,
                'size' => $image->whiskey->size,
                'proof' => $image->whiskey->proof ? number_format($image->whiskey->proof, 1) : '',
                'spirit_type' => $image->whiskey->spirit_type ?? 'Bourbon',
                'shelf_price' => $image->whiskey->shelf_price ? number_format($image->whiskey->shelf_price, 2) : '0.00',
                'date' => $image->created_at->toDateString(),
                'image' => asset('storage/' . $image->image_path),
            ];
        });

        return Inertia::render('HistoryPage', ['history' => $history]);
    }
}