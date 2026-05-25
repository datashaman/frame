<?php

use App\Http\Controllers\ConstraintInterpretationController;
use App\Http\Controllers\DomainController;
use App\Http\Controllers\FrameController;
use Illuminate\Support\Facades\Route;

Route::get('/', FrameController::class)->name('home');
Route::post('/constraints/interpret', ConstraintInterpretationController::class)
    ->name('constraints.interpret');

Route::prefix('api')->group(function () {
    Route::get('/domains', [DomainController::class, 'index']);
    Route::get('/domains/{domain}', [DomainController::class, 'show']);
    Route::post('/domains', [DomainController::class, 'store']);
    Route::delete('/domains/{domain}', [DomainController::class, 'destroy']);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
