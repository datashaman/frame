<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Domain;
use Illuminate\Database\Seeder;

class DomainSeeder extends Seeder
{
    public function run(): void
    {
        $domains = [
            [
                'id' => 'enterprise',
                'label' => 'Enterprise compliance',
                'summary' => 'dark, compact, serious, minimal motion',
                'ambient' => [
                    'brand' => 'enterprise',
                    'mode' => 'dark',
                    'density' => 'compact',
                    'tone' => 'serious',
                    'motion' => 'minimal',
                    'contrast' => 'high',
                    'domain' => 'compliance',
                ],
                'default_persona_id' => 'compliance-ops-manager',
                'rules' => [
                    ['id' => 'project.enterprise.radius', 'layer' => 'project', 'token' => 'radius', 'value' => 'sm', 'reason' => 'enterprise tone reduces radius'],
                    ['id' => 'project.enterprise.shadow', 'layer' => 'project', 'token' => 'shadow', 'value' => 'none', 'reason' => 'serious tone discourages decorative shadow'],
                    ['id' => 'project.enterprise.elevation', 'layer' => 'project', 'token' => 'elevation', 'value' => 0, 'reason' => 'enterprise discourages ornamental layering'],
                    ['id' => 'project.enterprise.border', 'layer' => 'project', 'token' => 'border', 'value' => 'visible', 'reason' => 'compliance environment relies on borders'],
                    ['id' => 'project.enterprise.motion', 'layer' => 'project', 'token' => 'motion', 'value' => 'minimal', 'reason' => 'serious tone implies minimal motion'],
                    ['id' => 'project.enterprise.contrast', 'layer' => 'project', 'token' => 'contrast', 'value' => 'high', 'reason' => 'compliance domain needs high contrast'],
                ],
                'personae' => [
                    [
                        'id' => 'compliance-ops-manager',
                        'label' => 'Ops manager',
                        'detail' => 'Reviewing risk alerts',
                        'derived' => [
                            ['density', 'compact', 'needs rapid scanning'],
                            ['decoration', 'low', 'high-trust operational environment'],
                            ['contrast', 'high', 'warning states must remain visible'],
                        ],
                        'rules' => [
                            ['spacing.inner', 'tight', 'ops manager needs rapid scanning'],
                            ['contrast', 'high', 'warning states must remain visible'],
                            ['shadow', 'none', 'low-decoration operational tone'],
                            ['elevation', 0, 'low-decoration operational tone'],
                        ],
                    ],
                    [
                        'id' => 'compliance-auditor',
                        'label' => 'Compliance auditor',
                        'detail' => 'Checking evidence and exceptions',
                        'derived' => [
                            ['density', 'compact', 'cross-references evidence frequently'],
                            ['decoration', 'very low', 'audit context must feel procedural'],
                            ['contrast', 'high', 'exception states must be unmistakable'],
                        ],
                        'rules' => [
                            ['spacing.inner', 'tight', 'audit review values compact comparison'],
                            ['contrast', 'high', 'exceptions must be unmistakable'],
                            ['shadow', 'none', 'procedural interfaces suppress decoration'],
                            ['elevation', 0, 'audit surfaces should remain flat'],
                            ['border', 'strong', 'evidence boundaries need clear separation'],
                        ],
                    ],
                ],
                'components' => null,
                'default_screen' => null,
            ],
            [
                'id' => 'healthcare',
                'label' => 'Healthcare records',
                'summary' => 'light, calm, careful, accessible',
                'ambient' => [
                    'brand' => 'healthcare',
                    'mode' => 'light',
                    'density' => 'comfortable',
                    'tone' => 'calm',
                    'motion' => 'subtle',
                    'contrast' => 'high',
                    'domain' => 'clinical',
                ],
                'default_persona_id' => 'clinical-reviewer',
                'rules' => [
                    ['id' => 'project.healthcare.radius', 'layer' => 'project', 'token' => 'radius', 'value' => 'md', 'reason' => 'clinical tone reads as careful and rounded'],
                    ['id' => 'project.healthcare.spacing.inner', 'layer' => 'project', 'token' => 'spacing.inner', 'value' => 'spacious', 'reason' => 'clinical workflows need larger touch and reading targets'],
                    ['id' => 'project.healthcare.border', 'layer' => 'project', 'token' => 'border', 'value' => 'visible', 'reason' => 'borders disambiguate fields'],
                    ['id' => 'project.healthcare.contrast', 'layer' => 'project', 'token' => 'contrast', 'value' => 'high', 'reason' => 'clinical domain requires high contrast'],
                    ['id' => 'project.healthcare.shadow', 'layer' => 'project', 'token' => 'shadow', 'value' => 'sm', 'reason' => 'clinical cards may use subtle grouping depth'],
                    ['id' => 'project.healthcare.elevation', 'layer' => 'project', 'token' => 'elevation', 'value' => 1, 'reason' => 'clinical review surfaces can separate care context'],
                    ['id' => 'project.healthcare.type.scale', 'layer' => 'project', 'token' => 'type.scale', 'value' => 'lg', 'reason' => 'clinical records need readable text scale'],
                ],
                'personae' => [
                    [
                        'id' => 'clinical-reviewer',
                        'label' => 'Clinical reviewer',
                        'detail' => 'Reviewing patient charts',
                        'derived' => [
                            ['density', 'comfortable', 'sustained attention over long shifts'],
                            ['contrast', 'high', 'accuracy-critical reading'],
                            ['motion', 'subtle', 'avoid distraction in clinical work'],
                        ],
                        'rules' => [
                            ['spacing.inner', 'comfortable', 'long shifts need breathing room'],
                            ['contrast', 'high', 'accuracy-critical reading'],
                            ['motion', 'subtle', 'avoid distraction in clinical work'],
                            ['radius', 'lg', 'clinical review should feel calm and readable'],
                            ['type.scale', 'lg', 'comfortable reading scale'],
                        ],
                    ],
                    [
                        'id' => 'care-coordinator',
                        'label' => 'Care coordinator',
                        'detail' => 'Coordinating follow-up tasks',
                        'derived' => [
                            ['density', 'comfortable', 'needs readable task context'],
                            ['contrast', 'high', 'status changes need clarity'],
                            ['type.scale', 'md', 'mixed clinical/admin reading'],
                        ],
                        'rules' => [
                            ['spacing.inner', 'spacious', 'task coordination needs readable grouping'],
                            ['contrast', 'high', 'status changes need clarity'],
                            ['radius', 'lg', 'care coordination should feel approachable but precise'],
                            ['type.scale', 'lg', 'mixed clinical/admin reading'],
                            ['shadow', 'sm', 'care coordination uses subtle grouping depth'],
                        ],
                    ],
                ],
                'components' => null,
                'default_screen' => null,
            ],
            [
                'id' => 'fintech',
                'label' => 'Fintech trading desk',
                'summary' => 'dark, dense, high contrast',
                'ambient' => [
                    'brand' => 'fintech',
                    'mode' => 'dark',
                    'density' => 'compact',
                    'tone' => 'precise',
                    'motion' => 'minimal',
                    'contrast' => 'high',
                    'domain' => 'markets',
                ],
                'default_persona_id' => 'market-trader',
                'rules' => [
                    ['id' => 'project.fintech.radius', 'layer' => 'project', 'token' => 'radius', 'value' => 'xs', 'reason' => 'trading UI prefers crisp corners'],
                    ['id' => 'project.fintech.spacing.inner', 'layer' => 'project', 'token' => 'spacing.inner', 'value' => 'tight', 'reason' => 'maximize information density'],
                    ['id' => 'project.fintech.elevation', 'layer' => 'project', 'token' => 'elevation', 'value' => 0, 'reason' => 'flat panels avoid decoration'],
                    ['id' => 'project.fintech.shadow', 'layer' => 'project', 'token' => 'shadow', 'value' => 'none', 'reason' => 'flat data surfaces avoid shadow'],
                    ['id' => 'project.fintech.border', 'layer' => 'project', 'token' => 'border', 'value' => 'visible', 'reason' => 'borders separate dense data'],
                    ['id' => 'project.fintech.type.scale', 'layer' => 'project', 'token' => 'type.scale', 'value' => 'sm', 'reason' => 'compact type scale on the desk'],
                ],
                'personae' => [
                    [
                        'id' => 'market-trader',
                        'label' => 'Trader',
                        'detail' => 'Watching live markets',
                        'derived' => [
                            ['density', 'ultra-compact', 'maximum info per glance'],
                            ['contrast', 'high', 'fast pattern recognition'],
                            ['motion', 'minimal', 'motion distracts from price action'],
                        ],
                        'rules' => [
                            ['spacing.inner', 'ultra-tight', 'maximum info per glance'],
                            ['type.scale', 'sm', 'compact type for dense tables'],
                            ['contrast', 'high', 'fast pattern recognition'],
                            ['radius', 'xs', 'crisp grid edges on the desk'],
                        ],
                    ],
                    [
                        'id' => 'risk-analyst',
                        'label' => 'Risk analyst',
                        'detail' => 'Investigating exposure anomalies',
                        'derived' => [
                            ['density', 'compact', 'compares many signals at once'],
                            ['contrast', 'high', 'outliers must stand apart'],
                            ['decoration', 'low', 'analysis surfaces should not distract'],
                        ],
                        'rules' => [
                            ['spacing.inner', 'tight', 'risk analysis compares dense signals'],
                            ['contrast', 'high', 'outliers must stand apart'],
                            ['radius', 'xs', 'analytical grids prefer crisp edges'],
                            ['border', 'visible', 'dense comparisons need clear structure'],
                            ['shadow', 'none', 'analysis surfaces avoid depth cues'],
                        ],
                    ],
                ],
                'components' => null,
                'default_screen' => null,
            ],
        ];

        foreach ($domains as $data) {
            Domain::updateOrCreate(['id' => $data['id']], $data);
        }
    }
}
