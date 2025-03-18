// Site Visitors Counter
document.addEventListener('DOMContentLoaded', function() {
  // Only run on home page
  if (!document.querySelector('.home-container')) {
    console.log('Not on home page, skipping site visitor counter');
    return;
  }

  console.log('Initializing site visitor counter');

  const visitorCountElement = document.getElementById('site-visitors');
  if (!visitorCountElement) {
    console.error('Site visitors element not found');
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
    console.log('Using Firestore for site visitors');
    
    // Check if this is a new session
    const sessionKey = 'visitorSession';
    const hasActiveSession = sessionStorage.getItem(sessionKey);
    
    // Print out all items in localStorage for debugging
    console.log('localStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`- ${key}: ${localStorage.getItem(key)}`);
    }
    
    // Reference to the document for site visitors
    const visitorRef = db.collection('siteVisitors').doc('counter');
    
    if (!hasActiveSession) {
      // Mark this session
      sessionStorage.setItem(sessionKey, 'true');
      console.log('New session, incrementing visitor count');
      
      // Increment the visitor count
      visitorRef.get().then((doc) => {
        console.log('Visitor counter document exists:', doc.exists);
        
        if (doc.exists) {
          // Document exists, increment the count
          const currentCount = doc.data().count || 0;
          console.log('Current visitor count:', currentCount);
          
          return visitorRef.update({
            count: firebase.firestore.FieldValue.increment(1)
          }).then(() => {
            // Get the updated count
            return visitorRef.get();
          }).then((updatedDoc) => {
            // Display the updated count
            const newCount = updatedDoc.data().count;
            console.log('Updated visitor count:', newCount);
            visitorCountElement.textContent = newCount;
          });
        } else {
          // Document doesn't exist, create it with count 1
          console.log('Creating new visitor counter document');
          return visitorRef.set({
            count: 1,
            createdAt: new Date().toISOString()
          }).then(() => {
            console.log('New visitor document created with count: 1');
            visitorCountElement.textContent = '1';
          });
        }
      }).catch((error) => {
        console.error("Error with Firestore operation:", error);
        useLocalStorage();
      });
    } else {
      // Just display the current count
      console.log('Existing session, just showing the count');
      visitorRef.get().then((doc) => {
        if (doc.exists) {
          const count = doc.data().count;
          console.log('Retrieved visitor count:', count);
          visitorCountElement.textContent = count;
        } else {
          console.log('Visitor counter document does not exist');
          visitorCountElement.textContent = '0';
        }
      }).catch((error) => {
        console.error("Error getting site visitors:", error);
        useLocalStorage();
      });
    }
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    useLocalStorage();
  }
  
  // Fallback to localStorage if Firebase is not available or fails
  function useLocalStorage() {
    console.log('Falling back to localStorage for site visitors');
    try {
      const visitors = localStorage.getItem('siteVisitors') ? parseInt(localStorage.getItem('siteVisitors')) : 0;
      const hasVisitedBefore = localStorage.getItem('visitedSite');
      
      if (!hasVisitedBefore) {
        localStorage.setItem('visitedSite', 'true');
        localStorage.setItem('siteVisitors', (visitors + 1).toString());
        console.log('Incremented local visitor count to:', visitors + 1);
        visitorCountElement.textContent = (visitors + 1).toString();
      } else {
        console.log('Using existing local visitor count:', visitors);
        visitorCountElement.textContent = visitors.toString();
      }
    } catch (error) {
      console.error("Error using localStorage:", error);
      visitorCountElement.textContent = '0';
    }
  }
}); 