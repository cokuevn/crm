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

def test_analytics_with_mixed_data(capital_id):
    """Test analytics with mixed data models (debt_amount and total_amount)"""
    print_separator("TESTING ANALYTICS WITH MIXED DATA MODELS")
    
    # First, create a client with the old data model (total_amount only)
    old_model_client_data = {
        "capital_id": capital_id,
        "name": "Старая Модель Клиент",
        "product": "Телевизор Samsung",
        "total_amount": 50000.0,  # Old field
        "monthly_payment": 5000.0,
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 10
    }
    
    print(f"Creating client with old data model (total_amount only)...")
    response = requests.post(f"{API_URL}/clients", headers=headers, json=old_model_client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating old model client: {response.status_code} - {response.text}")
        return False
    
    old_client = response.json()
    print(f"✅ Old model client created successfully with ID: {old_client['client_id']}")
    
    # Now create a client with the new data model (debt_amount)
    new_model_client_data = {
        "capital_id": capital_id,
        "name": "Новая Модель Клиент",
        "product": "iPhone 15 Pro",
        "purchase_amount": 120000.0,
        "debt_amount": 120000.0,  # New field
        "monthly_payment": 10000.0,
        "guarantor_name": "Иванов Иван",
        "client_address": "г. Москва, ул. Ленина, д. 10",
        "client_phone": "+7 (901) 123-45-67",
        "guarantor_phone": "+7 (901) 123-45-68",
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 12
    }
    
    print(f"Creating client with new data model (debt_amount)...")
    response = requests.post(f"{API_URL}/clients", headers=headers, json=new_model_client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating new model client: {response.status_code} - {response.text}")
        return False
    
    new_client = response.json()
    print(f"✅ New model client created successfully with ID: {new_client['client_id']}")
    
    # Now test the analytics endpoint with mixed data
    print(f"Getting analytics for capital ID: {capital_id} with mixed client data models...")
    response = requests.get(f"{API_URL}/analytics/{capital_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting analytics: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    print(f"✅ Analytics data retrieved successfully with mixed client data models")
    
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
    
    # Verify calculations include both old and new model clients
    # The total should include both the old client's total_amount and the new client's debt_amount
    expected_total = old_model_client_data['total_amount'] + new_model_client_data['debt_amount']
    
    # Allow for other clients that might exist in the capital
    if data['total_amount'] < expected_total:
        print(f"❌ Error: Total amount ({data['total_amount']}) is less than expected minimum ({expected_total})")
        return False
    
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
    
    print(f"✅ All analytics calculations are correct with mixed data models")
    
    # Clean up - delete the test clients
    print(f"Cleaning up test clients...")
    requests.delete(f"{API_URL}/clients/{old_client['client_id']}", headers=headers)
    requests.delete(f"{API_URL}/clients/{new_client['client_id']}", headers=headers)
    
    return True

def test_client_details_with_mixed_models(capital_id):
    """Test client details retrieval with both old and new data models"""
    print_separator("TESTING CLIENT DETAILS WITH MIXED DATA MODELS")
    
    # Create a client with the old data model (total_amount only)
    old_model_client_data = {
        "capital_id": capital_id,
        "name": "Старая Модель Клиент",
        "product": "Телевизор Samsung",
        "total_amount": 50000.0,  # Old field
        "monthly_payment": 5000.0,
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 10
    }
    
    print(f"Creating client with old data model (total_amount only)...")
    response = requests.post(f"{API_URL}/clients", headers=headers, json=old_model_client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating old model client: {response.status_code} - {response.text}")
        return False
    
    old_client = response.json()
    print(f"✅ Old model client created successfully with ID: {old_client['client_id']}")
    
    # Now create a client with the new data model (debt_amount and purchase_amount)
    new_model_client_data = {
        "capital_id": capital_id,
        "name": "Новая Модель Клиент",
        "product": "iPhone 15 Pro",
        "purchase_amount": 120000.0,
        "debt_amount": 120000.0,  # New field
        "monthly_payment": 10000.0,
        "guarantor_name": "Иванов Иван",
        "client_address": "г. Москва, ул. Ленина, д. 10",
        "client_phone": "+7 (901) 123-45-67",
        "guarantor_phone": "+7 (901) 123-45-68",
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 12
    }
    
    print(f"Creating client with new data model (debt_amount and purchase_amount)...")
    response = requests.post(f"{API_URL}/clients", headers=headers, json=new_model_client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating new model client: {response.status_code} - {response.text}")
        return False
    
    new_client = response.json()
    print(f"✅ New model client created successfully with ID: {new_client['client_id']}")
    
    # Test retrieving old model client details
    print(f"Getting details for old model client ID: {old_client['client_id']}...")
    response = requests.get(f"{API_URL}/clients/{old_client['client_id']}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting old model client details: {response.status_code} - {response.text}")
        return False
    
    old_client_details = response.json()
    print(f"✅ Old model client details retrieved successfully")
    
    # Verify old model client has total_amount but may have null debt_amount and purchase_amount
    if 'total_amount' not in old_client_details or old_client_details['total_amount'] != old_model_client_data['total_amount']:
        print(f"❌ Error: Old model client details missing or incorrect total_amount")
        print(f"  Expected: {old_model_client_data['total_amount']}")
        print(f"  Actual: {old_client_details.get('total_amount')}")
        return False
    
    # Test retrieving new model client details
    print(f"Getting details for new model client ID: {new_client['client_id']}...")
    response = requests.get(f"{API_URL}/clients/{new_client['client_id']}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting new model client details: {response.status_code} - {response.text}")
        return False
    
    new_client_details = response.json()
    print(f"✅ New model client details retrieved successfully")
    
    # Verify new model client has debt_amount and purchase_amount
    if 'debt_amount' not in new_client_details or new_client_details['debt_amount'] != new_model_client_data['debt_amount']:
        print(f"❌ Error: New model client details missing or incorrect debt_amount")
        print(f"  Expected: {new_model_client_data['debt_amount']}")
        print(f"  Actual: {new_client_details.get('debt_amount')}")
        return False
    
    if 'purchase_amount' not in new_client_details or new_client_details['purchase_amount'] != new_model_client_data['purchase_amount']:
        print(f"❌ Error: New model client details missing or incorrect purchase_amount")
        print(f"  Expected: {new_model_client_data['purchase_amount']}")
        print(f"  Actual: {new_client_details.get('purchase_amount')}")
        return False
    
    # Print client details for verification
    print(f"Old model client:")
    print(f"  Name: {old_client_details['name']}")
    print(f"  Product: {old_client_details['product']}")
    print(f"  Total amount: {old_client_details['total_amount']}")
    print(f"  Debt amount: {old_client_details.get('debt_amount')}")
    print(f"  Purchase amount: {old_client_details.get('purchase_amount')}")
    
    print(f"New model client:")
    print(f"  Name: {new_client_details['name']}")
    print(f"  Product: {new_client_details['product']}")
    print(f"  Total amount: {new_client_details.get('total_amount')}")
    print(f"  Debt amount: {new_client_details['debt_amount']}")
    print(f"  Purchase amount: {new_client_details['purchase_amount']}")
    
    # Clean up - delete the test clients
    print(f"Cleaning up test clients...")
    requests.delete(f"{API_URL}/clients/{old_client['client_id']}", headers=headers)
    requests.delete(f"{API_URL}/clients/{new_client['client_id']}", headers=headers)
    
    return True

def test_dashboard_with_mixed_models(capital_id):
    """Test dashboard data with mixed client data models"""
    print_separator("TESTING DASHBOARD WITH MIXED DATA MODELS")
    
    # Create a client with the old data model (total_amount only)
    old_model_client_data = {
        "capital_id": capital_id,
        "name": "Старая Модель Клиент",
        "product": "Телевизор Samsung",
        "total_amount": 50000.0,  # Old field
        "monthly_payment": 5000.0,
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 10
    }
    
    print(f"Creating client with old data model (total_amount only)...")
    response = requests.post(f"{API_URL}/clients", headers=headers, json=old_model_client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating old model client: {response.status_code} - {response.text}")
        return False
    
    old_client = response.json()
    print(f"✅ Old model client created successfully with ID: {old_client['client_id']}")
    
    # Now create a client with the new data model (debt_amount and purchase_amount)
    new_model_client_data = {
        "capital_id": capital_id,
        "name": "Новая Модель Клиент",
        "product": "iPhone 15 Pro",
        "purchase_amount": 120000.0,
        "debt_amount": 120000.0,  # New field
        "monthly_payment": 10000.0,
        "guarantor_name": "Иванов Иван",
        "client_address": "г. Москва, ул. Ленина, д. 10",
        "client_phone": "+7 (901) 123-45-67",
        "guarantor_phone": "+7 (901) 123-45-68",
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 12
    }
    
    print(f"Creating client with new data model (debt_amount and purchase_amount)...")
    response = requests.post(f"{API_URL}/clients", headers=headers, json=new_model_client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating new model client: {response.status_code} - {response.text}")
        return False
    
    new_client = response.json()
    print(f"✅ New model client created successfully with ID: {new_client['client_id']}")
    
    # Get dashboard data
    print("Getting dashboard data with mixed client models...")
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
    
    # Verify both old and new model clients are included in all_clients
    all_client_ids = [client['client_id'] for client in data['all_clients']]
    
    if old_client['client_id'] not in all_client_ids:
        print(f"❌ Error: Old model client not found in dashboard data")
        return False
    
    if new_client['client_id'] not in all_client_ids:
        print(f"❌ Error: New model client not found in dashboard data")
        return False
    
    print(f"✅ Both old and new model clients are included in dashboard data")
    
    # Find the clients in the all_clients list
    old_client_in_dashboard = None
    new_client_in_dashboard = None
    
    for client in data['all_clients']:
        if client['client_id'] == old_client['client_id']:
            old_client_in_dashboard = client
        elif client['client_id'] == new_client['client_id']:
            new_client_in_dashboard = client
    
    # Verify old model client data
    if not old_client_in_dashboard:
        print(f"❌ Error: Could not find old model client in dashboard data")
        return False
    
    if 'total_amount' not in old_client_in_dashboard or old_client_in_dashboard['total_amount'] != old_model_client_data['total_amount']:
        print(f"❌ Error: Old model client has incorrect total_amount in dashboard")
        print(f"  Expected: {old_model_client_data['total_amount']}")
        print(f"  Actual: {old_client_in_dashboard.get('total_amount')}")
        return False
    
    # Verify new model client data
    if not new_client_in_dashboard:
        print(f"❌ Error: Could not find new model client in dashboard data")
        return False
    
    if 'debt_amount' not in new_client_in_dashboard or new_client_in_dashboard['debt_amount'] != new_model_client_data['debt_amount']:
        print(f"❌ Error: New model client has incorrect debt_amount in dashboard")
        print(f"  Expected: {new_model_client_data['debt_amount']}")
        print(f"  Actual: {new_client_in_dashboard.get('debt_amount')}")
        return False
    
    # Print dashboard data for verification
    print(f"Today's payments: {len(data['today'])}")
    print(f"Tomorrow's payments: {len(data['tomorrow'])}")
    print(f"Overdue payments: {len(data['overdue'])}")
    print(f"Total clients: {len(data['all_clients'])}")
    
    # Clean up - delete the test clients
    print(f"Cleaning up test clients...")
    requests.delete(f"{API_URL}/clients/{old_client['client_id']}", headers=headers)
    requests.delete(f"{API_URL}/clients/{new_client['client_id']}", headers=headers)
    
    return True

def test_auto_init_with_new_models():
    """Test auto-init with updated models"""
    print_separator("TESTING AUTO-INIT WITH NEW MODELS")
    
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
    
    # Verify client data has all required fields including new model fields
    client = clients[0]
    required_fields = [
        "client_id", "capital_id", "name", "product", 
        "purchase_amount", "debt_amount", "monthly_payment", 
        "start_date", "end_date", "schedule"
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

def run_tests():
    """Run the tests for backward compatibility"""
    print_separator("STARTING BACKWARD COMPATIBILITY TESTS")
    
    # Test 1: Auto-init with new models
    print("Testing auto-init with new models...")
    if not test_auto_init_with_new_models():
        print("❌ Auto-init with new models test failed")
    else:
        print("✅ Auto-init with new models test passed")
    
    # Test 2: Auto-initialization
    capital_ids = test_auto_init()
    if not capital_ids:
        print("❌ Auto-initialization test failed, cannot continue")
        return False
    
    # Use the first capital for testing
    test_capital_id = capital_ids[0]
    print(f"Using capital ID {test_capital_id} for further tests")
    
    # Test 3: Analytics with mixed data models
    print("Testing analytics with mixed data models...")
    if not test_analytics_with_mixed_data(test_capital_id):
        print("❌ Analytics with mixed data models test failed")
    else:
        print("✅ Analytics with mixed data models test passed")
    
    # Test 4: Client details with mixed models
    print("Testing client details with mixed models...")
    if not test_client_details_with_mixed_models(test_capital_id):
        print("❌ Client details with mixed models test failed")
    else:
        print("✅ Client details with mixed models test passed")
    
    # Test 5: Dashboard with mixed models
    print("Testing dashboard with mixed models...")
    if not test_dashboard_with_mixed_models(test_capital_id):
        print("❌ Dashboard with mixed models test failed")
    else:
        print("✅ Dashboard with mixed models test passed")
    
    print_separator("ALL BACKWARD COMPATIBILITY TESTS COMPLETED")
    return True

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)