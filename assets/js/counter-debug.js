// Import the functions you need from the SDKs you need
import { doc, collection, setDoc, query, getDocs, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Only run in development environment
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Log browser information
  console.log('Debug Info:');
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Current Page:', window.location.pathname);
  
  // Check Firebase availability
  if (window.db) {
    console.log('- Firebase: Available ✅');
    
    // Test Firestore write
    const testDoc = doc(window.db, 'debug', 'test');
    setDoc(testDoc, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      path: window.location.pathname
    }).then(() => {
      console.log('- Firestore: Write test successful ✅');
    }).catch(error => {
      console.error('- Firestore: Write test failed ❌', error);
    });
    
    // Test Firestore read for collections
    const collections = ['pageViews', 'siteVisitors', 'debug'];
    collections.forEach(collectionName => {
      const q = query(collection(window.db, collectionName), limit(1));
      getDocs(q).then(snapshot => {
        console.log(`- ${collectionName}: ${snapshot.empty ? 'No documents ❌' : 'Has documents ✅'}`);
      }).catch(error => {
        console.error(`- ${collectionName}: Read test failed ❌`, error);
      });
    });
  } else {
    console.log('- Firebase: Not available ❌');
  }
  
  // Check localStorage availability
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('- localStorage: Available ✅');
  } catch (error) {
    console.log('- localStorage: Not available ❌');
  }
} 