<?php

namespace App\Http\Controllers;

use App\Models\Whiskey;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassificationController extends Controller
{
    public function classify(Request $request)
    {
        $request->validate([
            'image' => 'required|string',
            'whiskey' => 'required|string|exists:whiskeys,unique_name',
        ]);

        session(['capturedImage' => $request->image, 'selectedWhiskey' => json_encode(['unique_name' => $request->whiskey])]);

        return redirect('/edit')->with('success', 'Whiskey selected for editing.');
    }
}