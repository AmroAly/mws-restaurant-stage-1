let restaurant;
var map;
let reviews;

/**
 * Fetch restaurant and reviews as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if(restaurant) {
      self.restaurant = restaurant;
      fillBreadcrumb();
      // Fetch All Reviews;
      fetchReviews();
      addMarkerToMap(restaurant);
    }
  });
});

/**
 * Fetch Reviews
 */
fetchReviews = () => {
  var flag = false;
  DBHelper.fetchReviews((error, reviews) => {
    if(reviews) {
      // Fetch reviews by restaurant id
      const restaurant_id = getParameterByName('id');
      getReviewsByRestaurantId(restaurant_id, reviews);
    }
    if(!flag){
      fillReviewsHTML()
      flag = true;
    }
  });
}

/**
 * Filter reviews for each restaurant
 */
getReviewsByRestaurantId = (restaurant_id, reviews) => {
  self.reviews = reviews.filter((review) => {
    return review.restaurant_id == restaurant_id;
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name + ' photo';

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.setAttribute('role', 'row')

    const day = document.createElement('td');
    day.innerHTML = key;
    day.setAttribute('role', 'cell');
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.setAttribute('role', 'cell');
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.tabIndex = 0;
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  const my_date = new Date(review.createdAt);
  date.innerHTML = my_date.toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  li.tabIndex = 0;
  const label = `${review.name} said ${review.comments} and rated the restaurant ${review.rating} out of 5`;
  li.setAttribute('aria-label', label);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = window.location.href;
  a.setAttribute('aria-current', 'page');

  a.innerHTML = restaurant.name;
  li.appendChild(a);
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Add event listener for online state
 * So if there is any sync reviews in the IDB
 * Will resubmit them to the server
 */
window.addEventListener('online', function(e) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller.postMessage({ type: 'handle_sync_reviews' });
  }
  window.location.reload();
});

/**
 * Hanlding form submition
 */
document.querySelector('#review-form')
  .addEventListener('submit', function(e) {
    e.preventDefault();
    
    validateReviewFormFields((error, data) => {
      if(data) {
        document.getElementById("review-form").reset();
        document.getElementById('reviews-list').appendChild(createReviewHTML(data));

        // Register a Synchronization task
        if('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready
            .then((sw) => {
              data['id'] = Date.now();
              // console.log(data);
              DBHelper.saveSyncReviewsIntoIDB(data)
                .then(() => {
                  return sw.sync.register('sync-new-reviews');
                }).then(() => {
                  console.log('You review was saved for syncing!');
                }).catch((e) => {
                  console.log(e);
                });
            });
        } else {
          DBHelper.createPostReview(data);
        }
      }
  })
});

/**
 * Validate the form fields
 */
validateReviewFormFields = (callback) => {
  const restaurantId = getParameterByName('id')
  const name = document.querySelector('#name').value.trim();
  const rating = document.querySelector('#rating').value.trim();
  const comment = document.querySelector('#comment').value.trim();
  
  const data = {
    restaurant_id: restaurantId,
    name: name,
    rating: rating ? parseInt(rating): null,
    comments: comment  
  }

  const errors_ul = document.querySelector('#errors');
  errors_ul.innerHTML = '';
  let errors = false;
  Object.keys(data).forEach(function(k) {
    if (!data[k]) {
      errors = true;
      const error_li = document.createElement('li');
      error_li.appendChild(document.createTextNode(`The ${k} field can't be empty`));
      errors_ul.appendChild(error_li);
    }
  });

  data['createdAt'] = new Date().getTime();

  if(errors) {
    callback(true, null);
    return;
  }
  callback(null, data);
}

/**
 * Add marker to the map
 */
addMarkerToMap = (restaurant) => {
  let latlng = Object.values(restaurant.latlng);
  let url = `https://maps.googleapis.com/maps/api/staticmap?center=40.722216,-73.987501&markers=${latlng}&size=1000x700&zoom=12&key=AIzaSyC0p8sC70ZxYQhYydDLntxNX5BwzHP604E`;
  const img = document.querySelector('#map-image-detail');
  img.src = url;
  caches.open('restaurant-static-v2').then(cache => {
    return cache.add(url);
  });
}