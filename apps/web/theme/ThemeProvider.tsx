"use client";

import React, { useMemo } from 'react';
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';
import {
  ThemeProvider as MaterialThemeProvider,
  THEME_ID as MATERIAL_THEME_ID,
} from '@mui/material/styles';
import joyThemeConfig from './joyTheme';
import materialTheme from './materialTheme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const joyTheme = useMemo(() => extendTheme(joyThemeConfig), []);

  return (
    <CssVarsProvider 
      theme={joyTheme} 
      defaultMode="dark" // Forces Joy UI to use the dark palette defined above
      modeStorageKey="finance-app-theme"
    >
      <MaterialThemeProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }}>
        {children}
      </MaterialThemeProvider>
    </CssVarsProvider>
  );
}
