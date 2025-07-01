#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json

async def check_imported_client():
    # Подключение к MongoDB
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client.test_database
    
    try:
        print("Проверяем импортированных клиентов...")
        
        # Находим последнего добавленного клиента
        client_data = await db.clients.find_one({}, sort=[("_id", -1)])
        
        if client_data:
            print(f"Последний клиент: {client_data.get('name')}")
            print(f"График платежей ({len(client_data.get('schedule', []))} платежей):")
            
            for i, payment in enumerate(client_data.get('schedule', [])[:5], 1):
                print(f"  {i}. Дата: {payment.get('payment_date')}, Статус: {payment.get('status')}, Сумма: {payment.get('amount')}")
            
            if len(client_data.get('schedule', [])) > 5:
                print(f"  ... и еще {len(client_data.get('schedule', [])) - 5} платежей")
                
            # Показываем весь график платежей первого клиента для детального анализа
            print("\nПолный график платежей первого клиента:")
            print(json.dumps(client_data.get('schedule', []), indent=2, ensure_ascii=False))
        else:
            print("Клиенты не найдены")
            
    except Exception as e:
        print(f"Ошибка: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_imported_client())