"use client";

import { useEffect } from 'react';
import { applyBrandTheme, getStoredBrandTheme } from '@/lib/theme';

export default function ThemeInitializer() {
  useEffect(() => {
    const storedTheme = getStoredBrandTheme();
    applyBrandTheme(storedTheme);
  }, []);

  return null;
}
