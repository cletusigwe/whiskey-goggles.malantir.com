<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use App\Models\Whiskey;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $csv = array_map('str_getcsv', file(storage_path('app/dataset.csv')));
        $headers = array_shift($csv);

        foreach ($csv as $row) {
            $data = array_combine($headers, $row);

            // Generate unique_name based on name and size
            $processedName = preg_replace('/\s+/', '_', $data['name']);
            $processedName = preg_replace('/[^\w]/', '_', $processedName);
            $processedSize = preg_replace('/[^\w]/', '_', $data['size']);
            $folderName = "{$processedName}_{$processedSize}ml";
            $uniqueName = preg_replace('/__+/', '_', $folderName);

            // Generate image_url
            $imageUrl = "/image_url/{$uniqueName}.jpg";

            // Handle brand_id
            $brandId = null;
            if (!empty($data['brand_id'])) {
                $brand = Brand::firstOrCreate(
                    ['brand_id' => $data['brand_id']],
                    ['brand_id' => $data['brand_id']]
                );
                $brandId = $brand->id;
            }

            Whiskey::create([
                'store_id' => $data['id'],
                'unique_name' => $uniqueName,
                'name' => $data['name'],
                'size' => (int) preg_replace('/[^\d]/', '', $data['size']),
                'proof' => $data['proof'] ?: null,
                'abv' => $data['abv'] ?: null,
                'spirit_type' => $data['spirit_type'],
                'brand_id' => $brandId,
                'popularity' => (int) $data['popularity'],
                'image_url' => $imageUrl,
                'avg_msrp' => $data['avg_msrp'] ?: null,
                'fair_price' => $data['fair_price'] ?: null,
                'shelf_price' => $data['shelf_price'] ?: null,
                'total_score' => (int) $data['total_score'],
                'wishlist_count' => (int) $data['wishlist_count'],
                'vote_count' => (int) $data['vote_count'],
                'bar_count' => (int) $data['bar_count'],
                'ranking' => (int) $data['ranking'],
            ]);
        }
    }
}