
/* Todos */
// cache the skeleton
// cache css files
// cache the images
// cache the restaurants information

/* cache names */
var staticCacheName = 'restaurant-static-v4';
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
                'data/restaurants.json',
                'css/styles.css',
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
        if(requestUrl.pathname === '/data/restaurants.json') {
            event.respondWith(caches.match('/data/restaurants.json'));
            return;
        }
        if(requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(serveImage(event.request));
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

/**
 * - serve the images from the cache if exist
 * - otherwise serve them from the network and 
 * put 'em in the cache 
 */
function serveImage(request) {
    return caches.open(contentImgsCache).then(function(cache) {
        return cache.match(request.url).then(function(response) {
            var networkFetch = fetch(request).then(function(networkResponse) {
                cache.put(request.url, networkResponse.clone());
                return networkResponse;
            });

            return response || networkFetch;
        });
    });
}