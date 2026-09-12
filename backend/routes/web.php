<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/storage/techpacks/{filename}', function (string $filename) {
    $path = storage_path('app/public/techpacks/' . $filename);

    if (!file_exists($path)) {
        abort(404, 'File not found.');
    }

    $mime = mime_content_type($path) ?: 'application/octet-stream';
    
    return response()->file($path, [
        'Content-Type' => $mime,
        'Content-Disposition' => 'inline; filename="' . basename($path) . '"',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET, OPTIONS',
    ]);
})->where('filename', '[a-zA-Z0-9_\-\.]+');
