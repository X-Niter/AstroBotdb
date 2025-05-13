/**
 * AstroBot AI - Sidebar Overflow Fix
 * 
 * This script provides dynamic fixes for sidebar clipping and
 * left-side positioning issues that can't be solved with CSS alone.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Apply fixes when the DOM is fully loaded
  fixSidebarIssues();
  
  // Also apply fixes on window resize to handle responsive layout changes
  window.addEventListener('resize', debounce(fixSidebarIssues, 150));
  
  // Set up mutation observer to detect dynamic content changes
  setupMutationObserver();
});

/**
 * Apply comprehensive fixes to sidebar elements
 */
function fixSidebarIssues() {
  // Fix all sidebar elements
  const sidebarElements = document.querySelectorAll(
    '.cosmic-sidebar, .side-nav, .sidebar, .md-sidebar, ' +
    '.side-navigation, #sidebarMenu, .side-navbar-astro'
  );
  
  sidebarElements.forEach(sidebar => {
    if (sidebar) {
      // Ensure proper positioning
      sidebar.style.left = '0';
      sidebar.style.transform = 'none';
      sidebar.style.marginLeft = '0';
      sidebar.style.maxWidth = '16rem';
      sidebar.style.overflowX = 'hidden';
      
      // Check for and fix content overflows
      const sidebarContent = sidebar.querySelector('.cosmic-sidebar-content') || 
                            sidebar.querySelector('.sidebar-content') ||
                            sidebar.querySelector('.md-sidebar__scrollwrap');
      
      if (sidebarContent) {
        sidebarContent.style.overflowX = 'hidden';
        sidebarContent.style.maxWidth = '100%';
        
        // Find and fix any overflowing elements inside the sidebar content
        const children = sidebarContent.querySelectorAll('*');
        children.forEach(child => {
          if (isElementOverflowing(child, sidebarContent)) {
            child.style.maxWidth = '100%';
            child.style.boxSizing = 'border-box';
            child.style.overflowWrap = 'break-word';
            child.style.wordWrap = 'break-word';
          }
        });
      }
      
      // Fix specific common issues with sidebar navigation links
      const navLinks = sidebar.querySelectorAll('a');
      navLinks.forEach(link => {
        // Ensure links have proper text handling
        link.style.overflowWrap = 'break-word';
        link.style.wordWrap = 'break-word';
        link.style.whiteSpace = 'normal';
        
        // Fix icon alignment
        const icon = link.querySelector('i');
        if (icon) {
          icon.style.minWidth = '1.5rem';
          icon.style.textAlign = 'center';
        }
      });
    }
  });
  
  // Fix main content margins if sidebar exists
  const hasSidebar = document.querySelector('.cosmic-sidebar, .sidebar, .side-nav, .md-sidebar');
  const contentElements = document.querySelectorAll('.main-content, .content-wrapper, .content-area, .cosmic-content');
  
  if (hasSidebar && contentElements.length > 0) {
    const isMobile = window.innerWidth < 768;
    const isSidebarCollapsed = document.querySelector('.cosmic-sidebar.collapsed, .sidebar.collapsed');
    
    contentElements.forEach(content => {
      if (isMobile) {
        // Reset margins on mobile
        content.style.marginLeft = '0';
        content.style.width = '100%';
        content.style.maxWidth = '100%';
      } else if (isSidebarCollapsed) {
        // Adjust for collapsed sidebar
        content.style.marginLeft = '5rem';
        content.style.width = 'calc(100% - 5rem)';
        content.style.maxWidth = 'calc(100% - 5rem)';
      } else {
        // Normal sidebar margins
        content.style.marginLeft = '16rem';
        content.style.width = 'calc(100% - 16rem)';
        content.style.maxWidth = 'calc(100% - 16rem)';
      }
    });
  }
  
  // Fix any dropdown menus in the sidebar that might be clipping
  const dropdownMenus = document.querySelectorAll('.cosmic-navbar-dropdown-content, .dropdown-menu');
  dropdownMenus.forEach(menu => {
    const rect = menu.getBoundingClientRect();
    if (rect.left < 0) {
      menu.style.left = '0';
      menu.style.right = 'auto';
    }
  });
  
  // Fix for specific documentation sidebar issue
  const docSidebar = document.querySelector('.md-sidebar--primary');
  if (docSidebar) {
    docSidebar.style.right = 'auto';
    docSidebar.style.zIndex = '12';
    docSidebar.style.left = '0';
    docSidebar.style.transform = 'translateX(0)';
  }
}

/**
 * Set up a mutation observer to detect dynamic content changes
 * and reapply fixes when needed
 */
function setupMutationObserver() {
  // Create an observer instance
  const observer = new MutationObserver(function(mutations) {
    // If we detect relevant mutations, reapply fixes
    const shouldReapply = mutations.some(mutation => {
      // Class changes might indicate sidebar toggle
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        return true;
      }
      
      // Added nodes might include new sidebar content
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        return Array.from(mutation.addedNodes).some(node => {
          if (node.nodeType === 1) { // Element node
            return node.classList && (
              node.classList.contains('cosmic-sidebar') ||
              node.classList.contains('sidebar') ||
              node.classList.contains('side-nav') ||
              node.classList.contains('md-sidebar')
            );
          }
          return false;
        });
      }
      
      return false;
    });
    
    if (shouldReapply) {
      fixSidebarIssues();
    }
  });
  
  // Observe the entire body for changes
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['class', 'style']
  });
}

/**
 * Check if an element is overflowing its container
 */
function isElementOverflowing(element, container) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  return (
    elementRect.left < containerRect.left ||
    elementRect.right > containerRect.right
  );
}

/**
 * Debounce function to prevent excessive function calls
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}