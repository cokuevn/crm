import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import organizationService from '../lib/services/organizationService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import {
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PhoneIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';

const TASK_TYPE_LABELS = {
  collection: 'Работа с просрочками',
  evaluation: 'Оценка клиентов',
  call: 'Звонок',
  visit: 'Визит',
  follow_up: 'Повторная связь',
  other: 'Другое'
};

const PRIORITY_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный'
};

const STATUS_LABELS = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  completed: 'Завершена',
  cancelled: 'Отменена'
};

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [stats, setStats] = useState({
    total_tasks: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    assigned_clients: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Получить организации
      const orgs = await organizationService.getMyOrganizations();
      setOrganizations(orgs);
      
      if (orgs.length > 0) {
        setCurrentOrg(orgs[0]);
        
        // Получить задачи менеджера
        const tasks = await organizationService.getTasks(orgs[0].id, {
          assigned_to_me: true
        });
        
        setMyTasks(tasks);
        
        // Подсчитать статистику
        const stats = {
          total_tasks: tasks.length,
          pending: tasks.filter(t => t.status === 'pending').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          completed: tasks.filter(t => t.status === 'completed').length,
          assigned_clients: tasks.reduce((sum, t) => sum + (t.related_clients?.length || 0), 0)
        };
        
        setStats(stats);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      await organizationService.updateTask(currentOrg.id, taskId, {
        status: 'in_progress'
      });
      await loadData();
    } catch (error) {
      console.error('Ошибка запуска задачи:', error);
      alert('Не удалось начать задачу: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-600 bg-gray-100 dark:bg-gray-700',
      medium: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
      high: 'text-orange-600 bg-orange-100 dark:bg-orange-900',
      urgent: 'text-red-600 bg-red-100 dark:bg-red-900'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
      in_progress: 'text-blue-600 bg-blue-100 dark:bg-blue-900',
      completed: 'text-green-600 bg-green-100 dark:bg-green-900',
      cancelled: 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    };
    return colors[status] || colors.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="text-center py-12">
          <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Вы еще не добавлены ни в одну организацию
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Обратитесь к администратору для получения доступа
          </p>
        </Card>
      </div>
    );
  }

  const activeTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Добро пожаловать, {user?.displayName || user?.email}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {currentOrg?.name} · {currentOrg?.my_role === 'manager' ? 'Менеджер' : currentOrg?.my_role}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">
                  Всего Задач
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {stats.total_tasks}
                </p>
              </div>
              <ClipboardDocumentListIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 opacity-50" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">
                  Ожидают
                </p>
                <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {stats.pending}
                </p>
              </div>
              <ClockIcon className="h-12 w-12 text-yellow-600 dark:text-yellow-400 opacity-50" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">
                  В Работе
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {stats.in_progress}
                </p>
              </div>
              <ExclamationCircleIcon className="h-12 w-12 text-purple-600 dark:text-purple-400 opacity-50" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                  Завершено
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {stats.completed}
                </p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400 opacity-50" />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Tasks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Активные Задачи
          </h2>
          <Button
            onClick={() => {
              window.location.hash = 'tasks';
              window.dispatchEvent(new CustomEvent('page-change', { detail: 'tasks' }));
            }}
            variant="secondary"
          >
            Все задачи →
          </Button>
        </div>

        {activeTasks.length === 0 ? (
          <Card className="text-center py-12">
            <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Нет активных задач
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Отличная работа! Все задачи выполнены.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeTasks.map((task) => (
              <Card key={task.task_id} className="hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {STATUS_LABELS[task.status]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Тип:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {TASK_TYPE_LABELS[task.type]}
                      </span>
                    </div>

                    {task.due_date && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Срок:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {new Date(task.due_date).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    )}

                    {task.related_clients && task.related_clients.length > 0 && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Клиентов:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {task.related_clients.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {task.status === 'pending' && (
                    <Button
                      onClick={() => handleStartTask(task.task_id)}
                      variant="primary"
                      className="w-full"
                    >
                      Начать работу
                    </Button>
                  )}

                  {task.status === 'in_progress' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          window.location.hash = 'tasks';
                          window.dispatchEvent(new CustomEvent('page-change', { detail: 'tasks' }));
                        }}
                        variant="primary"
                        className="flex-1"
                      >
                        Продолжить работу
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            window.location.hash = 'tasks';
            window.dispatchEvent(new CustomEvent('page-change', { detail: 'tasks' }));
          }}
        >
          <div className="p-6 text-center">
            <ClipboardDocumentListIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Мои Задачи
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Просмотр всех задач и заданий
            </p>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            window.location.hash = 'dashboard';
            window.dispatchEvent(new CustomEvent('page-change', { detail: 'dashboard' }));
          }}
        >
          <div className="p-6 text-center">
            <UserGroupIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Мои Клиенты
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Назначенные мне клиенты
            </p>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            window.location.hash = 'analytics';
            window.dispatchEvent(new CustomEvent('page-change', { detail: 'analytics' }));
          }}
        >
          <div className="p-6 text-center">
            <ChatBubbleLeftIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Моя Статистика
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Результаты моей работы
            </p>
          </div>
        </Card>
      </div>

      {/* Tips for Manager */}
      <Card className="mt-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 Полезные Советы
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Проверяйте задачи ежедневно и обновляйте их статус</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Добавляйте комментарии к задачам для отслеживания прогресса</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Фиксируйте результаты работы с клиентами в журнале активности</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Завершайте задачи с подробными результатами для аналитики</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
}

