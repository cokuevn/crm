"""
Тестовый скрипт для проверки API системы менеджеров

Этот скрипт демонстрирует основные операции:
1. Получение списка организаций
2. Создание менеджера
3. Создание задачи
4. Получение задач
"""

import requests
import json

# Конфигурация
BASE_URL = "http://localhost:8000/api"
# Замените на ваш Firebase token
TOKEN = "your-firebase-token-here"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def print_section(title):
    """Красиво печатать заголовок секции"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")

def print_response(response):
    """Красиво печатать ответ"""
    print(f"Статус: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except:
        print(response.text)
    print()

def test_get_my_organizations():
    """Тест: получить мои организации"""
    print_section("1. Получение моих организаций")
    
    response = requests.get(f"{BASE_URL}/organizations/my", headers=headers)
    print_response(response)
    
    if response.status_code == 200:
        orgs = response.json()
        if orgs:
            return orgs[0]["id"]
    
    return None

def test_create_organization():
    """Тест: создать новую организацию"""
    print_section("2. Создание новой организации")
    
    org_data = {
        "name": "Тестовая Компания",
        "settings": {
            "timezone": "Asia/Bishkek",
            "currency": "KGS",
            "allow_negative_balance": True,
            "features": {
                "tasks": True,
                "analytics": True
            }
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/organizations",
        headers=headers,
        json=org_data
    )
    print_response(response)
    
    if response.status_code == 200:
        return response.json()["id"]
    
    return None

def test_get_organization_members(org_id):
    """Тест: получить членов организации"""
    print_section("3. Получение членов организации")
    
    org_headers = {**headers, "X-Organization-ID": org_id}
    
    response = requests.get(
        f"{BASE_URL}/organizations/{org_id}/members",
        headers=org_headers
    )
    print_response(response)

def test_invite_manager(org_id):
    """Тест: пригласить менеджера"""
    print_section("4. Приглашение менеджера")
    
    org_headers = {**headers, "X-Organization-ID": org_id}
    
    manager_data = {
        "user_email": "test_manager@example.com",
        "role": "manager",
        "department": "collections",
        "permissions": [
            "clients.view_all",
            "clients.edit",
            "payments.view",
            "payments.create",
            "tasks.view_assigned",
            "tasks.manage_assigned",
            "analytics.view_basic"
        ],
        "metadata": {
            "position": "Менеджер по просрочкам",
            "phone": "+996555123456",
            "hire_date": "2025-01-13"
        }
    }
    
    response = requests.post(
        f"{BASE_URL}/organizations/{org_id}/members",
        headers=org_headers,
        json=manager_data
    )
    print_response(response)
    
    if response.status_code == 200:
        return response.json()["user_id"]
    
    return None

def test_create_task(org_id, manager_id):
    """Тест: создать задачу для менеджера"""
    print_section("5. Создание задачи для менеджера")
    
    org_headers = {**headers, "X-Organization-ID": org_id}
    
    task_data = {
        "title": "Обработать просрочки за январь 2025",
        "description": "Связаться со всеми клиентами с просрочкой более 7 дней. Необходимо:\n1. Позвонить каждому клиенту\n2. Выяснить причину просрочки\n3. Договориться о дате платежа\n4. Зафиксировать результат",
        "type": "collection",
        "priority": "high",
        "assigned_to": manager_id,
        "client_filters": {
            "status": "overdue"
        },
        "due_date": "2025-01-20T23:59:59Z"
    }
    
    response = requests.post(
        f"{BASE_URL}/tasks",
        headers=org_headers,
        json=task_data
    )
    print_response(response)
    
    if response.status_code == 200:
        return response.json()["task_id"]
    
    return None

def test_get_tasks(org_id):
    """Тест: получить список задач"""
    print_section("6. Получение списка задач")
    
    org_headers = {**headers, "X-Organization-ID": org_id}
    
    response = requests.get(
        f"{BASE_URL}/tasks",
        headers=org_headers
    )
    print_response(response)

def test_add_task_comment(org_id, task_id):
    """Тест: добавить комментарий к задаче"""
    print_section("7. Добавление комментария к задаче")
    
    org_headers = {**headers, "X-Organization-ID": org_id}
    
    response = requests.post(
        f"{BASE_URL}/tasks/{task_id}/comments",
        headers=org_headers,
        params={"comment_text": "Начал работу над задачей. Первый клиент обещал оплатить до 15 числа."}
    )
    print_response(response)

def run_all_tests():
    """Запустить все тесты"""
    print("\n")
    print("╔" + "═" * 68 + "╗")
    print("║" + " " * 15 + "ТЕСТИРОВАНИЕ API СИСТЕМЫ МЕНЕДЖЕРОВ" + " " * 18 + "║")
    print("╚" + "═" * 68 + "╝")
    
    # Предупреждение
    print("\n⚠️  ВАЖНО: Убедитесь, что:")
    print("   1. Backend запущен (python backend/server.py)")
    print("   2. Вы заменили TOKEN на ваш реальный Firebase token")
    print("   3. Миграция данных выполнена (python migrate_to_organizations.py)")
    print("\nНажмите Enter для продолжения...")
    input()
    
    # 1. Получить существующие организации
    org_id = test_get_my_organizations()
    
    # Если нет организаций, создать новую
    if not org_id:
        print("\n⚠️  Организации не найдены. Создаю новую...")
        org_id = test_create_organization()
    
    if not org_id:
        print("\n❌ Ошибка: Не удалось получить или создать организацию")
        print("   Проверьте, что:")
        print("   - Backend запущен")
        print("   - TOKEN корректный")
        print("   - Миграция выполнена")
        return
    
    print(f"\n✓ Используем организацию: {org_id}")
    
    # 2. Получить членов организации
    test_get_organization_members(org_id)
    
    # 3. Пригласить менеджера
    manager_id = test_invite_manager(org_id)
    
    if not manager_id:
        print("\n⚠️  Не удалось создать менеджера. Возможно, он уже существует.")
        # Используем тестовый ID для продолжения
        manager_id = "test_manager_user_id"
    
    # 4. Создать задачу
    task_id = test_create_task(org_id, manager_id)
    
    # 5. Получить задачи
    test_get_tasks(org_id)
    
    # 6. Добавить комментарий (если задача создана)
    if task_id:
        test_add_task_comment(org_id, task_id)
    
    # Итоги
    print_section("ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")
    print("✓ Все основные endpoints протестированы")
    print("\nСледующие шаги:")
    print("  1. Проверьте данные в MongoDB")
    print("  2. Протестируйте вход под менеджером")
    print("  3. Начните разработку фронтенда")
    print()

if __name__ == "__main__":
    run_all_tests()

