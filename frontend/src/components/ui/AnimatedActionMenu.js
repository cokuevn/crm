import React, { useState } from 'react';
import Button from './Button';

const AnimatedActionMenu = ({ onShowImport, onMigrateContractDates, selectedCapital }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleImport = () => {
    onShowImport();
    setIsOpen(false);
  };

  const handleMigration = () => {
    onMigrateContractDates();
    setIsOpen(false);
  };

  return (
    <div className="relative group">
      {/* Main Menu Button */}
      <button
        onClick={toggleMenu}
        className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 overflow-hidden"
        title="Дополнительные действия"
      >
        {/* Animated Icon */}
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        
        {/* Shimmer Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 blur-sm opacity-0 group-hover:opacity-25 transition-opacity duration-300 -z-10"></div>
      </button>

      {/* Animated Menu Items */}
      <div className={`absolute right-0 top-12 z-50 transition-all duration-300 ease-out ${
        isOpen 
          ? 'opacity-100 visible transform translate-y-0 scale-100' 
          : 'opacity-0 invisible transform -translate-y-2 scale-95'
      }`}>
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-2 min-w-[200px] backdrop-blur-sm">
          {/* Import Button */}
          <button
            onClick={handleImport}
            disabled={!selectedCapital}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
              !selectedCapital 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm'
            }`}
            title={!selectedCapital ? 'Выберите капитал для импорта' : 'Импорт клиентов'}
            style={{
              animationDelay: isOpen ? '0ms' : '100ms',
              animation: isOpen ? 'slideInFromTop 0.3s ease-out forwards' : 'none'
            }}
          >
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">Импорт</div>
              <div className="text-sm text-gray-500">Импорт клиентов</div>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Divider */}
          <div className={`h-px bg-gray-200 my-2 transition-all duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}></div>

          {/* Migration Button */}
          <button
            onClick={handleMigration}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 text-gray-700 hover:bg-purple-50 hover:text-purple-700 hover:shadow-sm group"
            title="Обновить даты договоров для существующих клиентов"
            style={{
              animationDelay: isOpen ? '100ms' : '200ms',
              animation: isOpen ? 'slideInFromTop 0.3s ease-out forwards' : 'none'
            }}
          >
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">Миграция</div>
              <div className="text-sm text-gray-500">Обновить даты</div>
            </div>
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Arrow pointing to button */}
        <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45 shadow-sm"></div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInFromTop {
          0% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedActionMenu;
