const express = require('express');
const Twitter = require('twitter');
const processTweets = require('./util/processTweets');
const redis = require('redis');
const AWS = require('aws-sdk');

const router = express.Router();

// Cloud Services Set-up
// Create unique bucket name
const bucketName = 'lunamclaren-twitter-processor-store';
//const bucketName = 'kevinduong-twitter-processor-store';

// Create a promise on S3 service object
const bucketPromise = new AWS.S3({apiVersion: '2006-03-01'}).createBucket({Bucket: bucketName}).promise();

bucketPromise.then(function(data) 
{
    console.log("Successfully created " + bucketName);
})
.catch(function(err) 
{
    console.error(err, err.stack);
});


// Redis setup
const redisClient = redis.createClient();

redisClient.on('error', (err) => {
    console.log("Error " + err);
});


// Twitter credentials
const twitterClient = new Twitter({
    consumer_key: 'ULYQZ6NiqBlsjRVFoyAsx5ODF', // API Key
    consumer_secret: 'YzSEQmRPBR96W14IcCMdcEJwge1ql6gkXa9o6yGrzi3LGFQnE0', // Secret API Key
    access_token_key: '1167249226323021824-gCYis7AH3cR15lyaRfoOQbTbrsKACP', // Access Token
    access_token_secret: 'RJbs0yV1LCnpsMWuDqQsoohFw03OYbYBLpGjZb3SItTsp' // Access Token Secret
});


router.get('/', (req, res) =>
{

    let query = req.query['search'];
    let json = req.query['format'] == 'json';
    let count = req.query['count'] ? req.query['count'] : 100;
    let since_id = req.query['since_id'];

    // If JSON, only get new tweets
    if (json)
    {
        // Logging
        console.log("Retrieving new tweets from Twitter API");

        // Retrieve tweets from twitter
        twitterClient.get('search/tweets', createParams(query, count, since_id), (error, tweets, response) => 
        {
            // Logging
            console.log("Retrieved " + tweets.statuses.length + " new tweets from Twitter API");

            // Process tweets and extract useful information and perform sentiment analysis
            let processedTweets = processTweets(tweets.statuses);

            // Cache results
            cacheNewTweets(processedTweets, query);

            if (!error) 
                writeResponse(processedTweets, json, query, res);
            else 
                console.log(error);
        });
    }
    else
    {
        // Cache keys
        const s3Key = `query-${query}`;
        const redisKey = `query:${query}`;

        // Try the cache
        redisClient.get(redisKey, (err, result) => 
        {
            // If cache empty
            if (!result || !isValidJSON(result))
            {
                if (!isValidJSON(result))
                {
                    // If JSON is invalid, delete key
                    redisClient.del(redisKey, (error) =>
                    {
                        if (error)
                            console.log(error);
                    });
                }

                // Check S3
                const s3params = { Bucket: bucketName, Key: s3Key};

                new AWS.S3({apiVersion: '2006-03-01'}).getObject(s3params, (err, result) => 
                {
                    // If bucket empty
                    if (!result || !isValidJSON(result))
                    {
                        if (!isValidJSON(result))
                        {
                            // If JSON is invalid, delete key
                            new AWS.S3({apiVersion: '2006-03-01'}).deleteObject(s3params, (error) =>
                            {
                                if (error)
                                    console.log(error);
                            });
                        }

                        // Retrieve tweets from twitter
                        twitterClient.get('search/tweets', createParams(query, count, since_id), (error, tweets, response) => 
                        {
                            let processedTweets = processTweets(tweets.statuses);

                            // Cache results
                            cacheTweets(processedTweets, query);

                            if (!error) 
                                writeResponse(processedTweets, json, query, res);
                            else 
                                console.log(error);
                        });
                    }
                    else
                    {
                        // Get any new tweets since last cache
                        retrieveMoreRecentTweets(JSON.parse(result), query, count, res);
                    }
                });
            }
            else
            {
                let tweets = JSON.parse(result);

                // Logging
                console.log("Retrieved " + tweets.length + " tweets from Redis Cache for query: " + query);

                // Get any new tweets since last cache
                retrieveMoreRecentTweets(tweets, query, count, res);
            }
        });
    }
});

function isValidJSON(json)
{
    try{
        JSON.parse(json);   
    }
    catch (err) {
        return false;
    }

    json = JSON.parse(json);

    if (json == null)
        return false;

    if (json.length > 0)
        if (json[0] == null)
            return false;

    return true;
}

function createParams(query, count, since_id)
{
    // Twitter REST API params
    let twitterParams = {
        q: query + " exclude:retweets exclude:replies",
        count: count,
        tweet_mode: 'extended',
        result_type: 'recent',
        lang: 'en'
    }

    if (since_id)
        twitterParams.since_id = since_id;

    return twitterParams;
}

function cacheNewTweets(newTweets, query)
{
    if (newTweets.length == 0)
        return;

    // Logging
    console.log("Caching " + newTweets.length + " new tweets");

    const redisKey = `query:${query}`;

    // Get old cached tweets
    redisClient.get(redisKey, (err, result) => 
    {
        if (result)
            concatTweetsAndCache(newTweets, JSON.parse(result), query, -1);
        else
            cacheTweets(newTweets, query);
    });
}

function cacheTweets(tweets, query)
{
    // Cache keys
    const s3Key = `query-${query}`;
    const redisKey = `query:${query}`;

    // Log
    //console.log(JSON.stringify(tweets));

    const body = JSON.stringify(tweets);

    // Logging
    console.log("Caching " + tweets.length + " tweets for query: " + query);

    // Cache in Redis
    redisClient.setex(redisKey, 3600, body, (error) =>
    {
        if (error)
            console.log(error);
        else
        console.log("Successfully cached data to " + redisKey);
    });
    
    // Store in S3
    const objectParams = {Bucket: bucketName, Key: s3Key, Body: body};
    const uploadPromise = new AWS.S3({apiVersion: '2006-03-01'}).putObject(objectParams).promise();

    uploadPromise.then(function(data) 
    {
        console.log("Successfully uploaded data to " + bucketName + "/" + s3Key);
    });
}

function concatTweetsAndCache(newTweets, oldTweets, query, count)
{
    // Add new tweets to array
    for (let i = newTweets.length - 1; i >= 0; i--)
        oldTweets.unshift(newTweets[i]);

    // Trim to count
    if (count > 0)
        oldTweets = oldTweets.slice(0, count);
    
    // Cache more recent tweets
    cacheTweets(oldTweets, query); 

    return oldTweets;
}


function retrieveMoreRecentTweets(oldTweets, query, count, res)
{
    let latestId = oldTweets[0].id;

    // Logging
    console.log(oldTweets.length + " tweets retrieved from cache");
    console.log("Retrieving tweets newer than id: " + latestId + " from Twitter API");

    // Retrieve tweets from twitter
    return twitterClient.get('search/tweets', createParams(query, count, latestId), (error, newTweets, response) => 
    {
        console.log("Retrieved " + newTweets.statuses.length + " new tweets from Twitter API");

        let tweetsToReturn = concatTweetsAndCache(processTweets(newTweets.statuses), oldTweets, query, -1);

        // Trim tweets to return
        tweetsToReturn = tweetsToReturn.slice(0, count);

        // Log
        console.log("Showing " + count + " tweets");

        // Write response
        writeResponse(tweetsToReturn, false, query, res);
    });
}

function writeResponse(processedTweets, json, query, res)
{
    if (json) 
    {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(processedTweets));
    }
    else 
    {
        res.render('search', { title: 'Twitter Query Processor', query: query, tweets: processedTweets });
    }
}

module.exports = router;