<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class Domain extends Model
{
    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'label',
        'summary',
        'ambient',
        'default_persona_id',
        'rules',
        'personae',
        'components',
        'default_screen',
    ];

    protected $casts = [
        'ambient' => 'array',
        'rules' => 'array',
        'personae' => 'array',
        'components' => 'array',
        'default_screen' => 'array',
    ];
}
