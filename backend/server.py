from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
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
import firebase_admin
from firebase_admin import credentials, auth
import json
from bson import ObjectId
from fastapi.encoders import jsonable_encoder

# Custom JSON encoder for MongoDB ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

# Helper function to convert MongoDB documents to JSON-serializable format
def mongo_to_dict(obj: Any) -> Dict:
    """Convert MongoDB document to dict with string IDs instead of ObjectId."""
    if isinstance(obj, dict):
        return {k: mongo_to_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [mongo_to_dict(item) for item in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize Firebase Admin
firebase_config = {
    "type": "service_account",
    "project_id": "finance-a88e4",
    "private_key_id": "",
    "private_key": "",
    "client_email": "",
    "client_id": "",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token"
}

# Note: For production, you'll need to add proper Firebase Admin credentials
# For now, we'll handle Firebase verification on frontend and pass user data

# Create the main app without a prefix
app = FastAPI(title="CRM Finance System", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

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
    name: str
    product: str
    total_amount: float
    monthly_payment: float
    start_date: str  # Changed from date to str
    end_date: str  # Changed from date to str
    schedule: List[PaymentSchedule] = []
    status: ClientStatus = ClientStatus.active
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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

class ClientCreate(BaseModel):
    capital_id: str
    name: str
    product: str
    total_amount: float
    monthly_payment: float
    start_date: str  # Changed from date to str
    months: int

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
async def get_current_user(authorization: str = None) -> str:
    # In production, verify Firebase token here
    # For demo, we'll return a mock user ID
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

# Client management
@api_router.post("/clients", response_model=Client)
async def create_client(client: ClientCreate, current_user: str = Depends(get_current_user)):
    # Verify capital ownership
    capital = await db.capitals.find_one({"id": client.capital_id, "owner_id": current_user})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    # Generate payment schedule
    schedule = generate_payment_schedule(client.start_date, client.monthly_payment, client.months)
    end_date = schedule[-1].payment_date if schedule else client.start_date
    
    client_dict = client.dict()
    client_obj = Client(
        **{k: v for k, v in client_dict.items() if k != 'months'},
        schedule=[s.dict() for s in schedule],  # Convert to dict for MongoDB
        end_date=end_date
    )
    
    await db.clients.insert_one(client_obj.dict())
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
    return [Client(**client) for client in clients]

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, current_user: str = Depends(get_current_user)):
    # Get user's capitals
    user_capitals = await db.capitals.find({"owner_id": current_user}).to_list(100)
    capital_ids = [cap["id"] for cap in user_capitals]
    
    client = await db.clients.find_one({"client_id": client_id, "capital_id": {"$in": capital_ids}})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return Client(**client)

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, updates: dict, current_user: str = Depends(get_current_user)):
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
    return Client(**client)

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
    return [Payment(**payment) for payment in payments]

# Analytics
@api_router.get("/analytics/{capital_id}")
async def get_capital_analytics(capital_id: str, current_user: str = Depends(get_current_user)):
    # Verify capital ownership
    capital = await db.capitals.find_one({"id": capital_id, "owner_id": current_user})
    if not capital:
        raise HTTPException(status_code=404, detail="Capital not found")
    
    clients = await db.clients.find({"capital_id": capital_id}).to_list(1000)
    payments = await db.payments.find({"capital_id": capital_id}).to_list(1000)
    
    total_amount = sum(client["total_amount"] for client in clients)
    total_paid = sum(payment["amount"] for payment in payments)
    active_clients = len([c for c in clients if c["status"] == "active"])
    
    # Calculate overdue payments
    today = date.today()
    overdue_count = 0
    for client in clients:
        for schedule_item in client.get("schedule", []):
            if (schedule_item["status"] == "pending" and 
                datetime.strptime(schedule_item["payment_date"], "%Y-%m-%d").date() < today):
                overdue_count += 1
    
    return {
        "total_amount": total_amount,
        "total_paid": total_paid,
        "outstanding": total_amount - total_paid,
        "active_clients": active_clients,
        "total_clients": len(clients),
        "overdue_payments": overdue_count,
        "collection_rate": (total_paid / total_amount * 100) if total_amount > 0 else 0
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
        return {"message": "Mock data already exists", "capitals": existing_capitals}
    
    # Create 2 capitals
    capital1 = Capital(
        name="Основной капитал",
        owner_id=current_user,
        description="Основной капитал для рассрочки электроники"
    )
    
    capital2 = Capital(
        name="Дополнительный фонд",
        owner_id=current_user,
        description="Дополнительные средства для крупных покупок"
    )
    
    await db.capitals.insert_one(capital1.dict())
    await db.capitals.insert_one(capital2.dict())
    
    # Create mock clients for capital 1
    clients_data1 = [
        {
            "name": "Иван Петров",
            "product": "iPhone 15 Pro",
            "total_amount": 120000.0,
            "monthly_payment": 10000.0,
            "months": 12,
            "start_date": "2024-11-01"
        },
        {
            "name": "Мария Сидорова", 
            "product": "MacBook Air M3",
            "total_amount": 150000.0,
            "monthly_payment": 12500.0,
            "months": 12,
            "start_date": "2024-10-15"
        },
        {
            "name": "Александр Козлов",
            "product": "iPad Pro",
            "total_amount": 80000.0,
            "monthly_payment": 8000.0,
            "months": 10,
            "start_date": "2024-12-01"
        }
    ]
    
    # Create mock clients for capital 2
    clients_data2 = [
        {
            "name": "Елена Морозова",
            "product": "Samsung Galaxy S24",
            "total_amount": 90000.0,
            "monthly_payment": 7500.0,
            "months": 12,
            "start_date": "2024-11-10"
        },
        {
            "name": "Дмитрий Волков",
            "product": "PlayStation 5",
            "total_amount": 60000.0,
            "monthly_payment": 6000.0,
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
            total_amount=client_data["total_amount"],
            monthly_payment=client_data["monthly_payment"],
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
            total_amount=client_data["total_amount"],
            monthly_payment=client_data["monthly_payment"],
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
    return {"message": "Data already exists", "capitals": existing_capitals}

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
                    
                if schedule_item["status"] == "pending":
                    if payment_date == today:
                        today_payments.append({
                            "client": client,
                            "payment": schedule_item
                        })
                    elif payment_date == tomorrow:
                        tomorrow_payments.append({
                            "client": client,
                            "payment": schedule_item
                        })
                    elif payment_date < today:
                        overdue_payments.append({
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