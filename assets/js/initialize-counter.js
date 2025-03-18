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
          return visitorRef.set({ 
            count: 1,
            createdAt: new Date().toISOString()
          });
        } else {
          // Document exists, get current count and increment
          const currentCount = doc.data().count || 0;
          console.log('Current visitor count:', currentCount);
          
          // Always increment the count for testing
          const newCount = currentCount + 1;
          
          // Update the counter
          return visitorRef.update({
            count: newCount,
            lastVisit: new Date().toISOString()
          }).then(() => {
            console.log('Incremented visitor count to:', newCount);
            // Display the count
            siteVisitorsElement.textContent = newCount;
          });
        }
      }).catch(error => {
        console.error('Error initializing visitor counter:', error);
      });
    }
    
    // Initialize page views counter if we're on a post page
    const pageViewsElement = document.getElementById('page-views');
    if (pageViewsElement) {
      console.log('Found page-views element, checking counter');
      
      // Get the current page path and convert it to a safe document ID
      const pagePath = window.location.pathname;
      console.log('Current page path:', pagePath);
      
      // Create a safe document ID by replacing all slashes with underscores
      const safeDocId = pagePath.replace(/\//g, '_');
      console.log('Safe document ID:', safeDocId);
      
      // Get the reference to the counter document
      const pageRef = db.collection('pageViews').doc(safeDocId);
      
      // First check if the document exists
      pageRef.get().then(doc => {
        console.log('Page views document exists:', doc.exists);
        
        if (!doc.exists) {
          // Create it with count 1
          console.log('Creating initial page views document');
          return pageRef.set({ 
            count: 1,
            path: pagePath,
            createdAt: new Date().toISOString()
          }).then(() => {
            console.log('Created document with count 1');
            pageViewsElement.textContent = '1';
          });
        } else {
          // Document exists, get current count
          const currentCount = doc.data().count || 0;
          console.log('Current page views:', currentCount);
          
          // Always increment the count for testing
          const newCount = currentCount + 1;
          
          // Update the counter
          return pageRef.update({
            count: newCount,
            lastVisit: new Date().toISOString()
          }).then(() => {
            console.log('Incremented page views to:', newCount);
            // Display the count
            pageViewsElement.textContent = newCount;
          });
        }
      }).catch(error => {
        console.error('Error initializing page views counter:', error);
      });
    }
  }, 1000); // Wait 1 second to ensure Firebase is initialized
}); 