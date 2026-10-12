"""
Проверить данные конкретного менеджера
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

async def check():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🔍 ПРОВЕРКА МЕНЕДЖЕРА")
    print("=" * 70)
    
    email = input("Email менеджера (cokuevn99999@gmail.com): ").strip()
    if not email:
        email = "cokuevn99999@gmail.com"
    
    # Найти пользователя
    user = await db.users.find_one({"email": email})
    if not user:
        print(f"❌ Пользователь {email} не найден")
        client.close()
        return
    
    uid = user["uid"]
    print(f"\n✓ Пользователь найден: {email}")
    print(f"  UID: {uid}")
    
    # Найти членство
    member = await db.organization_members.find_one({
        "user_id": uid,
        "is_active": True
    })
    
    if not member:
        print(f"\n❌ Менеджер не состоит ни в одной организации")
        client.close()
        return
    
    print(f"\n✓ Членство найдено:")
    print(f"  Роль: {member.get('role')}")
    print(f"  Отдел: {member.get('department')}")
    
    # Найти организацию
    org = await db.organizations.find_one({"id": member["organization_id"]})
    
    if not org:
        print(f"\n❌ Организация не найдена")
        client.close()
        return
    
    print(f"\n✓ Организация: {org.get('name')}")
    print(f"  ID: {org.get('id')}")
    print(f"  Owner ID: {org.get('owner_id')}")
    
    # Найти капиталы по organization_id
    caps_by_org_id = await db.capitals.find({
        "organization_id": org["id"],
        "is_active": True
    }).to_list(100)
    
    print(f"\n📊 Капиталы по organization_id: {len(caps_by_org_id)}")
    for cap in caps_by_org_id:
        print(f"  - {cap.get('name')} (баланс: {cap.get('balance')})")
    
    # Найти капиталы по owner_id
    caps_by_owner = await db.capitals.find({
        "owner_id": org["owner_id"],
        "is_active": True
    }).to_list(100)
    
    print(f"\n📊 Капиталы по owner_id: {len(caps_by_owner)}")
    for cap in caps_by_owner:
        print(f"  - {cap.get('name')} (баланс: {cap.get('balance')})")
    
    print()
    print("=" * 70)
    
    if len(caps_by_org_id) < len(caps_by_owner):
        print("⚠️  ПРОБЛЕМА: Не все капиталы имеют organization_id")
        print(f"   По organization_id: {len(caps_by_org_id)}")
        print(f"   По owner_id: {len(caps_by_owner)}")
        print()
        print("РЕШЕНИЕ: Запустите python update_capitals.py")
    else:
        print("✅ Всё в порядке! Менеджер должен видеть все капиталы.")
    
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())

