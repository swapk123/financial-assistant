from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
    
    def connect(self):
        """Connect to MongoDB database"""
        try:
            # Use MONGODB_URI (not MONGODB_URL) to match your environment variable
            self.client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
            
            # Test the connection
            self.client.admin.command('ping')
            
            self.db = self.client[os.getenv("DATABASE_NAME", "financial_assistant")]
            self.is_connected = True
            print("✅ MongoDB Connected Successfully!")
            return True
        except Exception as e:
            print(f"❌ MongoDB Connection Failed: {e}")
            self.is_connected = False
            return False
    
    def get_collection(self, collection_name):
        """Get a collection from database"""
        # FIX: Check if db is not None instead of using truth value testing
        if self.is_connected and self.db is not None:
            return self.db[collection_name]
        else:
            print("⚠️ Database not connected")
            return None
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            self.is_connected = False
            self.db = None
            print("🔌 Database connection closed")

# Create a global database instance
db = Database()