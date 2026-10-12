# 🚀 Быстрый Старт: Система Менеджеров

## Что Реализовано

✅ **Backend (Python/FastAPI):**
- Модели данных для организаций, менеджеров и задач
- API endpoints для управления организациями
- API endpoints для управления менеджерами
- API endpoints для создания и назначения задач
- Система разрешений (permissions) с middleware
- Журнал активности (activity log)

✅ **Скрипт миграции:**
- Автоматическая миграция существующих данных

## Шаги для Запуска

### 1. Миграция Данных

Сначала нужно мигрировать существующие данные к новой системе:

```bash
python migrate_to_organizations.py
```

Этот скрипт:
- Создаст организацию для каждого существующего владельца капиталов
- Обновит капиталы, добавив `organization_id`
- Обновит клиентов, добавив `organization_id` и новые поля для менеджеров
- Создаст членство с ролью `owner` для каждого владельца

### 2. Проверка API

После миграции, проверьте работу новых endpoints:

#### Получить свои организации
```bash
GET /api/organizations/my
Authorization: Bearer <your-firebase-token>
```

#### Создать новую организацию
```bash
POST /api/organizations
Authorization: Bearer <your-firebase-token>
Content-Type: application/json

{
  "name": "Моя Компания",
  "settings": {
    "timezone": "Asia/Bishkek",
    "currency": "KGS"
  }
}
```

#### Пригласить менеджера
```bash
POST /api/organizations/{org_id}/members
Authorization: Bearer <your-firebase-token>
X-Organization-ID: <org_id>
Content-Type: application/json

{
  "user_email": "manager@company.com",
  "role": "manager",
  "department": "collections",
  "permissions": [
    "clients.view_all",
    "clients.edit",
    "payments.view",
    "payments.create",
    "tasks.view_assigned",
    "tasks.manage_assigned"
  ],
  "metadata": {
    "position": "Менеджер по просрочкам",
    "phone": "+996555123456"
  }
}
```

#### Создать задачу для менеджера
```bash
POST /api/tasks
Authorization: Bearer <your-firebase-token>
X-Organization-ID: <org_id>
Content-Type: application/json

{
  "title": "Обработать просрочки за январь",
  "description": "Связаться со всеми клиентами с просрочкой > 7 дней",
  "type": "collection",
  "priority": "high",
  "assigned_to": "<manager_user_id>",
  "client_filters": {
    "status": "overdue"
  },
  "due_date": "2025-01-10T00:00:00Z"
}
```

### 3. Примеры Использования

#### Сценарий 1: Владелец добавляет менеджера

1. Владелец заходит в систему под своим аккаунтом (cokuevn@gmail.com)
2. Получает список своих организаций: `GET /api/organizations/my`
3. Приглашает менеджера: `POST /api/organizations/{org_id}/members`
4. Менеджер регистрируется в Firebase с указанным email
5. Менеджер автоматически получает доступ к организации

#### Сценарий 2: Администратор создает задачу для менеджера

1. Админ создает задачу: `POST /api/tasks`
2. Указывает фильтр: все клиенты с просрочкой
3. Система автоматически назначает этих клиентов менеджеру
4. Менеджер видит задачу в `GET /api/tasks?assigned_to_me=true`
5. Менеджер работает с клиентами
6. Менеджер отмечает задачу как выполненную: `POST /api/tasks/{task_id}/complete`

#### Сценарий 3: Менеджер работает с назначенными клиентами

1. Менеджер входит под своим логином
2. Получает список своих клиентов: `GET /api/clients?assigned_to_me=true`
3. Открывает клиента, добавляет заметки
4. Регистрирует платеж: `POST /api/payments`
5. Вся активность логируется автоматически

## Роли и Разрешения

### Роли

| Роль | Описание |
|------|----------|
| `owner` | Владелец организации (полный доступ) |
| `admin` | Администратор (почти полный доступ) |
| `manager` | Менеджер (ограниченный доступ к назначенным клиентам) |
| `viewer` | Наблюдатель (только просмотр) |

### Основные Разрешения

**Клиенты:**
- `clients.view_all` - Просмотр всех клиентов
- `clients.view_assigned` - Просмотр только назначенных клиентов
- `clients.create` - Создание клиентов
- `clients.edit` - Редактирование клиентов
- `clients.delete` - Удаление клиентов

**Платежи:**
- `payments.view` - Просмотр платежей
- `payments.create` - Создание платежей
- `payments.edit` - Редактирование платежей

**Задачи:**
- `tasks.view_all` - Просмотр всех задач
- `tasks.view_assigned` - Просмотр только своих задач
- `tasks.create` - Создание задач
- `tasks.assign` - Назначение задач
- `tasks.manage_assigned` - Управление своими задачами

**Менеджеры:**
- `members.view` - Просмотр членов организации
- `members.invite` - Приглашение новых членов
- `members.edit` - Редактирование членов

## Структура Базы Данных

### Новые Коллекции

1. **organizations** - Организации/компании
2. **organization_members** - Члены организаций (владельцы, админы, менеджеры)
3. **tasks** - Задачи для менеджеров
4. **activity_logs** - Журнал активности (опционально)

### Обновленные Коллекции

1. **capitals** - Добавлено поле `organization_id`
2. **clients** - Добавлены поля:
   - `organization_id`
   - `assigned_to` (менеджер)
   - `activity_log` (история работы)
   - `tags` (теги)
   - `notes` (заметки)

## Заголовки Запросов

Для работы с организациями используйте заголовок:

```
X-Organization-ID: <organization_id>
```

Это позволяет пользователю работать с несколькими организациями.

## Следующие Шаги

### Backend (Опционально)
- [ ] Добавить email-уведомления при создании задач
- [ ] Расширить систему фильтров для задач
- [ ] Добавить endpoints для статистики по менеджерам
- [ ] Реализовать систему комментариев к клиентам

### Frontend (Требуется)
- [ ] Создать страницу управления организациями
- [ ] Создать страницу управления менеджерами
- [ ] Создать интерфейс для создания задач
- [ ] Создать дашборд для менеджеров
- [ ] Обновить компонент работы с клиентами

## Тестирование

### Создать тестовую организацию и менеджера

```python
# test_organization.py
import requests

BASE_URL = "http://localhost:8000/api"
TOKEN = "your-firebase-token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 1. Получить свои организации
response = requests.get(f"{BASE_URL}/organizations/my", headers=headers)
orgs = response.json()
print("Мои организации:", orgs)

if orgs:
    org_id = orgs[0]["id"]
    
    # 2. Добавить менеджера
    manager_data = {
        "user_email": "test_manager@example.com",
        "role": "manager",
        "department": "collections",
        "permissions": [
            "clients.view_all",
            "clients.edit",
            "payments.create"
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/organizations/{org_id}/members",
        headers=headers,
        json=manager_data
    )
    print("Менеджер создан:", response.json())
    
    # 3. Создать задачу
    task_data = {
        "title": "Тестовая задача",
        "description": "Обзвонить всех клиентов",
        "type": "collection",
        "priority": "medium",
        "assigned_to": "test_manager_user_id"
    }
    
    response = requests.post(
        f"{BASE_URL}/tasks",
        headers={**headers, "X-Organization-ID": org_id},
        json=task_data
    )
    print("Задача создана:", response.json())
```

## Поддержка

Если возникли вопросы или проблемы:

1. Проверьте логи миграции
2. Убедитесь, что все environment variables установлены
3. Проверьте, что MongoDB доступна
4. Изучите подробную документацию в `MANAGER_SYSTEM_ARCHITECTURE.md`

---

**Версия:** 1.0  
**Дата:** Январь 2025

