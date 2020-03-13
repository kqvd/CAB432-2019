const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
var Analyzer = natural.SentimentAnalyzer;
var stemmer = natural.PorterStemmer;
var analyzer = new Analyzer("English", stemmer, "afinn");

module.exports = function process(tweets)
{
    let processedTweets = [];

    for (tweet of tweets)
    {
        // Log
        //console.log("Tweet: " + JSON.stringify(tweet));

        let text = tweet.full_text;

        let sentiment = analyzer.getSentiment(tokenizer.tokenize(text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '').replace(/@(\S*)/g, '')));

        let finalSentiment = sentiment.toFixed(5);

        let display_url = 'twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
        let user_url = "https://twitter.com/" + tweet.user.screen_name;

        processedTweets.push({
            "text": text,
            "id": tweet.id_str,
            "sentiment": finalSentiment,
            "url": "https://" + display_url,
            "display_url": display_url,
            "user_name": tweet.user.name,
            "date": tweet.created_at,
            "user_screen_name": tweet.user.screen_name,
            "user_url": user_url
        })
    }

    return processedTweets;
}

