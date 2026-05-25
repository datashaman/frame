<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'id' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9-]+$/'],
            'label' => ['required', 'string', 'max:200'],
            'summary' => ['required', 'string', 'max:500'],
            'ambient' => ['required', 'array'],
            'ambient.brand' => ['required', 'string'],
            'ambient.mode' => ['required', 'string', 'in:light,dark'],
            'ambient.density' => ['required', 'string', 'in:compact,comfortable,spacious'],
            'ambient.tone' => ['required', 'string'],
            'ambient.motion' => ['required', 'string', 'in:minimal,subtle,normal,expressive'],
            'ambient.contrast' => ['required', 'string', 'in:normal,high'],
            'ambient.domain' => ['required', 'string'],
            'default_persona_id' => ['required', 'string'],
            'rules' => ['required', 'array'],
            'personae' => ['required', 'array', 'min:1'],
            'components' => ['nullable', 'array'],
            'default_screen' => ['nullable', 'array'],
        ];
    }
}
