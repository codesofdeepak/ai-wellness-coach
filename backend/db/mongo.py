from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise Exception("❌ MONGO_URI not found")

client = MongoClient(MONGO_URI)

db = client["ai_wellness"]

users_col = db["users"]
nutrition_col = db["nutrition_logs"]
exercise_col = db["exercise_logs"]
diet_col = db["diet_logs"]

print("✅ MongoDB connected")
