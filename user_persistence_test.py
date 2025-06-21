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

# Test user with permanent UID (this simulates the Firebase user.uid)
PERMANENT_USER_UID = "test_user_permanent_123"

# First token (simulates first login)
FIRST_TOKEN = f"token_first_login_{uuid.uuid4()}"

# Second token (simulates second login with same user)
SECOND_TOKEN = f"token_second_login_{uuid.uuid4()}"

def print_separator(title):
    """Print a separator with a title for better readability"""
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

def create_user_data(token):
    """Create initial user data with the given token"""
    print_separator("CREATING USER DATA WITH FIRST TOKEN")
    
    # Headers for all requests with the first token
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"  # First token, but user.uid will be extracted
    }
    
    # Step 1: Initialize mock data
    print("Step 1: Initializing mock data...")
    response = requests.post(f"{API_URL}/init-mock-data", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error initializing mock data: {response.status_code} - {response.text}")
        return None
    
    print(f"✅ Mock data initialized successfully")
    
    # Step 2: Get capitals
    print("Step 2: Getting capitals...")
    response = requests.get(f"{API_URL}/capitals", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting capitals: {response.status_code} - {response.text}")
        return None
    
    capitals = response.json()
    print(f"✅ Found {len(capitals)} capitals")
    
    if len(capitals) == 0:
        print("❌ No capitals found, cannot continue")
        return None
    
    # Use the first capital for testing
    capital_id = capitals[0]['id']
    print(f"Using capital ID: {capital_id}")
    
    # Step 3: Create a new client
    print("Step 3: Creating a new client...")
    client_data = {
        "capital_id": capital_id,
        "name": "Тестовый Клиент Постоянный",
        "product": "Test Persistence Product",
        "purchase_amount": 50000.0,
        "debt_amount": 50000.0,
        "monthly_payment": 5000.0,
        "guarantor_name": "Гарант Тестовый",
        "client_address": "г. Тестовый, ул. Тестовая, д. 123",
        "client_phone": "+7 (999) 123-45-67",
        "guarantor_phone": "+7 (999) 765-43-21",
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 10
    }
    
    response = requests.post(f"{API_URL}/clients", headers=headers, json=client_data)
    
    if response.status_code != 200:
        print(f"❌ Error creating client: {response.status_code} - {response.text}")
        return None
    
    client = response.json()
    client_id = client['client_id']
    print(f"✅ Client created successfully with ID: {client_id}")
    
    # Step 4: Get dashboard data
    print("Step 4: Getting dashboard data...")
    response = requests.get(f"{API_URL}/dashboard", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting dashboard data: {response.status_code} - {response.text}")
        return None
    
    dashboard = response.json()
    print(f"✅ Dashboard data retrieved successfully")
    print(f"  Total clients: {len(dashboard['all_clients'])}")
    
    # Step 5: Get analytics data
    print("Step 5: Getting analytics data...")
    response = requests.get(f"{API_URL}/analytics/{capital_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting analytics data: {response.status_code} - {response.text}")
        return None
    
    analytics = response.json()
    print(f"✅ Analytics data retrieved successfully")
    print(f"  Total amount: {analytics['total_amount']}")
    print(f"  Total clients: {analytics['total_clients']}")
    
    # Return the data we'll need for verification
    return {
        "capital_id": capital_id,
        "client_id": client_id,
        "total_clients": len(dashboard['all_clients']),
        "total_amount": analytics['total_amount']
    }

def verify_user_data(token, initial_data):
    """Verify user data persists with a different token but same user.uid"""
    print_separator("VERIFYING USER DATA WITH SECOND TOKEN")
    
    # Headers for all requests with the second token
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"  # Second token, but same user.uid will be extracted
    }
    
    # Step 1: Get capitals
    print("Step 1: Getting capitals...")
    response = requests.get(f"{API_URL}/capitals", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting capitals: {response.status_code} - {response.text}")
        return False
    
    capitals = response.json()
    print(f"✅ Found {len(capitals)} capitals")
    
    # Verify we have at least one capital
    if len(capitals) == 0:
        print("❌ No capitals found, data persistence failed")
        return False
    
    # Verify we can access the same capital as before
    capital_found = False
    for capital in capitals:
        if capital['id'] == initial_data['capital_id']:
            capital_found = True
            break
    
    if not capital_found:
        print(f"❌ Could not find original capital with ID {initial_data['capital_id']}")
        return False
    
    print(f"✅ Original capital found with ID: {initial_data['capital_id']}")
    
    # Step 2: Get clients
    print("Step 2: Getting clients...")
    response = requests.get(f"{API_URL}/clients", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting clients: {response.status_code} - {response.text}")
        return False
    
    clients = response.json()
    print(f"✅ Found {len(clients)} clients")
    
    # Verify we can access the same client as before
    client_found = False
    for client in clients:
        if client['client_id'] == initial_data['client_id']:
            client_found = True
            break
    
    if not client_found:
        print(f"❌ Could not find original client with ID {initial_data['client_id']}")
        return False
    
    print(f"✅ Original client found with ID: {initial_data['client_id']}")
    
    # Step 3: Get client details
    print("Step 3: Getting client details...")
    response = requests.get(f"{API_URL}/clients/{initial_data['client_id']}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting client details: {response.status_code} - {response.text}")
        return False
    
    client = response.json()
    print(f"✅ Client details retrieved successfully")
    print(f"  Client name: {client['name']}")
    print(f"  Product: {client['product']}")
    
    # Step 4: Get dashboard data
    print("Step 4: Getting dashboard data...")
    response = requests.get(f"{API_URL}/dashboard", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting dashboard data: {response.status_code} - {response.text}")
        return False
    
    dashboard = response.json()
    print(f"✅ Dashboard data retrieved successfully")
    print(f"  Total clients: {len(dashboard['all_clients'])}")
    
    # Verify the number of clients matches
    if len(dashboard['all_clients']) != initial_data['total_clients']:
        print(f"❌ Client count mismatch: expected {initial_data['total_clients']}, got {len(dashboard['all_clients'])}")
        return False
    
    print(f"✅ Client count matches: {len(dashboard['all_clients'])}")
    
    # Step 5: Get analytics data
    print("Step 5: Getting analytics data...")
    response = requests.get(f"{API_URL}/analytics/{initial_data['capital_id']}", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Error getting analytics data: {response.status_code} - {response.text}")
        return False
    
    analytics = response.json()
    print(f"✅ Analytics data retrieved successfully")
    print(f"  Total amount: {analytics['total_amount']}")
    print(f"  Total clients: {analytics['total_clients']}")
    
    # Verify the total amount matches (allowing for small floating point differences)
    if abs(analytics['total_amount'] - initial_data['total_amount']) > 0.01:
        print(f"❌ Total amount mismatch: expected {initial_data['total_amount']}, got {analytics['total_amount']}")
        return False
    
    print(f"✅ Total amount matches: {analytics['total_amount']}")
    
    # Step 6: Test updating a client
    print("Step 6: Testing client update...")
    update_data = {
        "name": "Тестовый Клиент Обновленный",
        "product": "Updated Test Product"
    }
    
    response = requests.put(f"{API_URL}/clients/{initial_data['client_id']}", headers=headers, json=update_data)
    
    if response.status_code != 200:
        print(f"❌ Error updating client: {response.status_code} - {response.text}")
        return False
    
    updated_client = response.json()
    print(f"✅ Client updated successfully")
    print(f"  Updated name: {updated_client['name']}")
    print(f"  Updated product: {updated_client['product']}")
    
    # Verify the update was successful
    if updated_client['name'] != update_data['name'] or updated_client['product'] != update_data['product']:
        print(f"❌ Client update failed: data mismatch")
        return False
    
    print(f"✅ Client update successful: data matches")
    
    # Step 7: Test payment status update
    print("Step 7: Testing payment status update...")
    
    # Get client details to find a payment
    response = requests.get(f"{API_URL}/clients/{initial_data['client_id']}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Error getting client details: {response.status_code} - {response.text}")
        return False
    
    client = response.json()
    if not client['schedule'] or len(client['schedule']) == 0:
        print("❌ Client has no payment schedule")
        return False
    
    # Get the first payment
    payment = client['schedule'][0]
    payment_date = payment['payment_date']
    
    # Update payment status to "paid"
    response = requests.put(
        f"{API_URL}/clients/{initial_data['client_id']}/payments/{payment_date}",
        headers=headers,
        json={"status": "paid"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error updating payment status: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Payment status updated successfully")
    
    # Verify the update by getting client details again
    response = requests.get(f"{API_URL}/clients/{initial_data['client_id']}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Error getting updated client details: {response.status_code} - {response.text}")
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
    
    print(f"✅ Payment status was updated to 'paid'")
    
    return True

def run_user_persistence_test():
    """Run the user persistence test"""
    print_separator("STARTING USER PERSISTENCE TEST")
    
    # Override the user.uid in the get_current_user function
    # This is done by setting a specific format in the Authorization header
    # The server extracts the user ID from the token
    
    # Step 1: Create user data with first token
    print(f"Using permanent user UID: {PERMANENT_USER_UID}")
    print(f"First token: {FIRST_TOKEN}")
    
    # Modify the first token to include the permanent user UID
    # The server will extract PERMANENT_USER_UID as the user ID
    first_token_with_uid = f"{PERMANENT_USER_UID}:{FIRST_TOKEN}"
    
    initial_data = create_user_data(first_token_with_uid)
    if not initial_data:
        print("❌ Failed to create initial user data")
        return False
    
    print("\nInitial data created successfully:")
    print(f"  Capital ID: {initial_data['capital_id']}")
    print(f"  Client ID: {initial_data['client_id']}")
    print(f"  Total clients: {initial_data['total_clients']}")
    print(f"  Total amount: {initial_data['total_amount']}")
    
    # Step 2: "Log out" and "log in" with a different token but same user.uid
    print("\nSimulating logout and login with a different token...")
    print(f"Second token: {SECOND_TOKEN}")
    
    # Modify the second token to include the same permanent user UID
    # The server will extract the same PERMANENT_USER_UID as the user ID
    second_token_with_uid = f"{PERMANENT_USER_UID}:{SECOND_TOKEN}"
    
    # Step 3: Verify data persists with the second token
    if not verify_user_data(second_token_with_uid, initial_data):
        print("❌ User persistence test failed: data did not persist across tokens")
        return False
    
    print_separator("USER PERSISTENCE TEST COMPLETED SUCCESSFULLY")
    print("✅ User data persists correctly when using user.uid instead of tokens")
    print("✅ All capitals, clients, and payment data remain accessible")
    print("✅ All API endpoints work correctly with the new token")
    
    return True

if __name__ == "__main__":
    success = run_user_persistence_test()
    sys.exit(0 if success else 1)