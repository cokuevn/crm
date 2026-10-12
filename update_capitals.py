"""
Простое обновление капиталов - добавляет organization_id
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

async def update_capitals():
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url, tls=True, tlsCAFile=certifi.where())
    db = client[os.environ['DB_NAME']]
    
    print("🔄 ОБНОВЛЕНИЕ КАПИТАЛОВ")
    print("=" * 70)
    
    # Получить все капиталы без organization_id
    capitals = await db.capitals.find({
        "organization_id": {"$exists": False}
    }).to_list(1000)
    
    print(f"Найдено капиталов без organization_id: {len(capitals)}")
    
    updated = 0
    
    for capital in capitals:
        owner_id = capital.get("owner_id")
        if not owner_id:
            continue
        
        # Найти организацию этого владельца
        org = await db.organizations.find_one({"owner_id": owner_id})
        
        if org:
            # Обновить капитал
            await db.capitals.update_one(
                {"id": capital["id"]},
                {"$set": {"organization_id": org["id"]}}
            )
            updated += 1
            print(f"✓ {capital.get('name')} → {org.get('name')}")
    
    print()
    print(f"✅ Обновлено капиталов: {updated}")
    print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(update_capitals())

