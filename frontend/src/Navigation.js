import React, { useState } from 'react';

// Navigation Component  
const Navigation = ({ currentPage, onPageChange, capitals, selectedCapital, onCapitalChange, onShowAddCapital, onShowImport, onShowBalanceModal, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 mr-8">Рассрочка</h1>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => onPageChange('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentPage === 'dashboard'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                📊 Дашборд
              </button>
              <button
                onClick={() => onPageChange('analytics')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentPage === 'analytics'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                📈 Аналитика
              </button>
              <button
                onClick={() => onPageChange('expenses')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentPage === 'expenses'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                💸 Расходы
              </button>
              <button
                onClick={() => onPageChange('add-client')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  currentPage === 'add-client'
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                + Клиента
              </button>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2">
            {/* Capital selector */}
            {capitals.length > 0 && (
              <select
                value={selectedCapital?.id || ''}
                onChange={(e) => {
                  const capital = capitals.find(c => c.id === e.target.value);
                  onCapitalChange(capital);
                }}
                className="hidden md:block px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white max-w-48"
              >
                <option value="">Выберите капитал</option>
                {capitals.map((capital) => (
                  <option key={capital.id} value={capital.id}>
                    {capital.name} ({capital.balance?.toLocaleString('ru-RU')} ₽)
                  </option>
                ))}
              </select>
            )}

            {/* Balance button */}
            {selectedCapital && (
              <button
                onClick={() => onShowBalanceModal(selectedCapital)}
                className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                title="Управление балансом"
              >
                💰 {selectedCapital.balance?.toLocaleString('ru-RU')} ₽
              </button>
            )}

            <button
              onClick={onShowAddCapital}
              className="px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
            >
              + Капитал
            </button>
            
            <button
              onClick={onShowImport}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
              disabled={!selectedCapital}
              title={!selectedCapital ? "Выберите капитал для импорта" : "Импорт клиентов"}
            >
              📥 Импорт
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="hidden sm:block">{user?.email}</span>
              <button
                onClick={onLogout}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Выйти
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-2">
            <button
              onClick={() => {
                onPageChange('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📊 Дашборд
            </button>
            <button
              onClick={() => {
                onPageChange('analytics');
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'analytics'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              📈 Аналитика
            </button>
            <button
              onClick={() => {
                onPageChange('expenses');
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'expenses'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              💸 Расходы
            </button>
            <button
              onClick={() => {
                onPageChange('add-client');
                setIsMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'add-client'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              + Клиента
            </button>
            
            {/* Mobile capital selector */}
            {capitals.length > 0 && (
              <div className="px-3 py-2">
                <select
                  value={selectedCapital?.id || ''}
                  onChange={(e) => {
                    const capital = capitals.find(c => c.id === e.target.value);
                    onCapitalChange(capital);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Выберите капитал</option>
                  {capitals.map((capital) => (
                    <option key={capital.id} value={capital.id}>
                      {capital.name} ({capital.balance?.toLocaleString('ru-RU')} ₽)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mobile balance button */}
            {selectedCapital && (
              <button
                onClick={() => {
                  onShowBalanceModal(selectedCapital);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                💰 Баланс: {selectedCapital.balance?.toLocaleString('ru-RU')} ₽
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;