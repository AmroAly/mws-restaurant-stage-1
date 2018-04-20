/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    const url = window.location.href;
    if(url.startsWith('https')) {
      return `https://amroaly.github.io/mws-restaurant-stage-1/data/restaurants.json`;
    } 
    // for dev it shoud be http://localhost:${port}
    // instead of https://amroaly.github.io/mws-restaurant-stage-1/
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   * Using the Fetch api
   */
  static fetchRestaurants(callback) {
    DBHelper.fetchRestaurantsFromIDB((error, restaurants) => {
      // if there is no data in the indexedDB
      // Here's what we will do
      // fetch the restaurants from the network
      // save it to the indexedDB 
      if(error) {
        DBHelper.fetchRestaurantsFromNetwork((error, restaurants) => {
          if(restaurants) {
            // save the restaurants into the IDB
            DBHelper.saveRestaurantsIntoIDB(restaurants);
            
            callback(null, restaurants);
          }
          if(error) {
            callback(error, null);
          }
        });
      }

      // restaurants found in IDB
      if(restaurants) {
        callback(null, restaurants);
      }
    })
  }

  /**
   * Save the restaurants to the indexedDB
   */

   static saveRestaurantsIntoIDB(restaurants) {
    const dbPromise = DBHelper.openIDB();
    return dbPromise.then((db) => {
      if(!db) return;
      const store = db.transaction('restaurants', 'readwrite')
                      .objectStore('restaurants');
      restaurants.forEach((restaurant) => {
        store.put(restaurant);
      });
    });
   }

  /**
   * Fetch the restaurants
   * from the network
   */
static fetchRestaurantsFromNetwork(callback) {
    return fetch(DBHelper.DATABASE_URL).then((response) => {
      return response.json();
    }).then((restaurants) => {
      if(restaurants) {
        callback(null, restaurants);
      }
    }).catch(e => {
      const error = (`Request failed. Returned status of 404`);
      callback(error, null);
    });
}

  /**
   * Fetch the restaurants 
   * from the indexedDB
   */
static fetchRestaurantsFromIDB(callback) {
    const dbPromise = DBHelper.openIDB();
    return dbPromise.then((db) => {
      if(!db) return;

      const store = db.transaction('restaurants')
            .objectStore('restaurants');

      return store.getAll().then((restaurants) => {
        if(restaurants.length) {
          callback(null, restaurants);
        } else {
          const error = 'There is no restaurants in IDB';
          callback(error, null);
        }
      });
    }) 
  }

  /**
   * open indexedDB
   */
  static openIDB() {
    if(!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('restaurants', 1, (upgradeDB) => {
      const store = upgradeDB.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    })
  }


  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // for development we need to remove "/mws-restaurant-stage-1"
    const url = window.location.href;
    if(url.startsWith('https')) {
      return (`/mws-restaurant-stage-1/img/${restaurant.photograph}`);
    }
    return (`/img/${restaurant.photograph || 10}.jpg`);    
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}
