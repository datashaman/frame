export type Layer =
    | 'base'
    | 'theme'
    | 'project'
    | 'persona'
    | 'context'
    | 'component'
    | 'state'
    | 'override';

export type TokenName =
    | 'surface'
    | 'text'
    | 'border'
    | 'spacing.inner'
    | 'radius'
    | 'elevation'
    | 'shadow'
    | 'motion'
    | 'contrast'
    | 'type.scale';

export type TokenValue = string | number;

export type ConstraintContext = {
    mode: 'light' | 'dark';
    density: 'compact' | 'comfortable' | 'spacious';
    project: string;
    persona: string;
    surface?: 'canvas' | 'form' | 'data' | 'hero';
    component?: 'card' | 'button' | 'input' | 'panel' | 'badge' | 'table';
    state?: 'warning' | 'danger' | 'focus' | 'disabled' | 'success' | 'default';
};

export type Rule = {
    id: string;
    layer: Layer;
    token: TokenName;
    value: TokenValue;
    when?: Partial<ConstraintContext>;
    reason: string;
};

export type ResolvedToken = {
    value: TokenValue;
    rule: Rule;
    overridden: Rule[];
};

export type Resolution = {
    tokens: Partial<Record<TokenName, ResolvedToken>>;
    applied: Rule[];
    ignored: Rule[];
};

export type Overrides = Partial<Record<TokenName, TokenValue>>;

export type MaterializedTokens = {
    surface: string;
    text: string;
    border: string;
    borderWidth: number;
    radius: number;
    spacing: number;
    shadow: string;
    fontSize: number;
    headingSize: number;
    labelSize: number;
    palette: Record<string, string>;
    semantic: Partial<Record<TokenName, TokenValue>>;
};

export type ComponentResolution = {
    id: string;
    label: string;
    ctx: ConstraintContext;
    resolved: Resolution;
    css: MaterializedTokens;
    overrides: Overrides;
};

export type InterpreterDelta = {
    token: TokenName;
    from: string;
    to: string;
    reason: string;
};

export type InterpreterResponse = {
    message: string;
    ambient: Partial<{
        previewMode: 'light' | 'dark';
        density: 'compact' | 'comfortable' | 'spacious';
    }>;
    overrides: Overrides;
    scope: 'selected' | 'global';
    deltas: InterpreterDelta[];
    screen?: UIScreenDelta;
};

export type UIComponentType =
    | 'card' | 'button' | 'input' | 'panel' | 'badge' | 'table'
    | 'exception-queue' | 'audit-trail' | 'approval-chain' | 'stat-row'
    | 'patient-summary' | 'medication-list' | 'care-timeline' | 'vitals-bar'
    | 'position-grid' | 'metric-ticker' | 'risk-gauge' | 'order-entry';

export type UISlot = {
    id: string;
    label: string;
    componentType: UIComponentType;
    surface?: ConstraintContext['surface'];
    state?: ConstraintContext['state'];
    data: Record<string, unknown>;
};

export type UIRegion = {
    id: string;
    layout: 'stack' | 'grid-2' | 'grid-3' | 'row';
    slots: UISlot[];
};

export type UIScreen = {
    projectId: string;
    title: string;
    regions: UIRegion[];
};

export type UIScreenDelta = {
    regions?: UIRegion[];
};
