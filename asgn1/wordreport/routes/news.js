const express = require('express');
const https = require('https');
const router = express.Router();

const fs = require('fs');

// Create the webpage
router.get('/:query', (req, res) => {

    const options = createNewsOptions(encodeURI(req.params.query));

    const newsReq = https.request(options, (newsRes) => {

        let body = [];
        newsRes.on('data', function (chunk) {
            body.push(chunk);
        });

        newsRes.on('end', function () {

            const bodyString = body.join('');

            // Acquire JSON data
            const jsonContent = JSON.parse(bodyString);

            // Parse data
            parseNews(jsonContent);

            // Give at least 0.5 seconds to render data
            setTimeout(() => {
                // Render page and data in PUG
                res.render('newsfeed', {
                    title: "WordReport Search: " + req.params.query,
                    term: req.params.query,
                    quantity: jsonContent.articles.length,
                });

            }, 500)
        });
    });

    newsReq.on('error', (e) => {
        console.error(e);
    });

    newsReq.end();
});

// Access to NewsAPI
function createNewsOptions(query) {
    const news = "https://newsapi.org/v2/everything?q=" + query + "&apiKey=65c047dcacd646139dbb5fa37b5aa46d";
    return news;
}

function parseNews(data) {

    let s = '';
    let news = data.articles;

    for (let i in news) {
        s += `
                <h3><a href = "${news[i].url}"><b>${news[i].title}</b></a></h3>
                <p>${news[i].source.name}</p>
                <p>${news[i].description}</p>
                <div class = "container">
                    <a href = "${news[i].url}"> <img alt = "${news[i].title}" src = "${news[i].urlToImage}"/></a>
                </div>
                <p>Published at: ${news[i].publishedAt}</p>
                <hr>
            `;
    }

    // Write data for HTML. 
    fs.writeFile('./views/html/news.html', s, (err) => {

        // In case of a error throw err. 
        if (err) throw err;
    })

    return s;
}

module.exports = router;