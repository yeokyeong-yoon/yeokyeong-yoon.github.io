import { collection, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Function to create a safe document ID from URL path
function createSafeDocId(path) {
  return path.replace(/\//g, '_').replace(/^_+|_+$/g, '');
}

// Function to track page view
async function trackPageView() {
  if (!window.db) {
    console.error('Firebase not initialized');
    return;
  }

  const path = window.location.pathname;
  const docId = createSafeDocId(path);
  const pageRef = doc(collection(window.db, 'pageViews'), docId);

  try {
    const docSnap = await getDoc(pageRef);
    
    if (!docSnap.exists()) {
      // Create new document for this page
      await setDoc(pageRef, {
        path: path,
        views: 1,
        lastViewed: new Date().toISOString()
      });
    } else {
      // Update existing document
      await updateDoc(pageRef, {
        views: increment(1),
        lastViewed: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

// Track page view when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase to be initialized
  const checkFirebase = setInterval(() => {
    if (window.db) {
      clearInterval(checkFirebase);
      trackPageView();
    }
  }, 100);

  // Clear interval after 10 seconds to prevent infinite checking
  setTimeout(() => clearInterval(checkFirebase), 10000);
}); 