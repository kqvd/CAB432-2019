const express = require('express');
const path = require("path");

// Route paths
const newsRouter = require('./routes/news');
const wordsRouter = require('./routes/words');

// Initialise app
const app = express();
const port = 80;

// View PUG files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Setup directory for static files
app.use(express.static(path.join(__dirname, "public")));

// Homepage
app.get('/', function (req, res) {
    res.render('index', {
        title: "WordReport - Newsworthy Words"
    });
});

// Body Parse
app.use(express.urlencoded({
    extended: true
}));

// POST country submission
app.post('/submit', (req, res) => {
    const country = req.body.myCountry;

    res.redirect('/words/' + country);
})

// Page URL parameters
app.use('/words', wordsRouter);
app.use('/search', newsRouter);

// Listen to server
app.listen(port, function () {
    console.log(`Express app listening at port ${port}`);
});