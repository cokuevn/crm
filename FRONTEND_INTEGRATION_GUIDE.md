# 📘 Руководство по Интеграции Frontend

## Что Создано

✅ **3 новые страницы:**
- `frontend/src/pages/Organizations.js` - Управление организациями
- `frontend/src/pages/OrganizationMembers.js` - Управление менеджерами  
- `frontend/src/pages/Tasks.js` - Задачи для менеджеров

✅ **API Сервис:**
- `frontend/src/lib/services/organizationService.js`

---

## Шаги Интеграции

### Шаг 1: Добавить Импорты в App.js

В файле `frontend/src/App.js` добавьте импорты новых страниц (около строки 27):

```javascript
// Существующие импорты...
const Chat = lazy(() => import('./pages/Chat'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AIChat = lazy(() => import('./features/chat/AIChat'));

// ДОБАВИТЬ ЭТИ СТРОКИ:
const Organizations = lazy(() => import('./pages/Organizations'));
const OrganizationMembers = lazy(() => import('./pages/OrganizationMembers'));
const Tasks = lazy(() => import('./pages/Tasks'));
```

### Шаг 2: Добавить Рендеринг Страниц

В файле `frontend/src/App.js` найдите секцию рендеринга страниц (около строки 250) и добавьте:

```javascript
{/* Существующие страницы */}
{currentPage === 'dashboard' && (
  <Suspense fallback={<PageLoader />}>
    <Dashboard
      capitals={capitals}
      selectedCapital={selectedCapital}
      onCapitalChange={handleCapitalChange}
      onClientUpdate={handleClientUpdate}
    />
  </Suspense>
)}

{currentPage === 'analytics' && (
  <Suspense fallback={<PageLoader />}>
    <Analytics selectedCapital={selectedCapital} />
  </Suspense>
)}

{/* ... другие страницы ... */}

{/* ДОБАВИТЬ ЭТИ БЛОКИ: */}

{currentPage === 'organizations' && (
  <Suspense fallback={<PageLoader />}>
    <Organizations />
  </Suspense>
)}

{currentPage === 'organization-members' && (
  <Suspense fallback={<PageLoader />}>
    <OrganizationMembers />
  </Suspense>
)}

{currentPage === 'tasks' && (
  <Suspense fallback={<PageLoader />}>
    <Tasks />
  </Suspense>
)}
```

### Шаг 3: Обновить Navigation.js

В файле `frontend/src/Navigation.js` добавьте:

#### 3.1. Импорты иконок (строка 3):

```javascript
import { 
  Users, BarChart3, CreditCard, UserPlus, Menu, X, MessageCircle, 
  RefreshCw, Download, Bell, BellOff,
  // ДОБАВИТЬ ЭТИ ИКОНКИ:
  BuildingOffice2Icon, 
  ClipboardDocumentListIcon 
} from 'lucide-react';
```

**Примечание:** Если иконки не найдены, используйте:
```javascript
// Добавьте эти SVG иконки как компоненты или используйте героicons:
import { BuildingOfficeIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
```

#### 3.2. Добавить функции навигации (около строки 40):

```javascript
const goChat = useCallback(() => {
  onPageChange('chat');
  setIsMobileMenuOpen(false);
}, [onPageChange]);

// ДОБАВИТЬ ЭТИ ФУНКЦИИ:
const goOrganizations = useCallback(() => {
  onPageChange('organizations');
  setIsMobileMenuOpen(false);
}, [onPageChange]);

const goTasks = useCallback(() => {
  onPageChange('tasks');
  setIsMobileMenuOpen(false);
}, [onPageChange]);
```

#### 3.3. Добавить кнопки в Desktop Navigation (около строки 318):

```javascript
<div className="flex items-center gap-2">
  <Button onClick={goDashboard} variant={currentPage === 'dashboard' ? 'primary' : 'ghost'} /* ... */>Дашборд</Button>
  <Button onClick={goAnalytics} variant={currentPage === 'analytics' ? 'primary' : 'ghost'} /* ... */>Аналитика</Button>
  <Button onClick={goExpenses} variant={currentPage === 'expenses' ? 'primary' : 'ghost'} /* ... */>Расходы</Button>
  <Button onClick={goAddClient} variant={currentPage === 'add-client' ? 'primary' : 'ghost'} /* ... */>Клиент</Button>
  
  {/* ДОБАВИТЬ ЭТИ КНОПКИ: */}
  <Button 
    onClick={goOrganizations} 
    variant={currentPage === 'organizations' ? 'primary' : 'ghost'} 
    size="md" 
    iconSize="sm" 
    className={currentPage === 'organizations' ? 'shadow-md shadow-blue-500/20' : ''}
  >
    Организации
  </Button>
  
  <Button 
    onClick={goTasks} 
    variant={currentPage === 'tasks' ? 'primary' : 'ghost'} 
    size="md" 
    iconSize="sm" 
    className={currentPage === 'tasks' ? 'shadow-md shadow-blue-500/20' : ''}
  >
    Задачи
  </Button>
</div>
```

#### 3.4. Добавить кнопки в Mobile Menu (около строки 424):

```javascript
<div className="pb-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
  <button onClick={goDashboard} /* ... */>
    <Users size={20} />
    <span>Дашборд (Клиенты)</span>
  </button>
  
  <button onClick={goAnalytics} /* ... */>
    <BarChart3 size={20} />
    <span>Аналитика</span>
  </button>
  
  <button onClick={goExpenses} /* ... */>
    <CreditCard size={20} />
    <span>Расходы</span>
  </button>
  
  <button onClick={goAddClient} /* ... */>
    <UserPlus size={20} />
    <span>Добавить клиента</span>
  </button>
  
  {/* ДОБАВИТЬ ЭТИ КНОПКИ: */}
  <button
    onClick={goOrganizations}
    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all touch-safe ${
      currentPage === 'organizations'
        ? 'bg-primary-600 text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <BuildingOfficeIcon size={20} />
    <span>Организации</span>
  </button>
  
  <button
    onClick={goTasks}
    className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all touch-safe ${
      currentPage === 'tasks'
        ? 'bg-primary-600 text-white'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <ClipboardDocumentListIcon size={20} />
    <span>Задачи</span>
  </button>
</div>
```

#### 3.5. Добавить кнопки в Mobile Bottom Navigation (около строки 608):

```javascript
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 /* ... */">
  <div className="flex justify-around items-center py-2 px-2">
    {/* Dashboard Tab */}
    <button onClick={goDashboard} /* ... */>
      <Users size={24} />
      <span className="text-xs mt-1 font-medium">Клиенты</span>
    </button>

    {/* Analytics Tab */}
    <button onClick={goAnalytics} /* ... */>
      <BarChart3 size={24} />
      <span className="text-xs mt-1 font-medium">Аналитика</span>
    </button>

    {/* ДОБАВИТЬ ЭТОТ TAB (заменяет Expenses): */}
    <button
      onClick={goTasks}
      className={`flex flex-col items-center justify-center touch-safe px-3 py-2 rounded-lg transition-all ${
        currentPage === 'tasks'
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      <ClipboardDocumentListIcon size={24} strokeWidth={currentPage === 'tasks' ? 2.5 : 2} />
      <span className={`text-xs mt-1 font-medium ${currentPage === 'tasks' ? 'text-primary-600 dark:text-primary-400' : ''}`}>
        Задачи
      </span>
    </button>

    {/* Add Client Tab */}
    <button onClick={goAddClient} /* ... */>
      <UserPlus size={24} />
      <span className="text-xs mt-1 font-medium">Клиент</span>
    </button>

    {/* Chat Tab */}
    <button onClick={goChat} /* ... */>
      <MessageCircle size={24} />
      <span className="text-xs mt-1 font-medium">Чат</span>
    </button>
  </div>
</nav>
```

### Шаг 4: Установить React Router (Опционально, но рекомендуется)

Для лучшей навигации можно добавить React Router:

```bash
cd frontend
npm install react-router-dom
```

Затем обернуть App в BrowserRouter:

```javascript
// frontend/src/index.js
import { BrowserRouter } from 'react-router-dom';

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### Шаг 5: Добавить Проверку Разрешений (Опционально)

Создайте хук для проверки прав пользователя:

```javascript
// frontend/src/hooks/usePermissions.js
import { useState, useEffect } from 'react';
import organizationService from '../lib/services/organizationService';

export function usePermissions() {
  const [organizations, setOrganizations] = useState([]);
  const [currentOrg, setCurrentOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const data = await organizationService.getMyOrganizations();
      setOrganizations(data);
      if (data.length > 0) {
        setCurrentOrg(data[0]);
      }
    } catch (error) {
      console.error('Failed to load organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!currentOrg) return false;
    if (currentOrg.my_role === 'owner') return true;
    if (currentOrg.my_permissions?.includes('*')) return true;
    if (currentOrg.my_permissions?.includes(permission)) return true;
    
    // Check wildcard
    const entity = permission.split('.')[0];
    return currentOrg.my_permissions?.includes(`${entity}.*`);
  };

  const canCreateTasks = hasPermission('tasks.create');
  const canInviteMembers = hasPermission('members.invite');
  const canManageOrganization = currentOrg?.my_role === 'owner' || currentOrg?.my_role === 'admin';

  return {
    organizations,
    currentOrg,
    setCurrentOrg,
    loading,
    hasPermission,
    canCreateTasks,
    canInviteMembers,
    canManageOrganization
  };
}
```

Использование:

```javascript
// В любом компоненте
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { canCreateTasks, hasPermission } = usePermissions();

  return (
    <div>
      {canCreateTasks && (
        <Button onClick={createTask}>Создать задачу</Button>
      )}
      
      {hasPermission('clients.edit') && (
        <Button onClick={editClient}>Редактировать</Button>
      )}
    </div>
  );
}
```

---

## Проверка Работы

### 1. Запустить Frontend

```bash
cd frontend
npm start
```

### 2. Проверить Новые Страницы

- Перейдите на страницу "Организации" через навигацию
- Создайте организацию
- Добавьте менеджера
- Создайте задачу

### 3. Проверить API Вызовы

Откройте DevTools → Network и проверьте, что запросы идут на backend:
- `GET /api/organizations/my`
- `POST /api/organizations/{org_id}/members`
- `POST /api/tasks`

---

## Возможные Проблемы и Решения

### Проблема 1: Иконки не найдены

**Решение:** Установите heroicons:
```bash
npm install @heroicons/react
```

Или используйте существующие иконки из lucide-react.

### Проблема 2: CORS ошибки

**Решение:** Убедитесь, что backend запущен и CORS настроен в `backend/server.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

### Проблема 3: 403 Forbidden

**Решение:** Проверьте, что:
1. Пользователь авторизован (есть Firebase token)
2. Выполнена миграция данных (`python migrate_to_organizations.py`)
3. У пользователя есть организация

### Проблема 4: Страницы не отображаются

**Решение:** Проверьте:
1. Правильно ли добавлены импорты в App.js
2. Правильно ли добавлен рендеринг страниц
3. Проверьте консоль браузера на ошибки

---

## Альтернативный Вариант: Использование React Router

Если хотите использовать React Router вместо состояния `currentPage`:

### 1. Обновить App.js

```javascript
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  // ... existing code ...
  
  return (
    <div className="App">
      <Navigation /* ... */ />
      
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard /* ... */ />} />
        <Route path="/analytics" element={<Analytics /* ... */ />} />
        <Route path="/expenses" element={<Expenses /* ... */ />} />
        <Route path="/add-client" element={<AddClientForm /* ... */ />} />
        <Route path="/chat" element={<Chat />} />
        
        {/* Новые роуты */}
        <Route path="/organizations" element={<Organizations />} />
        <Route path="/organizations/:orgId/members" element={<OrganizationMembers />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/client/:clientId" element={<ClientDetails /* ... */ />} />
      </Routes>
    </div>
  );
}
```

### 2. Обновить Navigation.js

```javascript
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation = ({ /* ... */ }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.split('/')[1] || 'dashboard';
  
  const goDashboard = () => navigate('/dashboard');
  const goOrganizations = () => navigate('/organizations');
  const goTasks = () => navigate('/tasks');
  // ... etc
  
  // ... rest of the component
};
```

---

## Готово! 🎉

После выполнения этих шагов у вас будет полностью функционирующая система управления организациями и менеджерами!

**Следующие шаги:**
1. Протестируйте создание организации
2. Добавьте первого менеджера
3. Создайте тестовую задачу
4. Проверьте работу под разными ролями

Если возникнут вопросы, обратитесь к файлам:
- `API_ENDPOINTS.md` - документация API
- `MANAGER_SYSTEM_ARCHITECTURE.md` - полная архитектура
- `START_HERE.md` - быстрый старт с backend

