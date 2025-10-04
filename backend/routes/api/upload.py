from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
import os
import shutil
from datetime import datetime
import uuid
import tempfile

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Simple in-memory storage for bank statements
bank_statements_db = []

@router.post("/upload-bank-statement")
async def upload_bank_statement(
    file: UploadFile = File(...), 
    user_id: str = Form(...)
):
    """Upload and process bank statement PDF"""
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # For now, return mock data - you can integrate your actual PDF parser here
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
                },
                {
                    "date": datetime.utcnow().strftime('%Y-%m-%d'),
                    "description": "Electricity Bill",
                    "amount": 1500.00,
                    "type": "debit",
                    "category": "Utilities", 
                    "balance": 46000.00
                }
            ],
            "summary": {
                "total_income": 45000.00,
                "total_expenses": 4000.00,
                "net_flow": 41000.00,
                "transaction_count": 3,
                "average_transaction": 16333.33
            }
        }
        
        # Save to database
        statement_data = {
            "user_id": user_id,
            "filename": unique_filename,
            "original_filename": file.filename,
            "file_path": file_path,
            "extracted_data": extraction_result,
            "uploaded_at": datetime.utcnow().isoformat(),
            "statement_id": str(uuid.uuid4())
        }
        
        bank_statements_db.append(statement_data)
        
        return JSONResponse({
            "success": True,
            "message": "Bank statement processed successfully",
            "statement_id": statement_data["statement_id"],
            "data": extraction_result
        })
        
    except Exception as e:
        # Clean up file in case of error
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.get("/bank-statements/{user_id}")
async def get_user_bank_statements(user_id: str):
    """Get all bank statements for a user"""
    try:
        user_statements = [s for s in bank_statements_db if s["user_id"] == user_id]
        
        # Remove file_path for security
        for statement in user_statements:
            if "file_path" in statement:
                del statement["file_path"]
        
        return {
            "success": True,
            "statements": user_statements,
            "count": len(user_statements)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statements: {str(e)}")

@router.get("/bank-statement/{statement_id}")
async def get_bank_statement(statement_id: str):
    """Get specific bank statement data"""
    try:
        statement = next((s for s in bank_statements_db if s["statement_id"] == statement_id), None)
        
        if not statement:
            raise HTTPException(status_code=404, detail="Statement not found")
        
        if "file_path" in statement:
            del statement["file_path"]
        
        return {
            "success": True,
            "statement": statement
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statement: {str(e)}")