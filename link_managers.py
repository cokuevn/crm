"""
Связывает приглашенных менеджеров с их реальными аккаунтами
НЕ удаляет данные, только обновляет связи
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

async def link_managers():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🔗 СВЯЗЫВАНИЕ МЕНЕДЖЕРОВ С ПРИГЛАШЕНИЯМИ")
    print("=" * 70)
    print()
    
    # Показать всех пользователей
    users = await db.users.find({}).to_list(1000)
    print(f"👥 Всего пользователей: {len(users)}")
    for u in users:
        print(f"  - {u.get('email')} (UID: {u.get('uid')})")
    print()
    
    # Найти все приглашения
    invitations = await db.organization_members.find({
        "metadata.invited_email": {"$exists": True}
    }).to_list(100)
    
    print(f"📧 Найдено приглашений: {len(invitations)}")
    print()
    
    updated = 0
    
    for inv in invitations:
        invited_email = inv.get("metadata", {}).get("invited_email")
        current_uid = inv.get("user_id")
        org_id = inv.get("organization_id")
        
        if not invited_email:
            continue
        
        # Найти организацию
        org = await db.organizations.find_one({"id": org_id})
        if not org:
            continue
        
        print(f"Приглашение: {invited_email}")
        print(f"  Организация: {org.get('name')}")
        print(f"  Текущий UID: {current_uid}")
        
        # Найти реального пользователя с этим email
        real_user = await db.users.find_one({"email": invited_email})
        
        if real_user:
            real_uid = real_user["uid"]
            print(f"  Найден пользователь: {real_uid}")
            
            if real_uid != current_uid:
                # Обновить приглашение
                await db.organization_members.update_one(
                    {"id": inv["id"]},
                    {
                        "$set": {
                            "user_id": real_uid,
                            "metadata.invitation_pending": False
                        }
                    }
                )
                print(f"  ✅ ОБНОВЛЕНО: {current_uid} → {real_uid}")
                updated += 1
            else:
                print(f"  ✓ Уже связано")
        else:
            print(f"  ⚠️  Пользователь еще не зарегистрирован")
        
        print()
    
    print("=" * 70)
    print(f"✅ Обновлено приглашений: {updated}")
    print("=" * 70)
    print()
    
    if updated > 0:
        print("Следующие шаги:")
        print("  1. Перезапустите backend")
        print("  2. Менеджеры должны:")
        print("     - Выйти из системы")
        print("     - Очистить кэш (Ctrl+Shift+Delete)")
        print("     - Войти снова")
        print("  3. Теперь они попадут в организацию 'Комфорт'!")
    else:
        print("Все приглашения уже актуальны.")
    
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(link_managers())

