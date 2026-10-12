"""
Обновить email пользователя из приглашения
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

async def update():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("📧 ОБНОВЛЕНИЕ EMAIL ПОЛЬЗОВАТЕЛЕЙ ИЗ ПРИГЛАШЕНИЙ")
    print("=" * 70)
    
    # Найти организацию "Комфорт"
    org = await db.organizations.find_one({"name": "Комфорт"})
    if not org:
        owner_id = "nF90MLbAV0RCrePYSEL4JwIooV22"
        org = await db.organizations.find_one({"owner_id": owner_id})
        if not org:
            print("❌ Организация не найдена")
            client.close()
            return
    
    print(f"\n✓ Организация: {org.get('name')} (ID: {org.get('id')})")
    
    # Найти все приглашения с pending
    pending_members = await db.organization_members.find({
        "organization_id": org["id"],
        "user_id": "pending",
        "is_active": True
    }).to_list(100)
    
    print(f"\n📋 Найдено приглашений: {len(pending_members)}")
    
    # Для каждого приглашения попробовать найти пользователя по email
    for member in pending_members:
        invited_email = member.get("metadata", {}).get("invited_email")
        if not invited_email:
            continue
        
        print(f"\n  📧 Ищу пользователя с email: {invited_email}")
        
        # Ищем пользователя по email
        user = await db.users.find_one({"email": invited_email})
        
        if user:
            print(f"    ✅ Найден user_id: {user.get('uid')}")
            print(f"    ✅ Email уже правильный: {user.get('email')}")
        else:
            print(f"    ⚠️ Пользователь не найден в базе")
            print(f"    💡 Пользователь должен войти в систему, чтобы создать запись")
    
    # Также проверим всех пользователей с дефолтным email
    print(f"\n🔍 Проверяю пользователей с дефолтным email...")
    default_users = await db.users.find({
        "email": "demo@example.com"
    }).to_list(100)
    
    print(f"  Найдено пользователей с demo@example.com: {len(default_users)}")
    
    for user in default_users:
        uid = user.get("uid")
        print(f"\n  👤 User ID: {uid}")
        
        # Ищем приглашение для этого user_id (если уже связан)
        member = await db.organization_members.find_one({
            "user_id": uid,
            "is_active": True
        })
        
        if member:
            invited_email = member.get("metadata", {}).get("invited_email")
            if invited_email and invited_email != "demo@example.com":
                print(f"    📧 Найдено приглашение с email: {invited_email}")
                print(f"    ✅ Обновляю email пользователя...")
                
                await db.users.update_one(
                    {"uid": uid},
                    {"$set": {"email": invited_email}}
                )
                
                print(f"    ✅ Email обновлен!")
        else:
            # Ищем приглашение по user_id в pending
            pending_member = await db.organization_members.find_one({
                "user_id": "pending",
                "metadata.invited_email": {"$exists": True},
                "is_active": True
            })
            
            if pending_member:
                invited_email = pending_member.get("metadata", {}).get("invited_email")
                print(f"    📧 Найдено pending приглашение с email: {invited_email}")
                print(f"    💡 Нужно связать приглашение с user_id")
    
    print("\n" + "=" * 70)
    print("✅ ГОТОВО!")
    print("\n📝 Инструкция:")
    print("  1. Менеджер должен войти в систему")
    print("  2. После входа запись в users будет создана автоматически")
    print("  3. Затем запустите: python link_manager_accounts.py")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update())

