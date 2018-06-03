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
    });
  }

/**
 * Fetch Reviews 
 */
static fetchReviews(callback) {
  DBHelper.fetchReviewsFromIDB((error, reviews) => {
    if(error) {
      DBHelper.fetchReviewsFromNetwork((error, reviewsFormNetwork) => {
        if(reviewsFormNetwork && reviewsFormNetwork.length) {
          DBHelper.saveReviewsIntoIDB(reviewsFormNetwork);
          
          callback(null, reviewsFormNetwork);
        }
  
        if(error) {
          callback(error, null);
        }
      });
    }
    if(reviews) {
      callback(null, reviews);
    }
    
  })
}

/**
 * Fetch reviews from Indexed DB
 */
static fetchReviewsFromIDB(callback) {
  // const dbPromise = DBHelper.openIDB();
  return DBHelper.openIDB().then((db) => {
    if(!db) return;

    const tx = db.transaction('reviews');
    const store =  tx.objectStore('reviews');

    return store.getAll().then((reviews) => {
      if(reviews.length) {
        callback(null, reviews);
      } else {
        const error = 'There is no reviews in IDB';
        callback(error, null);
      }
    });
  });
}

/**
* Save reviews into the indexed DB
*/
static saveReviewsIntoIDB(reviews) {

  return DBHelper.openIDB().then((db) => {
    if(!db) return;
    const tx = db.transaction('reviews', 'readwrite')
    const store = tx.objectStore('reviews');
    reviews.forEach((review) => {
      store.put(review);
    });
    return tx.complete;
  });
}

/**
* Save Sync reviews into the indexed DB
*/
static saveSyncReviewsIntoIDB(review) {
  return DBHelper.openIDB().then((db) => {
    if(!db) return;
    const tx = db.transaction('sync-reviews', 'readwrite')
    const store = tx.objectStore('sync-reviews');
    store.put(review);
    return tx.complete;
  });
}

/**
 * get all syncing reviews
 */
static getSyncReviewsFromIDB() {
  return DBHelper.openIDB().then((db) => {
      if(!db) return;

      const tx = db.transaction('sync-reviews');
      const store =  tx.objectStore('sync-reviews');

      return store.getAll();
  });
}

/**
 * Fetch reviews from network
 */
static fetchReviewsFromNetwork(callback) {
  
  const url = "http://localhost:1337/reviews";
  return fetch(url).then((response) => {
    return response.json();
  }).then((reviews) => {
    if(reviews) {
      callback(null, reviews);
    }
  }).catch(e => {
    const error = (`Request failed. Returned status of 404`);
    callback(error, null);
  });
}

  /**
   * Save the restaurants to the indexedDB
   */
   static saveRestaurantsIntoIDB(restaurants) {
    // const dbPromise = DBHelper.openIDB();
    return DBHelper.openIDB().then((db) => {
      if(!db) return;
      const tx = db.transaction('restaurants', 'readwrite')
      const store = tx.objectStore('restaurants');
      restaurants.forEach((restaurant) => {
        store.put(restaurant);
      });
      return tx.complete;
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
    // const dbPromise = DBHelper.openIDB();
    return DBHelper.openIDB().then((db) => {
      if(!db) return;

      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');

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
    return idb.open('restaurants-store', 4, (upgradeDB) => {
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
        case 3:
          upgradeDB.createObjectStore('sync-favorites', {
            keyPath: 'id'
          });
        }
    });
  }


/**
 * Create a review
 */
static createPostReview (review) {
  const url = 'http://localhost:1337/reviews/';
  return fetch(url, {
    method: 'post',
    body: JSON.stringify(review),
  }).then(response => {
    return response.json();
  }).then((data) => {
    // console.log(data);
    DBHelper.saveReviewsIntoIDB([data]);    
  }).catch((e) => {
    console.log('something went wrong', e);
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
 * Update the favorite status in idb for restaurant
 */
static updateRestaurantIsFavoriteInIDB(id) {
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
}

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Toggle favorite for restaurant link
   */
  static urlForToggleFavoriteLink(restaurant) {
    return  (`http://localhost:1337/restaurants/${restaurant.id}/?is_favorite=${restaurant.is_favorite == 'true' ? false:true}`)
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
   * Restaurant blured image URL.
   */
  static bluredImageUrlForRestaurant(restaurant) {
    // for development we need to remove "/mws-restaurant-stage-1"
    const url = window.location.href;
    if(url.startsWith('https')) {
      return (`/mws-restaurant-stage-1/img/${restaurant.photograph}`);
    }
    return (`/img/${restaurant.photograph || 10}-800_lazy_load.jpg`);    
  }

/**
 * Add  restaurant to favorite
 */
static addRestaurantToFavorite(url) {
  return fetch(url, {
    method: 'put'
  });
}

/**
 * save sync favorite links into idb
 */
static saveSyncFavoritesIntoIDB(favorite) {
  return DBHelper.openIDB().then((db) => {
    if(!db) return;
    const tx = db.transaction('sync-favorites', 'readwrite')
    const store = tx.objectStore('sync-favorites');
    store.put(favorite);
    return tx.complete;
  });
}
}