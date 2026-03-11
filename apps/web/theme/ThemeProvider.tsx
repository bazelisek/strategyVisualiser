"use client";

import React, { useMemo } from 'react';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';
import joyThemeConfig from './joyTheme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const joyTheme = useMemo(() => extendTheme(joyThemeConfig), []);

  return (
    <CssVarsProvider 
      theme={joyTheme} 
      defaultMode="dark" // Forces Joy UI to use the dark palette defined above
      modeStorageKey="finance-app-theme"
    >
      {children}
    </CssVarsProvider>
  );
}
