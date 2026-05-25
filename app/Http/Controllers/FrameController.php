<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Domain;
use Inertia\Inertia;
use Inertia\Response;

final class FrameController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('frame', [
            'domains' => Domain::all()->toArray(),
        ]);
    }
}
