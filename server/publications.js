Meteor.publish("posts.all", () => {
    return Posts.find({}, {sort: {timestamp: -1}});
})

Meteor.publish("users.all", 9)