import pandas as pd
import numpy as np
from datetime import datetime

class FinancialAI:
    def analyze_spending(self, transactions):
        """Analyze spending patterns"""
        if not transactions:
            return {"message": "No transactions to analyze"}
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(transactions)
        
        # Basic analysis
        total_income = df[df['type'] == 'income']['amount'].sum()
        total_expenses = df[df['type'] == 'expense']['amount'].sum()
        net_flow = total_income - total_expenses
        
        # Category analysis
        expense_by_category = df[df['type'] == 'expense'].groupby('category')['amount'].sum().to_dict()
        
        return {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_cash_flow": net_flow,
            "expense_by_category": expense_by_category,
            "savings_rate": (net_flow / total_income * 100) if total_income > 0 else 0
        }
    
    def generate_recommendations(self, financial_data):
        """Generate financial recommendations"""
        recommendations = []
        
        savings_rate = financial_data.get('savings_rate', 0)
        expenses = financial_data.get('total_expenses', 0)
        income = financial_data.get('total_income', 0)
        
        if savings_rate < 20:
            recommendations.append("💡 Try to save at least 20% of your income")
        
        if expenses > income * 0.7:
            recommendations.append("⚠️ Your expenses are high. Consider creating a budget")
        
        if len(recommendations) == 0:
            recommendations.append("🎉 Great job! Your finances look healthy")
        
        return recommendations

# Create global AI instance
financial_ai = FinancialAI()