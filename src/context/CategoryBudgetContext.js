// context/CategoryBudgetContext.js — Category-level budgets with AsyncStorage sync
//
// Independent of the monthly budget layer. Each budget belongs to a layer and a
// category, runs over a configurable period, and can be recurring or one-time.
import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import {
  loadCategoryBudgets,
  addCategoryBudget as storageAdd,
  updateCategoryBudget as storageUpdate,
  deleteCategoryBudget as storageDelete,
} from '../utils/storage';

const CategoryBudgetContext = createContext(null);

const initialState = { budgets: [], loading: true };

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':    return { budgets: action.budgets, loading: false };
    case 'SET':     return { ...state, budgets: action.budgets };
    default:        return state;
  }
}

export function CategoryBudgetProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    (async () => {
      const budgets = await loadCategoryBudgets();
      dispatch({ type: 'INIT', budgets });
    })();
  }, []);

  const createBudget = useCallback(async (budget) => {
    const updated = await storageAdd(budget);
    dispatch({ type: 'SET', budgets: updated });
  }, []);

  const editBudget = useCallback(async (budget) => {
    const updated = await storageUpdate(budget);
    dispatch({ type: 'SET', budgets: updated });
  }, []);

  const removeBudget = useCallback(async (id) => {
    const updated = await storageDelete(id);
    dispatch({ type: 'SET', budgets: updated });
  }, []);

  const refreshBudgets = useCallback(async () => {
    const budgets = await loadCategoryBudgets();
    dispatch({ type: 'SET', budgets });
  }, []);

  return (
    <CategoryBudgetContext.Provider value={{
      budgets: state.budgets,
      budgetsLoading: state.loading,
      createBudget,
      editBudget,
      removeBudget,
      refreshBudgets,
    }}>
      {children}
    </CategoryBudgetContext.Provider>
  );
}

export const useCategoryBudgets = () => {
  const ctx = useContext(CategoryBudgetContext);
  if (!ctx) throw new Error('useCategoryBudgets must be inside CategoryBudgetProvider');
  return ctx;
};
