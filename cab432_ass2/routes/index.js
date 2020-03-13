const express = require('express');
const search = require('./search');
const summary = require('./summary');

const router = express.Router();

router.get('/', (req, res) => 
{
  res.render('index', {title: 'Twitter Query Processor'});
});

router.use('/search?', search);
router.use('/summary?', summary);

module.exports = router;