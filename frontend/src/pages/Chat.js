import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

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
                  <div key={lineIndex} className="mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
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

const Chat = ({ selectedCapital }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/ai/chat', {
        message: inputMessage,
      });

      const aiMessage = {
        role: 'assistant',
        content: response.data.response || 'Извините, не удалось получить ответ.',
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      const errorMessage = err.response?.data?.error || 'Ошибка при обращении к ИИ';
      setError(errorMessage);
      const aiMessage = {
        role: 'assistant',
        content: `❌ ${errorMessage}`,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-180px)] flex flex-col bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ИИ-Ассистент</h3>
            <p className="text-xs text-gray-500">
              {selectedCapital ? selectedCapital.name : 'Выберите капитал'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Задайте вопрос</h4>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Спросите о просроченных платежах, клиентах, статистике или любых данных из вашей CRM
            </p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <div className="text-sm leading-relaxed">{formatAIMessage(msg.content)}</div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200/50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;

