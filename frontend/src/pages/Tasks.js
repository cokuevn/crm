import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import organizationService from '../lib/services/organizationService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftIcon,
  UserIcon
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

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, my, pending, in_progress, completed
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'collection',
    priority: 'medium',
    assigned_to: '',
    due_date: ''
  });
  const [completeFormData, setCompleteFormData] = useState({
    contacted: 0,
    promised_payment: 0,
    paid: 0,
    no_contact: 0,
    notes: ''
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      loadTasks();
      loadMembers();
    }
  }, [selectedOrg, filter]);

  const loadOrganizations = async () => {
    try {
      const data = await organizationService.getMyOrganizations();
      setOrganizations(data);
      if (data.length > 0) {
        setSelectedOrg(data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки организаций:', error);
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!selectedOrg) return;

    try {
      const params = {};
      if (filter === 'my') {
        params.assigned_to_me = true;
      } else if (filter !== 'all') {
        params.status = filter;
      }

      const data = await organizationService.getTasks(selectedOrg.id, params);
      setTasks(data);
    } catch (error) {
      console.error('Ошибка загрузки задач:', error);
    }
  };

  const loadMembers = async () => {
    if (!selectedOrg) return;

    try {
      const data = await organizationService.getMembers(selectedOrg.id);
      setMembers(data);
    } catch (error) {
      console.error('Ошибка загрузки менеджеров:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const newTask = await organizationService.createTask(selectedOrg.id, {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      });

      setTasks([newTask, ...tasks]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
      alert('Не удалось создать задачу: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const updated = await organizationService.updateTask(selectedOrg.id, taskId, {
        status: newStatus
      });

      setTasks(tasks.map(t => t.task_id === taskId ? updated : t));
      if (selectedTask && selectedTask.task_id === taskId) {
        setSelectedTask(updated);
      }
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
      alert('Не удалось обновить задачу: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !commentText.trim()) return;

    try {
      await organizationService.addTaskComment(selectedOrg.id, selectedTask.task_id, commentText);
      
      // Перезагрузить задачу
      const updated = await organizationService.getTask(selectedOrg.id, selectedTask.task_id);
      setSelectedTask(updated);
      setTasks(tasks.map(t => t.task_id === selectedTask.task_id ? updated : t));
      setCommentText('');
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      alert('Не удалось добавить комментарий: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleCompleteTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const updated = await organizationService.completeTask(
        selectedOrg.id,
        selectedTask.task_id,
        completeFormData
      );

      setTasks(tasks.map(t => t.task_id === selectedTask.task_id ? updated : t));
      setSelectedTask(updated);
      setCompleteFormData({
        contacted: 0,
        promised_payment: 0,
        paid: 0,
        no_contact: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Ошибка завершения задачи:', error);
      alert('Не удалось завершить задачу: ' + (error.response?.data?.detail || error.message));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'collection',
      priority: 'medium',
      assigned_to: '',
      due_date: ''
    });
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

  const getStatusIcon = (status) => {
    const icons = {
      pending: ClockIcon,
      in_progress: ExclamationCircleIcon,
      completed: CheckCircleIcon,
      cancelled: ClockIcon
    };
    const Icon = icons[status] || ClockIcon;
    return <Icon className="h-5 w-5" />;
  };

  const canCreateTasks = selectedOrg && (
    selectedOrg.my_role === 'owner' ||
    selectedOrg.my_role === 'admin' ||
    (selectedOrg.my_permissions && selectedOrg.my_permissions.includes('tasks.create'))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка задач...</p>
        </div>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="text-center py-12">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Нет доступных организаций
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Сначала создайте организацию или получите доступ к существующей
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
              Задачи
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Управление задачами и назначениями
            </p>
          </div>
          {canCreateTasks && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Создать задачу
            </Button>
          )}
        </div>

        {/* Organization Selector */}
        {organizations.length > 1 && (
          <div className="flex gap-2">
            <select
              value={selectedOrg?.id || ''}
              onChange={(e) => {
                const org = organizations.find(o => o.id === e.target.value);
                setSelectedOrg(org);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'primary' : 'secondary'}
          className="whitespace-nowrap"
        >
          Все задачи
        </Button>
        <Button
          onClick={() => setFilter('my')}
          variant={filter === 'my' ? 'primary' : 'secondary'}
          className="whitespace-nowrap"
        >
          Мои задачи
        </Button>
        <Button
          onClick={() => setFilter('pending')}
          variant={filter === 'pending' ? 'primary' : 'secondary'}
          className="whitespace-nowrap"
        >
          Ожидают
        </Button>
        <Button
          onClick={() => setFilter('in_progress')}
          variant={filter === 'in_progress' ? 'primary' : 'secondary'}
          className="whitespace-nowrap"
        >
          В работе
        </Button>
        <Button
          onClick={() => setFilter('completed')}
          variant={filter === 'completed' ? 'primary' : 'secondary'}
          className="whitespace-nowrap"
        >
          Завершенные
        </Button>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => {
          const assignedMember = members.find(m => m.user_id === task.assigned_to);
          const createdMember = members.find(m => m.user_id === task.created_by);

          return (
            <Card
              key={task.task_id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTask(task);
                setShowDetailsModal(true);
              }}
            >
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Тип:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {TASK_TYPE_LABELS[task.type]}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Назначена:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {assignedMember?.user_display_name || assignedMember?.user_email || 'Не назначена'}
                    </p>
                  </div>

                  {task.due_date && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Срок:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(task.due_date).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  )}

                  {task.related_clients && task.related_clients.length > 0 && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Клиентов:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {task.related_clients.length}
                      </p>
                    </div>
                  )}
                </div>

                {task.result && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Связано:</span>
                        <p className="font-medium">{task.result.contacted || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Обещали:</span>
                        <p className="font-medium">{task.result.promised_payment || 0}</p>
                      </div>
                      <div>
                        <span className="text-green-600">Оплатили:</span>
                        <p className="font-medium text-green-600">{task.result.paid || 0}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Нет связи:</span>
                        <p className="font-medium">{task.result.no_contact || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <Card className="text-center py-12">
          <ClipboardDocumentListIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Нет задач
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {canCreateTasks
              ? 'Создайте первую задачу для менеджера'
              : 'У вас пока нет назначенных задач'}
          </p>
        </Card>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Создать Задачу"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Обработать просрочки за январь"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows="3"
              placeholder="Связаться со всеми клиентами с просрочкой..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Тип *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Приоритет *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Назначить *
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Выберите менеджера</option>
                {members
                  .filter(m => m.role === 'manager' || m.role === 'admin')
                  .map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.user_display_name || member.user_email}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Срок выполнения
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              variant="secondary"
            >
              Отмена
            </Button>
            <Button type="submit" variant="primary">
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTask(null);
            setCommentText('');
          }}
          title={selectedTask.title}
          size="large"
        >
          <div className="space-y-6">
            {/* Task Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Статус:</span>
                <p className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTask.status)} ml-2`}>
                  {getStatusIcon(selectedTask.status)}
                  {STATUS_LABELS[selectedTask.status]}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Приоритет:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTask.priority)} ml-2`}>
                  {PRIORITY_LABELS[selectedTask.priority]}
                </span>
              </div>
            </div>

            {selectedTask.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Описание:</h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Status Actions */}
            {selectedTask.assigned_to === user?.uid && selectedTask.status !== 'completed' && (
              <div className="flex gap-2">
                {selectedTask.status === 'pending' && (
                  <Button
                    onClick={() => handleUpdateTaskStatus(selectedTask.task_id, 'in_progress')}
                    variant="primary"
                  >
                    Начать работу
                  </Button>
                )}
                {selectedTask.status === 'in_progress' && (
                  <Button
                    onClick={() => handleUpdateTaskStatus(selectedTask.task_id, 'pending')}
                    variant="secondary"
                  >
                    Вернуть в ожидание
                  </Button>
                )}
              </div>
            )}

            {/* Complete Task Form */}
            {selectedTask.assigned_to === user?.uid &&
             selectedTask.status === 'in_progress' &&
             !selectedTask.completed_at && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Завершить задачу
                </h4>
                <form onSubmit={handleCompleteTask} className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Связано</label>
                      <input
                        type="number"
                        value={completeFormData.contacted}
                        onChange={(e) => setCompleteFormData({ ...completeFormData, contacted: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Обещали</label>
                      <input
                        type="number"
                        value={completeFormData.promised_payment}
                        onChange={(e) => setCompleteFormData({ ...completeFormData, promised_payment: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-green-600 mb-1">Оплатили</label>
                      <input
                        type="number"
                        value={completeFormData.paid}
                        onChange={(e) => setCompleteFormData({ ...completeFormData, paid: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Нет связи</label>
                      <input
                        type="number"
                        value={completeFormData.no_contact}
                        onChange={(e) => setCompleteFormData({ ...completeFormData, no_contact: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Заметки</label>
                    <textarea
                      value={completeFormData.notes}
                      onChange={(e) => setCompleteFormData({ ...completeFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      rows="2"
                      placeholder="Итоги работы..."
                    />
                  </div>
                  <Button type="submit" variant="success" className="w-full">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Завершить задачу
                  </Button>
                </form>
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-5 w-5" />
                Комментарии
              </h4>

              {selectedTask.comments && selectedTask.comments.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {selectedTask.comments.map((comment, idx) => {
                    const commenter = members.find(m => m.user_id === comment.user_id);
                    return (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {commenter?.user_display_name || commenter?.user_email || 'Пользователь'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {comment.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">Нет комментариев</p>
              )}

              {selectedTask.status !== 'completed' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Добавить комментарий..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddComment}
                    variant="primary"
                    disabled={!commentText.trim()}
                  >
                    Отправить
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

