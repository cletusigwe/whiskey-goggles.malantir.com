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
            'whiskey' => 'required|string',
        ]);

        // For now, we just pass through to edit page
        session(['capturedImage' => $request->image, 'selectedWhiskey' => $request->whiskey]);

        return redirect('/edit');
    }

    public function results()
    {
        // Fetch whiskey unique names
        $whiskeys = Whiskey::select(['unique_name'])->get()->pluck('unique_name')->toArray();

        // Generate mock predictions with decreasing probabilities
        $predictions = array_map(function ($whiskey, $index) {
            // Start with a high probability (0.80) and decrease by 0.05 to 0.08 per rank
            $baseProb = 0.8 - ($index * 0.08);
            // Add slight randomness (±0.03) for realism
            $randomOffset = (rand(-3, 3) / 100);
            $prob = max(0.3, min(0.8, $baseProb + $randomOffset));  // Clamp between 0.30 and 0.80
            return [
                'unique_name' => $whiskey,
                'prob' => round($prob, 3),  // Round to 3 decimal places
            ];
        }, array_slice($whiskeys, 0, 10), array_keys(array_slice($whiskeys, 0, 10)));

        // Sort predictions by probability in descending order
        usort($predictions, fn($a, $b) => $b['prob'] <=> $a['prob']);

        return Inertia::render('ResultsPage', ['predictions' => $predictions]);
    }
}
