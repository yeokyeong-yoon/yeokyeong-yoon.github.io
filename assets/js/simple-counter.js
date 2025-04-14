// Simple Counter using localStorage
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a post page
  if (document.querySelector('.post')) {
    // Handle page views for post pages
    const pagePath = window.location.pathname;
    const pageViewsElement = document.getElementById('page-views');
    
    if (pageViewsElement) {
      // Initialize localStorage if needed
      if (!localStorage.getItem('pageViews')) {
        localStorage.setItem('pageViews', JSON.stringify({}));
      }
      
      // Get current counts
      const pageViews = JSON.parse(localStorage.getItem('pageViews'));
      
      // Update page views
      if (!pageViews[pagePath]) {
        pageViews[pagePath] = 0;
      }
      pageViews[pagePath]++;
      localStorage.setItem('pageViews', JSON.stringify(pageViews));
      pageViewsElement.textContent = pageViews[pagePath];
    }
  }
  
  // Check if we're on the home page
  if (document.querySelector('.home-container')) {
    // Handle site visitors for home page
    const siteVisitorsElement = document.getElementById('site-visitors');
    
    if (siteVisitorsElement) {
      // Initialize localStorage if needed
      if (!localStorage.getItem('siteVisitors')) {
        localStorage.setItem('siteVisitors', '0');
      }
      
      // Get current count
      let siteVisitors = parseInt(localStorage.getItem('siteVisitors'));
      
      // Check if this is a new visitor
      const hasVisitedBefore = localStorage.getItem('visitedSite');
      
      if (!hasVisitedBefore) {
        // Mark as visited
        localStorage.setItem('visitedSite', 'true');
        
        // Increment visitor count
        siteVisitors++;
        localStorage.setItem('siteVisitors', siteVisitors.toString());
      }
      
      // Display the count
      siteVisitorsElement.textContent = siteVisitors.toString();
    }
  }
});

// Simple counter fallback
document.addEventListener('DOMContentLoaded', function() {
  console.log('Using simple counter fallback');
  
  // Get the visitor element
  const visitorElement = document.getElementById('site-visitors');
  if (visitorElement) {
    // Get the current count from localStorage or start at 1
    let count = parseInt(localStorage.getItem('visitorCount')) || 1;
    
    // Increment the count
    count++;
    
    // Save the new count
    localStorage.setItem('visitorCount', count);
    
    // Update the display
    visitorElement.textContent = count;
    
    console.log('Simple counter updated to:', count);
  }
}); 