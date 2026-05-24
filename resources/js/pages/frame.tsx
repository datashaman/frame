import { Head } from '@inertiajs/react';
import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { materialize, palette } from '@/lib/frame/materializer';
import {
    buildRuleset,
    defaultPersonaForProject,
    personae,
    personaeForProject,
    projects,
    validPersonaForProject,
} from '@/lib/frame/presets';
import { resolve } from '@/lib/frame/resolver';
import type {
    ComponentResolution,
    ConstraintContext,
    InterpreterResponse,
    Overrides,
    Rule,
    TokenName,
    TokenValue,
} from '@/lib/frame/types';

type WorkspaceState = {
    project: keyof typeof projects;
    persona: keyof typeof personae;
    previewMode: 'light' | 'dark';
    density: 'compact' | 'comfortable' | 'spacious';
    viewMode: 'screen' | 'gallery';
    selected: string | null;
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
                <Topbar state={state} patchState={patchState} />
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
}: {
    state: WorkspaceState;
    patchState: (patch: Partial<WorkspaceState>) => void;
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
                    patchState({
                        project: project as WorkspaceState['project'],
                        persona: defaultPersonaForProject(project),
                        previewMode: ambient.mode as WorkspaceState['previewMode'],
                        density: ambient.density as WorkspaceState['density'],
                        selected: null,
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
    const items = getPreviewItems(state.project, state.viewMode);
    const project = projects[state.project];
    const frameClass =
        state.project === 'fintech'
            ? 'mx-auto max-w-7xl space-y-4'
            : state.project === 'healthcare'
              ? 'mx-auto max-w-6xl space-y-7'
              : 'mx-auto max-w-5xl space-y-5';
    const framePadding =
        state.project === 'fintech' ? 16 : state.project === 'healthcare' ? 32 : 24;

    return (
        <main
            className="row-start-2 min-h-0 overflow-auto bg-[radial-gradient(circle,theme(colors.zinc.300)_1px,transparent_1px)] bg-[length:18px_18px] p-8 dark:bg-[radial-gradient(circle,theme(colors.zinc.800)_1px,transparent_1px)]"
            onClick={() => select(null)}
        >
            <div className={frameClass} style={{ color: pal.textPrimary }}>
                <div
                    className={state.viewMode === 'gallery' ? 'grid grid-cols-2 gap-5' : 'space-y-5'}
                    style={{ background: pal.canvas, padding: framePadding }}
                >
                    {state.viewMode === 'screen' && (
                        <div className="flex items-end justify-between">
                            <div>
                                <div
                                    className="text-xl font-semibold"
                                    style={{ color: pal.textPrimary }}
                                >
                                    {project.label}
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
                    {state.viewMode === 'gallery'
                        ? items.map((item) => (
                              <PreviewBlock
                                  key={item.id}
                                  item={item}
                                  resolution={resolutions[item.id]}
                                  selected={selected === item.id}
                                  select={select}
                              />
                          ))
                        : renderProjectScreen(state.project, items, resolutions, selected, select)}
                </div>
            </div>
        </main>
    );
}

function PreviewBlock({
    item,
    resolution,
    selected,
    select,
}: {
    item: PreviewItem;
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
                select(item.id);
            }}
        >
            {selected && (
                <span
                    className="absolute -top-3 left-3 z-10 rounded px-2 py-0.5 font-mono text-[10px] uppercase text-white"
                    style={{ background: css.palette.accent }}
                >
                    {item.label}
                </span>
            )}
            {renderPreviewItem(item, css)}
        </div>
    );
}

function renderProjectScreen(
    project: keyof typeof projects,
    items: PreviewItem[],
    resolutions: Record<string, ComponentResolution>,
    selected: string | null,
    select: (id: string) => void,
) {
    const byComponent = (component: PreviewItem['component']) =>
        items.find((item) => item.component === component);
    const byLabel = (label: string) => items.find((item) => item.label === label);
    const block = (item: PreviewItem | undefined) =>
        item ? (
            <PreviewBlock
                key={item.id}
                item={item}
                resolution={resolutions[item.id]}
                selected={selected === item.id}
                select={select}
            />
        ) : null;

    if (project === 'healthcare') {
        return (
            <div className="space-y-7">
                {block(byComponent('card'))}
                <div className="grid grid-cols-[1fr_auto] items-end gap-5">
                    {block(byComponent('input'))}
                    {block(byComponent('badge'))}
                </div>
                <div className="grid grid-cols-[0.95fr_1.05fr] gap-7">
                    {block(byComponent('panel'))}
                    {block(byComponent('table'))}
                </div>
                <div>{block(byComponent('button'))}</div>
            </div>
        );
    }

    if (project === 'fintech') {
        return (
            <div className="space-y-3">
                {block(byComponent('table'))}
                <div className="grid grid-cols-[1fr_auto_auto] items-start gap-3">
                    {block(byComponent('badge'))}
                    {block(byComponent('input'))}
                    {block(byComponent('button'))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {block(byComponent('card'))}
                    {block(byComponent('panel'))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {block(byComponent('table'))}
            <div className="grid grid-cols-[1.25fr_0.75fr] gap-5">
                {block(byComponent('card'))}
                {block(byComponent('panel'))}
            </div>
            <div className="flex items-center gap-4">
                {block(byComponent('button'))}
                {block(byComponent('input'))}
                {block(byLabel('Drift badge') ?? byComponent('badge'))}
            </div>
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

type PreviewItem = {
    id: string;
    label: string;
    component: NonNullable<ConstraintContext['component']>;
    surface?: ConstraintContext['surface'];
    state?: ConstraintContext['state'];
    title?: string;
    body?: string;
    inputLabel?: string;
    inputValue?: string;
    tableHeadings?: string[];
    tableRows?: string[][];
    emphasis?: 'clinical' | 'compact';
};

const projectItems: Record<keyof typeof projects, PreviewItem[]> = {
    enterprise: [
        {
            id: 'compliance-alerts-table',
            label: 'Exception register',
            component: 'table',
            surface: 'data',
            tableHeadings: ['Case', 'Control', 'Status', 'Variance', 'Owner'],
            tableRows: [
                ['ALR-0418', 'Risk score drift', 'warning', '+4.2s', 'a.kapoor'],
                ['ALR-0419', 'Latency budget', 'danger', '-18%', 's.olu'],
                ['ALR-0420', 'Throughput', 'success', '+2.1%', 'r.tan'],
            ],
        },
        {
            id: 'compliance-detail-card',
            label: 'Exception detail',
            component: 'card',
            state: 'warning',
            title: 'ALR-0418 · Risk score drift',
            body: 'Portfolio R-114 moved outside the approved tolerance band. The reviewer must capture evidence before acknowledgement.',
        },
        {
            id: 'compliance-review-panel',
            label: 'Evidence panel',
            component: 'panel',
            surface: 'form',
            title: 'Reviewer evidence',
            body: 'Attach the control note and policy exception reference.',
        },
        {
            id: 'compliance-primary-button',
            label: 'Acknowledge button',
            component: 'button',
            body: 'Acknowledge',
        },
        {
            id: 'compliance-asset-input',
            label: 'Case input',
            component: 'input',
            surface: 'form',
            state: 'focus',
            inputLabel: 'Case ID',
            inputValue: 'ALR-0418',
        },
        {
            id: 'compliance-status-badge',
            label: 'Drift badge',
            component: 'badge',
            state: 'warning',
            body: 'Drift',
        },
    ],
    healthcare: [
        {
            id: 'healthcare-chart-table',
            label: 'Patient worklist',
            component: 'table',
            surface: 'data',
            tableHeadings: ['Patient', 'Chart area', 'Status', 'Due', 'Clinician'],
            tableRows: [
                ['PT-2048', 'Medication reconciliation', 'warning', '14m', 'n.patel'],
                ['PT-2091', 'Discharge summary', 'danger', 'overdue', 'r.chen'],
                ['PT-2110', 'Lab follow-up', 'success', 'done', 'm.ortiz'],
            ],
        },
        {
            id: 'healthcare-chart-card',
            label: 'Patient chart card',
            component: 'card',
            state: 'warning',
            title: 'PT-2048 · Medication reconciliation',
            body: 'A new allergy note conflicts with the active prescription list. Clinical review is required before discharge.',
            emphasis: 'clinical',
        },
        {
            id: 'healthcare-care-panel',
            label: 'Care note panel',
            component: 'panel',
            surface: 'form',
            title: 'Care coordination note',
            body: 'Record follow-up context for the attending clinician and ward coordinator.',
        },
        {
            id: 'healthcare-primary-button',
            label: 'Escalate button',
            component: 'button',
            body: 'Escalate',
        },
        {
            id: 'healthcare-patient-input',
            label: 'Patient input',
            component: 'input',
            surface: 'form',
            state: 'focus',
            inputLabel: 'Patient ID',
            inputValue: 'PT-2048',
        },
        {
            id: 'healthcare-status-badge',
            label: 'Clinical review badge',
            component: 'badge',
            state: 'warning',
            body: 'Review',
        },
    ],
    fintech: [
        {
            id: 'fintech-market-table',
            label: 'Exposure grid',
            component: 'table',
            surface: 'data',
            emphasis: 'compact',
            tableHeadings: ['Symbol', 'Book', 'Signal', 'Move', 'Desk'],
            tableRows: [
                ['NVDA', 'Growth tech', 'warning', '+3.8%', 'alpha'],
                ['EURUSD', 'Macro hedge', 'danger', '-1.4%', 'fx'],
                ['UST10Y', 'Rates', 'success', '+7bp', 'rates'],
            ],
        },
        {
            id: 'fintech-exposure-card',
            label: 'Exposure card',
            component: 'card',
            state: 'warning',
            title: 'NVDA · Concentration drift',
            body: 'Intraday exposure crossed the desk limit after correlated momentum signals moved together.',
            emphasis: 'compact',
        },
        {
            id: 'fintech-order-panel',
            label: 'Desk action panel',
            component: 'panel',
            surface: 'form',
            title: 'Trade desk action',
            body: 'Capture the hedge action and link it to the current limit exception.',
        },
        {
            id: 'fintech-primary-button',
            label: 'Hedge button',
            component: 'button',
            body: 'Stage hedge',
        },
        {
            id: 'fintech-symbol-input',
            label: 'Symbol input',
            component: 'input',
            surface: 'form',
            state: 'focus',
            inputLabel: 'Symbol',
            inputValue: 'NVDA',
        },
        {
            id: 'fintech-status-badge',
            label: 'Limit badge',
            component: 'badge',
            state: 'warning',
            body: 'Limit',
        },
    ],
};

const galleryExtras: PreviewItem[] = [
    {
        id: 'gallery-success-badge',
        label: 'Success badge',
        component: 'badge',
        state: 'success',
        body: 'Cleared',
    },
    {
        id: 'gallery-danger-card',
        label: 'Danger card',
        component: 'card',
        state: 'danger',
        title: 'Critical exception',
        body: 'The active workflow has breached its configured threshold.',
    },
];

function getPreviewItems(project: keyof typeof projects, viewMode: WorkspaceState['viewMode']) {
    const items = projectItems[project] ?? projectItems.enterprise;

    return viewMode === 'gallery' ? [...items, ...galleryExtras] : items;
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
    const items = getPreviewItems(state.project, state.viewMode);

    return Object.fromEntries(
        items.map((item) => {
            const ctx: ConstraintContext = {
                ...baseCtx,
                component: item.component,
                surface: item.surface,
                state: item.state,
            };
            const resolved = resolve(rules, ctx, {
                ...(overrides['*'] ?? {}),
                ...(overrides[item.id] ?? {}),
            });
            const css = materialize(resolved, ctx);

            return [
                item.id,
                {
                    id: item.id,
                    label: item.label,
                    ctx,
                    resolved,
                    css,
                    overrides: overrides[item.id] ?? {},
                },
            ];
        }),
    ) as Record<string, ComponentResolution>;
}

function renderPreviewItem(item: PreviewItem, css: ComponentResolution['css']) {
    const common = {
        background: css.surface,
        color: css.text,
        border: `${css.borderWidth}px solid ${css.border}`,
        borderRadius: css.radius,
        boxShadow: css.shadow,
        fontSize: css.fontSize,
    };

    if (item.component === 'table') {
        return (
            <div style={common} className="overflow-hidden">
                <table
                    className="w-full border-collapse"
                    style={{
                        fontSize:
                            item.emphasis === 'compact'
                                ? Math.max(css.fontSize - 1.5, 10.5)
                                : css.fontSize,
                    }}
                >
                    <thead style={{ background: css.palette.muted }}>
                        <tr>
                            {(item.tableHeadings ?? ['ID', 'Subject', 'Status', 'Delta', 'Owner']).map((head) => (
                                <th key={head} className="border-b px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                                    {head}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(item.tableRows ?? []).map((row) => (
                            <tr key={row.join(':')} className="border-b border-black/10 last:border-b-0">
                                {row.map((cell, index) => (
                                    <td
                                        key={`${cell}-${index}`}
                                        className={`${item.emphasis === 'compact' ? 'px-2 py-1.5' : 'px-3 py-2'} ${index === 0 || index > 1 ? 'font-mono' : ''} ${index === 2 ? 'font-mono uppercase' : ''}`}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (item.component === 'button') {
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
                {item.body ?? 'Button'}
            </button>
        );
    }

    if (item.component === 'input') {
        return (
            <label className="block space-y-1">
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: css.palette.textSecondary }}>{item.inputLabel ?? 'Asset ID'}</span>
                <input
                    defaultValue={item.inputValue ?? 'R-114'}
                    style={{
                        ...common,
                        background: css.palette.canvas,
                        padding: `${Math.max(css.spacing * 0.55, 7)}px ${Math.max(css.spacing, 10)}px`,
                        outline: item.state === 'focus' ? `3px solid ${css.palette.borderFocus}33` : 'none',
                        width: '100%',
                    }}
                />
            </label>
        );
    }

    if (item.component === 'badge') {
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
                {item.body ?? 'Badge'}
            </span>
        );
    }

    return (
        <section
            style={{
                ...common,
                padding:
                    item.emphasis === 'clinical'
                        ? Math.max(css.spacing * 2, css.spacing + 12)
                        : item.emphasis === 'compact'
                          ? Math.max(css.spacing, 8)
                          : Math.max(css.spacing * 1.4, css.spacing + 4),
            }}
            className={item.emphasis === 'clinical' ? 'space-y-5' : 'space-y-3'}
        >
            {item.title && <h3 style={{ fontSize: css.headingSize, fontWeight: 650 }}>{item.title}</h3>}
            {item.body && <p className="leading-6">{item.body}</p>}
        </section>
    );
}
