"""
Скрипт резервного копирования базы данных MongoDB
Создает JSON бэкап всех коллекций перед миграцией
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import json
from datetime import datetime
import certifi

# Загружаем переменные окружения
load_dotenv()

async def backup_database():
    """Создать резервную копию всех коллекций"""
    
    print("=" * 70)
    print("РЕЗЕРВНОЕ КОПИРОВАНИЕ БАЗЫ ДАННЫХ")
    print("=" * 70)
    print()
    
    # Подключение к MongoDB
    mongo_url = os.environ.get('MONGO_URL')
    if not mongo_url:
        print("❌ Ошибка: MONGO_URL не найден в .env файле")
        return
    
    client = AsyncIOMotorClient(
        mongo_url,
        tls=True,
        tlsCAFile=certifi.where()
    )
    db_name = os.environ.get('DB_NAME', 'crm_db')
    db = client[db_name]
    
    print(f"✓ Подключено к базе данных: {db_name}")
    print()
    
    # Создаем директорию для бэкапов
    backup_dir = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(backup_dir, exist_ok=True)
    
    # Список коллекций для бэкапа
    collections = ['users', 'capitals', 'clients', 'payments', 'expenses']
    
    total_docs = 0
    
    for collection_name in collections:
        print(f"Копирование коллекции: {collection_name}...")
        
        # Получаем все документы
        docs = await db[collection_name].find({}).to_list(None)
        
        if docs:
            # Конвертируем ObjectId в строки
            for doc in docs:
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            
            # Сохраняем в JSON файл
            filename = os.path.join(backup_dir, f"{collection_name}.json")
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(docs, f, indent=2, ensure_ascii=False, default=str)
            
            print(f"  ✓ Сохранено {len(docs)} документов в {filename}")
            total_docs += len(docs)
        else:
            print(f"  ⊙ Коллекция пустая")
    
    print()
    print("=" * 70)
    print("РЕЗЕРВНАЯ КОПИЯ СОЗДАНА")
    print("=" * 70)
    print()
    print(f"✓ Всего скопировано документов: {total_docs}")
    print(f"✓ Директория бэкапа: {backup_dir}")
    print()
    print("Теперь можно безопасно запускать миграцию:")
    print("  python migrate_to_organizations.py")
    print()
    print("В случае проблем, у вас есть полная копия данных!")
    print()
    
    # Закрыть соединение
    client.close()

if __name__ == "__main__":
    asyncio.run(backup_database())

