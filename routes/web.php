<?php

use App\Http\Controllers\ConstraintInterpretationController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'frame')->name('home');
Route::post('/constraints/interpret', ConstraintInterpretationController::class)
    ->name('constraints.interpret');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
