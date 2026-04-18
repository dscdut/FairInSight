/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    // 1. Configure the Container for the Grid System
    container: {
      center: true,
      padding: "var(--grid-margin)",
      screens: {
        "2xl": "var(--container-max-width)",
      }
    },
    extend: {
      // 1. Set Google Sans Flex as the default sans-serif font
      fontFamily: {
        sans: ['"Google Sans Flex"', 'sans-serif'],
      },
      // 2. Map the Figma Text Styles
      fontSize: {
        /* Format: [fontSize, { lineHeight, fontWeight }] */

        /* Heading */
        h1: ['var(--font-size-h1)', { lineHeight: 'var(--line-height-h1)', fontWeight: 'var(--font-weight-h1)' }],
        h2: ['var(--font-size-h2)', { lineHeight: 'var(--line-height-h2)', fontWeight: 'var(--font-weight-h2)' }],
        h3: ['var(--font-size-h3)', { lineHeight: 'var(--line-height-h3)', fontWeight: 'var(--font-weight-h3)' }],
        h4: ['var(--font-size-h4)', { lineHeight: 'var(--line-height-h4)', fontWeight: 'var(--font-weight-h4)' }],
        h5: ['var(--font-size-h5)', { lineHeight: 'var(--line-height-h5)', fontWeight: 'var(--font-weight-h5)' }],

        // Body text
        p: ['var(--font-size-p)', { lineHeight: 'var(--line-height-p)', fontWeight: 'var(--font-weight-p)' }],
        'p-medium': ['var(--font-size-p-medium)', { lineHeight: 'var(--line-height-p-medium)', fontWeight: 'var(--font-weight-p-medium)' }],
        large: ['var(--font-size-large)', { lineHeight: 'var(--line-height-large)', fontWeight: 'var(--font-weight-large)' }],
        small: ['var(--font-size-small)', { lineHeight: 'var(--line-height-small)', fontWeight: 'var(--font-weight-small)' }],

        // Specialty Text
        blockquote: ['var(--font-size-blockquote)', { lineHeight: 'var(--line-height-blockquote)', fontWeight: 'var(--font-weight-blockquote)', fontStyle: 'italic' }],
        placeholder: ['var(--font-size-placeholder)', { lineHeight: 'var(--line-height-placeholder)', fontWeight: 'var(--font-weight-placeholder)' }],

        // Button Fonts
        'btn-giant': ['var(--font-size-btn-giant)', { lineHeight: 'var(--line-height-btn-giant)', fontWeight: 'var(--font-weight-btn-giant)' }],
        'btn-large': ['var(--font-size-btn-large)', { lineHeight: 'var(--line-height-btn-large)', fontWeight: 'var(--font-weight-btn-large)' }],
        'btn-medium': ['var(--font-size-btn-medium)', { lineHeight: 'var(--line-height-btn-medium)', fontWeight: 'var(--font-weight-btn-medium)' }],
        'btn-small': ['var(--font-size-btn-small)', { lineHeight: 'var(--line-height-btn-small)', fontWeight: 'var(--font-weight-btn-small)' }],
        'btn-tiny': ['var(--font-size-btn-tiny)', { lineHeight: 'var(--line-height-btn-tiny)', fontWeight: 'var(--font-weight-btn-tiny)' }],
      },
      
      // 4. Border Radius
      borderRadius: {
        xss: "var(--radius-xss)",
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      // 5. Colors Pallets
      colors: {
        background: {
          primary: "var(--background-primary)",
          secondary: "var(--background-secondary)",
          tertiary: "var(--background-tertiary)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        border: {
          primary: "var(--border-primary)",
          secondary: "var(--border-secondary)",
          focus: "var(--border-focus)",
        },
        error: {
          primary: "var(--error-primary)",
          secondary: "var(--error-secondary)",
        },
        success: {
          primary: "var(--success-primary)",
          secondary: "var(--success-secondary)",
        },
        warning: {
          primary: "var(--warning-primary)",
          secondary: "var(--warning-secondary)",
        },
        // Shadcn Defaults
        ring: "var(--ring)",
        input: "var(--input)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
      },
      // 6. Box Shadow
      boxShadow: {
        '100': 'var(--shadow-100)',
        '200': 'var(--shadow-200)',
        '300': 'var(--shadow-300)',
        '400': 'var(--shadow-400)',
        '500': 'var(--shadow-500)',
        '600': 'var(--shadow-600)',
        '700': 'var(--shadow-700)',
        '800': 'var(--shadow-800)',
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
