const express = require('express');
const helmet = require('helmet');
const logger = require('morgan');
const path = require('path');
const router = require('./routes/index');
const bodyParser = require('body-parser');
const responseTime = require('response-time');

const app = express();

app.use(logger('tiny'));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(responseTime());

app.use(express.static('public'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use('/', router);

module.exports = app;