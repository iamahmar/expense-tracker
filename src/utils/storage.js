// utils/storage.js — AsyncStorage helpers for full offline persistence
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TRANSACTIONS:  '@expense_tracker/transactions',
  SETTINGS:      '@expense_tracker/settings',
  LAYERS:        '@expense_tracker/layers',
  ACTIVE_LAYER:  '@expense_tracker/active_layer',
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

// Delete all transactions belonging to a specific layer
export const deleteLayerTransactions = async (layerId) => {
  const existing = await loadTransactions();
  const updated = existing.filter(t => t.layerId !== layerId);
  await saveTransactions(updated);
  return updated;
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
  await AsyncStorage.multiRemove([
    KEYS.TRANSACTIONS, KEYS.SETTINGS, KEYS.LAYERS, KEYS.ACTIVE_LAYER,
  ]);
};

// ─── Layers ───────────────────────────────────────────────────────────────────

const DEFAULT_LAYER = {
  id: 'layer_default',
  name: 'Personal',
  icon: 'account-balance-wallet',
  color: '#6366F1',
  monthlyBudget: 50000,
  currency: '₹',
  currencyCode: 'INR',
  createdAt: new Date().toISOString(),
};

export const loadLayers = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAYERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.length > 0 ? parsed : [DEFAULT_LAYER];
    }
    // First launch — seed default layer
    await saveLayers([DEFAULT_LAYER]);
    return [DEFAULT_LAYER];
  } catch (e) {
    console.error('loadLayers error:', e);
    return [DEFAULT_LAYER];
  }
};

export const saveLayers = async (layers) => {
  try {
    await AsyncStorage.setItem(KEYS.LAYERS, JSON.stringify(layers));
  } catch (e) {
    console.error('saveLayers error:', e);
  }
};

export const addLayer = async (layer) => {
  const existing = await loadLayers();
  const updated = [...existing, layer];
  await saveLayers(updated);
  return updated;
};

export const updateLayer = async (updatedLayer) => {
  const existing = await loadLayers();
  const updated = existing.map(l => (l.id === updatedLayer.id ? updatedLayer : l));
  await saveLayers(updated);
  return updated;
};

export const deleteLayer = async (layerId) => {
  const existing = await loadLayers();
  // Cannot delete the last layer
  if (existing.length <= 1) return existing;
  const updated = existing.filter(l => l.id !== layerId);
  await saveLayers(updated);
  return updated;
};

export const loadActiveLayerId = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.ACTIVE_LAYER);
  } catch (e) {
    return null;
  }
};

export const saveActiveLayerId = async (id) => {
  try {
    await AsyncStorage.setItem(KEYS.ACTIVE_LAYER, id);
  } catch (e) {
    console.error('saveActiveLayerId error:', e);
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const generateId = (prefix = 'txn') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const generateLayerId = () => generateId('layer');

export const CURRENCIES = [
  { code: 'INR', symbol: '₹',  label: 'Indian Rupee' },
  { code: 'USD', symbol: '$',  label: 'US Dollar'     },
  { code: 'EUR', symbol: '€',  label: 'Euro'          },
  { code: 'GBP', symbol: '£',  label: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham'   },
  { code: 'JPY', symbol: '¥',  label: 'Japanese Yen'  },
];

// Preset layer icons
export const LAYER_ICONS = [
  'account-balance-wallet', 'shopping-cart', 'home', 'local-hospital',
  'directions-car', 'school', 'flight', 'restaurant',
  'fitness-center', 'work', 'beach-access', 'pets',
  'child-care', 'business-center', 'savings', 'credit-card',
];

// Preset layer colors
export const LAYER_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#06B6D4', '#3B82F6', '#84CC16', '#F43F5E',
];
