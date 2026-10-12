# Архитектура Системы Управления Доступом для CRM

## 📋 Содержание

1. [Текущая Структура Данных](#текущая-структура-данных)
2. [Проблематика и Задача](#проблематика-и-задача)
3. [Предлагаемая Архитектура](#предлагаемая-архитектура)
4. [Схема Базы Данных](#схема-базы-данных)
5. [Модели Данных](#модели-данных)
6. [Система Ролей и Разрешений](#система-ролей-и-разрешений)
7. [API Endpoints](#api-endpoints)
8. [Примеры Реализации](#примеры-реализации)
9. [Миграция Данных](#миграция-данных)
10. [UI/UX для Менеджеров](#uiux-для-менеджеров)

---

## 1. Текущая Структура Данных

### Текущая Иерархия

```
┌─────────────────────────────────────┐
│         Firebase Auth               │
│    (User Authentication)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│            Users                    │
│  - uid (Firebase UID)               │
│  - email                            │
│  - role (admin/user)                │
│  - display_name                     │
└──────────────┬──────────────────────┘
               │
               │ owner_id
               ▼
┌─────────────────────────────────────┐
│          Capitals                   │
│  - id                               │
│  - owner_id (uid пользователя)      │
│  - name                             │
│  - balance                          │
│  - is_active                        │
└──────────────┬──────────────────────┘
               │
               │ capital_id
               ├─────────────┬─────────────┐
               ▼             ▼             ▼
      ┌──────────────┐ ┌──────────┐ ┌──────────┐
      │   Clients    │ │ Expenses │ │ Payments │
      │              │ │          │ │          │
      │ - client_id  │ │- exp_id  │ │- pay_id  │
      │ - capital_id │ │- cap_id  │ │- cap_id  │
      │ - name       │ │- amount  │ │- amount  │
      │ - debt       │ │- date    │ │- date    │
      │ - schedule   │ │          │ │          │
      └──────────────┘ └──────────┘ └──────────┘
```

### Текущая Изоляция Данных

**Принцип:** Каждый пользователь (владелец/директор) имеет **полную изоляцию** своих данных.

Пример:
- `cokuevn@gmail.com` → uid: `nF90MLbAVORCrePYSEL4JwIooV22`
  - Capitals: `["Капитал 1", "Капитал 2"]`
  - Clients: `[все клиенты этих капиталов]`
  - Expenses: `[все расходы этих капиталов]`

**Проблема:** Нет возможности дать доступ другим сотрудникам (менеджерам) к этим данным.

---

## 2. Проблематика и Задача

### Текущая Ситуация
- ✅ Владельцы/директора имеют полный доступ к своим данным
- ✅ Каждая компания изолирована в БД
- ❌ Невозможно добавить менеджеров для работы с данными компании
- ❌ Нет системы делегирования задач
- ❌ Нет ролей с ограниченными правами

### Требования
1. **Менеджеры** должны иметь свои логин/пароль
2. Менеджер должен видеть данные **конкретной компании** (например, `cokuevn@gmail.com`)
3. **Администратор компании** может:
   - Создавать менеджеров
   - Назначать им роли/права
   - Давать задания (например, "взять просрочки в работу")
   - Отслеживать работу менеджеров
4. **Разные роли менеджеров**:
   - Менеджер по работе с просрочками
   - Менеджер по оценке клиентов
   - Менеджер по новым клиентам
   - и т.д.

---

## 3. Предлагаемая Архитектура

### Новая Иерархия с Организациями

```
┌─────────────────────────────────────────────────────────┐
│              Firebase Authentication                    │
│         (для всех пользователей системы)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Users                                 │
│  - uid (Firebase UID)                                   │
│  - email                                                │
│  - display_name                                         │
│  - created_at                                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ user_id
                     ▼
┌─────────────────────────────────────────────────────────┐
│              OrganizationMembers                        │
│  - id                                                   │
│  - organization_id  ───────┐                            │
│  - user_id                 │                            │
│  - role (owner/manager)    │                            │
│  - permissions []          │                            │
│  - created_at              │                            │
│  - created_by              │                            │
│  - is_active               │                            │
└────────────────────────────┼────────────────────────────┘
                             │
        ┌────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                Organizations                            │
│  - id                                                   │
│  - name (название компании)                             │
│  - owner_id (главный владелец, исторический)            │
│  - created_at                                           │
│  - settings (настройки компании)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ organization_id
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Capitals                               │
│  - id                                                   │
│  - organization_id (вместо owner_id)                    │
│  - name                                                 │
│  - balance                                              │
│  - is_active                                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ capital_id
                     ├───────────┬──────────┬──────────────┐
                     ▼           ▼          ▼              ▼
            ┌─────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
            │   Clients   │ │Expenses │ │Payments │ │  Tasks  │
            │             │ │         │ │         │ │         │
            │- client_id  │ │- exp_id │ │- pay_id │ │- task_id│
            │- capital_id │ │- cap_id │ │- cap_id │ │- org_id │
            │- assigned_to│ │         │ │         │ │- assign │
            │  (manager)  │ │         │ │         │ │- status │
            └─────────────┘ └─────────┘ └─────────┘ └─────────┘
```

### Ключевые Изменения

1. **Organizations** - новая сущность, представляющая компанию
2. **OrganizationMembers** - связь между пользователями и организациями с ролями
3. **Capitals** теперь привязаны к организации (не к конкретному пользователю)
4. **Tasks** - система заданий для менеджеров

---

## 4. Схема Базы Данных

### MongoDB Collections

#### 4.1 `organizations`

```javascript
{
  _id: ObjectId,
  id: "uuid-v4",                      // Уникальный ID организации
  name: "ООО Рассрочка Плюс",         // Название компании
  owner_id: "nF90MLbAVORCrePYSEL4JwIooV22", // Исторический владелец (для миграции)
  created_at: ISODate("2025-01-05"),
  updated_at: ISODate("2025-01-05"),
  settings: {
    timezone: "Asia/Bishkek",
    currency: "KGS",
    allow_negative_balance: true,
    features: {
      tasks: true,
      analytics: true,
      ai_chat: false
    }
  },
  is_active: true
}
```

#### 4.2 `organization_members`

```javascript
{
  _id: ObjectId,
  id: "uuid-v4",
  organization_id: "org-uuid",        // ID организации
  user_id: "firebase-uid",            // Firebase UID пользователя
  role: "manager",                    // owner, admin, manager, viewer
  permissions: [                      // Массив разрешений
    "clients.view",
    "clients.edit",
    "clients.delete",
    "payments.create",
    "payments.view",
    "analytics.view_basic",
    "tasks.manage_assigned"
  ],
  department: "collections",          // Отдел: collections, sales, analytics
  assigned_capitals: [                // К каким капиталам есть доступ (опционально)
    "capital-uuid-1",
    "capital-uuid-2"
  ],
  created_at: ISODate("2025-01-05"),
  created_by: "owner-firebase-uid",   // Кто создал этого члена
  is_active: true,
  metadata: {
    position: "Менеджер по просрочкам",
    phone: "+996555123456",
    hire_date: "2025-01-01"
  }
}
```

#### 4.3 `capitals` (обновленная структура)

```javascript
{
  _id: ObjectId,
  id: "uuid-v4",
  organization_id: "org-uuid",        // ИЗМЕНЕНО: вместо owner_id
  name: "Основной капитал",
  description: "...",
  balance: 150000.00,
  created_at: ISODate("2025-01-05"),
  is_active: true,
  
  // Опционально: ограничить доступ только определенным менеджерам
  restricted_access: false,
  allowed_users: []                   // Если restricted_access=true
}
```

#### 4.4 `clients` (обновленная структура)

```javascript
{
  _id: ObjectId,
  client_id: "uuid-v4",
  capital_id: "capital-uuid",
  organization_id: "org-uuid",        // ДОБАВЛЕНО: для быстрого поиска
  
  // ... существующие поля ...
  name: "Иванов Иван",
  phone: "+996555999888",
  debt_amount: 50000,
  monthly_payment: 5000,
  status: "overdue",
  
  // НОВЫЕ ПОЛЯ для работы менеджеров
  assigned_to: "manager-firebase-uid", // Назначенный менеджер
  assigned_at: ISODate("2025-01-05"),
  assigned_by: "admin-firebase-uid",
  
  // История работы с клиентом
  activity_log: [
    {
      timestamp: ISODate("2025-01-05T10:00:00Z"),
      user_id: "manager-uid",
      action: "status_change",
      details: {
        old_status: "active",
        new_status: "overdue",
        note: "Просрочка 15 дней"
      }
    },
    {
      timestamp: ISODate("2025-01-05T11:30:00Z"),
      user_id: "manager-uid",
      action: "contact_attempt",
      details: {
        method: "phone",
        result: "no_answer",
        note: "Не взял трубку"
      }
    }
  ],
  
  tags: ["просрочка", "приоритет"],
  notes: "Обещал оплатить до 10 числа"
}
```

#### 4.5 `tasks` (новая коллекция)

```javascript
{
  _id: ObjectId,
  task_id: "uuid-v4",
  organization_id: "org-uuid",
  
  title: "Обработать просрочки за январь",
  description: "Связаться со всеми клиентами с просрочкой > 7 дней",
  
  type: "collection",                 // collection, evaluation, call, visit
  priority: "high",                   // low, medium, high, urgent
  status: "in_progress",              // pending, in_progress, completed, cancelled
  
  created_by: "admin-firebase-uid",
  assigned_to: "manager-firebase-uid",
  
  // Связанные клиенты (если задача для конкретных клиентов)
  related_clients: [
    "client-uuid-1",
    "client-uuid-2"
  ],
  
  // Фильтры для автоматического подбора клиентов
  client_filters: {
    status: "overdue",
    overdue_days_min: 7,
    capital_ids: ["capital-uuid-1"]
  },
  
  due_date: ISODate("2025-01-10"),
  created_at: ISODate("2025-01-05"),
  updated_at: ISODate("2025-01-05"),
  completed_at: null,
  
  // Результаты выполнения
  result: {
    contacted: 15,
    promised_payment: 8,
    paid: 3,
    no_contact: 4,
    notes: "Большинство обещали оплатить до 10 числа"
  },
  
  comments: [
    {
      user_id: "manager-uid",
      text: "Начал обзвон",
      timestamp: ISODate("2025-01-05T09:00:00Z")
    }
  ]
}
```

#### 4.6 `activity_logs` (аудит действий)

```javascript
{
  _id: ObjectId,
  log_id: "uuid-v4",
  organization_id: "org-uuid",
  user_id: "firebase-uid",
  
  action: "client.update",
  entity_type: "client",
  entity_id: "client-uuid",
  
  timestamp: ISODate("2025-01-05T10:30:00Z"),
  
  changes: {
    field: "status",
    old_value: "active",
    new_value: "overdue"
  },
  
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0...",
  
  metadata: {
    note: "Автоматическое изменение статуса",
    reason: "payment_overdue"
  }
}
```

---

## 5. Модели Данных (Python/Pydantic)

### 5.1 Organization Models

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class OrganizationSettings(BaseModel):
    timezone: str = "UTC"
    currency: str = "USD"
    allow_negative_balance: bool = False
    features: Dict[str, bool] = {}

class Organization(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_id: str  # Исторический владелец
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    settings: OrganizationSettings = OrganizationSettings()
    is_active: bool = True

class OrganizationCreate(BaseModel):
    name: str
    settings: Optional[OrganizationSettings] = None

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    settings: Optional[OrganizationSettings] = None
    is_active: Optional[bool] = None
```

### 5.2 Organization Member Models

```python
class MemberRole(str, Enum):
    owner = "owner"           # Владелец организации (полный доступ)
    admin = "admin"           # Администратор (почти полный доступ)
    manager = "manager"       # Менеджер (ограниченный доступ)
    viewer = "viewer"         # Только просмотр

class Department(str, Enum):
    collections = "collections"   # Работа с просрочками
    sales = "sales"              # Продажи, новые клиенты
    analytics = "analytics"      # Аналитика
    finance = "finance"          # Финансы
    general = "general"          # Общий

class OrganizationMember(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    user_id: str  # Firebase UID
    role: MemberRole
    permissions: List[str] = []
    department: Department = Department.general
    assigned_capitals: List[str] = []  # Пустой = доступ ко всем
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    is_active: bool = True
    metadata: Dict[str, Any] = {}

class OrganizationMemberCreate(BaseModel):
    user_email: str  # Email для приглашения
    role: MemberRole
    permissions: Optional[List[str]] = None
    department: Optional[Department] = Department.general
    assigned_capitals: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class OrganizationMemberUpdate(BaseModel):
    role: Optional[MemberRole] = None
    permissions: Optional[List[str]] = None
    department: Optional[Department] = None
    assigned_capitals: Optional[List[str]] = None
    is_active: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None
```

### 5.3 Task Models

```python
class TaskType(str, Enum):
    collection = "collection"       # Работа с просрочками
    evaluation = "evaluation"       # Оценка клиентов
    call = "call"                   # Звонок клиенту
    visit = "visit"                 # Визит к клиенту
    follow_up = "follow_up"         # Повторная связь
    other = "other"

class TaskPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"

class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class TaskResult(BaseModel):
    contacted: int = 0
    promised_payment: int = 0
    paid: int = 0
    no_contact: int = 0
    notes: Optional[str] = None

class TaskComment(BaseModel):
    user_id: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    organization_id: str
    title: str
    description: Optional[str] = None
    type: TaskType
    priority: TaskPriority = TaskPriority.medium
    status: TaskStatus = TaskStatus.pending
    created_by: str
    assigned_to: str
    related_clients: List[str] = []
    client_filters: Optional[Dict[str, Any]] = None
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    result: Optional[TaskResult] = None
    comments: List[TaskComment] = []

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    type: TaskType
    priority: Optional[TaskPriority] = TaskPriority.medium
    assigned_to: str
    related_clients: Optional[List[str]] = None
    client_filters: Optional[Dict[str, Any]] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[str] = None
    related_clients: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    result: Optional[TaskResult] = None
```

### 5.4 Updated Client Model

```python
class ActivityLogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str
    action: str
    details: Dict[str, Any] = {}

class Client(BaseModel):
    # Существующие поля...
    client_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    capital_id: str
    name: str
    phone: str
    debt_amount: float
    monthly_payment: float
    status: ClientStatus
    # ... другие поля ...
    
    # НОВЫЕ поля для менеджеров
    organization_id: str  # Для быстрого поиска
    assigned_to: Optional[str] = None
    assigned_at: Optional[datetime] = None
    assigned_by: Optional[str] = None
    activity_log: List[ActivityLogEntry] = []
    tags: List[str] = []
    notes: Optional[str] = None
```

---

## 6. Система Ролей и Разрешений

### 6.1 Роли

| Роль | Описание | Типичные Задачи |
|------|----------|-----------------|
| **owner** | Владелец организации | Полный контроль, управление менеджерами, финансы |
| **admin** | Администратор | Управление менеджерами, назначение задач, аналитика |
| **manager** | Менеджер | Работа с клиентами, выполнение задач, ограниченный доступ |
| **viewer** | Наблюдатель | Только просмотр данных, без редактирования |

### 6.2 Разрешения (Permissions)

Разрешения имеют формат: `<entity>.<action>`

#### Клиенты (`clients.*`)
- `clients.view` - Просмотр клиентов
- `clients.view_all` - Просмотр всех клиентов организации
- `clients.view_assigned` - Просмотр только назначенных клиентов
- `clients.create` - Создание новых клиентов
- `clients.edit` - Редактирование клиентов
- `clients.delete` - Удаление клиентов
- `clients.assign` - Назначение клиентов менеджерам
- `clients.export` - Экспорт данных клиентов

#### Платежи (`payments.*`)
- `payments.view` - Просмотр платежей
- `payments.create` - Регистрация новых платежей
- `payments.edit` - Редактирование платежей
- `payments.delete` - Удаление платежей

#### Капиталы (`capitals.*`)
- `capitals.view` - Просмотр капиталов
- `capitals.create` - Создание капиталов
- `capitals.edit` - Редактирование капиталов
- `capitals.delete` - Удаление капиталов
- `capitals.view_balance` - Просмотр баланса

#### Расходы (`expenses.*`)
- `expenses.view` - Просмотр расходов
- `expenses.create` - Создание расходов
- `expenses.edit` - Редактирование расходов
- `expenses.delete` - Удаление расходов

#### Аналитика (`analytics.*`)
- `analytics.view_basic` - Базовая аналитика
- `analytics.view_full` - Полная аналитика
- `analytics.view_financial` - Финансовая аналитика
- `analytics.export` - Экспорт аналитики

#### Задачи (`tasks.*`)
- `tasks.view` - Просмотр задач
- `tasks.view_all` - Просмотр всех задач
- `tasks.view_assigned` - Просмотр только своих задач
- `tasks.create` - Создание задач
- `tasks.assign` - Назначение задач
- `tasks.edit` - Редактирование задач
- `tasks.delete` - Удаление задач
- `tasks.manage_assigned` - Управление назначенными задачами

#### Члены организации (`members.*`)
- `members.view` - Просмотр списка членов
- `members.invite` - Приглашение новых членов
- `members.edit` - Редактирование членов
- `members.remove` - Удаление членов

### 6.3 Предустановленные Наборы Разрешений

```python
ROLE_PERMISSIONS = {
    "owner": [
        # Полный доступ ко всему
        "clients.*", "payments.*", "capitals.*", "expenses.*",
        "analytics.*", "tasks.*", "members.*"
    ],
    
    "admin": [
        # Почти полный доступ, кроме критичных финансовых операций
        "clients.*", "payments.*", "capitals.view", "capitals.view_balance",
        "expenses.view", "expenses.create",
        "analytics.*",
        "tasks.*",
        "members.view", "members.invite", "members.edit"
    ],
    
    "manager": [
        # Ограниченный доступ к своим клиентам и задачам
        "clients.view_assigned", "clients.edit",
        "payments.view", "payments.create",
        "capitals.view",
        "analytics.view_basic",
        "tasks.view_assigned", "tasks.manage_assigned"
    ],
    
    "viewer": [
        # Только просмотр
        "clients.view", "payments.view", "capitals.view",
        "expenses.view", "analytics.view_basic", "tasks.view"
    ]
}

# Специализированные роли менеджеров
SPECIALIZED_ROLES = {
    "manager_collections": [
        # Менеджер по просрочкам
        "clients.view_all", "clients.edit",
        "payments.view", "payments.create",
        "tasks.view_assigned", "tasks.manage_assigned",
        "analytics.view_basic"
    ],
    
    "manager_sales": [
        # Менеджер по продажам/новым клиентам
        "clients.view_all", "clients.create", "clients.edit",
        "payments.view",
        "tasks.view_assigned", "tasks.manage_assigned",
        "analytics.view_basic"
    ],
    
    "manager_finance": [
        # Финансовый менеджер
        "clients.view", "payments.*",
        "capitals.view", "capitals.view_balance",
        "expenses.*",
        "analytics.view_financial",
        "tasks.view_assigned"
    ]
}
```

---

## 7. API Endpoints

### 7.1 Organizations

```python
# Получить организацию текущего пользователя
@api_router.get("/organizations/my")
async def get_my_organizations(current_user: str = Depends(get_current_user)):
    """Возвращает список организаций, в которых состоит пользователь"""
    pass

# Создать организацию
@api_router.post("/organizations", response_model=Organization)
async def create_organization(
    org: OrganizationCreate,
    current_user: str = Depends(get_current_user)
):
    """Создает новую организацию (доступно всем пользователям)"""
    pass

# Обновить организацию
@api_router.put("/organizations/{org_id}", response_model=Organization)
async def update_organization(
    org_id: str,
    updates: OrganizationUpdate,
    current_user: str = Depends(get_current_user)
):
    """Обновляет организацию (требуется роль owner/admin)"""
    pass
```

### 7.2 Organization Members

```python
# Получить членов организации
@api_router.get("/organizations/{org_id}/members")
async def get_organization_members(
    org_id: str,
    current_user: str = Depends(get_current_user)
):
    """Список членов организации"""
    pass

# Пригласить нового члена
@api_router.post("/organizations/{org_id}/members")
async def invite_member(
    org_id: str,
    member: OrganizationMemberCreate,
    current_user: str = Depends(get_current_user)
):
    """Пригласить нового члена в организацию"""
    # 1. Проверить права (требуется members.invite)
    # 2. Создать/найти пользователя по email
    # 3. Создать запись в organization_members
    # 4. Отправить email-приглашение (опционально)
    pass

# Обновить члена организации
@api_router.put("/organizations/{org_id}/members/{member_id}")
async def update_member(
    org_id: str,
    member_id: str,
    updates: OrganizationMemberUpdate,
    current_user: str = Depends(get_current_user)
):
    """Обновить роль, разрешения, отдел члена организации"""
    pass

# Удалить члена
@api_router.delete("/organizations/{org_id}/members/{member_id}")
async def remove_member(
    org_id: str,
    member_id: str,
    current_user: str = Depends(get_current_user)
):
    """Удалить члена из организации"""
    pass
```

### 7.3 Tasks

```python
# Получить задачи
@api_router.get("/tasks")
async def get_tasks(
    status: Optional[TaskStatus] = None,
    assigned_to_me: bool = False,
    current_user: str = Depends(get_current_user)
):
    """Получить список задач (с учетом разрешений)"""
    pass

# Создать задачу
@api_router.post("/tasks", response_model=Task)
async def create_task(
    task: TaskCreate,
    current_user: str = Depends(get_current_user)
):
    """Создать новую задачу (требуется tasks.create)"""
    pass

# Обновить задачу
@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: str,
    updates: TaskUpdate,
    current_user: str = Depends(get_current_user)
):
    """Обновить задачу"""
    pass

# Добавить комментарий к задаче
@api_router.post("/tasks/{task_id}/comments")
async def add_task_comment(
    task_id: str,
    comment: str,
    current_user: str = Depends(get_current_user)
):
    """Добавить комментарий к задаче"""
    pass

# Завершить задачу
@api_router.post("/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    result: TaskResult,
    current_user: str = Depends(get_current_user)
):
    """Отметить задачу как завершенную"""
    pass
```

### 7.4 Updated Client Endpoints

```python
# Назначить клиента менеджеру
@api_router.post("/clients/{client_id}/assign")
async def assign_client(
    client_id: str,
    manager_id: str,
    current_user: str = Depends(get_current_user)
):
    """Назначить клиента менеджеру (требуется clients.assign)"""
    pass

# Добавить запись в журнал активности клиента
@api_router.post("/clients/{client_id}/activity")
async def add_client_activity(
    client_id: str,
    action: str,
    details: Dict[str, Any],
    current_user: str = Depends(get_current_user)
):
    """Добавить запись в журнал работы с клиентом"""
    pass

# Получить клиентов с фильтрами для менеджера
@api_router.get("/clients/assigned-to-me")
async def get_my_assigned_clients(
    current_user: str = Depends(get_current_user)
):
    """Получить клиентов, назначенных текущему менеджеру"""
    pass
```

---

## 8. Примеры Реализации

### 8.1 Middleware для Проверки Разрешений

```python
from fastapi import HTTPException, status
from typing import List

class PermissionChecker:
    """Проверка разрешений пользователя"""
    
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    async def __call__(self, current_user: str = Depends(get_current_user)):
        # Получить организацию из контекста запроса (можно через header)
        org_id = await self.get_org_from_request()
        
        # Получить членство пользователя в организации
        member = await db.organization_members.find_one({
            "user_id": current_user,
            "organization_id": org_id,
            "is_active": True
        })
        
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this organization"
            )
        
        # Проверить разрешения
        user_permissions = member.get("permissions", [])
        role = member.get("role")
        
        # Если owner - полный доступ
        if role == "owner":
            return member
        
        # Проверить каждое требуемое разрешение
        for required in self.required_permissions:
            if not self.has_permission(user_permissions, required):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission denied: {required}"
                )
        
        return member
    
    @staticmethod
    def has_permission(user_perms: List[str], required: str) -> bool:
        """Проверить, есть ли у пользователя нужное разрешение"""
        # Точное совпадение
        if required in user_perms:
            return True
        
        # Проверить wildcard (например, clients.* включает clients.view)
        entity = required.split(".")[0]
        if f"{entity}.*" in user_perms:
            return True
        
        return False

# Использование
@api_router.delete("/clients/{client_id}")
async def delete_client(
    client_id: str,
    current_user: str = Depends(get_current_user),
    member: dict = Depends(PermissionChecker(["clients.delete"]))
):
    """Удалить клиента (требуется разрешение clients.delete)"""
    # member уже проверен и содержит информацию о членстве
    pass
```

### 8.2 Функция Получения Организации Пользователя

```python
async def get_user_organization(user_id: str, org_id: Optional[str] = None):
    """
    Получить организацию пользователя
    Если org_id не указан, возвращает первую активную организацию
    """
    query = {
        "user_id": user_id,
        "is_active": True
    }
    
    if org_id:
        query["organization_id"] = org_id
    
    member = await db.organization_members.find_one(query)
    
    if not member:
        return None
    
    org = await db.organizations.find_one({
        "id": member["organization_id"],
        "is_active": True
    })
    
    return {
        "organization": Organization(**mongo_to_dict(org)),
        "member": OrganizationMember(**mongo_to_dict(member))
    }

async def get_user_permissions(user_id: str, org_id: str) -> List[str]:
    """Получить список разрешений пользователя в организации"""
    member = await db.organization_members.find_one({
        "user_id": user_id,
        "organization_id": org_id,
        "is_active": True
    })
    
    if not member:
        return []
    
    # Если owner - возвращаем все разрешения
    if member["role"] == "owner":
        return ["*"]
    
    return member.get("permissions", [])
```

### 8.3 Обновленный Endpoint для Клиентов с Проверкой Организации

```python
@api_router.get("/clients", response_model=List[Client])
async def get_clients(
    capital_id: Optional[str] = None,
    assigned_to_me: bool = False,
    current_user: str = Depends(get_current_user),
    org_id: Optional[str] = Header(None, alias="X-Organization-ID")
):
    """
    Получить клиентов с учетом:
    - Организации пользователя
    - Разрешений пользователя
    - Назначенных клиентов (если менеджер)
    """
    
    # Получить членство в организации
    user_org = await get_user_organization(current_user, org_id)
    if not user_org:
        raise HTTPException(status_code=403, detail="Not a member of any organization")
    
    org = user_org["organization"]
    member = user_org["member"]
    
    # Построить запрос
    query = {"organization_id": org.id}
    
    # Проверить разрешения
    permissions = member.permissions
    
    # Если только просмотр назначенных клиентов
    if "clients.view_assigned" in permissions and "clients.view_all" not in permissions:
        query["assigned_to"] = current_user
    elif "clients.view_all" not in permissions and "clients.view" not in permissions:
        raise HTTPException(status_code=403, detail="Permission denied: clients.view")
    
    # Фильтр по капиталу
    if capital_id:
        # Проверить доступ к капиталу
        if member.assigned_capitals and capital_id not in member.assigned_capitals:
            raise HTTPException(status_code=403, detail="Access denied to this capital")
        query["capital_id"] = capital_id
    elif member.assigned_capitals:
        # Если у менеджера ограниченный доступ к капиталам
        query["capital_id"] = {"$in": member.assigned_capitals}
    
    # Фильтр "только мои клиенты"
    if assigned_to_me:
        query["assigned_to"] = current_user
    
    # Получить клиентов
    clients = await db.clients.find(query).to_list(1000)
    
    return [Client(**mongo_to_dict(client)) for client in clients]
```

### 8.4 Создание Задачи для Менеджера

```python
@api_router.post("/tasks", response_model=Task)
async def create_task(
    task: TaskCreate,
    current_user: str = Depends(get_current_user),
    org_id: Optional[str] = Header(None, alias="X-Organization-ID"),
    member: dict = Depends(PermissionChecker(["tasks.create", "tasks.assign"]))
):
    """Создать задачу для менеджера"""
    
    user_org = await get_user_organization(current_user, org_id)
    org = user_org["organization"]
    
    # Проверить, что назначаемый пользователь - член организации
    assignee = await db.organization_members.find_one({
        "user_id": task.assigned_to,
        "organization_id": org.id,
        "is_active": True
    })
    
    if not assignee:
        raise HTTPException(
            status_code=400,
            detail="Assigned user is not a member of this organization"
        )
    
    # Если указаны фильтры клиентов, найти подходящих
    related_clients = task.related_clients or []
    if task.client_filters:
        # Построить запрос на основе фильтров
        query = {"organization_id": org.id}
        
        if task.client_filters.get("status"):
            query["status"] = task.client_filters["status"]
        
        if task.client_filters.get("capital_ids"):
            query["capital_id"] = {"$in": task.client_filters["capital_ids"]}
        
        if task.client_filters.get("overdue_days_min"):
            # Логика для подсчета дней просрочки
            pass
        
        clients = await db.clients.find(query).to_list(100)
        related_clients = [c["client_id"] for c in clients]
    
    # Создать задачу
    task_obj = Task(
        **task.dict(),
        organization_id=org.id,
        created_by=current_user,
        related_clients=related_clients
    )
    
    await db.tasks.insert_one(task_obj.dict())
    
    # Опционально: отправить уведомление назначенному менеджеру
    # await send_task_notification(task.assigned_to, task_obj)
    
    return task_obj
```

---

## 9. Миграция Данных

### 9.1 Этапы Миграции

#### Этап 1: Создание Организаций для Существующих Пользователей

```python
async def migrate_users_to_organizations():
    """
    Создать организацию для каждого существующего пользователя
    """
    # Получить всех пользователей с капиталами
    users = await db.users.find({}).to_list(1000)
    
    for user in users:
        # Проверить, есть ли у пользователя капиталы
        capitals = await db.capitals.find({"owner_id": user["uid"]}).to_list(100)
        
        if not capitals:
            continue
        
        # Создать организацию
        org = Organization(
            name=f"Организация {user.get('display_name', user['email'])}",
            owner_id=user["uid"]
        )
        
        await db.organizations.insert_one(org.dict())
        
        # Создать членство (owner)
        member = OrganizationMember(
            organization_id=org.id,
            user_id=user["uid"],
            role=MemberRole.owner,
            permissions=["*"],  # Полный доступ
            created_by=user["uid"]
        )
        
        await db.organization_members.insert_one(member.dict())
        
        print(f"✓ Created organization for {user['email']}: {org.id}")
```

#### Этап 2: Обновление Капиталов

```python
async def migrate_capitals_to_organizations():
    """
    Обновить капиталы: owner_id -> organization_id
    """
    # Получить все капиталы
    capitals = await db.capitals.find({}).to_list(10000)
    
    for capital in capitals:
        owner_id = capital.get("owner_id")
        
        if not owner_id:
            continue
        
        # Найти организацию этого владельца
        org = await db.organizations.find_one({"owner_id": owner_id})
        
        if not org:
            print(f"✗ Organization not found for capital {capital['id']}, owner: {owner_id}")
            continue
        
        # Обновить капитал
        await db.capitals.update_one(
            {"id": capital["id"]},
            {
                "$set": {"organization_id": org["id"]},
                "$unset": {"owner_id": ""}  # Можно оставить для совместимости
            }
        )
        
        print(f"✓ Migrated capital {capital['id']} to org {org['id']}")
```

#### Этап 3: Обновление Клиентов

```python
async def migrate_clients_to_organizations():
    """
    Добавить organization_id к клиентам
    """
    clients = await db.clients.find({}).to_list(100000)
    
    for client in clients:
        capital_id = client.get("capital_id")
        
        # Найти капитал
        capital = await db.capitals.find_one({"id": capital_id})
        
        if not capital or "organization_id" not in capital:
            continue
        
        # Обновить клиента
        await db.clients.update_one(
            {"client_id": client["client_id"]},
            {
                "$set": {
                    "organization_id": capital["organization_id"],
                    "activity_log": [],
                    "tags": [],
                    "assigned_to": None
                }
            }
        )
    
    print(f"✓ Migrated {len(clients)} clients")
```

### 9.2 Скрипт Полной Миграции

```python
# migrate_to_organizations.py

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def run_migration():
    """Запустить полную миграцию"""
    
    load_dotenv()
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("=== Starting Migration to Organizations ===\n")
    
    # Этап 1
    print("Step 1: Creating organizations for existing users...")
    await migrate_users_to_organizations()
    
    # Этап 2
    print("\nStep 2: Migrating capitals to organizations...")
    await migrate_capitals_to_organizations()
    
    # Этап 3
    print("\nStep 3: Migrating clients to organizations...")
    await migrate_clients_to_organizations()
    
    print("\n=== Migration Complete ===")

if __name__ == "__main__":
    asyncio.run(run_migration())
```

---

## 10. UI/UX для Менеджеров

### 10.1 Страница Входа для Менеджеров

**Сценарий:**
1. Менеджер получает email-приглашение от администратора
2. Переходит по ссылке, регистрируется в Firebase
3. Автоматически добавляется в организацию с назначенной ролью
4. Входит в систему и видит интерфейс менеджера

### 10.2 Дашборд Менеджера

```
┌─────────────────────────────────────────────────────────┐
│  🏢 ООО Рассрочка Плюс    👤 Иванов Петр (Менеджер)    │
└─────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┐
│  📋 Мои Задачи   │  👥 Мои Клиенты  │  📊 Статистика   │
└──────────────────┴──────────────────┴──────────────────┘

╔═══════════════════════════════════════════════════════╗
║  📌 Активные Задачи (3)                                ║
╠═══════════════════════════════════════════════════════╣
║  🔴 СРОЧНО | Обработать просрочки                      ║
║     Срок: 10 января 2025                              ║
║     Клиентов: 15 | Обработано: 8                      ║
║     [Продолжить работу]                               ║
║───────────────────────────────────────────────────────║
║  🟡 Высокий | Повторный звонок клиентам               ║
║     Срок: 12 января 2025                              ║
║     Клиентов: 5 | Обработано: 2                       ║
║     [Продолжить работу]                               ║
╚═══════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  👥 Назначенные Мне Клиенты (23)                       ║
╠═══════════════════════════════════════════════════════╣
║  Фильтр: [Все] [Просрочки] [В работе] [Завершенные]  ║
║───────────────────────────────────────────────────────║
║  Иванов Иван Иванович                                 ║
║  📞 +996 555 123 456    💰 Долг: 15,000 сом            ║
║  ⚠️ Просрочка: 12 дней                                 ║
║  Последний контакт: 3 дня назад                       ║
║  [Позвонить] [История] [Добавить платеж]              ║
║───────────────────────────────────────────────────────║
║  ... (еще клиенты) ...                                ║
╚═══════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  📊 Моя Статистика За Месяц                            ║
╠═══════════════════════════════════════════════════════╣
║  Контактов: 45     Успешных платежей: 12              ║
║  Собрано: 65,000 сом    Выполнено задач: 8            ║
╚═══════════════════════════════════════════════════════╝
```

### 10.3 Интерфейс Работы с Клиентом

```
┌─────────────────────────────────────────────────────────┐
│  ◄ Назад к списку                                       │
│                                                         │
│  👤 Иванов Иван Иванович                                │
│  📞 +996 555 123 456                                    │
│  📧 ivanov@example.com                                  │
└─────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬───────────┐
│  📊 Обзор    │  📅 Платежи  │  📝 История  │  📞 Звонки│
└──────────────┴──────────────┴──────────────┴───────────┘

╔═══════════════════════════════════════════════════════╗
║  Финансовая Информация                                 ║
╠═══════════════════════════════════════════════════════╣
║  Общий долг:           50,000 сом                      ║
║  Выплачено:            20,000 сом                      ║
║  Осталось:             30,000 сом                      ║
║  Ежемесячный платеж:    5,000 сом                      ║
║  Следующий платеж:      10 января 2025                ║
║  ⚠️ ПРОСРОЧКА:         12 дней                         ║
╚═══════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  Быстрые Действия                                      ║
╠═══════════════════════════════════════════════════════╣
║  [📞 Позвонить]  [💰 Добавить Платеж]  [📝 Заметка]   ║
║  [📅 Назначить Встречу]  [⚠️ Отметить Проблему]        ║
╚═══════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  История Активности                                    ║
╠═══════════════════════════════════════════════════════╣
║  05.01.2025 10:30 | Иванов П. (я)                     ║
║  Действие: Звонок                                      ║
║  Результат: Обещал оплатить до 10 числа               ║
║───────────────────────────────────────────────────────║
║  03.01.2025 14:15 | Иванов П. (я)                     ║
║  Действие: Звонок                                      ║
║  Результат: Не ответил                                ║
║───────────────────────────────────────────────────────║
║  01.01.2025 09:00 | Администратор                     ║
║  Действие: Назначен менеджер                           ║
║  Назначен: Иванов П.                                  ║
╚═══════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  Мои Заметки                                           ║
╠═══════════════════════════════════════════════════════╣
║  [Добавить заметку...]                                ║
║                                                        ║
║  - Клиент обещал оплатить до 10 числа                 ║
║  - Сказал, что сейчас финансовые трудности            ║
║  - Напомнить 9 января                                 ║
╚═══════════════════════════════════════════════════════╝
```

### 10.4 Дашборд Администратора (Владельца)

```
┌─────────────────────────────────────────────────────────┐
│  🏢 ООО Рассрочка Плюс    👑 Кокуев Н. (Владелец)      │
└─────────────────────────────────────────────────────────┘

┌─────────┬─────────┬──────────┬──────────┬──────────────┐
│ Обзор   │ Клиенты │ Капиталы │ Менеджеры│ Аналитика    │
└─────────┴─────────┴──────────┴──────────┴──────────────┘

╔═══════════════════════════════════════════════════════╗
║  👥 Менеджеры (5)                      [+ Пригласить]  ║
╠═══════════════════════════════════════════════════════╣
║  Иванов Петр                                          ║
║  Роль: Менеджер по просрочкам                         ║
║  Клиентов: 23 | Задач: 3 | Активность: 🟢 Высокая    ║
║  [Управление] [Назначить Задачу] [Статистика]         ║
║───────────────────────────────────────────────────────║
║  Сидорова Мария                                       ║
║  Роль: Менеджер по продажам                           ║
║  Клиентов: 15 | Задач: 2 | Активность: 🟡 Средняя    ║
║  [Управление] [Назначить Задачу] [Статистика]         ║
║───────────────────────────────────────────────────────║
║  ... (еще менеджеры) ...                              ║
╚═══════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  📋 Создать Задачу для Менеджера                       ║
╠═══════════════════════════════════════════════════════╣
║  Название: ________________________________            ║
║  Тип: [Работа с просрочками ▼]                        ║
║  Приоритет: [⚪ Низкий] [⚪ Средний] [🔴 Высокий]      ║
║  Назначить: [Иванов П. ▼]                             ║
║  Срок: [10.01.2025]                                   ║
║                                                        ║
║  Клиенты:                                             ║
║  ☑️ Автоматически: Все с просрочкой > 7 дней          ║
║  ☐ Вручную выбрать клиентов                           ║
║                                                        ║
║  [Создать Задачу]                                     ║
╚═══════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════╗
║  📊 Статистика По Менеджерам (Январь 2025)             ║
╠═══════════════════════════════════════════════════════╣
║  Иванов П.:  Контактов: 45   Собрано: 65,000 сом      ║
║  Сидорова М.: Контактов: 32   Собрано: 48,000 сом     ║
║  Петров А.:  Контактов: 28   Собрано: 52,000 сом      ║
║                                                        ║
║  [Подробная Аналитика →]                              ║
╚═══════════════════════════════════════════════════════╝
```

### 10.5 Форма Приглашения Менеджера

```
╔═══════════════════════════════════════════════════════╗
║  Пригласить Нового Менеджера                           ║
╠═══════════════════════════════════════════════════════╣
║  Email:                                               ║
║  ┌─────────────────────────────────────────────────┐  ║
║  │ manager@example.com                             │  ║
║  └─────────────────────────────────────────────────┘  ║
║                                                        ║
║  Роль:                                                ║
║  ◉ Менеджер (ограниченный доступ)                     ║
║  ○ Администратор (почти полный доступ)                ║
║                                                        ║
║  Специализация:                                        ║
║  [Работа с просрочками ▼]                             ║
║    - Работа с просрочками                             ║
║    - Менеджер по продажам                             ║
║    - Финансовый менеджер                              ║
║    - Пользовательская роль...                         ║
║                                                        ║
║  Разрешения:                                          ║
║  ☑️ Просмотр клиентов (только назначенных)            ║
║  ☑️ Редактирование клиентов                           ║
║  ☐ Удаление клиентов                                  ║
║  ☑️ Добавление платежей                               ║
║  ☑️ Просмотр базовой аналитики                        ║
║  ☐ Просмотр финансовой аналитики                      ║
║  ☑️ Управление своими задачами                        ║
║                                                        ║
║  Доступ к капиталам:                                  ║
║  ◉ Все капиталы                                       ║
║  ○ Только выбранные:                                  ║
║    ☐ Основной капитал                                 ║
║    ☐ Капитал 2                                        ║
║                                                        ║
║  Должность: ______________________________            ║
║  Телефон: +996 ___ ___ ___                            ║
║                                                        ║
║  [Отправить Приглашение]  [Отмена]                    ║
╚═══════════════════════════════════════════════════════╝

После отправки:
- Менеджер получит email с приглашением
- Ссылка для регистрации будет действительна 7 дней
- После регистрации получит доступ с указанными правами
```

---

## Итоговая Схема Взаимодействия

### Сценарий 1: Владелец Создает Менеджера

1. **Владелец** (cokuevn@gmail.com) заходит в раздел "Менеджеры"
2. Нажимает "Пригласить менеджера"
3. Указывает email: `manager1@company.com`
4. Выбирает роль: "Менеджер по просрочкам"
5. Назначает разрешения (или использует предустановленные)
6. Система:
   - Создает пользователя в Firebase (если не существует)
   - Создает запись в `organization_members`
   - Отправляет email-приглашение
7. **Менеджер** получает email, регистрируется/входит
8. Автоматически попадает в организацию cokuevn@gmail.com
9. Видит только свой интерфейс менеджера

### Сценарий 2: Администратор Назначает Задачу

1. **Владелец/Админ** создает задачу:
   - Название: "Обработать просрочки"
   - Тип: Работа с просрочками
   - Назначить: Иванов П.
   - Фильтр: Все клиенты с просрочкой > 7 дней
2. Система:
   - Находит всех подходящих клиентов
   - Создает задачу в коллекции `tasks`
   - Назначает этих клиентов менеджеру (поле `assigned_to`)
   - Отправляет уведомление менеджеру
3. **Менеджер** видит задачу в своем дашборде
4. Начинает работу с клиентами
5. Фиксирует контакты в журнале активности
6. Отмечает задачу как выполненную с результатами

### Сценарий 3: Менеджер Работает с Клиентом

1. **Менеджер** открывает список своих клиентов
2. Видит только тех, кто назначен ему (проверка `assigned_to`)
3. Выбирает клиента "Иванов Иван"
4. Нажимает "Позвонить"
5. После звонка добавляет запись:
   - Действие: Звонок
   - Результат: Обещал оплатить
   - Заметка: "До 10 числа"
6. Система добавляет запись в `activity_log` клиента
7. **Владелец** видит эту активность в аналитике

---

## Преимущества Новой Архитектуры

✅ **Масштабируемость**: Легко добавлять новых менеджеров
✅ **Безопасность**: Четкое разграничение прав доступа
✅ **Прозрачность**: Вся активность логируется
✅ **Гибкость**: Настраиваемые роли и разрешения
✅ **Эффективность**: Делегирование задач менеджерам
✅ **Аналитика**: Отслеживание работы каждого менеджера
✅ **Обратная Совместимость**: Существующие данные сохраняются

---

## Следующие Шаги

1. **Создать новые модели** в `backend/server.py`
2. **Добавить новые API endpoints** для организаций, членов, задач
3. **Реализовать middleware** для проверки разрешений
4. **Провести миграцию** существующих данных
5. **Создать UI компоненты** для менеджеров (React)
6. **Добавить систему уведомлений** для задач
7. **Реализовать логирование** активности
8. **Создать аналитику** по работе менеджеров

---

*Документ создан: 5 января 2025*
*Версия: 1.0*

