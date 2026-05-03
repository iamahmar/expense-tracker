// theme.js — Design tokens for Expense Tracker (Enhanced)

import { useMemo } from 'react';
import { useApp } from './context/AppContext';

// ─── Color Palette ────────────────────────────────────────────────────────────
export const DarkColors = {
  // ── Core Backgrounds ──
  bg: '#0E0F1A',               // Deeper, richer base — less washed-out navy
  surface: '#161727',          // Card/panel surface
  surfaceAlt: '#1C1E32',       // Slightly elevated surface
  surfaceHigh: '#222440',      // Highest elevation surface (modals, sheets)
  card: '#1A1C2E',
  cardBorder: 'rgba(255,107,53,0.10)',
  cardBorderHover: 'rgba(255,107,53,0.25)',

  // ── Glassmorphism helpers ──
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  glassBorderStrong: 'rgba(255,255,255,0.14)',

  // ── Accent — warm coral-orange ──
  accent: '#FF6B35',
  accentLight: '#FF8C5A',       // Lighter tint for hover/active states
  accentMuted: 'rgba(255,107,53,0.14)',
  accentDim: 'rgba(255,107,53,0.30)',
  accentGlow: 'rgba(255,107,53,0.20)',

  // ── Text ──
  textPrimary: '#EEF0FF',
  textSecondary: '#7E8CA4',
  textMuted: '#404660',
  textAccent: '#FF6B35',
  textInverse: '#0E0F1A',

  // ── Semantic — Income ──
  income: '#3DD6C8',
  incomeLight: 'rgba(61,214,200,0.12)',
  incomeBorder: 'rgba(61,214,200,0.25)',

  // ── Semantic — Expense ──
  expense: '#FF6B35',
  expenseLight: 'rgba(255,107,53,0.12)',
  expenseBorder: 'rgba(255,107,53,0.25)',

  // ── Semantic — Danger ──
  danger: '#FF4C6A',
  dangerLight: 'rgba(255,76,106,0.12)',
  dangerBorder: 'rgba(255,76,106,0.30)',

  // ── Semantic — Success ──
  success: '#2ECC8E',
  successLight: 'rgba(46,204,142,0.12)',
  successBorder: 'rgba(46,204,142,0.28)',

  // ── Semantic — Warning ──
  warning: '#F5A623',
  warningLight: 'rgba(245,166,35,0.12)',
  warningBorder: 'rgba(245,166,35,0.28)',

  // ── Info ──
  info: '#5B9CF6',
  infoLight: 'rgba(91,156,246,0.12)',

  // ── Dividers & Overlays ──
  divider: 'rgba(255,255,255,0.055)',
  dividerStrong: 'rgba(255,255,255,0.10)',
  overlay: 'rgba(0,0,0,0.65)',
  overlayLight: 'rgba(0,0,0,0.35)',
  scrim: 'rgba(14,15,26,0.85)',

  // ── Tab bar ──
  tabBg: '#0B0C18',
  tabBorder: 'rgba(255,255,255,0.07)',
  tabActive: '#FF6B35',
  tabInactive: '#ffffffff',

  // ── Gradient endpoints (use with LinearGradient) ──
  gradientAccentStart: '#FF6B35',
  gradientAccentEnd: '#FF3E8A',
  gradientIncomeStart: '#3DD6C8',
  gradientIncomeEnd: '#2B9E9A',
  gradientCardStart: '#1C1E32',
  gradientCardEnd: '#12132050',
};

export const LightColors = {
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  surfaceHigh: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(255,107,53,0.15)',
  cardBorderHover: 'rgba(255,107,53,0.30)',
  glass: 'rgba(0,0,0,0.04)',
  glassBorder: 'rgba(0,0,0,0.08)',
  glassBorderStrong: 'rgba(0,0,0,0.14)',
  accent: '#FF6B35',
  accentLight: '#FF8C5A',
  accentMuted: 'rgba(255,107,53,0.12)',
  accentDim: 'rgba(255,107,53,0.20)',
  accentGlow: 'rgba(255,107,53,0.15)',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textAccent: '#FF6B35',
  textInverse: '#FFFFFF',
  income: '#0D9488',
  incomeLight: 'rgba(13,148,136,0.10)',
  incomeBorder: 'rgba(13,148,136,0.20)',
  expense: '#FF6B35',
  expenseLight: 'rgba(255,107,53,0.10)',
  expenseBorder: 'rgba(255,107,53,0.20)',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.10)',
  dangerBorder: 'rgba(239,68,68,0.20)',
  success: '#10B981',
  successLight: 'rgba(16,185,129,0.10)',
  successBorder: 'rgba(16,185,129,0.20)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.10)',
  warningBorder: 'rgba(245,158,11,0.20)',
  info: '#3B82F6',
  infoLight: 'rgba(59,130,246,0.10)',
  divider: 'rgba(0,0,0,0.06)',
  dividerStrong: 'rgba(0,0,0,0.12)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.2)',
  scrim: 'rgba(255,255,255,0.85)',
  tabBg: '#FFFFFF',
  tabBorder: 'rgba(0,0,0,0.06)',
  tabActive: '#FF6B35',
  tabInactive: '#000000ff',
  gradientAccentStart: '#FF6B35',
  gradientAccentEnd: '#FF3E8A',
  gradientIncomeStart: '#0D9488',
  gradientIncomeEnd: '#14B8A6',
  gradientCardStart: '#FFFFFF',
  gradientCardEnd: '#F9FAFB',
};

export const getThemeColors = (theme) => theme === 'light' ? LightColors : DarkColors;

export const useTheme = () => {
  const { settings } = useApp();
  return useMemo(() => getThemeColors(settings?.theme), [settings?.theme]);
};

// ─── Gradients (pre-defined arrays for LinearGradient) ──────────────────────
export const Gradients = {
  accent: ['#FF6B35', '#FF3E8A'],
  accentSubtle: ['rgba(255,107,53,0.22)', 'rgba(255,62,138,0.10)'],
  income: ['#3DD6C8', '#2B9E9A'],
  incomeSubtle: ['rgba(61,214,200,0.18)', 'rgba(43,158,154,0.08)'],
  surface: ['#1C1E32', '#12132080'],
  card: ['#1A1C2E', '#161727'],
  dark: ['#0E0F1A', '#161727'],
  danger: ['#FF4C6A', '#C0392B'],
  success: ['#2ECC8E', '#1A9E6C'],
  overlay: ['rgba(14,15,26,0)', 'rgba(14,15,26,0.95)'],
  shimmer: ['rgba(255,255,255,0.00)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.00)'],
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = {
  // Space Mono — numbers, amounts, codes
  mono: 'SpaceMono-Regular',
  monoBold: 'SpaceMono-Bold',

  // Outfit — UI labels, body, headings
  light: 'Outfit-Light',
  regular: 'Outfit-Regular',
  medium: 'Outfit-Medium',
  semiBold: 'Outfit-SemiBold',
  bold: 'Outfit-Bold',
  extraBold: 'Outfit-ExtraBold',
};

// ─── Type Scale ───────────────────────────────────────────────────────────────
export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  hero: 44,
};

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  section: 56,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  full: 999,
};

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadow = {
  // Standard card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 10,
  },
  // Subtle lift
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  // Strong modal/sheet
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.40,
    shadowRadius: 28,
    elevation: 18,
  },
  // Accent-colored glow
  accent: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  // Income glow
  income: {
    shadowColor: '#3DD6C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 8,
  },
  // Danger glow
  danger: {
    shadowColor: '#FF4C6A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
};

// ─── Animation Presets ────────────────────────────────────────────────────────
export const Animation = {
  // Durations (ms)
  fast: 150,
  base: 250,
  slow: 380,
  verySlow: 560,

  // Spring configs (for Animated.spring)
  springSnappy: { tension: 180, friction: 14, useNativeDriver: true },
  springBouncy: { tension: 120, friction: 8, useNativeDriver: true },
  springSmooth: { tension: 80, friction: 12, useNativeDriver: true },

  // Active press scale
  pressScale: 0.96,
  pressScaleSubtle: 0.98,
};

// ─── Opacity Scale ───────────────────────────────────────────────────────────
export const Opacity = {
  disabled: 0.38,
  placeholder: 0.5,
  secondary: 0.65,
  dim: 0.75,
  full: 1,
};

// ─── Z-Index ─────────────────────────────────────────────────────────────────
export const ZIndex = {
  base: 0,
  card: 1,
  dropdown: 10,
  overlay: 20,
  modal: 30,
  toast: 40,
  tooltip: 50,
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const CATEGORIES = [
  {
    id: 'grocery',
    label: 'Grocery',
    shortLabel: 'Grocery',
    icon: 'shopping-cart',
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.14)',
    border: 'rgba(255,107,107,0.28)',
    gradient: ['#FF6B6B', '#FF4757'],
  },
  {
    id: 'food',
    label: 'Food & Dining',
    shortLabel: 'Food',
    icon: 'restaurant',
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.14)',
    border: 'rgba(255,107,107,0.28)',
    gradient: ['#FF6B6B', '#FF4757'],
  },
  {
    id: 'fuel',
    label: 'Fuel',
    shortLabel: 'Fuel',
    icon: 'local-gas-station',
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.14)',
    border: 'rgba(255,107,107,0.28)',
    gradient: ['#FF6B6B', '#FF4757'],
  },
  {
    id: 'transport',
    label: 'Transport',
    shortLabel: 'Transport',
    icon: 'directions-car',
    color: '#3DD6C8',
    bg: 'rgba(61,214,200,0.14)',
    border: 'rgba(61,214,200,0.28)',
    gradient: ['#3DD6C8', '#2B9E9A'],
  },
  {
    id: 'shopping',
    label: 'Shopping',
    shortLabel: 'Shopping',
    icon: 'shopping-bag',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.14)',
    border: 'rgba(167,139,250,0.28)',
    gradient: ['#A78BFA', '#7C3AED'],
  },
  {
    id: 'health',
    label: 'Health & Wellness',
    shortLabel: 'Health',
    icon: 'favorite',
    color: '#FF4C6A',
    bg: 'rgba(255,76,106,0.14)',
    border: 'rgba(255,76,106,0.28)',
    gradient: ['#FF4C6A', '#C0392B'],
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    shortLabel: 'Fun',
    icon: 'movie',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.14)',
    border: 'rgba(245,166,35,0.28)',
    gradient: ['#F5A623', '#E67E22'],
  },
  {
    id: 'bills',
    label: 'Bills & Utilities',
    shortLabel: 'Bills',
    icon: 'receipt',
    color: '#5B9CF6',
    bg: 'rgba(91,156,246,0.14)',
    border: 'rgba(91,156,246,0.28)',
    gradient: ['#5B9CF6', '#2563EB'],
  },
  {
    id: 'salary',
    label: 'Salary & Income',
    shortLabel: 'Salary',
    icon: 'attach-money',
    color: '#2ECC8E',
    bg: 'rgba(46,204,142,0.14)',
    border: 'rgba(46,204,142,0.28)',
    gradient: ['#2ECC8E', '#1A9E6C'],
  },
  {
    id: 'education',
    label: 'Education',
    shortLabel: 'Education',
    icon: 'school',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.14)',
    border: 'rgba(56,189,248,0.28)',
    gradient: ['#38BDF8', '#0284C7'],
  },
  {
    id: 'travel',
    label: 'Travel',
    shortLabel: 'Travel',
    icon: 'flight',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.14)',
    border: 'rgba(251,146,60,0.28)',
    gradient: ['#FB923C', '#EA580C'],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    shortLabel: 'Subs',
    icon: 'subscriptions',
    color: '#E879F9',
    bg: 'rgba(232,121,249,0.14)',
    border: 'rgba(232,121,249,0.28)',
    gradient: ['#E879F9', '#A21CAF'],
  },
  {
    id: 'other',
    label: 'Other',
    shortLabel: 'Other',
    icon: 'more-horiz',
    color: '#7E8CA4',
    bg: 'rgba(126,140,164,0.14)',
    border: 'rgba(126,140,164,0.28)',
    gradient: ['#7E8CA4', '#4A5568'],
  },
];

export const getCategoryById = (id) =>
  CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns a consistent status color set for a given semantic state.
 * @param {'success'|'warning'|'danger'|'info'|'income'|'expense'} status
 */
export const getStatusColors = (status, Colors) => {
  const map = {
    success: { color: Colors.success, bg: Colors.successLight, border: Colors.successBorder },
    warning: { color: Colors.warning, bg: Colors.warningLight, border: Colors.warningBorder },
    danger: { color: Colors.danger, bg: Colors.dangerLight, border: Colors.dangerBorder },
    info: { color: Colors.info, bg: Colors.infoLight, border: 'rgba(91,156,246,0.28)' },
    income: { color: Colors.income, bg: Colors.incomeLight, border: Colors.incomeBorder },
    expense: { color: Colors.expense, bg: Colors.expenseLight, border: Colors.expenseBorder },
  };
  return map[status] ?? map.info;
};

/**
 * Returns the budget health status based on % used.
 * @param {number} pct — 0–100+
 */
export const getBudgetStatus = (pct) => {
  if (pct >= 100) return { status: 'danger', label: 'Over budget', icon: 'warning' };
  if (pct >= 85) return { status: 'warning', label: 'Almost full', icon: 'warning-amber' };
  if (pct >= 60) return { status: 'info', label: `${Math.round(pct)}% used`, icon: 'info' };
  return { status: 'success', label: `${Math.round(pct)}% used`, icon: 'check-circle' };
};

/**
 * Returns a hex color for a given transaction type.
 */
export const getTransactionColor = (type, Colors) =>
  type === 'income' ? Colors.income : Colors.accent;