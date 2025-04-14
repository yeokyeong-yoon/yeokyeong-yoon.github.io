// Non-module version of the Firebase counter
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing counters (non-module mode)');
  
  // Wait a bit to ensure Firebase is fully loaded
  setTimeout(function() {
    // Check if Firebase is initialized
    if (typeof window.db === 'undefined') {
      console.error('Firebase or Firestore not available');
      return;
    }
    
    const db = window.db;
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
        console.error('Error updating visitor count:', error);
      });
    }
  }, 1000); // Wait 1 second for Firebase to initialize
}); 