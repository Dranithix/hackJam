import {ReactiveVar} from "meteor/reactive-var";

const imageResults = new ReactiveVar();

Template.profile.onCreated(() => {
    Meteor.subscribe("posts.all");
});

Template.profile.helpers({
    'thumbnails'() {
        let thumbnailUrls = _.pluck(imageResults.get(), 'thumbnailUrl');
        return thumbnailUrls;
    }
})

let timeoutQuery = -1, lastQuery;

Template.profile.events({
    'keydown #query'(event) {
        if (timeoutQuery != -1) {
            Meteor.clearTimeout(timeoutQuery);
            timeoutQuery = -1;
        }
    },
    'keyup #query'(event) {
        let text = $(event.currentTarget).val();

        if (timeoutQuery == -1) {
            timeoutQuery = Meteor.setTimeout(() => {
                if (text !== lastQuery) {
                    // Search for new images.
                    Meteor.call('images.search', text, (err, res) => {
                        if (!err) {
                            imageResults.set(res.value);
                        }
                    });

                    lastQuery = text;
                }
                timeoutQuery = -1;
            }, 1000);
        }
    },
})

Template.profile.onRendered(() => {
    Template.instance().autorun(() => {
        if (Meteor.user() && Meteor.user().username) {
            let posts = Posts.find({}).fetch();
            _.each(posts, (post) => {
                let emotions = post.emotions;
                let reactionHistory = _.filter(emotions, (entry) => entry.watcher === Meteor.user().username)

                let aggregation = {};
                _.each(reactionHistory, (data) => {
                    _.each(Object.keys(data.emotions), (type) => {
                        if (type != "contempt" && type != "engagement") {
                            if (!(type in aggregation)) aggregation[type] = 0;
                            aggregation[type] += data.emotions[type];
                        }
                    });
                })

                _.each(Object.keys(aggregation), (type) => {
                    aggregation[type] /= reactionHistory.length;
                    aggregation[type] = +aggregation[type].toFixed(2);
                })

                let maxValue = 0;
                _.each(Object.keys(aggregation), (type) => {
                    if (aggregation[type] > maxValue) {
                        maxValue = aggregation[type];
                    }
                });

                let formattedValues = [];

                _.each(Object.keys(aggregation), (type) => {
                    formattedValues.push({emoticon: type, value: Math.round(aggregation[type] / maxValue * 100)});
                });

                console.log(formattedValues);
            })

        }
    });
});