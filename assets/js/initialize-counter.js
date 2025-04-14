// Initialize and fix Firebase counters
import { collection, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing counters manually (module mode)');
  
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
      const visitorRef = doc(collection(db, 'siteVisitors'), 'counter');
      
      // First check if the document exists
      getDoc(visitorRef).then(docSnapshot => {
        console.log('Visitor counter document exists:', docSnapshot.exists());
        
        if (!docSnapshot.exists()) {
          // Create it with count 1
          console.log('Creating initial counter document');
          return setDoc(visitorRef, { 
            count: 1,
            createdAt: new Date().toISOString()
          });
        } else {
          // Document exists, get current count and increment
          const currentCount = docSnapshot.data().count || 0;
          console.log('Current visitor count:', currentCount);
          
          // Always increment the count for testing
          const newCount = currentCount + 1;
          
          // Update the counter
          return updateDoc(visitorRef, {
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