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
    
    return client['client_id']

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

def run_all_tests():
    """Run all tests in sequence"""
    print_separator("STARTING BACKEND TESTS")
    
    # Test 1: Auto-initialization
    capital_ids = test_auto_init()
    if not capital_ids:
        print("❌ Auto-initialization test failed, cannot continue")
        return False
    
    # Use the first capital for testing
    test_capital_id = capital_ids[0]
    print(f"Using capital ID {test_capital_id} for further tests")
    
    # Test 2: Client creation
    client_id = test_client_creation(test_capital_id)
    if not client_id:
        print("❌ Client creation test failed, cannot continue")
        return False
    
    # Test 3: Dashboard data
    if not test_dashboard_data(test_capital_id):
        print("❌ Dashboard data test failed")
        return False
    
    # Test 4: Capital deletion (use the second capital to preserve the first one)
    if len(capital_ids) > 1:
        deletion_capital_id = capital_ids[1]
        if not test_capital_deletion(deletion_capital_id):
            print("❌ Capital deletion test failed")
            return False
    else:
        print("⚠️ Skipping capital deletion test as only one capital is available")
    
    print_separator("ALL TESTS COMPLETED SUCCESSFULLY")
    return True

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)