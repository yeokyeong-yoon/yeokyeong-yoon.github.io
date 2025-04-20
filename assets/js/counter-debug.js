// Counter Debug Tool
document.addEventListener('DOMContentLoaded', function() {
  // Log browser info
  console.log('================================');
  console.log('COUNTER DEBUG INFORMATION');
  console.log('================================');
  console.log('User Agent:', navigator.userAgent);
  console.log('Current page:', window.location.pathname);
  console.log('localStorage available:', typeof localStorage !== 'undefined');
  
  // Check Firebase availability using window.db instead of firebase object
  console.log('Firebase available:', typeof window.db !== 'undefined');
  if (typeof window.db !== 'undefined') {
    console.log('Firestore available: true');
    
    // Test Firebase connection
    try {
      console.log('Testing Firestore connection...');
      const db = window.db;
      
      // Try to access a test collection
      const testRef = doc(collection(db, 'debug'), 'test');
      setDoc(testRef, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        path: window.location.pathname
      })
      .then(() => {
        console.log('Firestore write successful ✅');
      })
      .catch(error => {
        console.error('Firestore write failed ❌', error);
      });
      
      // Try to read data
      const testCollections = ['pageViews', 'siteVisitors', 'debug'];
      testCollections.forEach(collectionName => {
        const q = query(collection(db, collectionName), limit(1));
        getDocs(q)
          .then(snapshot => {
            console.log(`${collectionName} collection read:`, snapshot.empty ? 'Empty' : 'Has documents ✅');
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              console.log(`Sample document ID:`, doc.id);
              console.log(`Sample document data:`, doc.data());
            }
          })
          .catch(error => {
            console.error(`${collectionName} collection read failed ❌:`, error);
          });
      });
    } catch (error) {
      console.error('Firebase test error:', error);
    }
  }
  
  // Check visitor localStorage
  const visitedSite = localStorage.getItem('visitedSite');
  const siteVisitors = localStorage.getItem('siteVisitors');
  const pageViews = localStorage.getItem('pageViews');
  
  console.log('localStorage state:');
  console.log('- visitedSite:', visitedSite);
  console.log('- siteVisitors:', siteVisitors);
  console.log('- pageViews:', pageViews ? JSON.parse(pageViews) : null);
  
  // Add debug elements to the page
  const debugInfo = document.createElement('div');
  debugInfo.style.position = 'fixed';
  debugInfo.style.bottom = '10px';
  debugInfo.style.right = '10px';
  debugInfo.style.background = 'rgba(0,0,0,0.8)';
  debugInfo.style.color = 'white';
  debugInfo.style.padding = '10px';
  debugInfo.style.borderRadius = '4px';
  debugInfo.style.fontFamily = 'monospace';
  debugInfo.style.fontSize = '12px';
  debugInfo.style.zIndex = '9999';
  
  // Add debug info content
  debugInfo.innerHTML = `
    <div>Debug Info:</div>
    <div>Firebase: ${typeof window.db !== 'undefined' ? '✅' : '❌'}</div>
    <div>localStorage: ${typeof localStorage !== 'undefined' ? '✅' : '❌'}</div>
  `;
  
  document.body.appendChild(debugInfo);
}); 