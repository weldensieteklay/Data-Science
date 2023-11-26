const express = require('express');
const cors = require('cors')
const db = require('./db/db')
require('dotenv').config({ path: './config/config.env' })
const routes = require('./routes/routes');

const app = express();


app.use(express.json());

app.use(cors())
app.use(routes);

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