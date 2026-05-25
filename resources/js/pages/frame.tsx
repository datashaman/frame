import { Head } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { materialize, palette } from '@/lib/frame/materializer';
import {
    buildRuleset,
    componentTypeToContext,
    defaultPersonaForProject,
    mergeScreenDelta,
    personae,
    personaeForProject,
    projectScreens,
    projects,
    validPersonaForProject,
} from '@/lib/frame/presets';
import { resolve } from '@/lib/frame/resolver';
import type {
    ComponentResolution,
    ConstraintContext,
    InterpreterResponse,
    MaterializedTokens,
    Overrides,
    Rule,
    TokenName,
    TokenValue,
    UIRegion,
    UIScreen,
    UIScreenDelta,
    UISlot,
} from '@/lib/frame/types';

type WorkspaceState = {
    project: keyof typeof projects;
    persona: keyof typeof personae;
    previewMode: 'light' | 'dark';
    density: 'compact' | 'comfortable' | 'spacious';
    viewMode: 'screen' | 'gallery';
    selected: string | null;
    screen: UIScreen;
};

type ChatMessage = {
    role: 'user' | 'assistant';
    text: string;
    deltas?: InterpreterResponse['deltas'];
    error?: string;
};

const tokenOptions: Record<TokenName, TokenValue[]> = {
    surface: ['neutral', 'muted', 'warning', 'danger', 'success'],
    text: ['primary', 'secondary', 'muted'],
    border: [
        'subtle',
        'visible',
        'strong',
        'none',
        'warning',
        'danger',
        'success',
        'focus',
    ],
    'spacing.inner': [
        'ultra-tight',
        'tight',
        'normal',
        'comfortable',
        'spacious',
    ],
    radius: ['xs', 'sm', 'md', 'lg', 'xl', 'pill'],
    elevation: [0, 1, 2],
    shadow: ['none', 'sm', 'md', 'lg'],
    motion: ['minimal', 'subtle', 'normal', 'expressive'],
    contrast: ['normal', 'high'],
    'type.scale': ['sm', 'md', 'lg'],
};

export default function Frame() {
    const [state, setState] = useState<WorkspaceState>({
        project: 'enterprise',
        persona: 'compliance-ops-manager',
        previewMode: 'dark',
        density: 'compact',
        viewMode: 'screen',
        selected: null,
        screen: projectScreens.enterprise,
    });
    const [overrides, setOverrides] = useState<Record<string, Overrides>>({});
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [busy, setBusy] = useState(false);

    const rules = useMemo(
        () => buildRuleset(state.project, state.persona, state.density),
        [state.project, state.persona, state.density],
    );

    const resolutions = useMemo(
        () => buildResolutions(state, rules, overrides),
        [state, rules, overrides],
    );

    const selected = state.selected ? (resolutions[state.selected] ?? null) : null;

    function patchState(patch: Partial<WorkspaceState>) {
        setState((current) => ({ ...current, ...patch }));
    }

    function resetOverrides() {
        setOverrides({});
    }

    function setOverride(token: TokenName, value: TokenValue | undefined) {
        if (!state.selected) {
            return;
        }

        setOverrides((current) => {
            const target = { ...(current[state.selected ?? ''] ?? {}) };

            if (value === undefined) {
                delete target[token];
            } else {
                target[token] = value;
            }

            return { ...current, [state.selected ?? '']: target };
        });
    }

    async function sendIntent(intent: string) {
        if (busy || !intent.trim()) {
            return;
        }

        setHistory((current) => current.concat({ role: 'user', text: intent }));
        setBusy(true);

        try {
            const response = await fetch('/constraints/interpret', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                            ?.getAttribute('content') ?? '',
                },
                body: JSON.stringify({
                    intent,
                    context: {
                        project: state.project,
                        persona: state.persona,
                        previewMode: state.previewMode,
                        density: state.density,
                        selected: selected
                            ? {
                                  id: selected.id,
                                  label: selected.label,
                                  ctx: selected.ctx,
                                  tokens: Object.fromEntries(
                                      Object.entries(selected.resolved.tokens).map(
                                          ([key, info]) => [key, info?.value],
                                      ),
                                  ),
                              }
                            : null,
                    },
                }),
            });

            const data = (await response.json()) as InterpreterResponse;

            if (!response.ok) {
                throw new Error(data.message || 'Interpreter failed');
            }

            if (data.ambient.previewMode || data.ambient.density) {
                patchState({
                    previewMode: data.ambient.previewMode ?? state.previewMode,
                    density: data.ambient.density ?? state.density,
                });
            }

            const target = data.scope === 'selected' && state.selected ? state.selected : '*';

            setOverrides((current) => ({
                ...current,
                [target]: { ...(current[target] ?? {}), ...data.overrides },
            }));

            if (data.screen) {
                setState((current) => ({
                    ...current,
                    screen: mergeScreenDelta(current.screen, data.screen as UIScreenDelta, current.project),
                }));
            }

            setHistory((current) =>
                current.concat({
                    role: 'assistant',
                    text: data.message,
                    deltas: data.deltas,
                }),
            );
        } catch (error) {
            setHistory((current) =>
                current.concat({
                    role: 'assistant',
                    text: 'Interpreter failed to produce a constraint delta.',
                    error: error instanceof Error ? error.message : String(error),
                }),
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <Head title="Frame" />
            <div className="grid h-screen grid-cols-[296px_1fr_340px] grid-rows-[44px_1fr_202px] overflow-hidden bg-zinc-50 text-[13px] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
                <Topbar state={state} patchState={patchState} resetOverrides={resetOverrides} />
                <ChatPane history={history} busy={busy} selected={selected} sendIntent={sendIntent} />
                <Viewport
                    state={state}
                    resolutions={resolutions}
                    selected={state.selected}
                    select={(id) => patchState({ selected: id })}
                />
                <TracePane
                    selected={selected}
                    project={projects[state.project]}
        persona={personae[validPersonaForProject(state.project, state.persona)]}
                />
                <Inspector
                    selected={selected}
                    overrides={state.selected ? (overrides[state.selected] ?? {}) : {}}
                    setOverride={setOverride}
                />
            </div>
        </>
    );
}

function Topbar({
    state,
    patchState,
    resetOverrides,
}: {
    state: WorkspaceState;
    patchState: (patch: Partial<WorkspaceState>) => void;
    resetOverrides: () => void;
}) {
    return (
        <div className="col-span-3 flex items-center gap-3 border-b border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mr-2 flex items-center gap-2 border-r border-zinc-200 pr-4 font-semibold dark:border-zinc-800">
                <span className="h-4 w-4 rounded-[3px] bg-zinc-950 dark:bg-zinc-50" />
                <span>Frame</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                    constraint builder
                </span>
            </div>
            <Select
                label="Project"
                value={state.project}
                options={Object.values(projects).map((project) => ({
                    value: project.id,
                    label: project.label,
                }))}
                onChange={(project) => {
                    const ambient = projects[project as keyof typeof projects].ambient;
                    resetOverrides();
                    patchState({
                        project: project as WorkspaceState['project'],
                        persona: defaultPersonaForProject(project),
                        previewMode: ambient.mode as WorkspaceState['previewMode'],
                        density: ambient.density as WorkspaceState['density'],
                        selected: null,
                        screen: projectScreens[project as keyof typeof projects],
                    });
                }}
            />
            <Select
                label="Persona"
                value={state.persona}
                options={personaeForProject(state.project).map((persona) => ({
                    value: persona.id,
                    label: persona.label,
                }))}
                onChange={(persona) =>
                    patchState({ persona: persona as WorkspaceState['persona'] })
                }
            />
            <Segment
                value={state.previewMode}
                options={['light', 'dark']}
                onChange={(previewMode) =>
                    patchState({ previewMode: previewMode as WorkspaceState['previewMode'] })
                }
            />
            <Segment
                value={state.density}
                options={['compact', 'comfortable', 'spacious']}
                onChange={(density) =>
                    patchState({ density: density as WorkspaceState['density'] })
                }
            />
            <div className="ml-auto">
                <Segment
                    value={state.viewMode}
                    options={['screen', 'gallery']}
                    onChange={(viewMode) =>
                        patchState({ viewMode: viewMode as WorkspaceState['viewMode'] })
                    }
                />
            </div>
        </div>
    );
}

function ChatPane({
    history,
    busy,
    selected,
    sendIntent,
}: {
    history: ChatMessage[];
    busy: boolean;
    selected: ComponentResolution | null;
    sendIntent: (intent: string) => void;
}) {
    const [input, setInput] = useState('');
    const examples = [
        'Make warnings feel more urgent',
        'Tighten this for a dense ops view',
        'Soften radius across everything',
        'Make focus states more prominent',
    ];

    function submit(value = input) {
        sendIntent(value);
        setInput('');
    }

    return (
        <section className="row-start-2 flex min-h-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <PaneHead title="Chat / Refinement" meta={history.length ? `${history.length} msg` : 'empty'} />
            <div className="flex-1 space-y-3 overflow-auto p-3">
                {history.length === 0 && (
                    <div className="space-y-2 py-5 text-center text-xs text-zinc-500">
                        <p>Describe intent. The server interpreter proposes semantic deltas.</p>
                        {examples.map((example) => (
                            <button
                                key={example}
                                className="block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-left text-zinc-700 hover:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                                onClick={() => submit(example)}
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                )}
                {history.map((message, index) => (
                    <div
                        key={index}
                        className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                        <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                            {message.role === 'user' ? 'You' : 'Interpreter'}
                        </div>
                        <div className="text-xs leading-5">{message.text}</div>
                        {message.deltas && message.deltas.length > 0 && (
                            <div className="mt-2 space-y-1 border-t border-dashed border-zinc-200 pt-2 font-mono text-[11px] dark:border-zinc-800">
                                {message.deltas.map((delta, deltaIndex) => (
                                    <div key={deltaIndex}>
                                        <span className="text-indigo-500">
                                            {delta.token}: {delta.from} {'->'} {delta.to}
                                        </span>
                                        <span className="ml-1 font-sans text-zinc-500">
                                            {delta.reason}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {message.error && (
                            <div className="mt-2 font-mono text-[11px] text-red-500">
                                {message.error}
                            </div>
                        )}
                    </div>
                ))}
                {busy && (
                    <div className="rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                        Resolving constraints...
                    </div>
                )}
            </div>
            <form
                className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800"
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <textarea
                    className="min-h-16 flex-1 resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-900"
                    placeholder={selected ? `Refine ${selected.label}...` : 'Describe intent...'}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                />
                <button
                    className="inline-flex w-10 items-center justify-center rounded-md bg-indigo-600 text-white disabled:opacity-50"
                    disabled={busy}
                    type="submit"
                >
                    <Send className="h-4 w-4" />
                </button>
            </form>
        </section>
    );
}

function Viewport({
    state,
    resolutions,
    selected,
    select,
}: {
    state: WorkspaceState;
    resolutions: Record<string, ComponentResolution>;
    selected: string | null;
    select: (id: string | null) => void;
}) {
    const pal = palette(state.previewMode, state.project);
    const project = projects[state.project];
    const frameClass =
        state.project === 'fintech'
            ? 'mx-auto max-w-7xl space-y-4'
            : state.project === 'healthcare'
              ? 'mx-auto max-w-6xl space-y-7'
              : 'mx-auto max-w-5xl space-y-5';
    const framePadding =
        state.project === 'fintech' ? 16 : state.project === 'healthcare' ? 32 : 24;

    // In gallery mode, flatten all slots from all regions
    const allSlots = state.screen.regions.flatMap((r) => r.slots);

    return (
        <main
            className="row-start-2 min-h-0 overflow-auto bg-[radial-gradient(circle,theme(colors.zinc.300)_1px,transparent_1px)] bg-[length:18px_18px] p-8 dark:bg-[radial-gradient(circle,theme(colors.zinc.800)_1px,transparent_1px)]"
            onClick={() => select(null)}
        >
            <div className={frameClass} style={{ color: pal.textPrimary }}>
                <div
                    style={{ background: pal.canvas, padding: framePadding }}
                >
                    {state.viewMode === 'screen' && (
                        <div className="mb-5 flex items-end justify-between">
                            <div>
                                <div
                                    className="text-xl font-semibold"
                                    style={{ color: pal.textPrimary }}
                                >
                                    {state.screen.title}
                                </div>
                                <div
                                    className="mt-1 text-xs"
                                    style={{ color: pal.textSecondary }}
                                >
                                    {project.summary} · {project.ambient.domain}
                                </div>
                            </div>
                            <div
                                className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider"
                                style={{
                                    color: pal.textSecondary,
                                    border: `1px solid ${pal.borderVisible}`,
                                }}
                            >
                                surface = {project.ambient.domain}
                            </div>
                        </div>
                    )}

                    {state.viewMode === 'gallery' ? (
                        <div className="grid grid-cols-2 gap-5">
                            {allSlots.map((slot) => (
                                <SlotBlock
                                    key={slot.id}
                                    slot={slot}
                                    resolution={resolutions[slot.id]}
                                    selected={selected === slot.id}
                                    select={select}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {state.screen.regions.map((region) => (
                                <RegionBlock
                                    key={region.id}
                                    region={region}
                                    resolutions={resolutions}
                                    selected={selected}
                                    select={select}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

function RegionBlock({
    region,
    resolutions,
    selected,
    select,
}: {
    region: UIRegion;
    resolutions: Record<string, ComponentResolution>;
    selected: string | null;
    select: (id: string | null) => void;
}) {
    const layoutClass =
        region.layout === 'grid-2'
            ? 'grid grid-cols-2 gap-4'
            : region.layout === 'grid-3'
              ? 'grid grid-cols-3 gap-4'
              : region.layout === 'row'
                ? 'flex flex-wrap items-start gap-4'
                : 'space-y-4';

    return (
        <div className={layoutClass}>
            {region.slots.map((slot) => (
                <SlotBlock
                    key={slot.id}
                    slot={slot}
                    resolution={resolutions[slot.id]}
                    selected={selected === slot.id}
                    select={select}
                />
            ))}
        </div>
    );
}

function SlotBlock({
    slot,
    resolution,
    selected,
    select,
}: {
    slot: UISlot;
    resolution: ComponentResolution;
    selected: boolean;
    select: (id: string) => void;
}) {
    if (!resolution) {
        return null;
    }

    const css = resolution.css;

    return (
        <div
            className="relative cursor-pointer"
            style={{
                outline: selected ? `2px solid ${css.palette.accent}` : '2px solid transparent',
                outlineOffset: 4,
                borderRadius: css.radius + 4,
            }}
            onClick={(event) => {
                event.stopPropagation();
                select(slot.id);
            }}
        >
            {selected && (
                <span
                    className="absolute -top-3 left-3 z-10 rounded px-2 py-0.5 font-mono text-[10px] uppercase text-white"
                    style={{ background: css.palette.accent }}
                >
                    {slot.label}
                </span>
            )}
            {renderSlot(slot, css)}
        </div>
    );
}

function renderSlot(slot: UISlot, css: MaterializedTokens): React.ReactNode {
    const { componentType, data } = slot;

    const common = {
        background: css.surface,
        color: css.text,
        border: `${css.borderWidth}px solid ${css.border}`,
        borderRadius: css.radius,
        boxShadow: css.shadow,
        fontSize: css.fontSize,
    };

    // ── shared legacy components ──────────────────────────────────────────────

    if (componentType === 'table') {
        const headings = (data.headings as string[] | undefined) ?? ['Col A', 'Col B', 'Col C'];
        const rows = (data.rows as string[][] | undefined) ?? [];

        return (
            <div style={common} className="overflow-hidden">
                <table className="w-full border-collapse" style={{ fontSize: css.fontSize }}>
                    <thead style={{ background: css.palette.muted }}>
                        <tr>
                            {headings.map((head) => (
                                <th key={head} className="border-b px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-black/10 last:border-b-0">
                                {row.map((cell, ci) => (
                                    <td key={ci} className="px-3 py-2 font-mono">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (componentType === 'button') {
        return (
            <button
                style={{
                    background: css.palette.accent,
                    color: 'white',
                    borderRadius: css.radius,
                    boxShadow: css.shadow,
                    padding: `${Math.max(css.spacing * 0.6, 6)}px ${css.spacing * 1.4}px`,
                    fontSize: css.fontSize,
                }}
            >
                {String(data.label ?? 'Button')}
            </button>
        );
    }

    if (componentType === 'input') {
        return (
            <label className="block space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: css.palette.textSecondary }}>
                    {String(data.label ?? 'Input')}
                </span>
                <input
                    defaultValue={String(data.value ?? '')}
                    style={{
                        ...common,
                        background: css.palette.canvas,
                        padding: `${Math.max(css.spacing * 0.55, 7)}px ${Math.max(css.spacing, 10)}px`,
                        outline: slot.state === 'focus' ? `3px solid ${css.palette.borderFocus}33` : 'none',
                        width: '100%',
                    }}
                />
            </label>
        );
    }

    if (componentType === 'badge') {
        return (
            <span
                style={{
                    ...common,
                    display: 'inline-flex',
                    gap: 6,
                    alignItems: 'center',
                    padding: `${Math.max(css.spacing * 0.3, 3)}px ${Math.max(css.spacing * 0.9, 10)}px`,
                    fontFamily: 'ui-monospace, monospace',
                    textTransform: 'uppercase',
                }}
            >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: css.border }} />
                {String(data.label ?? 'Badge')}
            </span>
        );
    }

    if (componentType === 'card') {
        return (
            <section
                style={{
                    ...common,
                    padding: Math.max(css.spacing * 1.4, css.spacing + 4),
                }}
                className="space-y-3"
            >
                {data.title && <h3 style={{ fontSize: css.headingSize, fontWeight: 650 }}>{String(data.title)}</h3>}
                {data.body && <p className="leading-6">{String(data.body)}</p>}
            </section>
        );
    }

    if (componentType === 'panel') {
        return (
            <section
                style={{
                    ...common,
                    padding: Math.max(css.spacing * 1.4, css.spacing + 4),
                }}
                className="space-y-3"
            >
                {data.title && <h3 style={{ fontSize: css.headingSize, fontWeight: 650 }}>{String(data.title)}</h3>}
                {data.body && <p className="leading-6">{String(data.body)}</p>}
            </section>
        );
    }

    // ── enterprise domain components ─────────────────────────────────────────

    if (componentType === 'stat-row') {
        const stats = (data.stats as Array<{ label: string; value: number | string; status: string }> | undefined) ?? [];
        const statusBorder = (status: string) => {
            if (status === 'warning') {
return css.palette.borderWarning;
}

            if (status === 'danger') {
return css.palette.borderDanger;
}

            if (status === 'success') {
return css.palette.borderSuccess;
}

            return css.palette.borderVisible;
        };

        return (
            <div style={{ display: 'flex', gap: css.spacing * 1.5, flexWrap: 'wrap' as const }}>
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        style={{
                            padding: css.spacing,
                            borderRadius: css.radius,
                            borderLeft: `3px solid ${statusBorder(stat.status)}`,
                            background: css.surface,
                            border: `${css.borderWidth}px solid ${css.border}`,
                            borderLeftWidth: 3,
                            borderLeftColor: statusBorder(stat.status),
                            minWidth: 90,
                        }}
                    >
                        <div style={{ fontSize: css.headingSize, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>
                            {String(stat.value)}
                        </div>
                        <div style={{ fontSize: css.labelSize, fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, color: css.palette.textMuted, marginTop: 2, letterSpacing: '0.05em' }}>
                            {stat.label}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (componentType === 'exception-queue') {
        const items = (data.items as Array<{ id: string; control: string; status: string; variance: string; owner: string }> | undefined) ?? [];
        const statusBorder = (status: string) => {
            if (status === 'warning') {
return css.palette.borderWarning;
}

            if (status === 'danger') {
return css.palette.borderDanger;
}

            if (status === 'success') {
return css.palette.borderSuccess;
}

            return css.palette.borderVisible;
        };
        const statusColor = (status: string) => {
            if (status === 'warning') {
return css.palette.borderWarning;
}

            if (status === 'danger') {
return css.palette.borderDanger;
}

            if (status === 'success') {
return css.palette.borderSuccess;
}

            return css.palette.textSecondary;
        };

        return (
            <div style={{ ...common, overflow: 'hidden' }}>
                <div style={{ padding: `${css.spacing * 0.6}px ${css.spacing}px`, fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: css.palette.textMuted, borderBottom: `1px solid ${css.palette.borderSubtle}` }}>
                    Exception queue
                </div>
                {items.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 1fr 70px 70px 90px',
                            alignItems: 'center',
                            borderLeft: `3px solid ${statusBorder(item.status)}`,
                            borderBottom: `1px solid ${css.palette.borderSubtle}`,
                            padding: `${css.spacing * 0.5}px ${css.spacing}px`,
                            gap: css.spacing * 0.5,
                        }}
                    >
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.fontSize }}>{item.id}</span>
                        <span style={{ fontSize: css.fontSize }}>{item.control}</span>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, color: statusColor(item.status) }}>{item.status}</span>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.fontSize }}>{item.variance}</span>
                        <span style={{ color: css.palette.textMuted, fontSize: css.labelSize }}>{item.owner}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (componentType === 'audit-trail') {
        const events = (data.events as Array<{ time: string; actor: string; action: string; note: string }> | undefined) ?? [];

        return (
            <div style={{ ...common, padding: css.spacing }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: css.palette.textMuted, marginBottom: css.spacing * 0.75, paddingBottom: css.spacing * 0.5, borderBottom: `1px solid ${css.palette.borderSubtle}` }}>
                    Audit trail
                </div>
                <div style={{ position: 'relative' as const }}>
                    {events.map((event, i) => (
                        <div key={i} style={{ display: 'flex', gap: css.spacing * 0.75, marginBottom: css.spacing * 0.75 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', width: 32 }}>
                                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, color: css.palette.textMuted, whiteSpace: 'nowrap' as const }}>{event.time}</span>
                            </div>
                            <div style={{ borderLeft: `2px solid ${css.palette.borderSubtle}`, paddingLeft: css.spacing * 0.75, flex: 1 }}>
                                <div style={{ fontWeight: 600, fontSize: css.fontSize, color: css.palette.accent }}>{event.actor}</div>
                                <div style={{ fontSize: css.fontSize, color: css.text }}>{event.action}</div>
                                <div style={{ fontSize: css.labelSize, color: css.palette.textMuted, marginTop: 2 }}>{event.note}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (componentType === 'approval-chain') {
        const steps = (data.steps as string[] | undefined) ?? [];
        const current = (data.current as number | undefined) ?? 0;

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'nowrap' as const }}>
                {steps.map((step, i) => {
                    const isActive = i === current;
                    const isDone = i < current;

                    return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                padding: `${css.spacing * 0.4}px ${css.spacing}px`,
                                borderRadius: css.radius,
                                background: isActive ? css.palette.accent : isDone ? css.palette.success : css.surface,
                                color: isActive ? 'white' : isDone ? css.palette.textSecondary : css.palette.textMuted,
                                border: `${css.borderWidth}px solid ${isActive ? css.palette.accent : css.border}`,
                                fontSize: css.fontSize,
                                fontWeight: isActive ? 600 : 400,
                                whiteSpace: 'nowrap' as const,
                            }}>
                                {isDone && <span style={{ marginRight: 4 }}>✓</span>}
                                {step}
                            </div>
                            {i < steps.length - 1 && (
                                <div style={{ width: 24, height: 1, background: css.border, flexShrink: 0 }} />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // ── healthcare domain components ──────────────────────────────────────────

    if (componentType === 'patient-summary') {
        const alerts = (data.alerts as string[] | undefined) ?? [];

        return (
            <div style={{ ...common, padding: Math.max(css.spacing * 2, css.spacing + 12) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: css.spacing }}>
                    <div>
                        <div style={{ fontSize: css.headingSize * 1.2, fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: css.text }}>
                            {String(data.id ?? 'PT-0000')}
                        </div>
                        <div style={{ fontSize: css.fontSize, color: css.palette.textSecondary, marginTop: 4 }}>
                            Age {String(data.age ?? '—')} · {String(data.ward ?? '—')}
                        </div>
                        <div style={{ fontSize: css.labelSize, color: css.palette.textMuted, marginTop: 2 }}>
                            Attending: {String(data.attending ?? '—')}
                        </div>
                    </div>
                </div>
                {alerts.length > 0 && (
                    <div style={{ display: 'flex', gap: css.spacing * 0.5, flexWrap: 'wrap' as const, marginTop: css.spacing * 0.75 }}>
                        {alerts.map((alert, i) => (
                            <span key={i} style={{
                                padding: `${css.spacing * 0.3}px ${css.spacing * 0.75}px`,
                                borderRadius: css.radius,
                                background: css.palette.warning,
                                border: `1px solid ${css.palette.borderWarning}`,
                                fontSize: css.labelSize,
                                fontFamily: 'ui-monospace, monospace',
                                color: css.text,
                            }}>{alert}</span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (componentType === 'medication-list') {
        const items = (data.items as Array<{ name: string; status: string; note: string }> | undefined) ?? [];
        const statusBorder = (status: string) => {
            if (status === 'warning') {
return css.palette.borderWarning;
}

            if (status === 'danger') {
return css.palette.borderDanger;
}

            if (status === 'success') {
return css.palette.borderSuccess;
}

            return css.palette.borderVisible;
        };

        return (
            <div style={{ ...common, overflow: 'hidden' }}>
                <div style={{ padding: `${css.spacing * 0.6}px ${css.spacing}px`, fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: css.palette.textMuted, borderBottom: `1px solid ${css.palette.borderSubtle}` }}>
                    Medications
                </div>
                {items.map((item, i) => (
                    <div
                        key={i}
                        style={{
                            borderLeft: `3px solid ${statusBorder(item.status)}`,
                            borderBottom: `1px solid ${css.palette.borderSubtle}`,
                            padding: `${css.spacing * 0.75}px ${css.spacing}px`,
                        }}
                    >
                        <div style={{ fontSize: css.fontSize, fontWeight: 500, color: css.text }}>{item.name}</div>
                        <div style={{ fontSize: css.labelSize, color: css.palette.textMuted, marginTop: 2 }}>{item.note}</div>
                    </div>
                ))}
            </div>
        );
    }

    if (componentType === 'care-timeline') {
        const events = (data.events as Array<{ time: string; type: string; text: string }> | undefined) ?? [];
        const dotColor = (type: string) => {
            if (type === 'warning') {
return css.palette.borderWarning;
}

            if (type === 'danger') {
return css.palette.borderDanger;
}

            if (type === 'success') {
return css.palette.borderSuccess;
}

            return css.palette.borderVisible;
        };

        return (
            <div style={{ ...common, padding: css.spacing }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: css.palette.textMuted, marginBottom: css.spacing * 0.75, paddingBottom: css.spacing * 0.5, borderBottom: `1px solid ${css.palette.borderSubtle}` }}>
                    Care timeline
                </div>
                <div style={{ position: 'relative' as const, paddingLeft: 20 }}>
                    {events.map((event, i) => (
                        <div key={i} style={{ position: 'relative' as const, marginBottom: css.spacing * 0.75, paddingLeft: css.spacing * 0.5 }}>
                            <div style={{
                                position: 'absolute' as const,
                                left: -14,
                                top: 4,
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: dotColor(event.type),
                            }} />
                            {i < events.length - 1 && (
                                <div style={{
                                    position: 'absolute' as const,
                                    left: -11,
                                    top: 14,
                                    width: 2,
                                    height: `calc(100% + ${css.spacing * 0.75}px)`,
                                    background: css.palette.borderSubtle,
                                }} />
                            )}
                            <div style={{ fontSize: css.fontSize, color: css.text }}>{event.text}</div>
                            <div style={{ fontSize: css.labelSize, fontFamily: 'ui-monospace, monospace', color: css.palette.textMuted, marginTop: 2 }}>{event.time}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (componentType === 'vitals-bar') {
        const readings = (data.readings as Array<{ label: string; value: string; status: string }> | undefined) ?? [];
        const vitalBg = (status: string) => {
            if (status === 'warning') {
return css.palette.warning;
}

            if (status === 'danger') {
return css.palette.danger;
}

            if (status === 'success') {
return css.palette.success;
}

            return css.surface;
        };
        const vitalBorder = (status: string) => {
            if (status === 'warning') {
return css.palette.borderWarning;
}

            if (status === 'danger') {
return css.palette.borderDanger;
}

            if (status === 'success') {
return css.palette.borderSuccess;
}

            return css.border;
        };

        return (
            <div style={{ display: 'flex', gap: css.spacing, flexWrap: 'wrap' as const }}>
                {readings.map((reading, i) => (
                    <div
                        key={i}
                        style={{
                            padding: css.spacing,
                            borderRadius: css.radius,
                            background: vitalBg(reading.status),
                            border: `${css.borderWidth}px solid ${vitalBorder(reading.status)}`,
                            minWidth: 80,
                            textAlign: 'center' as const,
                        }}
                    >
                        <div style={{ fontSize: css.headingSize, fontWeight: 700, fontFamily: 'ui-monospace, monospace', color: css.text }}>
                            {reading.value}
                        </div>
                        <div style={{ fontSize: css.labelSize, fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase' as const, color: css.palette.textMuted, marginTop: 2, letterSpacing: '0.05em' }}>
                            {reading.label}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // ── fintech domain components ─────────────────────────────────────────────

    if (componentType === 'position-grid') {
        const rows = (data.rows as Array<{ id: string; book: string; signal: string; pnl: string; move: string; desk: string }> | undefined) ?? [];
        const signalColor = (signal: string) => {
            if (signal === 'warning') {
return css.palette.borderWarning;
}

            if (signal === 'danger') {
return css.palette.borderDanger;
}

            if (signal === 'success') {
return css.palette.borderSuccess;
}

            return css.palette.textSecondary;
        };
        const pnlColor = (pnl: string) => pnl.startsWith('+') ? css.palette.borderSuccess : pnl.startsWith('-') ? css.palette.borderDanger : css.text;
        const compactFontSize = Math.max(css.fontSize - 1, 10.5);

        return (
            <div style={{ ...common, overflow: 'hidden' }}>
                <table className="w-full border-collapse" style={{ fontSize: compactFontSize }}>
                    <thead style={{ background: css.palette.muted }}>
                        <tr>
                            {['Symbol', 'Book', 'Signal', 'P&L', 'Move', 'Desk'].map((h) => (
                                <th key={h} className="border-b px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-wider" style={{ color: css.palette.textMuted }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${css.palette.borderSubtle}` }}>
                                <td style={{ padding: '3px 8px', fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>{row.id}</td>
                                <td style={{ padding: '3px 8px', color: css.palette.textSecondary }}>{row.book}</td>
                                <td style={{ padding: '3px 8px' }}>
                                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, color: signalColor(row.signal) }}>{row.signal}</span>
                                </td>
                                <td style={{ padding: '3px 8px', fontFamily: 'ui-monospace, monospace', color: pnlColor(row.pnl) }}>{row.pnl}</td>
                                <td style={{ padding: '3px 8px', fontFamily: 'ui-monospace, monospace', color: pnlColor(row.move) }}>{row.move}</td>
                                <td style={{ padding: '3px 8px', fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, color: css.palette.textMuted }}>{row.desk}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (componentType === 'metric-ticker') {
        const status = String(data.status ?? 'default');
        const deltaColor = status === 'success' ? css.palette.borderSuccess : status === 'warning' ? css.palette.borderWarning : status === 'danger' ? css.palette.borderDanger : css.palette.textSecondary;

        return (
            <div style={{ ...common, padding: css.spacing, minWidth: 100 }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: css.palette.textMuted }}>
                    {String(data.label ?? '—')}
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.fontSize * 1.8, fontWeight: 700, color: css.text, marginTop: 4, lineHeight: 1 }}>
                    {String(data.value ?? '—')}
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, color: deltaColor, marginTop: 4 }}>
                    {String(data.delta ?? '—')}
                </div>
            </div>
        );
    }

    if (componentType === 'risk-gauge') {
        const value = Number(data.value ?? 0);
        const threshold = Number(data.threshold ?? 100);
        const fillColor = value >= threshold
            ? css.palette.borderDanger
            : value >= threshold * 0.8
              ? css.palette.borderWarning
              : css.palette.borderSuccess;

        return (
            <div style={{ ...common, padding: css.spacing }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: css.spacing * 0.5 }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: css.palette.textMuted }}>{String(data.label ?? '—')}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.fontSize, fontWeight: 700 }}>{value}%</span>
                </div>
                <div style={{ position: 'relative' as const, height: 10, background: css.palette.muted, borderRadius: css.radius }}>
                    <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: fillColor, borderRadius: css.radius, transition: 'width 0.3s' }} />
                    <div style={{ position: 'absolute' as const, top: -2, left: `${threshold}%`, width: 2, height: 14, background: css.palette.borderDanger, borderRadius: 1 }} />
                </div>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, color: css.palette.textMuted, marginTop: 4 }}>
                    limit {threshold}%
                </div>
            </div>
        );
    }

    if (componentType === 'order-entry') {
        const side = String(data.side ?? 'buy');
        const btnBg = side === 'sell' ? css.palette.borderDanger : css.palette.borderSuccess;
        const fields: Array<[string, string]> = [
            ['Symbol', String(data.symbol ?? '—')],
            ['Side', side],
            ['Quantity', String(data.quantity ?? '0')],
            ['Type', String(data.type ?? 'limit')],
            ['Price', String(data.price ?? '0.00')],
        ];
        const inputStyle = {
            background: css.palette.canvas,
            border: `${css.borderWidth}px solid ${css.border}`,
            borderRadius: css.radius,
            fontFamily: 'ui-monospace, monospace',
            fontSize: css.fontSize,
            padding: `${css.spacing * 0.4}px ${css.spacing * 0.6}px`,
            width: '100%',
            color: css.text,
        };

        return (
            <div style={{ ...common, padding: css.spacing }}>
                <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: css.palette.textMuted, marginBottom: css.spacing * 0.75, paddingBottom: css.spacing * 0.5, borderBottom: `1px solid ${css.palette.borderSubtle}` }}>
                    Order entry
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: css.spacing * 0.5, marginBottom: css.spacing * 0.75 }}>
                    {fields.map(([label, value]) => (
                        <div key={label}>
                            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, textTransform: 'uppercase' as const, color: css.palette.textMuted, marginBottom: 2 }}>{label}</div>
                            <input defaultValue={value} style={inputStyle} readOnly />
                        </div>
                    ))}
                </div>
                <button style={{
                    width: '100%',
                    padding: `${css.spacing * 0.5}px`,
                    background: btnBg,
                    color: 'white',
                    borderRadius: css.radius,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: css.fontSize,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                }}>
                    Stage {side} · {String(data.symbol ?? '—')}
                </button>
            </div>
        );
    }

    // fallback
    return (
        <div style={{ ...common, padding: css.spacing }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: css.labelSize, color: css.palette.textMuted }}>{componentType}</span>
        </div>
    );
}

function TracePane({
    selected,
    project,
    persona,
}: {
    selected: ComponentResolution | null;
    project: (typeof projects)[keyof typeof projects];
    persona: (typeof personae)[keyof typeof personae];
}) {
    return (
        <aside className="row-start-2 min-h-0 border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <PaneHead title="Constraint trace" meta={selected?.label ?? 'unselected'} />
            <div className="space-y-3 overflow-auto p-3">
                <TraceCard title="Project ambient" meta={project.id}>
                    <pre className="text-[11px] leading-5">{JSON.stringify(project.ambient, null, 2)}</pre>
                </TraceCard>
                <TraceCard title={`Persona · ${persona.label}`}>
                    <div className="space-y-1 font-mono text-[11px]">
                        {persona.derived.map(([constraint, value, reason]) => (
                            <div key={constraint} className="grid grid-cols-[76px_1fr] gap-2">
                                <span className="text-zinc-500">{constraint}</span>
                                <span>
                                    {value}{' '}
                                    <span className="font-sans text-zinc-500">{reason}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </TraceCard>
                {!selected ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                        Select a component in the viewport to inspect resolution.
                    </div>
                ) : (
                    <TraceCard title={`Resolved · ${selected.label}`} meta={`${Object.keys(selected.resolved.tokens).length} tokens`}>
                        <div className="space-y-2">
                            {Object.entries(selected.resolved.tokens).map(([token, info]) => (
                                <details key={token} className="rounded-md bg-zinc-100 p-2 dark:bg-zinc-900">
                                    <summary className="cursor-pointer font-mono text-[11px]">
                                        <span className="text-zinc-500">{token}</span>
                                        <span className="float-right">{String(info?.value)}</span>
                                    </summary>
                                    {info && (
                                        <div className="mt-2 space-y-2 text-xs">
                                            <div>
                                                <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-[10px] uppercase dark:bg-zinc-800">
                                                    {info.rule.layer}
                                                </span>{' '}
                                                {info.rule.reason}
                                            </div>
                                            {info.overridden.length > 0 && (
                                                <div className="border-t border-dashed border-zinc-300 pt-2 font-mono text-[11px] text-zinc-500 dark:border-zinc-700">
                                                    {info.overridden.slice(0, 4).map((rule) => (
                                                        <div key={rule.id}>
                                                            {rule.layer}: {String(rule.value)} - {rule.reason}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </details>
                            ))}
                        </div>
                    </TraceCard>
                )}
            </div>
        </aside>
    );
}

function Inspector({
    selected,
    overrides,
    setOverride,
}: {
    selected: ComponentResolution | null;
    overrides: Overrides;
    setOverride: (token: TokenName, value: TokenValue | undefined) => void;
}) {
    return (
        <footer className="col-span-3 row-start-3 min-h-0 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <PaneHead
                title="Token / rule inspector"
                meta={selected ? `${selected.label} · ${Object.keys(overrides).length} overrides` : 'nothing selected'}
            />
            {!selected ? (
                <div className="p-5 text-xs text-zinc-500">Click a component to inspect tokens and edit overrides.</div>
            ) : (
                <div className="grid h-[170px] grid-cols-3 overflow-hidden text-xs">
                    <InspectorColumn title="Resolved tokens">
                        {Object.entries(selected.resolved.tokens).map(([token, info]) => (
                            <TokenRow key={token} label={token} value={String(info?.value)} meta={info?.rule.layer} />
                        ))}
                    </InspectorColumn>
                    <InspectorColumn title="Overrides">
                        {(Object.entries(tokenOptions) as [TokenName, TokenValue[]][]).map(([token, options]) => (
                            <div key={token} className="grid grid-cols-[104px_1fr] items-center gap-2 border-b border-dashed border-zinc-200 py-1 dark:border-zinc-800">
                                <span className="font-mono text-[11px] text-zinc-500">{token}</span>
                                <select
                                    className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-950"
                                    value={overrides[token] === undefined ? '' : String(overrides[token])}
                                    onChange={(event) => {
                                        const raw = event.target.value;
                                        setOverride(token, raw === '' ? undefined : token === 'elevation' ? Number(raw) : raw);
                                    }}
                                >
                                    <option value="">inherit</option>
                                    {options.map((option) => (
                                        <option key={String(option)} value={String(option)}>
                                            {String(option)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </InspectorColumn>
                    <InspectorColumn title="Resolution context">
                        <pre className="font-mono text-[11px] leading-5">{JSON.stringify(selected.ctx, null, 2)}</pre>
                    </InspectorColumn>
                </div>
            )}
        </footer>
    );
}

function Select({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}) {
    return (
        <label className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">{label}</span>
            <select
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-950"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function Segment({
    value,
    options,
    onChange,
}: {
    value: string;
    options: string[];
    onChange: (value: string) => void;
}) {
    return (
        <div className="inline-flex rounded-md bg-zinc-100 p-0.5 dark:bg-zinc-800">
            {options.map((option) => (
                <button
                    key={option}
                    className={`rounded px-2.5 py-1 text-xs font-medium ${value === option ? 'bg-white shadow-sm dark:bg-zinc-950' : 'text-zinc-500'}`}
                    onClick={() => onChange(option)}
                    type="button"
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

function PaneHead({ title, meta }: { title: string; meta?: string }) {
    return (
        <div className="flex h-8 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-3 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <span>{title}</span>
            {meta && <span>{meta}</span>}
        </div>
    );
}

function TraceCard({
    title,
    meta,
    children,
}: {
    title: string;
    meta?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
                <span>{title}</span>
                {meta && <span>{meta}</span>}
            </div>
            <div className="p-3">{children}</div>
        </section>
    );
}

function InspectorColumn({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="overflow-auto border-r border-zinc-200 p-3 last:border-r-0 dark:border-zinc-800">
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                {title}
            </h3>
            {children}
        </div>
    );
}

function TokenRow({ label, value, meta }: { label: string; value: string; meta?: string }) {
    return (
        <div className="grid grid-cols-[104px_1fr_auto] gap-2 border-b border-dashed border-zinc-200 py-1 font-mono text-[11px] dark:border-zinc-800">
            <span className="text-zinc-500">{label}</span>
            <span>{value}</span>
            {meta && (
                <span className="rounded bg-zinc-100 px-1.5 text-[10px] uppercase dark:bg-zinc-800">
                    {meta}
                </span>
            )}
        </div>
    );
}

function buildResolutions(
    state: WorkspaceState,
    rules: Rule[],
    overrides: Record<string, Overrides>,
) {
    const baseCtx = {
        mode: state.previewMode,
        density: state.density,
        project: state.project,
        persona: state.persona,
    };

    const slots = state.screen.regions.flatMap((r) => r.slots);

    return Object.fromEntries(
        slots.map((slot) => {
            const ctx: ConstraintContext = {
                ...baseCtx,
                component: componentTypeToContext(slot.componentType),
                surface: slot.surface,
                state: slot.state,
            };
            const resolved = resolve(rules, ctx, {
                ...(overrides['*'] ?? {}),
                ...(overrides[slot.id] ?? {}),
            });
            const css = materialize(resolved, ctx);

            return [
                slot.id,
                {
                    id: slot.id,
                    label: slot.label,
                    ctx,
                    resolved,
                    css,
                    overrides: overrides[slot.id] ?? {},
                },
            ];
        }),
    ) as Record<string, ComponentResolution>;
}
