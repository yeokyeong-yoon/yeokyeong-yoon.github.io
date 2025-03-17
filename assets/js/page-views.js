// Page Views and Visitor Counter
document.addEventListener('DOMContentLoaded', function() {
  // Only run on post pages
  if (!document.querySelector('.post')) {
    return;
  }

  // Get current page URL path as the unique identifier
  const pagePath = window.location.pathname;
  
  // Get Firestore instance from firebase-config.js
  const db = firebase.firestore();
  
  // Update page views
  updatePageViews(db, pagePath);
  
  // Update unique visitors
  updateUniqueVisitors(db, pagePath);

  function updatePageViews(db, pagePath) {
    const pageViewsElement = document.getElementById('page-views');
    if (!pageViewsElement) return;
    
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
  }

  function updateUniqueVisitors(db, pagePath) {
    const uniqueVisitorsElement = document.getElementById('unique-visitors');
    if (!uniqueVisitorsElement) return;
    
    // Check if user has visited this page before
    const visitedPages = JSON.parse(localStorage.getItem('visitedPages') || '{}');
    const hasVisitedBefore = visitedPages[pagePath];
    
    // Reference to the document for this page
    const visitorRef = db.collection('uniqueVisitors').doc(pagePath);
    
    if (!hasVisitedBefore) {
      // Mark this page as visited
      visitedPages[pagePath] = true;
      localStorage.setItem('visitedPages', JSON.stringify(visitedPages));
      
      // Increment the unique visitor count
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
            uniqueVisitorsElement.textContent = updatedDoc.data().count;
          });
        } else {
          // Document doesn't exist, create it with count 1
          visitorRef.set({
            count: 1
          }).then(() => {
            uniqueVisitorsElement.textContent = '1';
          });
        }
      }).catch((error) => {
        console.error("Error updating unique visitors:", error);
        uniqueVisitorsElement.textContent = '0';
      });
    } else {
      // Just display the current count
      visitorRef.get().then((doc) => {
        if (doc.exists) {
          uniqueVisitorsElement.textContent = doc.data().count;
        } else {
          uniqueVisitorsElement.textContent = '0';
        }
      }).catch((error) => {
        console.error("Error getting unique visitors:", error);
        uniqueVisitorsElement.textContent = '0';
      });
    }
  }
}); 