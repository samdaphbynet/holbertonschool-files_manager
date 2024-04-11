import bodyParser from 'body-parser';

const express = require('express');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

const routes = require('./routes/index');

const PORT = process.env.PORT || 5000;

app.use('/', routes);

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
