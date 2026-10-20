import { Appearance } from 'react-native';
import type { AppSettings } from './types';

// Emerald green / deep navy / off-white palette.
// Calming and high-contrast for accessibility across age groups.
export const Theme = {
  light: {
    isDark: false,
    bg: '#FAF8F3',         // off-white
    bgElevated: '#FFFFFF',
    bgCard: '#F3F0E8',
    primary: '#0F766E',     // emerald-700
    primaryDark: '#0B5C55',
    primaryLight: '#14B8A6',
    secondary: '#1E3A5F',   // deep navy
    accent: '#D97706',      // amber for highlights
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textOnPrimary: '#FFFFFF',
    border: '#E5E7EB',
    divider: '#ECE9E1',
    highlight: '#FEF3C7',   // currently playing ayah bg
    highlightBorder: '#F59E0B',
  },
  dark: {
    isDark: true,
    bg: '#0B1220',          // deep navy-black
    bgElevated: '#111B2E',
    bgCard: '#16223B',
    primary: '#2DD4BF',     // brighter emerald for dark
    primaryDark: '#14B8A6',
    primaryLight: '#5EEAD4',
    secondary: '#93C5FD',
    accent: '#FBBF24',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textOnPrimary: '#08110E',
    border: '#1F2A44',
    divider: '#1B2540',
    highlight: '#1E3A5F',
    highlightBorder: '#2DD4BF',
  },
};

export type ThemeColors = (typeof Theme)['light'];

export function resolveTheme(settings: AppSettings): ThemeColors {
  if (settings.theme === 'system') {
    return Appearance.getColorScheme() === 'dark' ? Theme.dark : Theme.light;
  }
  return settings.theme === 'dark' ? Theme.dark : Theme.light;
}
