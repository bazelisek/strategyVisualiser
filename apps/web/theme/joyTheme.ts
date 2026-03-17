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
    JoyModal: {
      styleOverrides: {
        backdrop: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      },
    },
    JoyModalDialog: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--accent)",
          borderRadius: "24px",
          boxShadow: "0 0 14px rgba(var(--accent-rgb), 0.45)",
          maxHeight: "90vh",
          width: "min(800px, 90vw)",
          overflow: "visible",
          padding: "28px",
        },
      },
    },
    JoyDialogTitle: {
      styleOverrides: {
        root: {
          color: "var(--accent)",
          fontWeight: 600,
        },
      },
    },
    JoyDialogContent: {
      styleOverrides: {
        root: {
          color: "var(--foreground)",
        },
      },
    },
    JoyModalClose: {
      styleOverrides: {
        root: {
          color: "var(--background-dark)",
          backgroundColor: "var(--accent)",
          borderRadius: "var(--border-radius)",
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
