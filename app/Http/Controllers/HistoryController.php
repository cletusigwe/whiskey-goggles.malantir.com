<?php

namespace App\Http\Controllers;

use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
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

    public function destroy(Image $image)
    {
        // Retrieve the associated whiskey
        $whiskey = $image->whiskey;

        // Decrement stock if whiskey exists and stock is greater than 0
        if ($whiskey && $whiskey->stock > 0) {
            $whiskey->decrement('stock');
        }

        // Attempt to delete the image file from storage
        try {
            if ($image->image_path && Storage::exists($image->image_path)) {
                Storage::delete($image->image_path);
            }
        } catch (\Exception $e) {
            Log::error('Failed to delete image file: ' . $image->image_path, ['exception' => $e->getMessage()]);
        }

        // Delete the image record from the database
        $image->delete();

        // Return a 204 No Content response for successful deletion
        return redirect()->back()->with('success', 'Image deleted successfully');
    }
}