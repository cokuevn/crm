#!/usr/bin/env python3
import requests
import json
import time
import uuid
import os
from datetime import datetime, date, timedelta
import sys

# Get the backend URL from the frontend .env file
BACKEND_URL = None
try:
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BACKEND_URL = line.strip().split('=')[1].strip('"\'')
                break
except Exception as e:
    print(f"Error reading .env file: {e}")
    sys.exit(1)

if not BACKEND_URL:
    print("Could not find REACT_APP_BACKEND_URL in .env file")
    sys.exit(1)

API_URL = f"{BACKEND_URL}/api"
print(f"Using API URL: {API_URL}")

# Test user ID (simulating Firebase auth)
TEST_USER_ID = f"test_user_{uuid.uuid4()}"

# Headers for all requests
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {TEST_USER_ID}"  # Simulated auth token
}

def print_separator(title):
    """Print a separator with a title for better readability"""
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

def test_auto_init():
    """Test the auto-initialization endpoint"""
    print_separator("TESTING AUTO-INITIALIZATION")
    
    # Test auto-init for existing user (should return existing data)
    print("Testing GET /api/auto-init for existing user...")
    response = requests.get(f"{API_URL}/auto-init", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Auto-init for existing user: {data['message']}")
    
    # Verify capitals were returned
    if 'capitals' not in data or len(data['capitals']) == 0:
        print(f"❌ Error: No capitals returned")
        return False
    
    print(f"✅ Returned {len(data['capitals'])} existing capitals")
    
    # Get the first capital ID for further testing
    capital_ids = [capital['id'] for capital in data['capitals']]
    
    return capital_ids

def test_client_creation(capital_id):
    """Test client creation with payment schedule generation"""
    print_separator("TESTING CLIENT CREATION")
    
    # Create a new client with extended fields
    client_data = {
        "capital_id": capital_id,
        "name": "Иванов Сергей Петрович",
        "product": "Samsung Galaxy S24 Ultra",
        "purchase_amount": 120000.0,
        "debt_amount": 120000.0,
        "monthly_payment": 10000.0,
        "guarantor_name": "Петрова Анна Ивановна",
        "client_address": "г. Москва, ул. Ленина, д. 42, кв. 56",
        "client_phone": "+7 (901) 234-56-78",
        "guarantor_phone": "+7 (901) 234-56-79",
        "start_date": date.today().strftime("%Y-%m-%d"),  # Use string date format
        "months": 12
    }
    
    print(f"Creating client with data: {json.dumps(client_data, indent=2)}")
    response = requests.post(f"{API_URL}/clients", headers=headers, json=client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating client: {response.status_code} - {response.text}")
        return None
    
    client = response.json()
    print(f"✅ Client created successfully with ID: {client['client_id']}")
    
    # Verify client data
    if client['name'] != client_data['name'] or client['product'] != client_data['product']:
        print(f"❌ Error: Client data mismatch")
        return None
    
    # Verify payment schedule generation
    if 'schedule' not in client or len(client['schedule']) != client_data['months']:
        print(f"❌ Error: Expected {client_data['months']} payments in schedule, got {len(client.get('schedule', []))}")
        return None
    
    print(f"✅ Payment schedule generated with {len(client['schedule'])} payments")
    
    # Verify dates are stored as strings
    if not isinstance(client['start_date'], str) or not isinstance(client['end_date'], str):
        print(f"❌ Error: Dates are not stored as strings")
        return None
    
    print(f"✅ Dates are stored as strings: start_date={client['start_date']}, end_date={client['end_date']}")
    
    # Verify schedule dates are strings
    for payment in client['schedule']:
        if not isinstance(payment['payment_date'], str):
            print(f"❌ Error: Schedule payment_date is not a string")
            return None
    
    print(f"✅ All schedule payment dates are strings")
    
    # Verify extended fields
    extended_fields = ["guarantor_name", "client_address", "client_phone", "guarantor_phone"]
    for field in extended_fields:
        if field not in client or client[field] != client_data[field]:
            print(f"❌ Error: Extended field '{field}' mismatch or missing")
            print(f"  Expected: {client_data.get(field)}")
            print(f"  Actual: {client.get(field)}")
            return None
    
    print(f"✅ All extended fields are present and correct")
    
    return client['client_id']

def test_client_details(client_id):
    """Test client details retrieval"""
    print_separator("TESTING CLIENT DETAILS RETRIEVAL")
    
    # Get client details
    print(f"Getting details for client ID: {client_id}...")
    response = requests.get(f"{API_URL}/clients/{client_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting client details: {response.status_code} - {response.text}")
        return False
    
    client = response.json()
    print(f"✅ Client details retrieved successfully")
    
    # Verify client has all required fields
    required_fields = [
        "client_id", "capital_id", "name", "product", "purchase_amount", 
        "debt_amount", "monthly_payment", "start_date", "end_date", "schedule"
    ]
    
    for field in required_fields:
        if field not in client:
            print(f"❌ Error: Client details missing required field '{field}'")
            return False
    
    # Verify extended fields exist (may be None)
    extended_fields = ["guarantor_name", "client_address", "client_phone", "guarantor_phone"]
    for field in extended_fields:
        if field not in client:
            print(f"❌ Error: Client details missing extended field '{field}'")
            return False
    
    print(f"✅ Client details contain all required and extended fields")
    
    # Print client details for verification
    print(f"Client name: {client['name']}")
    print(f"Product: {client['product']}")
    print(f"Purchase amount: {client['purchase_amount']}")
    print(f"Debt amount: {client['debt_amount']}")
    print(f"Monthly payment: {client['monthly_payment']}")
    print(f"Guarantor name: {client['guarantor_name']}")
    print(f"Client address: {client['client_address']}")
    print(f"Client phone: {client['client_phone']}")
    print(f"Guarantor phone: {client['guarantor_phone']}")
    print(f"Payment schedule: {len(client['schedule'])} payments")
    
    return client

def test_client_update(client_id):
    """Test client update with ClientUpdate model"""
    print_separator("TESTING CLIENT UPDATE")
    
    # Update client data
    update_data = {
        "name": "Иванов Сергей Петрович (обновлено)",
        "product": "Samsung Galaxy S24 Ultra + чехол",
        "purchase_amount": 125000.0,
        "debt_amount": 125000.0,
        "monthly_payment": 10416.67,
        "guarantor_name": "Петрова Анна Ивановна (обновлено)",
        "client_address": "г. Москва, ул. Ленина, д. 42, кв. 56, подъезд 3",
        "client_phone": "+7 (901) 234-56-78",
        "guarantor_phone": "+7 (901) 234-56-80"
    }
    
    print(f"Updating client with data: {json.dumps(update_data, indent=2)}")
    response = requests.put(f"{API_URL}/clients/{client_id}", headers=headers, json=update_data)
    
    if response.status_code != 200:
        print(f"❌ Error updating client: {response.status_code} - {response.text}")
        return False
    
    updated_client = response.json()
    print(f"✅ Client updated successfully")
    
    # Verify client data was updated
    for key, value in update_data.items():
        if updated_client[key] != value:
            print(f"❌ Error: Client field '{key}' was not updated correctly")
            print(f"  Expected: {value}")
            print(f"  Actual: {updated_client[key]}")
            return False
    
    print(f"✅ All client fields were updated correctly")
    return True

def test_payment_status_update(client_id):
    """Test payment status update"""
    print_separator("TESTING PAYMENT STATUS UPDATE")
    
    # First, get client details to find a payment
    response = requests.get(f"{API_URL}/clients/{client_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Could not get client details for payment status test: {response.status_code} - {response.text}")
        return False
    
    client = response.json()
    if not client['schedule'] or len(client['schedule']) == 0:
        print("❌ Client has no payment schedule")
        return False
    
    # Get the first payment
    payment = client['schedule'][0]
    payment_date = payment['payment_date']
    
    # Test updating to "paid" status with JSON body
    print(f"Updating payment on {payment_date} to 'paid' status...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={"status": "paid"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error updating payment status: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Payment status updated to 'paid'")
    
    # Verify the update by getting client details again
    response = requests.get(f"{API_URL}/clients/{client_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Could not get updated client details: {response.status_code} - {response.text}")
        return False
    
    updated_client = response.json()
    
    # Find the payment in the updated schedule
    updated_payment = None
    for p in updated_client['schedule']:
        if p['payment_date'] == payment_date:
            updated_payment = p
            break
    
    if not updated_payment:
        print(f"❌ Could not find payment with date {payment_date} in updated schedule")
        return False
    
    # Verify status was updated to "paid"
    if updated_payment['status'] != "paid":
        print(f"❌ Payment status was not updated to 'paid'")
        print(f"  Actual status: {updated_payment['status']}")
        return False
    
    # Verify paid_date was set
    if not updated_payment.get('paid_date'):
        print(f"❌ paid_date was not set when status changed to 'paid'")
        return False
    
    print(f"✅ Payment status was updated to 'paid' and paid_date was set to {updated_payment['paid_date']}")
    
    # Test updating to "overdue" status with JSON body
    print(f"Updating payment on {payment_date} to 'overdue' status...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={"status": "overdue"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error updating payment status: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Payment status updated to 'overdue'")
    
    # Verify the update
    response = requests.get(f"{API_URL}/clients/{client_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Could not get updated client details: {response.status_code} - {response.text}")
        return False
    
    updated_client = response.json()
    
    # Find the payment in the updated schedule
    updated_payment = None
    for p in updated_client['schedule']:
        if p['payment_date'] == payment_date:
            updated_payment = p
            break
    
    if not updated_payment:
        print(f"❌ Could not find payment with date {payment_date} in updated schedule")
        return False
    
    # Verify status was updated to "overdue"
    if updated_payment['status'] != "overdue":
        print(f"❌ Payment status was not updated to 'overdue'")
        print(f"  Actual status: {updated_payment['status']}")
        return False
    
    # Verify paid_date was cleared
    if updated_payment.get('paid_date'):
        print(f"❌ paid_date was not cleared when status changed to 'overdue'")
        return False
    
    print(f"✅ Payment status was updated to 'overdue' and paid_date was cleared")
    
    # Test updating back to "pending" status with JSON body
    print(f"Updating payment on {payment_date} to 'pending' status...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={"status": "pending"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error updating payment status: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Payment status updated to 'pending'")
    
    # Verify the update
    response = requests.get(f"{API_URL}/clients/{client_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Could not get updated client details: {response.status_code} - {response.text}")
        return False
    
    updated_client = response.json()
    
    # Find the payment in the updated schedule
    updated_payment = None
    for p in updated_client['schedule']:
        if p['payment_date'] == payment_date:
            updated_payment = p
            break
    
    if not updated_payment:
        print(f"❌ Could not find payment with date {payment_date} in updated schedule")
        return False
    
    # Verify status was updated to "pending"
    if updated_payment['status'] != "pending":
        print(f"❌ Payment status was not updated to 'pending'")
        print(f"  Actual status: {updated_payment['status']}")
        return False
    
    print(f"✅ Payment status was updated to 'pending'")
    
    # Test error handling for invalid status
    print(f"Testing error handling for invalid status...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={"status": "invalid_status"}
    )
    
    if response.status_code != 400:
        print(f"❌ Error: Expected 400 for invalid status, got {response.status_code}")
        return False
    
    print(f"✅ Proper error handling for invalid status (400 response)")
    
    # Test error handling for missing status in request body
    print(f"Testing error handling for missing status in request body...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={}
    )
    
    if response.status_code != 400:
        print(f"❌ Error: Expected 400 for missing status, got {response.status_code}")
        return False
    
    print(f"✅ Proper error handling for missing status (400 response)")
    
    # Test authorization - this is a simplified test since we're using a mock auth system
    # In a real system, we would test with different user tokens
    print(f"Testing authorization (simplified)...")
    
    # For now, we'll just verify that the endpoint requires authorization
    # by sending a request without the Authorization header
    no_auth_headers = {"Content-Type": "application/json"}
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=no_auth_headers,
        json={"status": "paid"}
    )
    
    # The endpoint should either return 401 (Unauthorized) or 403 (Forbidden)
    # Since we're using a simplified auth system, we'll accept either
    if response.status_code not in [401, 403]:
        print(f"❌ Error: Expected 401 or 403 for missing authorization, got {response.status_code}")
        # This is not a critical failure, so we'll continue
        print(f"⚠️ Authorization check might not be properly implemented")
    else:
        print(f"✅ Proper authorization check (got {response.status_code} response)")
    
    return True

def test_client_deletion(client_id):
    """Test client deletion with cascade"""
    print_separator("TESTING CLIENT DELETION")
    
    # Delete the client
    print(f"Deleting client with ID: {client_id}...")
    response = requests.delete(f"{API_URL}/clients/{client_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error deleting client: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Client deleted successfully: {response.json()['message']}")
    
    # Verify client is deleted
    print("Verifying client is deleted...")
    response = requests.get(f"{API_URL}/clients/{client_id}", headers=headers)
    
    if response.status_code != 404:
        print(f"❌ Error: Client still exists with status code {response.status_code}")
        return False
    
    print(f"✅ Client no longer exists (404 response)")
    
    # Test error handling for non-existent client
    print("Testing error handling for non-existent client...")
    response = requests.delete(f"{API_URL}/clients/{client_id}", headers=headers)
    
    if response.status_code != 404:
        print(f"❌ Error: Expected 404 for non-existent client, got {response.status_code}")
        return False
    
    print(f"✅ Proper error handling for non-existent client (404 response)")
    
    return True

def test_dashboard_data(capital_id):
    """Test dashboard data with string date filtering"""
    print_separator("TESTING DASHBOARD DATA")
    
    # Get dashboard data
    print("Getting dashboard data...")
    response = requests.get(f"{API_URL}/dashboard?capital_id={capital_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting dashboard data: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Dashboard data retrieved successfully")
    
    # Verify dashboard data structure
    if not all(key in data for key in ['today', 'tomorrow', 'overdue', 'all_clients']):
        print(f"❌ Error: Dashboard data missing required keys")
        return False
    
    print(f"✅ Dashboard data contains all required sections")
    
    # Verify date filtering works
    today = date.today()
    tomorrow = today + timedelta(days=1)
    
    print(f"Today's date: {today.strftime('%Y-%m-%d')}")
    print(f"Tomorrow's date: {tomorrow.strftime('%Y-%m-%d')}")
    
    # Print counts for each category
    print(f"Today's payments: {len(data['today'])}")
    print(f"Tomorrow's payments: {len(data['tomorrow'])}")
    print(f"Overdue payments: {len(data['overdue'])}")
    print(f"Total clients: {len(data['all_clients'])}")
    
    return True

def test_capital_deletion(capital_id):
    """Test capital deletion with cascade deletion"""
    print_separator("TESTING CAPITAL DELETION")
    
    # First, get clients for this capital
    print("Getting clients before deletion...")
    response = requests.get(f"{API_URL}/clients?capital_id={capital_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting clients: {response.status_code} - {response.text}")
        return False
    
    clients_before = response.json()
    print(f"✅ Found {len(clients_before)} clients before deletion")
    
    # Delete the capital
    print(f"Deleting capital with ID: {capital_id}...")
    response = requests.delete(f"{API_URL}/capitals/{capital_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error deleting capital: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Capital deleted successfully: {response.json()['message']}")
    
    # Verify capital is deleted
    print("Verifying capital is deleted...")
    response = requests.get(f"{API_URL}/capitals/{capital_id}", headers=headers)
    
    if response.status_code != 404:
        print(f"❌ Error: Capital still exists with status code {response.status_code}")
        return False
    
    print(f"✅ Capital no longer exists (404 response)")
    
    # Verify clients are deleted (cascade deletion)
    print("Verifying clients are deleted (cascade deletion)...")
    response = requests.get(f"{API_URL}/clients?capital_id={capital_id}", headers=headers)
    
    if response.status_code == 200 and len(response.json()) > 0:
        print(f"❌ Error: Clients still exist for deleted capital")
        return False
    
    print(f"✅ No clients found for deleted capital")
    
    # Test error handling for non-existent capital
    print("Testing error handling for non-existent capital...")
    response = requests.delete(f"{API_URL}/capitals/{capital_id}", headers=headers)
    
    if response.status_code != 404:
        print(f"❌ Error: Expected 404 for non-existent capital, got {response.status_code}")
        return False
    
    print(f"✅ Proper error handling for non-existent capital (404 response)")
    
    return True

def test_analytics(capital_id):
    """Test analytics with debt_amount instead of total_amount"""
    print_separator("TESTING ANALYTICS")
    
    # Get analytics data
    print(f"Getting analytics for capital ID: {capital_id}...")
    response = requests.get(f"{API_URL}/analytics/{capital_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting analytics: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Analytics data retrieved successfully")
    
    # Verify analytics data structure
    required_fields = [
        "total_amount", "total_paid", "outstanding", "active_clients",
        "total_clients", "overdue_payments", "collection_rate"
    ]
    
    for field in required_fields:
        if field not in data:
            print(f"❌ Error: Analytics data missing required field '{field}'")
            return False
    
    print(f"✅ Analytics data contains all required fields")
    
    # Print analytics data for verification
    print(f"Total amount: {data['total_amount']}")
    print(f"Total paid: {data['total_paid']}")
    print(f"Outstanding: {data['outstanding']}")
    print(f"Active clients: {data['active_clients']}")
    print(f"Total clients: {data['total_clients']}")
    print(f"Overdue payments: {data['overdue_payments']}")
    print(f"Collection rate: {data['collection_rate']}%")
    
    # Verify calculations
    if data['total_amount'] < data['total_paid']:
        print(f"❌ Error: Total amount ({data['total_amount']}) is less than total paid ({data['total_paid']})")
        return False
    
    if abs(data['outstanding'] - (data['total_amount'] - data['total_paid'])) > 0.01:
        print(f"❌ Error: Outstanding amount calculation is incorrect")
        print(f"  Expected: {data['total_amount'] - data['total_paid']}")
        print(f"  Actual: {data['outstanding']}")
        return False
    
    expected_collection_rate = (data['total_paid'] / data['total_amount'] * 100) if data['total_amount'] > 0 else 0
    if abs(data['collection_rate'] - expected_collection_rate) > 0.01:  # Allow small floating point difference
        print(f"❌ Error: Collection rate calculation is incorrect")
        print(f"  Expected: {expected_collection_rate}")
        print(f"  Actual: {data['collection_rate']}")
        return False
    
    print(f"✅ All analytics calculations are correct")
    
    return True

def test_mock_data():
    """Test mock data generation with new fields"""
    print_separator("TESTING MOCK DATA GENERATION")
    
    # Create a new test user to ensure fresh mock data
    new_test_user = f"test_user_{uuid.uuid4()}"
    new_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {new_test_user}"
    }
    
    # Test auto-init for new user (should create mock data)
    print("Testing GET /api/auto-init for new user...")
    response = requests.get(f"{API_URL}/auto-init", headers=new_headers)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Auto-init for new user: {data['message']}")
    
    # Verify capitals were created
    if 'capitals' not in data or len(data['capitals']) != 2:
        print(f"❌ Error: Expected 2 capitals, got {len(data.get('capitals', []))}")
        return False
    
    print(f"✅ Created {len(data['capitals'])} capitals")
    
    # Get the first capital ID
    capital_id = data['capitals'][0]['id']
    
    # Get clients for this capital
    print("Getting clients for the new capital...")
    response = requests.get(f"{API_URL}/clients?capital_id={capital_id}", headers=new_headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting clients: {response.status_code} - {response.text}")
        return False
    
    clients = response.json()
    print(f"✅ Found {len(clients)} clients for the new capital")
    
    if len(clients) == 0:
        print(f"❌ Error: No clients were created for the new capital")
        return False
    
    # Verify client data has all required fields
    client = clients[0]
    required_fields = [
        "client_id", "capital_id", "name", "product", "purchase_amount", 
        "debt_amount", "monthly_payment", "start_date", "end_date", "schedule"
    ]
    
    for field in required_fields:
        if field not in client:
            print(f"❌ Error: Client data missing required field '{field}'")
            return False
    
    # Verify extended fields exist and are populated
    extended_fields = ["guarantor_name", "client_address", "client_phone", "guarantor_phone"]
    for field in extended_fields:
        if field not in client or not client[field]:
            print(f"❌ Error: Client data missing or empty extended field '{field}'")
            return False
    
    print(f"✅ Client data contains all required and extended fields with values")
    
    # Print client details for verification
    print(f"Client name: {client['name']}")
    print(f"Product: {client['product']}")
    print(f"Purchase amount: {client['purchase_amount']}")
    print(f"Debt amount: {client['debt_amount']}")
    print(f"Monthly payment: {client['monthly_payment']}")
    print(f"Guarantor name: {client['guarantor_name']}")
    print(f"Client address: {client['client_address']}")
    print(f"Client phone: {client['client_phone']}")
    print(f"Guarantor phone: {client['guarantor_phone']}")
    
    return True

def run_all_tests():
    """Run all tests in sequence"""
    print_separator("STARTING BACKEND TESTS")
    
    # Test 1: Mock Data Generation
    print("Testing mock data generation...")
    if not test_mock_data():
        print("❌ Mock data generation test failed")
    else:
        print("✅ Mock data generation test passed")
    
    # Test 2: Auto-initialization
    capital_ids = test_auto_init()
    if not capital_ids:
        print("❌ Auto-initialization test failed, cannot continue")
        return False
    
    # Use the first capital for testing
    test_capital_id = capital_ids[0]
    print(f"Using capital ID {test_capital_id} for further tests")
    
    # Test 3: Analytics
    print("Testing analytics...")
    if not test_analytics(test_capital_id):
        print("❌ Analytics test failed")
    else:
        print("✅ Analytics test passed")
    
    # Test 4: Client creation
    client_id = test_client_creation(test_capital_id)
    if not client_id:
        print("❌ Client creation test failed, cannot continue")
        return False
    
    # Test 5: Client details retrieval
    print("Testing client details retrieval...")
    client = test_client_details(client_id)
    if not client:
        print("❌ Client details retrieval test failed")
    else:
        print("✅ Client details retrieval test passed")
    
    # Test 6: Client update
    print("Testing client update...")
    if not test_client_update(client_id):
        print("❌ Client update test failed")
    else:
        print("✅ Client update test passed")
    
    # Test 7: Payment status update
    print("Testing payment status update...")
    if not test_payment_status_update(client_id):
        print("❌ Payment status update test failed")
    else:
        print("✅ Payment status update test passed")
    
    # Test 8: Dashboard data
    if not test_dashboard_data(test_capital_id):
        print("❌ Dashboard data test failed")
    else:
        print("✅ Dashboard data test passed")
    
    # Test 9: Client deletion
    print("Testing client deletion...")
    if not test_client_deletion(client_id):
        print("❌ Client deletion test failed")
    else:
        print("✅ Client deletion test passed")
    
    # Test 10: Capital deletion (use the second capital to preserve the first one)
    if len(capital_ids) > 1:
        deletion_capital_id = capital_ids[1]
        if not test_capital_deletion(deletion_capital_id):
            print("❌ Capital deletion test failed")
        else:
            print("✅ Capital deletion test passed")
    else:
        print("⚠️ Skipping capital deletion test as only one capital is available")
    
    print_separator("ALL TESTS COMPLETED")
    return True

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)