<?php

use App\Ai\Agents\ConstraintInterpreter;

test('interprets design intent into a semantic delta', function () {
    ConstraintInterpreter::fake([
        [
            'message' => 'Increase warning emphasis.',
            'ambient' => [],
            'overrides' => ['border' => 'warning'],
            'scope' => 'selected',
            'deltas' => [
                [
                    'token' => 'border',
                    'from' => 'visible',
                    'to' => 'warning',
                    'reason' => 'warning state needs clearer scan priority',
                ],
            ],
        ],
    ]);

    $this->postJson(route('constraints.interpret'), [
        'intent' => 'Make this warning more urgent',
        'context' => [
            'project' => 'enterprise',
            'persona' => 'ops-manager',
            'previewMode' => 'dark',
            'density' => 'compact',
            'selected' => ['id' => 'detail-card'],
        ],
    ])
        ->assertOk()
        ->assertJsonPath('scope', 'selected')
        ->assertJsonPath('overrides.border', 'warning');
});
