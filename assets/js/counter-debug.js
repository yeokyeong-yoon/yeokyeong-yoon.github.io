// Counter Debug Tool
document.addEventListener('DOMContentLoaded', function() {
  // Log browser info
  console.log('================================');
  console.log('COUNTER DEBUG INFORMATION');
  console.log('================================');
  console.log('User Agent:', navigator.userAgent);
  console.log('Current page:', window.location.pathname);
  console.log('localStorage available:', typeof localStorage !== 'undefined');
  
  // Check Firebase availability
  console.log('Firebase available:', typeof firebase !== 'undefined');
  if (typeof firebase !== 'undefined') {
    console.log('Firebase version:', firebase.SDK_VERSION);
    console.log('Firestore available:', typeof firebase.firestore !== 'undefined');
    
    // Test Firebase connection
    try {
      if (firebase.firestore) {
        console.log('Testing Firestore connection...');
        const db = firebase.firestore();
        
        // Try to access a test collection
        db.collection('debug').doc('test')
          .set({
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
        testCollections.forEach(collection => {
          db.collection(collection).limit(1).get()
            .then(snapshot => {
              console.log(`${collection} collection read:`, snapshot.empty ? 'Empty' : 'Has documents ✅');
              if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                console.log(`Sample document ID:`, doc.id);
                console.log(`Sample document data:`, doc.data());
              }
            })
            .catch(error => {
              console.error(`${collection} collection read failed ❌:`, error);
            });
        });
      }
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
  debugInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
  debugInfo.style.color = '#fff';
  debugInfo.style.padding = '10px';
  debugInfo.style.borderRadius = '5px';
  debugInfo.style.fontSize = '12px';
  debugInfo.style.zIndex = '9999';
  debugInfo.style.maxWidth = '300px';
  debugInfo.style.fontFamily = 'monospace';
  
  debugInfo.innerHTML = `
    <div>Firebase: ${typeof firebase !== 'undefined' ? '✅' : '❌'}</div>
    <div>Firestore: ${typeof firebase !== 'undefined' && typeof firebase.firestore !== 'undefined' ? '✅' : '❌'}</div>
    <div>localStorage: ${typeof localStorage !== 'undefined' ? '✅' : '❌'}</div>
    <div>visitedSite: ${visitedSite || 'null'}</div>
    <div>localStorage Visitors: ${siteVisitors || '0'}</div>
    <button id="debug-reset" style="margin-top: 5px; padding: 3px 8px; background: #ff5722; border: none; color: white; border-radius: 3px;">Reset Local Storage</button>
    <button id="debug-close" style="margin-top: 5px; padding: 3px 8px; background: #ccc; border: none; color: black; border-radius: 3px;">Close</button>
  `;
  
  document.body.appendChild(debugInfo);
  
  // Add event listeners
  document.getElementById('debug-reset').addEventListener('click', function() {
    localStorage.removeItem('visitedSite');
    localStorage.removeItem('siteVisitors');
    localStorage.removeItem('pageViews');
    console.log('localStorage reset ✅');
    alert('Local storage has been reset. Refresh the page to see changes.');
  });
  
  document.getElementById('debug-close').addEventListener('click', function() {
    debugInfo.remove();
  });

  // Log the current counter elements
  const siteVisitorsElement = document.getElementById('site-visitors');
  const pageViewsElement = document.getElementById('page-views');
  
  console.log('Counter elements:');
  console.log('- site-visitors element:', siteVisitorsElement ? '✅' : '❌');
  if (siteVisitorsElement) {
    console.log('  Value:', siteVisitorsElement.textContent);
  }
  
  console.log('- page-views element:', pageViewsElement ? '✅' : '❌');
  if (pageViewsElement) {
    console.log('  Value:', pageViewsElement.textContent);
  }
  
  console.log('================================');
}); 