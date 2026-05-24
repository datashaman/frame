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
You are the constraint interpreter inside Frame, a deterministic semantic UI builder.

The user is iteratively refining a semantic design system. You do not write CSS, classes, Tailwind, or component code. You only propose semantic constraint deltas using this vocabulary:

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

Resolution layers, highest precedence first:
override > state > component > context > persona > project > theme > base

Return a small structured delta. Prefer the smallest useful change. If the user asks for CSS, visual polish, or direct styling, translate that request into semantic tokens. If a selected component exists, use scope "selected" for targeted requests. If no selected component exists, or the user asks for broad language changes, use scope "global".
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
        ];
    }
}
