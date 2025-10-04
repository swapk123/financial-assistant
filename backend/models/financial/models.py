from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TransactionBase(BaseModel):
    amount: float
    category: str
    description: str
    type: str  # 'income' or 'expense'

class TransactionCreate(TransactionBase):
    user_id: str

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    date: datetime
    
    class Config:
        from_attributes = True

class FinancialGoal(BaseModel):
    name: str
    target_amount: float
    current_amount: float
    target_date: str
    category: str

class Budget(BaseModel):
    category: str
    allocated_amount: float
    spent_amount: float = 0.0
    month: str