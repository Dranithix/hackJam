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

let lastPress;

Template.profile.events({
    'keydown #query'(event) {
        if (Date.now() - lastPress >= 500) {
            console.log($(event.currentTarget).val());
            lastPress = Date.now();
        }
    },
})

Template.profile.onRendered(() => {
    Meteor.call('images.search', 'natural scenery', (err, res) => {
        if (!err) {
            imageResults.set(res.value);

            let thumbnailUrls = _.pluck(imageResults.get(), 'thumbnailUrl');

            $(".grid").isotope({
                itemSelector: '.grid-item',
                layoutMode: 'fitRows'
            });
        }
    })

});