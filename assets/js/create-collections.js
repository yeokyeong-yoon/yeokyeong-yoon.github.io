// Manual collection creation script for Firebase
// This script is used once to create the necessary collections in Firestore

document.addEventListener('DOMContentLoaded', function() {
  console.log('Running collection initialization script');

  // Wait for Firebase to load
  setTimeout(function() {
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.error('Firebase or Firestore not available');
      alert('Firebase or Firestore not available');
      return;
    }

    console.log('Firebase is available, creating collections');
    const db = firebase.firestore();

    // Create or update the site visitors counter
    db.collection('siteVisitors').doc('counter').set({
      count: 0,
      createdAt: new Date().toISOString()
    })
    .then(() => {
      console.log('siteVisitors collection and counter document created');
      return db.collection('pageViews').doc('home').set({
        count: 0,
        path: '/',
        createdAt: new Date().toISOString()
      });
    })
    .then(() => {
      console.log('pageViews collection and home document created');
      alert('Firebase collections created successfully! Refresh the page to see them working.');
    })
    .catch(error => {
      console.error('Error creating collections:', error);
      alert('Error creating collections: ' + error.message);
    });
  }, 2000);
}); 