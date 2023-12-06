# const mongoose = require('mongoose')

# // connecting to mongodb 
# exports.connectTodb = () => {
#     return new Promise((resolve, reject) => {
#             mongoose.connect(process.env.mongoURI, { useUnifiedTopology: true, useNewUrlParser: true })
#                 .then((res, err) => {
#                     if (err) return reject(err)
#                     resolve()
#                 })
    
#     })


# }

# exports.close = () => {
#     return mongoose.disconnect()
# }

import os
from pymongo import MongoClient

def connect_to_db():
    try:
         # Connect to MongoDB using the provided URI
        mongo_uri = os.environ.get('mongoURI') 
        db = MongoClient(mongo_uri)
        print("Connected to MongoDB")
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e

def close_connection(client):
    try:
        # Close the MongoDB connection
        client.close()
        print("Connection to MongoDB closed")
    except Exception as e:
        print(f"Error closing MongoDB connection: {e}")
        raise e


