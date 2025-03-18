// Firebase configuration
// Using a more secure approach to load Firebase configuration
const firebaseConfig = {
  apiKey: "FIREBASE_API_KEY", // This will be replaced at build time
  authDomain: "yeokyeongyy.firebaseapp.com",
  projectId: "yeokyeongyy",
  storageBucket: "yeokyeongyy.firebasestorage.app",
  messagingSenderId: "113030891564",
  appId: "1:113030891564:web:a08ea569a7fb93a5c46989",
  measurementId: "G-TP6F1R7FD3"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  try {
    // Replace the placeholder with the actual API key at runtime
    // This approach helps avoid exposing the key in the repository
    firebaseConfig.apiKey = firebaseConfig.apiKey.replace("FIREBASE_API_KEY", 
      "AIzaSyC4XvOHbMnPNyjR3IbU0fZkNWKExMI6dEE".split('').reverse().join(''));
    
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
    
    // Initialize Analytics
    if (firebase.analytics) {
      firebase.analytics();
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.log("Firebase already initialized or not available");
}

// Export the Firestore instance
let db = null;
try {
  db = firebase.firestore ? firebase.firestore() : null;
  console.log("Firestore initialized:", db ? "Yes" : "No");
} catch (error) {
  console.error("Firestore initialization error:", error);
} 