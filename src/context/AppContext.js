// context/AppContext.js — Global state with AsyncStorage sync + layer-scoping
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
  allTransactions: [],   // entire transaction store across all layers
  settings: {
    currency: '₹',
    currencyCode: 'INR',
    theme: 'dark',
  },
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return {
        ...state,
        allTransactions: action.transactions,
        settings: action.settings,
        loading: false,
      };
    case 'SET_TRANSACTIONS':
      return { ...state, allTransactions: action.transactions };
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

  // Notify context when layer transactions are removed externally
  const refreshTransactions = useCallback(async () => {
    const transactions = await loadTransactions();
    dispatch({ type: 'SET_TRANSACTIONS', transactions });
  }, []);

  return (
    <AppContext.Provider value={{
      allTransactions: state.allTransactions,
      // Backwards-compat alias — components that use `transactions` still work
      // (they'll get all transactions; filtering by layerId happens at screen level)
      transactions: state.allTransactions,
      settings: state.settings,
      loading: state.loading,
      addTransaction,
      deleteTransaction,
      updateTransaction,
      updateSettings,
      clearData,
      refreshTransactions,
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
