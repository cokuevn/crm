from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, date, timedelta
from enum import Enum
import json
import math
from bson import ObjectId
import certifi

# Загружаем .env сразу!
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Коннект к MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(
    mongo_url,
    tls=True,
    tlsCAFile=certifi.where()
)
db = client[os.environ['DB_NAME']]

# Создаём FastAPI
app = FastAPI(title="CRM Finance System", version="1.0.0")

# Добавляем CORS (ТОЛЬКО ОДИН РАЗ!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем все домены для простоты
    allow_credentials=False,  # Отключаем credentials для "*" origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Лог для отладки
print("Running in demo mode without Firebase authentication")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

@api_router.get("/ping")
async def ping():
    return {"message": "pong"}

app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "Backend is alive!"}
    
# Enums
class ClientStatus(str, Enum):
    active = "active"
    overdue = "overdue"
    completed = "completed"
    archived = "archived"

class PaymentStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    overdue = "overdue"

class UserRole(str, Enum):
    admin = "admin"
    user = "user"

# Models
class User(BaseModel):
    uid: str
    email: str
    role: UserRole = UserRole.user
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Capital(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_id: str  # uid
    description: Optional[str] = None
    balance: float = 0.0  # Баланс капитала
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class PaymentSchedule(BaseModel):
    payment_date: str  # Changed from date to str for MongoDB compatibility
    amount: float
    status: PaymentStatus = PaymentStatus.pending
    paid_date: Optional[str] = None  # Changed from date to str

MAX_PAYMENT_MONTHS = 600  # Safety limit to prevent runaway schedules

class Client(BaseModel):
    client_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    capital_id: str
    name: str  # ФИО клиента
    product: str
    # Handle both old and new data models
    purchase_amount: Optional[float] = None  # Сумма покупки  
    debt_amount: Optional[float] = None  # Долг клиента (заменяет total_amount)
    total_amount: Optional[float] = None  # Старое поле для совместимости
    monthly_payment: float
    guarantor_name: Optional[str] = None  # ФИО гаранта
    client_address: Optional[str] = None  # Адрес клиента
    client_phone: Optional[str] = None  # Телефон клиента
    guarantor_phone: Optional[str] = None  # Телефон гаранта
    start_date: str  # Дата начала рассрочки
    contract_date: Optional[str] = None  # Дата заключения договора
    end_date: str
    schedule: List[PaymentSchedule] = []
    status: ClientStatus = ClientStatus.active
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def effective_debt_amount(self) -> float:
        """Get debt amount, falling back to total_amount for old data"""
        return self.debt_amount or self.total_amount or 0

class Expense(BaseModel):
    expense_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    capital_id: str
    amount: float
    description: str  # Назначение расхода
    category: str = "Общие расходы"  # Категория расхода
    expense_date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))  # Дата расхода
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Payment(BaseModel):
    payment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str
    capital_id: str
    amount: float
    payment_date: str  # Changed from date to str
    status: PaymentStatus = PaymentStatus.paid
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CapitalCreate(BaseModel):
    name: str
    description: Optional[str] = None
    balance: Optional[float] = 0.0

class CapitalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    balance: Optional[float] = None

class ExpenseCreate(BaseModel):
    capital_id: str
    amount: float
    description: str
    category: Optional[str] = "Общие расходы"  # Добавляем категорию

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None

class ClientCreate(BaseModel):
    capital_id: str
    name: str  # ФИО клиента
    product: str
    purchase_amount: Optional[float] = None  # Сумма покупки
    debt_amount: Optional[float] = None  # Долг клиента
    total_amount: Optional[float] = None  # Старое поле для совместимости
    monthly_payment: float
    guarantor_name: Optional[str] = None  # ФИО гаранта
    client_address: Optional[str] = None  # Адрес клиента
    client_phone: Optional[str] = None  # Телефон клиента
    guarantor_phone: Optional[str] = None  # Телефон гаранта
    start_date: str  # Дата начала рассрочки
    contract_date: Optional[str] = None  # Дата заключения договора
    months: int
    schedule: Optional[List[PaymentSchedule]] = None  # Готовый график платежей (опционально)

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    product: Optional[str] = None
    purchase_amount: Optional[float] = None
    debt_amount: Optional[float] = None
    monthly_payment: Optional[float] = None
    guarantor_name: Optional[str] = None
    client_address: Optional[str] = None
    client_phone: Optional[str] = None
    guarantor_phone: Optional[str] = None
    status: Optional[ClientStatus] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    contract_date: Optional[str] = None
    recalculate_schedule: Optional[bool] = False

class PaymentCreate(BaseModel):
    client_id: str
    amount: float
    payment_date: str  # Changed from date to str

class UserProfile(BaseModel):
    uid: str
    email: str
    role: UserRole
    display_name: Optional[str] = None

# Helper functions
def mongo_to_dict(mongo_doc):
    """Convert MongoDB document to dictionary, removing MongoDB ObjectId"""
    if mongo_doc is None:
        return None
    if '_id' in mongo_doc:
        del mongo_doc['_id']
    return mongo_doc

def normalize_client_end_date(client_doc: dict) -> dict:
    """Ensure client end_date equals the last payment_date in schedule if present."""
    try:
        schedule = client_doc.get("schedule") or []
        if schedule:
            last_date = schedule[-1].get("payment_date") if isinstance(schedule[-1], dict) else getattr(schedule[-1], "payment_date", None)
            if last_date:
                client_doc["end_date"] = last_date
    except Exception:
        # Do not fail response on normalization issues
        pass
    return client_doc

def generate_payment_schedule(start_date_str: str, monthly_payment: float, months: int) -> List[PaymentSchedule]:
    from calendar import monthrange
    
    schedule = []
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    current_date = start_date
    
    for i in range(months):
        # Add payment for current month
        schedule.append(PaymentSchedule(
            payment_date=current_date.strftime("%Y-%m-%d"),
            amount=monthly_payment
        ))
        
        # Move to next month with proper handling of month-end dates
        if i < months - 1:  # Don't calculate next month for the last iteration
            next_year = current_date.year
            next_month = current_date.month + 1
            
            if next_month > 12:
                next_year += 1
                next_month = 1
            
            # Handle month-end dates properly (e.g., Jan 31 -> Feb 28/29, not Feb 31)
            max_day_next_month = monthrange(next_year, next_month)[1]
            next_day = min(current_date.day, max_day_next_month)
            
            current_date = current_date.replace(year=next_year, month=next_month, day=next_day)
    
    return schedule

# Auth dependency (simplified for demo)
async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    # Demo mode - simplified authentication
    if authorization and authorization.startswith('Bearer '):
        token = authorization.split(' ')[1]
        # Known test users
        known_users = [
            "Jp06OUbk0xXqiXsQBOb6Sxwjeuo1",  # testuser@crm.com
            "62xbQnzxWLOMi27Q0iQVmo4mYfj2",  # demo@test.com
            "cokuevn@gmail.com",              # cokuevn@gmail.com (email as ID)
            "demo_user_uid"                   # fallback demo user
        ]
        
        # If it's a known user, use it directly
        if token in known_users:
            return token
            
        # If it contains @, treat as email (legacy support)
        if '@' in token:
            return token
            
        # Otherwise use as-is (likely a Firebase UID)
        return token
    
    # Fallback to demo user for requests without proper auth
    return "demo_user_uid"

# Routes

# User management
@api_router.post("/users", response_model=User)
async def create_user(user: UserProfile):
    user_dict = user.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users/me", response_model=User)
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"uid": current_user})
    if not user:
        # Create default user
        user_obj = User(uid=current_user, email="demo@example.com", display_name="Demo User")
        await db.users.insert_one(user_obj.dict())
        return user_obj
    return User(**mongo_to_dict(user))

# Capital management
@api_router.post("/capitals", response_model=Capital)
async def create_capital(capital: CapitalCreate, current_user: str = Depends(get_current_user)):
    capital_dict = capital.dict()
    capital_obj = Capital(**capital_dict, owner_id=current_user)
    await db.capitals.insert_one(capital_obj.dict())
    return capital_obj

@api_router.get("/capitals", response_model=List[Capital])
async def get_user_capitals(current_user: str = Depends(get_current_user)):
    # Маппинг между Firebase UID и email для пользователя
    user_mapping = {
        "nF90MLbAVORCrePYSEL4JwIooV22": "cokuevn@gmail.com",
        "cokuevn@gmail.com": "nF90MLbAVORCrePYSEL4JwIooV22",
    }
    
    # Используем $or для поиска по обоим ID одним запросом (более эффективно)
    if current_user in user_mapping:
        alternate_id = user_mapping[current_user]
        capitals = await db.capitals.find({
            "$or": [
                {"owner_id": current_user, "is_active": True},
                {"owner_id": alternate_id, "is_active": True}
            ]
        }).to_list(100)
    else:
        capitals = await db.capitals.find({"owner_id": current_user, "is_active": True}).to_list(100)
    
    return [Capital(**mongo_to_dict(capital)) for capital in capitals]

@api_router.get("/capitals/{capital_id}", response_model=Capital)
async def get_capital(capital_id: str, current_user: str = Depends(get_current_user)):
    # Проверяем право доступа - капитал должен принадлежать пользователю или альтернативному ID
    user_mapping = {
        "nF90MLbAVORCrePYSEL4JwIooV22": "cokuevn@gmail.com",
        "cokuevn@gmail.com": "nF90MLbAVORCrePYSEL4JwIooV22",
    }
    
    # Ищем капитал по текущему owner_id
    capital = await db.capitals.find_one({"id": capital_id, "owner_id": current_user})
    
    # Если не найден и есть маппинг, ищем по альтернативному ID
    if not capital and current_user in user_mapping:
        alternate_id = user_mapping[current_user]
        capital = await db.capitals.find_one({"id": capital_id, "owner_id": alternate_id})
    
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    return Capital(**mongo_to_dict(capital))

@api_router.put("/capitals/{capital_id}", response_model=Capital)
async def update_capital(capital_id: str, updates: CapitalUpdate, current_user: str = Depends(get_current_user)):
    # Verify capital ownership
    capital = await db.capitals.find_one({"id": capital_id, "owner_id": current_user})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    # Convert updates to dict and filter out None values
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    
    if update_dict:
        result = await db.capitals.update_one(
            {"id": capital_id, "owner_id": current_user},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Capital not found")
    
    updated_capital = await db.capitals.find_one({"id": capital_id})
    return Capital(**mongo_to_dict(updated_capital))

# Client management
@api_router.post("/clients", response_model=Client)
async def create_client(client: ClientCreate, current_user: str = Depends(get_current_user)):
    # Verify capital ownership
    capital = await db.capitals.find_one({"id": client.capital_id, "owner_id": current_user})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    # Check if there's enough balance for the purchase
    current_balance = capital.get("balance", 0.0)
    purchase_amount = client.purchase_amount or client.debt_amount or client.total_amount or 0
    
    if current_balance < purchase_amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Недостаточно средств в капитале. Доступно: {current_balance}₽, требуется: {purchase_amount}₽"
        )
    
    # Generate payment schedule
    print(f"DEBUG: client.schedule is not None: {client.schedule is not None}")
    if client.schedule:
        print(f"DEBUG: client.schedule length: {len(client.schedule)}")
        print(f"DEBUG: First schedule item: {client.schedule[0] if client.schedule else 'None'}")
        # Use provided schedule from import
        schedule = []
        for s in client.schedule:
            if isinstance(s, dict):
                schedule.append(PaymentSchedule(**s))
            elif hasattr(s, 'dict'):
                schedule.append(PaymentSchedule(**s.dict()))
            else:
                schedule.append(s)
        print(f"DEBUG: Converted schedule length: {len(schedule)}")
        print(f"DEBUG: First converted item status: {schedule[0].status if schedule else 'None'}")
    else:
        print("DEBUG: Using generated schedule")
        # Generate default schedule
        schedule = generate_payment_schedule(client.start_date, client.monthly_payment, client.months)
    
    end_date = schedule[-1].payment_date if schedule else client.start_date
    
    client_dict = client.dict()
    
    # Handle both old and new data models
    if client.debt_amount is None and client.total_amount is not None:
        # Old model: use total_amount as debt_amount
        client_dict["debt_amount"] = client_dict["total_amount"]
    elif client.total_amount is None and client.debt_amount is not None:
        # New model: use debt_amount as total_amount for backward compatibility
        client_dict["total_amount"] = client_dict["debt_amount"]
    elif client.total_amount is None and client.debt_amount is None:
        # Neither provided, raise error
        raise HTTPException(status_code=400, detail="Either debt_amount or total_amount must be provided")
    
    # If purchase_amount is not provided, use debt_amount
    if client_dict["purchase_amount"] is None:
        client_dict["purchase_amount"] = client_dict["debt_amount"]
    
    # If contract_date is not provided, set it to start_date minus 1 month
    if client_dict.get("contract_date") is None:
        try:
            start_date = datetime.strptime(client_dict["start_date"], "%Y-%m-%d")
            # Subtract 1 month
            if start_date.month == 1:
                contract_date = start_date.replace(year=start_date.year - 1, month=12)
            else:
                contract_date = start_date.replace(month=start_date.month - 1)
            client_dict["contract_date"] = contract_date.strftime("%Y-%m-%d")
        except ValueError:
            # If date parsing fails, use start_date as fallback
            client_dict["contract_date"] = client_dict["start_date"]
    
    client_obj = Client(
        **{k: v for k, v in client_dict.items() if k not in ['months', 'schedule']},
        schedule=[s.dict() for s in schedule],  # Convert to dict for MongoDB
        end_date=end_date
    )
    
    # Insert the client
    await db.clients.insert_one(client_obj.dict())
    
    # Deduct the purchase amount from capital balance
    new_balance = current_balance - purchase_amount
    await db.capitals.update_one(
        {"id": client.capital_id},
        {"$set": {"balance": new_balance}}
    )
    
    return client_obj

@api_router.get("/clients", response_model=List[Client])
async def get_clients(capital_id: Optional[str] = None, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    query = {"capital_id": {"$in": capital_ids}}
    if capital_id:
        if capital_id not in capital_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        query = {"capital_id": capital_id}
    
    clients = await db.clients.find(query).to_list(1000)
    normalized = [normalize_client_end_date(mongo_to_dict(client)) for client in clients]
    return [Client(**client) for client in normalized]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    client = await db.clients.find_one({"client_id": client_id, "capital_id": {"$in": capital_ids}})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    normalized = normalize_client_end_date(mongo_to_dict(client))
    return Client(**normalized)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, updates: ClientUpdate, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Get current client data
    current_client = await db.clients.find_one({"client_id": client_id, "capital_id": {"$in": capital_ids}})
    if not current_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Convert updates to dict and filter out None values
    update_dict = {k: v for k, v in updates.dict().items() if v is not None and k != "recalculate_schedule"}
    update_dict["updated_at"] = datetime.utcnow()
    
    # Check if schedule recalculation is needed
    should_recalculate = updates.recalculate_schedule
    if should_recalculate:
        try:
            months: Optional[int] = None
            # Determine values using updates with fallback to current client
            start_date_str = updates.start_date or current_client.get("start_date")
            end_date_str = updates.end_date  # may be None
            debt_amount = (
                updates.debt_amount if updates.debt_amount is not None else current_client.get("debt_amount")
            )
            monthly_payment = (
                updates.monthly_payment if updates.monthly_payment is not None else current_client.get("monthly_payment")
            )

            if not start_date_str:
                raise ValueError("start_date is required for schedule recalculation")
            if not monthly_payment:
                raise ValueError("monthly_payment is required for schedule recalculation")

            # Determine months from date range or from debt/amount
            if end_date_str:
                start_date_dt = datetime.strptime(start_date_str, "%Y-%m-%d")
                end_date_dt = datetime.strptime(end_date_str, "%Y-%m-%d")
                months = (end_date_dt.year - start_date_dt.year) * 12 + (end_date_dt.month - start_date_dt.month) + 1
                if months <= 0:
                    raise ValueError("End date must be after start date")
            else:
                if not debt_amount:
                    raise ValueError("debt_amount is required when end_date is not provided")
                months = max(1, math.ceil(float(debt_amount) / float(monthly_payment)))

            if months > MAX_PAYMENT_MONTHS:
                logger.warning(
                    "Recalculation aborted: client %s would produce %s payments (limit %s)",
                    client_id,
                    months,
                    MAX_PAYMENT_MONTHS,
                )
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Слишком длинный график платежей ({months} месяцев). "
                        "Проверьте сумму долга и ежемесячный платеж. Максимально допустимо "
                        f"{MAX_PAYMENT_MONTHS} месяцев."
                    ),
                )

            # Generate new payment schedule
            new_schedule = generate_payment_schedule(start_date_str, float(monthly_payment), months)
            
            # Preserve payment statuses from existing schedule if possible
            existing_schedule = current_client.get("schedule", [])
            preserved_schedule = []
            
            for i, new_payment in enumerate(new_schedule):
                new_payment_dict = new_payment.dict()
                
                # Try to find matching payment in existing schedule by index (for status preservation)
                if i < len(existing_schedule):
                    existing_payment = existing_schedule[i]
                    if existing_payment.get("status") == "paid":
                        new_payment_dict["status"] = "paid"
                        new_payment_dict["paid_date"] = existing_payment.get("paid_date")
                
                preserved_schedule.append(new_payment_dict)
            
            # Update schedule in the update dict
            update_dict["schedule"] = preserved_schedule
            
            # Set calculated end_date from the last payment
            if preserved_schedule:
                update_dict["end_date"] = preserved_schedule[-1]["payment_date"]
            
            # Ensure monthly_payment is saved (use updated if provided)
            update_dict["monthly_payment"] = float(monthly_payment)
            
            print(f"Recalculated schedule for client {client_id}: {len(preserved_schedule)} payments, monthly payment preserved: {monthly_payment}")
            
        except Exception as e:
            print(f"Error recalculating schedule: {e}")
            raise HTTPException(status_code=400, detail=f"Error recalculating payment schedule: {str(e)}")
    
    # Update the client
    result = await db.clients.update_one(
        {"client_id": client_id, "capital_id": {"$in": capital_ids}},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = await db.clients.find_one({"client_id": client_id})
    if client:
        normalized = normalize_client_end_date(mongo_to_dict(client))
        return Client(**normalized)
    else:
        raise HTTPException(status_code=404, detail="Client not found after update")

@api_router.put("/clients/{client_id}/complete")
async def complete_client(client_id: str, current_user: str = Depends(get_current_user)):
    """Mark client as completed (all payments made)"""
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Find the client
    client = await db.clients.find_one({
        "client_id": client_id, 
        "capital_id": {"$in": capital_ids}
    })
    
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check if all payments are completed
    schedule = client.get("schedule", [])
    all_paid = all(payment.get("status") == "paid" for payment in schedule)
    
    if not all_paid:
        raise HTTPException(
            status_code=400, 
            detail="Cannot complete client: not all payments are made"
        )
    
    # Update client status to completed
    result = await db.clients.update_one(
        {"client_id": client_id, "capital_id": {"$in": capital_ids}},
        {"$set": {"status": "completed", "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get updated client
    updated_client = await db.clients.find_one({"client_id": client_id})
    
    return {
        "message": "Client marked as completed successfully",
        "client": Client(**mongo_to_dict(updated_client))
    }

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Delete client
    result = await db.clients.delete_one({"client_id": client_id, "capital_id": {"$in": capital_ids}})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Delete related payments
    await db.payments.delete_many({"client_id": client_id})
    
    return {"message": "Client and related payments deleted successfully"}

# Update payment status
@api_router.put("/clients/{client_id}/payments/{payment_date}")
async def update_payment_status(
    client_id: str, 
    payment_date: str,
    request: dict,
    current_user: str = Depends(get_current_user)
):
    # Get status from request body
    status = request.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    # Validate status
    valid_statuses = ["pending", "paid", "overdue"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Find the client
    client = await db.clients.find_one({"client_id": client_id, "capital_id": {"$in": capital_ids}})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get capital for balance update
    capital = await db.capitals.find_one({"id": client["capital_id"]})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    # Update the payment status in schedule
    schedule = client.get("schedule", [])
    updated = False
    payment_amount = 0
    previous_status = None
    
    # Normalize input payment_date to YYYY-MM-DD format
    try:
        # Try to parse and normalize the payment_date
        if isinstance(payment_date, str):
            payment_date = payment_date.strip()
            # Parse different possible formats
            parsed_date = None
            for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%Y/%m/%d", "%d/%m/%Y"]:
                try:
                    parsed_date = datetime.strptime(payment_date, fmt).date()
                    break
                except ValueError:
                    continue
            
            if parsed_date:
                normalized_payment_date = parsed_date.strftime("%Y-%m-%d")
            else:
                normalized_payment_date = payment_date
        else:
            normalized_payment_date = payment_date
    except Exception as e:
        print(f"Error normalizing payment_date: {e}, using as-is: {payment_date}")
        normalized_payment_date = payment_date
    
    for payment in schedule:
        # Normalize payment date for comparison
        payment_date_str = payment.get("payment_date", "")
        if isinstance(payment_date_str, str):
            payment_date_str = payment_date_str.strip()
        try:
            # Try different date formats
            payment_date_parsed = None
            if isinstance(payment_date_str, str):
                for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%Y/%m/%d", "%d/%m/%Y"]:
                    try:
                        payment_date_parsed = datetime.strptime(payment_date_str, fmt).date()
                        break
                    except ValueError:
                        continue
                
                if payment_date_parsed:
                    payment_date_normalized = payment_date_parsed.strftime("%Y-%m-%d")
                else:
                    payment_date_normalized = payment_date_str
            else:
                payment_date_normalized = str(payment_date_str)
            
            # Compare normalized dates
            if payment_date_normalized == normalized_payment_date:
                previous_status = payment.get("status", "pending")
                payment_amount = payment.get("amount", 0)
                
                # Update payment status
                payment["status"] = status
                if status == "paid":
                    payment["paid_date"] = date.today().strftime("%Y-%m-%d")
                elif status != "paid":
                    # Clear paid_date if status changed from paid
                    payment["paid_date"] = None
                
                updated = True
                print(f"Updated payment {payment_date_normalized} status to {status} for client {client_id}")
                break
        except Exception as e:
            print(f"Error processing payment date {payment_date_str}: {e}")
            continue
    
    if not updated:
        print(f"Payment not found: payment_date={payment_date}, normalized={normalized_payment_date}")
        print(f"Available payment dates: {[p.get('payment_date') for p in schedule]}")
        raise HTTPException(status_code=404, detail=f"Payment not found for date: {payment_date}")
    
    # Update capital balance based on status change
    current_balance = capital.get("balance", 0.0)
    new_balance = current_balance
    
    # If changing TO paid status, add payment to balance
    if status == "paid" and previous_status != "paid":
        new_balance = current_balance + payment_amount
    # If changing FROM paid status, subtract payment from balance
    elif previous_status == "paid" and status != "paid":
        new_balance = current_balance - payment_amount
    
    # Update the client with new schedule
    await db.clients.update_one(
        {"client_id": client_id},
        {"$set": {"schedule": schedule, "updated_at": datetime.utcnow()}}
    )
    
    # Update capital balance if it changed
    if abs(new_balance - current_balance) > 0.01:  # Only update if balance actually changed
        await db.capitals.update_one(
            {"id": client["capital_id"]},
            {"$set": {"balance": new_balance}}
        )
    
    # Get updated client to return
    updated_client = await db.clients.find_one({"client_id": client_id})
    if updated_client:
        # Normalize end_date
        normalized_client = normalize_client_end_date(mongo_to_dict(updated_client))
    else:
        normalized_client = None
    
    return {
        "message": "Payment status updated successfully",
        "balance_change": new_balance - current_balance if abs(new_balance - current_balance) > 0.01 else 0,
        "new_balance": new_balance,
        "client": normalized_client
    }

# Update scheduled payment amount with carry-over logic
class PaymentAmountUpdate(BaseModel):
    amount: float

@api_router.put("/clients/{client_id}/payments/{payment_date}/amount", response_model=Client)
async def update_payment_amount(
    client_id: str,
    payment_date: str,
    payload: PaymentAmountUpdate,
    current_user: str = Depends(get_current_user)
):
    # Verify client ownership
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    client = await db.clients.find_one({"client_id": client_id, "capital_id": {"$in": capital_ids}})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    schedule = client.get("schedule", [])
    if not schedule:
        raise HTTPException(status_code=400, detail="Client has no schedule")
    
    # Normalize input payment_date
    try:
        if isinstance(payment_date, str):
            payment_date = payment_date.strip()
            parsed_date = None
            for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%Y/%m/%d", "%d/%m/%Y"]:
                try:
                    parsed_date = datetime.strptime(payment_date, fmt).date()
                    break
                except ValueError:
                    continue
            normalized_payment_date = parsed_date.strftime("%Y-%m-%d") if parsed_date else payment_date
        else:
            normalized_payment_date = payment_date
    except Exception:
        normalized_payment_date = payment_date
    
    # Find payment index by date (with flexible date matching)
    idx = -1
    for i, p in enumerate(schedule):
        p_date_str = p.get("payment_date", "")
        if isinstance(p_date_str, str):
            p_date_str = p_date_str.strip()
        try:
            # Normalize payment date from schedule
            p_parsed = None
            if isinstance(p_date_str, str):
                for fmt in ["%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y", "%Y/%m/%d", "%d/%m/%Y"]:
                    try:
                        p_parsed = datetime.strptime(p_date_str, fmt).date()
                        break
                    except ValueError:
                        continue
                p_normalized = p_parsed.strftime("%Y-%m-%d") if p_parsed else p_date_str
            else:
                p_normalized = str(p_date_str)
            
            if p_normalized == normalized_payment_date:
                idx = i
                break
        except Exception:
            # Fallback to exact match
            if p_date_str == payment_date or p_date_str == normalized_payment_date:
                idx = i
                break
    
    if idx == -1:
        raise HTTPException(status_code=404, detail=f"Payment not found for date: {payment_date}")
    
    old_amount = float(schedule[idx].get("amount", 0))
    new_amount = float(payload.amount)
    delta = new_amount - old_amount
    schedule[idx]["amount"] = round(new_amount, 2)
    
    # Carry delta to next payments
    remaining = delta
    j = idx + 1
    while abs(remaining) > 1e-9 and j < len(schedule):
        curr = float(schedule[j].get("amount", 0))
        adjusted = curr - remaining
        if adjusted < 0:
            remaining = -(adjusted)
            adjusted = 0.0
        else:
            remaining = 0.0
        schedule[j]["amount"] = round(adjusted, 2)
        j += 1
    
    # Trim trailing zero-amount payments
    while schedule and abs(float(schedule[-1].get("amount", 0))) < 1e-9:
        schedule.pop()
    
    # Update end_date based on new schedule
    end_date = schedule[-1]["payment_date"] if schedule else client.get("start_date")
    
    await db.clients.update_one(
        {"client_id": client_id},
        {"$set": {"schedule": schedule, "end_date": end_date, "updated_at": datetime.utcnow()}}
    )
    updated = await db.clients.find_one({"client_id": client_id})
    if updated:
        normalized = normalize_client_end_date(mongo_to_dict(updated))
        return Client(**normalized)
    else:
        raise HTTPException(status_code=404, detail="Client not found after update")

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client_old(client_id: str, updates: dict, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    updates["updated_at"] = datetime.utcnow()
    result = await db.clients.update_one(
        {"client_id": client_id, "capital_id": {"$in": capital_ids}},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = await db.clients.find_one({"client_id": client_id})
    return Client(**mongo_to_dict(client))

# Payment management
@api_router.post("/payments", response_model=Payment)
async def create_payment(payment: PaymentCreate, current_user: str = Depends(get_current_user)):
    # Verify client ownership
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    client = await db.clients.find_one({"client_id": payment.client_id, "capital_id": {"$in": capital_ids}})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    payment_dict = payment.dict()
    payment_obj = Payment(**payment_dict, capital_id=client["capital_id"])
    
    await db.payments.insert_one(payment_obj.dict())
    
    # Update client schedule
    client_obj = Client(**client)
    for schedule_item in client_obj.schedule:
        if (schedule_item.payment_date == payment.payment_date and 
            schedule_item.amount == payment.amount and 
            schedule_item.status == PaymentStatus.pending):
            schedule_item.status = PaymentStatus.paid
            schedule_item.paid_date = payment.payment_date
            break
    
    await db.clients.update_one(
        {"client_id": payment.client_id},
        {"$set": {"schedule": [s.dict() for s in client_obj.schedule], "updated_at": datetime.utcnow()}}
    )
    
    return payment_obj

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(capital_id: Optional[str] = None, current_user: str = Depends(get_current_user)):
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    query = {"capital_id": {"$in": capital_ids}}
    if capital_id:
        if capital_id not in capital_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        query = {"capital_id": capital_id}
    
    payments = await db.payments.find(query).to_list(1000)
    return [Payment(**mongo_to_dict(payment)) for payment in payments]

# Expense management
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate, current_user: str = Depends(get_current_user)):
    # Verify capital ownership
    capital = await db.capitals.find_one({"id": expense.capital_id, "owner_id": current_user})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    # Check if there's enough balance for the expense
    current_balance = capital.get("balance", 0.0)
    if current_balance < expense.amount:
        raise HTTPException(
            status_code=400, 
            detail=f"Недостаточно средств в капитале. Доступно: {current_balance}₽, требуется: {expense.amount}₽"
        )
    
    expense_dict = expense.dict()
    expense_dict["expense_date"] = datetime.utcnow().strftime("%Y-%m-%d")
    expense_obj = Expense(**expense_dict)
    await db.expenses.insert_one(expense_obj.dict())
    
    # Deduct the expense amount from capital balance
    new_balance = current_balance - expense.amount
    await db.capitals.update_one(
        {"id": expense.capital_id},
        {"$set": {"balance": new_balance}}
    )
    
    return expense_obj

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(capital_id: Optional[str] = None, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    query = {"capital_id": {"$in": capital_ids}}
    if capital_id:
        if capital_id not in capital_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        query = {"capital_id": capital_id}
    
    expenses = await db.expenses.find(query).sort("created_at", -1).to_list(1000)
    return [Expense(**mongo_to_dict(expense)) for expense in expenses]

@api_router.get("/expenses/{expense_id}", response_model=Expense)
async def get_expense(expense_id: str, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    expense = await db.expenses.find_one({"expense_id": expense_id, "capital_id": {"$in": capital_ids}})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return Expense(**mongo_to_dict(expense))

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, updates: ExpenseUpdate, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Get the original expense
    original_expense = await db.expenses.find_one({"expense_id": expense_id, "capital_id": {"$in": capital_ids}})
    if not original_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Convert updates to dict and filter out None values
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    
    # If amount is being updated, adjust the capital balance
    if "amount" in update_dict:
        capital = await db.capitals.find_one({"id": original_expense["capital_id"]})
        if capital:
            original_amount = original_expense["amount"]
            new_amount = update_dict["amount"]
            amount_difference = new_amount - original_amount
            
            current_balance = capital.get("balance", 0.0)
            if current_balance < amount_difference:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Недостаточно средств в капитале для увеличения расхода на {amount_difference}₽"
                )
            
            # Update capital balance
            new_balance = current_balance - amount_difference
            await db.capitals.update_one(
                {"id": original_expense["capital_id"]},
                {"$set": {"balance": new_balance}}
            )
    
    if update_dict:
        result = await db.expenses.update_one(
            {"expense_id": expense_id, "capital_id": {"$in": capital_ids}},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Expense not found")
    
    updated_expense = await db.expenses.find_one({"expense_id": expense_id})
    return Expense(**mongo_to_dict(updated_expense))

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Get the expense to return the amount to balance
    expense = await db.expenses.find_one({"expense_id": expense_id, "capital_id": {"$in": capital_ids}})
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Delete the expense
    result = await db.expenses.delete_one({"expense_id": expense_id, "capital_id": {"$in": capital_ids}})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Return the expense amount to capital balance
    capital = await db.capitals.find_one({"id": expense["capital_id"]})
    if capital:
        current_balance = capital.get("balance", 0.0)
        new_balance = current_balance + expense["amount"]
        await db.capitals.update_one(
            {"id": expense["capital_id"]},
            {"$set": {"balance": new_balance}}
        )
    
    return {"message": "Expense deleted successfully"}

# Analytics
@api_router.get("/analytics/{capital_id}")
async def get_capital_analytics(capital_id: str, current_user: str = Depends(get_current_user)):
    # Verify capital ownership
    capital = await db.capitals.find_one({"id": capital_id, "owner_id": current_user})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    # Get all clients except completed ones for analytics
    clients = await db.clients.find({
        "capital_id": capital_id,
        "status": {"$ne": "completed"}
    }).to_list(1000)
    
    # Calculate analytics from schedule data
    total_debt = 0
    total_paid = 0
    total_payments_count = 0
    paid_payments_count = 0
    overdue_count = 0
    total_overdue_amount = 0  # Total sum of overdue payments
    current_month_expected = 0
    monthly_profits = {}
    total_profit = 0  # Общая прибыль (долг - покупка)
    
    today = date.today()
    current_month = today.strftime("%Y-%m")
    
    # Initialize 12 months of data (current year)
    for month in range(1, 13):
        month_key = f"{today.year}-{month:02d}"
        monthly_profits[month_key] = 0
    
    for client in clients:
        # Use debt_amount if available, otherwise fall back to total_amount
        debt = client.get("debt_amount") or client.get("total_amount", 0)
        purchase = client.get("purchase_amount", 0) or debt  # Если нет purchase_amount, используем debt
        client_profit = debt - purchase  # Прибыль = долг - покупка
        
        total_debt += debt
        total_profit += client_profit
        
        # Get contract date to determine profit attribution month
        try:
            # Use contract_date if available, otherwise fallback to start_date
            contract_date_str = client.get("contract_date") or client.get("start_date", "")
            contract_date = datetime.strptime(contract_date_str, "%Y-%m-%d")
            contract_month = contract_date.strftime("%Y-%m")
            
            # Add profit to the contract month
            if contract_month in monthly_profits:
                monthly_profits[contract_month] += client_profit
        except (ValueError, TypeError):
            # If no valid date, add to current month
            if current_month in monthly_profits:
                monthly_profits[current_month] += client_profit
        
        # Calculate from schedule
        for schedule_item in client.get("schedule", []):
            try:
                payment_date = datetime.strptime(schedule_item["payment_date"], "%Y-%m-%d").date()
                payment_amount = schedule_item.get("amount", 0)
                payment_status = schedule_item.get("status", "pending")
                payment_month = payment_date.strftime("%Y-%m")
                
                total_payments_count += 1
                
                # Expected payments for current month
                if payment_month == current_month:
                    current_month_expected += payment_amount
                
                # Count paid payments and their amounts
                if payment_status == "paid":
                    total_paid += payment_amount
                    paid_payments_count += 1
                
                # Count overdue payments and sum their amounts
                elif (payment_status == "overdue" or 
                      (payment_status == "pending" and payment_date < today)):
                    overdue_count += 1
                    total_overdue_amount += payment_amount
                    
            except (ValueError, KeyError):
                continue
    
    active_clients = len([c for c in clients if c["status"] == "active"])
    
    # Get completed clients count
    completed_clients = await db.clients.find({
        "capital_id": capital_id,
        "status": "completed"
    }).to_list(1000)
    completed_clients_count = len(completed_clients)
    print(f"DEBUG: Found {completed_clients_count} completed clients for capital {capital_id}")  # Отладочная информация
    
    # Get expenses for this capital
    expenses = await db.expenses.find({"capital_id": capital_id}).to_list(1000)
    total_expenses = sum(expense.get("amount", 0) for expense in expenses)
    
    # Convert monthly_profits to list format for frontend
    monthly_profits_list = []
    for month in range(1, 13):
        month_key = f"{today.year}-{month:02d}"
        profit = monthly_profits.get(month_key, 0)
        
        try:
            month_name = datetime(today.year, month, 1).strftime("%B")
        except:
            month_name = f"Месяц {month}"
            
        monthly_profits_list.append({
            "month": month_key,
            "month_name": month_name,
            "profit": profit
        })
    
    return {
        "total_amount": total_debt,
        "total_paid": total_paid,
        "outstanding": total_debt - total_paid,
        "active_clients": active_clients,
        "completed_clients": completed_clients_count,
        "total_clients": len(clients),
        "overdue_payments": overdue_count,
        "total_overdue_amount": total_overdue_amount,  # Total sum of all overdue payments
        "collection_rate": (total_paid / total_debt * 100) if total_debt > 0 else 0,
        "total_payments": total_payments_count,
        "paid_payments": paid_payments_count,
        "payment_completion_rate": (paid_payments_count / total_payments_count * 100) if total_payments_count > 0 else 0,
        "total_expenses": total_expenses,
        "current_balance": capital.get("balance", 0),
        "total_profit": total_profit,  # Общая прибыль (долг - покупка)
        "net_income": total_paid - total_expenses,  # Чистый доход (поступления - расходы)
        "current_month_expected": current_month_expected,
        "monthly_profits": monthly_profits_list
    }

# Initialize mock data
@api_router.post("/init-mock-data")
async def init_mock_data(current_user: str = Depends(get_current_user)):
    # Create user if not exists
    user = await db.users.find_one({"uid": current_user})
    if not user:
        user_obj = User(uid=current_user, email="demo@example.com", display_name="Demo User", role=UserRole.admin)
        await db.users.insert_one(user_obj.dict())
    
    # Check if mock data already exists
    existing_capitals = await db.capitals.find({"owner_id": current_user}).to_list(10)
    if existing_capitals:
        return {"message": "Mock data already exists", "capitals": [mongo_to_dict(capital) for capital in existing_capitals]}
    
    # Create 2 capitals
    capital1 = Capital(
        name="Основной капитал",
        owner_id=current_user,
        description="Основной капитал для рассрочки электроники",
        balance=500000.0  # Начальный баланс 500,000₽
    )
    
    capital2 = Capital(
        name="Дополнительный фонд",
        owner_id=current_user,
        description="Дополнительные средства для крупных покупок",
        balance=300000.0  # Начальный баланс 300,000₽
    )
    
    await db.capitals.insert_one(capital1.dict())
    await db.capitals.insert_one(capital2.dict())
    
    # Create mock clients for capital 1
    clients_data1 = [
        {
            "name": "Петров Иван Сергеевич",
            "product": "iPhone 15 Pro",
            "purchase_amount": 120000.0,
            "debt_amount": 120000.0,
            "monthly_payment": 10000.0,
            "guarantor_name": "Петрова Мария Ивановна",
            "client_address": "г. Москва, ул. Ленина, д. 15, кв. 23",
            "client_phone": "+7 (123) 456-78-90",
            "guarantor_phone": "+7 (123) 456-78-91",
            "months": 12,
            "start_date": "2024-11-01"
        },
        {
            "name": "Сидорова Мария Петровна", 
            "product": "MacBook Air M3",
            "purchase_amount": 150000.0,
            "debt_amount": 150000.0,
            "monthly_payment": 12500.0,
            "guarantor_name": "Сидоров Петр Иванович",
            "client_address": "г. Москва, пр. Мира, д. 45, кв. 67",
            "client_phone": "+7 (234) 567-89-01",
            "guarantor_phone": "+7 (234) 567-89-02",
            "months": 12,
            "start_date": "2024-10-15"
        },
        {
            "name": "Козлов Александр Дмитриевич",
            "product": "iPad Pro",
            "purchase_amount": 80000.0,
            "debt_amount": 80000.0,
            "monthly_payment": 8000.0,
            "guarantor_name": "Козлова Елена Александровна",
            "client_address": "г. Москва, ул. Тверская, д. 12, кв. 89",
            "client_phone": "+7 (345) 678-90-12",
            "guarantor_phone": "+7 (345) 678-90-13",
            "months": 10,
            "start_date": "2024-12-01"
        }
    ]
    
    # Create mock clients for capital 2
    clients_data2 = [
        {
            "name": "Морозова Елена Викторовна",
            "product": "Samsung Galaxy S24",
            "purchase_amount": 90000.0,
            "debt_amount": 90000.0,
            "monthly_payment": 7500.0,
            "guarantor_name": "Морозов Виктор Алексеевич",
            "client_address": "г. Москва, ул. Арбат, д. 34, кв. 12",
            "client_phone": "+7 (456) 789-01-23",
            "guarantor_phone": "+7 (456) 789-01-24",
            "months": 12,
            "start_date": "2024-11-10"
        },
        {
            "name": "Волков Дмитрий Андреевич",
            "product": "PlayStation 5",
            "purchase_amount": 60000.0,
            "debt_amount": 60000.0,
            "monthly_payment": 6000.0,
            "guarantor_name": "Волкова Анна Сергеевна",
            "client_address": "г. Москва, ул. Чистые Пруды, д. 78, кв. 45",
            "client_phone": "+7 (567) 890-12-34",
            "guarantor_phone": "+7 (567) 890-12-35",
            "months": 10,
            "start_date": "2024-09-20"
        }
    ]
    
    # Create clients for both capitals
    for client_data in clients_data1:
        schedule = generate_payment_schedule(client_data["start_date"], client_data["monthly_payment"], client_data["months"])
        end_date = schedule[-1].payment_date if schedule else client_data["start_date"]
        
        client_obj = Client(
            capital_id=capital1.id,
            name=client_data["name"],
            product=client_data["product"],
            purchase_amount=client_data["purchase_amount"],
            debt_amount=client_data["debt_amount"],
            monthly_payment=client_data["monthly_payment"],
            guarantor_name=client_data.get("guarantor_name"),
            client_address=client_data.get("client_address"),
            client_phone=client_data.get("client_phone"),
            guarantor_phone=client_data.get("guarantor_phone"),
            start_date=client_data["start_date"],
            end_date=end_date,
            schedule=[s.dict() for s in schedule]  # Convert to dict for MongoDB
        )
        await db.clients.insert_one(client_obj.dict())
    
    for client_data in clients_data2:
        schedule = generate_payment_schedule(client_data["start_date"], client_data["monthly_payment"], client_data["months"])
        end_date = schedule[-1].payment_date if schedule else client_data["start_date"]
        
        client_obj = Client(
            capital_id=capital2.id,
            name=client_data["name"],
            product=client_data["product"],
            purchase_amount=client_data["purchase_amount"],
            debt_amount=client_data["debt_amount"],
            monthly_payment=client_data["monthly_payment"],
            guarantor_name=client_data.get("guarantor_name"),
            client_address=client_data.get("client_address"),
            client_phone=client_data.get("client_phone"),
            guarantor_phone=client_data.get("guarantor_phone"),
            start_date=client_data["start_date"],
            end_date=end_date,
            schedule=[s.dict() for s in schedule]  # Convert to dict for MongoDB
        )
        await db.clients.insert_one(client_obj.dict())
    
    return {"message": "Mock data initialized successfully", "capitals": [capital1.dict(), capital2.dict()]}

# Migration function to fix payment schedules for existing clients
@api_router.post("/migrate-payment-schedules")
async def migrate_payment_schedules(current_user: str = Depends(get_current_user)):
    """
    Migrates existing clients to use the corrected payment schedule logic.
    Preserves the status of already paid payments.
    """
    try:
        # Get all user's capitals
        user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
        capital_ids = [cap["id"] for cap in user_capitals]
        
        if not capital_ids:
            return {"message": "No capitals found for user", "migrated_count": 0}
        
        # Get all clients for user's capitals
        clients = await db.clients.find({"capital_id": {"$in": capital_ids}}).to_list(1000)
        migrated_count = 0
        
        for client_data in clients:
            try:
                # Parse client data
                start_date = client_data.get("start_date")
                monthly_payment = client_data.get("monthly_payment")
                current_schedule = client_data.get("schedule", [])
                
                if not start_date or not monthly_payment or not current_schedule:
                    continue
                
                # Calculate months from current schedule length
                months = len(current_schedule)
                
                # Generate new correct schedule
                new_schedule = generate_payment_schedule(start_date, monthly_payment, months)
                
                # Preserve payment statuses from old schedule
                preserved_schedule = []
                for i, new_payment in enumerate(new_schedule):
                    new_payment_dict = new_payment.dict()
                    
                    # Try to find matching payment in old schedule by index or amount
                    if i < len(current_schedule):
                        old_payment = current_schedule[i]
                        if old_payment.get("status") == "paid":
                            new_payment_dict["status"] = "paid" 
                            new_payment_dict["paid_date"] = old_payment.get("paid_date")
                    
                    preserved_schedule.append(new_payment_dict)
                
                # Update client with new schedule and normalized end_date
                await db.clients.update_one(
                    {"client_id": client_data["client_id"]},
                    {
                        "$set": {
                            "schedule": preserved_schedule,
                            "end_date": preserved_schedule[-1]["payment_date"] if preserved_schedule else client_data.get("end_date"),
                            "updated_at": datetime.utcnow(),
                            "migration_applied": True  # Mark as migrated
                        }
                    }
                )
                
                migrated_count += 1
                
            except Exception as e:
                print(f"Error migrating client {client_data.get('client_id', 'unknown')}: {e}")
                continue
        
        return {
            "message": f"Successfully migrated {migrated_count} clients",
            "migrated_count": migrated_count,
            "total_clients": len(clients)
        }
        
    except Exception as e:
        print(f"Migration error: {e}")
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")

# Auto-initialize mock data on first login
@api_router.get("/auto-init")
async def auto_init_data(current_user: str = Depends(get_current_user)):
    # Check if user has any capitals
    existing_capitals = await db.capitals.find({"owner_id": current_user}).to_list(10)
    if not existing_capitals:
        return await init_mock_data(current_user)
    return {"message": "Data already exists", "capitals": [mongo_to_dict(capital) for capital in existing_capitals]}

# Delete capital
@api_router.delete("/capitals/{capital_id}")
async def delete_capital(capital_id: str, current_user: str = Depends(get_current_user)):
    # Verify capital ownership
    capital = await db.capitals.find_one({"id": capital_id, "owner_id": current_user})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    # Delete all clients in this capital
    await db.clients.delete_many({"capital_id": capital_id})
    
    # Delete all payments in this capital
    await db.payments.delete_many({"capital_id": capital_id})
    
    # Delete all expenses in this capital
    await db.expenses.delete_many({"capital_id": capital_id})
    
    # Delete the capital
    result = await db.capitals.delete_one({"id": capital_id, "owner_id": current_user})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    return {"message": "Capital deleted successfully"}

# Dashboard data
@api_router.get("/dashboard")
async def get_dashboard_data(capital_id: Optional[str] = None, current_user: str = Depends(get_current_user)):
    # Логируем только при наличии capital_id (для отладки конкретных запросов)
    if capital_id:
        logger.info(f"Dashboard request - capital_id: {capital_id}")
    
    # Получаем капиталы пользователя - ищем по текущему owner_id и альтернативным идентификаторам
    # Используем $or для поиска по обоим ID одновременно (более эффективно)
    user_mapping = {
        "nF90MLbAVORCrePYSEL4JwIooV22": "cokuevn@gmail.com",
        "cokuevn@gmail.com": "nF90MLbAVORCrePYSEL4JwIooV22",
    }
    
    # Строим запрос для поиска капиталов
    if current_user in user_mapping:
        alternate_id = user_mapping[current_user]
        # Ищем капиталы по обоим ID одним запросом (более эффективно)
        user_capitals = await db.capitals.find({
            "$or": [
                {"owner_id": current_user, "is_active": True},
                {"owner_id": alternate_id, "is_active": True}
            ]
        }).to_list(100)
    else:
        # Если маппинга нет, ищем только по current_user
        user_capitals = await db.capitals.find({"owner_id": current_user, "is_active": True}).to_list(100)
    
    capital_ids = [cap["id"] for cap in user_capitals]
    
    if capital_id and capital_id not in capital_ids:
        # Проверяем, существует ли вообще такой капитал в базе (только при отказе, для отладки)
        capital_exists = await db.capitals.find_one({"id": capital_id}, {"owner_id": 1})  # Только owner_id для экономии памяти
        if capital_exists:
            logger.warning(f"Access denied: capital {capital_id} belongs to {capital_exists.get('owner_id')}, user: {current_user}")
        else:
            logger.warning(f"Access denied: capital {capital_id} does not exist")
        raise HTTPException(status_code=403, detail="Access denied")
    
    query_capital_ids = [capital_id] if capital_id else capital_ids
    
    try:
        # Get all clients except completed ones for general dashboard
        clients = await db.clients.find({
            "capital_id": {"$in": query_capital_ids},
            "status": {"$ne": "completed"}
        }).to_list(1000)
        clients = [mongo_to_dict(client) for client in clients]
        
        today = date.today()
        from datetime import timedelta
        tomorrow = today + timedelta(days=1)
        
        today_payments = []
        tomorrow_payments = []
        overdue_payments = []
        
        for client in clients:
            for schedule_item in client.get("schedule", []):
                try:
                    # Handle both string and date formats
                    if isinstance(schedule_item["payment_date"], str):
                        payment_date = datetime.strptime(schedule_item["payment_date"], "%Y-%m-%d").date()
                    else:
                        payment_date = schedule_item["payment_date"]
                    
                    # Check if payment is overdue OR has overdue status
                    is_overdue = (schedule_item["status"] == "overdue" or 
                                (schedule_item["status"] == "pending" and payment_date < today))
                    
                    if is_overdue:
                        overdue_payments.append({
                            "client": client,
                            "payment": schedule_item
                        })
                    elif schedule_item["status"] == "pending" and payment_date == today:
                        today_payments.append({
                            "client": client,
                            "payment": schedule_item
                        })
                    elif schedule_item["status"] == "pending" and payment_date == tomorrow:
                        tomorrow_payments.append({
                            "client": client,
                            "payment": schedule_item
                        })
                except (ValueError, KeyError) as e:
                    continue  # Skip invalid date entries
        
        # Get completed clients separately
        completed_clients = await db.clients.find({
            "capital_id": {"$in": query_capital_ids},
            "status": "completed"
        }).to_list(1000)
        completed_clients = [mongo_to_dict(client) for client in completed_clients]
        
        # Логируем только базовую информацию (уменьшаем нагрузку)
        if len(clients) > 100 or len(completed_clients) > 100:
            logger.info(f"Dashboard data prepared - clients: {len(clients)}, completed: {len(completed_clients)}")

        result = {
            "today": today_payments,
            "tomorrow": tomorrow_payments,
            "overdue": overdue_payments,
            "all_clients": clients,
            "completed_clients": completed_clients
        }
    except Exception as e:
        logger.error(f"Error processing dashboard data for capital {capital_id}: {str(e)}", exc_info=True)
        # Возвращаем пустые данные вместо ошибки, чтобы фронтенд не падал
        return {
            "today": [],
            "tomorrow": [],
            "overdue": [],
            "all_clients": [],
            "completed_clients": []
        }
    
    return result

@api_router.post("/migrate-contract-dates")
async def migrate_contract_dates(current_user: str = Depends(get_current_user)):
    """Migrate existing clients to add contract_date field"""
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Find clients without contract_date
    clients = await db.clients.find({
        "capital_id": {"$in": capital_ids},
        "contract_date": {"$exists": False}
    }).to_list(1000)
    
    migrated_count = 0
    
    for client in clients:
        try:
            start_date = datetime.strptime(client["start_date"], "%Y-%m-%d")
            # Subtract 1 month
            if start_date.month == 1:
                contract_date = start_date.replace(year=start_date.year - 1, month=12)
            else:
                contract_date = start_date.replace(month=start_date.month - 1)
            
            # Update client with contract_date
            await db.clients.update_one(
                {"client_id": client["client_id"]},
                {"$set": {"contract_date": contract_date.strftime("%Y-%m-%d"), "updated_at": datetime.utcnow()}}
            )
            migrated_count += 1
        except ValueError:
            # If date parsing fails, skip this client
            continue
    
    return {
        "message": f"Successfully migrated {migrated_count} clients",
        "migrated_count": migrated_count,
        "total_found": len(clients)
    }

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# AI Service Integration
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("WARNING: OpenAI не установлен. AI чат будет отключен.")

import asyncio
from typing import Optional
import re

# Утилиты для работы с токенами
def estimate_tokens(text: str) -> int:
    """Примерная оценка токенов (1 токен ≈ 4 символа для русского)"""
    return len(text) // 3

def truncate_text(text: str, max_tokens: int = 500) -> str:
    """Обрезает текст до указанного количества токенов"""
    max_chars = max_tokens * 3
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "... [обрезано]"

def safe_json_dumps(obj, max_tokens: int = 1000) -> str:
    """Безопасная сериализация с ограничением размера"""
    raw_json = json.dumps(obj, ensure_ascii=False, default=str)
    if estimate_tokens(raw_json) <= max_tokens:
        return raw_json
    
    # Если объект - список, берем только первые N элементов
    if isinstance(obj, list):
        preview_count = min(len(obj), 5)
        preview_obj = {
            "items": obj[:preview_count],
            "total_count": len(obj),
            "note": f"Показаны первые {preview_count} из {len(obj)} элементов"
        }
        return json.dumps(preview_obj, ensure_ascii=False, default=str)
    
    # Если объект - словарь, обрезаем строковые поля
    if isinstance(obj, dict):
        compressed_obj = {}
        for key, value in obj.items():
            if isinstance(value, str) and len(value) > 200:
                compressed_obj[key] = value[:200] + "..."
            elif isinstance(value, list) and len(value) > 10:
                compressed_obj[key] = value[:10] + [f"... и еще {len(value)-10}"]
            else:
                compressed_obj[key] = value
        return json.dumps(compressed_obj, ensure_ascii=False, default=str)
    
    return truncate_text(raw_json, max_tokens)

class CRMAIService:
    def __init__(self):
        self.openai_api_key = os.environ.get('OPENAI_API_KEY')
        if self.openai_api_key and OPENAI_AVAILABLE:
            import openai
            openai.api_key = self.openai_api_key
    
    async def get_client_info(self, query: str, user_id: str):
        """Получить информацию о клиенте"""
        user_capitals = await db.capitals.find({"owner_id": user_id}).to_list(100)
        capital_ids = [cap["id"] for cap in user_capitals]
        
        # Проекция - только нужные поля
        projection = {
            "_id": 0, "client_id": 1, "name": 1, "product": 1, 
            "debt_amount": 1, "total_amount": 1, "monthly_payment": 1, 
            "client_phone": 1, "status": 1, "capital_id": 1
        }
        
        # Поиск по имени или ID
        client = await db.clients.find_one({
            "$and": [
                {"capital_id": {"$in": capital_ids}},
                {"$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"client_id": query}
                ]}
            ]
        }, projection)
        
        if client:
            # Сжатые данные
            client_data = mongo_to_dict(client)
            capital = next((cap for cap in user_capitals if cap["id"] == client["capital_id"]), None)
            
            return {
                "found": True,
                "client": {
                    "id": client_data.get("client_id"),
                    "name": client_data.get("name"),
                    "product": client_data.get("product"),
                    "debt": client_data.get("debt_amount") or client_data.get("total_amount", 0),
                    "monthly_payment": client_data.get("monthly_payment"),
                    "phone": client_data.get("client_phone"),
                    "status": client_data.get("status")
                },
                "capital_name": capital.get("name") if capital else "Неизвестно"
            }
        return {"found": False, "message": f"Клиент '{query}' не найден"}
    
    async def get_overdue_payments(self, user_id: str, capital_id: Optional[str] = None):
        """Получить просроченные платежи с агрегацией"""
        user_capitals = await db.capitals.find({"owner_id": user_id}).to_list(100)
        capital_ids = [cap["id"] for cap in user_capitals]
        
        if capital_id and capital_id in capital_ids:
            capital_ids = [capital_id]
        
        # Проекция только нужных полей
        projection = {
            "_id": 0, "client_id": 1, "name": 1, "schedule": 1, 
            "client_phone": 1, "capital_id": 1
        }
        
        clients = await db.clients.find({"capital_id": {"$in": capital_ids}}, projection).to_list(500)
        overdue_payments = []
        total_overdue_amount = 0
        today = date.today()
        
        for client in clients:
            for payment in client.get("schedule", []):
                try:
                    payment_date = datetime.strptime(payment["payment_date"], "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    continue

                if payment.get("status") == "pending" and payment_date < today:
                    days_overdue = (today - payment_date).days
                    amount = payment.get("amount", 0)
                    total_overdue_amount += amount
                    
                    overdue_payments.append({
                        "client_name": client.get("name", "")[:50],  # Обрезаем имя
                        "client_id": client.get("client_id", ""), 
                        "amount": amount,
                        "payment_date": payment["payment_date"],
                        "days_overdue": days_overdue,
                        "phone": client.get("client_phone", "")[:15]  # Обрезаем телефон
                    })
        
        # Сортируем по дням просрочки (самые проблемные первыми)
        overdue_payments.sort(key=lambda x: x["days_overdue"], reverse=True)
        
        # Возвращаем агрегированные данные
        if not overdue_payments:
            return {"summary": "Просроченных платежей нет", "count": 0, "total_amount": 0}
        
        # Топ-10 самых проблемных + общая статистика
        return {
            "summary": f"Найдено {len(overdue_payments)} просроченных платежей на сумму {total_overdue_amount:,.0f}₽",
            "count": len(overdue_payments),
            "total_amount": total_overdue_amount,
            "top_overdue": overdue_payments[:10],  # Только топ-10
            "worst_case_days": overdue_payments[0]["days_overdue"] if overdue_payments else 0
        }
    
    async def search_clients(self, user_id: str, **filters):
        """Поиск клиентов по фильтрам с ограничениями"""
        user_capitals = await db.capitals.find({"owner_id": user_id}).to_list(100)
        capital_ids = [cap["id"] for cap in user_capitals]
        
        query = {"capital_id": {"$in": capital_ids}}
        
        # Построение фильтров
        if filters.get("name"):
            query["name"] = {"$regex": filters["name"], "$options": "i"}
        if filters.get("phone"):
            query["client_phone"] = {"$regex": filters["phone"], "$options": "i"}
        if filters.get("product"):
            query["product"] = {"$regex": filters["product"], "$options": "i"}
        if filters.get("status"):
            query["status"] = filters["status"]
        
        # Проекция только основных полей
        projection = {
            "_id": 0, "client_id": 1, "name": 1, "product": 1,
            "debt_amount": 1, "total_amount": 1, "monthly_payment": 1,
            "client_phone": 1, "status": 1
        }
        
        # Лимит результатов
        limit = min(filters.get("limit", 20), 50)  # Максимум 50 записей
        
        clients = await db.clients.find(query, projection).limit(limit).to_list(limit)
        
        # Подсчет общего количества для статистики
        total_count = await db.clients.count_documents(query)
        
        # Сжатые данные клиентов
        result_clients = []
        for client in clients:
            client_data = mongo_to_dict(client)
            result_clients.append({
                "id": client_data.get("client_id"),
                "name": client_data.get("name", "")[:50],  # Обрезаем имя
                "product": client_data.get("product", "")[:30],  # Обрезаем продукт
                "debt": client_data.get("debt_amount") or client_data.get("total_amount", 0),
                "monthly_payment": client_data.get("monthly_payment", 0),
                "phone": client_data.get("client_phone", "")[:15],  # Обрезаем телефон
                "status": client_data.get("status", "active")
            })
        
        return {
            "clients": result_clients,
            "found_count": len(result_clients),
            "total_count": total_count,
            "note": f"Показано {len(result_clients)} из {total_count} найденных клиентов" if total_count > len(result_clients) else None
        }
    
    async def get_income_statistics(self, user_id: str, capital_id: Optional[str] = None):
        """Получить статистику доходов с детализацией"""
        user_capitals = await db.capitals.find({"owner_id": user_id}).to_list(100)
        capital_ids = [cap["id"] for cap in user_capitals]
        
        if capital_id and capital_id in capital_ids:
            capital_ids = [capital_id]
        
        # Проекция нужных полей
        clients_projection = {
            "_id": 0, "name": 1, "debt_amount": 1, "total_amount": 1, 
            "monthly_payment": 1, "capital_id": 1, "schedule": 1
        }
        
        clients = await db.clients.find({"capital_id": {"$in": capital_ids}}, clients_projection).to_list(500)
        
        # Получаем расходы
        expenses = await db.expenses.find({"capital_id": {"$in": capital_ids}}).to_list(100)
        
        # Вычисляем статистику
        total_debt = 0
        total_paid = 0
        monthly_income = 0
        active_clients = 0
        completed_clients = 0
        
        for client in clients:
            client_debt = client.get("debt_amount") or client.get("total_amount", 0)
            total_debt += client_debt
            monthly_income += client.get("monthly_payment", 0)
            
            # Подсчитываем оплаченную сумму
            paid_amount = 0
            for payment in client.get("schedule", []):
                if payment.get("status") == "paid":
                    paid_amount += payment.get("amount", 0)
            
            total_paid += paid_amount
            
            # Статус клиента
            if paid_amount >= client_debt:
                completed_clients += 1
            else:
                active_clients += 1
        
        # Общие расходы
        total_expenses = sum(exp.get("amount", 0) for exp in expenses)
        
        # Чистая прибыль
        net_profit = total_paid - total_expenses
        
        # Эффективность сбора
        collection_rate = (total_paid / total_debt * 100) if total_debt > 0 else 0
        
        # Ежемесячный потенциал
        potential_monthly = monthly_income
        
        return {
            "summary": f"📊 Финансовая статистика по {len(capital_ids)} капитал(ам)",
            "total_debt": total_debt,
            "total_paid": total_paid,
            "total_expenses": total_expenses,
            "net_profit": net_profit,
            "collection_rate": round(collection_rate, 1),
            "monthly_potential": potential_monthly,
            "clients_stats": {
                "active": active_clients,
                "completed": completed_clients,
                "total": len(clients)
            },
            "top_expenses": sorted([
                {
                    "description": exp.get("description", "")[:40],
                    "amount": exp.get("amount", 0),
                    "date": exp.get("date", "")
                }
                for exp in expenses
            ], key=lambda x: x["amount"], reverse=True)[:5]
        }
    
    async def handle_function_call(self, function_name: str, arguments: dict, user_id: str):
        """Обработка вызовов функций от ИИ"""
        if function_name == "get_client_info":
            return await self.get_client_info(arguments["query"], user_id)
        elif function_name == "get_overdue_payments":
            return await self.get_overdue_payments(user_id, arguments.get("capital_id"))
        elif function_name == "get_analytics":
            # Используем существующий endpoint аналитики
            capital_id = arguments["capital_id"]
            user_capitals = await db.capitals.find({"owner_id": user_id}).to_list(100)
            if capital_id in [cap["id"] for cap in user_capitals]:
                # Вызываем функцию аналитики
                analytics = await get_capital_analytics(capital_id, user_id)
                return analytics
            return {"error": "Капитал не найден"}
        elif function_name == "search_clients":
            return await self.search_clients(user_id, **arguments)
        elif function_name == "get_income_statistics":
            return await self.get_income_statistics(user_id, arguments.get("capital_id"))
        
        return {"error": f"Неизвестная функция: {function_name}"}
    
    def safe_chat_completion(self, client, messages, functions, **kwargs):
        """Безопасный вызов OpenAI с контролем размера"""
        MAX_TOKENS = 7500  # Оставляем запас для ответа
        
        # Подсчитываем общий размер
        total_size = 0
        for msg in messages:
            total_size += estimate_tokens(str(msg))
        
        # Оцениваем размер функций
        functions_size = estimate_tokens(json.dumps(functions, ensure_ascii=False))
        total_size += functions_size
        
        # Если превышает лимит, обрезаем историю
        while total_size > MAX_TOKENS and len(messages) > 2:
            # Удаляем самое старое сообщение пользователя (но оставляем system)
            if len(messages) > 2:
                messages.pop(1)  # Удаляем второе сообщение (первое user message)
                total_size = sum(estimate_tokens(str(msg)) for msg in messages) + functions_size
        
        # Дополнительное сжатие system prompt если нужно
        if total_size > MAX_TOKENS:
            system_msg = messages[0]
            if system_msg["role"] == "system":
                content = system_msg["content"]
                if len(content) > 1000:
                    messages[0]["content"] = content[:800] + "\n\n[Системное сообщение обрезано для экономии токенов]"
        
        return client.chat.completions.create(
            messages=messages,
            functions=functions,
            **kwargs
        )

    async def chat_with_ai(self, message: str, user_context: dict) -> dict:
        """Основной метод чата с ИИ"""
        if not OPENAI_AVAILABLE:
            return {
                "response": "😔 Извините, ИИ-ассистент временно недоступен.\n\nДля активации нужно:\n1. Установить OpenAI: pip install openai\n2. Перезапустить сервер\n\nПока что используйте обычный поиск в CRM.",
                "error": "OpenAI не установлен"
            }
            
        if not self.openai_api_key:
            return {"error": "OpenAI API key не настроен"}
        
        try:
            import openai
            client = openai.OpenAI(api_key=self.openai_api_key)
            
            functions = [
                {
                    "name": "get_client_info",
                    "description": "Найти конкретного клиента по имени или ID (возвращает краткую сводку)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Имя клиента или ID для поиска"}
                        },
                        "required": ["query"]
                    }
                },
                {
                    "name": "get_overdue_payments", 
                    "description": "Получить агрегированную статистику просроченных платежей (топ-10 + общие цифры)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "capital_id": {"type": "string", "description": "ID конкретного капитала (необязательно)"}
                        }
                    }
                },
                {
                    "name": "search_clients",
                    "description": "Поиск клиентов с фильтрами (максимум 20 результатов + общий счетчик)",
                    "parameters": {
                        "type": "object", 
                        "properties": {
                            "name": {"type": "string", "description": "Поиск по имени клиента"},
                            "phone": {"type": "string", "description": "Поиск по телефону"},
                            "product": {"type": "string", "description": "Поиск по товару"},
                            "status": {"type": "string", "enum": ["active", "overdue", "completed"], "description": "Статус клиента"},
                            "limit": {"type": "integer", "minimum": 1, "maximum": 50, "description": "Количество результатов (по умолчанию 20)"}
                        }
                    }
                },
                {
                    "name": "get_income_statistics",
                    "description": "Получить детальную статистику доходов, расходов и прибыли (топ-5 расходов + общие цифры)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "capital_id": {"type": "string", "description": "ID конкретного капитала (необязательно)"}
                        }
                    }
                }
            ]
            
            messages = [
                {
                    "role": "system",
                    "content": f"""Ты - ИИ-ассистент CRM рассрочки.

КОНТЕКСТ: ID={user_context.get('user_id')}, Капитал={user_context.get('current_capital', 'не выбран')}

ФУНКЦИИ:
- get_client_info: поиск клиента по имени/ID
- get_overdue_payments: просроченные платежи (агрегированные данные)
- search_clients: поиск клиентов по фильтрам (лимит 20)
- get_income_statistics: статистика доходов, расходов и прибыли

ПРАВИЛА:
- Используй функции для получения данных
- Отвечай кратко и по делу
- Числа форматируй с разделителями (1,000₽)
- При больших списках показывай топ-10 + общую статистику"""
                },
                {
                    "role": "user",
                    "content": truncate_text(message, 200)  # Обрезаем длинные вопросы
                }
            ]
            
            # Используем безопасный wrapper
            response = self.safe_chat_completion(
                client=client,
                messages=messages,
                functions=functions,
                model="gpt-4",
                function_call="auto", 
                temperature=0.1
            )
            
            message = response.choices[0].message
            
            # Если ИИ хочет вызвать функцию
            if message.function_call:
                function_name = message.function_call.name
                function_args = json.loads(message.function_call.arguments)
                
                # Вызываем функцию
                function_result = await self.handle_function_call(
                    function_name, function_args, user_context["user_id"]
                )
                
                # Отправляем результат обратно ИИ
                messages.append(message)

                # Используем безопасную сериализацию с автоматическим сжатием
                content_to_send = safe_json_dumps(function_result, max_tokens=800)

                messages.append({
                    "role": "function",
                    "name": function_name,
                    "content": content_to_send
                })
                
                # Получаем финальный ответ через безопасный wrapper
                final_response = self.safe_chat_completion(
                    client=client,
                    messages=messages,
                    functions=functions,
                    model="gpt-4",
                    temperature=0.1
                )
                
                return {
                    "response": final_response.choices[0].message.content,
                    "function_used": function_name,
                    "function_result": function_result
                }
            
            return {"response": message.content}
            
        except Exception as e:
            return {"error": f"Ошибка ИИ: {str(e)}"}

# Создаем экземпляр AI сервиса
ai_service = CRMAIService()

# AI Chat endpoint
@api_router.post("/ai/chat")
async def ai_chat(request: dict, current_user: str = Depends(get_current_user)):
    """Чат с ИИ-ассистентом"""
    message = request.get("message", "")
    if not message:
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")
    
    # Получаем контекст пользователя
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    current_capital = user_capitals[0] if user_capitals else None
    
    user_context = {
        "user_id": current_user,
        "current_capital": current_capital["name"] if current_capital else None,
        "capital_count": len(user_capitals)
    }
    
    # Отправляем в ИИ
    ai_response = await ai_service.chat_with_ai(message, user_context)
    
    # Сохраняем историю чата (опционально)
    chat_record = {
        "user_id": current_user,
        "message": message,
        "ai_response": ai_response.get("response", ""),
        "timestamp": datetime.utcnow(),
        "function_used": ai_response.get("function_used")
    }
    
    await db.ai_chat_history.insert_one(chat_record)
    
    return ai_response

# Добавляем router снова, чтобы зарегистрировать AI endpoint если он был добавлен после первого include
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
