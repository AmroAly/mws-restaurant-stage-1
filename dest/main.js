'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Common database helper functions.
 */
var DBHelper = function () {
  function DBHelper() {
    _classCallCheck(this, DBHelper);
  }

  _createClass(DBHelper, null, [{
    key: 'fetchRestaurants',


    /**
     * Fetch all restaurants.
     * Using the Fetch api
     */
    value: function fetchRestaurants(callback) {
      DBHelper.fetchRestaurantsFromIDB(function (error, restaurants) {
        // if there is no data in the indexedDB
        // Here's what we will do
        // fetch the restaurants from the network
        // save it to the indexedDB 
        if (error) {
          DBHelper.fetchRestaurantsFromNetwork(function (error, restaurants) {
            if (restaurants) {
              // save the restaurants into the IDB
              DBHelper.saveRestaurantsIntoIDB(restaurants);

              callback(null, restaurants);
            }
            if (error) {
              callback(error, null);
            }
          });
        }

        // restaurants found in IDB
        if (restaurants) {
          callback(null, restaurants);
        }
      });
    }

    /**
     * Fetch Reviews 
     */

  }, {
    key: 'fetchReviews',
    value: function fetchReviews(callback) {
      DBHelper.fetchReviewsFromIDB(function (error, reviews) {
        if (error) {
          DBHelper.fetchReviewsFromNetwork(function (error, reviewsFormNetwork) {
            if (reviewsFormNetwork && reviewsFormNetwork.length) {
              DBHelper.saveReviewsIntoIDB(reviewsFormNetwork);

              callback(null, reviewsFormNetwork);
            }

            if (error) {
              callback(error, null);
            }
          });
        }
        if (reviews) {
          callback(null, reviews);
        }
      });
    }

    /**
     * Fetch reviews from Indexed DB
     */

  }, {
    key: 'fetchReviewsFromIDB',
    value: function fetchReviewsFromIDB(callback) {
      // const dbPromise = DBHelper.openIDB();
      return DBHelper.openIDB().then(function (db) {
        if (!db) return;

        var tx = db.transaction('reviews');
        var store = tx.objectStore('reviews');

        return store.getAll().then(function (reviews) {
          if (reviews.length) {
            callback(null, reviews);
          } else {
            var error = 'There is no reviews in IDB';
            callback(error, null);
          }
        });
      });
    }

    /**
    * Save reviews into the indexed DB
    */

  }, {
    key: 'saveReviewsIntoIDB',
    value: function saveReviewsIntoIDB(reviews) {

      return DBHelper.openIDB().then(function (db) {
        if (!db) return;
        var tx = db.transaction('reviews', 'readwrite');
        var store = tx.objectStore('reviews');
        reviews.forEach(function (review) {
          store.put(review);
        });
        return tx.complete;
      });
    }

    /**
    * Save Sync reviews into the indexed DB
    */

  }, {
    key: 'saveSyncReviewsIntoIDB',
    value: function saveSyncReviewsIntoIDB(review) {
      return DBHelper.openIDB().then(function (db) {
        if (!db) return;
        var tx = db.transaction('sync-reviews', 'readwrite');
        var store = tx.objectStore('sync-reviews');
        store.put(review);
        return tx.complete;
      });
    }

    /**
     * get all syncing reviews
     */

  }, {
    key: 'getSyncReviewsFromIDB',
    value: function getSyncReviewsFromIDB() {
      return DBHelper.openIDB().then(function (db) {
        if (!db) return;

        var tx = db.transaction('sync-reviews');
        var store = tx.objectStore('sync-reviews');

        return store.getAll();
      });
    }

    /**
     * Fetch reviews from network
     */

  }, {
    key: 'fetchReviewsFromNetwork',
    value: function fetchReviewsFromNetwork(callback) {

      var url = "http://localhost:1337/reviews";
      return fetch(url).then(function (response) {
        return response.json();
      }).then(function (reviews) {
        if (reviews) {
          callback(null, reviews);
        }
      }).catch(function (e) {
        var error = 'Request failed. Returned status of 404';
        callback(error, null);
      });
    }

    /**
     * Save the restaurants to the indexedDB
     */

  }, {
    key: 'saveRestaurantsIntoIDB',
    value: function saveRestaurantsIntoIDB(restaurants) {
      // const dbPromise = DBHelper.openIDB();
      return DBHelper.openIDB().then(function (db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        restaurants.forEach(function (restaurant) {
          store.put(restaurant);
        });
        return tx.complete;
      });
    }

    /**
     * Fetch the restaurants
     * from the network
     */

  }, {
    key: 'fetchRestaurantsFromNetwork',
    value: function fetchRestaurantsFromNetwork(callback) {
      return fetch(DBHelper.DATABASE_URL).then(function (response) {
        return response.json();
      }).then(function (restaurants) {
        if (restaurants) {
          callback(null, restaurants);
        }
      }).catch(function (e) {
        var error = 'Request failed. Returned status of 404';
        callback(error, null);
      });
    }

    /**
     * Fetch the restaurants 
     * from the indexedDB
     */

  }, {
    key: 'fetchRestaurantsFromIDB',
    value: function fetchRestaurantsFromIDB(callback) {
      // const dbPromise = DBHelper.openIDB();
      return DBHelper.openIDB().then(function (db) {
        if (!db) return;

        var tx = db.transaction('restaurants');
        var store = tx.objectStore('restaurants');

        return store.getAll().then(function (restaurants) {
          if (restaurants.length) {
            callback(null, restaurants);
          } else {
            var error = 'There is no restaurants in IDB';
            callback(error, null);
          }
        });
      });
    }

    /**
     * open indexedDB
     */

  }, {
    key: 'openIDB',
    value: function openIDB() {
      return idb.open('restaurants-store', 3, function (upgradeDB) {
        switch (upgradeDB.oldVersion) {
          case 0:
            upgradeDB.createObjectStore('restaurants', {
              keyPath: 'id'
            });
          case 1:
            upgradeDB.createObjectStore('reviews', {
              keyPath: 'id'
            });
          case 2:
            upgradeDB.createObjectStore('sync-reviews', {
              keyPath: 'id'
            });
        }
      });
    }

    /**
     * Create a review
     */

  }, {
    key: 'createPostReview',
    value: function createPostReview(review) {
      var url = 'http://localhost:1337/reviews/';
      return fetch(url, {
        method: 'post',
        body: JSON.stringify(review)
      }).then(function (response) {
        return response.json();
      }).then(function (data) {
        // console.log(data);
        DBHelper.saveReviewsIntoIDB([data]);
      }).catch(function (e) {
        console.log('something went wrong', e);
      });
    }

    /**
     * Fetch a restaurant by its ID.
     */

  }, {
    key: 'fetchRestaurantById',
    value: function fetchRestaurantById(id, callback) {
      // fetch all restaurants with proper error handling.
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var restaurant = restaurants.find(function (r) {
            return r.id == id;
          });
          if (restaurant) {
            // Got the restaurant
            callback(null, restaurant);
          } else {
            // Restaurant does not exist in the database
            callback('Restaurant does not exist', null);
          }
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisine',
    value: function fetchRestaurantByCuisine(cuisine, callback) {
      // Fetch all restaurants  with proper error handling
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given cuisine type
          var results = restaurants.filter(function (r) {
            return r.cuisine_type == cuisine;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByNeighborhood',
    value: function fetchRestaurantByNeighborhood(neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Filter restaurants to have only given neighborhood
          var results = restaurants.filter(function (r) {
            return r.neighborhood == neighborhood;
          });
          callback(null, results);
        }
      });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */

  }, {
    key: 'fetchRestaurantByCuisineAndNeighborhood',
    value: function fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          var results = restaurants;
          if (cuisine != 'all') {
            // filter by cuisine
            results = results.filter(function (r) {
              return r.cuisine_type == cuisine;
            });
          }
          if (neighborhood != 'all') {
            // filter by neighborhood
            results = results.filter(function (r) {
              return r.neighborhood == neighborhood;
            });
          }
          callback(null, results);
        }
      });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */

  }, {
    key: 'fetchNeighborhoods',
    value: function fetchNeighborhoods(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all neighborhoods from all restaurants
          var neighborhoods = restaurants.map(function (v, i) {
            return restaurants[i].neighborhood;
          });
          // Remove duplicates from neighborhoods
          var uniqueNeighborhoods = neighborhoods.filter(function (v, i) {
            return neighborhoods.indexOf(v) == i;
          });
          callback(null, uniqueNeighborhoods);
        }
      });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */

  }, {
    key: 'fetchCuisines',
    value: function fetchCuisines(callback) {
      // Fetch all restaurants
      DBHelper.fetchRestaurants(function (error, restaurants) {
        if (error) {
          callback(error, null);
        } else {
          // Get all cuisines from all restaurants
          var cuisines = restaurants.map(function (v, i) {
            return restaurants[i].cuisine_type;
          });
          // Remove duplicates from cuisines
          var uniqueCuisines = cuisines.filter(function (v, i) {
            return cuisines.indexOf(v) == i;
          });
          callback(null, uniqueCuisines);
        }
      });
    }

    /**
     * 
     */

  }, {
    key: 'updateRestaurantIsFavoriteInIDB',
    value: function updateRestaurantIsFavoriteInIDB(id) {
      DBHelper.fetchRestaurantById(id, function (error, restaurant) {
        if (restaurant) {
          return DBHelper.openIDB().then(function (db) {
            if (!db) return;

            var tx = db.transaction('restaurants', 'readwrite');
            var store = tx.objectStore('restaurants');
            var is_favorite = restaurant.is_favorite == 'true' ? 'false' : 'true';
            return store.put(_extends({}, restaurant, { is_favorite: is_favorite }));
          });
        }
        console.log('error', error);
      });
    }

    /**
     * Restaurant page URL.
     */

  }, {
    key: 'urlForRestaurant',
    value: function urlForRestaurant(restaurant) {
      return './restaurant.html?id=' + restaurant.id;
    }

    /**
     * Toggle favorite for restaurant link
     */

  }, {
    key: 'urlForToggleFavoriteLink',
    value: function urlForToggleFavoriteLink(restaurant) {
      return 'http://localhost:1337/restaurants/' + restaurant.id + '/?is_favorite=' + (restaurant.is_favorite == 'true' ? false : true);
    }

    /**
     * Restaurant image URL.
     */

  }, {
    key: 'imageUrlForRestaurant',
    value: function imageUrlForRestaurant(restaurant) {
      // for development we need to remove "/mws-restaurant-stage-1"
      var url = window.location.href;
      if (url.startsWith('https')) {
        return '/mws-restaurant-stage-1/img/' + restaurant.photograph;
      }
      return '/img/' + (restaurant.photograph || 10) + '.jpg';
    }

    /**
     * Restaurant blured image URL.
     */

  }, {
    key: 'bluredImageUrlForRestaurant',
    value: function bluredImageUrlForRestaurant(restaurant) {
      // for development we need to remove "/mws-restaurant-stage-1"
      var url = window.location.href;
      if (url.startsWith('https')) {
        return '/mws-restaurant-stage-1/img/' + restaurant.photograph;
      }
      return '/img/' + (restaurant.photograph || 10) + '-800_lazy_load.jpg';
    }

    /**
     * Map marker for a restaurant.
     */

  }, {
    key: 'mapMarkerForRestaurant',
    value: function mapMarkerForRestaurant(restaurant, map) {
      var marker = new google.maps.Marker({
        position: restaurant.latlng,
        title: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant),
        map: map,
        animation: google.maps.Animation.DROP });
      return marker;
    }
  }, {
    key: 'DATABASE_URL',

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    get: function get() {
      var port = 1337; // Change this to your server port
      var url = window.location.href;
      if (url.startsWith('https')) {
        return 'https://amroaly.github.io/mws-restaurant-stage-1/data/restaurants.json';
      }
      // for dev it shoud be http://localhost:${port}
      // instead of https://amroaly.github.io/mws-restaurant-stage-1/
      return 'http://localhost:' + port + '/restaurants';
    }
  }]);

  return DBHelper;
}();
"use strict";

if (window.location.pathname == "/") {
  var restaurants = void 0,
      neighborhoods = void 0,
      cuisines = void 0;
  var map;
  var markers = [];

  /**
   * Fetch neighborhoods and cuisines as soon as the page is loaded.
   */
  document.addEventListener('DOMContentLoaded', function (event) {
    updateRestaurants();
    fetchNeighborhoods();
    fetchCuisines();
  });

  /**
   * this function has been created by Jeremy Wagner
   * link: https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
   */
  var lazyLoad = function lazyLoad(lazyImage) {
    if ("IntersectionObserver" in window) {
      var lazyImageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var _lazyImage = entry.target;
            _lazyImage.src = _lazyImage.dataset.src;
            // lazyImage.srcset = lazyImage.dataset.srcset;
            _lazyImage.classList.remove("lazy");
            lazyImageObserver.unobserve(_lazyImage);
          }
        });
      });

      lazyImageObserver.observe(lazyImage);
    }
  };

  /**
   * Fetch all neighborhoods and set their HTML.
   */
  var fetchNeighborhoods = function fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
      if (error) {
        // Got an error
        console.error(error);
      } else {
        self.neighborhoods = neighborhoods;
        fillNeighborhoodsHTML();
      }
    });
  };

  /**
   * Set neighborhoods HTML.
   */
  var fillNeighborhoodsHTML = function fillNeighborhoodsHTML() {
    var neighborhoods = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.neighborhoods;

    var select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(function (neighborhood) {
      var option = document.createElement('option');
      option.innerHTML = neighborhood;
      option.value = neighborhood;
      select.append(option);
    });
  };

  /**
   * Fetch all cuisines and set their HTML.
   */
  var fetchCuisines = function fetchCuisines() {
    DBHelper.fetchCuisines(function (error, cuisines) {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        self.cuisines = cuisines;
        fillCuisinesHTML();
      }
    });
  };

  /**
   * Set cuisines HTML.
   */
  var fillCuisinesHTML = function fillCuisinesHTML() {
    var cuisines = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.cuisines;

    var select = document.getElementById('cuisines-select');

    cuisines.forEach(function (cuisine) {
      var option = document.createElement('option');
      option.innerHTML = cuisine;
      option.value = cuisine;
      select.append(option);
    });
  };

  /**
   * Update page and map for current restaurants.
   */
  var updateRestaurants = function updateRestaurants() {
    var cSelect = document.getElementById('cuisines-select');
    var nSelect = document.getElementById('neighborhoods-select');

    var cIndex = cSelect.selectedIndex;
    var nIndex = nSelect.selectedIndex;

    var cuisine = cSelect[cIndex].value;
    var neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, function (error, restaurants) {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        addMarkersToMap();
        fillRestaurantsHTML();
      }
    });
  };

  /**
   * Clear current restaurants, their HTML and remove their map markers.
   */
  var resetRestaurants = function resetRestaurants(restaurants) {
    // Remove all restaurants
    self.restaurants = [];
    var ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(function (m) {
      return m.setMap(null);
    });
    self.markers = [];
    self.restaurants = restaurants;
  };

  /**
   * Create all restaurants HTML and add them to the webpage.
   */
  var fillRestaurantsHTML = function fillRestaurantsHTML() {
    var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

    var ul = document.getElementById('restaurants-list');
    restaurants.forEach(function (restaurant) {
      ul.append(createRestaurantHTML(restaurant));
    });
  };

  /**
   * Create restaurant HTML.
   */
  var createRestaurantHTML = function createRestaurantHTML(restaurant) {
    var li = document.createElement('li');

    var image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = restaurant.name + ' photo';
    image.classList.add('lazy');

    image.setAttribute('src', DBHelper.bluredImageUrlForRestaurant(restaurant));
    image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
    lazyLoad(image);
    li.append(image);

    var name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    name.classList.add('restaurant-name');
    li.append(name);

    var neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    neighborhood.classList.add('restaurant-neighborhood');
    li.append(neighborhood);

    var address = document.createElement('p');
    address.innerHTML = restaurant.address;
    address.classList.add('restaurant-address');
    li.append(address);

    var more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);
    li.tabIndex = 0;
    var label = restaurant.name + " in " + restaurant.address + ", " + restaurant.neighborhood;
    li.setAttribute('aria-label', label);

    return li;
  };

  /**
   * Add markers for current restaurants to the map.
   */
  var addMarkersToMap = function addMarkersToMap() {
    var restaurants = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurants;

    var latlngs = [];
    restaurants.forEach(function (restaurant) {
      latlngs.push(Object.values(restaurant.latlng));
    });
    var latlngsStr = latlngs.join('|');
    var url = "https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&markers=" + latlngsStr + "&size=1000x700&zoom=12&key=AIzaSyC0p8sC70ZxYQhYydDLntxNX5BwzHP604E";
    var img = document.querySelector('#map-image');
    img.src = url;
    caches.open('restaurant-static-v2').then(function (cache) {
      return cache.add(url);
    });
  };
}
'use strict';

if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js');
}
'use strict';

if (window.location.pathname == "/restaurant.html") {
  var restaurant = void 0;
  var map;
  var reviews = void 0;

  /**
   * Fetch restaurant and reviews as soon as the page is loaded.
   */
  document.addEventListener('DOMContentLoaded', function (event) {
    fetchRestaurantFromURL(function (error, restaurant) {
      if (restaurant) {
        self.restaurant = restaurant;
        fillBreadcrumb();
        // Fetch All Reviews;
        fetchReviews();
        addMarkerToMap(restaurant);
        updateIconData();
      }
    });
  });

  var updateIconData = function updateIconData() {
    var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

    var i = document.querySelector('#star-icon');
    var favoriteLink = DBHelper.urlForToggleFavoriteLink(restaurant);
    i.setAttribute('data-link', favoriteLink);
    i.setAttribute('data-id', restaurant.id);
    if (restaurant.is_favorite == 'true') {
      i.classList.add('open');
      i.setAttribute('title', 'unfavorite restaurant!');
    } else {
      i.classList.remove('open');
      i.setAttribute('title', 'favorite restaurant!');
    }
  };

  /**
   * Fetch Reviews
   */
  var fetchReviews = function fetchReviews() {
    var flag = false;
    DBHelper.fetchReviews(function (error, reviews) {
      if (reviews) {
        // Fetch reviews by restaurant id
        var restaurant_id = getParameterByName('id');
        getReviewsByRestaurantId(restaurant_id, reviews);
      }
      if (!flag) {
        fillReviewsHTML();
        flag = true;
      }
    });
  };

  /**
   * Filter reviews for each restaurant
   */
  var getReviewsByRestaurantId = function getReviewsByRestaurantId(restaurant_id, reviews) {
    self.reviews = reviews.filter(function (review) {
      return review.restaurant_id == restaurant_id;
    });
  };

  /**
   * Get current restaurant from page URL.
   */
  var fetchRestaurantFromURL = function fetchRestaurantFromURL(callback) {
    if (self.restaurant) {
      // restaurant already fetched!
      callback(null, self.restaurant);
      return;
    }
    var id = getParameterByName('id');
    if (!id) {
      // no id found in URL
      error = 'No restaurant id in URL';
      callback(error, null);
    } else {
      DBHelper.fetchRestaurantById(id, function (error, restaurant) {
        self.restaurant = restaurant;
        if (!restaurant) {
          console.error(error);
          return;
        }
        fillRestaurantHTML();
        callback(null, restaurant);
      });
    }
  };

  /**
   * Create restaurant HTML and add it to the webpage
   */
  var fillRestaurantHTML = function fillRestaurantHTML() {
    var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

    var name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    var address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    var image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    image.alt = restaurant.name + ' photo';

    var cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
      fillRestaurantHoursHTML();
    }
  };

  /**
   * Create restaurant operating hours HTML table and add it to the webpage.
   */
  var fillRestaurantHoursHTML = function fillRestaurantHoursHTML() {
    var operatingHours = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant.operating_hours;

    var hours = document.getElementById('restaurant-hours');
    for (var key in operatingHours) {
      var row = document.createElement('tr');
      row.setAttribute('role', 'row');

      var day = document.createElement('td');
      day.innerHTML = key;
      day.setAttribute('role', 'cell');
      row.appendChild(day);

      var time = document.createElement('td');
      time.innerHTML = operatingHours[key];
      time.setAttribute('role', 'cell');
      row.appendChild(time);

      hours.appendChild(row);
    }
  };

  /**
   * Create all reviews HTML and add them to the webpage.
   */
  var fillReviewsHTML = function fillReviewsHTML() {
    var reviews = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.reviews;

    var container = document.getElementById('reviews-container');
    var title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      var noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    var ul = document.getElementById('reviews-list');
    reviews.forEach(function (review) {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  };

  /**
   * Create review HTML and add it to the webpage.
   */
  var createReviewHTML = function createReviewHTML(review) {
    var li = document.createElement('li');
    li.tabIndex = 0;
    var name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    var date = document.createElement('p');
    var my_date = new Date(review.createdAt);
    date.innerHTML = my_date.toDateString();
    li.appendChild(date);

    var rating = document.createElement('p');
    rating.innerHTML = 'Rating: ' + review.rating;
    li.appendChild(rating);

    var comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    li.tabIndex = 0;
    var label = review.name + ' said ' + review.comments + ' and rated the restaurant ' + review.rating + ' out of 5';
    li.setAttribute('aria-label', label);

    return li;
  };

  /**
   * Add restaurant name to the breadcrumb navigation menu
   */
  var fillBreadcrumb = function fillBreadcrumb() {
    var restaurant = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : self.restaurant;

    var breadcrumb = document.getElementById('breadcrumb');
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = window.location.href;
    a.setAttribute('aria-current', 'page');

    a.innerHTML = restaurant.name;
    li.appendChild(a);
    breadcrumb.appendChild(li);
  };

  /**
   * Get a parameter by name from page URL.
   */
  var getParameterByName = function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  };

  /**
   * Add event listener for online state
   * So if there is any sync reviews in the IDB
   * Will resubmit them to the server
   */
  window.addEventListener('online', function (e) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller.postMessage({ type: 'handle_sync_reviews' });
    }
  });

  /**
   * Hanlding form submition
   */
  document.querySelector('#review-form').addEventListener('submit', function (e) {
    e.preventDefault();

    validateReviewFormFields(function (error, data) {
      if (data) {
        document.getElementById("review-form").reset();
        document.getElementById('reviews-list').appendChild(createReviewHTML(data));

        // Register a Synchronization task
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(function (sw) {
            data['id'] = Date.now();
            // console.log(data);
            DBHelper.saveSyncReviewsIntoIDB(data).then(function () {
              return sw.sync.register('sync-new-reviews');
            }).then(function () {
              console.log('You review was saved for syncing!');
            }).catch(function (e) {
              console.log(e);
            });
          });
        } else {
          DBHelper.createPostReview(data);
        }
      }
    });
  });

  /**
   * Validate the form fields
   */
  var validateReviewFormFields = function validateReviewFormFields(callback) {
    var restaurantId = getParameterByName('id');
    var name = document.querySelector('#name').value.trim();
    var rating = document.querySelector('#rating').value.trim();
    var comment = document.querySelector('#comment').value.trim();

    var data = {
      restaurant_id: restaurantId,
      name: name,
      rating: rating ? parseInt(rating) : null,
      comments: comment
    };

    var errors_ul = document.querySelector('#errors');
    errors_ul.innerHTML = '';
    var errors = false;
    Object.keys(data).forEach(function (k) {
      if (!data[k]) {
        errors = true;
        var error_li = document.createElement('li');
        error_li.appendChild(document.createTextNode('The ' + k + ' field can\'t be empty'));
        errors_ul.appendChild(error_li);
      }
    });

    data['createdAt'] = new Date().getTime();

    if (errors) {
      callback(true, null);
      return;
    }
    callback(null, data);
  };

  /**
   * Add marker to the map
   */
  var addMarkerToMap = function addMarkerToMap(restaurant) {
    var latlng = Object.values(restaurant.latlng);
    var url = 'https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&markers=' + latlng + '&size=1000x700&zoom=12&key=AIzaSyC0p8sC70ZxYQhYydDLntxNX5BwzHP604E';
    var img = document.querySelector('#map-image-detail');
    img.src = url;
    caches.open('restaurant-static-v2').then(function (cache) {
      return cache.add(url);
    });
  };

  var star = document.querySelector('#star-icon');
  star.addEventListener('click', function (e) {
    var url = star.dataset.link;
    var id = star.dataset.id;
    return fetch(url, {
      method: 'put'
    }).then(function () {
      DBHelper.updateRestaurantIsFavoriteInIDB(id);
      self.restaurant.is_favorite = self.restaurant.is_favorite == "false" ? "true" : "false";
      updateIconData();
    });
  });
}