// context/LayerContext.js — Multi-wallet "layer" state with AsyncStorage sync
import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import {
  loadLayers,
  addLayer as storageAddLayer,
  updateLayer as storageUpdateLayer,
  deleteLayer as storageDeleteLayer,
  loadActiveLayerId,
  saveActiveLayerId,
  deleteLayerTransactions,
  deleteLayerCategoryBudgets,
} from '../utils/storage';
import { useApp } from './AppContext';
import { useCategoryBudgets } from './CategoryBudgetContext';

const LayerContext = createContext(null);

const initialState = {
  layers: [],
  activeLayerId: null,
  layersLoading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, layers: action.layers, activeLayerId: action.activeLayerId, layersLoading: false };
    case 'SET_LAYERS':
      return { ...state, layers: action.layers };
    case 'SET_ACTIVE':
      return { ...state, activeLayerId: action.activeLayerId };
    default:
      return state;
  }
}

export function LayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { refreshTransactions } = useApp();
  const { refreshBudgets } = useCategoryBudgets();

  useEffect(() => {
    (async () => {
      const layers = await loadLayers();
      const storedActiveId = await loadActiveLayerId();
      const activeLayerId = layers.some(l => l.id === storedActiveId) ? storedActiveId : layers[0]?.id ?? null;
      dispatch({ type: 'INIT', layers, activeLayerId });
    })();
  }, []);

  const createLayer = useCallback(async (layer) => {
    const updated = await storageAddLayer(layer);
    dispatch({ type: 'SET_LAYERS', layers: updated });
    await saveActiveLayerId(layer.id);
    dispatch({ type: 'SET_ACTIVE', activeLayerId: layer.id });
  }, []);

  const editLayer = useCallback(async (layer) => {
    const updated = await storageUpdateLayer(layer);
    dispatch({ type: 'SET_LAYERS', layers: updated });
  }, []);

  const removeLayer = useCallback(async (layerId) => {
    const updated = await storageDeleteLayer(layerId);
    dispatch({ type: 'SET_LAYERS', layers: updated });
    await deleteLayerTransactions(layerId);
    await deleteLayerCategoryBudgets(layerId);
    await refreshTransactions();
    await refreshBudgets();

    if (state.activeLayerId === layerId) {
      const nextId = updated[0]?.id ?? null;
      await saveActiveLayerId(nextId);
      dispatch({ type: 'SET_ACTIVE', activeLayerId: nextId });
    }
  }, [state.activeLayerId, refreshTransactions, refreshBudgets]);

  const switchLayer = useCallback(async (layerId) => {
    await saveActiveLayerId(layerId);
    dispatch({ type: 'SET_ACTIVE', activeLayerId: layerId });
  }, []);

  const activeLayer = state.layers.find(l => l.id === state.activeLayerId) ?? null;

  return (
    <LayerContext.Provider value={{
      layers: state.layers,
      activeLayer,
      activeLayerId: state.activeLayerId,
      layersLoading: state.layersLoading,
      createLayer,
      editLayer,
      removeLayer,
      switchLayer,
    }}>
      {children}
    </LayerContext.Provider>
  );
}

export const useLayers = () => {
  const ctx = useContext(LayerContext);
  if (!ctx) throw new Error('useLayers must be inside LayerProvider');
  return ctx;
};
