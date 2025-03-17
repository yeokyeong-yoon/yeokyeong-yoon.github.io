// Simple Page Views and Visitor Counter using localStorage
document.addEventListener('DOMContentLoaded', function() {
  // Only run on post pages
  if (!document.querySelector('.post')) {
    return;
  }

  // Get current page URL path as the unique identifier
  const pagePath = window.location.pathname;
  
  // Get the counter elements
  const pageViewsElement = document.getElementById('page-views');
  const uniqueVisitorsElement = document.getElementById('unique-visitors');
  
  if (!pageViewsElement || !uniqueVisitorsElement) return;
  
  // Initialize localStorage if needed
  if (!localStorage.getItem('pageViews')) {
    localStorage.setItem('pageViews', JSON.stringify({}));
  }
  
  if (!localStorage.getItem('uniqueVisitors')) {
    localStorage.setItem('uniqueVisitors', JSON.stringify({}));
  }
  
  if (!localStorage.getItem('visitedPages')) {
    localStorage.setItem('visitedPages', JSON.stringify({}));
  }
  
  // Get current counts
  const pageViews = JSON.parse(localStorage.getItem('pageViews'));
  const uniqueVisitors = JSON.parse(localStorage.getItem('uniqueVisitors'));
  const visitedPages = JSON.parse(localStorage.getItem('visitedPages'));
  
  // Update page views
  if (!pageViews[pagePath]) {
    pageViews[pagePath] = 0;
  }
  pageViews[pagePath]++;
  localStorage.setItem('pageViews', JSON.stringify(pageViews));
  pageViewsElement.textContent = pageViews[pagePath];
  
  // Update unique visitors
  if (!uniqueVisitors[pagePath]) {
    uniqueVisitors[pagePath] = 0;
  }
  
  if (!visitedPages[pagePath]) {
    visitedPages[pagePath] = true;
    uniqueVisitors[pagePath]++;
    localStorage.setItem('uniqueVisitors', JSON.stringify(uniqueVisitors));
    localStorage.setItem('visitedPages', JSON.stringify(visitedPages));
  }
  
  uniqueVisitorsElement.textContent = uniqueVisitors[pagePath];
}); 