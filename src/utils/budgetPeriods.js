// utils/budgetPeriods.js — Period math + forecasting for category-level budgets
//
// A category budget is independent of the monthly budget. It runs over one of
// several period types, optionally recurring, and can be scoped to a custom
// date range or run for a lifetime.

export const PERIODS = [
  { key: 'weekly',    label: 'Weekly',      short: '/wk',   icon: 'view-week',       recurringDefault: true  },
  { key: 'biweekly',  label: 'Bi-weekly',   short: '/2wk',  icon: 'date-range',      recurringDefault: true  },
  { key: 'monthly',   label: 'Monthly',     short: '/mo',   icon: 'calendar-today',  recurringDefault: true  },
  { key: 'quarterly', label: 'Quarterly',   short: '/qtr',  icon: 'calendar-month',  recurringDefault: true  },
  { key: 'yearly',    label: 'Yearly',      short: '/yr',   icon: 'event',           recurringDefault: true  },
  { key: 'custom',    label: 'Custom Range',short: '',      icon: 'tune',            recurringDefault: false },
  { key: 'lifetime',  label: 'Lifetime',    short: '∞',     icon: 'all-inclusive',   recurringDefault: false },
];

export const getPeriodMeta = (key) =>
  PERIODS.find(p => p.key === key) ?? PERIODS[2];

const DAY_MS = 86400000;

// Zero out the time component so window boundaries land on calendar days —
// transaction dates are day-only (midnight), so anchors must match or a
// same-day expense recorded before the budget's creation time gets excluded.
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// Advance a date by exactly one period of the given type (calendar-aware).
const advance = (date, period) => {
  const d = new Date(date);
  switch (period) {
    case 'weekly':    d.setDate(d.getDate() + 7);  break;
    case 'biweekly':  d.setDate(d.getDate() + 14); break;
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly':    d.setFullYear(d.getFullYear() + 1); break;
    default:          d.setMonth(d.getMonth() + 1); break;
  }
  return d;
};

/**
 * Resolve the active window [start, end) for a budget at a given moment.
 * Returns { start: Date, end: Date|null, expired: bool, upcoming: bool }.
 * `end` is null for lifetime budgets (no upper bound).
 */
export const getBudgetWindow = (budget, now = new Date()) => {
  const anchor = startOfDay(budget.anchorDate ?? budget.createdAt ?? now);

  if (budget.period === 'lifetime') {
    return { start: anchor, end: null, expired: false, upcoming: false };
  }

  if (budget.period === 'custom') {
    const start = anchor;
    const end   = budget.endDate ? endOfDay(budget.endDate) : null;
    return {
      start,
      end,
      expired:  end ? now > end : false,
      upcoming: now < start,
    };
  }

  // Fixed-length recurring/one-time periods.
  if (!budget.recurring) {
    const start = anchor;
    const end   = advance(anchor, budget.period);
    return { start, end, expired: now > end, upcoming: now < start };
  }

  // Recurring — walk forward from the anchor to the window containing `now`.
  let start = new Date(anchor);
  if (now >= anchor) {
    let guard = 0;
    while (guard++ < 10000) {
      const next = advance(start, budget.period);
      if (next <= now) start = next;
      else break;
    }
  }
  const end = advance(start, budget.period);
  return { start, end, expired: false, upcoming: now < anchor };
};

/**
 * Sum of matching expense transactions inside the active window.
 * `txns` should already be scoped to the relevant layer.
 */
export const getSpentInWindow = (budget, txns, now = new Date()) => {
  const { start, end } = getBudgetWindow(budget, now);
  // A lifetime budget tracks all spending in its category, so it has no lower
  // bound — expenses recorded before the budget was created still count.
  const isLifetime = budget.period === 'lifetime';
  return txns.reduce((sum, t) => {
    if (t.type !== 'expense') return sum;
    if (t.category !== budget.category) return sum;
    const d = new Date(t.date);
    if (!isLifetime && d < start) return sum;
    if (end && d >= end) return sum;
    return sum + parseFloat(t.amount || 0);
  }, 0);
};

/**
 * Full computed status for a budget — the single source of truth for the UI.
 */
export const getBudgetStats = (budget, txns, now = new Date()) => {
  const window = getBudgetWindow(budget, now);
  const spent  = getSpentInWindow(budget, txns, now);
  const amount = parseFloat(budget.amount || 0);
  const remaining = amount - spent;
  const pct = amount > 0 ? (spent / amount) * 100 : 0;

  // Elapsed fraction of the current period (for pacing + forecast).
  let elapsedFraction = 0;
  let daysLeft = null;
  if (window.end) {
    const total   = window.end - window.start;
    const elapsed = Math.min(Math.max(now - window.start, 0), total);
    elapsedFraction = total > 0 ? elapsed / total : 0;
    daysLeft = Math.max(0, Math.ceil((window.end - now) / DAY_MS));
  }

  // Forecast end-of-period spend by linear projection of the current pace.
  const forecast = elapsedFraction > 0.02
    ? spent / elapsedFraction
    : spent;
  const predictedOverspend = window.end != null && forecast > amount && amount > 0;

  return {
    ...window,
    spent,
    amount,
    remaining,
    pct,
    over: spent > amount && amount > 0,
    elapsedFraction,
    daysLeft,
    forecast,
    predictedOverspend,
    // Expiring soon = a bounded window with 3 or fewer days left.
    expiringSoon: window.end != null && daysLeft != null && daysLeft <= 3 && !window.expired,
  };
};

/**
 * Alert level for a budget's current consumption.
 * Returns null when nothing noteworthy is happening.
 */
export const getBudgetAlert = (stats) => {
  if (stats.expired)            return { key: 'expired',  level: 'muted',   label: 'Period ended',    icon: 'history' };
  if (stats.over)               return { key: 'over',     level: 'danger',  label: 'Over budget',     icon: 'error' };
  if (stats.predictedOverspend) return { key: 'predict',  level: 'warning', label: 'Trending over',   icon: 'trending-up' };
  if (stats.pct >= 80)          return { key: '80',       level: 'warning', label: '80% used',        icon: 'warning-amber' };
  if (stats.expiringSoon)       return { key: 'expiring', level: 'info',    label: 'Expiring soon',   icon: 'schedule' };
  if (stats.pct >= 50)          return { key: '50',       level: 'info',    label: 'Halfway',         icon: 'info' };
  return null;
};

/** Human label for the active window, e.g. "1 Jul – 31 Jul" or "Lifetime". */
export const formatWindowLabel = (budget, now = new Date()) => {
  const { start, end } = getBudgetWindow(budget, now);
  if (budget.period === 'lifetime') return 'Lifetime';
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (!end) return `From ${fmt(start)}`;
  return `${fmt(start)} – ${fmt(new Date(end.getTime() - 1))}`;
};
