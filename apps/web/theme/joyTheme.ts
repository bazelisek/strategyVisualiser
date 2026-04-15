const joyThemeConfig = {
  colorSchemes: {
    dark: {
      palette: {
        primary: {
          solidBg: 'var(--accent)',
          solidHoverBg: 'var(--accent-dark)',
          solidColor: 'var(--background-dark)',
        },
        neutral: {
          plainColor: 'var(--foreground)',
          plainHoverBg: 'var(--background-light)',
        },
        background: {
          // This fixes the white background issue
          body: 'var(--background)', 
          surface: 'var(--background-light)',
        },
        success: {
          solidBg: 'var(--success)',
        },
        danger: {
          solidBg: 'var(--danger)',
        },
      },
    },
  },
  components: {
    JoyIconButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            color: "var(--primary, var(--accent))",
          },
          "&:hover svg": {
            color: "var(--primary, var(--accent))",
          },
        },
      },
    },
  },
  fontFamily: {
    body: 'var(--font-base)',
    display: 'var(--font-base)',
    code: 'var(--font-mono)',
  },
  radius: {
    xs: '4px',
    sm: 'var(--border-radius)',
    md: 'var(--border-radius)',
    lg: '12px',
  },
  // Type-safe spacing function using your CSS variable
  spacing: (factor: number) => `calc(${factor} * var(--spacing))`,
};

export default joyThemeConfig;
