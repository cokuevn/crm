"""
Показать текущее состояние БД и автоматически исправить
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import certifi
from pathlib import Path

# Загружаем .env из папки backend
ROOT_DIR = Path(__file__).parent
ENV_PATH = ROOT_DIR / 'backend' / '.env'
load_dotenv(ENV_PATH)

async def show_and_fix():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("=" * 70)
    print("ТЕКУЩЕЕ СОСТОЯНИЕ БАЗЫ ДАННЫХ")
    print("=" * 70)
    print()
    
    # Показать все организации
    orgs = await db.organizations.find({}).to_list(100)
    print(f"📁 Организаций: {len(orgs)}")
    for org in orgs:
        print(f"  - {org['name']}")
        print(f"    ID: {org['id']}")
        print(f"    Owner: {org['owner_id']}")
        
        # Показать членов этой организации
        members = await db.organization_members.find({
            "organization_id": org['id'],
            "is_active": True
        }).to_list(100)
        
        print(f"    Членов: {len(members)}")
        for m in members:
            user = await db.users.find_one({"uid": m['user_id']})
            email = user.get('email') if user else 'unknown'
            invited_email = m.get('metadata', {}).get('invited_email', '')
            print(f"      • {email} (роль: {m['role']})")
            if invited_email and invited_email != email:
                print(f"        Приглашен как: {invited_email}")
        
        # Показать капиталы этой организации
        capitals = await db.capitals.find({
            "$or": [
                {"organization_id": org['id']},
                {"owner_id": org['owner_id']}
            ]
        }).to_list(100)
        print(f"    Капиталов: {len(capitals)}")
        print()
    
    # Найти проблемные организации
    print("=" * 70)
    print("ПОИСК ПРОБЛЕМ")
    print("=" * 70)
    print()
    
    # Проблема: менеджеры являются владельцами организаций
    problems_found = False
    
    for org in orgs:
        owner_uid = org['owner_id']
        
        # Проверить, является ли owner менеджером в другой организации
        is_manager_elsewhere = await db.organization_members.find_one({
            "user_id": owner_uid,
            "organization_id": {"$ne": org['id']},
            "role": {"$in": ["manager", "viewer"]},
            "is_active": True
        })
        
        if is_manager_elsewhere:
            problems_found = True
            print(f"❌ ПРОБЛЕМА: {org['name']}")
            print(f"   Owner {owner_uid} является менеджером в другой организации")
            print(f"   Эта организация будет удалена")
            print()
    
    if not problems_found:
        print("✅ Проблем не найдено!")
        print()
        client.close()
        return
    
    # Автоматическое исправление
    print("=" * 70)
    print("АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ")
    print("=" * 70)
    print()
    
    confirm = input("Удалить проблемные организации? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Отменено.")
        client.close()
        return
    
    # Удалить проблемные организации
    for org in orgs:
        owner_uid = org['owner_id']
        
        is_manager_elsewhere = await db.organization_members.find_one({
            "user_id": owner_uid,
            "organization_id": {"$ne": org['id']},
            "role": {"$in": ["manager", "viewer"]},
            "is_active": True
        })
        
        if is_manager_elsewhere:
            org_id = org['id']
            
            # Удалить всё
            await db.capitals.delete_many({"organization_id": org_id})
            await db.capitals.delete_many({"owner_id": owner_uid})
            await db.clients.delete_many({"organization_id": org_id})
            await db.organization_members.delete_many({"organization_id": org_id})
            await db.organizations.delete_one({"id": org_id})
            
            print(f"  ✓ Удалена: {org['name']}")
    
    print()
    print("=" * 70)
    print("✅ ГОТОВО!")
    print("=" * 70)
    print()
    print("Следующие шаги:")
    print("  1. Перезапустите backend: python backend/server.py")
    print("  2. Менеджер должен:")
    print("     - Выйти из системы")
    print("     - Очистить кэш (Ctrl+Shift+Delete)")
    print("     - Войти заново")
    print("  3. Теперь он увидит капиталы владельца!")
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(show_and_fix())

