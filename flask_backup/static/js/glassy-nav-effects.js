/**
 * AstroBot AI - Glassy Navigation Effects
 * 
 * This script enhances the glassy navigation components with
 * interactive effects and fixes positioning issues dynamically.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all glassy navigation effects
  initGlassyNavigation();
  
  // Set up responsive behaviors
  setupResponsiveNav();
  
  // Listen for window resize to reapply fixes
  window.addEventListener('resize', debounce(function() {
    fixNavigationPositioning();
    handleMobileNavigation();
  }, 200));
  
  // Apply navigation fixes immediately
  fixNavigationPositioning();
});

/**
 * Initialize glassy navigation panels and effects
 */
function initGlassyNavigation() {
  // Add subtle particle effects to glassy panels
  const glassyPanels = document.querySelectorAll('.glassy-panel, .glassy-nav-sidebar');
  
  glassyPanels.forEach(panel => {
    // Skip if already initialized
    if (panel.querySelector('.glassy-panel-glow')) return;
    
    // Add glow effect
    const glowElement = document.createElement('div');
    glowElement.classList.add('glassy-panel-glow');
    panel.appendChild(glowElement);
    
    // Add particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.classList.add('glassy-particles');
    panel.appendChild(particlesContainer);
    
    // Create particles
    createGlassyParticles(particlesContainer, 10);
  });
  
  // Enhance navigation links with hover effects
  const navLinks = document.querySelectorAll('.glassy-nav-link');
  
  navLinks.forEach(link => {
    // Skip if already enhanced
    if (link.dataset.enhanced) return;
    link.dataset.enhanced = true;
    
    // Add subtle tilt effect on hover
    link.addEventListener('mouseenter', function() {
      const icon = this.querySelector('i');
      if (icon) {
        icon.style.transform = 'translateY(-2px)';
        icon.style.color = 'rgba(99, 102, 241, 1)';
      }
    });
    
    link.addEventListener('mouseleave', function() {
      const icon = this.querySelector('i');
      if (icon) {
        icon.style.transform = '';
        icon.style.color = '';
      }
    });
  });
  
  // Add active state based on current URL
  highlightActiveNavLinks();
}

/**
 * Create animated particles for the glassy effect
 */
function createGlassyParticles(container, count) {
  // Clear any existing particles
  container.innerHTML = '';
  
  // Create new particles
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.classList.add('glassy-particle');
    
    // Random position
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    // Subtle glow
    particle.style.boxShadow = '0 0 2px rgba(255, 255, 255, 0.8)';
    
    // Animation
    const duration = 20 + Math.random() * 30;
    const delay = Math.random() * -30;
    
    particle.style.animation = `float-particle ${duration}s infinite linear ${delay}s`;
    
    // Add to container
    container.appendChild(particle);
  }
  
  // Add animation keyframes if not already added
  if (!document.getElementById('glassy-particle-keyframes')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'glassy-particle-keyframes';
    styleSheet.textContent = `
      @keyframes float-particle {
        0% {
          transform: translate(0, 0);
          opacity: 0;
        }
        10% {
          opacity: 0.6;
        }
        90% {
          opacity: 0.6;
        }
        100% {
          transform: translate(${Math.random() > 0.5 ? '' : '-'}${20 + Math.random() * 30}px, -${50 + Math.random() * 100}px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}

/**
 * Setup responsive behaviors for navigation
 */
function setupResponsiveNav() {
  // Toggle sidebar on mobile
  const mobileToggle = document.querySelector('.glassy-nav-toggle, .mobile-nav-toggle');
  const sidebar = document.querySelector('.glassy-nav-sidebar');
  
  if (mobileToggle && sidebar) {
    // Create overlay if it doesn't exist
    let overlay = document.querySelector('.glassy-nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.classList.add('glassy-nav-overlay');
      document.body.appendChild(overlay);
      
      // Close sidebar when overlay is clicked
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('mobile-active');
        overlay.classList.remove('active');
        document.body.classList.remove('sidebar-active');
      });
    }
    
    // Toggle sidebar when button is clicked
    mobileToggle.addEventListener('click', function() {
      sidebar.classList.toggle('mobile-active');
      overlay.classList.toggle('active');
      document.body.classList.toggle('sidebar-active');
    });
  }
  
  // Handle sidebar collapse toggle
  const collapseToggle = document.querySelector('.glassy-nav-collapse-toggle');
  
  if (collapseToggle && sidebar) {
    collapseToggle.addEventListener('click', function() {
      sidebar.classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-collapsed');
      
      // Update content margins
      const content = document.querySelector('.content-area, .main-content, .cosmic-content');
      if (content) {
        content.classList.toggle('expanded');
      }
      
      // Save preference in localStorage
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebar-collapsed', isCollapsed);
    });
    
    // Check saved preference
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    if (savedCollapsed === 'true') {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
      
      const content = document.querySelector('.content-area, .main-content, .cosmic-content');
      if (content) {
        content.classList.add('expanded');
      }
    }
  }
  
  // Handle initial mobile state
  handleMobileNavigation();
}

/**
 * Handle mobile navigation based on screen size
 */
function handleMobileNavigation() {
  const sidebar = document.querySelector('.glassy-nav-sidebar');
  const isMobile = window.innerWidth < 768;
  
  if (sidebar) {
    if (isMobile) {
      sidebar.classList.remove('mobile-active');
      document.body.classList.remove('sidebar-active');
      
      // Remove collapsed state on mobile
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
      
      // Reset content margins
      const content = document.querySelector('.content-area, .main-content, .cosmic-content');
      if (content) {
        content.style.marginLeft = '0';
        content.style.width = '100%';
        content.style.maxWidth = '100%';
      }
    } else {
      // Check saved preference for collapsed state
      const savedCollapsed = localStorage.getItem('sidebar-collapsed');
      
      // Apply appropriate margins to content
      const content = document.querySelector('.content-area, .main-content, .cosmic-content');
      if (content) {
        if (savedCollapsed === 'true') {
          content.style.marginLeft = '5rem';
          content.style.width = 'calc(100% - 5rem)';
          content.style.maxWidth = 'calc(100% - 5rem)';
        } else {
          content.style.marginLeft = '16rem';
          content.style.width = 'calc(100% - 16rem)';
          content.style.maxWidth = 'calc(100% - 16rem)';
        }
      }
    }
  }
}

/**
 * Fix navigation positioning issues
 */
function fixNavigationPositioning() {
  // Fix positioning for the sidebar
  const sidebar = document.querySelector('.glassy-nav-sidebar');
  if (sidebar) {
    sidebar.style.transform = 'translateX(0)';
    sidebar.style.left = '0';
    sidebar.style.marginLeft = '0';
    sidebar.style.maxWidth = '16rem';
    sidebar.style.zIndex = '40';
    sidebar.style.overflowX = 'hidden';
    sidebar.style.boxSizing = 'border-box';
    
    // Fix content margins when sidebar exists
    const isMobile = window.innerWidth < 768;
    const isCollapsed = sidebar.classList.contains('collapsed');
    
    if (!isMobile) {
      const content = document.querySelector('.content-area, .main-content, .cosmic-content');
      if (content) {
        if (isCollapsed) {
          content.style.marginLeft = '5rem';
          content.style.width = 'calc(100% - 5rem)';
          content.style.maxWidth = 'calc(100% - 5rem)';
        } else {
          content.style.marginLeft = '16rem';
          content.style.width = 'calc(100% - 16rem)';
          content.style.maxWidth = 'calc(100% - 16rem)';
        }
      }
    }
  }
  
  // Check for and fix any clipping link text
  const navLinks = document.querySelectorAll('.glassy-nav-link, .cosmic-sidebar-nav-link');
  navLinks.forEach(link => {
    // Ensure proper text handling
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

/**
 * Highlight active navigation links based on current URL
 */
function highlightActiveNavLinks() {
  const currentPath = window.location.pathname;
  
  // Mark links as active if they match the current path
  const navLinks = document.querySelectorAll('.glassy-nav-link, .cosmic-sidebar-link');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Exact match
    if (href === currentPath) {
      link.classList.add('active');
    }
    // Section match (for nested pages)
    else if (href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    }
  });
}

/**
 * Debounce function to limit the rate at which a function can fire
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