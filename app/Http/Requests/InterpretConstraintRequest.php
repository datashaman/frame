<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class InterpretConstraintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'intent' => ['required', 'string', 'max:2000'],
            'context' => ['required', 'array'],
            'context.project' => ['nullable', 'string', 'max:80'],
            'context.persona' => ['nullable', 'string', 'max:80'],
            'context.previewMode' => ['nullable', 'in:light,dark'],
            'context.density' => ['nullable', 'in:compact,comfortable,spacious'],
            'context.selected' => ['nullable', 'array'],
        ];
    }
}
