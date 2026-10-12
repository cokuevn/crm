import React, { useState, useEffect } from 'react';
import organizationService from '../lib/services/organizationService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  PlusIcon,
  UsersIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const ROLE_LABELS = {
  owner: 'Владелец',
  admin: 'Администратор',
  manager: 'Менеджер',
  viewer: 'Наблюдатель'
};

const DEPARTMENT_LABELS = {
  collections: 'Работа с просрочками',
  sales: 'Продажи',
  analytics: 'Аналитика',
  finance: 'Финансы',
  general: 'Общий'
};

const ROLE_PERMISSIONS = {
  owner: ['*'],
  admin: [
    'clients.*', 'payments.*', 'capitals.view', 'capitals.view_balance',
    'expenses.view', 'expenses.create', 'analytics.*', 'tasks.*',
    'members.view', 'members.invite', 'members.edit'
  ],
  manager: [
    'clients.view_assigned', 'clients.edit',
    'payments.view', 'payments.create',
    'capitals.view',
    'analytics.view_basic',
    'tasks.view_assigned', 'tasks.manage_assigned'
  ],
  viewer: [
    'clients.view', 'payments.view', 'capitals.view',
    'expenses.view', 'analytics.view_basic', 'tasks.view'
  ]
};

export default function OrganizationMembers() {
  const [orgId, setOrgId] = useState(null);
  const [members, setMembers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [formData, setFormData] = useState({
    user_email: '',
    role: 'manager',
    department: 'general',
    permissions: [],
    position: '',
    phone: ''
  });

  useEffect(() => {
    // Получаем orgId из localStorage
    const savedOrgId = localStorage.getItem('selectedOrgId');
    if (savedOrgId) {
      setOrgId(savedOrgId);
    }
  }, []);

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgData, membersData] = await Promise.all([
        organizationService.getOrganization(orgId),
        organizationService.getMembers(orgId)
      ]);
      setOrganization(orgData);
      setMembers(membersData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      alert('Не удалось загрузить данные: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      const permissions = formData.permissions.length > 0
        ? formData.permissions
        : ROLE_PERMISSIONS[formData.role] || [];

      const newMember = await organizationService.inviteMember(orgId, {
        user_email: formData.user_email,
        role: formData.role,
        department: formData.department,
        permissions,
        metadata: {
          position: formData.position,
          phone: formData.phone,
          hire_date: new Date().toISOString().split('T')[0]
        }
      });

      setMembers([...members, newMember]);
      setShowInviteModal(false);
      resetForm();
    } catch (error) {
      console.error('Ошибка приглашения менеджера:', error);
      alert('Не удалось пригласить менеджера: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    try {
      const updated = await organizationService.updateMember(orgId, selectedMember.id, {
        role: formData.role,
        department: formData.department,
        permissions: formData.permissions.length > 0 ? formData.permissions : undefined,
        metadata: {
          position: formData.position,
          phone: formData.phone
        }
      });

      setMembers(members.map(m => m.id === selectedMember.id ? updated : m));
      setShowEditModal(false);
      setSelectedMember(null);
      resetForm();
    } catch (error) {
      console.error('Ошибка обновления менеджера:', error);
      alert('Не удалось обновить менеджера: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Удалить ${member.user_email || 'этого менеджера'}?`)) {
      return;
    }

    try {
      await organizationService.removeMember(orgId, member.id);
      setMembers(members.filter(m => m.id !== member.id));
    } catch (error) {
      console.error('Ошибка удаления менеджера:', error);
      alert('Не удалось удалить менеджера: ' + (error.response?.data?.detail || error.message));
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      user_email: member.user_email || '',
      role: member.role,
      department: member.department || 'general',
      permissions: member.permissions || [],
      position: member.metadata?.position || '',
      phone: member.metadata?.phone || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      user_email: '',
      role: 'manager',
      department: 'general',
      permissions: [],
      position: '',
      phone: ''
    });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      manager: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[role] || colors.viewer;
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => {
            window.location.hash = 'organizations';
            window.dispatchEvent(new CustomEvent('page-change', { detail: 'organizations' }));
          }}
          variant="secondary"
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Назад к организациям
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              Менеджеры
            </h1>
            {organization && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {organization.name}
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Пригласить менеджера
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 gap-4">
        {members.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {member.user_display_name || member.user_email}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <EnvelopeIcon className="h-4 w-4" />
                      {member.user_email}
                    </div>

                    {member.department && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Отдел:</span>{' '}
                        {DEPARTMENT_LABELS[member.department] || member.department}
                      </div>
                    )}

                    {member.metadata?.position && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Должность:</span>{' '}
                        {member.metadata.position}
                      </div>
                    )}

                    {member.metadata?.phone && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Телефон:</span>{' '}
                        {member.metadata.phone}
                      </div>
                    )}

                    {member.permissions && member.permissions.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 col-span-full">
                        <span className="font-medium flex items-center gap-1">
                          <ShieldCheckIcon className="h-4 w-4" />
                          Разрешения:
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {member.permissions.slice(0, 5).map((perm, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              {perm}
                            </span>
                          ))}
                          {member.permissions.length > 5 && (
                            <span className="text-xs text-gray-500">
                              +{member.permissions.length - 5} еще
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {member.role !== 'owner' && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => openEditModal(member)}
                      variant="secondary"
                      className="p-2"
                      title="Редактировать"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleRemoveMember(member)}
                      variant="danger"
                      className="p-2"
                      title="Удалить"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {members.length === 0 && (
        <Card className="text-center py-12">
          <UsersIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Нет менеджеров
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Пригласите первого менеджера для начала работы
          </p>
          <Button
            onClick={() => setShowInviteModal(true)}
            variant="primary"
          >
            Пригласить менеджера
          </Button>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          resetForm();
        }}
        title="Пригласить Менеджера"
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.user_email}
              onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="manager@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Роль *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
                <option value="viewer">Наблюдатель</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Отдел
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="general">Общий</option>
                <option value="collections">Работа с просрочками</option>
                <option value="sales">Продажи</option>
                <option value="analytics">Аналитика</option>
                <option value="finance">Финансы</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Должность
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Менеджер по просрочкам"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="+996 555 123 456"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => {
                setShowInviteModal(false);
                resetForm();
              }}
              variant="secondary"
            >
              Отмена
            </Button>
            <Button type="submit" variant="primary">
              Пригласить
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedMember(null);
          resetForm();
        }}
        title="Редактировать Менеджера"
      >
        <form onSubmit={handleUpdateMember} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Роль *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
                <option value="viewer">Наблюдатель</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Отдел
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="general">Общий</option>
                <option value="collections">Работа с просрочками</option>
                <option value="sales">Продажи</option>
                <option value="analytics">Аналитика</option>
                <option value="finance">Финансы</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Должность
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Менеджер по просрочкам"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="+996 555 123 456"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setSelectedMember(null);
                resetForm();
              }}
              variant="secondary"
            >
              Отмена
            </Button>
            <Button type="submit" variant="primary">
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

