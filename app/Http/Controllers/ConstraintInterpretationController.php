<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Ai\Agents\ConstraintInterpreter;
use App\Http\Requests\InterpretConstraintRequest;
use Illuminate\Http\JsonResponse;
use JsonException;

final class ConstraintInterpretationController extends Controller
{
    /**
     * @throws JsonException
     */
    public function __invoke(InterpretConstraintRequest $request): JsonResponse
    {
        $payload = [
            'current_context' => $request->validated('context'),
            'user_intent' => $request->validated('intent'),
        ];

        $response = (new ConstraintInterpreter)->prompt(
            prompt: json_encode($payload, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR),
        );

        $decoded = property_exists($response, 'structured')
            ? $response->structured
            : json_decode($response->text, true);

        if (! is_array($decoded)) {
            return response()->json([
                'message' => 'The interpreter returned an invalid structured delta.',
                'ambient' => [],
                'overrides' => [],
                'scope' => 'global',
                'deltas' => [],
            ], 502);
        }

        return response()->json($decoded);
    }
}
