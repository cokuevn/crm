#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def delete_clients_for_user():
    # Подключение к MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.test_database
    
    user_id = "cokuevn@gmail.com"
    
    try:
        print(f"Ищем капиталы для пользователя: {user_id}")
        
        # Находим все капиталы пользователя
        capitals = await db.capitals.find({"owner_id": user_id}).to_list(100)
        capital_ids = [cap["id"] for cap in capitals]
        
        print(f"Найдено капиталов: {len(capital_ids)}")
        for i, cap in enumerate(capitals, 1):
            print(f"{i}. {cap.get('name', 'Без названия')} (ID: {cap['id']})")
        
        if not capital_ids:
            print("У пользователя нет капиталов")
            return
        
        # Находим всех клиентов этих капиталов
        clients = await db.clients.find({"capital_id": {"$in": capital_ids}}).to_list(1000)
        print(f"\nНайдено клиентов для удаления: {len(clients)}")
        
        if clients:
            for i, client in enumerate(clients[:10], 1):  # Показываем первых 10
                print(f"{i}. {client.get('name', 'Без имени')} - {client.get('product', 'Без товара')}")
            if len(clients) > 10:
                print(f"... и еще {len(clients) - 10} клиентов")
        
        # Удаляем всех клиентов
        if clients:
            result = await db.clients.delete_many({"capital_id": {"$in": capital_ids}})
            print(f"\nУдалено клиентов: {result.deleted_count}")
        else:
            print("\nКлиенты не найдены")
            
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(delete_clients_for_user())