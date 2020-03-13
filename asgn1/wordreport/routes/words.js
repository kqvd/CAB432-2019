const express = require('express');
const https = require('https');
const router = express.Router();

const fs = require('fs');

// Create the webpage
router.get('/:query', (req, res) => {

    // Abort request for incorrect search
    if (req.params.query === 'cn') {

        res.render('error', {
            title: "WordReport - Invalid search",
            message: "Invalid search result: (non-Unicode characters).",
        });

        res.end();
    } else {

        // Remove old URLs
        if (fs.existsSync("./public/json/urls.json")) fs.unlinkSync("./public/json/urls.json");

        //#1: Fetch URLs
        const options = createNewsOptions(req.params.query);

        const newsReq = https.request(options, function (newsRes) {

            const chunks = [];

            newsRes.on("data", function (chunk) {
                chunks.push(chunk);
            });

            newsRes.on("end", function () {
                const body = Buffer.concat(chunks);
                jsonContent = JSON.parse(body.toString());
                // URLS
                var input_data = [];
                for (i = 0; i < jsonContent.articles.length; i++) {
                    input_data[i] = jsonContent.articles[i].url;
                }

                var obj = {
                    'input_data': input_data,
                    'input_type': 'url',
                    'N': 10
                };

                // Wait at least 1 second to clear old URL and write new ones
                setTimeout(() => {

                    fs.writeFile("./public/json/urls.json", JSON.stringify(obj, null, 4), function (err) {
                        if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                        }
                    });

                }, 1000)
            });
        });

        newsReq.end();

        //#2: Produce keywords and make page

        // Wait at least 3 seconds to generate new URLs
        setTimeout(() => {

            // If URLs aren't retrieved on time, cancel request
            if (fs.existsSync("./public/json/urls.json")) {
                // The URL is Updated
            } else {

                res.render('error', {
                    title: "WordReport - Error",
                    message: "Sorry: we could not fetch your keywords at this time. Please try again later.",
                });

                res.end();
            }

            const wordsReq = https.request(keywords, function (wordsRes) {

                const chunks = [];

                wordsRes.on("data", function (chunk) {
                    chunks.push(chunk);
                });

                wordsRes.on("end", function () {
                    const body = Buffer.concat(chunks);
                    jsonContent = JSON.parse(body.toString());

                    fs.writeFile("./public/json/words.json", JSON.stringify(jsonContent, null, 4), function (err) {
                        if (err) {
                            console.log("An error occured while writing JSON Object to File.");
                            return console.log(err);
                        }

                        if (jsonContent !== null || jsonContent !== undefined) {

                            // Fetch country abbreviation
                            const country = req.params.query;

                            // Parse data
                            parseKeywords(jsonContent);

                            // Give at least 0.5 seconds to render data HTML
                            setTimeout(() => {
                                // Render page using PUG and pass data
                                res.render('keywords', {
                                    title: "WordReport Search: " + country,
                                    abbreviation: country,
                                });

                                res.end();

                            }, 500)
                        }
                    });
                });
            });

            // Retrieve URLS to input
            let file = fs.readFileSync("./public/json/urls.json");
            let input = JSON.parse(file);

            wordsReq.write(JSON.stringify(input));

            wordsReq.end();

        }, 3000)
    }
});

// Access to NewsAPI
function createNewsOptions(query) {

    let news = "";

    // If query is a category
    if (query.length > 2) {

        news = "https://newsapi.org/v2/top-headlines?country=au&category=" + query + "&apiKey=65c047dcacd646139dbb5fa37b5aa46d";

    } else if (query.length == 2) {

        news = "https://newsapi.org/v2/top-headlines?country=" + query + "&apiKey=65c047dcacd646139dbb5fa37b5aa46d";
    }

    return news;
}

// Access to Keyword Extraction API
const keywords = {
    "method": "POST",
    "hostname": "unfound-keywords-extraction-v1.p.rapidapi.com",
    "port": null,
    "path": "/extraction/keywords",
    "headers": {
        "x-rapidapi-host": "unfound-keywords-extraction-v1.p.rapidapi.com",
        "x-rapidapi-key": "b96ba1a2ffmsh937cc882293811bp1fb282jsn2540353430e1",
        "content-type": "application/json",
        "accept": "application/json"
    }
};

// Extract keywords in JSON
function parseKeywords(data) {

    let s = '';

    for (let i = 0; i < data.result.length; i++) {
        s += `
            <tr>
                <td><i class="fa fa-comment w3-text-black w3-large"></i></td>
                <td><a href="/search/${data.result[i]}">${data.result[i]}</a></td>
                <td><i>#${i + 1}</i></td>
            </tr>
          `;
    }

    // Write data for HTML. 
    fs.writeFile('./views/html/words.html', s, (err) => {

        // In case of a error throw err. 
        if (err) throw err;
    })

    return s;
}

module.exports = router;