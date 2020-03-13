const express = require('express');
const redis = require('redis');
const sw = require('stopword');

const router = express.Router();

const redisClient = redis.createClient();

redisClient.on('error', (err) => {
    console.log("Error " + err);
});

router.get('/', (req, res) => 
{
    let query = req.query['query'];

    const redisKey = `query:${query}`;


    // Retrieve data from Redis
    redisClient.get(redisKey, (err, result) => 
    {
        if (result)
        {
            let tweets = JSON.parse(result);

            // Logging
            console.log("Retrieved " + tweets.length + " tweets from Redis Cache for query: " + query);
            
            let sum = 0;
            let data = [];
            let count = 0;

            for (let i = 0; i < tweets.length; i++)
            {
                let s = parseFloat(tweets[i].sentiment);

                if (s != 0)
                {
                    count++;
                    sum += s;
                }

                //console.log(tweets[i].sentiment)

                data.push(tweets[i].text);
            }

            // Find the average value
            let average = (sum / count).toFixed(5);

            // Chunk of text - unique texts removed (URLS, @usernames)
            let str = data.join('').replace(/\r?\n|\r/g, "").replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/@(\S*)/g, '');

            // Hashtags Only
            let hashtags = str.match(/\#\S+/g).toString();

            // Remove basic words, numbers and hashtags
            let words = str.replace(/\d/g, '').replace(/\#\S+/g, "").split(' ');
            let keywords = sw.removeStopwords(words);

            // Render summary page
            res.render('summary',
                {
                    title: 'Twitter Query Processor',
                    query: query,
                    num: tweets.length,
                    avg: average,
                    hashtags: hashtags,
                    keywords: keywords
                }
            );
        }
        else
        {
            // Render error page
        }
    });
});

module.exports = router;