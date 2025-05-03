<?php

namespace App\Http\Controllers;

use App\Models\Whiskey;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class WhiskeyController extends Controller
{
    public function index()
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
            'stock',
            'notes',
        ])->get()->map(function ($whiskey) {
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
                'stock' => $whiskey->stock ?? '1',
                'notes' => $whiskey->notes ?? '',
            ];
        });

        return Inertia::render('SearchPage', ['whiskeys' => $whiskeys]);
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
            'stock',
            'notes',
        ])->get()->map(function ($whiskey) {
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
                'stock' => $whiskey->stock ?? '1',
                'notes' => $whiskey->notes ?? '',
            ];
        });

        $whiskey = null;
        if ($request->has('id')) {
            $whiskey = Whiskey::find($request->id);
            if ($whiskey) {
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
                    'stock' => $whiskey->stock ?? '1',
                    'notes' => $whiskey->notes ?? '',
                ];
            }
        }

        return Inertia::render('EditPage', ['whiskeys' => $whiskeys, 'whiskey' => $whiskey]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'store_id' => 'required|string|unique:whiskeys,store_id,' . $request->id,
            'unique_name' => 'required|string|unique:whiskeys,unique_name,' . $request->id,
            'name' => 'required|string',
            'size' => 'required|integer',
            'proof' => 'nullable|numeric',
            'abv' => 'nullable|numeric',
            'spirit_type' => 'required|string',
            'avg_msrp' => 'nullable|numeric',
            'fair_price' => 'nullable|numeric',
            'shelf_price' => 'nullable|numeric',
            'stock' => 'required|integer|min:0',
            'notes' => 'nullable|string',
            'image' => 'nullable|string',
        ]);

        // $whiskey = Whiskey::updateOrCreate(
        //     ['id' => $request->id],
        //     array_merge($data, ['popularity' => $request->popularity ?? 0])
        // );

        // if ($request->has('image') && $request->image) {
        //     $imageData = preg_replace('/^data:image\/(jpeg|png);base64,/', '', $request->image);
        //     $imageData = base64_decode($imageData);
        //     $path = 'public/images/' . uniqid() . '.jpg';
        //     Storage::put($path, $imageData);

        //     Image::create([
        //         'whiskey_id' => $whiskey->id,
        //         'image_path' => str_replace('public/', '', $path),
        //     ]);
        // }

        return redirect('/');
    }
}