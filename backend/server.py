# const express = require('express');
# const cors = require('cors')
# const db = require('./db/db')
# require('dotenv').config({ path: './config/config.env' })
# const routes = require('./routes/routes');

# const app = express();


# app.use(express.json());

# app.use(cors())
# app.use(routes);

# const PORT = process.env.PORT || 5000;
# // connecting to mongodb 
# db.connectTodb()
#   .then(() => {
#     app.listen(PORT, function () {
#       console.log(`Listening port ${PORT}`)
#     });
#   })
#   .catch((err) => {
#     console.log('Error', err);
#   })


#   module.exports = app

from flask import Flask
from flask_cors import CORS
from routes.routes import routes
from db.db import connect_to_db, close_connection

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Use the routes defined in routes.py
app.register_blueprint(routes)

# Connect to MongoDB when the application starts
db_client = connect_to_db()

@app.route('/')
def home():
    return 'Hello, this is your Flask app!'

if __name__ == '__main__':
    # Start the Flask app
    app.run(debug=True, port=5000)

# Close the MongoDB connection when the application exits
close_connection(db_client)
