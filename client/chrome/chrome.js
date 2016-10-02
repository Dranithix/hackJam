import {ReactiveVar} from "meteor/reactive-var";
import YouTubePlayer from "youtube-player";

let emojis = new ReactiveVar();
let playing = true;

Template.chrome.helpers({
    'emoji'() {
        return emojis.get() ? emojis.get().dominantEmoji : "";
    }
})

function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match && match[7].length == 11) ? match[7] : false;
};

Template.chrome.events({
    'click #searchYoutube'(e) {
        var id = youtube_parser($('#youtubeUrl').val());
        player.loadVideoById(id);
    }
})

let emotionChart;
let lastUpdate = Date.now();

let videoName, videoUrl;

Template.chrome.onRendered(function () {
    player = YouTubePlayer('video-player');
    player.loadVideoById('LdH1hSWGFGU');

    player.on('stateChange', (event) => {
        if (event.data == YT.PlayerState.PLAYING) {
            Promise.all([player.getVideoUrl(), player.getVideoData()]).then((result) => {
                videoUrl = result[0];
                console.log(result[1]);
                videoName = result[1].title;
            });
            playing = true;
        }
        else if (event.data == YT.PlayerState.PAUSED) {
            videoName = null;
            videoUrl = null;
            playing = false;
        }
    });

    nv.addGraph(() => {
        let data = [{
            key: "Emotion Ratio",
            values: []
        }];

        emotionChart = nv.models.discreteBarChart()
            .x((d) => d.label)
            .y((d) => d.value)
            .staggerLabels(true);

        d3.select("#chart").datum(data).call(emotionChart);

        nv.utils.windowResize(chart.update);
        return emotionChart;
    })


    const divRoot = $("#affdex_elements")[0];
    const width = 320;
    const height = 240;
    const faceMode = affdex.FaceDetectorMode.LARGE_FACES;

    const detector = new affdex.CameraDetector(divRoot, width, height, faceMode);

    detector.detectAllEmotions();
    detector.detectAllEmojis();
    detector.detectAllAppearance();

    detector.addEventListener("onInitializeSuccess", function () {
        console.log("Successfully initialized.");
    });

    detector.addEventListener("onInitializeFailure", function () {
        console.log("Failed.");
    });

    detector.addEventListener("onWebcamConnectSuccess", function () {
        console.log('#logs', "Webcam access allowed");
    });

    detector.addEventListener("onWebcamConnectFailure", function () {
        console.log("Webcam access denied");
    });

    detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
        const data = [{
            key: "Emotion Ratio",
            values: []
        }];

        if (playing && faces.length > 0) {
            let reactions = {};

            _.each(Object.keys(faces[0].emotions), (emotion) => {
                if (emotion != "valence") {
                    data[0].values.push({label: emotion, value: faces[0].emotions[emotion]});
                    reactions[emotion] = faces[0].emotions[emotion];
                }
            })

            d3.select("#chart").datum(data).call(emotionChart);
            if (videoName && videoUrl) {
                Meteor.call("posts.track", videoName, videoUrl, "video", Meteor.user().username, reactions);
            }
        }
    });

    if (detector && !detector.isRunning) {
        detector.start();
    }
});