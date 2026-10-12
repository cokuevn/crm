import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import organizationService from '../lib/services/organizationService';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PlusIcon, BuildingOfficeIcon, Cog6ToothIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function Organizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    timezone: 'Asia/Bishkek',
    currency: 'KGS',
    allow_negative_balance: true
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationService.getMyOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('Ошибка загрузки организаций:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    
    // Проверяем роль пользователя
    const hasOwnerOrg = organizations.some(org => org.my_role === 'owner' || org.my_role === 'admin');
    const isManager = organizations.some(org => org.my_role === 'manager');
    
    if (isManager && !hasOwnerOrg) {
      alert('Менеджеры не могут создавать организации. Обратитесь к администратору.');
      return;
    }
    
    try {
      const newOrg = await organizationService.createOrganization({
        name: formData.name,
        settings: {
          timezone: formData.timezone,
          currency: formData.currency,
          allow_negative_balance: formData.allow_negative_balance,
          features: {
            tasks: true,
            analytics: true,
            ai_chat: false
          }
        }
      });
      
      setOrganizations([...organizations, newOrg]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        timezone: 'Asia/Bishkek',
        currency: 'KGS',
        allow_negative_balance: true
      });
    } catch (error) {
      console.error('Ошибка создания организации:', error);
      alert('Не удалось создать организацию: ' + (error.response?.data?.detail || error.message));
    }
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

  const getRoleLabel = (role) => {
    const labels = {
      owner: 'Владелец',
      admin: 'Администратор',
      manager: 'Менеджер',
      viewer: 'Наблюдатель'
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка организаций...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
              Мои Организации
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Управление компаниями и командами
            </p>
          </div>
          {(!organizations.some(org => org.my_role === 'manager') || 
            organizations.some(org => org.my_role === 'owner' || org.my_role === 'admin')) && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Создать организацию
            </Button>
          )}
        </div>
      </div>

      {/* Organizations List */}
      {organizations.length === 0 ? (
        <Card className="text-center py-12">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Нет организаций
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Создайте свою первую организацию для начала работы
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          >
            Создать организацию
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Organization Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {org.name}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(org.my_role)}`}>
                      {getRoleLabel(org.my_role)}
                    </span>
                  </div>
                  <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
                </div>

                {/* Organization Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Валюта</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {org.settings?.currency || 'USD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Часовой пояс</p>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {org.settings?.timezone || 'UTC'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={() => {
                      // Сохраняем ID организации и переключаем страницу
                      localStorage.setItem('selectedOrgId', org.id);
                      window.location.hash = 'organization-members';
                      window.dispatchEvent(new CustomEvent('page-change', { detail: 'organization-members' }));
                    }}
                    variant="secondary"
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <UsersIcon className="h-4 w-4" />
                    Менеджеры
                  </Button>
                  {(org.my_role === 'owner' || org.my_role === 'admin') && (
                    <Button
                      onClick={() => {
                        alert('Настройки организации будут доступны в следующей версии');
                      }}
                      variant="secondary"
                      className="flex items-center justify-center gap-2"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Настройки
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Organization Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать Организацию"
      >
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название организации *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="ООО Рассрочка Плюс"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Валюта
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="KGS">KGS (сом)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="RUB">RUB (₽)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Часовой пояс
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Asia/Bishkek">Asia/Bishkek</option>
                <option value="Asia/Almaty">Asia/Almaty</option>
                <option value="Europe/Moscow">Europe/Moscow</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="allow_negative_balance"
              checked={formData.allow_negative_balance}
              onChange={(e) => setFormData({ ...formData, allow_negative_balance: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allow_negative_balance" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Разрешить отрицательный баланс
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowCreateModal(false)}
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
    </div>
  );
}

