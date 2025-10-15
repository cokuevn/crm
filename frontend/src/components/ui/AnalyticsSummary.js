import React from 'react';

export default function AnalyticsSummary({ icon, bgColor = 'bg-blue-100', textColor = 'text-blue-600', label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5 lg:p-6">
      <div className="flex items-center gap-3">
        <div className={`shrink-0 p-2.5 rounded-xl ${bgColor}`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600 leading-tight">{label}</p>
          <p className={`text-xl sm:text-2xl font-bold ${textColor} tabular-nums`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

