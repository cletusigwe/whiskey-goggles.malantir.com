<?php

use App\Http\Controllers\ClassificationController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\WhiskeyController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('CapturePage');
});

Route::get('/results', [WhiskeyController::class, 'results']);
Route::post('/classify', [ClassificationController::class, 'classify']);

Route::get('/edit/{image_id}', [WhiskeyController::class, 'edit']);
Route::post('/whiskey', [WhiskeyController::class, 'store']);

Route::get('/history', [HistoryController::class, 'index']);
Route::delete('/images/{image}', [HistoryController::class, 'destroy']);

Route::get('/onnx/{file}', function ($file) {
    $path = storage_path("app/onnx/$file");
    abort_unless(file_exists($path), 404);
    $mime = match (true) {
        str_ends_with($file, '.onnx') => 'application/octet-stream',
        str_ends_with($file, '.json') => 'application/json',
        default => 'application/octet-stream',
    };
    return response()->file($path, ['Content-Type' => $mime]);
});