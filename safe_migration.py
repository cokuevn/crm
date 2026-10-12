"""
БЕЗОПАСНАЯ миграция - ТОЛЬКО создает организации, НЕ меняет существующие данные

Этот скрипт:
1. Создает организацию для текущего пользователя
2. НЕ меняет капиталы (оставляет owner_id как есть)
3. НЕ меняет клиентов
4. Позволяет постепенно переходить на новую систему

БЕЗОПАСНО для существующей БД!
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from datetime import datetime
import certifi
import uuid
from pathlib import Path

# Загружаем .env из папки backend
ROOT_DIR = Path(__file__).parent
ENV_PATH = ROOT_DIR / 'backend' / '.env'
load_dotenv(ENV_PATH)

async def safe_migration():
    """Безопасная миграция - только создание организаций"""
    
    print("=" * 70)
    print("БЕЗОПАСНАЯ МИГРАЦИЯ (БЕЗ ИЗМЕНЕНИЯ СУЩЕСТВУЮЩИХ ДАННЫХ)")
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
    
    # Получить всех пользователей с капиталами
    all_capitals = await db.capitals.find({}).to_list(10000)
    
    # Собрать уникальных владельцев
    unique_owners = set()
    for capital in all_capitals:
        owner_id = capital.get("owner_id")
        if owner_id:
            unique_owners.add(owner_id)
    
    print(f"Найдено уникальных владельцев капиталов: {len(unique_owners)}")
    print()
    
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
    print("=" * 70)
    print("БЕЗОПАСНАЯ МИГРАЦИЯ ЗАВЕРШЕНА")
    print("=" * 70)
    print()
    print(f"✓ Создано новых организаций: {created_orgs}")
    print()
    print("✅ ВСЕ ВАШИ СУЩЕСТВУЮЩИЕ ДАННЫЕ ОСТАЛИСЬ БЕЗ ИЗМЕНЕНИЙ!")
    print()
    print("Что произошло:")
    print("  ✓ Созданы новые коллекции: organizations, organization_members")
    print("  ✓ Ваши капиталы НЕ изменены (owner_id сохранен)")
    print("  ✓ Ваши клиенты НЕ изменены")
    print("  ✓ Все работает как раньше!")
    print()
    print("Теперь вы можете:")
    print("  1. Открыть страницу 'Организации' в приложении")
    print("  2. Увидеть свою организацию")
    print("  3. Добавить менеджеров")
    print("  4. Создать задачи")
    print()
    print("Старая система продолжает работать параллельно!")
    print()
    
    # Закрыть соединение
    client.close()

if __name__ == "__main__":
    asyncio.run(safe_migration())

