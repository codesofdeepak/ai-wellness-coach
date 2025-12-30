from db.mongo import users_col

users_col.insert_one({
    "test": "MongoDB connection successful"
})

print("🎉 MongoDB test insert done")
