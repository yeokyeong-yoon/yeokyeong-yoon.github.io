// Initialize and fix Firebase counters
import { collection, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log('initialize-counter.js: Module loaded');

// Function to update the counter
async function updateCounter() {
  console.log('updateCounter: Starting counter update process');
  
  if (!window.db) {
    console.error('updateCounter: Firebase db object not found in window object');
    console.error('Current window.db value:', window.db);
    throw new Error('Firebase db object not found');
  }

  console.log('updateCounter: Firebase db object found, proceeding with counter update');
  
  try {
    const db = window.db;
    console.log('updateCounter: Creating reference to counters/global document');
    const counterRef = doc(collection(db, 'counters'), 'global');
    
    console.log('updateCounter: Fetching current counter document');
    const docSnap = await getDoc(counterRef);
    console.log('updateCounter: Document exists:', docSnap.exists());

    if (!docSnap.exists()) {
      console.log('updateCounter: Creating new counter document');
      // Create initial counter
      await setDoc(counterRef, {
        count: 1,
        lastUpdated: new Date().toISOString()
      });
      console.log('updateCounter: Created initial counter with count 1');
    } else {
      console.log('updateCounter: Current counter value:', docSnap.data().count);
      // Increment existing counter
      console.log('updateCounter: Incrementing counter');
      await updateDoc(counterRef, {
        count: increment(1),
        lastUpdated: new Date().toISOString()
      });
      const newCount = (docSnap.data().count || 0) + 1;
      console.log('updateCounter: Successfully incremented counter to:', newCount);
    }
  } catch (error) {
    console.error('updateCounter: Error updating counter:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw error; // Re-throw the error to trigger fallback
  }
}

// Initialize when the module loads
console.log('initialize-counter.js: Starting initialization');
try {
  // Wait for Firebase to be initialized
  console.log('Setting up Firebase initialization check interval');
  let checkCount = 0;
  let checkFirebase = null;
  
  // Function to check for Firebase initialization
  const checkForFirebase = () => {
    checkCount++;
    console.log(`Checking for Firebase initialization (attempt ${checkCount})...`);
    
    if (window.db) {
      console.log('Firebase db object found, clearing interval');
      if (checkFirebase) {
        clearInterval(checkFirebase);
        checkFirebase = null;
      }
      updateCounter().catch(error => {
        console.error('Failed to update counter:', error);
        // Don't throw here, just log the error
      });
    } else {
      console.log('Firebase db object not found yet');
    }
  };
  
  // Start checking
  checkFirebase = setInterval(checkForFirebase, 100);
  
  // Clear interval after 10 seconds to prevent infinite checking
  setTimeout(() => {
    if (checkFirebase) {
      console.log('Firebase initialization check timed out after 10 seconds');
      clearInterval(checkFirebase);
      checkFirebase = null;
      
      // Only throw if Firebase is still not initialized
      if (!window.db) {
        console.error('Firebase initialization timed out - Firebase not available');
        throw new Error('Firebase initialization timeout');
      } else {
        console.log('Firebase is already initialized, timeout is safe to ignore');
      }
    }
  }, 10000);
} catch (error) {
  console.error('initialize-counter.js: Initialization failed:', error);
  // Don't re-throw here, just log the error
} 