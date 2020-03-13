var livefeed = window.setInterval(update, 5000);

function stopFeed() 
{
    clearInterval(livefeed);

    // Replace button
    $('#stopLiveFeedButton').remove();
}

function openSummary()
{
    location.href = '/summary?query=' + encodeURIComponent(searchQuery) + '&count=' + tweetCount;
}

function update()
{
    let req = '/search?search=' + encodeURIComponent(searchQuery) + '&format=json';

    if (lastTweetId)
        req = req + '&since_id=' + lastTweetId;

    console.log('Search url: ' + req);

    getRequest(req, (res) => 
    {
        let processedTweets = JSON.parse(res);

        if (processedTweets.length > 0)
        {
            lastTweetId = processedTweets[0].id;

            let html = '';

            tweetCount += processedTweets.length;

            for (tweet of processedTweets)
            {
                html =
                    '<div class="card bg-dark border-info mb-3 tweet-card col-10">' +
                        '<div class="card-body">' +
                            '<h5 class="card-title text-white">' + tweet.user_name + "</h5>" +
                            '<a href="' + tweet.user_url + '"><h6 class="card-subtitle text-primary mb-2">@' + tweet.user_screen_name + '</h6></a>' +
                            '<p id="tweet" class="card-text text-white" id="">' + tweet.text + "</p>" +
                        '</div>' +
                        '<div class="card-body">' +
                            '<a class="text-primary" href="' + tweet.url + '">' + tweet.display_url + '</a>' +
                            '<p class="card-text text-muted">' + tweet.date + '</p>' +
                        '</div>' + 
                    '</div>' +
                    '<div class="card bg-dark border-info mb-3 tweet-card col-2">' + 
                        '<div class="card-body text-white">' + 
                            '<h6 class="card-title">Sentiment</h6>' +
                            '<p id="sentiment" class="card-text">' + tweet.sentiment + '</p>' +
                        '</div>' +
                    '</div>';

                var $tweet = $('<div class="row" style="display: none;">' + html + '</div>');

                $('#tweetsContainer').prepend($tweet);

                $tweet.fadeIn(1000);
                
            }
        }
    });
}

function getRequest(search_url, callback)
{
    let xmlHttp = new XMLHttpRequest();

    xmlHttp.onreadystatechange = () =>
    {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }

    xmlHttp.open("GET", search_url, true);
    xmlHttp.send(null);

}