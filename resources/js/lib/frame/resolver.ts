import type { ConstraintContext, Overrides, Resolution, Rule } from './types';
import type { ResolvedToken, TokenName } from './types';

const precedence = {
    base: 1,
    theme: 2,
    project: 3,
    persona: 4,
    context: 5,
    component: 6,
    state: 7,
    override: 8,
} as const;

function matches(rule: Rule, ctx: ConstraintContext): boolean {
    if (!rule.when) {
        return true;
    }

    return Object.entries(rule.when).every(([key, value]) => {
        const actual = ctx[key as keyof ConstraintContext];

        return Array.isArray(value)
            ? value.includes(actual as never)
            : actual === value;
    });
}

export function resolve(
    rules: Rule[],
    ctx: ConstraintContext,
    overrides: Overrides = {},
): Resolution {
    const tokens: Partial<Record<TokenName, ResolvedToken & { prec: number }>> = {};
    const applied: Rule[] = [];
    const ignored: Rule[] = [];

    for (const rule of rules) {
        if (!matches(rule, ctx)) {
            ignored.push(rule);
            continue;
        }

        applied.push(rule);

        const current = tokens[rule.token];
        const prec = precedence[rule.layer];

        if (!current) {
            tokens[rule.token] = {
                value: rule.value,
                rule,
                overridden: [],
                prec,
            };
            continue;
        }

        if (prec >= current.prec) {
            current.overridden.unshift(current.rule);
            current.value = rule.value;
            current.rule = rule;
            current.prec = prec;
        } else {
            current.overridden.push(rule);
        }
    }

    for (const [token, value] of Object.entries(overrides)) {
        if (value === undefined) {
            continue;
        }

        const rule: Rule = {
            id: `override:${token}`,
            layer: 'override',
            token: token as Rule['token'],
            value,
            reason: 'explicit user override from inspector or interpreter',
        };
        const tokenName = token as TokenName;
        const current = tokens[tokenName];

        if (current) {
            current.overridden.unshift(current.rule);
            current.value = value;
            current.rule = rule;
            current.prec = precedence.override;
        } else {
            tokens[tokenName] = {
                value,
                rule,
                overridden: [],
                prec: precedence.override,
            };
        }

        applied.push(rule);
    }

    return {
        tokens: Object.fromEntries(
            Object.entries(tokens).map(([key, value]) => [
                key,
                {
                    value: value.value,
                    rule: value.rule,
                    overridden: value.overridden,
                },
            ]),
        ) as Resolution['tokens'],
        applied,
        ignored,
    };
}
