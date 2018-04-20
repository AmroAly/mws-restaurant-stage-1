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

/* cache names */
var staticCacheName = 'restaurant-static-v1';
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