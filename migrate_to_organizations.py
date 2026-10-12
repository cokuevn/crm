"""
Скрипт миграции существующих данных к системе организаций

Этот скрипт:
1. Создает организацию для каждого существующего пользователя
2. Обновляет капиталы (owner_id -> organization_id)
3. Обновляет клиентов (добавляет organization_id)
4. Создает членство с ролью owner

Запуск:
    python migrate_to_organizations.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime
import certifi
from pathlib import Path

# Загружаем .env из папки backend
ROOT_DIR = Path(__file__).parent
ENV_PATH = ROOT_DIR / 'backend' / '.env'
load_dotenv(ENV_PATH)

async def run_migration():
    """Запустить полную миграцию к системе организаций"""
    
    print("=" * 70)
    print("МИГРАЦИЯ К СИСТЕМЕ ОРГАНИЗАЦИЙ")
    print("=" * 70)
    print()
    
    # Подключение к MongoDB
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("❌ Ошибка: MONGO_URL не найден в .env файле")
        return
    
    client = AsyncIOMotorClient(
        mongo_url,
        tls=True,
        tlsCAFile=certifi.where()
    )
    db_name = os.environ.get('DB_NAME', 'crm_db')
    db = client[db_name]
    
    print(f"✓ Подключено к базе данных: {db_name}")
    print()
    
    # ========================================================================
    # ШАГ 1: Создание организаций для существующих пользователей
    # ========================================================================
    
    print("ШАГ 1: Создание организаций для существующих пользователей")
    print("-" * 70)
    
    # Получить всех пользователей с капиталами
    all_capitals = await db.capitals.find({}).to_list(10000)
    
    # Собрать уникальных владельцев
    unique_owners = set()
    for capital in all_capitals:
        owner_id = capital.get("owner_id")
        if owner_id:
            unique_owners.add(owner_id)
    
    print(f"Найдено уникальных владельцев капиталов: {len(unique_owners)}")
    
    created_orgs = 0
    for owner_id in unique_owners:
        # Проверить, существует ли уже организация для этого владельца
        existing_org = await db.organizations.find_one({"owner_id": owner_id})
        
        if existing_org:
            print(f"  ⊙ Организация уже существует для: {owner_id}")
            continue
        
        # Получить информацию о пользователе
        user = await db.users.find_one({"uid": owner_id})
        
        # Определить имя организации
        if user:
            org_name = f"Организация {user.get('display_name', user.get('email', owner_id))}"
        else:
            org_name = f"Организация {owner_id}"
        
        # Создать организацию
        import uuid
        org_id = str(uuid.uuid4())
        
        org = {
            "id": org_id,
            "name": org_name,
            "owner_id": owner_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "settings": {
                "timezone": "UTC",
                "currency": "USD",
                "allow_negative_balance": False,
                "features": {}
            },
            "is_active": True
        }
        
        await db.organizations.insert_one(org)
        
        # Создать членство (owner)
        member_id = str(uuid.uuid4())
        member = {
            "id": member_id,
            "organization_id": org_id,
            "user_id": owner_id,
            "role": "owner",
            "permissions": ["*"],  # Полный доступ
            "department": "general",
            "assigned_capitals": [],
            "created_at": datetime.utcnow(),
            "created_by": owner_id,
            "is_active": True,
            "metadata": {}
        }
        
        await db.organization_members.insert_one(member)
        
        print(f"  ✓ Создана организация: {org_name}")
        print(f"    - Organization ID: {org_id}")
        print(f"    - Owner ID: {owner_id}")
        
        created_orgs += 1
    
    print()
    print(f"Создано новых организаций: {created_orgs}")
    print()
    
    # ========================================================================
    # ШАГ 2: Обновление капиталов
    # ========================================================================
    
    print("ШАГ 2: Обновление капиталов (owner_id -> organization_id)")
    print("-" * 70)
    
    # Получить все капиталы
    capitals = await db.capitals.find({}).to_list(10000)
    
    updated_capitals = 0
    skipped_capitals = 0
    
    for capital in capitals:
        capital_id = capital.get("id")
        owner_id = capital.get("owner_id")
        
        # Если уже есть organization_id, пропустить
        if capital.get("organization_id"):
            skipped_capitals += 1
            continue
        
        if not owner_id:
            print(f"  ⚠ Капитал без owner_id: {capital_id}")
            continue
        
        # Найти организацию этого владельца
        org = await db.organizations.find_one({"owner_id": owner_id})
        
        if not org:
            print(f"  ✗ Организация не найдена для капитала {capital_id}, owner: {owner_id}")
            continue
        
        # Обновить капитал
        await db.capitals.update_one(
            {"id": capital_id},
            {
                "$set": {
                    "organization_id": org["id"],
                    "restricted_access": False,
                    "allowed_users": []
                }
                # Оставляем owner_id для обратной совместимости
            }
        )
        
        updated_capitals += 1
    
    print(f"Обновлено капиталов: {updated_capitals}")
    print(f"Пропущено (уже имеют organization_id): {skipped_capitals}")
    print()
    
    # ========================================================================
    # ШАГ 3: Обновление клиентов
    # ========================================================================
    
    print("ШАГ 3: Обновление клиентов (добавление organization_id)")
    print("-" * 70)
    
    # Получить все клиенты
    clients = await db.clients.find({}).to_list(100000)
    
    updated_clients = 0
    skipped_clients = 0
    
    for client in clients:
        client_id = client.get("client_id")
        capital_id = client.get("capital_id")
        
        # Если уже есть organization_id, пропустить
        if client.get("organization_id"):
            skipped_clients += 1
            continue
        
        # Найти капитал
        capital = await db.capitals.find_one({"id": capital_id})
        
        if not capital or not capital.get("organization_id"):
            continue
        
        # Обновить клиента
        await db.clients.update_one(
            {"client_id": client_id},
            {
                "$set": {
                    "organization_id": capital["organization_id"],
                    "assigned_to": None,
                    "assigned_at": None,
                    "assigned_by": None,
                    "activity_log": [],
                    "tags": [],
                    "notes": None
                }
            }
        )
        
        updated_clients += 1
    
    print(f"Обновлено клиентов: {updated_clients}")
    print(f"Пропущено (уже имеют organization_id): {skipped_clients}")
    print()
    
    # ========================================================================
    # ИТОГИ
    # ========================================================================
    
    print("=" * 70)
    print("МИГРАЦИЯ ЗАВЕРШЕНА")
    print("=" * 70)
    print()
    print(f"✓ Создано организаций: {created_orgs}")
    print(f"✓ Обновлено капиталов: {updated_capitals}")
    print(f"✓ Обновлено клиентов: {updated_clients}")
    print()
    print("Теперь ваша система поддерживает:")
    print("  - Организации с несколькими пользователями")
    print("  - Менеджеров с разными ролями и разрешениями")
    print("  - Систему задач для менеджеров")
    print("  - Журнал активности")
    print()
    print("Следующие шаги:")
    print("  1. Протестируйте новые API endpoints")
    print("  2. Добавьте менеджеров через /organizations/{org_id}/members")
    print("  3. Создайте задачи для менеджеров через /tasks")
    print("  4. Обновите фронтенд для поддержки новой системы")
    print()
    
    # Закрыть соединение
    client.close()

if __name__ == "__main__":
    asyncio.run(run_migration())

