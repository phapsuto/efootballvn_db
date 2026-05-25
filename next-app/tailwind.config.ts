import type { Config } from 'tailwindcss';

/**
 * Stitch "Kinetic Navy" palette — Material Design 3 tokens adopted verbatim
 * from stitch/chi_ti_t_c_u_th_mobile, x_y_d_ng_i_h_nh_mobile, and
 * h_s_c_nh_n_mobile. All of those Stitch HTML mocks share the same color
 * dictionary, so we use it as the canonical token set for the app.
 *
 * Keys are kept mostly flat (no nested DEFAULT) because some of our
 * @apply directives in globals.css reference tokens like `text-on-surface`
 * and `border-outline-variant`, and older tailwind builds can mis-resolve
 * nested DEFAULTs when the parent key itself contains a hyphen.
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // ------- shadcn/ui semantic tokens repointed to MD3 -------
        border: '#434652',
        input: '#00307a',
        ring: '#b1c5ff',
        background: '#001136',
        foreground: '#dae2ff',

        // Primary scale
        primary: '#b1c5ff',
        'primary-foreground': '#002c71',
        'primary-container': '#0a3d91',
        'on-primary-container': '#8dadff',
        'primary-fixed': '#dae2ff',
        'primary-fixed-dim': '#b1c5ff',
        'on-primary': '#002c71',
        'on-primary-fixed': '#001947',
        'on-primary-fixed-variant': '#144296',

        // Secondary scale
        secondary: '#76dc82',
        'secondary-foreground': '#003911',
        'secondary-container': '#017c2f',
        'on-secondary-container': '#afffb2',
        'secondary-fixed': '#92f99c',
        'secondary-fixed-dim': '#76dc82',
        'on-secondary': '#003911',
        'on-secondary-fixed': '#002107',
        'on-secondary-fixed-variant': '#00531c',

        // Tertiary scale
        tertiary: '#e9c400',
        'tertiary-foreground': '#3a3000',
        'tertiary-container': '#c8a900',
        'on-tertiary-container': '#4b3e00',
        'tertiary-fixed': '#ffe16d',
        'tertiary-fixed-dim': '#e9c400',
        'on-tertiary': '#3a3000',
        'on-tertiary-fixed': '#221b00',
        'on-tertiary-fixed-variant': '#544600',

        // Error scale
        error: '#ffb4ab',
        'error-foreground': '#690005',
        'error-container': '#93000a',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',

        // shadcn muted/accent/destructive/card (repointed)
        muted: '#00307a',
        'muted-foreground': '#c4c6d3',
        accent: '#0a3d91',
        'accent-foreground': '#8dadff',
        destructive: '#ffb4ab',
        'destructive-foreground': '#690005',
        card: '#001c4f',
        'card-foreground': '#dae2ff',

        // MD3 surface scale
        surface: '#001136',
        'surface-dim': '#001136',
        'surface-bright': '#003483',
        'surface-variant': '#00307a',
        'surface-tint': '#b1c5ff',
        'surface-container-lowest': '#000c2b',
        'surface-container-low': '#001947',
        'surface-container': '#001c4f',
        'surface-container-high': '#002664',
        'surface-container-highest': '#00307a',

        // on-surface / outline
        'on-surface': '#dae2ff',
        'on-surface-variant': '#c4c6d3',
        'on-background': '#dae2ff',
        outline: '#8e909d',
        'outline-variant': '#434652',

        // inverse tokens
        'inverse-primary': '#345baf',
        'inverse-surface': '#dae2ff',
        'inverse-on-surface': '#002c71',

        // Stitch "Kinetic Navy" alias for any legacy references
        stitch: {
          background: '#001136',
          surface: '#001136',
          'surface-variant': '#00307a',
          'surface-high': '#002664',
          outline: '#8e909d',
          'outline-soft': 'rgba(142, 144, 157, 0.18)',
          primary: '#b1c5ff',
          'primary-container': '#0a3d91',
          secondary: '#76dc82',
          'secondary-soft': 'rgba(118, 220, 130, 0.14)',
          tertiary: '#e9c400',
          'on-surface': '#dae2ff',
          'on-surface-variant': '#c4c6d3',
          success: '#76dc82',
          warning: '#e9c400',
          danger: '#ffb4ab'
        }
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        headline: ['var(--font-headline)', 'Inter', 'system-ui', 'sans-serif'],
        label: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        'stitch-card': '0 18px 44px rgba(0, 8, 40, 0.55)',
        'stitch-hover': '0 24px 56px rgba(0, 12, 52, 0.65)',
        'stitch-glow':
          '0 0 0 1px rgba(177, 197, 255, 0.35), 0 20px 40px rgba(10, 61, 145, 0.25)'
      }
    }
  },
  plugins: []
};

export default config;
