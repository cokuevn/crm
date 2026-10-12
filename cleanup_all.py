"""
Полная очистка - оставляет только нужные организации
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import certifi
from pathlib import Path

ROOT_DIR = Path(__file__).parent
ENV_PATH = ROOT_DIR / 'backend' / '.env'
load_dotenv(ENV_PATH)

async def cleanup_all():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🧹 ПОЛНАЯ ОЧИСТКА ОРГАНИЗАЦИЙ")
    print("=" * 70)
    print()
    
    # Показать все организации
    all_orgs = await db.organizations.find({}).to_list(100)
    
    print(f"Всего организаций: {len(all_orgs)}")
    print()
    
    # Определяем правильную организацию владельца
    main_owner_ids = [
        "nF90MLbAVORCrePYSEL4JwIooV22",  # UID владельца
        "cokuevn@gmail.com"              # Email владельца
    ]
    
    correct_orgs = []
    wrong_orgs = []
    
    for org in all_orgs:
        owner_id = org.get("owner_id")
        
        # Проверяем, является ли это организацией главного владельца
        if owner_id in main_owner_ids:
            correct_orgs.append(org)
            print(f"✅ ПРАВИЛЬНАЯ: {org['name']}")
            print(f"   Owner: {owner_id}")
        else:
            wrong_orgs.append(org)
            print(f"❌ ЛИШНЯЯ: {org['name']}")
            print(f"   Owner: {owner_id}")
    
    print()
    
    if not wrong_orgs:
        print("✅ Лишних организаций не найдено!")
        
        # Обновить приглашения
        await update_invitations(db)
        
        client.close()
        return
    
    print(f"Будет удалено {len(wrong_orgs)} лишних организаций")
    confirm = input("\nУдалить? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print("Отменено.")
        client.close()
        return
    
    # Удалить лишние организации
    for org in wrong_orgs:
        org_id = org['id']
        owner_id = org['owner_id']
        
        # Удалить всё связанное
        await db.capitals.delete_many({"organization_id": org_id})
        await db.capitals.delete_many({"owner_id": owner_id})
        await db.clients.delete_many({"organization_id": org_id})
        await db.organization_members.delete_many({"organization_id": org_id})
        await db.organizations.delete_one({"id": org_id})
        
        print(f"  ✓ Удалена: {org['name']}")
    
    print()
    
    # Обновить приглашения
    await update_invitations(db)
    
    print("=" * 70)
    print("✅ ГОТОВО!")
    print("=" * 70)
    print()
    print("Осталась только правильная организация!")
    print()
    print("Следующие шаги:")
    print("  1. Перезапустите backend")
    print("  2. Менеджеры должны:")
    print("     - Выйти")
    print("     - Очистить кэш (Ctrl+Shift+Delete)")
    print("     - Войти снова")
    print("  3. Теперь они увидят ваши капиталы!")
    print()
    
    client.close()

async def update_invitations(db):
    """Связать приглашения с реальными пользователями"""
    print("\n📧 Обновление приглашений...")
    
    # Найти все приглашения
    invitations = await db.organization_members.find({
        "metadata.invited_email": {"$exists": True}
    }).to_list(100)
    
    updated = 0
    for inv in invitations:
        invited_email = inv.get("metadata", {}).get("invited_email")
        current_uid = inv.get("user_id")
        
        if not invited_email:
            continue
        
        # Найти реального пользователя с этим email
        real_user = await db.users.find_one({"email": invited_email})
        
        if real_user and real_user["uid"] != current_uid:
            # Обновить user_id
            await db.organization_members.update_one(
                {"id": inv["id"]},
                {
                    "$set": {
                        "user_id": real_user["uid"],
                        "metadata.invitation_pending": False
                    }
                }
            )
            updated += 1
            print(f"  ✓ Связано: {invited_email} → {real_user['uid']}")
    
    if updated > 0:
        print(f"\nОбновлено приглашений: {updated}")
    else:
        print("\nПриглашения уже актуальны")

if __name__ == "__main__":
    asyncio.run(cleanup_all())

