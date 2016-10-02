Meteor.methods({
    'posts.add'(name, url, type = "photo", watchers = ["Kenta Iwasaki", "Arun Galva", "Piyush VJani"],
                thumbnail = "http://placehold.it/64x64") {
        Posts.insert({name, url, type, watchers, thumbnail, timestamp: Date.now()});
    },
    'posts.track'(name, url, type, watcher, emotions, thumbnail = "http://placehold.it/64x64") {
        this.unblock();

        let post = Posts.findOne({name, type})

        if (post) {
            if (post.watchers && !_.contains(post.watchers, watcher)) {
                post.watchers.push(watcher);
            }

            Posts.update(post._id, {
                $set: {
                    watchers: post.watchers,
                    timestamp: Date.now(),
                },
                $push: {
                    emotions: {watcher, timestamp: Date.now(), emotions}
                }
            })
        } else {
            Posts.insert({
                name,
                url,
                type,
                watchers: [watcher],
                emotions: [{watcher, timestamp: Date.now(), emotions}],
                timestamp: Date.now(),
                thumbnail
            })
        }
    },
    'images.search'(term) {
        try {
            const res = HTTP.get(`https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=${term}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': '723c63a00d5c43e3b9cf65e31c86e06d'
                }
            });
            return res.data;
        } catch (e) {
            throw new Meteor.Error('404', "Failed to search for images");
        }
    }
})