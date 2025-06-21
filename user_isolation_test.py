#!/usr/bin/env python3
import requests
import json
import uuid
import os
import sys
from datetime import datetime, date

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

def print_separator(title):
    """Print a separator with a title for better readability"""
    print("\n" + "="*80)
    print(f" {title} ".center(80, "="))
    print("="*80 + "\n")

def create_test_user():
    """Create a test user with a unique ID"""
    return f"test_user_{uuid.uuid4()}"

def get_headers(user_id):
    """Get headers with Authorization for a specific user"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {user_id}"
    }

def test_user_isolation():
    """Test user isolation functionality"""
    print_separator("TESTING USER ISOLATION")
    
    # Create two test users
    user_a = create_test_user()
    user_b = create_test_user()
    
    print(f"Created User A: {user_a}")
    print(f"Created User B: {user_b}")
    
    # Headers for each user
    headers_a = get_headers(user_a)
    headers_b = get_headers(user_b)
    
    # Initialize data for both users
    print("\nInitializing data for User A...")
    response_a = requests.get(f"{API_URL}/auto-init", headers=headers_a)
    if response_a.status_code != 200:
        print(f"❌ Error initializing User A: {response_a.status_code} - {response_a.text}")
        return False
    
    capitals_a = response_a.json().get('capitals', [])
    if not capitals_a:
        print(f"❌ No capitals created for User A")
        return False
    
    capital_a_id = capitals_a[0]['id']
    print(f"✅ User A has capital with ID: {capital_a_id}")
    
    print("\nInitializing data for User B...")
    response_b = requests.get(f"{API_URL}/auto-init", headers=headers_b)
    if response_b.status_code != 200:
        print(f"❌ Error initializing User B: {response_b.status_code} - {response_b.text}")
        return False
    
    capitals_b = response_b.json().get('capitals', [])
    if not capitals_b:
        print(f"❌ No capitals created for User B")
        return False
    
    capital_b_id = capitals_b[0]['id']
    print(f"✅ User B has capital with ID: {capital_b_id}")
    
    # Create a unique client for User A
    print("\nCreating a unique client for User A...")
    client_a_data = {
        "capital_id": capital_a_id,
        "name": "User A Client",
        "product": "User A Product",
        "purchase_amount": 100000.0,
        "debt_amount": 100000.0,
        "monthly_payment": 10000.0,
        "guarantor_name": "User A Guarantor",
        "client_address": "User A Address",
        "client_phone": "+7 (111) 111-11-11",
        "guarantor_phone": "+7 (111) 111-11-12",
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 10
    }
    
    response = requests.post(f"{API_URL}/clients", headers=headers_a, json=client_a_data)
    if response.status_code != 200:
        print(f"❌ Error creating client for User A: {response.status_code} - {response.text}")
        return False
    
    client_a = response.json()
    client_a_id = client_a['client_id']
    print(f"✅ Created client for User A with ID: {client_a_id}")
    
    # Create a unique client for User B
    print("\nCreating a unique client for User B...")
    client_b_data = {
        "capital_id": capital_b_id,
        "name": "User B Client",
        "product": "User B Product",
        "purchase_amount": 200000.0,
        "debt_amount": 200000.0,
        "monthly_payment": 20000.0,
        "guarantor_name": "User B Guarantor",
        "client_address": "User B Address",
        "client_phone": "+7 (222) 222-22-22",
        "guarantor_phone": "+7 (222) 222-22-23",
        "start_date": date.today().strftime("%Y-%m-%d"),
        "months": 10
    }
    
    response = requests.post(f"{API_URL}/clients", headers=headers_b, json=client_b_data)
    if response.status_code != 200:
        print(f"❌ Error creating client for User B: {response.status_code} - {response.text}")
        return False
    
    client_b = response.json()
    client_b_id = client_b['client_id']
    print(f"✅ Created client for User B with ID: {client_b_id}")
    
    # Test 1: User A should not be able to access User B's capital
    print("\nTest 1: User A should not be able to access User B's capital")
    response = requests.get(f"{API_URL}/capitals/{capital_b_id}", headers=headers_a)
    if response.status_code == 200:
        print(f"❌ User A was able to access User B's capital (expected 404, got 200)")
        return False
    elif response.status_code != 404:
        print(f"❌ Unexpected status code: {response.status_code} (expected 404)")
        return False
    
    print(f"✅ User A cannot access User B's capital (got {response.status_code} as expected)")
    
    # Test 2: User B should not be able to access User A's capital
    print("\nTest 2: User B should not be able to access User A's capital")
    response = requests.get(f"{API_URL}/capitals/{capital_a_id}", headers=headers_b)
    if response.status_code == 200:
        print(f"❌ User B was able to access User A's capital (expected 404, got 200)")
        return False
    elif response.status_code != 404:
        print(f"❌ Unexpected status code: {response.status_code} (expected 404)")
        return False
    
    print(f"✅ User B cannot access User A's capital (got {response.status_code} as expected)")
    
    # Test 3: User A should not be able to access User B's client
    print("\nTest 3: User A should not be able to access User B's client")
    response = requests.get(f"{API_URL}/clients/{client_b_id}", headers=headers_a)
    if response.status_code == 200:
        print(f"❌ User A was able to access User B's client (expected 404, got 200)")
        return False
    elif response.status_code != 404:
        print(f"❌ Unexpected status code: {response.status_code} (expected 404)")
        return False
    
    print(f"✅ User A cannot access User B's client (got {response.status_code} as expected)")
    
    # Test 4: User B should not be able to access User A's client
    print("\nTest 4: User B should not be able to access User A's client")
    response = requests.get(f"{API_URL}/clients/{client_a_id}", headers=headers_b)
    if response.status_code == 200:
        print(f"❌ User B was able to access User A's client (expected 404, got 200)")
        return False
    elif response.status_code != 404:
        print(f"❌ Unexpected status code: {response.status_code} (expected 404)")
        return False
    
    print(f"✅ User B cannot access User A's client (got {response.status_code} as expected)")
    
    # Test 5: User A should not be able to update User B's client
    print("\nTest 5: User A should not be able to update User B's client")
    update_data = {"name": "Updated by User A"}
    response = requests.put(f"{API_URL}/clients/{client_b_id}", headers=headers_a, json=update_data)
    if response.status_code == 200:
        print(f"❌ User A was able to update User B's client (expected 404, got 200)")
        return False
    elif response.status_code != 404:
        print(f"❌ Unexpected status code: {response.status_code} (expected 404)")
        return False
    
    print(f"✅ User A cannot update User B's client (got {response.status_code} as expected)")
    
    # Test 6: User A should not be able to delete User B's client
    print("\nTest 6: User A should not be able to delete User B's client")
    response = requests.delete(f"{API_URL}/clients/{client_b_id}", headers=headers_a)
    if response.status_code == 200:
        print(f"❌ User A was able to delete User B's client (expected 404, got 200)")
        return False
    elif response.status_code != 404:
        print(f"❌ Unexpected status code: {response.status_code} (expected 404)")
        return False
    
    print(f"✅ User A cannot delete User B's client (got {response.status_code} as expected)")
    
    # Test 7: User A should not be able to update payment status for User B's client
    print("\nTest 7: User A should not be able to update payment status for User B's client")
    # Get a payment date from User B's client
    response = requests.get(f"{API_URL}/clients/{client_b_id}", headers=headers_b)
    if response.status_code != 200:
        print(f"❌ Error getting User B's client: {response.status_code} - {response.text}")
        return False
    
    client_b_details = response.json()
    if not client_b_details.get('schedule') or len(client_b_details['schedule']) == 0:
        print(f"❌ User B's client has no payment schedule")
        return False
    
    payment_date = client_b_details['schedule'][0]['payment_date']
    
    # Try to update payment status as User A
    response = requests.put(
        f"{API_URL}/clients/{client_b_id}/payments/{payment_date}",
        headers=headers_a,
        json={"status": "paid"}
    )
    
    if response.status_code == 200:
        print(f"❌ User A was able to update payment status for User B's client (expected 404, got 200)")
        return False
    elif response.status_code != 404:
        print(f"❌ Unexpected status code: {response.status_code} (expected 404)")
        return False
    
    print(f"✅ User A cannot update payment status for User B's client (got {response.status_code} as expected)")
    
    # Test 8: User A should not see User B's clients in dashboard
    print("\nTest 8: User A should not see User B's clients in dashboard")
    response = requests.get(f"{API_URL}/dashboard", headers=headers_a)
    if response.status_code != 200:
        print(f"❌ Error getting dashboard for User A: {response.status_code} - {response.text}")
        return False
    
    dashboard_a = response.json()
    all_clients_a = dashboard_a.get('all_clients', [])
    
    # Check if any of User B's clients are in User A's dashboard
    user_b_client_in_a = False
    for client in all_clients_a:
        if client.get('client_id') == client_b_id:
            user_b_client_in_a = True
            break
    
    if user_b_client_in_a:
        print(f"❌ User A's dashboard contains User B's client")
        return False
    
    print(f"✅ User A's dashboard does not contain User B's client")
    
    # Test 9: User B should not see User A's clients in dashboard
    print("\nTest 9: User B should not see User A's clients in dashboard")
    response = requests.get(f"{API_URL}/dashboard", headers=headers_b)
    if response.status_code != 200:
        print(f"❌ Error getting dashboard for User B: {response.status_code} - {response.text}")
        return False
    
    dashboard_b = response.json()
    all_clients_b = dashboard_b.get('all_clients', [])
    
    # Check if any of User A's clients are in User B's dashboard
    user_a_client_in_b = False
    for client in all_clients_b:
        if client.get('client_id') == client_a_id:
            user_a_client_in_b = True
            break
    
    if user_a_client_in_b:
        print(f"❌ User B's dashboard contains User A's client")
        return False
    
    print(f"✅ User B's dashboard does not contain User A's client")
    
    # Test 10: User A should not see User B's data in analytics
    print("\nTest 10: User A should not see User B's data in analytics")
    response = requests.get(f"{API_URL}/analytics/{capital_a_id}", headers=headers_a)
    if response.status_code != 200:
        print(f"❌ Error getting analytics for User A: {response.status_code} - {response.text}")
        return False
    
    analytics_a = response.json()
    
    # User A should only see their own clients
    if analytics_a.get('total_clients', 0) < 1:
        print(f"❌ User A's analytics shows no clients")
        return False
    
    print(f"✅ User A's analytics shows only their own clients")
    
    # Test 11: Test with no Authorization header (should use demo user)
    print("\nTest 11: Test with no Authorization header (should use demo user)")
    no_auth_headers = {"Content-Type": "application/json"}
    
    response = requests.get(f"{API_URL}/capitals", headers=no_auth_headers)
    if response.status_code != 200:
        print(f"❌ Error accessing capitals without auth: {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Can access capitals without auth (using demo user)")
    
    # Test 12: Demo user should not see User A's or User B's data
    print("\nTest 12: Demo user should not see User A's or User B's data")
    
    # Check if demo user can access User A's capital
    response = requests.get(f"{API_URL}/capitals/{capital_a_id}", headers=no_auth_headers)
    if response.status_code == 200:
        print(f"❌ Demo user was able to access User A's capital (expected 404, got 200)")
        return False
    
    print(f"✅ Demo user cannot access User A's capital (got {response.status_code} as expected)")
    
    # Check if demo user can access User B's capital
    response = requests.get(f"{API_URL}/capitals/{capital_b_id}", headers=no_auth_headers)
    if response.status_code == 200:
        print(f"❌ Demo user was able to access User B's capital (expected 404, got 200)")
        return False
    
    print(f"✅ Demo user cannot access User B's capital (got {response.status_code} as expected)")
    
    print("\n✅ All user isolation tests passed!")
    return True

if __name__ == "__main__":
    success = test_user_isolation()
    sys.exit(0 if success else 1)