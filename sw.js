/**
 * This code is mainly derived from the wittr project
 * created by Jake Archibald here's the link:
 * https://github.com/jakearchibald/wittr
 */

/* Todos */
// cache the skeleton
// cache css files
// cache the images
// cache the restaurants information

importScripts('https://cdn.rawgit.com/jakearchibald/idb/master/lib/idb.js','js/dbhelper.js');

const dbPromise = DBHelper.openIDB();

/* cache names */
var staticCacheName = 'restaurant-static-v2';
var contentImgsCache = 'restaurant-content-imgs';
var allCaches = [
    staticCacheName,
    contentImgsCache
];

/* cache the static assets */
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            return cache.addAll([
                '/index.html',
                '/restaurant.html',
                'js/register_sw.js',
                'js/main.js',
                'js/dbhelper.js',
                'js/restaurant_info.js',
                'css/styles.css',
                'img/1.jpg',
                'img/2.jpg',
                'img/3.jpg',
                'img/4.jpg',
                'img/5.jpg',
                'img/6.jpg',
                'img/7.jpg',
                'img/8.jpg',
                'img/9.jpg',
                'img/10.jpg',
                'img/1-800_lazy_load.jpg',
                'img/2-800_lazy_load.jpg',
                'img/3-800_lazy_load.jpg',
                'img/4-800_lazy_load.jpg',
                'img/5-800_lazy_load.jpg',
                'img/6-800_lazy_load.jpg',
                'img/7-800_lazy_load.jpg',
                'img/8-800_lazy_load.jpg',
                'img/9-800_lazy_load.jpg',
                'img/10-800_lazy_load.jpg',
                'https://cdn.rawgit.com/jakearchibald/idb/master/lib/idb.js'
            ]);
        })
    );
});

/* remove the unnecessary caches*/
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('restaurant-') &&
                    !allCaches.includes(cacheName);
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            )
        })
    );
});

// fetch from the cache if it exists
// otherwise from the network
self.addEventListener('fetch', function(event) {
    var requestUrl = new URL(event.request.url);

    if(requestUrl.origin === location.origin) {
        if(requestUrl.pathname === '/') {
            event.respondWith(caches.match('/index.html'));
            return;
        }
        if(requestUrl.pathname === '/restaurant.html') {
            event.respondWith(caches.match('/restaurant.html'));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            if(response) return response;

            return fetch(event.request);
        })
    );
});

// Eventlistener for sync-new-review 
self.addEventListener('sync', function(event) {
    if(event.tag == 'sync-new-reviews') {
        // console.log('Syncing new reviews');
        event.waitUntil(
            getSyncReviewsFromIDB().then(function(reviews) {
                // Send reviews to the server
                let promises = [];
                reviews.forEach(review => {
                    let myPromise = sendPostReview({
                        restaurant_id: review.restaurant_id, 
                        name: review.name, 
                        comments: review.comments, 
                        rating: review.rating
                    }).then(function(reviewResponse) {
                        saveReviewsIntoIDB(reviewResponse).then(() => {
                            deleteItemFromDatabase(review.id);
                        })
                    })
                    promises.push(myPromise);
                })
               return Promise.all(promises);
            })
        );
    }
});

function deleteItemFromDatabase(id) {

    return dbPromise.then(function(db) {
        if(!db) return; 

        const tx = db.transaction('sync-reviews', 'readwrite');
        const store =  tx.objectStore('sync-reviews');
        store.delete(id);
        return tx.complete;
    })
}

function getSyncReviewsFromIDB() {
    return dbPromise.then(function(db) {
        if(!db) return;
        const tx = db.transaction('sync-reviews');
        const store =  tx.objectStore('sync-reviews');
        return store.getAll();
    })
}

function sendPostReview (review) {
    const url = 'http://localhost:1337/reviews/';
    return fetch(url, {
        method: 'post',
        body: JSON.stringify(review),
    }).then(response => {
        return response.json();
    })
}

function saveReviewsIntoIDB(review) {
    return dbPromise.then((db) => {
        if(!db) return;
        const tx = db.transaction('reviews', 'readwrite')
        const store = tx.objectStore('reviews');
        store.put(review);
        return tx.complete;
      });
}
