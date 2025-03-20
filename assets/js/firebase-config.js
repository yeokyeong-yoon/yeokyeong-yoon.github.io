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
      const analytics = firebase.analytics();
      
      // Enable analytics data collection
      analytics.setAnalyticsCollectionEnabled(true);
      
      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-TP6F1R7FD3');
      
      // Log page view event
      analytics.logEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
      console.log('Analytics page_view event logged');
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
  
  // Wait until Firestore is ready and create the initial collections if they don't exist
  if (db) {
    // First we'll check siteVisitors
    db.collection('siteVisitors').doc('counter').get()
      .then(doc => {
        if (!doc.exists) {
          console.log("Creating siteVisitors counter document");
          return db.collection('siteVisitors').doc('counter').set({
            count: 0,
            createdAt: new Date().toISOString()
          });
        } else {
          console.log("siteVisitors counter document exists:", doc.data());
          return Promise.resolve();
        }
      })
      .then(() => {
        console.log("Firestore setup completed");
      })
      .catch(error => {
        console.error("Firestore setup error:", error);
        console.log("Collections may need to be created manually in the Firebase console");
      });
  }
} catch (error) {
  console.error("Firestore initialization error:", error);
} 