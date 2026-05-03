// utils/storage.js — AsyncStorage helpers for full offline persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TRANSACTIONS: '@expense_tracker/transactions',
  SETTINGS:     '@expense_tracker/settings',
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const loadTransactions = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('loadTransactions error:', e);
    return [];
  }
};

export const saveTransactions = async (transactions) => {
  try {
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('saveTransactions error:', e);
  }
};

export const addTransaction = async (transaction) => {
  const existing = await loadTransactions();
  const updated = [transaction, ...existing];
  await saveTransactions(updated);
  return updated;
};

export const deleteTransaction = async (id) => {
  const existing = await loadTransactions();
  const updated = existing.filter(t => t.id !== id);
  await saveTransactions(updated);
  return updated;
};

export const updateTransaction = async (updatedTxn) => {
  const existing = await loadTransactions();
  const updated = existing.map(t => (t.id === updatedTxn.id ? updatedTxn : t));
  await saveTransactions(updated);
  return updated;
};

export const clearAllTransactions = async () => {
  await AsyncStorage.removeItem(KEYS.TRANSACTIONS);
};

// ─── Settings ─────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  monthlyBudget: 50000,
  currency: '₹',
  currencyCode: 'INR',
};

export const loadSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('saveSettings error:', e);
  }
};

export const clearAllData = async () => {
  await AsyncStorage.multiRemove([KEYS.TRANSACTIONS, KEYS.SETTINGS]);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const generateId = () =>
  `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const CURRENCIES = [
  { code: 'INR', symbol: '₹',  label: 'Indian Rupee' },
  { code: 'USD', symbol: '$',  label: 'US Dollar'     },
  { code: 'EUR', symbol: '€',  label: 'Euro'          },
  { code: 'GBP', symbol: '£',  label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham'   },
  { code: 'JPY', symbol: '¥',  label: 'Japanese Yen'  },
];
