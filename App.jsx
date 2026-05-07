// App.jsx — Entry point
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import { LayerProvider } from './src/context/LayerContext';

export default function App() {
  return (
    <AppProvider>
      <LayerProvider>
        <AppNavigator />
      </LayerProvider>
    </AppProvider>
  );
}
