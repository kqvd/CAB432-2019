// Animation
am4core.useTheme(am4themes_animated);

hashtagSummary()

function hashtagSummary() {

    document.getElementById("description").textContent = "Hashtag Summary for ";

    document.getElementById("wordSummary").disabled = false;
    document.getElementById("hashtagSummary").disabled = true;

    var wordCloud = am4core.create("chartdiv", am4plugins_wordCloud.WordCloud);
    var series = wordCloud.series.push(new am4plugins_wordCloud.WordCloudSeries());

    series.accuracy = 4;
    series.step = 15;
    series.rotationThreshold = 0.7;
    series.maxCount = 200;
    series.minWordLength = 2;
    series.labels.template.tooltipText = "{word}: {value}";
    series.fontFamily = "Courier New";
    series.maxFontSize = am4core.percent(40);

    series.labels.template.url = "https://twitter.com/search?q={word}";
    series.labels.template.urlTarget = "_blank";

    series.colors = new am4core.ColorSet();
    series.colors.passOptions = {};

    series.text = hashtags; 

}

function wordSummary() {

    document.getElementById("description").textContent = "Word Summary for ";

    document.getElementById("wordSummary").disabled = true;
    document.getElementById("hashtagSummary").disabled = false;

    var wordCloud = am4core.create("chartdiv", am4plugins_wordCloud.WordCloud);
    var series = wordCloud.series.push(new am4plugins_wordCloud.WordCloudSeries());

    series.accuracy = 4;
    series.step = 15;
    series.rotationThreshold = 0.7;
    series.maxCount = 200;
    series.minWordLength = 2;
    series.labels.template.tooltipText = "{word}: {value}";
    series.fontFamily = "Courier New";
    series.maxFontSize = am4core.percent(40);

    series.heatRules.push({
        "target": series.labels.template,
        "property": "fill",
        "min": am4core.color("#FFFFFF"),
        "max": am4core.color("#1da1f2"),
        "dataField": "value"
    });

    series.text = keywords; 

}