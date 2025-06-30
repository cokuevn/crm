#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def delete_all_clients():
    # Подключение к MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.test_database
    
    try:
        print("Удаляем всех клиентов...")
        
        # Подсчитываем клиентов перед удалением
        total_clients = await db.clients.count_documents({})
        print(f"Всего клиентов в базе: {total_clients}")
        
        if total_clients > 0:
            # Удаляем всех клиентов
            result = await db.clients.delete_many({})
            print(f"Удалено клиентов: {result.deleted_count}")
        else:
            print("Клиенты не найдены")
            
        # Проверяем, что все удалены
        remaining = await db.clients.count_documents({})
        print(f"Осталось клиентов: {remaining}")
            
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(delete_all_clients())