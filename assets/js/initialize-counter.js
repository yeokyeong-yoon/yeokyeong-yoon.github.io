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
      console.log('Updated localStorage counter:', count);
      return;
    }

    console.log('Attempting to update Firestore counter...');
    const counterRef = doc(window.db, 'counters', 'global');
    console.log('Getting current counter value...');
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      console.log('Counter document does not exist, creating new one...');
      await setDoc(counterRef, {
        count: 1,
        lastUpdated: new Date().toISOString()
      });
      console.log('Created new counter document with count = 1');
    } else {
      console.log('Current counter value:', counterDoc.data());
      await updateDoc(counterRef, {
        count: increment(1),
        lastUpdated: new Date().toISOString()
      });
      console.log('Successfully incremented counter');
    }
  } catch (error) {
    console.error('Error updating counter:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    // Fallback to localStorage if Firestore fails
    const count = parseInt(localStorage.getItem('global_counter') || '0') + 1;
    localStorage.setItem('global_counter', count.toString());
    console.log('Fallback: Updated localStorage counter:', count);
  }
}

// Check for Firebase initialization
let initializationAttempts = 0;
const maxAttempts = 10;
const initializationInterval = setInterval(() => {
  initializationAttempts++;
  console.log(`Checking Firebase initialization (attempt ${initializationAttempts}/${maxAttempts})...`);
  
  if (window.db) {
    console.log('Firebase db found, proceeding with counter update...');
    clearInterval(initializationInterval);
    updateCounter();
  } else if (initializationAttempts >= maxAttempts) {
    console.warn('Firebase initialization timed out after', maxAttempts, 'attempts');
    clearInterval(initializationInterval);
    console.warn('Using localStorage fallback');
    updateCounter(); // This will use the fallback mode
  }
}, 1000); 