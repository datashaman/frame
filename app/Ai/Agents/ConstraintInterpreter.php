<?php

declare(strict_types=1);

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;
use Stringable;

final class ConstraintInterpreter implements Agent, HasStructuredOutput
{
    use Promptable;

    public function provider(): Lab
    {
        return Lab::OpenAI;
    }

    public function model(): string
    {
        return (string) config('frame.ai_model', 'gpt-4.1-mini');
    }

    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
You are the constraint interpreter inside Frame, a semantic UI design system.

The user is iteratively designing and refining UI for domain-specific applications. You can propose two kinds of changes:

1. SEMANTIC TOKENS — adjust how components look using the token vocabulary:
surface: neutral | muted | warning | danger | success
text: primary | secondary | muted
border: subtle | visible | strong | none | warning | danger | success | focus
radius: xs | sm | md | lg | xl | pill
spacing.inner: ultra-tight | tight | normal | comfortable | spacious
elevation: 0 | 1 | 2
shadow: none | sm | md | lg
motion: minimal | subtle | normal | expressive
contrast: normal | high
type.scale: sm | md | lg

2. SCREEN LAYOUT — propose a different arrangement of UI regions and components using these component types:
Shared: card | button | input | panel | badge | table
Enterprise/compliance: exception-queue | audit-trail | approval-chain | stat-row
Healthcare: patient-summary | medication-list | care-timeline | vitals-bar
Fintech: position-grid | metric-ticker | risk-gauge | order-entry

Resolution layers (highest precedence first):
override > state > component > context > persona > project > theme > base

When the user asks to change how things look, return token deltas. When the user asks to add a component, change the layout, or redesign a section, return a screen delta with the new regions. You may return both at once.

Prefer the smallest useful change. If scope is "selected" and a component is selected, target that component. Otherwise use scope "global".
PROMPT;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'message' => $schema->string()->required(),
            'ambient' => $schema->object([
                'previewMode' => $schema->string()->enum(['light', 'dark']),
                'density' => $schema->string()->enum(['compact', 'comfortable', 'spacious']),
            ])->required(),
            'overrides' => $schema->object([
                'surface' => $schema->string()->enum(['neutral', 'muted', 'warning', 'danger', 'success']),
                'text' => $schema->string()->enum(['primary', 'secondary', 'muted']),
                'border' => $schema->string()->enum(['subtle', 'visible', 'strong', 'none', 'warning', 'danger', 'success', 'focus']),
                'radius' => $schema->string()->enum(['xs', 'sm', 'md', 'lg', 'xl', 'pill']),
                'spacing.inner' => $schema->string()->enum(['ultra-tight', 'tight', 'normal', 'comfortable', 'spacious']),
                'elevation' => $schema->integer()->enum([0, 1, 2]),
                'shadow' => $schema->string()->enum(['none', 'sm', 'md', 'lg']),
                'motion' => $schema->string()->enum(['minimal', 'subtle', 'normal', 'expressive']),
                'contrast' => $schema->string()->enum(['normal', 'high']),
                'type.scale' => $schema->string()->enum(['sm', 'md', 'lg']),
            ])->required(),
            'scope' => $schema->string()->enum(['selected', 'global'])->required(),
            'deltas' => $schema->array()->items($schema->object([
                'token' => $schema->string()->required(),
                'from' => $schema->string()->required(),
                'to' => $schema->string()->required(),
                'reason' => $schema->string()->required(),
            ]))->required(),
            'screen' => $schema->object([
                'regions' => $schema->array()->items($schema->object([
                    'id' => $schema->string()->required(),
                    'layout' => $schema->string()->enum(['stack', 'grid-2', 'grid-3', 'row'])->required(),
                    'slots' => $schema->array()->items($schema->object([
                        'id' => $schema->string()->required(),
                        'label' => $schema->string()->required(),
                        'componentType' => $schema->string()->enum([
                            'card', 'button', 'input', 'panel', 'badge', 'table',
                            'exception-queue', 'audit-trail', 'approval-chain', 'stat-row',
                            'patient-summary', 'medication-list', 'care-timeline', 'vitals-bar',
                            'position-grid', 'metric-ticker', 'risk-gauge', 'order-entry',
                        ])->required(),
                        'surface' => $schema->string()->enum(['canvas', 'form', 'data', 'hero']),
                        'state' => $schema->string()->enum(['warning', 'danger', 'focus', 'disabled', 'success', 'default']),
                    ]))->required(),
                ]))->required(),
            ]),
        ];
    }
}
