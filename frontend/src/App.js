import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import AppContent from './components/layout/AppContent';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="App">
          <AppContent />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;