#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_users():
    # Подключение к MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.test_database
    
    try:
        print("Все пользователи с капиталами:")
        
        # Находим все уникальные owner_id
        pipeline = [
            {"$group": {"_id": "$owner_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        users = await db.capitals.aggregate(pipeline).to_list(100)
        
        if not users:
            print("Капиталы не найдены")
            return
            
        for user in users:
            owner_id = user["_id"]
            count = user["count"]
            print(f"- {owner_id}: {count} капиталов")
            
            # Показываем клиентов для каждого пользователя
            capitals = await db.capitals.find({"owner_id": owner_id}).to_list(100)
            capital_ids = [cap["id"] for cap in capitals]
            
            if capital_ids:
                clients_count = await db.clients.count_documents({"capital_id": {"$in": capital_ids}})
                print(f"  Клиентов: {clients_count}")
                
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_users())