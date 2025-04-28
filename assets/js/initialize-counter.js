// Initialize and fix Firebase counters
import { collection, doc, getDoc, setDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

console.log('initialize-counter.js: Module loaded');

// Function to update the counter
async function updateCounter() {
  try {
    if (!window.db) {
      console.error('Firebase db object not found');
      return;
    }

    // Check if we're in fallback mode
    if (window.db.fallback) {
      console.warn('Using localStorage fallback for counter');
      const count = parseInt(localStorage.getItem('global_counter') || '0') + 1;
      localStorage.setItem('global_counter', count.toString());
      return;
    }

    const counterRef = doc(window.db, 'counters', 'global');
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      await setDoc(counterRef, {
        count: 1,
        lastUpdated: new Date().toISOString()
      });
    } else {
      await updateDoc(counterRef, {
        count: increment(1),
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error updating counter:', error);
    // Fallback to localStorage if Firestore fails
    const count = parseInt(localStorage.getItem('global_counter') || '0') + 1;
    localStorage.setItem('global_counter', count.toString());
  }
}

// Check for Firebase initialization
let initializationAttempts = 0;
const maxAttempts = 10;
const initializationInterval = setInterval(() => {
  initializationAttempts++;
  
  if (window.db) {
    clearInterval(initializationInterval);
    updateCounter();
  } else if (initializationAttempts >= maxAttempts) {
    clearInterval(initializationInterval);
    console.warn('Firebase initialization timed out, using localStorage fallback');
    updateCounter(); // This will use the fallback mode
  }
}, 1000); 