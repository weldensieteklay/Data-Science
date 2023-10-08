const express = require('express');
const cors = require('cors')
const bodyParser = require('body-parser');


const db = require('./db/db')
require('dotenv').config({ path: './config/config.env' })
const userRoutes = require('./routes/routes');

const app = express();


app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors())
app.use(userRoutes);

const PORT = process.env.PORT || 5000;
// connecting to mongodb 
db.connectTodb()
  .then(() => {
    app.listen(PORT, function () {
      console.log(`Listening port ${PORT}`)
    });
  })
  .catch((err) => {
    console.log('Error', err);
  })


  module.exports = app