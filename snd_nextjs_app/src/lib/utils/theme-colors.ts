/**
 * Utility functions for dynamically updating shadcn UI theme colors
 * based on user's preferred color
 */

/**
 * Convert color name to HSL values for primary color
 * Returns HSL values in the format: "hue saturation% lightness%"
 */
export function getColorHSL(colorName: string | null | undefined, isDark: boolean = false): string {
  if (!colorName) {
    // Default neutral color
    return isDark ? '0 0% 98%' : '0 0% 9%';
  }

  const colorMap: Record<string, { light: string; dark: string }> = {
    red: {
      light: '0 72% 51%',      // Red-600
      dark: '0 72% 51%',        // Red-600
    },
    blue: {
      light: '217 91% 60%',     // Blue-600
      dark: '217 91% 60%',      // Blue-600
    },
    purple: {
      light: '262 83% 58%',    // Purple-600
      dark: '262 83% 58%',     // Purple-600
    },
    orange: {
      light: '25 95% 53%',     // Orange-600
      dark: '25 95% 53%',      // Orange-600
    },
    green: {
      light: '142 76% 36%',    // Green-600
      dark: '142 76% 36%',     // Green-600
    },
    gray: {
      light: '220 13% 18%',    // Gray-700
      dark: '220 13% 91%',     // Gray-100
    },
    slate: {
      light: '215 16% 47%',    // Slate-600
      dark: '215 20% 65%',     // Slate-400
    },
    indigo: {
      light: '239 84% 67%',    // Indigo-600
      dark: '239 84% 67%',     // Indigo-600
    },
    teal: {
      light: '173 80% 40%',    // Teal-600
      dark: '173 80% 40%',     // Teal-600
    },
    pink: {
      light: '330 81% 60%',    // Pink-600
      dark: '330 81% 60%',     // Pink-600
    },
    cyan: {
      light: '188 94% 43%',    // Cyan-600
      dark: '188 94% 43%',     // Cyan-600
    },
    amber: {
      light: '43 96% 56%',     // Amber-600
      dark: '43 96% 56%',      // Amber-600
    },
    emerald: {
      light: '160 84% 39%',    // Emerald-600
      dark: '160 84% 39%',     // Emerald-600
    },
    violet: {
      light: '258 90% 66%',    // Violet-600
      dark: '258 90% 66%',     // Violet-600
    },
    rose: {
      light: '350 89% 60%',    // Rose-600
      dark: '350 89% 60%',     // Rose-600
    },
  };

  const normalizedColor = colorName.toLowerCase();
  const color = colorMap[normalizedColor];
  
  if (color) {
    return isDark ? color.dark : color.light;
  }

  // Fallback to default
  return isDark ? '0 0% 98%' : '0 0% 9%';
}

/**
 * Get primary foreground color (text color) based on primary color
 */
export function getPrimaryForegroundHSL(colorName: string | null | undefined, isDark: boolean = false): string {
  if (!colorName) {
    return isDark ? '0 0% 9%' : '0 0% 98%';
  }

  // For most colors, use white text on colored background in light mode
  // and dark text on light background in dark mode
  const lightColors = ['amber', 'cyan', 'teal', 'emerald', 'yellow'];
  const normalizedColor = colorName.toLowerCase();
  
  if (lightColors.includes(normalizedColor)) {
    // Light colors need dark text
    return isDark ? '0 0% 9%' : '0 0% 9%';
  }
  
  // Dark colors use white text
  return isDark ? '0 0% 9%' : '0 0% 98%';
}

/**
 * Get accent color based on primary color (lighter version)
 */
export function getAccentHSL(colorName: string | null | undefined, isDark: boolean = false): string {
  if (!colorName) {
    return isDark ? '0 0% 14.9%' : '0 0% 96.1%';
  }

  const colorMap: Record<string, { light: string; dark: string }> = {
    red: {
      light: '0 72% 90%',      // Red-100
      dark: '0 72% 20%',        // Red-900
    },
    blue: {
      light: '217 91% 95%',     // Blue-100
      dark: '217 91% 20%',     // Blue-900
    },
    purple: {
      light: '262 83% 95%',     // Purple-100
      dark: '262 83% 20%',      // Purple-900
    },
    orange: {
      light: '25 95% 90%',      // Orange-100
      dark: '25 95% 20%',       // Orange-900
    },
    green: {
      light: '142 76% 90%',     // Green-100
      dark: '142 76% 20%',      // Green-900
    },
    gray: {
      light: '220 13% 96%',     // Gray-100
      dark: '220 13% 15%',      // Gray-800
    },
    slate: {
      light: '215 16% 96%',     // Slate-100
      dark: '215 20% 15%',      // Slate-800
    },
    indigo: {
      light: '239 84% 95%',     // Indigo-100
      dark: '239 84% 20%',      // Indigo-900
    },
    teal: {
      light: '173 80% 90%',     // Teal-100
      dark: '173 80% 20%',      // Teal-900
    },
    pink: {
      light: '330 81% 95%',      // Pink-100
      dark: '330 81% 20%',       // Pink-900
    },
    cyan: {
      light: '188 94% 90%',      // Cyan-100
      dark: '188 94% 20%',      // Cyan-900
    },
    amber: {
      light: '43 96% 90%',      // Amber-100
      dark: '43 96% 20%',       // Amber-900
    },
    emerald: {
      light: '160 84% 90%',     // Emerald-100
      dark: '160 84% 20%',      // Emerald-900
    },
    violet: {
      light: '258 90% 95%',      // Violet-100
      dark: '258 90% 20%',      // Violet-900
    },
    rose: {
      light: '350 89% 95%',      // Rose-100
      dark: '350 89% 20%',      // Rose-900
    },
  };

  const normalizedColor = colorName.toLowerCase();
  const color = colorMap[normalizedColor];
  
  if (color) {
    return isDark ? color.dark : color.light;
  }

  return isDark ? '0 0% 14.9%' : '0 0% 96.1%';
}

/**
 * Apply theme colors to CSS variables
 */
export function applyThemeColors(colorName: string | null | undefined, isDark: boolean = false) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primaryHSL = getColorHSL(colorName, isDark);
  const primaryForegroundHSL = getPrimaryForegroundHSL(colorName, isDark);
  const accentHSL = getAccentHSL(colorName, isDark);

  // Update primary color
  root.style.setProperty('--primary', primaryHSL);
  root.style.setProperty('--primary-foreground', primaryForegroundHSL);
  
  // Update accent color
  root.style.setProperty('--accent', accentHSL);
  
  // Update ring color (focus rings)
  root.style.setProperty('--ring', primaryHSL);
  
  // Update sidebar primary if exists
  root.style.setProperty('--sidebar-primary', primaryHSL);
  root.style.setProperty('--sidebar-primary-foreground', primaryForegroundHSL);
}

/**
 * Reset theme colors to default
 */
export function resetThemeColors(isDark: boolean = false) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // Reset to default neutral colors
  if (isDark) {
    root.style.setProperty('--primary', '0 0% 98%');
    root.style.setProperty('--primary-foreground', '0 0% 9%');
    root.style.setProperty('--accent', '0 0% 14.9%');
    root.style.setProperty('--ring', '0 0% 83.1%');
    root.style.setProperty('--sidebar-primary', '220 70% 50%');
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 98%');
  } else {
    root.style.setProperty('--primary', '0 0% 9%');
    root.style.setProperty('--primary-foreground', '0 0% 98%');
    root.style.setProperty('--accent', '0 0% 96.1%');
    root.style.setProperty('--ring', '0 0% 3.9%');
    root.style.setProperty('--sidebar-primary', '0 0% 9%');
    root.style.setProperty('--sidebar-primary-foreground', '0 0% 98%');
  }
}

