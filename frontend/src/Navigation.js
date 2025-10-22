import React, { useCallback, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Icons from './components/ui/Icons';
import Button from './components/ui/Button';
import AnimatedActionMenu from './components/ui/AnimatedActionMenu';

// Navigation Component  
const Navigation = ({ currentPage, onPageChange, capitals, selectedCapital, onCapitalChange, onShowAddCapital, onShowImport, onShowBalanceModal, onDeleteCapital, onMigrateContractDates, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useAuth();

  const goDashboard = useCallback(() => onPageChange('dashboard'), [onPageChange]);
  const goAnalytics = useCallback(() => onPageChange('analytics'), [onPageChange]);
  const goExpenses = useCallback(() => onPageChange('expenses'), [onPageChange]);
  const goAddClient = useCallback(() => onPageChange('add-client'), [onPageChange]);

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 sticky top-0 z-40 transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Top row: Brand on left, user on right */}
        <div className="flex justify-between items-center h-12">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">CRM Рассрочка</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <button
              onClick={toggleDarkMode}
              className="touch-safe p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={darkMode ? 'Светлая тема' : 'Темная тема'}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <span className="hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={onLogout}>Выйти</Button>
          </div>
        </div>

        {/* Bottom row: Navigation left, actions (with capital controls) right */}
        <div className="flex justify-between items-center h-14">
          {/* Left: main nav */}
          <div className="flex items-center">
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button onClick={goDashboard} variant={currentPage === 'dashboard' ? 'primary' : 'ghost'} size="md" iconSize="sm" className={currentPage === 'dashboard' ? 'shadow-md shadow-blue-500/20' : ''} leadingIcon={<Icons.NavDashboard />}>Дашборд</Button>
              <Button onClick={goAnalytics} variant={currentPage === 'analytics' ? 'primary' : 'ghost'} size="md" iconSize="sm" className={currentPage === 'analytics' ? 'shadow-md shadow-blue-500/20' : ''} leadingIcon={<Icons.NavAnalytics />}>Аналитика</Button>
              <Button onClick={goExpenses} variant={currentPage === 'expenses' ? 'primary' : 'ghost'} size="md" iconSize="sm" className={currentPage === 'expenses' ? 'shadow-md shadow-blue-500/20' : ''} leadingIcon={<Icons.NavExpenses />}>Расходы</Button>
              <Button onClick={goAddClient} variant={currentPage === 'add-client' ? 'primary' : 'ghost'} size="md" iconSize="sm" className={currentPage === 'add-client' ? 'shadow-md shadow-blue-500/20' : ''} leadingIcon={<Icons.Plus />}>Клиент</Button>
            </div>
          </div>

          {/* Right: Capital selector + Balance + Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Capital selector with delete button */}
            {capitals.length > 0 && (
              <div className="hidden md:flex items-center gap-2">
                <select
                  value={selectedCapital?.id || ''}
                  onChange={(e) => {
                    const capital = capitals.find(c => c.id === e.target.value);
                    onCapitalChange(capital);
                  }}
                  className="px-3 h-9 text-sm border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[220px] appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="">Выберите капитал</option>
                  {capitals.map((capital) => (
                    <option key={capital.id} value={capital.id}>
                      {capital.name}
                    </option>
                  ))}
                </select>
                {selectedCapital && (
                  <button
                    onClick={onDeleteCapital}
                    className="inline-flex items-center justify-center h-9 w-9 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-colors"
                    title="Удалить капитал"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                )}
              </div>
            )}

            {selectedCapital && (
              <button
                onClick={() => onShowBalanceModal(selectedCapital)}
                className="hidden md:inline-flex items-center gap-2 h-9 px-3 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors shadow-sm"
                title="Управление балансом"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/20 text-amber-600">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"/></svg>
                </span>
                {selectedCapital.balance?.toLocaleString('ru-RU')} ₽
              </button>
            )}

            {/* Animated Action Menu */}
            <div className="flex items-center">
              <AnimatedActionMenu 
                onShowImport={onShowImport}
                onMigrateContractDates={onMigrateContractDates}
                onShowAddCapital={onShowAddCapital}
                selectedCapital={selectedCapital}
              />
            </div>

            {/* (User moved to top row) */}

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
              className={`flex items-center space-x-3 w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Дашборд</span>
            </button>
            <button
              onClick={() => {
                onPageChange('analytics');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-3 w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'analytics'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Аналитика</span>
            </button>
            <button
              onClick={() => {
                onPageChange('expenses');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-3 w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'expenses'
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Расходы</span>
            </button>
            <button
              onClick={() => {
                onPageChange('add-client');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-3 w-full text-left px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                currentPage === 'add-client'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>Добавить клиента</span>
            </button>
            
            {/* Mobile Capital Selector */}
            {capitals.length > 0 && (
              <div className="mb-4 border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Выберите капитал</label>
                <select
                  value={selectedCapital?.id || ''}
                  onChange={(e) => {
                    const capital = capitals.find(c => c.id === e.target.value);
                    onCapitalChange(capital);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="">Выберите капитал</option>
                  {capitals.map((capital) => (
                    <option key={capital.id} value={capital.id}>
                      {capital.name}
                    </option>
                  ))}
                </select>
                {selectedCapital && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Баланс: {selectedCapital.balance?.toLocaleString('ru-RU')} ₽
                      </span>
                      <button
                        onClick={() => {
                          onDeleteCapital();
                          setIsMobileMenuOpen(false);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Удалить капитал"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        onShowBalanceModal(selectedCapital);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"/>
                      </svg>
                      <span>Управление балансом</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Action Buttons */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <button
                onClick={() => {
                  onShowImport();
                  setIsMobileMenuOpen(false);
                }}
                disabled={!selectedCapital}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-xl transition-all ${
                  !selectedCapital 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Импорт</span>
              </button>
              <button
                onClick={() => {
                  onShowAddCapital();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-xl transition-all text-gray-600 hover:text-green-700 hover:bg-green-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Капитал</span>
              </button>
              <button
                onClick={() => {
                  onMigrateContractDates();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-xl transition-all text-gray-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Миграция</span>
              </button>
            </div>
            
            {/* Removed mobile capital selector/balance to match simplified header */}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;