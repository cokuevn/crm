import React, { useCallback, useState, useMemo } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Users, BarChart3, CreditCard, UserPlus, Menu, X } from 'lucide-react';
import Icons from './components/ui/Icons';
import Button from './components/ui/Button';
import AnimatedActionMenu from './components/ui/AnimatedActionMenu';
import useAppStore from './store/useAppStore';

// Navigation Component  
const Navigation = ({ currentPage, onPageChange, capitals, selectedCapital, onCapitalChange, onShowAddCapital, onShowImport, onShowBalanceModal, onDeleteCapital, onMigrateContractDates, onMigratePaymentSchedules, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useAuth();
  const overdueCount = useAppStore((state) => state.overdueCount);

  const goDashboard = useCallback(() => {
    onPageChange('dashboard');
    setIsMobileMenuOpen(false);
  }, [onPageChange]);
  
  const goAnalytics = useCallback(() => {
    onPageChange('analytics');
    setIsMobileMenuOpen(false);
  }, [onPageChange]);
  
  const goExpenses = useCallback(() => {
    onPageChange('expenses');
    setIsMobileMenuOpen(false);
  }, [onPageChange]);
  
  const goAddClient = useCallback(() => {
    onPageChange('add-client');
    setIsMobileMenuOpen(false);
  }, [onPageChange]);

  return (
    <>
      {/* Desktop & Tablet Top Navigation */}
      <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 sticky top-0 z-40 transition-colors duration-300">
      <div className="px-4 sm:px-6 lg:px-8">
          {/* Top row: Brand on left, user/controls on right */}
        <div className="flex justify-between items-center h-12">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">CRM Рассрочка</h1>
            <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-600 dark:text-gray-300">
              {/* Capital Selector (mobile compact) */}
              {capitals.length > 0 && (
                <select
                  value={selectedCapital?.id || ''}
                  onChange={(e) => {
                    const capital = capitals.find(c => c.id === e.target.value);
                    onCapitalChange(capital);
                  }}
                  className="md:hidden px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:text-white appearance-none max-w-[120px]"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="">Капитал</option>
                  {capitals.map((capital) => (
                    <option key={capital.id} value={capital.id}>
                      {capital.name}
                    </option>
                  ))}
                </select>
              )}
              
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
              
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden touch-safe p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <span className="hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={onLogout} className="hidden sm:inline-flex">Выйти</Button>
          </div>
        </div>

        {/* Bottom row: Navigation left, actions (with capital controls) right - DESKTOP ONLY */}
        <div className="hidden md:flex justify-between items-center h-14">
          {/* Left: main nav */}
          <div className="flex items-center">
            {/* Desktop Navigation */}
            <div className="flex items-center gap-2">
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
                onMigratePaymentSchedules={onMigratePaymentSchedules}
                onShowAddCapital={onShowAddCapital}
                selectedCapital={selectedCapital}
              />
            </div>

          </div>
          </div>
        </div>

      </nav>

      {/* Mobile Drawer Menu (Hamburger) - вне nav для правильного z-index */}
        {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-[60] md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-[70] md:hidden overflow-y-auto transform transition-transform duration-300 ease-in-out">
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Меню</h3>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="touch-safe p-2">
                    <X size={20} className="text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                
                {/* User Info */}
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
            <button
              onClick={() => {
                      onLogout();
                setIsMobileMenuOpen(false);
              }}
                    className="mt-2 w-full py-2 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
                  >
                    Выйти
                  </button>
                </div>

                {/* Main Navigation Items */}
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    onClick={goDashboard}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all touch-safe ${
                currentPage === 'dashboard'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Users size={20} />
                    <span>Дашборд (Клиенты)</span>
                    {overdueCount > 0 && currentPage !== 'dashboard' && (
                      <span className="ml-auto bg-error-500 text-white text-xs font-bold rounded-full h-5 px-2 flex items-center">
                        {overdueCount}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={goAnalytics}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all touch-safe ${
                      currentPage === 'analytics'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <BarChart3 size={20} />
                    <span>Аналитика</span>
                  </button>
                  
                  <button
                    onClick={goExpenses}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all touch-safe ${
                      currentPage === 'expenses'
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <CreditCard size={20} />
                    <span>Расходы</span>
                  </button>
                  
                  <button
                    onClick={goAddClient}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all touch-safe ${
                      currentPage === 'add-client'
                        ? 'bg-success-500 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <UserPlus size={20} />
                    <span>Добавить клиента</span>
            </button>
                </div>

                {/* Capital Info & Management */}
                {selectedCapital && (
                  <div className="pb-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedCapital.name}
                      </span>
            <button
              onClick={() => {
                          onDeleteCapital();
                setIsMobileMenuOpen(false);
              }}
                        className="touch-safe p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Удалить капитал"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
            </button>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Баланс:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {selectedCapital.balance?.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
            <button
              onClick={() => {
                        onShowBalanceModal(selectedCapital);
                setIsMobileMenuOpen(false);
              }}
                      className="w-full py-2 px-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
                    >
                      Управление балансом
            </button>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
            <button
              onClick={() => {
                      onShowAddCapital();
                setIsMobileMenuOpen(false);
              }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400 transition-all touch-safe"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Создать капитал</span>
            </button>
            
              <button
                onClick={() => {
                  onShowImport();
                  setIsMobileMenuOpen(false);
                }}
                disabled={!selectedCapital}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all touch-safe ${
                  !selectedCapital 
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400'
                }`}
              >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                    <span>Импорт клиентов</span>
              </button>
                  
              <button
                onClick={() => {
                  onMigrateContractDates();
                  setIsMobileMenuOpen(false);
                }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400 transition-all touch-safe"
              >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                    <span>Миграция дат</span>
              </button>
                </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation (iOS/Android стиль) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 pb-safe">
        <div className="flex justify-around items-center py-2 px-2">
          {/* Dashboard Tab */}
          <button
            onClick={goDashboard}
            className={`flex flex-col items-center justify-center touch-safe px-3 py-2 rounded-lg transition-all ${
              currentPage === 'dashboard'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="relative">
              <Users size={24} strokeWidth={currentPage === 'dashboard' ? 2.5 : 2} />
              {overdueCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {overdueCount > 99 ? '99+' : overdueCount}
                </span>
              )}
            </div>
            <span className={`text-xs mt-1 font-medium ${currentPage === 'dashboard' ? 'text-primary-600 dark:text-primary-400' : ''}`}>
              Клиенты
            </span>
          </button>

          {/* Analytics Tab */}
          <button
            onClick={goAnalytics}
            className={`flex flex-col items-center justify-center touch-safe px-3 py-2 rounded-lg transition-all ${
              currentPage === 'analytics'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BarChart3 size={24} strokeWidth={currentPage === 'analytics' ? 2.5 : 2} />
            <span className={`text-xs mt-1 font-medium ${currentPage === 'analytics' ? 'text-primary-600 dark:text-primary-400' : ''}`}>
              Аналитика
            </span>
          </button>

          {/* Expenses Tab */}
          <button
            onClick={goExpenses}
            className={`flex flex-col items-center justify-center touch-safe px-3 py-2 rounded-lg transition-all ${
              currentPage === 'expenses'
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CreditCard size={24} strokeWidth={currentPage === 'expenses' ? 2.5 : 2} />
            <span className={`text-xs mt-1 font-medium ${currentPage === 'expenses' ? 'text-primary-600 dark:text-primary-400' : ''}`}>
              Расходы
            </span>
          </button>

          {/* Add Client Tab */}
          <button
            onClick={goAddClient}
            className={`flex flex-col items-center justify-center touch-safe px-3 py-2 rounded-lg transition-all ${
              currentPage === 'add-client'
                ? 'text-success-500 dark:text-success-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UserPlus size={24} strokeWidth={currentPage === 'add-client' ? 2.5 : 2} />
            <span className={`text-xs mt-1 font-medium ${currentPage === 'add-client' ? 'text-success-500 dark:text-success-400' : ''}`}>
              Клиент
            </span>
          </button>
      </div>
    </nav>
    </>
  );
};

export default Navigation;