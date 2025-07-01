import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';

const Header = () => {
  const { user, logout } = useAuth();
  const { capitals, selectedCapital, selectCapital } = useApp();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">CRM Рассрочка</h1>
            </div>
          </div>

          {/* Capital selector and user menu */}
          <div className="flex items-center space-x-4">
            {/* Capital selector */}
            {capitals.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Капитал:</span>
                <select
                  value={selectedCapital?.id || ''}
                  onChange={(e) => {
                    const capital = capitals.find(c => c.id === e.target.value);
                    selectCapital(capital);
                  }}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {capitals.map(capital => (
                    <option key={capital.id} value={capital.id}>
                      {capital.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <span className="text-gray-900">{user?.email}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;