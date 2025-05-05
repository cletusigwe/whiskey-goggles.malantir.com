<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Models\Whiskey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class HistoryController extends Controller
{
    public function index(Request $request)
    {
        $images = Image::with('whiskey')->get()->map(function ($image) use ($request) {
            $whiskey = $image->whiskey;
            return [
                'id' => $image->id,
                'whiskey_id' => $whiskey->id,
                'unique_name' => $whiskey->unique_name,
                'name' => $whiskey->name,
                'image' => $image->image_path ? Storage::url($image->image_path) : '',
                'created_at' => $image->created_at->toDateTimeString(),
            ];
        });

        return Inertia::render('HistoryPage', ['images' => $images]);
    }
}
