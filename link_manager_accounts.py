"""
Связать приглашения менеджеров с реальными user_id по email
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

async def link():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🔗 СВЯЗЫВАНИЕ ПРИГЛАШЕНИЙ С РЕАЛЬНЫМИ АККАУНТАМИ")
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
    
    # Найти всех менеджеров с user_id=pending
    pending_members = await db.organization_members.find({
        "organization_id": org["id"],
        "user_id": "pending",
        "is_active": True
    }).to_list(100)
    
    print(f"\n📋 Найдено приглашений с user_id=pending: {len(pending_members)}")
    
    if len(pending_members) == 0:
        print("✅ Все приглашения уже связаны!")
        client.close()
        return
    
    # Для каждого приглашения найти пользователя по email
    linked = 0
    not_found = []
    
    for member in pending_members:
        invited_email = member.get("metadata", {}).get("invited_email")
        if not invited_email:
            print(f"  ⚠️ Приглашение {member.get('id')} не имеет invited_email")
            continue
        
        print(f"\n  📧 Ищу пользователя с email: {invited_email}")
        
        # Найти пользователя по email
        user = await db.users.find_one({"email": invited_email})
        
        if user:
            user_id = user.get("uid")
            print(f"    ✅ Найден user_id: {user_id}")
            
            # Обновить приглашение
            await db.organization_members.update_one(
                {"id": member["id"]},
                {
                    "$set": {
                        "user_id": user_id,
                        "metadata.invitation_pending": False
                    }
                }
            )
            
            print(f"    ✅ Приглашение обновлено!")
            linked += 1
        else:
            print(f"    ⚠️ Пользователь с email {invited_email} не найден в базе")
            print(f"       (Возможно, еще не зарегистрировался)")
            not_found.append(invited_email)
    
    print("\n" + "=" * 70)
    print("📊 РЕЗУЛЬТАТЫ")
    print("=" * 70)
    print(f"✅ Связано приглашений: {linked}")
    
    if not_found:
        print(f"\n⚠️ Не найдено пользователей для {len(not_found)} приглашений:")
        for email in not_found:
            print(f"   - {email}")
        print("\n💡 Эти пользователи должны сначала зарегистрироваться в системе")
    
    # Показать итоговое состояние
    print("\n📋 ТЕКУЩЕЕ СОСТОЯНИЕ:")
    all_members = await db.organization_members.find({
        "organization_id": org["id"],
        "is_active": True
    }).to_list(100)
    
    for member in all_members:
        user_id = member.get("user_id")
        role = member.get("role")
        email = member.get("metadata", {}).get("invited_email", "N/A")
        
        if user_id == "pending":
            print(f"  ⚠️ {role}: user_id=pending, email={email}")
        else:
            print(f"  ✅ {role}: user_id={user_id[:20]}..., email={email}")
    
    print("\n✅ ГОТОВО!")
    print("\n📝 Инструкция:")
    print("  1. Если есть приглашения с user_id=pending - пользователи должны зарегистрироваться")
    print("  2. После регистрации они автоматически свяжутся с приглашением")
    print("  3. Или запустите этот скрипт снова после регистрации")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(link())

