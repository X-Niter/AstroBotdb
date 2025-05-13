/**
 * AstroBot AI - Emergency Navigation Fix
 * 
 * This script runs immediately to address critical sidebar positioning
 * and clipping issues across the application. It aggressively fixes
 * sidebar elements before any other JavaScript runs.
 */

// Self-executing function to avoid polluting global namespace
(function() {
  // Run immediately when script is loaded
  fixSidebarEmergency();
  
  // Also run when DOM is loaded to catch dynamically added elements
  document.addEventListener('DOMContentLoaded', fixSidebarEmergency);
  
  // Main emergency fix function
  function fixSidebarEmergency() {
    console.log("Applying emergency sidebar fixes...");
    
    // Force sidebar to correct position
    const sidebarSelectors = [
      '.cosmic-sidebar', 
      '.sidebar', 
      '.glassy-nav-sidebar', 
      '.side-nav', 
      '.md-sidebar', 
      '.side-navigation', 
      '#sidebarMenu', 
      '.left-sidebar',
      '.side-navbar',
      '.side-navbar-astro',
      '.left-menu',
      '.docs-sidebar',
      '.nav-sidebar',
      '.doc-sidebar'
    ];
    
    // Try to find any sidebar using our selectors
    let sidebar = null;
    for (const selector of sidebarSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        sidebar = element;
        break;
      }
    }
    
    // No sidebar found, try to detect one
    if (!sidebar) {
      console.log("No sidebar found with known selectors, attempting detection...");
      
      // Look for elements that might be sidebars based on position and size
      const potentialSidebars = Array.from(document.querySelectorAll('div, nav, aside, section'))
        .filter(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            // Left-positioned
            rect.left < 20 && 
            // Tall enough
            rect.height > window.innerHeight * 0.5 &&
            // Not too wide
            rect.width < window.innerWidth * 0.3 &&
            // Not the main content
            !el.classList.contains('content') &&
            !el.classList.contains('main') &&
            !el.id.includes('content') &&
            // Fixed or absolute position is likely for sidebars
            (style.position === 'fixed' || style.position === 'absolute')
          );
        });
      
      if (potentialSidebars.length > 0) {
        // Use the first potential sidebar found
        sidebar = potentialSidebars[0];
        console.log("Auto-detected sidebar:", sidebar);
        
        // Add cosmic-sidebar class for future detection
        sidebar.classList.add('cosmic-sidebar');
      }
    }
    
    // Apply fixes if sidebar was found
    if (sidebar) {
      console.log("Fixing sidebar:", sidebar);
      
      // Critical maximum specificity style override
      const sidebarStyles = {
        position: 'fixed',
        top: '0',
        left: '0',
        bottom: '0',
        height: '100vh',
        maxHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        width: '16rem',
        maxWidth: '16rem',
        margin: '0',
        marginLeft: '0',
        padding: '0',
        zIndex: '9000',
        boxSizing: 'border-box',
        transform: window.innerWidth <= 768 ? 'translateX(-100%)' : 'none',
        transition: 'transform 0.3s ease, width 0.3s ease',
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(8px)',
        borderRight: '1px solid rgba(78, 119, 255, 0.15)',
        boxShadow: '2px 0 15px rgba(0, 0, 0, 0.2)'
      };
      
      // Apply styles with maximum specificity
      Object.entries(sidebarStyles).forEach(([property, value]) => {
        sidebar.style.setProperty(property, value, 'important');
      });
      
      // Fix sidebar content by creating a container if needed
      let contentContainer = sidebar.querySelector('.sidebar-content, .cosmic-sidebar-content');
      if (!contentContainer) {
        // Check if the sidebar already has a child that seems like a content container
        const children = Array.from(sidebar.children);
        const potentialContainer = children.find(child => 
          child.tagName === 'DIV' && 
          child.getBoundingClientRect().height > window.innerHeight * 0.5
        );
        
        if (potentialContainer) {
          contentContainer = potentialContainer;
          contentContainer.classList.add('cosmic-sidebar-content');
        } else {
          // No suitable container found, create one
          contentContainer = document.createElement('div');
          contentContainer.classList.add('cosmic-sidebar-content');
          
          // Move all sidebar children to the container
          while (sidebar.firstChild) {
            contentContainer.appendChild(sidebar.firstChild);
          }
          
          // Add container to sidebar
          sidebar.appendChild(contentContainer);
        }
      }
      
      // Apply styles to content container
      if (contentContainer) {
        const contentStyles = {
          height: '100%',
          maxHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem',
          boxSizing: 'border-box'
        };
        
        Object.entries(contentStyles).forEach(([property, value]) => {
          contentContainer.style.setProperty(property, value, 'important');
        });
      }
      
      // Fix all links inside sidebar
      const links = sidebar.querySelectorAll('a');
      links.forEach(link => {
        link.style.display = 'flex';
        link.style.alignItems = 'center';
        link.style.maxWidth = '100%';
        link.style.overflow = 'hidden';
        link.style.textOverflow = 'ellipsis';
        link.style.whiteSpace = 'nowrap';
        link.style.padding = '0.5rem 0';
        
        // Find icon element (if any)
        const icon = link.querySelector('i, svg');
        if (icon) {
          icon.style.flexShrink = '0';
          icon.style.marginRight = '0.75rem';
          icon.style.minWidth = '1.5rem';
          icon.style.textAlign = 'center';
        }
      });
      
      // Clean up any absolutely positioned elements inside sidebar
      const absoluteElements = sidebar.querySelectorAll('[style*="position: absolute"]');
      absoluteElements.forEach(el => {
        el.style.position = 'static';
        el.style.maxWidth = '100%';
      });
      
      // Find main content and fix its margin
      const contentSelectors = [
        '.main-content',
        '.content-wrapper',
        '.content-area',
        '.cosmic-content',
        '.content',
        '#content',
        'main'
      ];
      
      let mainContent = null;
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = element;
          break;
        }
      }
      
      // Fix main content if found
      if (mainContent) {
        if (window.innerWidth <= 768) {
          mainContent.style.marginLeft = '0';
          mainContent.style.width = '100%';
        } else {
          mainContent.style.marginLeft = '16rem';
          mainContent.style.width = 'calc(100% - 16rem)';
        }
        
        mainContent.style.maxWidth = window.innerWidth <= 768 ? '100%' : 'calc(100% - 16rem)';
        mainContent.style.boxSizing = 'border-box';
        mainContent.style.transition = 'margin-left 0.3s ease, width 0.3s ease';
      }
      
      // Create overlay for mobile sidebar if it doesn't exist
      if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.classList.add('sidebar-overlay');
        
        // Style overlay
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        overlay.style.backdropFilter = 'blur(2px)';
        overlay.style.zIndex = '8999';
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 0.3s ease';
        
        // Add to body
        document.body.appendChild(overlay);
        
        // Add click handler to close sidebar when overlay is clicked
        overlay.addEventListener('click', function() {
          sidebar.style.transform = 'translateX(-100%)';
          sidebar.classList.remove('mobile-active');
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          document.body.classList.remove('sidebar-mobile-active');
        });
      }
      
      // Fix toggle buttons if they exist
      const toggleButtons = document.querySelectorAll(
        '.sidebar-toggle, .mobile-nav-toggle, .navbar-toggle, .mobile-sidebar-toggle'
      );
      
      toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const overlay = document.querySelector('.sidebar-overlay');
          
          if (window.innerWidth <= 768) {
            // Mobile sidebar toggle
            const isVisible = sidebar.classList.contains('mobile-active');
            
            if (isVisible) {
              sidebar.style.transform = 'translateX(-100%)';
              sidebar.classList.remove('mobile-active');
              if (overlay) {
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
              }
              document.body.classList.remove('sidebar-mobile-active');
            } else {
              sidebar.style.transform = 'translateX(0)';
              sidebar.classList.add('mobile-active');
              if (overlay) {
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
              }
              document.body.classList.add('sidebar-mobile-active');
            }
          } else {
            // Desktop sidebar collapse toggle
            const isCollapsed = sidebar.classList.contains('collapsed');
            
            if (isCollapsed) {
              // Expand
              sidebar.classList.remove('collapsed');
              sidebar.style.width = '16rem';
              sidebar.style.maxWidth = '16rem';
              document.body.classList.remove('sidebar-collapsed');
              
              if (mainContent) {
                mainContent.style.marginLeft = '16rem';
                mainContent.style.width = 'calc(100% - 16rem)';
                mainContent.style.maxWidth = 'calc(100% - 16rem)';
              }
              
              localStorage.setItem('sidebar-collapsed', 'false');
            } else {
              // Collapse
              sidebar.classList.add('collapsed');
              sidebar.style.width = '5rem';
              sidebar.style.maxWidth = '5rem';
              document.body.classList.add('sidebar-collapsed');
              
              if (mainContent) {
                mainContent.style.marginLeft = '5rem';
                mainContent.style.width = 'calc(100% - 5rem)';
                mainContent.style.maxWidth = 'calc(100% - 5rem)';
              }
              
              localStorage.setItem('sidebar-collapsed', 'true');
            }
          }
        });
      });
      
      // Apply collapse state from localStorage
      const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
      if (isCollapsed && window.innerWidth > 768) {
        sidebar.classList.add('collapsed');
        sidebar.style.width = '5rem';
        sidebar.style.maxWidth = '5rem';
        document.body.classList.add('sidebar-collapsed');
        
        if (mainContent) {
          mainContent.style.marginLeft = '5rem';
          mainContent.style.width = 'calc(100% - 5rem)';
          mainContent.style.maxWidth = 'calc(100% - 5rem)';
        }
      }
    } else {
      console.warn("No sidebar found to fix");
    }
  }
  
  // Add window resize listener to ensure fixes are maintained
  window.addEventListener('resize', function() {
    // Use requestAnimationFrame for performance
    requestAnimationFrame(fixSidebarEmergency);
  });
})();