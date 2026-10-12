"""
Быстрая очистка организаций созданных менеджерами
Удаляет все организации где owner является менеджером в другой организации
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

async def cleanup():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🧹 ОЧИСТКА ОШИБОЧНЫХ ОРГАНИЗАЦИЙ")
    print("=" * 70)
    print()
    
    # Найти всех менеджеров
    managers = await db.organization_members.find({
        "role": {"$in": ["manager", "viewer"]},
        "is_active": True
    }).to_list(1000)
    
    manager_uids = [m["user_id"] for m in managers if m["user_id"] != "pending"]
    
    print(f"Найдено менеджеров: {len(manager_uids)}")
    
    # Найти организации созданные менеджерами (ошибочные)
    wrong_orgs = await db.organizations.find({
        "owner_id": {"$in": manager_uids}
    }).to_list(100)
    
    if not wrong_orgs:
        print("✅ Ошибочных организаций не найдено!")
        client.close()
        return
    
    print(f"\nНайдено ошибочных организаций: {len(wrong_orgs)}")
    for org in wrong_orgs:
        print(f"  - {org.get('name')} (owner: {org.get('owner_id')})")
    
    print("\n⚠️  Будут удалены:")
    print("   - Организации")
    print("   - Капиталы этих организаций")
    print("   - Клиенты этих организаций")
    print("   - Членства в этих организациях")
    
    confirm = input("\nПродолжить? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Отменено.")
        client.close()
        return
    
    total_deleted = {
        'orgs': 0,
        'capitals': 0,
        'clients': 0,
        'members': 0
    }
    
    for org in wrong_orgs:
        org_id = org["id"]
        
        # Удалить капиталы
        result = await db.capitals.delete_many({"organization_id": org_id})
        total_deleted['capitals'] += result.deleted_count
        
        # Также удалить капиталы по owner_id
        result = await db.capitals.delete_many({"owner_id": org["owner_id"]})
        total_deleted['capitals'] += result.deleted_count
        
        # Удалить клиентов
        result = await db.clients.delete_many({"organization_id": org_id})
        total_deleted['clients'] += result.deleted_count
        
        # Удалить членства
        result = await db.organization_members.delete_many({"organization_id": org_id})
        total_deleted['members'] += result.deleted_count
        
        # Удалить организацию
        await db.organizations.delete_one({"id": org_id})
        total_deleted['orgs'] += 1
        
        print(f"  ✓ Удалена: {org.get('name')}")
    
    print()
    print("=" * 70)
    print("ОЧИСТКА ЗАВЕРШЕНА")
    print("=" * 70)
    print(f"Удалено:")
    print(f"  - Организаций: {total_deleted['orgs']}")
    print(f"  - Капиталов: {total_deleted['capitals']}")
    print(f"  - Клиентов: {total_deleted['clients']}")
    print(f"  - Членств: {total_deleted['members']}")
    print()
    print("✅ Теперь менеджеры будут видеть только организацию владельца!")
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(cleanup())

