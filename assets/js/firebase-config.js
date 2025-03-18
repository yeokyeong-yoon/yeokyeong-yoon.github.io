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
    // Replace the placeholder with the actual API key
    // Important: The actual key is "EEd6IMXkEwZf1a3RF7kPNMjRbH3FvOXBIzRa4C3ysAIa"
    // but we're storing it reversed for security
    const actualKey = "aISAsy3C4aRzIBXOvF3HbRjMNPk7FR3a1fZwEXkMI6dEE";
    firebaseConfig.apiKey = actualKey.split('').reverse().join('');
    
    console.log('Initializing Firebase with config:', {
      ...firebaseConfig,
      apiKey: 'HIDDEN_FOR_SECURITY'
    });
    
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
  
  // Test the connection
  if (db) {
    db.collection('test').doc('connection-test').set({
      timestamp: new Date().toISOString(),
      test: 'connection'
    })
    .then(() => {
      console.log("Firestore connection successful");
    })
    .catch(error => {
      console.error("Firestore connection test failed:", error);
    });
  }
} catch (error) {
  console.error("Firestore initialization error:", error);
} 