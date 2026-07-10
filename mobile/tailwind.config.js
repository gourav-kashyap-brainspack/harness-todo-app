/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './App.tsx'],
  presets: [require('nativewind/preset')],
  // Manual override (system | light | dark) needs `class` — with `media`,
  // NativeWind's colorScheme.set() throws ("Cannot manually set color
  // scheme, as dark mode is type 'media'"). See src/theme/ThemeProvider.tsx
  // and docs/context/design-system.md → Implementation handoff.
  darkMode: 'class',
  theme: {
    extend: {
      // Semantic color tokens (FND-002). Values are CSS variables set in
      // global.css (`:root` = light, `.dark` = dark) so a single set of
      // utility classes (`bg-bg`, `text-text`, `bg-primary text-primary-fg`,
      // …) resolves per active theme — components never hardcode hex or
      // reference `dark:`-prefixed color variants. See
      // docs/context/design-system.md → Color tokens.
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-fg': 'rgb(var(--color-primary-fg) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
      },
      // Type scale (FND-002) — dp sizes/line-heights/weights per
      // docs/context/design-system.md → Type scale. Only the sizes the
      // product uses are overridden; 4xl+ fall back to the Tailwind preset
      // defaults (unused today).
      fontSize: {
        xs: ['12px', {lineHeight: '16px', fontWeight: '500'}],
        sm: ['14px', {lineHeight: '20px', fontWeight: '400'}],
        base: ['16px', {lineHeight: '24px', fontWeight: '400'}],
        lg: ['18px', {lineHeight: '26px', fontWeight: '600'}],
        xl: ['20px', {lineHeight: '28px', fontWeight: '600'}],
        '2xl': ['24px', {lineHeight: '32px', fontWeight: '700'}],
        '3xl': ['30px', {lineHeight: '38px', fontWeight: '700'}],
      },
      // Radius tokens (FND-002) — `rounded-sm|md|lg|full` per
      // docs/context/design-system.md → Spacing + radius. `radius-lg` (20px)
      // is the signature task-card/sheet shape.
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        full: '9999px',
      },
      // Spacing: NativeWind/Tailwind's default numeric scale is already
      // 4px-stepped and matches the product's steps 1–12 exactly (see
      // design-system.md → Spacing + radius) — confirmed, no override
      // needed.
    },
  },
  plugins: [],
};
