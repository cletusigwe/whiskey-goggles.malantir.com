<?php

namespace App\Http\Controllers;

use App\Models\Whiskey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        $history = Whiskey::with('images')->has('images')->get()->map(function ($whiskey) use ($request) {
            $image = $whiskey->images->first();
            $imageUrl = $image ? Storage::url($image->image_path) : '';
            return [
                'id' => $whiskey->id,
                'unique_name' => $whiskey->unique_name,
                'name' => $whiskey->name,
                'stock' => $whiskey->stock ?? 0,
                'size' => $whiskey->size,
                'proof' => $whiskey->proof ? number_format($whiskey->proof, 1) : '',
                'spirit_type' => $whiskey->spirit_type ?? 'Bourbon',
                'shelf_price' => $whiskey->shelf_price ? number_format($whiskey->shelf_price, 2) : '0.00',
                'date' => $whiskey->created_at->toDateString(),
                'image' => $imageUrl,
            ];
        })->toArray();

        return Inertia::render('HistoryPage', [
            'history' => $history,
        ]);
    }
}
