import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import AuthScreen from '../auth/AuthScreen';
import Header from './Header';
import Navigation from './Navigation';
import Dashboard from '../dashboard/Dashboard';
import Analytics from '../analytics/Analytics';
import Expenses from '../expenses/Expenses';
import LoadingSpinner from '../common/LoadingSpinner';
import { PAGES } from '../../constants/api';

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentPage, loading, loadCapitals, autoInit } = useApp();

  useEffect(() => {
    if (user) {
      // Auto-initialize if needed and load capitals
      const initializeApp = async () => {
        try {
          await autoInit();
          await loadCapitals();
        } catch (error) {
          console.error('Failed to initialize app:', error);
        }
      };
      
      initializeApp();
    }
  }, [user, autoInit, loadCapitals]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show auth screen if user is not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // Render main application content
  const renderCurrentPage = () => {
    switch (currentPage) {
      case PAGES.DASHBOARD:
        return <Dashboard />;
      case PAGES.ANALYTICS:
        return <Analytics />;
      case PAGES.EXPENSES:
        return <Expenses />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation />
      
      <main className="pt-16 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            renderCurrentPage()
          )}
        </div>
      </main>
    </div>
  );
};

export default AppContent;