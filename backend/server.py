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
    allow_origins=[
        "https://crm-vnwl.onrender.com",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
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

def generate_payment_schedule(start_date_str: str, monthly_payment: float, months: int) -> List[PaymentSchedule]:
    schedule = []
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    current_date = start_date
    
    for _ in range(months):
        # Move to next month
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)
        
        schedule.append(PaymentSchedule(
            payment_date=current_date.strftime("%Y-%m-%d"),
            amount=monthly_payment
        ))
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
    capitals = await db.capitals.find({"owner_id": current_user, "is_active": True}).to_list(100)
    return [Capital(**mongo_to_dict(capital)) for capital in capitals]

@api_router.get("/capitals/{capital_id}", response_model=Capital)
async def get_capital(capital_id: str, current_user: str = Depends(get_current_user)):
    capital = await db.capitals.find_one({"id": capital_id, "owner_id": current_user})
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
    return [Client(**mongo_to_dict(client)) for client in clients]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    client = await db.clients.find_one({"client_id": client_id, "capital_id": {"$in": capital_ids}})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return Client(**mongo_to_dict(client))

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, updates: ClientUpdate, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    # Convert updates to dict and filter out None values
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    update_dict["updated_at"] = datetime.utcnow()
    
    result = await db.clients.update_one(
        {"client_id": client_id, "capital_id": {"$in": capital_ids}},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client = await db.clients.find_one({"client_id": client_id})
    return Client(**mongo_to_dict(client))

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
    
    for payment in schedule:
        if payment["payment_date"] == payment_date:
            previous_status = payment.get("status", "pending")
            payment_amount = payment.get("amount", 0)
            
            # Update payment status
            payment["status"] = status
            if status == "paid":
                payment["paid_date"] = date.today().strftime("%Y-%m-%d")
            else:
                payment["paid_date"] = None
            updated = True
            break
    
    if not updated:
        raise HTTPException(status_code=404, detail="Payment not found")
    
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
    
    return {
        "message": "Payment status updated successfully",
        "balance_change": new_balance - current_balance if abs(new_balance - current_balance) > 0.01 else 0,
        "new_balance": new_balance
    }

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
    
    clients = await db.clients.find({"capital_id": capital_id}).to_list(1000)
    
    # Calculate analytics from schedule data
    total_debt = 0
    total_paid = 0
    total_payments_count = 0
    paid_payments_count = 0
    overdue_count = 0
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
            contract_date = datetime.strptime(client.get("start_date", ""), "%Y-%m-%d")
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
                
                # Count overdue payments
                elif (payment_status == "overdue" or 
                      (payment_status == "pending" and payment_date < today)):
                    overdue_count += 1
                    
            except (ValueError, KeyError):
                continue
    
    active_clients = len([c for c in clients if c["status"] == "active"])
    
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
        "total_clients": len(clients),
        "overdue_payments": overdue_count,
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
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    if capital_id and capital_id not in capital_ids:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query_capital_ids = [capital_id] if capital_id else capital_ids
    
    clients = await db.clients.find({"capital_id": {"$in": query_capital_ids}}).to_list(1000)
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
    
    return {
        "today": today_payments,
        "tomorrow": tomorrow_payments,
        "overdue": overdue_payments,
        "all_clients": clients
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
