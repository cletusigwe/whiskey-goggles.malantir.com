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
        $whiskeys = Whiskey::select([
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
            ];
        });

        $whiskey = null;

        if (session('selectedWhiskey')) {
            $selectedWhiskey = json_decode(session('selectedWhiskey'), true);
            $whiskey = $whiskeys->firstWhere('unique_name', $selectedWhiskey['unique_name']);
        }

        return Inertia::render('EditPage', ['whiskeys' => $whiskeys, 'whiskey' => $whiskey, 'spirit_types' => Whiskey::spiritTypes(true)]);
    }

    public function re_edit(Request $request, $image_id)
    {
        $image = Image::findOrFail($image_id);
        $oldWhiskey = $image->whiskey;

        if ($oldWhiskey && $oldWhiskey->stock > 0) {
            $oldWhiskey->decrement('stock');
        }

        $whiskeys = Whiskey::select([
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
            ];
        });
        $image->delete();
        return Inertia::render('EditPage', ['whiskeys' => $whiskeys, 'whiskey' => $oldWhiskey, 'spirit_types' => Whiskey::spiritTypes(true)]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => 'required|exists:whiskeys,id',
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
        $whiskey = Whiskey::findOrFail($data['id']);

        $whiskeyData = [
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

        if ($data['image']) {
            try {
                $imageData = preg_replace('/^data:image\/(jpeg|png);base64,/', '', $data['image']);
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
            $whiskey->increment('stock');
        }

        return redirect('/history')->with('success', 'Whiskey updated in inventory!');
    }
}
