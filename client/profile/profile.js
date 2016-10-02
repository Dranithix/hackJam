import {ReactiveVar} from "meteor/reactive-var";

const imageResults = new ReactiveVar();

Template.profile.onCreated(() => {

});

Template.profile.helpers({
    'thumbnails'() {
        let thumbnailUrls = _.pluck(imageResults.get(), 'thumbnailUrl');
        return thumbnailUrls;
    }
})

let timeoutQuery = 0, lastQuery;

Template.profile.events({
    'keydown #query'(event) {
        if (timeoutQuery != -1) Meteor.clearTimeout(timeoutQuery);
    },
    'keyup #query'(event) {
        let text = $(event.currentTarget).val();

        if (timeoutQuery == -1) {
            console.log(text);
            timeoutQuery = Meteor.setTimeout(() => {
                if (lastQuery && text !== lastQuery) {
                    // Search for new images.

                    Meteor.call('images.search', text, (err, res) => {
                        if (!err) {
                            imageResults.set(res.value);

                            let thumbnailUrls = _.pluck(imageResults.get(), 'thumbnailUrl');
                        }
                    });

                    lastQuery = text;
                }
                timeoutQuery = -1;
            }, 500);
        }
    },
})

Template.profile.onRendered(() => {
    Template.instance().autorun(() => {
        imageResults.get();
        $(".grid").isotope({
            itemSelector: '.grid-item',
            layoutMode: 'fitRows'
        });
    });
});