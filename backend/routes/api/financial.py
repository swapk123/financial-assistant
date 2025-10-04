from fastapi import APIRouter, HTTPException
from models.financial.models import TransactionCreate, TransactionResponse, FinancialGoal, Budget
from database.mongodb import db
from utils.ai.financial_ai import financial_ai
from datetime import datetime
import yfinance as yf

router = APIRouter()

@router.post("/transactions")
async def create_transaction(transaction: TransactionCreate):
    transaction_data = {
        "user_id": transaction.user_id,
        "amount": transaction.amount,
        "category": transaction.category,
        "description": transaction.description,
        "type": transaction.type,
        "date": datetime.utcnow()
    }
    
    result = db.get_collection("transactions").insert_one(transaction_data)
    
    return {
        "message": "Transaction created successfully",
        "transaction_id": str(result.inserted_id)
    }

@router.get("/transactions/{user_id}")
async def get_user_transactions(user_id: str):
    transactions = list(db.get_collection("transactions").find({"user_id": user_id}))
    
    # Convert ObjectId to string
    for transaction in transactions:
        transaction["_id"] = str(transaction["_id"])
    
    return {"transactions": transactions}

@router.get("/financial-insights/{user_id}")
async def get_financial_insights(user_id: str):
    # Get user transactions
    transactions = list(db.get_collection("transactions").find({"user_id": user_id}))
    
    # Analyze spending
    analysis = financial_ai.analyze_spending(transactions)
    
    # Generate recommendations
    recommendations = financial_ai.generate_recommendations(analysis)
    
    return {
        "analysis": analysis,
        "recommendations": recommendations,
        "total_transactions": len(transactions)
    }

@router.get("/stock/{symbol}")
async def get_stock_data(symbol: str):
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        hist = stock.history(period="1mo")
        
        return {
            "symbol": symbol,
            "company": info.get('longName', 'Unknown'),
            "current_price": info.get('currentPrice', 0),
            "currency": info.get('currency', 'USD'),
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching stock data: {str(e)}")