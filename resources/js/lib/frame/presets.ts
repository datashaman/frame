import type { Rule, UIComponentType, UIScreen, UIScreenDelta } from './types';

export const projects = {
    enterprise: {
        id: 'enterprise',
        label: 'Enterprise compliance',
        summary: 'dark, compact, serious, minimal motion',
        ambient: {
            brand: 'enterprise',
            mode: 'dark',
            density: 'compact',
            tone: 'serious',
            motion: 'minimal',
            contrast: 'high',
            domain: 'compliance',
        },
        defaultPersona: 'compliance-ops-manager',
        personae: ['compliance-ops-manager', 'compliance-auditor'],
        rules: [
            ['radius', 'sm', 'enterprise tone reduces radius'],
            ['shadow', 'none', 'serious tone discourages decorative shadow'],
            ['elevation', 0, 'enterprise discourages ornamental layering'],
            ['border', 'visible', 'compliance environment relies on borders'],
            ['motion', 'minimal', 'serious tone implies minimal motion'],
            ['contrast', 'high', 'compliance domain needs high contrast'],
        ].map(([token, value, reason]) => ({
            id: `project.enterprise.${token}`,
            layer: 'project',
            token,
            value,
            reason,
        })) as Rule[],
    },
    healthcare: {
        id: 'healthcare',
        label: 'Healthcare records',
        summary: 'light, calm, careful, accessible',
        ambient: {
            brand: 'healthcare',
            mode: 'light',
            density: 'comfortable',
            tone: 'calm',
            motion: 'subtle',
            contrast: 'high',
            domain: 'clinical',
        },
        defaultPersona: 'clinical-reviewer',
        personae: ['clinical-reviewer', 'care-coordinator'],
        rules: [
            ['radius', 'md', 'clinical tone reads as careful and rounded'],
            ['spacing.inner', 'spacious', 'clinical workflows need larger touch and reading targets'],
            ['border', 'visible', 'borders disambiguate fields'],
            ['contrast', 'high', 'clinical domain requires high contrast'],
            ['shadow', 'sm', 'clinical cards may use subtle grouping depth'],
            ['elevation', 1, 'clinical review surfaces can separate care context'],
            ['type.scale', 'lg', 'clinical records need readable text scale'],
        ].map(([token, value, reason]) => ({
            id: `project.healthcare.${token}`,
            layer: 'project',
            token,
            value,
            reason,
        })) as Rule[],
    },
    fintech: {
        id: 'fintech',
        label: 'Fintech trading desk',
        summary: 'dark, dense, high contrast',
        ambient: {
            brand: 'fintech',
            mode: 'dark',
            density: 'compact',
            tone: 'precise',
            motion: 'minimal',
            contrast: 'high',
            domain: 'markets',
        },
        defaultPersona: 'market-trader',
        personae: ['market-trader', 'risk-analyst'],
        rules: [
            ['radius', 'xs', 'trading UI prefers crisp corners'],
            ['spacing.inner', 'tight', 'maximize information density'],
            ['elevation', 0, 'flat panels avoid decoration'],
            ['shadow', 'none', 'flat data surfaces avoid shadow'],
            ['border', 'visible', 'borders separate dense data'],
            ['type.scale', 'sm', 'compact type scale on the desk'],
        ].map(([token, value, reason]) => ({
            id: `project.fintech.${token}`,
            layer: 'project',
            token,
            value,
            reason,
        })) as Rule[],
    },
};

export const personae = {
    'compliance-ops-manager': {
        id: 'compliance-ops-manager',
        label: 'Ops manager',
        detail: 'Reviewing risk alerts',
        derived: [
            ['density', 'compact', 'needs rapid scanning'],
            ['decoration', 'low', 'high-trust operational environment'],
            ['contrast', 'high', 'warning states must remain visible'],
        ],
        rules: [
            ['spacing.inner', 'tight', 'ops manager needs rapid scanning'],
            ['contrast', 'high', 'warning states must remain visible'],
            ['shadow', 'none', 'low-decoration operational tone'],
            ['elevation', 0, 'low-decoration operational tone'],
        ],
    },
    'compliance-auditor': {
        id: 'compliance-auditor',
        label: 'Compliance auditor',
        detail: 'Checking evidence and exceptions',
        derived: [
            ['density', 'compact', 'cross-references evidence frequently'],
            ['decoration', 'very low', 'audit context must feel procedural'],
            ['contrast', 'high', 'exception states must be unmistakable'],
        ],
        rules: [
            ['spacing.inner', 'tight', 'audit review values compact comparison'],
            ['contrast', 'high', 'exceptions must be unmistakable'],
            ['shadow', 'none', 'procedural interfaces suppress decoration'],
            ['elevation', 0, 'audit surfaces should remain flat'],
            ['border', 'strong', 'evidence boundaries need clear separation'],
        ],
    },
    'clinical-reviewer': {
        id: 'clinical-reviewer',
        label: 'Clinical reviewer',
        detail: 'Reviewing patient charts',
        derived: [
            ['density', 'comfortable', 'sustained attention over long shifts'],
            ['contrast', 'high', 'accuracy-critical reading'],
            ['motion', 'subtle', 'avoid distraction in clinical work'],
        ],
        rules: [
            ['spacing.inner', 'comfortable', 'long shifts need breathing room'],
            ['contrast', 'high', 'accuracy-critical reading'],
            ['motion', 'subtle', 'avoid distraction in clinical work'],
            ['radius', 'lg', 'clinical review should feel calm and readable'],
            ['type.scale', 'lg', 'comfortable reading scale'],
        ],
    },
    'care-coordinator': {
        id: 'care-coordinator',
        label: 'Care coordinator',
        detail: 'Coordinating follow-up tasks',
        derived: [
            ['density', 'comfortable', 'needs readable task context'],
            ['contrast', 'high', 'status changes need clarity'],
            ['type.scale', 'md', 'mixed clinical/admin reading'],
        ],
        rules: [
            ['spacing.inner', 'spacious', 'task coordination needs readable grouping'],
            ['contrast', 'high', 'status changes need clarity'],
            ['radius', 'lg', 'care coordination should feel approachable but precise'],
            ['type.scale', 'lg', 'mixed clinical/admin reading'],
            ['shadow', 'sm', 'care coordination uses subtle grouping depth'],
        ],
    },
    'market-trader': {
        id: 'market-trader',
        label: 'Trader',
        detail: 'Watching live markets',
        derived: [
            ['density', 'ultra-compact', 'maximum info per glance'],
            ['contrast', 'high', 'fast pattern recognition'],
            ['motion', 'minimal', 'motion distracts from price action'],
        ],
        rules: [
            ['spacing.inner', 'ultra-tight', 'maximum info per glance'],
            ['type.scale', 'sm', 'compact type for dense tables'],
            ['contrast', 'high', 'fast pattern recognition'],
            ['radius', 'xs', 'crisp grid edges on the desk'],
        ],
    },
    'risk-analyst': {
        id: 'risk-analyst',
        label: 'Risk analyst',
        detail: 'Investigating exposure anomalies',
        derived: [
            ['density', 'compact', 'compares many signals at once'],
            ['contrast', 'high', 'outliers must stand apart'],
            ['decoration', 'low', 'analysis surfaces should not distract'],
        ],
        rules: [
            ['spacing.inner', 'tight', 'risk analysis compares dense signals'],
            ['contrast', 'high', 'outliers must stand apart'],
            ['radius', 'xs', 'analytical grids prefer crisp edges'],
            ['border', 'visible', 'dense comparisons need clear structure'],
            ['shadow', 'none', 'analysis surfaces avoid depth cues'],
        ],
    },
};

export function defaultPersonaForProject(projectId: string) {
    const project = projects[projectId as keyof typeof projects] ?? projects.enterprise;

    return project.defaultPersona as keyof typeof personae;
}

export function personaeForProject(projectId: string) {
    const project = projects[projectId as keyof typeof projects] ?? projects.enterprise;

    return project.personae.map((personaId) => personae[personaId as keyof typeof personae]);
}

export function validPersonaForProject(projectId: string, personaId: string) {
    const project = projects[projectId as keyof typeof projects] ?? projects.enterprise;

    return project.personae.includes(personaId)
        ? (personaId as keyof typeof personae)
        : defaultPersonaForProject(projectId);
}

export const baseRules: Rule[] = [
    ['surface', 'neutral'],
    ['text', 'primary'],
    ['border', 'subtle'],
    ['spacing.inner', 'normal'],
    ['radius', 'md'],
    ['elevation', 1],
    ['shadow', 'sm'],
    ['motion', 'normal'],
    ['contrast', 'normal'],
    ['type.scale', 'md'],
].map(([token, value]) => ({
    id: `base.${token}`,
    layer: 'base',
    token,
    value,
    reason: 'base default',
})) as Rule[];

export const themeRules: Rule[] = [
    {
        id: 'theme.dark.surface',
        layer: 'theme',
        token: 'surface',
        value: 'neutral-dark',
        when: { mode: 'dark' },
        reason: 'dark mode inverts surface',
    },
    {
        id: 'theme.dark.text',
        layer: 'theme',
        token: 'text',
        value: 'inverted',
        when: { mode: 'dark' },
        reason: 'dark mode inverts text',
    },
];

export const contextRules: Rule[] = [
    ['form', 'elevation', 0, 'form surfaces suppress elevation'],
    ['form', 'shadow', 'none', 'form surfaces suppress shadow'],
    ['data', 'spacing.inner', 'tight', 'data surfaces tighten spacing'],
    ['data', 'border', 'visible', 'data surfaces rely on rule lines'],
].map(([surface, token, value, reason]) => ({
    id: `context.${surface}.${token}`,
    layer: 'context',
    token,
    value,
    when: { surface },
    reason,
})) as Rule[];

export const componentRules: Rule[] = [
    ['input', 'elevation', 0, 'inputs are flat'],
    ['input', 'shadow', 'none', 'inputs are flat'],
    ['input', 'border', 'visible', 'inputs need visible affordance'],
    ['badge', 'spacing.inner', 'ultra-tight', 'badges are condensed'],
    ['badge', 'radius', 'pill', 'badges use pill radius'],
    ['table', 'spacing.inner', 'tight', 'table cells run tight'],
    ['table', 'border', 'visible', 'tables rely on rule lines'],
    ['button', 'border', 'none', 'solid buttons drop borders'],
].map(([component, token, value, reason]) => ({
    id: `component.${component}.${token}`,
    layer: 'component',
    token,
    value,
    when: { component },
    reason,
})) as Rule[];

export const stateRules: Rule[] = [
    ['warning', 'border', 'warning', 'warning state highlights border'],
    ['warning', 'surface', 'warning', 'warning state tints surface'],
    ['danger', 'border', 'danger', 'danger state highlights border'],
    ['danger', 'surface', 'danger', 'danger state tints surface'],
    ['focus', 'border', 'focus', 'focus state shows accent border'],
    ['disabled', 'text', 'muted', 'disabled state mutes text'],
    ['success', 'border', 'success', 'success state highlights border'],
].map(([state, token, value, reason]) => ({
    id: `state.${state}.${token}`,
    layer: 'state',
    token,
    value,
    when: { state },
    reason,
})) as Rule[];

export function buildRuleset(projectId: string, personaId: string, density: string) {
    const project = projects[projectId as keyof typeof projects] ?? projects.enterprise;
    const persona =
        personae[validPersonaForProject(project.id, personaId)] ??
        personae[defaultPersonaForProject(project.id)];

    return [
        ...baseRules,
        ...themeRules,
        ...project.rules,
        ...(persona.rules.map(([token, value, reason]) => ({
            id: `persona.${persona.id}.${token}`,
            layer: 'persona',
            token,
            value,
            reason,
        })) as Rule[]),
        ...contextRules,
        ...componentRules,
        ...stateRules,
        {
            id: 'ambient.density',
            layer: 'project',
            token: 'spacing.inner',
            value:
                density === 'compact'
                    ? 'tight'
                    : density === 'spacious'
                      ? 'spacious'
                      : 'comfortable',
            reason: `topbar density set to ${density}`,
        } as Rule,
    ];
}

export function componentTypeToContext(type: UIComponentType): NonNullable<import('./types').ConstraintContext['component']> {
    const map: Record<UIComponentType, NonNullable<import('./types').ConstraintContext['component']>> = {
        'card': 'card', 'button': 'button', 'input': 'input',
        'panel': 'panel', 'badge': 'badge', 'table': 'table',
        'exception-queue': 'table', 'audit-trail': 'panel',
        'approval-chain': 'panel', 'stat-row': 'panel',
        'patient-summary': 'card', 'medication-list': 'table',
        'care-timeline': 'panel', 'vitals-bar': 'panel',
        'position-grid': 'table', 'metric-ticker': 'card',
        'risk-gauge': 'panel', 'order-entry': 'input',
    };
    return map[type] ?? 'panel';
}

export const projectScreens: Record<keyof typeof projects, UIScreen> = {
    enterprise: {
        projectId: 'enterprise',
        title: 'Compliance Operations',
        regions: [
            {
                id: 'ent-r1',
                layout: 'row',
                slots: [
                    {
                        id: 'ent-stat-row',
                        label: 'Stats',
                        componentType: 'stat-row',
                        data: {
                            stats: [
                                { label: 'Open', value: 14, status: 'warning' },
                                { label: 'Critical', value: 3, status: 'danger' },
                                { label: 'Resolved today', value: 27, status: 'success' },
                                { label: 'SLA breach', value: 2, status: 'danger' },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'ent-r2',
                layout: 'stack',
                slots: [
                    {
                        id: 'ent-exception-queue',
                        label: 'Exception queue',
                        componentType: 'exception-queue',
                        surface: 'data',
                        data: {
                            items: [
                                { id: 'ALR-0418', control: 'Risk score drift', status: 'warning', variance: '+4.2s', owner: 'a.kapoor' },
                                { id: 'ALR-0419', control: 'Latency budget', status: 'danger', variance: '-18%', owner: 's.olu' },
                                { id: 'ALR-0420', control: 'Throughput', status: 'success', variance: '+2.1%', owner: 'r.tan' },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'ent-r3',
                layout: 'grid-2',
                slots: [
                    {
                        id: 'compliance-detail-card',
                        label: 'Exception detail',
                        componentType: 'card',
                        state: 'warning',
                        data: {
                            title: 'ALR-0418 · Risk score drift',
                            body: 'Portfolio R-114 moved outside the approved tolerance band. The reviewer must capture evidence before acknowledgement.',
                        },
                    },
                    {
                        id: 'ent-audit-trail',
                        label: 'Audit trail',
                        componentType: 'audit-trail',
                        data: {
                            events: [
                                { time: '14:22', actor: 'a.kapoor', action: 'Flagged', note: 'Tolerance band breach' },
                                { time: '13:50', actor: 'system', action: 'Auto-detected', note: 'Score exceeded threshold' },
                                { time: '12:04', actor: 'r.tan', action: 'Acknowledged', note: 'Prior exception cleared' },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'ent-r4',
                layout: 'row',
                slots: [
                    {
                        id: 'ent-approval-chain',
                        label: 'Approval chain',
                        componentType: 'approval-chain',
                        data: { steps: ['Reviewer', 'Ops lead', 'Compliance'], current: 0 },
                    },
                    {
                        id: 'compliance-primary-button',
                        label: 'Acknowledge',
                        componentType: 'button',
                        data: { label: 'Acknowledge exception' },
                    },
                    {
                        id: 'compliance-asset-input',
                        label: 'Case input',
                        componentType: 'input',
                        surface: 'form',
                        state: 'focus',
                        data: { label: 'Case ID', value: 'ALR-0418' },
                    },
                ],
            },
        ],
    },
    healthcare: {
        projectId: 'healthcare',
        title: 'Patient Chart',
        regions: [
            {
                id: 'hc-r1',
                layout: 'stack',
                slots: [
                    {
                        id: 'hc-patient-summary',
                        label: 'Patient summary',
                        componentType: 'patient-summary',
                        data: {
                            id: 'PT-2048',
                            age: 67,
                            ward: 'Cardiology 4B',
                            alerts: ['Allergy conflict', 'Medication review'],
                            attending: 'n.patel',
                        },
                    },
                ],
            },
            {
                id: 'hc-r2',
                layout: 'stack',
                slots: [
                    {
                        id: 'hc-vitals-bar',
                        label: 'Vitals bar',
                        componentType: 'vitals-bar',
                        data: {
                            readings: [
                                { label: 'BP', value: '142/88', status: 'warning' },
                                { label: 'HR', value: '74 bpm', status: 'success' },
                                { label: 'SpO₂', value: '97%', status: 'success' },
                                { label: 'Temp', value: '37.4°C', status: 'success' },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'hc-r3',
                layout: 'grid-2',
                slots: [
                    {
                        id: 'hc-medication-list',
                        label: 'Medication list',
                        componentType: 'medication-list',
                        data: {
                            items: [
                                { name: 'Warfarin 5mg', status: 'danger', note: 'Allergy conflict flagged' },
                                { name: 'Lisinopril 10mg', status: 'success', note: 'Active' },
                                { name: 'Metformin 500mg', status: 'warning', note: 'Review required' },
                            ],
                        },
                    },
                    {
                        id: 'hc-care-timeline',
                        label: 'Care timeline',
                        componentType: 'care-timeline',
                        data: {
                            events: [
                                { time: '09:40', type: 'warning', text: 'Allergy conflict detected on chart' },
                                { time: '08:15', type: 'default', text: 'Morning vitals recorded — stable' },
                                { time: 'Yesterday', type: 'default', text: 'Admitted to Cardiology 4B' },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'hc-r4',
                layout: 'row',
                slots: [
                    {
                        id: 'healthcare-primary-button',
                        label: 'Escalate',
                        componentType: 'button',
                        data: { label: 'Escalate' },
                    },
                    {
                        id: 'healthcare-patient-input',
                        label: 'Patient input',
                        componentType: 'input',
                        surface: 'form',
                        state: 'focus',
                        data: { label: 'Patient ID', value: 'PT-2048' },
                    },
                    {
                        id: 'healthcare-status-badge',
                        label: 'Clinical review badge',
                        componentType: 'badge',
                        state: 'warning',
                        data: { label: 'Review' },
                    },
                ],
            },
        ],
    },
    fintech: {
        projectId: 'fintech',
        title: 'Trading Desk',
        regions: [
            {
                id: 'ft-r1',
                layout: 'row',
                slots: [
                    {
                        id: 'ft-ticker-pnl',
                        label: 'Desk P&L',
                        componentType: 'metric-ticker',
                        data: { label: 'Desk P&L', value: '+$2.4M', delta: '+1.8%', status: 'success' },
                    },
                    {
                        id: 'ft-ticker-var',
                        label: 'VaR usage',
                        componentType: 'metric-ticker',
                        data: { label: 'VaR usage', value: '84%', delta: '+3%', status: 'warning' },
                    },
                    {
                        id: 'ft-ticker-open',
                        label: 'Open positions',
                        componentType: 'metric-ticker',
                        data: { label: 'Open', value: '47', delta: '+5', status: 'default' },
                    },
                    {
                        id: 'ft-risk-gauge',
                        label: 'Risk gauge',
                        componentType: 'risk-gauge',
                        data: { label: 'Limit utilization', value: 84, threshold: 90 },
                    },
                ],
            },
            {
                id: 'ft-r2',
                layout: 'stack',
                slots: [
                    {
                        id: 'ft-position-grid',
                        label: 'Exposure grid',
                        componentType: 'position-grid',
                        surface: 'data',
                        data: {
                            rows: [
                                { id: 'NVDA', book: 'Growth tech', signal: 'warning', pnl: '+$840K', move: '+3.8%', desk: 'alpha' },
                                { id: 'EURUSD', book: 'Macro hedge', signal: 'danger', pnl: '-$210K', move: '-1.4%', desk: 'fx' },
                                { id: 'UST10Y', book: 'Rates', signal: 'success', pnl: '+$120K', move: '+7bp', desk: 'rates' },
                            ],
                        },
                    },
                ],
            },
            {
                id: 'ft-r3',
                layout: 'grid-2',
                slots: [
                    {
                        id: 'ft-order-entry',
                        label: 'Order entry',
                        componentType: 'order-entry',
                        surface: 'form',
                        data: { symbol: 'NVDA', side: 'sell', quantity: '5,000', type: 'limit', price: '127.40' },
                    },
                    {
                        id: 'fintech-status-badge',
                        label: 'Limit badge',
                        componentType: 'badge',
                        state: 'warning',
                        data: { label: 'Limit breach' },
                    },
                ],
            },
        ],
    },
};

export function defaultSlotData(type: UIComponentType): Record<string, unknown> {
    const defaults: Record<UIComponentType, Record<string, unknown>> = {
        'card': { title: 'Card', body: 'Card body content.' },
        'button': { label: 'Button' },
        'input': { label: 'Input', value: '' },
        'panel': { title: 'Panel', body: 'Panel content.' },
        'badge': { label: 'Badge' },
        'table': { headings: ['Col A', 'Col B', 'Col C'], rows: [['—', '—', '—']] },
        'exception-queue': { items: [] },
        'audit-trail': { events: [] },
        'approval-chain': { steps: ['Step 1', 'Step 2', 'Step 3'], current: 0 },
        'stat-row': { stats: [] },
        'patient-summary': { id: 'PT-0000', age: 0, ward: '—', alerts: [], attending: '—' },
        'medication-list': { items: [] },
        'care-timeline': { events: [] },
        'vitals-bar': { readings: [] },
        'position-grid': { rows: [] },
        'metric-ticker': { label: '—', value: '—', delta: '—', status: 'default' },
        'risk-gauge': { label: '—', value: 0, threshold: 100 },
        'order-entry': { symbol: '—', side: 'buy', quantity: '0', type: 'limit', price: '0.00' },
    };
    return defaults[type] ?? {};
}

export function mergeScreenDelta(current: UIScreen, delta: UIScreenDelta, project: keyof typeof projects): UIScreen {
    if (!delta.regions) return current;

    const preset = projectScreens[project];
    const presetSlotsById = new Map<string, import('./types').UISlot>();
    for (const region of preset.regions) {
        for (const slot of region.slots) {
            presetSlotsById.set(slot.id, slot);
        }
    }

    const mergedRegions = delta.regions.map((region) => ({
        ...region,
        slots: region.slots.map((slot) => {
            const presetSlot = presetSlotsById.get(slot.id);
            return {
                ...slot,
                data: presetSlot ? presetSlot.data : defaultSlotData(slot.componentType),
            };
        }),
    }));

    return { ...current, regions: mergedRegions };
}
