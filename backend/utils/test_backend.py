# utils/test_backend.py
import requests
import json
import os
import sys

def test_backend():
    base_url = "http://localhost:5000/api"
    
    print("🧪 Testing Backend API...")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n1. 🔍 Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   ✅ Status: {response.status_code}")
        print(f"   📊 Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   ❌ Health check failed: {e}")
        print("   💡 Make sure your backend is running: python utils/bank_statement.py")
        return False
    
    # Test 2: Supported Banks
    print("\n2. 🏦 Testing Supported Banks...")
    try:
        response = requests.get(f"{base_url}/supported-banks")
        print(f"   ✅ Status: {response.status_code}")
        print(f"   📊 Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   ❌ Supported banks failed: {e}")
    
    # Test 3: Check if test PDF exists
    print("\n3. 📄 Looking for test PDF files...")
    
    # Check multiple locations for PDF files
    search_paths = [
        '.',  # Current directory (utils folder)
        '..', # Parent directory
        '../..', # Project root
    ]
    
    pdf_files = []
    for path in search_paths:
        if os.path.exists(path):
            files_in_path = [os.path.join(path, f) for f in os.listdir(path) if f.endswith('.pdf')]
            pdf_files.extend(files_in_path)
    
    if pdf_files:
        print(f"   ✅ Found PDF files: {pdf_files}")
    else:
        print("   ⚠️  No PDF files found")
        print("   💡 Please add your Karnataka Bank PDF to the project folder")
    
    # Test 4: Test PDF Upload with actual file
    print("\n4. 🚀 Testing PDF Upload...")
    try:
        # Try to find the specific Karnataka Bank PDF
        test_pdf_path = None
        possible_paths = [
            'Account_statement_20250927195608.pdf',
            '../Account_statement_20250927195608.pdf',
            '../../Account_statement_20250927195608.pdf',
            './test.pdf',
            '../test.pdf',
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                test_pdf_path = path
                break
        
        if test_pdf_path and os.path.exists(test_pdf_path):
            print(f"   📂 Using PDF file: {test_pdf_path}")
            
            with open(test_pdf_path, 'rb') as pdf_file:
                files = {'file': (os.path.basename(test_pdf_path), pdf_file, 'application/pdf')}
                data = {'user_id': 'test_user_123'}
                
                print(f"   📤 Sending request to: {base_url}/upload-statement")
                response = requests.post(f"{base_url}/upload-statement", files=files, data=data)
                
                print(f"   📨 Upload Status: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"   ✅ Upload Successful!")
                    print(f"   📝 Message: {result.get('message', 'No message')}")
                    if 'data' in result:
                        data = result['data']
                        transactions = data.get('transactions', [])
                        print(f"   💰 Transactions found: {len(transactions)}")
                        print(f"   🏦 Bank Type: {data.get('bank_type', 'Unknown')}")
                        account_info = data.get('account_info', {})
                        print(f"   👤 Account Holder: {account_info.get('account_holder', 'Unknown')}")
                        print(f"   🔢 Account Number: {account_info.get('account_number', 'Unknown')}")
                        
                        # Show first 3 transactions
                        if transactions:
                            print(f"   📋 Sample transactions:")
                            for i, tx in enumerate(transactions[:3]):
                                print(f"      {i+1}. {tx.get('type', 'unknown')}: ${tx.get('amount', 0)} - {tx.get('description', '')}")
                else:
                    print(f"   ❌ Upload Failed with status: {response.status_code}")
                    try:
                        error_data = response.json()
                        print(f"   📋 Error: {json.dumps(error_data, indent=2)}")
                    except:
                        print(f"   📋 Error text: {response.text}")
        else:
            print("   ⚠️  No PDF file found for testing")
            print("   💡 Please add a PDF file to test upload functionality")
            print("   💡 Current working directory:", os.getcwd())
            print("   💡 Files in current directory:", os.listdir('.'))
            
    except Exception as e:
        print(f"   ❌ Upload test failed: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("✅ Backend testing completed!")

def check_backend_status():
    """Quick status check"""
    base_url = "http://localhost:5000/api"
    
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend is running and healthy!")
            print(f"   Service: {data.get('service', 'Unknown')}")
            print(f"   Supported banks: {', '.join(data.get('supported_banks', []))}")
            return True
        else:
            print(f"❌ Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running:")
        print("   💡 Run: python utils/bank_statement.py")
        print("   💡 From the project root directory")
        return False
    except Exception as e:
        print(f"❌ Error checking backend: {e}")
        return False

if __name__ == "__main__":
    print("Starting Backend Tests...")
    print("Note: Make sure your backend is running in another terminal!")
    print("Command: python utils/bank_statement.py")
    print()
    
    # First, check if backend is running
    if not check_backend_status():
        print("\n❌ Backend is not running. Please start it first.")
        sys.exit(1)
    
    # Run full tests
    test_backend()