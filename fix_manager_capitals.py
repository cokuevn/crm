"""
Исправить проблему с капиталами для менеджера
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

async def fix():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🔧 ИСПРАВЛЕНИЕ КАПИТАЛОВ ДЛЯ МЕНЕДЖЕРА")
    print("=" * 70)
    
    # 1. Найти организацию "Комфорт" (для cokuevn@gmail.com)
    org = await db.organizations.find_one({"name": "Комфорт"})
    if not org:
        print("❌ Организация 'Комфорт' не найдена")
        # Попробуем найти по owner_id
        owner_id = "nF90MLbAV0RCrePYSEL4JwIooV22"
        org = await db.organizations.find_one({"owner_id": owner_id})
        if not org:
            print("❌ Организация для cokuevn@gmail.com не найдена")
            client.close()
            return
    
    print(f"\n✓ Организация найдена: {org.get('name')}")
    print(f"  ID: {org.get('id')}")
    print(f"  Owner ID: {org.get('owner_id')}")
    
    # 2. Найти все капиталы для этой организации
    # Сначала по organization_id
    caps_by_org = await db.capitals.find({
        "organization_id": org["id"],
        "is_active": True
    }).to_list(100)
    
    print(f"\n📊 Капиталы по organization_id: {len(caps_by_org)}")
    for cap in caps_by_org:
        print(f"  - {cap.get('name')} (ID: {cap.get('id')})")
    
    # Также по owner_id (на случай если не все мигрированы)
    caps_by_owner = await db.capitals.find({
        "owner_id": org["owner_id"],
        "is_active": True
    }).to_list(100)
    
    print(f"\n📊 Капиталы по owner_id: {len(caps_by_owner)}")
    for cap in caps_by_owner:
        if not cap.get("organization_id"):
            print(f"  - {cap.get('name')} (ID: {cap.get('id')}) - ⚠️ НЕТ organization_id")
    
    # 3. Найти всех менеджеров этой организации
    members = await db.organization_members.find({
        "organization_id": org["id"],
        "is_active": True
    }).to_list(100)
    
    print(f"\n👥 Члены организации: {len(members)}")
    for member in members:
        role = member.get("role")
        user_id = member.get("user_id")
        assigned = member.get("assigned_capitals", [])
        print(f"  - {role}: user_id={user_id}, assigned_capitals={len(assigned)}")
        
        # Если assigned_capitals пустой, но есть капиталы - назначить все
        if not assigned and caps_by_org:
            all_cap_ids = [c["id"] for c in caps_by_org]
            await db.organization_members.update_one(
                {"id": member["id"]},
                {"$set": {"assigned_capitals": all_cap_ids}}
            )
            print(f"    ✅ Назначены все {len(all_cap_ids)} капиталов")
    
    # 4. Убедиться, что все капиталы имеют organization_id
    print(f"\n🔄 Проверка капиталов...")
    updated = 0
    for cap in caps_by_owner:
        if not cap.get("organization_id"):
            await db.capitals.update_one(
                {"id": cap["id"]},
                {"$set": {"organization_id": org["id"]}}
            )
            updated += 1
            print(f"  ✅ Добавлен organization_id для '{cap.get('name')}'")
    
    if updated > 0:
        print(f"\n✅ Обновлено капиталов: {updated}")
    
    # 5. Показать итоговую статистику
    print(f"\n" + "=" * 70)
    print("📊 ИТОГОВАЯ СТАТИСТИКА")
    print("=" * 70)
    
    final_caps = await db.capitals.find({
        "organization_id": org["id"],
        "is_active": True
    }).to_list(100)
    
    print(f"✓ Капиталов в организации: {len(final_caps)}")
    for cap in final_caps:
        print(f"  - {cap.get('name')}")
    
    final_members = await db.organization_members.find({
        "organization_id": org["id"],
        "is_active": True
    }).to_list(100)
    
    print(f"\n✓ Членов организации: {len(final_members)}")
    for member in final_members:
        role = member.get("role")
        assigned = member.get("assigned_capitals", [])
        print(f"  - {role}: видит {len(assigned)} капиталов")
    
    print("\n✅ ГОТОВО! Теперь менеджер должен видеть все капиталы.")
    print("\n📝 Инструкция:")
    print("  1. Обновите страницу в браузере (Ctrl+F5)")
    print("  2. Менеджер должен увидеть все капиталы в селекторе")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix())

