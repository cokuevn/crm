# API Endpoints - Система Менеджеров

Полная документация всех API endpoints для системы управления организациями и менеджерами.

---

## Аутентификация

Все запросы требуют Firebase токен в заголовке:

```
Authorization: Bearer <firebase-token>
```

Для операций с конкретной организацией добавьте:

```
X-Organization-ID: <organization-id>
```

---

## Organizations

### GET /api/organizations/my

Получить список организаций, в которых состоит пользователь.

**Response:**
```json
[
  {
    "id": "org-uuid",
    "name": "ООО Рассрочка Плюс",
    "owner_id": "user-uid",
    "created_at": "2025-01-13T10:00:00Z",
    "updated_at": "2025-01-13T10:00:00Z",
    "settings": {
      "timezone": "Asia/Bishkek",
      "currency": "KGS",
      "allow_negative_balance": true,
      "features": {}
    },
    "is_active": true,
    "my_role": "owner",
    "my_permissions": ["*"]
  }
]
```

---

### POST /api/organizations

Создать новую организацию.

**Request Body:**
```json
{
  "name": "Моя Компания",
  "settings": {
    "timezone": "Asia/Bishkek",
    "currency": "KGS",
    "allow_negative_balance": true,
    "features": {
      "tasks": true,
      "analytics": true
    }
  }
}
```

**Response:**
```json
{
  "id": "new-org-uuid",
  "name": "Моя Компания",
  "owner_id": "current-user-uid",
  "created_at": "2025-01-13T10:00:00Z",
  "updated_at": "2025-01-13T10:00:00Z",
  "settings": { ... },
  "is_active": true
}
```

---

### GET /api/organizations/{org_id}

Получить информацию об организации.

**Response:**
```json
{
  "id": "org-uuid",
  "name": "ООО Рассрочка Плюс",
  ...
}
```

---

### PUT /api/organizations/{org_id}

Обновить организацию (требуется разрешение `members.edit`).

**Headers:**
```
X-Organization-ID: org-uuid
```

**Request Body:**
```json
{
  "name": "Новое Название",
  "settings": {
    "currency": "USD"
  }
}
```

---

## Organization Members

### GET /api/organizations/{org_id}/members

Получить список членов организации (требуется `members.view`).

**Headers:**
```
X-Organization-ID: org-uuid
```

**Response:**
```json
[
  {
    "id": "member-uuid",
    "organization_id": "org-uuid",
    "user_id": "user-uid",
    "role": "manager",
    "permissions": ["clients.view_all", "clients.edit"],
    "department": "collections",
    "assigned_capitals": [],
    "created_at": "2025-01-13T10:00:00Z",
    "created_by": "owner-uid",
    "is_active": true,
    "metadata": {
      "position": "Менеджер по просрочкам",
      "phone": "+996555123456"
    },
    "user_email": "manager@company.com",
    "user_display_name": "Иван Петров"
  }
]
```

---

### POST /api/organizations/{org_id}/members

Пригласить нового члена в организацию (требуется `members.invite`).

**Headers:**
```
X-Organization-ID: org-uuid
```

**Request Body:**
```json
{
  "user_email": "manager@company.com",
  "role": "manager",
  "permissions": [
    "clients.view_all",
    "clients.edit",
    "payments.view",
    "payments.create",
    "tasks.view_assigned",
    "tasks.manage_assigned"
  ],
  "department": "collections",
  "assigned_capitals": [],
  "metadata": {
    "position": "Менеджер по просрочкам",
    "phone": "+996555123456",
    "hire_date": "2025-01-01"
  }
}
```

**Response:**
```json
{
  "id": "new-member-uuid",
  "organization_id": "org-uuid",
  "user_id": "new-user-uid",
  "role": "manager",
  ...
}
```

---

### PUT /api/organizations/{org_id}/members/{member_id}

Обновить члена организации (требуется `members.edit`).

**Headers:**
```
X-Organization-ID: org-uuid
```

**Request Body:**
```json
{
  "role": "admin",
  "permissions": ["clients.*", "payments.*"],
  "department": "sales"
}
```

---

### DELETE /api/organizations/{org_id}/members/{member_id}

Удалить члена из организации (требуется `members.edit`).

**Headers:**
```
X-Organization-ID: org-uuid
```

**Response:**
```json
{
  "message": "Member removed successfully"
}
```

---

## Tasks

### GET /api/tasks

Получить список задач.

**Headers:**
```
X-Organization-ID: org-uuid (optional)
```

**Query Parameters:**
- `status` (optional): `pending`, `in_progress`, `completed`, `cancelled`
- `assigned_to_me` (optional): `true` для фильтрации по текущему пользователю

**Response:**
```json
[
  {
    "task_id": "task-uuid",
    "organization_id": "org-uuid",
    "title": "Обработать просрочки",
    "description": "Связаться со всеми клиентами",
    "type": "collection",
    "priority": "high",
    "status": "in_progress",
    "created_by": "admin-uid",
    "assigned_to": "manager-uid",
    "related_clients": ["client-1", "client-2"],
    "client_filters": {
      "status": "overdue"
    },
    "due_date": "2025-01-20T23:59:59Z",
    "created_at": "2025-01-13T10:00:00Z",
    "updated_at": "2025-01-13T10:00:00Z",
    "completed_at": null,
    "result": null,
    "comments": []
  }
]
```

---

### POST /api/tasks

Создать новую задачу (требуется `tasks.create` и `tasks.assign`).

**Headers:**
```
X-Organization-ID: org-uuid
```

**Request Body:**
```json
{
  "title": "Обработать просрочки за январь",
  "description": "Связаться со всеми клиентами с просрочкой > 7 дней",
  "type": "collection",
  "priority": "high",
  "assigned_to": "manager-user-id",
  "related_clients": ["client-uuid-1", "client-uuid-2"],
  "client_filters": {
    "status": "overdue",
    "capital_ids": ["capital-uuid-1"]
  },
  "due_date": "2025-01-20T23:59:59Z"
}
```

**Response:**
```json
{
  "task_id": "new-task-uuid",
  "organization_id": "org-uuid",
  "title": "Обработать просрочки за январь",
  ...
}
```

---

### GET /api/tasks/{task_id}

Получить информацию о задаче.

**Headers:**
```
X-Organization-ID: org-uuid (optional)
```

**Response:**
```json
{
  "task_id": "task-uuid",
  "organization_id": "org-uuid",
  "title": "Обработать просрочки",
  ...
}
```

---

### PUT /api/tasks/{task_id}

Обновить задачу.

**Headers:**
```
X-Organization-ID: org-uuid (optional)
```

**Request Body:**
```json
{
  "status": "in_progress",
  "priority": "urgent",
  "result": {
    "contacted": 15,
    "promised_payment": 8,
    "paid": 3,
    "no_contact": 4,
    "notes": "Большинство обещали оплатить"
  }
}
```

---

### POST /api/tasks/{task_id}/comments

Добавить комментарий к задаче.

**Headers:**
```
X-Organization-ID: org-uuid (optional)
```

**Query Parameters:**
- `comment_text`: Текст комментария

**Response:**
```json
{
  "message": "Comment added successfully",
  "comment": {
    "user_id": "current-user-uid",
    "text": "Начал работу над задачей",
    "timestamp": "2025-01-13T10:30:00Z"
  }
}
```

---

### POST /api/tasks/{task_id}/complete

Отметить задачу как завершенную.

**Headers:**
```
X-Organization-ID: org-uuid (optional)
```

**Request Body:**
```json
{
  "contacted": 15,
  "promised_payment": 8,
  "paid": 3,
  "no_contact": 4,
  "notes": "Работа завершена. 8 клиентов обещали оплатить до 15 числа."
}
```

**Response:**
```json
{
  "task_id": "task-uuid",
  "status": "completed",
  "completed_at": "2025-01-13T15:00:00Z",
  "result": {
    "contacted": 15,
    "promised_payment": 8,
    "paid": 3,
    "no_contact": 4,
    "notes": "Работа завершена..."
  },
  ...
}
```

---

## Роли и Разрешения

### Роли (MemberRole)

- `owner` - Владелец (полный доступ)
- `admin` - Администратор
- `manager` - Менеджер
- `viewer` - Наблюдатель

### Отделы (Department)

- `collections` - Работа с просрочками
- `sales` - Продажи
- `analytics` - Аналитика
- `finance` - Финансы
- `general` - Общий

### Типы Задач (TaskType)

- `collection` - Работа с просрочками
- `evaluation` - Оценка клиентов
- `call` - Звонок
- `visit` - Визит
- `follow_up` - Повторная связь
- `other` - Другое

### Приоритеты (TaskPriority)

- `low` - Низкий
- `medium` - Средний
- `high` - Высокий
- `urgent` - Срочный

### Статусы Задач (TaskStatus)

- `pending` - Ожидает
- `in_progress` - В работе
- `completed` - Завершена
- `cancelled` - Отменена

---

## Примеры cURL

### Получить мои организации

```bash
curl -X GET "http://localhost:8000/api/organizations/my" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Создать менеджера

```bash
curl -X POST "http://localhost:8000/api/organizations/ORG_ID/members" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Organization-ID: ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "manager@company.com",
    "role": "manager",
    "department": "collections",
    "permissions": ["clients.view_all", "clients.edit", "payments.create"]
  }'
```

### Создать задачу

```bash
curl -X POST "http://localhost:8000/api/tasks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Organization-ID: ORG_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Обработать просрочки",
    "type": "collection",
    "priority": "high",
    "assigned_to": "MANAGER_USER_ID",
    "client_filters": {"status": "overdue"}
  }'
```

---

**Версия:** 1.0  
**Дата:** Январь 2025

