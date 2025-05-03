<?php

use App\Http\Controllers\ClassificationController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\WhiskeyController;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('CapturePage');
});

Route::get('/camera', function () {
    return Inertia::render('CameraPage');
});

Route::get('/upload', function () {
    return Inertia::render('UploadPage');
});

Route::get('/results', [ClassificationController::class, 'results']);
Route::post('/classify', [ClassificationController::class, 'classify']);

Route::get('/edit', [WhiskeyController::class, 'edit']);
Route::post('/whiskeys', [WhiskeyController::class, 'store']);

Route::get('/history', [HistoryController::class, 'index']);

Route::get('/search', [WhiskeyController::class, 'index']);