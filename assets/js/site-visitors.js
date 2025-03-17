// Site Visitors Counter
document.addEventListener('DOMContentLoaded', function() {
  // Only run on home page
  if (!document.querySelector('.home-container')) {
    return;
  }

  const visitorCountElement = document.getElementById('site-visitors');
  if (!visitorCountElement) return;
  
  // Get Firestore instance from firebase-config.js
  if (typeof firebase !== 'undefined' && firebase.firestore) {
    const db = firebase.firestore();
    
    // Check if user has visited the site before
    const hasVisitedBefore = localStorage.getItem('visitedSite');
    
    // Reference to the document for site visitors
    const visitorRef = db.collection('siteVisitors').doc('counter');
    
    if (!hasVisitedBefore) {
      // Mark the site as visited
      localStorage.setItem('visitedSite', 'true');
      
      // Increment the visitor count
      visitorRef.get().then((doc) => {
        if (doc.exists) {
          // Document exists, increment the count
          visitorRef.update({
            count: firebase.firestore.FieldValue.increment(1)
          }).then(() => {
            // Get the updated count
            return visitorRef.get();
          }).then((updatedDoc) => {
            // Display the updated count
            visitorCountElement.textContent = updatedDoc.data().count;
          });
        } else {
          // Document doesn't exist, create it with count 1
          visitorRef.set({
            count: 1
          }).then(() => {
            visitorCountElement.textContent = '1';
          });
        }
      }).catch((error) => {
        console.error("Error updating site visitors:", error);
        visitorCountElement.textContent = '0';
      });
    } else {
      // Just display the current count
      visitorRef.get().then((doc) => {
        if (doc.exists) {
          visitorCountElement.textContent = doc.data().count;
        } else {
          visitorCountElement.textContent = '0';
        }
      }).catch((error) => {
        console.error("Error getting site visitors:", error);
        visitorCountElement.textContent = '0';
      });
    }
  } else {
    // Fallback to localStorage if Firebase is not available
    const visitors = localStorage.getItem('siteVisitors') ? parseInt(localStorage.getItem('siteVisitors')) : 0;
    const hasVisitedBefore = localStorage.getItem('visitedSite');
    
    if (!hasVisitedBefore) {
      localStorage.setItem('visitedSite', 'true');
      localStorage.setItem('siteVisitors', (visitors + 1).toString());
      visitorCountElement.textContent = (visitors + 1).toString();
    } else {
      visitorCountElement.textContent = visitors.toString();
    }
  }
}); 