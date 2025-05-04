<?php

namespace App\Http\Controllers;

use App\Models\Whiskey;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

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
        $whiskeyId = $request->id;

        if ($whiskeyId) {
            // Update existing whiskey
            $existingWhiskey = Whiskey::findOrFail($whiskeyId);
            $data = $request->validate([
                'store_id' => 'nullable|string|unique:whiskeys,store_id,' . $whiskeyId,
                'name' => 'required|string',
                'size' => 'required|integer',
                'proof' => 'nullable|numeric',
                'abv' => 'nullable|numeric',
                'spirit_type' => 'required|string',
                'avg_msrp' => 'nullable|numeric',
                'fair_price' => 'nullable|numeric',
                'shelf_price' => 'nullable|numeric',
                'stock' => 'nullable|integer|min:0',
                'notes' => 'nullable|string',
                'image' => 'nullable|string',
            ]);
            $data['unique_name'] = $existingWhiskey->unique_name; // Preserve existing unique_name
        } else {
            // Create new whiskey
            $data = $request->validate([
                'store_id' => 'nullable|string|unique:whiskeys,store_id',
                'unique_name' => 'required|string|unique:whiskeys,unique_name',
                'name' => 'required|string',
                'size' => 'required|integer',
                'proof' => 'nullable|numeric',
                'abv' => 'nullable|numeric',
                'spirit_type' => 'required|string',
                'avg_msrp' => 'nullable|numeric',
                'fair_price' => 'nullable|numeric',
                'shelf_price' => 'nullable|numeric',
                'stock' => 'nullable|integer|min:0',
                'notes' => 'nullable|string',
                'image' => 'nullable|string',
            ]);
        }

        $data['store_id'] = $data['store_id'] ?? Str::uuid()->toString();

        $whiskey = Whiskey::updateOrCreate(
            ['id' => $whiskeyId],
            array_merge($data, [
                'popularity' => ($whiskeyId ? Whiskey::find($whiskeyId)->popularity : 0) + 1,
                'stock' => $data['stock'] ?? ($whiskeyId ? Whiskey::find($whiskeyId)->stock : 0),
            ])
        );

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
                Image::create([
                    'whiskey_id' => $whiskey->id,
                    'image_path' => $imagePath,
                ]);
            } catch (\Exception $e) {
                Log::error('Image storage failed for whiskey ID: ' . $whiskey->id . ': ' . $e->getMessage());
            }
        }

        return redirect('/history')->with('success', 'Whiskey added to inventory!');
    }
}