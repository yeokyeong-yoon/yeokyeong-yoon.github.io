// Initialize and fix Firebase counters
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing counters manually');
  
  // Wait a bit to ensure Firebase is fully loaded
  setTimeout(function() {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !firebase.firestore) {
      console.error('Firebase or Firestore not available');
      return;
    }
    
    const db = firebase.firestore();
    console.log('Connected to Firestore for counter initialization');
    
    // Initialize site visitors counter if we're on the home page
    const siteVisitorsElement = document.getElementById('site-visitors');
    if (siteVisitorsElement) {
      console.log('Found site-visitors element, checking counter');
      
      // Get the reference to the counter document
      const visitorRef = db.collection('siteVisitors').doc('counter');
      
      // First check if the document exists
      visitorRef.get().then(doc => {
        console.log('Visitor counter document exists:', doc.exists);
        
        if (!doc.exists) {
          // Create it with count 1
          console.log('Creating initial counter document');
          return visitorRef.set({ count: 1 });
        } else {
          // Document exists, check if count is valid
          const count = doc.data().count;
          console.log('Current visitor count:', count);
          
          if (count === undefined || count === null || isNaN(count)) {
            // Reset the counter if the count is invalid
            console.log('Invalid count, resetting to 1');
            return visitorRef.set({ count: 1 });
          }
          
          // Otherwise just display the count
          siteVisitorsElement.textContent = count;
          return Promise.resolve();
        }
      }).then(() => {
        // Check again to make sure the count is displayed
        return visitorRef.get();
      }).then(doc => {
        if (doc.exists) {
          const count = doc.data().count;
          console.log('Final visitor count:', count);
          siteVisitorsElement.textContent = count;
        }
      }).catch(error => {
        console.error('Error initializing visitor counter:', error);
      });
    }
    
    // Initialize page views counter if we're on a post page
    const pageViewsElement = document.getElementById('page-views');
    if (pageViewsElement) {
      console.log('Found page-views element, checking counter');
      
      // Get the current page path
      const pagePath = window.location.pathname;
      console.log('Current page path:', pagePath);
      
      // Get the reference to the counter document
      const pageRef = db.collection('pageViews').doc(pagePath);
      
      // First check if the document exists
      pageRef.get().then(doc => {
        console.log('Page views document exists:', doc.exists);
        
        if (!doc.exists) {
          // Create it with count 1
          console.log('Creating initial page views document');
          return pageRef.set({ count: 1 });
        } else {
          // Document exists, check if count is valid
          const count = doc.data().count;
          console.log('Current page views:', count);
          
          if (count === undefined || count === null || isNaN(count)) {
            // Reset the counter if the count is invalid
            console.log('Invalid count, resetting to 1');
            return pageRef.set({ count: 1 });
          }
          
          // Otherwise display the count
          pageViewsElement.textContent = count;
          return Promise.resolve();
        }
      }).then(() => {
        // Check again to make sure the count is displayed
        return pageRef.get();
      }).then(doc => {
        if (doc.exists) {
          const count = doc.data().count;
          console.log('Final page views count:', count);
          pageViewsElement.textContent = count;
        }
      }).catch(error => {
        console.error('Error initializing page views counter:', error);
      });
    }
  }, 1000); // Wait 1 second to ensure Firebase is initialized
}); 