"""
Скрипт для проверки капиталов в базе данных
Проверяет наличие капиталов "Беслан" и "Марха" и их настройки
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path
import certifi

# Загружаем .env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Коннект к MongoDB
mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

if not mongo_url or not db_name:
    print("Ошибка: MONGO_URL или DB_NAME не установлены в .env")
    exit(1)

client = AsyncIOMotorClient(
    mongo_url,
    tls=True,
    tlsCAFile=certifi.where()
)
db = client[db_name]

# ID капиталов из логов
BESLAN_ID = "08827cb5-d921-42cd-ba61-6aa8296d7039"
MARHA_ID = "c605e198-2f2e-4925-b92c-0ee3108813a9"

async def check_capitals():
    """Проверка капиталов в базе данных"""
    print("=" * 80)
    print("ПРОВЕРКА КАПИТАЛОВ В БАЗЕ ДАННЫХ")
    print("=" * 80)
    
    # Проверяем капитал "Беслан"
    print(f"\n1. Проверка капитала БЕСЛАН (ID: {BESLAN_ID})")
    print("-" * 80)
    beslan = await db.capitals.find_one({"id": BESLAN_ID})
    if beslan:
        print(f"✅ Капитал найден!")
        print(f"   Название: {beslan.get('name', 'НЕ УКАЗАНО')}")
        print(f"   Владелец (owner_id): {beslan.get('owner_id', 'НЕ УКАЗАНО')}")
        print(f"   Активен (is_active): {beslan.get('is_active', 'НЕ УКАЗАНО')}")
        print(f"   Баланс: {beslan.get('balance', 0)}")
        
        # Проверяем клиентов
        clients_count = await db.clients.count_documents({"capital_id": BESLAN_ID})
        print(f"   Количество клиентов: {clients_count}")
    else:
        print(f"❌ Капитал НЕ найден в базе данных!")
    
    # Проверяем капитал "Марха"
    print(f"\n2. Проверка капитала МАРХА (ID: {MARHA_ID})")
    print("-" * 80)
    marha = await db.capitals.find_one({"id": MARHA_ID})
    if marha:
        print(f"✅ Капитал найден!")
        print(f"   Название: {marha.get('name', 'НЕ УКАЗАНО')}")
        print(f"   Владелец (owner_id): {marha.get('owner_id', 'НЕ УКАЗАНО')}")
        print(f"   Активен (is_active): {marha.get('is_active', 'НЕ УКАЗАНО')}")
        print(f"   Баланс: {marha.get('balance', 0)}")
        
        # Проверяем клиентов
        clients_count = await db.clients.count_documents({"capital_id": MARHA_ID})
        print(f"   Количество клиентов: {clients_count}")
    else:
        print(f"❌ Капитал НЕ найден в базе данных!")
    
    # Сравниваем владельцев
    print(f"\n3. Сравнение владельцев")
    print("-" * 80)
    if beslan and marha:
        beslan_owner = beslan.get('owner_id')
        marha_owner = marha.get('owner_id')
        
        if beslan_owner == marha_owner:
            print(f"✅ У обоих капиталов одинаковый владелец: {beslan_owner}")
        else:
            print(f"⚠️  РАЗНЫЕ ВЛАДЕЛЬЦЫ!")
            print(f"   Беслан: {beslan_owner}")
            print(f"   Марха: {marha_owner}")
    
    # Проверяем всех капиталов пользователей
    print(f"\n4. Все капиталы в базе данных")
    print("-" * 80)
    all_capitals = await db.capitals.find({}).to_list(1000)
    print(f"Всего капиталов в базе: {len(all_capitals)}")
    
    # Группируем по владельцам
    owners = {}
    for cap in all_capitals:
        owner = cap.get('owner_id', 'unknown')
        if owner not in owners:
            owners[owner] = []
        owners[owner].append({
            'id': cap.get('id'),
            'name': cap.get('name', 'Без названия'),
            'is_active': cap.get('is_active', True)
        })
    
    print(f"\nКапиталы по владельцам:")
    for owner, caps in owners.items():
        print(f"  Владелец: {owner} ({len(caps)} капиталов)")
        for cap in caps:
            active = "✅" if cap['is_active'] else "❌"
            print(f"    {active} {cap['name']} (ID: {cap['id'][:8]}...)")
    
    # Проверяем клиентов для Мархи
    if marha:
        print(f"\n5. Клиенты капитала МАРХА")
        print("-" * 80)
        clients = await db.clients.find({"capital_id": MARHA_ID}).to_list(100)
        print(f"Всего клиентов: {len(clients)}")
        
        # Проверяем статусы
        statuses = {}
        for client in clients:
            status = client.get('status', 'unknown')
            statuses[status] = statuses.get(status, 0) + 1
        
        print(f"По статусам:")
        for status, count in statuses.items():
            print(f"  {status}: {count}")
        
        # Проверяем на наличие проблемных данных
        print(f"\n6. Проверка на проблемы в данных")
        print("-" * 80)
        
        # Проверяем клиентов без schedule
        clients_no_schedule = [c for c in clients if not c.get('schedule') or len(c.get('schedule', [])) == 0]
        if clients_no_schedule:
            print(f"⚠️  Клиентов без расписания платежей: {len(clients_no_schedule)}")
        
        # Проверяем клиентов с некорректными датами
        problematic_clients = []
        for client in clients:
            schedule = client.get('schedule', [])
            for payment in schedule:
                try:
                    payment_date = payment.get('payment_date')
                    if payment_date:
                        # Пытаемся распарсить дату
                        if isinstance(payment_date, str):
                            from datetime import datetime
                            datetime.strptime(payment_date, "%Y-%m-%d")
                except:
                    problematic_clients.append(client.get('id'))
                    break
        
        if problematic_clients:
            print(f"⚠️  Клиентов с проблемными датами: {len(set(problematic_clients))}")
    
    print("\n" + "=" * 80)
    print("ПРОВЕРКА ЗАВЕРШЕНА")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(check_capitals())
