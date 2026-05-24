import type { ConstraintContext, MaterializedTokens, Resolution } from './types';
import type { TokenName } from './types';

const scales = {
    radius: { xs: 2, sm: 4, md: 8, lg: 14, xl: 22, pill: 999 },
    spacing: {
        'ultra-tight': 4,
        tight: 8,
        normal: 12,
        comfortable: 16,
        spacious: 22,
    },
    type: {
        sm: { body: 12, h: 14, label: 10 },
        md: { body: 13.5, h: 16, label: 11 },
        lg: { body: 15, h: 19, label: 12 },
    },
} as const;

export function palette(
    mode: ConstraintContext['mode'],
    project = 'enterprise',
): Record<string, string> {
    if (project === 'healthcare') {
        return mode === 'dark'
            ? {
                  canvas: 'oklch(16% 0.018 185)',
                  elevated: 'oklch(21% 0.02 185)',
                  muted: 'oklch(25% 0.024 185)',
                  warning: 'oklch(29% 0.05 82)',
                  danger: 'oklch(30% 0.055 24)',
                  success: 'oklch(31% 0.06 168)',
                  textPrimary: 'oklch(96% 0.006 180)',
                  textSecondary: 'oklch(76% 0.018 180)',
                  textMuted: 'oklch(57% 0.015 180)',
                  borderSubtle: 'oklch(31% 0.018 185)',
                  borderVisible: 'oklch(40% 0.022 185)',
                  borderStrong: 'oklch(55% 0.03 185)',
                  borderWarning: 'oklch(73% 0.14 82)',
                  borderDanger: 'oklch(66% 0.17 24)',
                  borderSuccess: 'oklch(69% 0.15 168)',
                  borderFocus: 'oklch(70% 0.15 198)',
                  accent: 'oklch(61% 0.13 198)',
              }
            : {
                  canvas: 'oklch(98% 0.01 170)',
                  elevated: 'oklch(100% 0.003 170)',
                  muted: 'oklch(94% 0.018 170)',
                  warning: 'oklch(95% 0.05 82)',
                  danger: 'oklch(95% 0.045 24)',
                  success: 'oklch(94% 0.05 158)',
                  textPrimary: 'oklch(22% 0.03 190)',
                  textSecondary: 'oklch(40% 0.035 190)',
                  textMuted: 'oklch(58% 0.026 190)',
                  borderSubtle: 'oklch(88% 0.02 180)',
                  borderVisible: 'oklch(78% 0.032 180)',
                  borderStrong: 'oklch(55% 0.05 185)',
                  borderWarning: 'oklch(59% 0.15 82)',
                  borderDanger: 'oklch(54% 0.18 24)',
                  borderSuccess: 'oklch(50% 0.14 158)',
                  borderFocus: 'oklch(48% 0.14 198)',
                  accent: 'oklch(45% 0.13 198)',
              };
    }

    if (project === 'fintech') {
        return mode === 'dark'
            ? {
                  canvas: 'oklch(12% 0.018 235)',
                  elevated: 'oklch(16% 0.022 235)',
                  muted: 'oklch(20% 0.026 235)',
                  warning: 'oklch(24% 0.065 96)',
                  danger: 'oklch(24% 0.065 28)',
                  success: 'oklch(24% 0.07 145)',
                  textPrimary: 'oklch(96% 0.006 230)',
                  textSecondary: 'oklch(75% 0.02 230)',
                  textMuted: 'oklch(52% 0.02 230)',
                  borderSubtle: 'oklch(24% 0.03 235)',
                  borderVisible: 'oklch(34% 0.04 235)',
                  borderStrong: 'oklch(50% 0.05 235)',
                  borderWarning: 'oklch(78% 0.18 96)',
                  borderDanger: 'oklch(67% 0.2 28)',
                  borderSuccess: 'oklch(72% 0.18 145)',
                  borderFocus: 'oklch(77% 0.18 142)',
                  accent: 'oklch(74% 0.18 142)',
              }
            : {
                  canvas: 'oklch(97% 0.008 235)',
                  elevated: 'oklch(100% 0 0)',
                  muted: 'oklch(94% 0.012 235)',
                  warning: 'oklch(95% 0.055 96)',
                  danger: 'oklch(95% 0.045 28)',
                  success: 'oklch(94% 0.052 145)',
                  textPrimary: 'oklch(19% 0.035 235)',
                  textSecondary: 'oklch(36% 0.035 235)',
                  textMuted: 'oklch(55% 0.025 235)',
                  borderSubtle: 'oklch(88% 0.018 235)',
                  borderVisible: 'oklch(76% 0.026 235)',
                  borderStrong: 'oklch(52% 0.04 235)',
                  borderWarning: 'oklch(62% 0.16 96)',
                  borderDanger: 'oklch(54% 0.19 28)',
                  borderSuccess: 'oklch(48% 0.15 145)',
                  borderFocus: 'oklch(45% 0.15 142)',
                  accent: 'oklch(42% 0.15 142)',
              };
    }

    if (mode === 'dark') {
        return {
            canvas: 'oklch(15% 0.012 260)',
            elevated: 'oklch(20% 0.014 260)',
            muted: 'oklch(24% 0.016 260)',
            warning: 'oklch(28% 0.045 75)',
            danger: 'oklch(28% 0.05 28)',
            success: 'oklch(28% 0.05 155)',
            textPrimary: 'oklch(96% 0.005 260)',
            textSecondary: 'oklch(74% 0.012 260)',
            textMuted: 'oklch(54% 0.012 260)',
            borderSubtle: 'oklch(28% 0.014 260)',
            borderVisible: 'oklch(37% 0.016 260)',
            borderStrong: 'oklch(51% 0.018 260)',
            borderWarning: 'oklch(70% 0.13 75)',
            borderDanger: 'oklch(64% 0.18 28)',
            borderSuccess: 'oklch(68% 0.13 155)',
            borderFocus: 'oklch(72% 0.16 264)',
            accent: 'oklch(72% 0.16 264)',
        };
    }

    return {
        canvas: 'oklch(98% 0.004 95)',
        elevated: 'oklch(100% 0 0)',
        muted: 'oklch(95% 0.006 95)',
        warning: 'oklch(96% 0.04 75)',
        danger: 'oklch(96% 0.04 28)',
        success: 'oklch(96% 0.04 155)',
        textPrimary: 'oklch(22% 0.012 250)',
        textSecondary: 'oklch(40% 0.012 250)',
        textMuted: 'oklch(58% 0.012 250)',
        borderSubtle: 'oklch(92% 0.006 250)',
        borderVisible: 'oklch(84% 0.008 250)',
        borderStrong: 'oklch(60% 0.012 250)',
        borderWarning: 'oklch(60% 0.16 75)',
        borderDanger: 'oklch(54% 0.2 28)',
        borderSuccess: 'oklch(58% 0.14 155)',
        borderFocus: 'oklch(54% 0.18 264)',
        accent: 'oklch(48% 0.18 264)',
    };
}

export function materialize(
    resolved: Resolution,
    ctx: ConstraintContext,
): MaterializedTokens {
    const token = (name: TokenName) => resolved.tokens[name]?.value;
    const pal = palette(ctx.mode, ctx.project);

    const surface = String(token('surface') ?? 'neutral');
    const text = String(token('text') ?? 'primary');
    const border = String(token('border') ?? 'subtle');
    const radius = String(token('radius') ?? 'md');
    const spacing = String(token('spacing.inner') ?? 'normal');
    const shadow = String(token('shadow') ?? 'none');
    const type = String(token('type.scale') ?? 'md');
    const elevation = Number(token('elevation') ?? 0);

    const surfaces: Record<string, string> = {
        neutral: pal.elevated,
        'neutral-dark': pal.elevated,
        muted: pal.muted,
        'muted-dark': pal.muted,
        warning: pal.warning,
        danger: pal.danger,
        success: pal.success,
    };

    const texts: Record<string, string> = {
        primary: pal.textPrimary,
        secondary: pal.textSecondary,
        muted: pal.textMuted,
        inverted: pal.textPrimary,
    };

    const borders: Record<string, string> = {
        subtle: pal.borderSubtle,
        visible: pal.borderVisible,
        strong: pal.borderStrong,
        none: 'transparent',
        warning: pal.borderWarning,
        danger: pal.borderDanger,
        success: pal.borderSuccess,
        focus: pal.borderFocus,
    };

    const shadows =
        ctx.mode === 'dark'
            ? {
                  none: 'none',
                  sm: '0 1px 2px oklch(0% 0 0 / 0.4)',
                  md: '0 4px 14px oklch(0% 0 0 / 0.45)',
                  lg: '0 10px 30px oklch(0% 0 0 / 0.55)',
              }
            : {
                  none: 'none',
                  sm: '0 1px 2px oklch(20% 0.012 250 / 0.08)',
                  md: '0 4px 14px oklch(20% 0.012 250 / 0.10)',
                  lg: '0 10px 30px oklch(20% 0.012 250 / 0.12)',
              };

    return {
        surface: surfaces[surface] ?? pal.elevated,
        text: texts[text] ?? pal.textPrimary,
        border: borders[border] ?? pal.borderSubtle,
        borderWidth: border === 'strong' ? 2 : border === 'none' ? 0 : 1,
        radius: scales.radius[radius as keyof typeof scales.radius] ?? scales.radius.md,
        spacing:
            scales.spacing[spacing as keyof typeof scales.spacing] ??
            scales.spacing.normal,
        shadow:
            shadow === 'none' && elevation === 0
                ? 'none'
                : shadows[shadow as keyof typeof shadows] ?? shadows.sm,
        fontSize: scales.type[type as keyof typeof scales.type]?.body ?? 13.5,
        headingSize: scales.type[type as keyof typeof scales.type]?.h ?? 16,
        labelSize: scales.type[type as keyof typeof scales.type]?.label ?? 11,
        palette: pal,
        semantic: {
            surface,
            text,
            border,
            radius,
            'spacing.inner': spacing,
            elevation,
            shadow,
            'type.scale': type,
        },
    };
}
