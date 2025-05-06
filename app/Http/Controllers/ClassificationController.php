<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Models\Whiskey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ClassificationController extends Controller
{
    public function classify(Request $request)
    {
        $request->validate([
            'image' => 'required|string',
            'whiskey' => 'required|string|exists:whiskeys,unique_name',
        ]);

        $whiskey = Whiskey::where('unique_name', $request->whiskey)->firstOrFail();

        // Decode and save the image
        $imageData = preg_replace('/^data:image\/(jpeg|png);base64,/', '', $request->image);
        $imageData = base64_decode($imageData);
        if ($imageData === false) {
            throw new \Exception('Invalid image data');
        }

        $filename = uniqid() . '.jpg';
        $path = 'images/' . $filename;
        Storage::put($path, $imageData);
        $imagePath = 'images/' . $filename;

        // Create new image record
        $image = Image::create([
            'whiskey_id' => $whiskey->id,
            'image_path' => $imagePath,
        ]);

        // Increment whiskey stock
        $whiskey->increment('stock');

        return redirect("/edit/{$image->id}")->with('success', 'Whiskey selected for editing.');
    }
}