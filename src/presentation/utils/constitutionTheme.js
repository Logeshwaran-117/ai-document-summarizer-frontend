/**
 * constitutionTheme.js
 * Frontend Visual System Mirroring DESIGN_CONSTITUTION.md
 * Single source of visual styling truth for slide previews.
 */

export const CONSTITUTION_THEME = Object.freeze({
  CANVAS: {
    ASPECT_RATIO: '16/9',
    WIDTH_PX: 1280,
    HEIGHT_PX: 720,
  },
  COLORS: {
    DEEP_NAVY: '#1A2B4A',
    AMBER_GOLD: '#F5A800',
    DARK_AMBER: '#E69500',
    WHITE: '#FFFFFF',
    LIGHT_BG: '#F2F4F8',
    SLATE_BLUE: '#6B7A99',
    TEAL: '#0A7B8C',
    DARK_TEAL: '#0A5B8C',
    EMERALD_GREEN: '#0D8A4E',
    GOLD_LABEL: '#D4A800',
    ALERT_RED: '#D93025',
    DARK_BLUE: '#243B5C',
  },
  CHART_COLORS: [
    '#F5A800', // Amber Gold
    '#1A2B4A', // Deep Navy
    '#0A7B8C', // Teal
    '#0D8A4E', // Green
    '#D93025', // Red
    '#6B7A99', // Slate
    '#D4A800', // Gold
  ],
  FONTS: {
    FAMILY: 'Calibri, Arial, sans-serif',
    WEIGHT: 'bold',
  },
});
