"""
БЫСТРОЕ ИСПРАВЛЕНИЕ
Автоматически исправляет всё за один запуск
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

async def quick_fix():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ")
    print("=" * 70)
    print()
    
    # 1. Найти всех менеджеров
    managers = await db.organization_members.find({
        "role": "manager",
        "is_active": True
    }).to_list(1000)
    
    print(f"Найдено менеджеров: {len(managers)}")
    
    # 2. Удалить организации созданные менеджерами
    manager_uids = [m["user_id"] for m in managers if m["user_id"] != "pending"]
    
    wrong_orgs = await db.organizations.find({
        "owner_id": {"$in": manager_uids}
    }).to_list(100)
    
    if wrong_orgs:
        print(f"\n❌ Найдено ошибочных организаций: {len(wrong_orgs)}")
        for org in wrong_orgs:
            org_id = org["id"]
            owner = org["owner_id"]
            
            # Удалить всё связанное
            await db.capitals.delete_many({"organization_id": org_id})
            await db.capitals.delete_many({"owner_id": owner})
            await db.clients.delete_many({"organization_id": org_id})
            await db.organization_members.delete_many({"organization_id": org_id})
            await db.organizations.delete_one({"id": org_id})
            
            print(f"  ✓ Удалена: {org.get('name')}")
    
    # 3. Обновить приглашения - связать с реальными user_id
    pending_invitations = await db.organization_members.find({
        "metadata.invitation_pending": True,
        "is_active": True
    }).to_list(100)
    
    if pending_invitations:
        print(f"\n📧 Найдено приглашений: {len(pending_invitations)}")
        
        for invitation in pending_invitations:
            invited_email = invitation.get("metadata", {}).get("invited_email")
            if not invited_email:
                continue
            
            # Найти пользователя с этим email
            real_user = await db.users.find_one({"email": invited_email})
            
            if real_user and real_user["uid"] != invitation["user_id"]:
                # Обновить приглашение
                await db.organization_members.update_one(
                    {"id": invitation["id"]},
                    {
                        "$set": {
                            "user_id": real_user["uid"],
                            "metadata.invitation_pending": False
                        }
                    }
                )
                print(f"  ✓ Обновлено приглашение для: {invited_email}")
    
    print()
    print("=" * 70)
    print("✅ ВСЁ ИСПРАВЛЕНО!")
    print("=" * 70)
    print()
    print("Теперь:")
    print("  1. Перезапустите backend")
    print("  2. Менеджер должен выйти и войти снова")
    print("  3. Он увидит капиталы владельца!")
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(quick_fix())

