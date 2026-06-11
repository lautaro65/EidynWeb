"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export function ThemeSyncer({ dbTheme }: { dbTheme: string }) {
  const { theme, setTheme } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Only sync once on mount so we don't fight with the user if they change it in another tab
    if (!hasSynced.current && dbTheme && theme !== dbTheme) {
      setTheme(dbTheme);
      hasSynced.current = true;
    }
  }, [dbTheme, theme, setTheme]);

  return null;
}
