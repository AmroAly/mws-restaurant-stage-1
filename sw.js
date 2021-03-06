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
                'manifest.json',
                '/index.html',
                '/restaurant.html',
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
                'https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&markers=40.713829,-73.989667|40.683555,-73.966393|40.747143,-73.985414|40.722216,-73.987501|40.705089,-73.933585|40.674925,-74.016162|40.727397,-73.983645|40.726584,-74.002082|40.743797,-73.950652|40.743394,-73.954235&size=1000x700&zoom=12&key=AIzaSyC0p8sC70ZxYQhYydDLntxNX5BwzHP604E',
                'https://cdn.rawgit.com/jakearchibald/idb/master/lib/idb.js',
                'build/main.js'
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
            handleSyncEventForHandlingSyncReviews()
        );
    }
    if(event.tag == 'sync-add-favorites') {
        // console.log('Syncing new reviews');
        event.waitUntil(
            handleSyncEventForHandlingSyncFavoriteLinks()
        );
    }
});

// Eventlistener for postMessage from the client 
// when the user comes online 
self.addEventListener('message', function(e) {
    if(e.data.type == 'handle_sync_reviews') {
        handleSyncEventForHandlingSyncReviews();
    }
    if(e.data.type == 'handle_sync_favorites') {
        handleSyncEventForHandlingSyncFavoriteLinks();
    }
})

// Handling the syncing reviews
function handleSyncEventForHandlingSyncReviews() {
    return getSyncReviewsFromIDB().then(function(reviews) {
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
    });
}

// Handling sync event for favorite links
function handleSyncEventForHandlingSyncFavoriteLinks() {
    return getSyncFavortieLinksFromIDB().then(function(links) {
        let promises = [];
        links.forEach(favoriteLink => {
            let myPromise = fetch(favoriteLink.url, {
                method: 'put'
            }).then(function() {
                deleteFavoriteLinkFromIDB(favoriteLink.id);
            });
            promises.push(myPromise);
        });
       return Promise.all(promises);
    });
}

function updateRestauranInIDB(id) {
    return dbPromise.then(function(db) {
        DBHelper.fetchRestaurantById(id, function(error, restaurant) {
            if(restaurant) {
              return DBHelper.openIDB().then((db) => {
                if(!db) return;
            
                const tx = db.transaction('restaurants', 'readwrite');
                const store = tx.objectStore('restaurants');
                const is_favorite = restaurant.is_favorite == 'true' ? 'false' : 'true';
                store.put({...restaurant,is_favorite});
                console.log('Updated successfully')
                return tx.complete;
              });
            }
            console.log('error', error);
          })
    });
}

// delete the synced favorite links in idb
function deleteFavoriteLinkFromIDB(id) {
    return dbPromise.then(function(db) {
        if(!db) return; 

        const tx = db.transaction('sync-favorites', 'readwrite');
        const store =  tx.objectStore('sync-favorites');
        store.delete(id);
        return tx.complete;
    })
}

function getSyncFavortieLinksFromIDB() {
    return dbPromise.then(function(db) {
        if(!db) return;
        const tx = db.transaction('sync-favorites');
        const store =  tx.objectStore('sync-favorites');
        return store.getAll();
    })
}

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
