// Page Views Counter
document.addEventListener('DOMContentLoaded', function() {
  // Only run on post pages
  if (!document.querySelector('.post')) {
    console.log('Not a post page, skipping page view counter');
    return;
  }

  console.log('Initializing page view counter');
  
  // Get current page URL path as the unique identifier
  const pagePath = window.location.pathname;
  console.log('Current page path:', pagePath);
  
  // Get the counter element
  const pageViewsElement = document.getElementById('page-views');
  if (!pageViewsElement) {
    console.error('Page views element not found');
    return;
  }
  
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.error('Firebase is not loaded');
    useLocalStorage();
    return;
  }
  
  // Get Firestore instance
  try {
    // Check if Firestore is available
    if (!firebase.firestore) {
      console.error('Firestore is not available');
      useLocalStorage();
      return;
    }
    
    const db = firebase.firestore();
    console.log('Using Firestore for page views');
    
    // Reference to the document for this page
    const pageRef = db.collection('pageViews').doc(pagePath);
    
    // Increment the view count
    pageRef.get().then((doc) => {
      console.log('Firestore document exists:', doc.exists);
      
      if (doc.exists) {
        // Document exists, increment the count
        const currentCount = doc.data().count || 0;
        console.log('Current view count:', currentCount);
        
        return pageRef.update({
          count: firebase.firestore.FieldValue.increment(1)
        }).then(() => {
          // Get the updated count
          return pageRef.get();
        }).then((updatedDoc) => {
          // Display the updated count
          const newCount = updatedDoc.data().count;
          console.log('Updated view count:', newCount);
          pageViewsElement.textContent = newCount;
        });
      } else {
        // Document doesn't exist, create it with count 1
        console.log('Creating new page view document');
        return pageRef.set({
          count: 1
        }).then(() => {
          console.log('New document created with count: 1');
          pageViewsElement.textContent = '1';
        });
      }
    }).catch((error) => {
      console.error("Error with Firestore operation:", error);
      useLocalStorage();
    });
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    useLocalStorage();
  }
  
  // Fallback to localStorage if Firebase is not available or fails
  function useLocalStorage() {
    console.log('Falling back to localStorage for page views');
    try {
      const viewsData = localStorage.getItem('pageViews');
      const views = viewsData ? JSON.parse(viewsData) : {};
      
      if (!views[pagePath]) {
        views[pagePath] = 0;
      }
      
      views[pagePath]++;
      localStorage.setItem('pageViews', JSON.stringify(views));
      console.log('Local storage page views:', views[pagePath]);
      pageViewsElement.textContent = views[pagePath].toString();
    } catch (error) {
      console.error("Error using localStorage:", error);
      pageViewsElement.textContent = '0';
    }
  }
}); 