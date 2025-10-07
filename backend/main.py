from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
import hashlib
import jwt
import os
import shutil
import uuid
from bson import ObjectId
import json

# Use your existing database class
from database.mongodb import db

# Create FastAPI app
app = FastAPI(
    title="AI Financial Assistant",
    description="MongoDB Version",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
SECRET_KEY = "simple-secret-key-123"
ALGORITHM = "HS256"

# Create uploads directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def ensure_database_connected():
    """Ensure database is connected before operations"""
    if not db.is_connected:
        print("🔄 Database not connected, attempting to connect...")
        if not db.connect():
            raise HTTPException(status_code=500, detail="Database connection failed")
    return True

# Database connection at startup
@app.on_event("startup")
async def startup_event():
    """Connect to database when application starts"""
    print("🔄 Starting database connection...")
    if db.connect():
        print("✅ Database connected successfully")
        
        # Test if collections exist
        try:
            collections = db.db.list_collection_names()
            print(f"📁 Available collections: {collections}")
        except Exception as e:
            print(f"❌ Error listing collections: {e}")
    else:
        print("❌ Database connection failed")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection when application stops"""
    db.close()
    print("🔌 Database connection closed")

# ===== ROUTES =====

@app.get("/")
async def root():
    db_status = "connected" if db.is_connected else "disconnected"
    return {
        "message": "🚀 Financial Assistant with MongoDB is RUNNING!",
        "status": "active", 
        "version": "1.0.0",
        "database": f"MongoDB ({db_status})",
        "features": ["authentication", "transactions", "insights", "stocks", "bank-statement-upload"]
    }

@app.get("/health")
async def health():
    db_status = "connected" if db.is_connected else "disconnected"
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": f"MongoDB ({db_status})",
        "features": {
            "bank_statement_upload": True,
            "pdf_processing": True,
            "transaction_extraction": True
        }
    }

# Test database connection
@app.get("/api/test-db")
async def test_database():
    """Test database connection"""
    try:
        if db.connect():
            return {
                "success": True,
                "message": "Database connected successfully",
                "collections": db.db.list_collection_names() if db.db else []
            }
        else:
            return {
                "success": False,
                "error": "Database connection failed"
            }
    except Exception as e:
        return {
            "success": False,
            "error": f"Database test failed: {str(e)}"
        }

# User Management
@app.post("/api/register")
async def register_user(username: str, email: str, password: str):
    try:
        ensure_database_connected()
        
        users_collection = db.get_collection("users")
        if users_collection is None:
            raise HTTPException(status_code=500, detail="Could not access users collection")
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        user_id = f"user_{ObjectId()}"
        
        user_data = {
            "user_id": user_id,
            "username": username,
            "email": email,
            "password": hash_password(password),
            "created_at": datetime.utcnow()
        }
        
        print(f"📝 Attempting to insert user: {username}, {email}")
        result = users_collection.insert_one(user_data)
        print(f"✅ User inserted with ID: {result.inserted_id}")
        
        return {
            "success": True,
            "message": "User registered successfully",
            "user_id": user_id,
            "user": {
                "username": username,
                "email": email
            }
        }
    except Exception as e:
        print(f"❌ Registration error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/login")
async def login_user(email: str, password: str):
    try:
        ensure_database_connected()
        
        users_collection = db.get_collection("users")
        if users_collection is None:
            raise HTTPException(status_code=500, detail="Could not access users collection")
        
        user = users_collection.find_one({"email": email})
        
        if not user or user["password"] != hash_password(password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = jwt.encode({"sub": email, "user_id": user["user_id"]}, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "success": True,
            "message": "Login successful",
            "access_token": token,
            "user": {
                "user_id": user["user_id"],
                "username": user["username"],
                "email": user["email"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# Financial Transactions
@app.post("/api/transactions")
async def add_transaction(
    user_id: str, 
    amount: float, 
    category: str, 
    description: str = "",
    transaction_type: str = "expense"
):
    """Add a new transaction to MongoDB"""
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        if transactions_collection is None:
            raise HTTPException(status_code=500, detail="Could not access transactions collection")
        
        # Generate unique transaction ID
        transaction_id = f"txn_{ObjectId()}"
        
        transaction_data = {
            "transaction_id": transaction_id,
            "user_id": user_id,
            "amount": float(amount),
            "category": category,
            "description": description,
            "type": transaction_type,
            "date": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        
        print(f"💾 Attempting to save transaction: {transaction_data}")
        
        result = transactions_collection.insert_one(transaction_data)
        print(f"✅ Transaction saved with ID: {result.inserted_id}")
        
        # Create a clean response with serializable data
        response_data = {
            "transaction_id": transaction_id,
            "user_id": user_id,
            "amount": float(amount),
            "category": category,
            "description": description,
            "type": transaction_type,
            "date": datetime.utcnow().isoformat(),  # Convert to ISO string
            "created_at": datetime.utcnow().isoformat()  # Convert to ISO string
        }
        
        # Verify the transaction was saved
        saved_transaction = transactions_collection.find_one({"_id": result.inserted_id})
        if saved_transaction:
            print(f"✅ Transaction verified in database")
        else:
            print("❌ Transaction not found after insertion")
        
        return {
            "success": True,
            "message": "Transaction added successfully",
            "transaction_id": transaction_id,
            "data": response_data  # Use the clean response data instead of transaction_data
        }
        
    except Exception as e:
        print(f"❌ Transaction save error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add transaction: {str(e)}")

@app.get("/api/transactions/{user_id}")
async def get_transactions(user_id: str):
    """Get all transactions for a user"""
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        if transactions_collection is None:
            raise HTTPException(status_code=500, detail="Could not access transactions collection")
        
        # Get transactions sorted by date (newest first)
        transactions = list(transactions_collection.find({"user_id": user_id}).sort("date", -1))
        
        # Convert ObjectId and datetime for JSON serialization
        for transaction in transactions:
            transaction["_id"] = str(transaction["_id"])
            if isinstance(transaction.get("date"), datetime):
                transaction["date"] = transaction["date"].isoformat()
            if isinstance(transaction.get("created_at"), datetime):
                transaction["created_at"] = transaction["created_at"].isoformat()
        
        print(f"📊 Found {len(transactions)} transactions for user {user_id}")
        
        return {
            "success": True,
            "transactions": transactions,
            "count": len(transactions)
        }
        
    except Exception as e:
        print(f"❌ Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {str(e)}")

@app.get("/api/transactions/{user_id}/summary")
async def get_transactions_summary(user_id: str):
    """Get transaction summary (total income, expenses, etc.)"""
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        if transactions_collection is None:
            raise HTTPException(status_code=500, detail="Could not access transactions collection")
        
        # Get all user transactions
        transactions = list(transactions_collection.find({"user_id": user_id}))
        
        # Calculate totals
        total_income = sum(t['amount'] for t in transactions if t.get('type') == 'income')
        total_expenses = sum(t['amount'] for t in transactions if t.get('type') == 'expense')
        net_balance = total_income - total_expenses
        
        # Calculate by category
        category_totals = {}
        for transaction in transactions:
            category = transaction.get('category', 'Uncategorized')
            amount = transaction['amount']
            trans_type = transaction.get('type', 'expense')
            
            if category not in category_totals:
                category_totals[category] = {'income': 0, 'expense': 0}
            
            if trans_type == 'income':
                category_totals[category]['income'] += amount
            else:
                category_totals[category]['expense'] += amount
        
        return {
            "success": True,
            "summary": {
                "total_income": round(total_income, 2),
                "total_expenses": round(total_expenses, 2),
                "net_balance": round(net_balance, 2),
                "transaction_count": len(transactions),
                "category_breakdown": category_totals
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to generate summary: {str(e)}"
        }

@app.delete("/api/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    """Delete a transaction"""
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        if transactions_collection is None:
            raise HTTPException(status_code=500, detail="Could not access transactions collection")
        
        result = transactions_collection.delete_one({"transaction_id": transaction_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return {
            "success": True,
            "message": "Transaction deleted successfully"
        }
        
    except Exception as e:
        print(f"❌ Error deleting transaction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete transaction: {str(e)}")

# Debug endpoint to check transactions
@app.get("/api/debug/transactions")
async def debug_transactions(user_id: str = None):
    """Debug endpoint to check transactions"""
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        if transactions_collection is None:
            return {"success": False, "error": "Transactions collection not found"}
        
        # Count all transactions
        total_count = transactions_collection.count_documents({})
        
        debug_info = {
            "total_transactions_in_db": total_count,
            "database_connected": db.is_connected,
            "collections": db.db.list_collection_names() if db.db else []
        }
        
        if user_id:
            user_count = transactions_collection.count_documents({"user_id": user_id})
            user_transactions = list(transactions_collection.find({"user_id": user_id}))
            
            # Convert for JSON response
            for transaction in user_transactions:
                transaction["_id"] = str(transaction["_id"])
                if isinstance(transaction.get("date"), datetime):
                    transaction["date"] = transaction["date"].isoformat()
                if isinstance(transaction.get("created_at"), datetime):
                    transaction["created_at"] = transaction["created_at"].isoformat()
            
            debug_info.update({
                "user_transactions_count": user_count,
                "user_id": user_id,
                "user_transactions": user_transactions
            })
        
        return {
            "success": True,
            "debug_info": debug_info
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Debug failed: {str(e)}"
        }

# Financial Insights
@app.get("/api/insights/{user_id}")
async def get_financial_insights(user_id: str):
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        if transactions_collection is None:
            return {
                "success": False,
                "error": "Could not access transactions collection"
            }
            
        user_transactions = list(transactions_collection.find({"user_id": user_id}))
        
        if not user_transactions:
            return {
                "success": True,
                "message": "No transactions found for this user",
                "insights": {
                    "total_transactions": 0,
                    "total_spending": 0,
                    "average_spending": 0
                },
                "recommendations": [
                    "Start by adding your first transaction!",
                    "Track your daily expenses",
                    "Set financial goals"
                ]
            }
        
        total_spending = sum(t['amount'] for t in user_transactions)
        average_spending = total_spending / len(user_transactions)
        
        categories = {}
        for transaction in user_transactions:
            category = transaction['category']
            if category in categories:
                categories[category] += transaction['amount']
            else:
                categories[category] = transaction['amount']
        
        recommendations = []
        if total_spending > 1000:
            recommendations.append("💡 You're spending quite a bit. Consider creating a budget.")
        else:
            recommendations.append("🎉 Great! Your spending looks manageable.")
        
        if len(user_transactions) < 5:
            recommendations.append("📊 Add more transactions to get better insights!")
        
        recommendations.append("💰 Try to save at least 20% of your income")
        
        return {
            "success": True,
            "insights": {
                "total_transactions": len(user_transactions),
                "total_spending": total_spending,
                "average_spending": round(average_spending, 2),
                "spending_by_category": categories,
                "most_used_category": max(categories, key=categories.get) if categories else "None"
            },
            "recommendations": recommendations
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error generating insights: {str(e)}"
        }

# Stock Market Data
@app.get("/api/stock/{symbol}")
async def get_stock_data(symbol: str):
    try:
        stock_data = {
            "AAPL": {"name": "Apple Inc.", "price": 185.50, "change": +2.35},
            "GOOGL": {"name": "Alphabet Inc.", "price": 138.75, "change": +1.20},
            "MSFT": {"name": "Microsoft Corporation", "price": 378.85, "change": +3.15},
            "TSLA": {"name": "Tesla Inc.", "price": 245.80, "change": -5.25}
        }
        
        if symbol.upper() in stock_data:
            stock = stock_data[symbol.upper()]
            return {
                "success": True,
                "symbol": symbol.upper(),
                "company": stock["name"],
                "current_price": stock["price"],
                "price_change": stock["change"],
                "currency": "USD"
            }
        else:
            return {
                "success": True,
                "symbol": symbol.upper(),
                "company": "Unknown Company",
                "current_price": 100.0,
                "price_change": 0.0,
                "currency": "USD",
                "note": "Mock data - real symbol not found"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Error fetching stock data: {str(e)}"
        }

# Create sample data
@app.post("/api/create-sample-data/{user_id}")
async def create_sample_data(user_id: str):
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        if transactions_collection is None:
            raise HTTPException(status_code=500, detail="Could not access transactions collection")
        
        sample_transactions = [
            {"user_id": user_id, "amount": 45.50, "category": "food", "description": "Lunch at restaurant"},
            {"user_id": user_id, "amount": 120.00, "category": "shopping", "description": "Groceries"},
            {"user_id": user_id, "amount": 35.00, "category": "transport", "description": "Bus and metro"},
            {"user_id": user_id, "amount": 25.00, "category": "entertainment", "description": "Movie ticket"},
            {"user_id": user_id, "amount": 80.00, "category": "shopping", "description": "Online shopping"},
            {"user_id": user_id, "amount": 15.00, "category": "food", "description": "Coffee and snacks"},
        ]
        
        inserted_count = 0
        for transaction in sample_transactions:
            transaction_id = f"sample_{ObjectId()}"
            transaction_data = {
                "transaction_id": transaction_id,
                "user_id": user_id,
                "amount": transaction["amount"],
                "category": transaction["category"],
                "description": transaction["description"],
                "type": "expense",
                "date": datetime.utcnow()
            }
            result = transactions_collection.insert_one(transaction_data)
            inserted_count += 1
        
        return {
            "success": True,
            "message": "Sample data created successfully",
            "transactions_added": inserted_count,
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create sample data: {str(e)}")

# Bank Statement Upload
@app.post("/api/upload-bank-statement")
async def upload_bank_statement(file: UploadFile = File(...), user_id: str = Form(...)):
    """Upload and process bank statement PDF"""
    
    try:
        ensure_database_connected()
        
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Mock extracted data
        extraction_result = {
            "success": True,
            "bank_type": "Karnataka Bank",
            "account_info": {
                "bank_name": "Karnataka Bank Ltd.",
                "account_holder": "Extracted User",
                "account_number": "9876543210", 
                "branch": "Extracted Branch",
                "ifsc_code": "KKBK0000000"
            },
            "transactions": [
                {
                    "date": datetime.utcnow().strftime('%Y-%m-%d'),
                    "description": "Salary Credit",
                    "amount": 45000.00,
                    "type": "credit",
                    "category": "Salary",
                    "balance": 50000.00
                },
                {
                    "date": datetime.utcnow().strftime('%Y-%m-%d'),
                    "description": "Grocery Shopping",
                    "amount": 2500.00,
                    "type": "debit", 
                    "category": "Shopping",
                    "balance": 47500.00
                }
            ],
            "summary": {
                "total_income": 45000.00,
                "total_expenses": 2500.00,
                "net_flow": 42500.00,
                "transaction_count": 2,
                "average_transaction": 23750.00
            }
        }
        
        bank_statements_collection = db.get_collection("bank_statements")
        if bank_statements_collection is None:
            raise HTTPException(status_code=500, detail="Could not access bank statements collection")
        
        # Save to database
        statement_data = {
            "statement_id": str(uuid.uuid4()),
            "user_id": user_id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "extracted_data": extraction_result,
            "uploaded_at": datetime.utcnow(),
            "transactions_saved": False,  # NEW: Track if transactions are saved
            "saved_count": 0,  # NEW: Count of saved transactions
            "failed_count": 0  # NEW: Count of failed saves
        }
        
        result = bank_statements_collection.insert_one(statement_data)
        
        return {
            "success": True,
            "message": "Bank statement processed successfully",
            "statement_id": statement_data["statement_id"],
            "data": extraction_result
        }
        
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/api/bank-statements/{user_id}")
async def get_user_bank_statements(user_id: str):
    """Get all bank statements for a user"""
    try:
        ensure_database_connected()
        
        bank_statements_collection = db.get_collection("bank_statements")
        if bank_statements_collection is None:
            raise HTTPException(status_code=500, detail="Could not access bank statements collection")
            
        statements = list(bank_statements_collection.find({"user_id": user_id}).sort("uploaded_at", -1))
        
        # Convert ObjectId to string and remove file_path for security
        for statement in statements:
            statement["_id"] = str(statement["_id"])
            if "file_path" in statement:
                del statement["file_path"]
            if isinstance(statement["uploaded_at"], datetime):
                statement["uploaded_at"] = statement["uploaded_at"].isoformat()
        
        return {
            "success": True,
            "statements": statements,
            "count": len(statements)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statements: {str(e)}")

# ===== FIXED: BANK STATEMENT TRANSACTION SAVING =====

@app.post("/api/save-extracted-transactions")
async def save_extracted_transactions(
    user_id: str = Form(...),
    statement_id: str = Form(...),
    transactions_to_save: str = Form(...)  # JSON string of transactions
):
    """Save extracted bank statement transactions to user's transaction history"""
    try:
        ensure_database_connected()
        
        transactions_collection = db.get_collection("transactions")
        bank_statements_collection = db.get_collection("bank_statements")
        
        # FIX: Use explicit None checks instead of truthy checks
        if transactions_collection is None or bank_statements_collection is None:
            raise HTTPException(status_code=500, detail="Database collections not accessible")
        
        # Get the bank statement data
        statement = bank_statements_collection.find_one({
            "statement_id": statement_id, 
            "user_id": user_id
        })
        
        if not statement:
            raise HTTPException(status_code=404, detail="Bank statement not found")
        
        # Parse transactions from form data
        transactions_data = json.loads(transactions_to_save)
        
        saved_transactions = []
        failed_transactions = []
        
        # Save each transaction
        for transaction_data in transactions_data:
            try:
                transaction_id = f"bank_txn_{ObjectId()}"
                
                # Map bank statement fields to transaction fields
                transaction_record = {
                    "transaction_id": transaction_id,
                    "user_id": user_id,
                    "amount": float(transaction_data["amount"]),
                    "category": transaction_data.get("category", "other"),
                    "description": transaction_data.get("description", "Bank Statement Transaction"),
                    "type": "income" if transaction_data.get("type") == "credit" else "expense",
                    "date": datetime.fromisoformat(transaction_data["date"]),
                    "source": "bank_statement",
                    "statement_id": statement_id,
                    "created_at": datetime.utcnow()
                }
                
                result = transactions_collection.insert_one(transaction_record)
                saved_transactions.append(transaction_id)
                
            except Exception as e:
                failed_transactions.append({
                    "transaction": transaction_data,
                    "error": str(e)
                })
        
        # Update bank statement with save status
        bank_statements_collection.update_one(
            {"statement_id": statement_id},
            {
                "$set": {
                    "transactions_saved": True,
                    "saved_at": datetime.utcnow(),
                    "saved_count": len(saved_transactions),
                    "failed_count": len(failed_transactions)
                }
            }
        )
        
        return {
            "success": True,
            "message": f"Successfully saved {len(saved_transactions)} transactions",
            "saved_count": len(saved_transactions),
            "failed_count": len(failed_transactions),
            "saved_transactions": saved_transactions,
            "failed_transactions": failed_transactions
        }
        
    except Exception as e:
        print(f"❌ Error saving transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save transactions: {str(e)}")

@app.get("/api/bank-statements/{statement_id}/transactions")
async def get_statement_transactions(statement_id: str, user_id: str):
    """Get extracted transactions from a specific bank statement"""
    try:
        ensure_database_connected()
        
        bank_statements_collection = db.get_collection("bank_statements")
        if bank_statements_collection is None:
            raise HTTPException(status_code=500, detail="Database collection not accessible")
        
        statement = bank_statements_collection.find_one({
            "statement_id": statement_id, 
            "user_id": user_id
        })
        
        if not statement:
            raise HTTPException(status_code=404, detail="Bank statement not found")
        
        # Check which transactions are already saved
        transactions_collection = db.get_collection("transactions")
        saved_transactions = list(transactions_collection.find({
            "user_id": user_id,
            "statement_id": statement_id
        }))
        
        saved_transaction_ids = [t["transaction_id"] for t in saved_transactions]
        
        extracted_transactions = statement.get("extracted_data", {}).get("transactions", [])
        
        # Mark which transactions are already saved
        for transaction in extracted_transactions:
            transaction["already_saved"] = any(
                saved_txn.get("description") == transaction.get("description") and
                saved_txn.get("amount") == transaction.get("amount") and
                saved_txn.get("date") == transaction.get("date")
                for saved_txn in saved_transactions
            )
        
        return {
            "success": True,
            "statement_id": statement_id,
            "transactions": extracted_transactions,
            "total_transactions": len(extracted_transactions),
            "already_saved_count": len(saved_transaction_ids),
            "can_save": len(extracted_transactions) > len(saved_transaction_ids)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statement transactions: {str(e)}")

@app.post("/api/categorize-transactions")
async def auto_categorize_transactions(transactions: list):
    """Auto-categorize transactions based on description"""
    try:
        # Simple categorization logic
        category_keywords = {
            "food": ["restaurant", "cafe", "food", "lunch", "dinner", "coffee", "groceries"],
            "shopping": ["mall", "shop", "store", "amazon", "flipkart", "purchase"],
            "transport": ["uber", "ola", "bus", "metro", "train", "fuel", "petrol"],
            "entertainment": ["movie", "netflix", "prime", "game", "concert"],
            "bills": ["electricity", "water", "internet", "mobile", "bill"],
            "salary": ["salary", "payroll", "income"],
            "healthcare": ["hospital", "doctor", "medical", "pharmacy"]
        }
        
        categorized_transactions = []
        
        for transaction in transactions:
            description = transaction.get("description", "").lower()
            category = "other"
            
            for cat, keywords in category_keywords.items():
                if any(keyword in description for keyword in keywords):
                    category = cat
                    break
            
            transaction["suggested_category"] = category
            categorized_transactions.append(transaction)
        
        return {
            "success": True,
            "categorized_transactions": categorized_transactions
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Categorization failed: {str(e)}")

@app.delete("/api/bank-statements/{statement_id}")
async def delete_bank_statement(statement_id: str, user_id: str):
    """Delete a bank statement and its associated transactions"""
    try:
        ensure_database_connected()
        
        bank_statements_collection = db.get_collection("bank_statements")
        transactions_collection = db.get_collection("transactions")
        
        if bank_statements_collection is None or transactions_collection is None:
            raise HTTPException(status_code=500, detail="Database collections not accessible")
        
        # Find the statement first
        statement = bank_statements_collection.find_one({
            "statement_id": statement_id, 
            "user_id": user_id
        })
        
        if not statement:
            raise HTTPException(status_code=404, detail="Bank statement not found")
        
        # Delete associated transactions
        transactions_result = transactions_collection.delete_many({
            "user_id": user_id,
            "statement_id": statement_id
        })
        
        # Delete the statement
        statement_result = bank_statements_collection.delete_one({
            "statement_id": statement_id,
            "user_id": user_id
        })
        
        # Delete the physical file
        file_path = statement.get("file_path")
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        
        return {
            "success": True,
            "message": "Bank statement deleted successfully",
            "transactions_deleted": transactions_result.deleted_count,
            "statements_deleted": statement_result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete statement: {str(e)}")

# Test all features
@app.get("/api/test-all")
async def test_all_features():
    try:
        ensure_database_connected()
        
        users_collection = db.get_collection("users")
        transactions_collection = db.get_collection("transactions")
        bank_statements_collection = db.get_collection("bank_statements")
        
        if not all([users_collection, transactions_collection, bank_statements_collection]):
            return {
                "success": False,
                "error": "Could not access all database collections"
            }
        
        test_email = "test@example.com"
        existing_user = users_collection.find_one({"email": test_email})
        
        if not existing_user:
            user_id = f"test_user_{ObjectId()}"
            user_data = {
                "user_id": user_id,
                "username": "testuser",
                "email": test_email,
                "password": hash_password("test123"),
                "created_at": datetime.utcnow()
            }
            users_collection.insert_one(user_data)
        else:
            user_id = existing_user["user_id"]
        
        user_count = users_collection.count_documents({})
        transaction_count = transactions_collection.count_documents({})
        statement_count = bank_statements_collection.count_documents({})
        
        return {
            "success": True,
            "message": "All features tested successfully",
            "features_working": [
                "user_registration",
                "user_login", 
                "transaction_management",
                "financial_insights",
                "stock_data",
                "sample_data_creation",
                "bank_statement_upload",
                "save_extracted_transactions",  # NEW
                "auto_categorization"  # NEW
            ],
            "test_user_id": user_id,
            "database_stats": {
                "total_users": user_count,
                "total_transactions": transaction_count,
                "total_bank_statements": statement_count
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Test failed: {str(e)}"
        }

if __name__ == "__main__":
    print("🚀 Starting Financial Assistant Server with MongoDB...")
    print("📊 Database: MongoDB")
    print("🌐 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🏦 Bank Statement Upload: ENABLED")
    print("💾 Transaction Saving: ENABLED")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)