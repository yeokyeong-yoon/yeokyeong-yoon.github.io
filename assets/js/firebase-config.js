// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore';

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
    
    // Check and initialize counter document
    const counterRef = doc(collection(db, 'siteVisitors'), 'counter');
    getDoc(counterRef)
      .then(docSnapshot => {
        if (!docSnapshot.exists()) {
          console.log("Creating siteVisitors counter document");
          return setDoc(counterRef, {
            count: 0,
            createdAt: new Date().toISOString()
          });
        } else {
          console.log("siteVisitors counter document exists:", docSnapshot.data());
          return Promise.resolve();
        }
      })
      .then(() => {
        console.log("Firestore setup completed");
        // Make db available globally
        window.db = db;
      })
      .catch(error => {
        console.error("Firestore setup error:", error);
        console.log("Collections may need to be created manually in the Firebase console");
      });
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.log("Firebase config already loaded, skipping initialization");
} 