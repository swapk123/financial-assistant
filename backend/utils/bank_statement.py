import os
import re
import tempfile
import traceback
from datetime import datetime
import PyPDF2
from typing import Dict, List, Optional

class BankExtractor:
    def __init__(self):
        self.supported_banks = ['Karnataka Bank', 'HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank']
    
    def extract_from_pdf(self, pdf_path: str) -> Dict:
        """
        Main method to extract data from bank statement PDF
        """
        try:
            print(f"🔍 Starting PDF extraction: {pdf_path}")
            
            # Extract text from PDF
            text = self.extract_text_from_pdf(pdf_path)
            if not text:
                return {"error": "Could not extract text from PDF"}
            
            # Detect bank type and parse accordingly
            bank_type = self.detect_bank_type(text)
            print(f"🏦 Detected bank: {bank_type}")
            
            if 'Karnataka' in bank_type:
                parsed_data = self.parse_karnataka_bank(text)
            else:
                parsed_data = self.parse_generic_bank(text)
            
            if parsed_data:
                return {
                    "success": True,
                    "bank_type": bank_type,
                    **parsed_data
                }
            else:
                return {"error": "Could not parse bank statement"}
                
        except Exception as e:
            print(f"❌ PDF extraction error: {e}")
            return {"error": f"Extraction failed: {str(e)}"}
    
    def extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """
        Extract text from PDF file
        """
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page_num, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    text += page_text + "\n"
                
                return text if text.strip() else None
        except Exception as e:
            print(f"❌ PDF text extraction failed: {e}")
            return None
    
    def detect_bank_type(self, text: str) -> str:
        """
        Detect the bank type from text content
        """
        text_upper = text.upper()
        
        if 'KARNATAKA BANK' in text_upper:
            return 'Karnataka Bank'
        elif 'HDFC' in text_upper:
            return 'HDFC Bank'
        elif 'ICICI' in text_upper:
            return 'ICICI Bank'
        elif 'STATE BANK OF INDIA' in text_upper or 'SBI' in text_upper:
            return 'SBI'
        elif 'AXIS BANK' in text_upper:
            return 'Axis Bank'
        else:
            return 'Generic Bank'
    
    def parse_karnataka_bank(self, text: str) -> Optional[Dict]:
        """
        Parse Karnataka Bank specific format
        """
        try:
            # Extract account information
            account_info = self.extract_karnataka_account_info(text)
            
            # Extract transactions
            transactions = self.extract_karnataka_transactions(text)
            
            # Generate summary
            summary = self.generate_summary(transactions)
            
            return {
                'account_info': account_info,
                'transactions': transactions,
                'summary': summary
            }
            
        except Exception as e:
            print(f"❌ Karnataka Bank parsing error: {e}")
            return None
    
    def extract_karnataka_account_info(self, text: str) -> Dict:
        """
        Extract account information from Karnataka Bank statement
        """
        info = {
            'bank_name': 'Karnataka Bank Ltd.',
            'account_holder': 'Unknown',
            'account_number': 'Unknown',
            'branch': 'Unknown',
            'ifsc_code': 'Unknown',
            'address': 'Unknown'
        }
        
        try:
            # Extract account number
            acc_match = re.search(r'account number\s+(\d+)', text, re.IGNORECASE)
            if acc_match:
                info['account_number'] = acc_match.group(1)
            
            # Extract account holder name
            name_match = re.search(r'Name\s+([A-Z][A-Z\s]+\b)(?=\s+Address)', text)
            if name_match:
                info['account_holder'] = name_match.group(1).strip()
            
            # Extract branch information
            branch_match = re.search(r'Branch Name\s+([A-Z][A-Z\s]+\b)', text)
            if branch_match:
                info['branch'] = branch_match.group(1).strip()
            
            return info
            
        except Exception as e:
            print(f"⚠️ Error extracting account info: {e}")
            return info
    
    def extract_karnataka_transactions(self, text: str) -> List[Dict]:
        """
        Extract transactions from Karnataka Bank statement
        """
        transactions = []
        
        try:
            lines = text.split('\n')
            in_transaction_section = False
            balance = 0.0
            
            for i, line in enumerate(lines):
                line = line.strip()
                
                # Find opening balance to start transaction section
                if 'Opening Balance' in line:
                    in_transaction_section = True
                    balance_match = re.search(r'([\d,]+\.\d{2})\s*$', line)
                    if balance_match:
                        balance = float(balance_match.group(1).replace(',', ''))
                    continue
                
                if in_transaction_section:
                    # Skip header lines and empty lines
                    if (not line or 
                        'Particulars' in line or 
                        'Withdrawals' in line or 
                        'Deposits' in line or
                        'Balance' in line):
                        continue
                    
                    # Stop at closing balance
                    if 'Closing Balance' in line:
                        break
                    
                    # Parse transaction line
                    transaction = self.parse_karnataka_transaction_line(line, balance)
                    if transaction:
                        transactions.append(transaction)
                        balance = transaction['balance']
            
            return transactions
            
        except Exception as e:
            print(f"❌ Transaction extraction error: {e}")
            return []
    
    def parse_karnataka_transaction_line(self, line: str, current_balance: float) -> Optional[Dict]:
        """
        Parse individual transaction line for Karnataka Bank
        """
        try:
            line = re.sub(r'\s+', ' ', line).strip()
            amounts = re.findall(r'([\d,]+\.\d{2})', line)
            
            if not amounts:
                return None
            
            transaction = {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'description': 'Bank Transaction',
                'category': 'General'
            }
            
            if len(amounts) >= 3:
                # Third amount is likely the new balance
                new_balance = float(amounts[2].replace(',', ''))
                amount1 = float(amounts[0].replace(',', ''))
                amount2 = float(amounts[1].replace(',', ''))
                
                # Determine if it's deposit or withdrawal based on balance change
                if new_balance > current_balance:
                    transaction['amount'] = amount2 if amount2 > 0 else amount1
                    transaction['type'] = 'credit'
                else:
                    transaction['amount'] = amount1 if amount1 > 0 else amount2
                    transaction['type'] = 'debit'
                
                transaction['balance'] = new_balance
                
                # Add category based on type
                if transaction.get('type') == 'credit':
                    transaction['category'] = 'Deposit'
                else:
                    transaction['category'] = 'Withdrawal'
                
                return transaction
            
            return None
            
        except Exception as e:
            print(f"⚠️ Error parsing transaction line: {e}")
            return None
    
    def parse_generic_bank(self, text: str) -> Dict:
        """
        Fallback parser for generic bank statements
        """
        amounts = re.findall(r'(\d+,\d+\.\d{2}|\d+\.\d{2})', text)
        
        transactions = []
        balance = 0
        
        for i, amount_str in enumerate(amounts[:10]):
            try:
                amount = float(amount_str.replace(',', ''))
                if amount >= 1:
                    transaction = {
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'description': f'Transaction {i+1}',
                        'amount': amount,
                        'type': 'credit' if i % 2 == 0 else 'debit',
                        'category': 'Bank Transaction',
                        'balance': balance + (amount if i % 2 == 0 else -amount)
                    }
                    transactions.append(transaction)
                    balance = transaction['balance']
            except ValueError:
                continue
        
        return {
            'account_info': {
                'bank_name': 'Generic Bank',
                'account_holder': 'Extracted from PDF',
                'account_number': 'N/A'
            },
            'transactions': transactions,
            'summary': self.generate_summary(transactions)
        }
    
    def generate_summary(self, transactions: List[Dict]) -> Dict:
        """
        Generate financial summary from transactions
        """
        total_income = sum(t['amount'] for t in transactions if t.get('type') == 'credit')
        total_expenses = sum(t['amount'] for t in transactions if t.get('type') == 'debit')
        
        return {
            'total_income': round(total_income, 2),
            'total_expenses': round(total_expenses, 2),
            'net_flow': round(total_income - total_expenses, 2),
            'transaction_count': len(transactions),
            'average_transaction': round((total_income + total_expenses) / len(transactions), 2) if transactions else 0
        }

# Create global instance
bank_extractor = BankExtractor()