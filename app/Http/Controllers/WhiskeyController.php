<?php

namespace App\Http\Controllers;

use App\Models\Image;
use App\Models\Whiskey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WhiskeyController extends Controller
{
    public function results(Request $request)
    {
        $whiskeys = Whiskey::select([
            'id',
            'unique_name',
            'name',
            'stock',
        ])->get()->map(function ($whiskey) {
            return [
                'id' => $whiskey->id,
                'unique_name' => $whiskey->unique_name,
                'name' => $whiskey->name,
                'stock' => $whiskey->stock ?? 0,
            ];
        });

        return Inertia::render('ResultsPage', ['whiskeys' => $whiskeys]);
    }

    public function edit(Request $request)
    {
        $whiskeys = Whiskey::with('images')->select([
            'id',
            'store_id',
            'unique_name',
            'name',
            'size',
            'proof',
            'abv',
            'spirit_type',
            'avg_msrp',
            'fair_price',
            'shelf_price',
            'popularity',
            'total_score',
            'wishlist_count',
            'vote_count',
            'bar_count',
            'ranking',
            'stock',
            'notes',
        ])->get()->map(function ($whiskey) use ($request) {
            $image = $whiskey->images->first();
            $imageUrl = $image ? $request->getSchemeAndHttpHost() . Storage::url($image->image_path) : '';
            return [
                'id' => $whiskey->id,
                'store_id' => $whiskey->store_id,
                'unique_name' => $whiskey->unique_name,
                'name' => $whiskey->name,
                'size' => $whiskey->size,
                'proof' => $whiskey->proof ? number_format($whiskey->proof, 1) : '',
                'abv' => $whiskey->abv ? number_format($whiskey->abv, 1) : '',
                'spirit_type' => $whiskey->spirit_type ?? 'Bourbon',
                'avg_msrp' => $whiskey->avg_msrp ? number_format($whiskey->avg_msrp, 2) : '',
                'fair_price' => $whiskey->fair_price ? number_format($whiskey->fair_price, 2) : '',
                'shelf_price' => $whiskey->shelf_price ? number_format($whiskey->shelf_price, 2) : '',
                'popularity' => $whiskey->popularity,
                'total_score' => $whiskey->total_score,
                'wishlist_count' => $whiskey->wishlist_count,
                'vote_count' => $whiskey->vote_count,
                'bar_count' => $whiskey->bar_count,
                'ranking' => $whiskey->ranking,
                'stock' => $whiskey->stock ?? 0,
                'notes' => $whiskey->notes ?? '',
                'image' => $imageUrl,
            ];
        });

        $whiskey = null;
        if ($request->has('id')) {
            $whiskey = Whiskey::with('images')->find($request->id);
            if ($whiskey) {
                $image = $whiskey->images->first();
                $imageUrl = $image ? $request->getSchemeAndHttpHost() . Storage::url($image->image_path) : '';
                $whiskey = [
                    'id' => $whiskey->id,
                    'store_id' => $whiskey->store_id,
                    'unique_name' => $whiskey->unique_name,
                    'name' => $whiskey->name,
                    'size' => $whiskey->size,
                    'proof' => $whiskey->proof ? number_format($whiskey->proof, 1) : '',
                    'abv' => $whiskey->abv ? number_format($whiskey->abv, 1) : '',
                    'spirit_type' => $whiskey->spirit_type ?? 'Bourbon',
                    'avg_msrp' => $whiskey->avg_msrp ? number_format($whiskey->avg_msrp, 2) : '',
                    'fair_price' => $whiskey->fair_price ? number_format($whiskey->fair_price, 2) : '',
                    'shelf_price' => $whiskey->shelf_price ? number_format($whiskey->shelf_price, 2) : '',
                    'popularity' => $whiskey->popularity,
                    'total_score' => $whiskey->total_score,
                    'wishlist_count' => $whiskey->wishlist_count,
                    'vote_count' => $whiskey->vote_count,
                    'bar_count' => $whiskey->bar_count,
                    'ranking' => $whiskey->ranking,
                    'stock' => $whiskey->stock ?? 0,
                    'notes' => $whiskey->notes ?? '',
                    'image' => $imageUrl,
                ];
            }
        } elseif (session('selectedWhiskey')) {
            $selectedWhiskey = json_decode(session('selectedWhiskey'), true);
            $whiskey = $whiskeys->firstWhere('unique_name', $selectedWhiskey['unique_name']);
        }

        return Inertia::render('EditPage', ['whiskeys' => $whiskeys, 'whiskey' => $whiskey]);
    }

    public function store(Request $request)
    {
        $imageId = $request->image_id;  // ID of the image being edited (from HistoryPage)
        $whiskeyId = $request->id;  // ID of the whiskey being edited or matched
        $existingImage = null;
        $oldWhiskey = null;

        if ($imageId) {
            // Editing an existing image (reclassifying or updating whiskey attributes)
            $existingImage = Image::findOrFail($imageId);
            $oldWhiskey = Whiskey::findOrFail($existingImage->whiskey_id);
            $data = $request->validate([
                'whiskey_id' => 'required|exists:whiskeys,id',
                'store_id' => 'nullable|string',
                'name' => 'required|string',
                'size' => 'required|integer',
                'proof' => 'nullable|numeric',
                'abv' => 'nullable|numeric',
                'spirit_type' => 'required|string',
                'avg_msrp' => 'nullable|numeric',
                'fair_price' => 'nullable|numeric',
                'shelf_price' => 'nullable|numeric',
                'notes' => 'nullable|string',
                'image' => 'nullable|string',
            ]);
        } else {
            // Creating a new image (new bottle)
            $data = $request->validate([
                'whiskey_id' => 'required|exists:whiskeys,id',
                'store_id' => 'nullable|string',
                'name' => 'required|string',
                'size' => 'required|integer',
                'proof' => 'nullable|numeric',
                'abv' => 'nullable|numeric',
                'spirit_type' => 'required|string',
                'avg_msrp' => 'nullable|numeric',
                'fair_price' => 'nullable|numeric',
                'shelf_price' => 'nullable|numeric',
                'notes' => 'nullable|string',
                'image' => 'required|string',
            ]);
        }

        $whiskey = Whiskey::findOrFail($data['whiskey_id']);

        // Handle whiskey attribute updates (shared across all bottles of this whiskey)
        $whiskeyData = [
            'store_id' => $data['store_id'] ?? $whiskey->store_id ?? Str::uuid()->toString(),
            'name' => $data['name'],
            'size' => $data['size'],
            'proof' => $data['proof'],
            'abv' => $data['abv'],
            'spirit_type' => $data['spirit_type'],
            'avg_msrp' => $data['avg_msrp'],
            'fair_price' => $data['fair_price'],
            'shelf_price' => $data['shelf_price'],
            'notes' => $data['notes'],
        ];
        $whiskey->update($whiskeyData);

        // Handle image
        if ($request->has('image') && $request->image) {
            try {
                $imageDir = 'images';
                if (!Storage::exists($imageDir)) {
                    Storage::makeDirectory($imageDir);
                }

                $imageData = preg_replace('/^data:image\/(jpeg|png);base64,/', '', $request->image);
                $imageData = base64_decode($imageData);
                if ($imageData === false) {
                    Log::error('Failed to decode base64 image data for whiskey ID: ' . $whiskey->id);
                    throw new \Exception('Invalid image data');
                }

                $filename = uniqid() . '.jpg';
                $path = 'images/' . $filename;
                $success = Storage::put($path, $imageData);

                if (!$success) {
                    Log::error('Failed to save image to ' . $path . ' for whiskey ID: ' . $whiskey->id);
                    throw new \Exception('Failed to save image');
                }

                $imagePath = 'images/' . $filename;

                if ($existingImage) {
                    // Update existing image path and delete old file
                    Storage::delete($existingImage->image_path);
                    $existingImage->update(['image_path' => $imagePath, 'whiskey_id' => $whiskey->id]);
                } else {
                    // Create new image
                    Image::create([
                        'whiskey_id' => $whiskey->id,
                        'image_path' => $imagePath,
                    ]);
                    // Increment stock for new bottle
                    $whiskey->increment('stock');
                }
            } catch (\Exception $e) {
                Log::error('Image storage failed for whiskey ID: ' . $whiskey->id . ': ' . $e->getMessage());
            }
        } elseif ($existingImage && $oldWhiskey->id !== $whiskey->id) {
            // Reclassify existing image to new whiskey
            $existingImage->update(['whiskey_id' => $whiskey->id]);
            // Adjust stock: decrement old whiskey, increment new whiskey
            if ($oldWhiskey->stock > 0) {
                $oldWhiskey->decrement('stock');
            }
            $whiskey->increment('stock');
        }

        return redirect('/history')->with('success', 'Whiskey updated in inventory!');
    }
}
