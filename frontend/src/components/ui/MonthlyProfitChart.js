import React, { memo } from 'react';

const MonthlyProfitChart = ({ monthlyProfits = [] }) => {
  // Подготавливаем данные для графика
  const chartData = monthlyProfits.map(item => ({
    ...item,
    month: item.month || '',
    profit: item.profit || 0
  })).sort((a, b) => a.month.localeCompare(b.month));

  // Находим максимальное значение для масштабирования
  const maxProfit = Math.max(...chartData.map(item => item.profit), 0);
  const minProfit = Math.min(...chartData.map(item => item.profit), 0);
  const range = maxProfit - minProfit || 1;

  // Форматируем месяц для отображения
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Получаем цвет для столбца
  const getBarColor = (profit) => {
    if (profit > 0) return 'bg-green-500';
    if (profit < 0) return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Прибыль по месяцам</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-green-700 font-medium">Прибыль</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-red-700 font-medium">Убыток</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Нет данных</h4>
          <p className="text-gray-600">Данные о прибыли по месяцам появятся после добавления клиентов</p>
        </div>
      ) : (
        <>
          {/* График */}
          <div className="relative">
            <div className="h-64 flex items-end justify-between space-x-1 sm:space-x-2 mb-4 overflow-x-auto pb-4">
              {chartData.map((item, index) => {
                const height = Math.abs(item.profit) / range * 180; // Максимальная высота 180px
                const isPositive = item.profit >= 0;
                const minHeight = item.profit === 0 ? 2 : height; // Минимальная высота для нулевых значений
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                    {/* Столбец */}
                    <div className="relative w-full max-w-8 sm:max-w-12 mx-auto flex flex-col justify-end h-full">
                      <div
                        className={`w-full ${getBarColor(item.profit)} rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer ${item.profit === 0 ? 'opacity-30' : ''}`}
                        style={{ height: `${minHeight}px` }}
                        title={`${formatMonth(item.month)}: ${item.profit.toLocaleString('ru-RU')}₽`}
                      />
                    </div>
                    
                    {/* Подпись месяца */}
                    <div className="mt-2 text-xs text-gray-600 text-center transform -rotate-45 origin-center whitespace-nowrap">
                      {formatMonth(item.month)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ось Y */}
            <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-xs text-gray-500 -ml-8 sm:-ml-10">
              <span className="text-right">{maxProfit.toLocaleString('ru-RU')}₽</span>
              <span className="text-right">{Math.round((maxProfit + minProfit) / 2).toLocaleString('ru-RU')}₽</span>
              <span className="text-right">{minProfit.toLocaleString('ru-RU')}₽</span>
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {chartData.filter(item => item.profit > 0).length}
              </div>
              <div className="text-xs text-green-700">Месяцев с прибылью</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-xl font-bold text-red-600">
                {chartData.filter(item => item.profit < 0).length}
              </div>
              <div className="text-xs text-red-700">Месяцев с убытком</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {chartData.reduce((sum, item) => sum + item.profit, 0).toLocaleString('ru-RU')}₽
              </div>
              <div className="text-xs text-gray-700">Общая прибыль</div>
            </div>
          </div>

          {/* Таблица с деталями */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Детализация по месяцам</h4>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-600">Месяц</th>
                    <th className="text-right py-2 px-2 text-gray-600">Прибыль</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-2 text-gray-900">{formatMonth(item.month)}</td>
                      <td className={`py-2 px-2 text-right font-medium ${
                        item.profit > 0 ? 'text-green-600' : 
                        item.profit < 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {item.profit > 0 ? '+' : ''}{item.profit.toLocaleString('ru-RU')}₽
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(MonthlyProfitChart, (prevProps, nextProps) => {
  // Ререндер только если изменился массив monthlyProfits
  const prevLength = prevProps.monthlyProfits?.length || 0;
  const nextLength = nextProps.monthlyProfits?.length || 0;
  
  if (prevLength !== nextLength) return false;
  
  // Проверяем содержимое массива
  return prevProps.monthlyProfits?.every((item, index) => {
    const nextItem = nextProps.monthlyProfits?.[index];
    return item?.month === nextItem?.month && item?.profit === nextItem?.profit;
  }) ?? true;
});
