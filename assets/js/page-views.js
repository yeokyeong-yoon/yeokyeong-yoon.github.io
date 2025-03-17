// Page Views Counter
document.addEventListener('DOMContentLoaded', function() {
  // Only run on post pages
  if (!document.querySelector('.post')) {
    return;
  }

  // Get current page URL path as the unique identifier
  const pagePath = window.location.pathname;
  
  // Get the counter element
  const pageViewsElement = document.getElementById('page-views');
  if (!pageViewsElement) return;
  
  // Get Firestore instance from firebase-config.js
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    const db = firebase.firestore();
    
    // Reference to the document for this page
    const pageRef = db.collection('pageViews').doc(pagePath);
    
    // Increment the view count
    pageRef.get().then((doc) => {
      if (doc.exists) {
        // Document exists, increment the count
        pageRef.update({
          count: firebase.firestore.FieldValue.increment(1)
        }).then(() => {
          // Get the updated count
          return pageRef.get();
        }).then((updatedDoc) => {
          // Display the updated count
          pageViewsElement.textContent = updatedDoc.data().count;
        });
      } else {
        // Document doesn't exist, create it with count 1
        pageRef.set({
          count: 1
        }).then(() => {
          pageViewsElement.textContent = '1';
        });
      }
    }).catch((error) => {
      console.error("Error updating page views:", error);
      pageViewsElement.textContent = '0';
    });
  } else {
    // Fallback to localStorage if Firebase is not available
    const views = localStorage.getItem('pageViews') ? JSON.parse(localStorage.getItem('pageViews')) : {};
    
    if (!views[pagePath]) {
      views[pagePath] = 0;
    }
    
    views[pagePath]++;
    localStorage.setItem('pageViews', JSON.stringify(views));
    pageViewsElement.textContent = views[pagePath].toString();
  }
}); 