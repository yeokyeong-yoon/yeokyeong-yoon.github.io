// Firebase configuration
// Using the Firebase configuration provided
const firebaseConfig = {
  apiKey: "AIzaSyC4XvOHbMnPNyjR3IbU0fZkNWKExMI6dEE",
  authDomain: "yeokyeongyy.firebaseapp.com",
  projectId: "yeokyeongyy",
  storageBucket: "yeokyeongyy.firebasestorage.app",
  messagingSenderId: "113030891564",
  appId: "1:113030891564:web:a08ea569a7fb93a5c46989",
  measurementId: "G-TP6F1R7FD3"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  // Initialize Analytics
  firebase.analytics();
}

// Export the Firestore instance
const db = firebase.firestore(); 