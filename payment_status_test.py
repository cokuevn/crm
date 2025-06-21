#!/usr/bin/env python3
import requests
import json
import sys
import time

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
TEST_USER_ID = "test_user_payment_status"

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

def test_backend_health():
    """Test if the backend is responding to basic requests"""
    print_separator("TESTING BACKEND HEALTH")
    
    try:
        # Test auto-init endpoint which should always work
        response = requests.get(f"{API_URL}/auto-init", headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Backend health check failed: {response.status_code} - {response.text}")
            return False
        
        print(f"✅ Backend is healthy and responding to requests")
        return True
    except Exception as e:
        print(f"❌ Backend health check failed with exception: {str(e)}")
        return False

def get_test_client_and_payment():
    """Get a test client and payment for testing"""
    print_separator("GETTING TEST CLIENT AND PAYMENT")
    
    # First, get capitals
    response = requests.get(f"{API_URL}/auto-init", headers=headers)
    if response.status_code != 200:
        print(f"❌ Error getting capitals: {response.status_code} - {response.text}")
        return None, None
    
    data = response.json()
    if 'capitals' not in data or len(data['capitals']) == 0:
        print(f"❌ Error: No capitals found")
        return None, None
    
    capital_id = data['capitals'][0]['id']
    print(f"✅ Using capital ID: {capital_id}")
    
    # Get clients for this capital
    response = requests.get(f"{API_URL}/clients?capital_id={capital_id}", headers=headers)
    if response.status_code != 200:
        print(f"❌ Error getting clients: {response.status_code} - {response.text}")
        return None, None
    
    clients = response.json()
    if len(clients) == 0:
        print(f"❌ Error: No clients found for capital {capital_id}")
        return None, None
    
    # Use the first client
    client = clients[0]
    client_id = client['client_id']
    print(f"✅ Using client ID: {client_id}")
    print(f"✅ Client name: {client['name']}")
    
    # Find a payment in the schedule
    if not client['schedule'] or len(client['schedule']) == 0:
        print("❌ Client has no payment schedule")
        return None, None
    
    # Use the first payment
    payment = client['schedule'][0]
    payment_date = payment['payment_date']
    print(f"✅ Using payment date: {payment_date}")
    print(f"✅ Payment amount: {payment['amount']}")
    print(f"✅ Current payment status: {payment['status']}")
    
    return client_id, payment_date

def test_payment_status_update(client_id, payment_date):
    """Test payment status update with different statuses"""
    print_separator("TESTING PAYMENT STATUS UPDATE")
    
    if not client_id or not payment_date:
        print("❌ Cannot test payment status update without client_id and payment_date")
        return False
    
    # Test updating to "paid" status
    print(f"1. Updating payment on {payment_date} to 'paid' status...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={"status": "paid"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error updating payment status to 'paid': {response.status_code} - {response.text}")
        return False
    
    print(f"✅ Payment status updated to 'paid'")
    
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
    
    # Test updating to "pending" status
    print(f"2. Updating payment on {payment_date} to 'pending' status...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={"status": "pending"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error updating payment status to 'pending': {response.status_code} - {response.text}")
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
    
    # Verify paid_date was cleared
    if updated_payment.get('paid_date'):
        print(f"❌ paid_date was not cleared when status changed to 'pending'")
        return False
    
    print(f"✅ Payment status was updated to 'pending' and paid_date was cleared")
    
    # Test updating to "overdue" status
    print(f"3. Updating payment on {payment_date} to 'overdue' status...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={"status": "overdue"}
    )
    
    if response.status_code != 200:
        print(f"❌ Error updating payment status to 'overdue': {response.status_code} - {response.text}")
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
    
    # Test error handling for invalid status
    print(f"4. Testing error handling for invalid status...")
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
    print(f"5. Testing error handling for missing status in request body...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/{payment_date}",
        headers=headers,
        json={}
    )
    
    if response.status_code != 400:
        print(f"❌ Error: Expected 400 for missing status, got {response.status_code}")
        return False
    
    print(f"✅ Proper error handling for missing status (400 response)")
    
    # Test error handling for non-existent payment date
    print(f"6. Testing error handling for non-existent payment date...")
    response = requests.put(
        f"{API_URL}/clients/{client_id}/payments/2099-01-01",
        headers=headers,
        json={"status": "paid"}
    )
    
    if response.status_code != 404:
        print(f"❌ Error: Expected 404 for non-existent payment date, got {response.status_code}")
        return False
    
    print(f"✅ Proper error handling for non-existent payment date (404 response)")
    
    # Test error handling for non-existent client
    print(f"7. Testing error handling for non-existent client...")
    response = requests.put(
        f"{API_URL}/clients/non-existent-client/payments/{payment_date}",
        headers=headers,
        json={"status": "paid"}
    )
    
    if response.status_code != 404:
        print(f"❌ Error: Expected 404 for non-existent client, got {response.status_code}")
        return False
    
    print(f"✅ Proper error handling for non-existent client (404 response)")
    
    return True

def main():
    """Main test function"""
    print_separator("PAYMENT STATUS CHANGE FUNCTIONALITY TEST")
    
    # Test 1: Backend health
    if not test_backend_health():
        print("❌ Backend health check failed, cannot continue")
        return False
    
    # Test 2: Get test client and payment
    client_id, payment_date = get_test_client_and_payment()
    if not client_id or not payment_date:
        print("❌ Could not get test client and payment, cannot continue")
        return False
    
    # Test 3: Payment status update
    if not test_payment_status_update(client_id, payment_date):
        print("❌ Payment status update test failed")
        return False
    
    print_separator("ALL TESTS COMPLETED SUCCESSFULLY")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)