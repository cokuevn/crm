/**
 * Сервис для работы с организациями и менеджерами
 */

import { apiClient } from '../apiClient';

const organizationService = {
  // ============================================================================
  // ORGANIZATIONS
  // ============================================================================

  /**
   * Получить мои организации
   */
  async getMyOrganizations() {
    const response = await apiClient.get('/api/organizations/my');
    return response.data;
  },

  /**
   * Создать новую организацию
   */
  async createOrganization(data) {
    const response = await apiClient.post('/api/organizations', data);
    return response.data;
  },

  /**
   * Получить организацию по ID
   */
  async getOrganization(orgId) {
    const response = await apiClient.get(`/api/organizations/${orgId}`);
    return response.data;
  },

  /**
   * Обновить организацию
   */
  async updateOrganization(orgId, data) {
    const response = await apiClient.put(`/api/organizations/${orgId}`, data, {
      headers: {
        'X-Organization-ID': orgId
      }
    });
    return response.data;
  },

  // ============================================================================
  // ORGANIZATION MEMBERS
  // ============================================================================

  /**
   * Получить членов организации
   */
  async getMembers(orgId) {
    const response = await apiClient.get(`/api/organizations/${orgId}/members`, {
      headers: {
        'X-Organization-ID': orgId
      }
    });
    return response.data;
  },

  /**
   * Пригласить менеджера
   */
  async inviteMember(orgId, data) {
    const response = await apiClient.post(`/api/organizations/${orgId}/members`, data, {
      headers: {
        'X-Organization-ID': orgId
      }
    });
    return response.data;
  },

  /**
   * Обновить менеджера
   */
  async updateMember(orgId, memberId, data) {
    const response = await apiClient.put(`/api/organizations/${orgId}/members/${memberId}`, data, {
      headers: {
        'X-Organization-ID': orgId
      }
    });
    return response.data;
  },

  /**
   * Удалить менеджера
   */
  async removeMember(orgId, memberId) {
    const response = await apiClient.delete(`/api/organizations/${orgId}/members/${memberId}`, {
      headers: {
        'X-Organization-ID': orgId
      }
    });
    return response.data;
  },

  // ============================================================================
  // TASKS
  // ============================================================================

  /**
   * Получить задачи
   */
  async getTasks(orgId, params = {}) {
    const response = await apiClient.get('/api/tasks', {
      params,
      headers: orgId ? {
        'X-Organization-ID': orgId
      } : {}
    });
    return response.data;
  },

  /**
   * Создать задачу
   */
  async createTask(orgId, data) {
    const response = await apiClient.post('/api/tasks', data, {
      headers: {
        'X-Organization-ID': orgId
      }
    });
    return response.data;
  },

  /**
   * Получить задачу по ID
   */
  async getTask(orgId, taskId) {
    const response = await apiClient.get(`/api/tasks/${taskId}`, {
      headers: orgId ? {
        'X-Organization-ID': orgId
      } : {}
    });
    return response.data;
  },

  /**
   * Обновить задачу
   */
  async updateTask(orgId, taskId, data) {
    const response = await apiClient.put(`/api/tasks/${taskId}`, data, {
      headers: orgId ? {
        'X-Organization-ID': orgId
      } : {}
    });
    return response.data;
  },

  /**
   * Добавить комментарий к задаче
   */
  async addTaskComment(orgId, taskId, commentText) {
    const response = await apiClient.post(`/api/tasks/${taskId}/comments`, null, {
      params: { comment_text: commentText },
      headers: orgId ? {
        'X-Organization-ID': orgId
      } : {}
    });
    return response.data;
  },

  /**
   * Завершить задачу
   */
  async completeTask(orgId, taskId, result) {
    const response = await apiClient.post(`/api/tasks/${taskId}/complete`, result, {
      headers: orgId ? {
        'X-Organization-ID': orgId
      } : {}
    });
    return response.data;
  }
};

export default organizationService;

