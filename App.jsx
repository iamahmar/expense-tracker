// App.jsx — Entry point
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import { LayerProvider } from './src/context/LayerContext';
import { CategoryBudgetProvider } from './src/context/CategoryBudgetContext';

export default function App() {
  return (
    <AppProvider>
      <CategoryBudgetProvider>
        <LayerProvider>
          <AppNavigator />
        </LayerProvider>
      </CategoryBudgetProvider>
    </AppProvider>
  );
}
