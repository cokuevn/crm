import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../../lib/apiClient';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../lib/api';

const formatInlineText = (text) => {
  if (!text) return '';
  let formatted = text.replace(/\*\*(.*?)\*\*/g, (m, p1) => `<strong class="font-semibold text-gray-900">${p1}</strong>`);
  formatted = formatted.replace(/(\d{1,3}(?:,\d{3})*|\d+)₽/g, (m) => `<span class="font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-200">${m}</span>`);
  formatted = formatted.replace(/(тел:\s*[\d\s\-\+\(\)]+)/g, (m) => `<span class="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md text-sm border border-blue-200">${m}</span>`);
  formatted = formatted.replace(/(\d+\s*дн[ейя].*просрочк)/g, (m) => `<span class="font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-200">${m}</span>`);
  formatted = formatted.replace(/(ID:\s*[\w\-]+)/g, (m) => `<span class="font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md text-sm border border-purple-200">${m}</span>`);
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
};

const formatAIMessage = (content) => {
  if (!content) return '';
  const sections = content.split('\n\n');
  return sections.map((section, sectionIndex) => {
    if (section.includes('Найдено') && section.includes('₽')) {
      return (
        <div key={sectionIndex} className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-semibold text-blue-700">📊 Сводка</span>
          </div>
          <p className="text-blue-800 font-medium">{section}</p>
        </div>
      );
    }
    const lines = section.split('\n');
    const listLines = lines.filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'));
    if (listLines.length > 0) {
      return (
        <div key={sectionIndex} className="mb-4">
          {lines.map((line, lineIndex) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
              const text = trimmed.substring(1).trim();
              if (text.includes('₽') && (text.includes('тел:') || text.includes('дней'))) {
                return (
                  <div key={lineIndex} className="mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-relaxed">{formatInlineText(text)}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={lineIndex} className="flex items-start space-x-2 mb-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{formatInlineText(text)}</span>
                </div>
              );
            }
            if (trimmed && !trimmed.startsWith('-') && !trimmed.startsWith('•')) {
              if (trimmed.match(/^[🔍📊💡📈🎯⚠️💰].+/) || trimmed === trimmed.toUpperCase()) {
                return (
                  <h4 key={lineIndex} className="font-semibold text-gray-900 mb-2 text-base">
                    {trimmed}
                  </h4>
                );
              }
              return (
                <p key={lineIndex} className="text-gray-700 mb-2 leading-relaxed">
                  {formatInlineText(trimmed)}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return (
      <p key={sectionIndex} className="text-gray-700 mb-3 leading-relaxed">
        {formatInlineText(section)}
      </p>
    );
  });
};

const AIChat = ({ selectedCapital }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          type: 'ai',
          content: `👋 Привет! Я ваш ИИ-ассистент CRM системы.\n\n🚀 **Мои возможности:**\n\n• 🔍 **Поиск клиентов** - найду любого клиента по имени или телефону\n• 📊 **Анализ просрочек** - покажу проблемные платежи с приоритизацией  \n• 📈 **Аналитика** - предоставлю статистику по вашим капиталам\n• 💡 **Умные рекомендации** - помогу оптимизировать работу с рассрочкой\n\nЗадавайте любые вопросы о ваших данных! \nЯ работаю быстро и предоставляю структурированные ответы. ⚡`,
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage = { id: Date.now(), type: 'user', content: inputMessage, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');
    try {
      const response = await apiClient.post(`/api/ai/chat`, { message: inputMessage });
      if (response.data.error) throw new Error(response.data.error);
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date(),
        functionUsed: response.data.function_used,
        functionResult: response.data.function_result,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Ошибка при отправке сообщения');
      const errorMessage = { id: Date.now() + 1, type: 'error', content: `Извините, произошла ошибка: ${err.response?.data?.detail || err.message || 'Не удалось получить ответ'}`, timestamp: new Date() };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Открыть ИИ-ассистент"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 z-50 flex-col hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ИИ-Ассистент</h3>
            <p className="text-xs text-gray-500">CRM помощник</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setMessages([{ id: Date.now(), type: 'ai', content: '👋 Чат очищен! Чем могу помочь?', timestamp: new Date() }])} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-colors" title="Очистить чат">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100/50 transition-colors" title="Закрыть чат">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
        {messages.map((message, index) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className={`max-w-[85%] ${message.type === 'user' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-2xl shadow-lg' : message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200 p-3 rounded-2xl' : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-gray-200/50 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300'}`}>
              {message.type === 'user' && <div className="text-sm leading-relaxed font-medium">{message.content}</div>}
              {message.type === 'ai' && (
                <div className="p-3">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">ИИ-Ассистент</span>
                  </div>
                  <div className="text-sm leading-relaxed">{formatAIMessage(message.content)}</div>
                  {message.functionUsed && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">Использована функция: {message.functionUsed}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {message.type === 'error' && (
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm leading-relaxed">{message.content}</div>
                </div>
              )}
              <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-white/70' : 'text-gray-400'} flex justify-end`}>
                {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 p-4 rounded-2xl shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="typing-indicator mb-1"><span></span><span></span><span></span></div>
                  <span className="text-xs text-gray-500 font-medium">ИИ анализирует данные...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200/50">
        {error && <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg"><p className="text-xs text-red-600">{error}</p></div>}
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Спросите что-нибудь о ваших клиентах..." className="w-full px-3 py-2 border border-gray-200/50 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-50/50" rows={1} disabled={isLoading} />
          </div>
          <button onClick={sendMessage} disabled={!inputMessage.trim() || isLoading} className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { text: '📊 Просроченные платежи', icon: '📊' },
            { text: '🔍 Найти клиента', icon: '🔍' },
            { text: '📈 Аналитика', icon: '📈' },
            { text: '💰 Статистика доходов', icon: '💰' },
          ].map((s, i) => (
            <button key={i} onClick={() => setInputMessage(s.text.substring(2).trim())} className="group flex items-center space-x-1 px-3 py-1.5 text-xs bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 border border-gray-200 hover:border-blue-300 rounded-full transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>
              <span className="group-hover:animate-bounce">{s.icon}</span>
              <span className="text-gray-600 group-hover:text-blue-600 font-medium">{s.text.substring(2).trim()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIChat;

