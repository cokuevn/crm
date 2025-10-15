# 🤖 Настройка ИИ-чата в CRM

## 📋 Быстрый старт

### 1. Получите OpenAI API ключ
1. Зарегистрируйтесь на https://platform.openai.com
2. Пополните баланс ($5-10 достаточно для тестов)
3. Создайте API ключ в разделе "API Keys"

### 2. Настройте backend
Создайте файл `backend/.env` со следующим содержимым:

```bash
# Ваши существующие настройки MongoDB
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/database
DB_NAME=your_database

# Добавьте OpenAI ключ
OPENAI_API_KEY=sk-your-openai-api-key-here

# Опционально: настройки ИИ
AI_MODEL=gpt-4
AI_TEMPERATURE=0.1
AI_MAX_TOKENS=1000
```

### 3. Установите зависимости
```bash
cd backend
pip install -r requirements.txt
```

### 4. Запустите backend
```bash
cd backend
python server.py
```

### 5. Проверьте работу
1. Откройте frontend
2. В правом нижнем углу появится кнопка чата 💬
3. Нажмите и задайте вопрос: "Сколько у меня клиентов?"

## 🔧 Возможности ИИ-ассистента

### 📊 Что умеет ИИ:
- **Поиск клиентов**: "Найди клиента Иванов" или "Покажи клиентов с iPhone"
- **Анализ платежей**: "Покажи просроченные платежи" или "Сколько денег должны сегодня?"
- **Аналитика**: "Какая у меня статистика по основному капиталу?"
- **Рекомендации**: "Что делать с просрочкой?"
- **Поиск по телефону**: "Найди клиента с номером +7 123"

### 💡 Примеры вопросов:
```
"Покажи всех клиентов со статусом active"
"Сколько денег собрано за этот месяц?"
"Какие у меня самые проблемные клиенты?"
"Покажи аналитику по основному капиталу"
"Найди клиента который купил MacBook"
"Кто должен платить завтра?"
```

## 🏗️ Архитектура

### Backend (FastAPI)
- **CRMAIService**: Основной класс для работы с ИИ
- **Function Calling**: ИИ может вызывать функции CRM API
- **/api/ai/chat**: Endpoint для чата с ИИ
- **Контекст пользователя**: ИИ знает о текущем капитале и правах

### Frontend (React)
- **AIChat компонент**: Всплывающий чат в правом нижнем углу
- **Автопрокрутка**: Сообщения прокручиваются автоматически
- **Быстрые команды**: Готовые кнопки с вопросами
- **История чата**: Сохраняется в сессии браузера

## 🔐 Безопасность

### Что защищено:
- ✅ Доступ только к данным текущего пользователя
- ✅ Аутентификация через Firebase
- ✅ Фильтрация по капиталам пользователя
- ✅ Валидация всех запросов

### Что ИИ НЕ может:
- ❌ Изменять данные (только чтение)
- ❌ Видеть данные других пользователей
- ❌ Получать пароли или личную информацию
- ❌ Выполнять системные команды

## 💰 Стоимость

### OpenAI GPT-4 (рекомендуемо):
- **Ввод**: ~$0.03 за 1000 токенов
- **Вывод**: ~$0.06 за 1000 токенов  
- **Обычный вопрос**: ~$0.01-0.05
- **На 100 вопросов в день**: ~$1-5/месяц

### Альтернативы (бесплатные):
- **Ollama локально**: Бесплатно, но нужен мощный ПК
- **Hugging Face**: Бесплатный лимит
- **OpenAI GPT-3.5-turbo**: В 10 раз дешевле GPT-4

## 🚀 Расширенные возможности

### 1. RAG система (поиск по документам)
```python
# Добавить в CRMAIService
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma

def setup_rag(self):
    # Индексировать документы клиентов
    self.embeddings = OpenAIEmbeddings()
    self.vectorstore = Chroma(...)
```

### 2. Голосовой ввод
```javascript
// Добавить в AIChat компонент
const startVoiceInput = () => {
  const recognition = new webkitSpeechRecognition();
  recognition.onresult = (event) => {
    setInputMessage(event.results[0][0].transcript);
  };
  recognition.start();
};
```

### 3. Автоматические отчеты
```python
@api_router.post("/ai/generate-report")
async def generate_report(period: str, current_user: str = Depends(get_current_user)):
    prompt = f"Создай отчет за {period} по данным CRM..."
    # Генерация отчета через ИИ
```

## 🔧 Настройка других ИИ

### Claude (Anthropic)
```python
import anthropic

class ClaudeAIService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.environ['ANTHROPIC_API_KEY'])
```

### Локальный ИИ (Ollama)
```bash
# Установить Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Загрузить модель
ollama pull llama2:13b

# Запустить
ollama serve
```

## 🐛 Решение проблем

### ИИ не отвечает:
1. Проверьте `OPENAI_API_KEY` в `.env`
2. Проверьте баланс на OpenAI
3. Смотрите логи backend: `python server.py`

### Пустые ответы:
1. Проверьте подключение к MongoDB
2. Убедитесь что у пользователя есть данные
3. Проверьте права доступа к капиталам

### Ошибки функций:
1. Проверьте валидность данных в БД
2. Смотрите логи функций в консоли
3. Протестируйте API endpoints отдельно

## 📚 Полезные ресурсы

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Chat UI Patterns](https://ui.shadcn.com/docs/components/chat)
- [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/)

---

**Готово! Ваш ИИ-ассистент настроен и готов помогать с управлением CRM!** 🚀 
....юю