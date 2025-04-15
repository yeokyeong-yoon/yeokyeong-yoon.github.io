// Firebase configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Using a more secure approach to load Firebase configuration
if (typeof window.firebaseConfigLoaded === 'undefined') {
  window.firebaseConfigLoaded = true;
  
  const firebaseConfig = {
    apiKey: "AIzaSyC4XvOHbMnPNyjR3IbU0fZkNWKExMI6dEE",
    authDomain: "yeokyeongyy.firebaseapp.com",
    projectId: "yeokyeongyy",
    storageBucket: "yeokyeongyy.firebasestorage.app",
    messagingSenderId: "113030891564",
    appId: "1:113030891564:web:a08ea569a7fb93a5c46989",
    measurementId: "G-TP6F1R7FD3"
  };

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    
    // Initialize Firestore
    const db = getFirestore(app);
    console.log("Firestore initialized successfully");
    
    // Make db available globally
    window.db = db;

    // Initialize counter document if it doesn't exist
    const counterRef = doc(collection(db, 'counters'), 'global');
    getDoc(counterRef).then((doc) => {
      if (!doc.exists()) {
        console.log("Creating global counter document");
        setDoc(counterRef, {
          count: 0,
          lastUpdated: new Date().toISOString()
        });
      } else {
        console.log("global counter document exists:", doc.data());
        return Promise.resolve();
      }
    }).then(() => {
      console.log("Firestore setup completed");
    }).catch((error) => {
      console.error("Error initializing counter:", error);
    });
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.log("Firebase config already loaded, skipping initialization");
}

// Export the initialization function for potential reuse
export function initializeFirebase() {
  if (!window.db) {
    console.error("Firebase not initialized");
    return null;
  }
  return window.db;
} 