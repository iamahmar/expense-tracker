// utils/helpers.js
export const formatAmount = (amount, currency = '₹') => {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${currency}0`;
  // Indian lakh/crore formatting for INR
  if (currency === '₹') {
    if (num >= 10000000) return `${currency}${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000)   return `${currency}${(num / 100000).toFixed(1)}L`;
    if (num >= 1000)     return `${currency}${(num / 1000).toFixed(1)}K`;
  }
  return `${currency}${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export const formatAmountFull = (amount, currency = '₹') => {
  const num = parseFloat(amount);
  if (isNaN(num)) return `${currency}0.00`;
  return `${currency}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(d, today)) return 'Today';
  if (isSameDay(d, yesterday)) return 'Yesterday';

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateShort = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const formatMonthYear = (date) => {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export const isThisWeek = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
};

export const isThisMonth = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

export const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end   = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
};

export const filterByMonth = (transactions, month) => {
  const { start, end } = getMonthRange(month);
  return transactions.filter(t => {
    const d = new Date(t.date);
    return d >= start && d <= end;
  });
};

export const groupByDay = (transactions) => {
  const groups = {};
  transactions.forEach(t => {
    const key = new Date(t.date).toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
};

export const getDailyTotals = (transactions, month) => {
  const { start, end } = getMonthRange(month);
  const daysInMonth = end.getDate();
  const totals = Array(daysInMonth).fill(0);

  transactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    })
    .forEach(t => {
      const day = new Date(t.date).getDate() - 1;
      totals[day] += parseFloat(t.amount);
    });

  return totals;
};

export const getCategoryTotals = (transactions) => {
  const totals = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + parseFloat(t.amount);
    });
  return totals;
};
