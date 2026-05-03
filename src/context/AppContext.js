// context/AppContext.js — Global state with AsyncStorage sync
import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import {
  loadTransactions,
  loadSettings,
  addTransaction as storageAdd,
  deleteTransaction as storageDelete,
  saveSettings,
  clearAllData,
  updateTransaction as storageUpdate,
} from '../utils/storage';

const AppContext = createContext(null);

const initialState = {
  transactions: [],
  settings: {
    monthlyBudget: 50000,
    currency: '₹',
    currencyCode: 'INR',
    theme: 'dark',
  },
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, transactions: action.transactions, settings: action.settings, loading: false };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.transactions };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Boot — load everything from AsyncStorage
  useEffect(() => {
    (async () => {
      const [transactions, settings] = await Promise.all([
        loadTransactions(),
        loadSettings(),
      ]);
      dispatch({ type: 'INIT', transactions, settings });
    })();
  }, []);

  const addTransaction = useCallback(async (txn) => {
    const updated = await storageAdd(txn);
    dispatch({ type: 'SET_TRANSACTIONS', transactions: updated });
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    const updated = await storageDelete(id);
    dispatch({ type: 'SET_TRANSACTIONS', transactions: updated });
  }, []);

  const updateTransaction = useCallback(async (txn) => {
    const updated = await storageUpdate(txn);
    dispatch({ type: 'SET_TRANSACTIONS', transactions: updated });
  }, []);

  const updateSettings = useCallback(async (settings) => {
    const merged = { ...state.settings, ...settings };
    await saveSettings(merged);
    dispatch({ type: 'SET_SETTINGS', settings });
  }, [state.settings]);

  const clearData = useCallback(async () => {
    await clearAllData();
    dispatch({ type: 'INIT', transactions: [], settings: initialState.settings });
  }, []);

  return (
    <AppContext.Provider value={{
      ...state,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      updateSettings,
      clearData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
