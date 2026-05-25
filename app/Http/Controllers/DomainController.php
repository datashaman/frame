<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreDomainRequest;
use App\Models\Domain;
use Illuminate\Http\JsonResponse;

final class DomainController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Domain::all());
    }

    public function show(Domain $domain): JsonResponse
    {
        return response()->json($domain);
    }

    public function store(StoreDomainRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $domain = Domain::updateOrCreate(
            ['id' => $validated['id']],
            $validated,
        );

        return response()->json($domain, $domain->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Domain $domain): JsonResponse
    {
        $domain->delete();

        return response()->json(null, 204);
    }
}
