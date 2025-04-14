import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

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
  
  // Check if Firebase db is available globally
  if (!window.db) {
    console.error('Firestore db is not available');
    useLocalStorage();
    return;
  }
  
  try {
    console.log('Using Firestore for site visitors');
    
    // Use a random ID for testing to always count as a new visit
    const sessionKey = 'visitorSession_' + Math.random();
    console.log('Created new session key:', sessionKey);
    
    // For testing - always increment
    const alwaysIncrement = true;
    
    // Reference to the document for site visitors
    const visitorRef = doc(window.db, 'siteVisitors', 'counter');
    
    // Now always increment the counter during testing
    console.log('Always incrementing visitor count for testing');
    
    // Increment the visitor count
    getDoc(visitorRef).then((docSnapshot) => {
      console.log('Visitor counter document exists:', docSnapshot.exists());
      
      if (docSnapshot.exists()) {
        // Document exists, increment the count
        const currentCount = docSnapshot.data().count || 0;
        console.log('Current visitor count:', currentCount);
        
        // Increment by 1
        const newCount = currentCount + 1;
        
        return updateDoc(visitorRef, {
          count: newCount,
          lastVisit: new Date().toISOString()
        }).then(() => {
          // Display the updated count
          console.log('Incremented visitor count to:', newCount);
          visitorCountElement.textContent = newCount;
        });
      } else {
        // Document doesn't exist, create it with count 1
        console.log('Creating new visitor counter document');
        return setDoc(visitorRef, {
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
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    useLocalStorage();
  }
  
  // Fallback to localStorage if Firebase is not available or fails
  function useLocalStorage() {
    console.log('Falling back to localStorage for site visitors');
    try {
      const visitors = localStorage.getItem('siteVisitors') ? parseInt(localStorage.getItem('siteVisitors')) : 0;
      
      // Always increment for testing
      const newCount = visitors + 1;
      localStorage.setItem('siteVisitors', newCount.toString());
      console.log('Incremented local visitor count to:', newCount);
      visitorCountElement.textContent = newCount.toString();
    } catch (error) {
      console.error("Error using localStorage:", error);
      visitorCountElement.textContent = '0';
    }
  }
}); 