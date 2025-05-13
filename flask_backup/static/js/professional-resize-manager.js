/**
 * AstroBot AI - Professional Resize Manager
 * 
 * Handles dynamic resizing and responsive behavior for the application,
 * ensuring that all UI components resize and reposition correctly.
 */

/**
 * ResizeManager class for handling all dynamic sizing in the application
 */
class ResizeManager {
  constructor() {
    // Configuration
    this.config = {
      sidebarWidth: 16, // rem
      sidebarCollapsedWidth: 5, // rem
      headerHeight: 4, // rem
      mobileBreakpoint: 768, // px
      tabletBreakpoint: 1024, // px
      desktopBreakpoint: 1280, // px
      resizeDebounceDelay: 100, // ms
    };
    
    // State
    this.state = {
      isMobile: window.innerWidth <= this.config.mobileBreakpoint,
      isTablet: window.innerWidth > this.config.mobileBreakpoint && 
                window.innerWidth <= this.config.tabletBreakpoint,
      isDesktop: window.innerWidth > this.config.tabletBreakpoint,
      sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
      sidebarVisible: window.innerWidth > this.config.mobileBreakpoint,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
      scrollY: window.scrollY,
    };
    
    // Elements cache
    this.elements = {
      sidebar: null,
      content: null,
      header: null,
      containers: [],
      sidebarToggle: null,
      mobileSidebarToggle: null,
      overlay: null,
    };
    
    // Initialize
    this.init();
  }
  
  /**
   * Initialize the resize manager
   */
  init() {
    console.log('Initializing ResizeManager...');
    
    // Cache DOM elements
    this.cacheElements();
    
    // Apply initial sizing
    this.handleResize();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Apply sidebar collapsed state from localStorage
    this.applySidebarState();
    
    console.log('ResizeManager initialized');
  }
  
  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    // Core layout elements
    this.elements.sidebar = document.querySelector('.cosmic-sidebar, .sidebar, .glassy-nav-sidebar, .side-nav, .md-sidebar, .astro-sidebar');
    this.elements.content = document.querySelector('.main-content, .content-wrapper, .content-area, .cosmic-content, .astro-content');
    this.elements.header = document.querySelector('header, .header, .cosmic-header, .astro-header');
    this.elements.containers = document.querySelectorAll('.container, .container-fluid, .astro-container');
    
    // Interactive elements
    this.elements.sidebarToggle = document.querySelector('.sidebar-toggle, .cosmic-sidebar-toggle, .astro-sidebar-toggle');
    this.elements.mobileSidebarToggle = document.querySelector('.mobile-nav-toggle, .mobile-sidebar-toggle, .navbar-toggle, .astro-navbar-toggle');
    
    // Create overlay if it doesn't exist
    if (!document.querySelector('.sidebar-overlay, .astro-sidebar-overlay')) {
      const overlay = document.createElement('div');
      overlay.classList.add('sidebar-overlay');
      document.body.appendChild(overlay);
      this.elements.overlay = overlay;
    } else {
      this.elements.overlay = document.querySelector('.sidebar-overlay, .astro-sidebar-overlay');
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Resize event with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.handleResize(), this.config.resizeDebounceDelay);
    });
    
    // Scroll event
    window.addEventListener('scroll', () => {
      this.state.scrollY = window.scrollY;
      this.handleScroll();
    });
    
    // Sidebar toggle event
    if (this.elements.sidebarToggle) {
      this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }
    
    // Mobile sidebar toggle event
    if (this.elements.mobileSidebarToggle) {
      this.elements.mobileSidebarToggle.addEventListener('click', () => this.toggleMobileSidebar());
    }
    
    // Overlay click event
    if (this.elements.overlay) {
      this.elements.overlay.addEventListener('click', () => this.closeMobileSidebar());
    }
    
    // Listen for content changes that might affect layout
    this.observeContentChanges();
  }
  
  /**
   * Observe changes to content that might affect layout
   */
  observeContentChanges() {
    // Create a mutation observer to watch for content changes
    const observer = new MutationObserver((mutations) => {
      // Check if mutations affect sizing
      const needsResize = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'class' || 
          mutation.attributeName === 'style'))
      );
      
      if (needsResize) {
        this.handleResize();
      }
    });
    
    // Start observing the document body
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: false,
      attributeFilter: ['class', 'style']
    });
  }
  
  /**
   * Apply sidebar collapsed state from localStorage
   */
  applySidebarState() {
    if (!this.elements.sidebar) return;
    
    // Apply collapsed state
    if (this.state.sidebarCollapsed) {
      this.elements.sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
      
      if (this.elements.content) {
        this.elements.content.classList.add('sidebar-collapsed');
      }
    } else {
      this.elements.sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
      
      if (this.elements.content) {
        this.elements.content.classList.remove('sidebar-collapsed');
      }
    }
    
    // Make sidebar visible on desktop, hidden on mobile
    if (this.state.isMobile) {
      this.elements.sidebar.style.transform = 'translateX(-100%)';
    } else {
      this.elements.sidebar.style.transform = 'translateX(0)';
    }
  }
  
  /**
   * Handle window resize event
   */
  handleResize() {
    // Update state
    const prevState = { ...this.state };
    this.state.viewportWidth = window.innerWidth;
    this.state.viewportHeight = window.innerHeight;
    this.state.documentHeight = document.documentElement.scrollHeight;
    this.state.isMobile = window.innerWidth <= this.config.mobileBreakpoint;
    this.state.isTablet = window.innerWidth > this.config.mobileBreakpoint && 
                         window.innerWidth <= this.config.tabletBreakpoint;
    this.state.isDesktop = window.innerWidth > this.config.tabletBreakpoint;
    
    // Check if we crossed a breakpoint
    const breakpointChanged = 
      prevState.isMobile !== this.state.isMobile ||
      prevState.isTablet !== this.state.isTablet ||
      prevState.isDesktop !== this.state.isDesktop;
    
    // Apply responsive changes if breakpoint changed
    if (breakpointChanged) {
      this.handleBreakpointChange(prevState);
    }
    
    // Apply sizing to elements
    this.applySizing();
    
    // Always force critical fixes
    this.forceLeftSideFixes();
  }
  
  /**
   * Handle changes when crossing responsive breakpoints
   */
  handleBreakpointChange(prevState) {
    console.log(`Breakpoint changed: ${prevState.isMobile ? 'Mobile' : (prevState.isTablet ? 'Tablet' : 'Desktop')} -> ${this.state.isMobile ? 'Mobile' : (this.state.isTablet ? 'Tablet' : 'Desktop')}`);
    
    // Mobile -> Desktop
    if (prevState.isMobile && !this.state.isMobile) {
      // Show sidebar
      if (this.elements.sidebar) {
        this.elements.sidebar.style.transform = 'translateX(0)';
        this.elements.sidebar.classList.remove('mobile-active');
      }
      
      // Hide overlay
      if (this.elements.overlay) {
        this.elements.overlay.style.opacity = '0';
        this.elements.overlay.style.pointerEvents = 'none';
      }
      
      // Reset body class
      document.body.classList.remove('sidebar-mobile-active');
    }
    
    // Desktop -> Mobile
    if (!prevState.isMobile && this.state.isMobile) {
      // Hide sidebar
      if (this.elements.sidebar) {
        this.elements.sidebar.style.transform = 'translateX(-100%)';
      }
      
      // Reset content margin
      if (this.elements.content) {
        this.elements.content.style.marginLeft = '0';
        this.elements.content.style.width = '100%';
      }
    }
  }
  
  /**
   * Apply sizing to all elements based on current state
   */
  applySizing() {
    // Skip if no elements found
    if (!this.elements.sidebar && !this.elements.content) return;
    
    // Apply sidebar sizing
    if (this.elements.sidebar) {
      // Set width based on collapsed state
      const sidebarWidth = this.state.sidebarCollapsed ? 
        `${this.config.sidebarCollapsedWidth}rem` : 
        `${this.config.sidebarWidth}rem`;
      
      if (!this.state.isMobile) {
        this.elements.sidebar.style.width = sidebarWidth;
        this.elements.sidebar.style.maxWidth = sidebarWidth;
      }
      
      // Ensure proper height
      this.elements.sidebar.style.height = '100vh';
      
      // Fix position
      this.elements.sidebar.style.position = 'fixed';
      this.elements.sidebar.style.top = '0';
      this.elements.sidebar.style.left = '0';
      this.elements.sidebar.style.zIndex = '9000';
    }
    
    // Apply content sizing
    if (this.elements.content && !this.state.isMobile) {
      // Calculate margin and width based on sidebar state
      const marginLeft = this.state.sidebarCollapsed ? 
        `${this.config.sidebarCollapsedWidth}rem` : 
        `${this.config.sidebarWidth}rem`;
      
      const width = this.state.sidebarCollapsed ? 
        `calc(100% - ${this.config.sidebarCollapsedWidth}rem)` : 
        `calc(100% - ${this.config.sidebarWidth}rem)`;
      
      this.elements.content.style.marginLeft = marginLeft;
      this.elements.content.style.width = width;
    } else if (this.elements.content && this.state.isMobile) {
      this.elements.content.style.marginLeft = '0';
      this.elements.content.style.width = '100%';
    }
    
    // Apply container sizing
    this.elements.containers.forEach(container => {
      container.style.boxSizing = 'border-box';
      container.style.maxWidth = '100%';
    });
  }
  
  /**
   * Handle scroll events
   */
  handleScroll() {
    // Skip if no header
    if (!this.elements.header) return;
    
    // Stick header on scroll
    if (this.state.scrollY > 10) {
      this.elements.header.classList.add('scrolled');
    } else {
      this.elements.header.classList.remove('scrolled');
    }
  }
  
  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar() {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    
    // Save state to localStorage
    localStorage.setItem('sidebar-collapsed', this.state.sidebarCollapsed);
    
    // Apply changes
    this.applySidebarState();
    this.applySizing();
  }
  
  /**
   * Toggle mobile sidebar visibility
   */
  toggleMobileSidebar() {
    if (!this.elements.sidebar) return;
    
    // Toggle mobile active state
    const isVisible = this.elements.sidebar.classList.contains('mobile-active');
    
    if (isVisible) {
      this.closeMobileSidebar();
    } else {
      this.openMobileSidebar();
    }
  }
  
  /**
   * Open mobile sidebar
   */
  openMobileSidebar() {
    if (!this.elements.sidebar) return;
    
    // Show sidebar
    this.elements.sidebar.classList.add('mobile-active');
    this.elements.sidebar.style.transform = 'translateX(0)';
    
    // Show overlay
    if (this.elements.overlay) {
      this.elements.overlay.style.opacity = '1';
      this.elements.overlay.style.pointerEvents = 'auto';
    }
    
    // Add body class
    document.body.classList.add('sidebar-mobile-active');
  }
  
  /**
   * Close mobile sidebar
   */
  closeMobileSidebar() {
    if (!this.elements.sidebar) return;
    
    // Hide sidebar
    this.elements.sidebar.classList.remove('mobile-active');
    this.elements.sidebar.style.transform = 'translateX(-100%)';
    
    // Hide overlay
    if (this.elements.overlay) {
      this.elements.overlay.style.opacity = '0';
      this.elements.overlay.style.pointerEvents = 'none';
    }
    
    // Remove body class
    document.body.classList.remove('sidebar-mobile-active');
  }
  
  /**
   * Force critical left side fixes to ensure no clipping
   */
  forceLeftSideFixes() {
    // These are guaranteed to work for all situations
    if (this.elements.sidebar) {
      // Ultra-high specificity direct style manipulation
      Object.assign(this.elements.sidebar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        bottom: '0',
        height: '100vh',
        overflowX: 'hidden',
        zIndex: '9000',
        boxSizing: 'border-box',
        margin: '0',
        transform: this.state.isMobile ? 'translateX(-100%)' : 'none',
      });
      
      // If mobile active, force showing
      if (this.elements.sidebar.classList.contains('mobile-active')) {
        this.elements.sidebar.style.transform = 'translateX(0)';
      }
      
      // Width dependent on collapsed state
      if (this.state.sidebarCollapsed && !this.state.isMobile) {
        this.elements.sidebar.style.width = `${this.config.sidebarCollapsedWidth}rem`;
        this.elements.sidebar.style.maxWidth = `${this.config.sidebarCollapsedWidth}rem`;
      } else if (!this.state.isMobile) {
        this.elements.sidebar.style.width = `${this.config.sidebarWidth}rem`;
        this.elements.sidebar.style.maxWidth = `${this.config.sidebarWidth}rem`;
      }
    }
    
    // Fix all sidebar inner elements
    const fixNestedElements = (element) => {
      if (!element) return;
      
      const children = element.querySelectorAll('*');
      children.forEach(child => {
        child.style.maxWidth = '100%';
        child.style.boxSizing = 'border-box';
        
        if (child.tagName === 'A') {
          // Fix links
          child.style.textOverflow = 'ellipsis';
          child.style.overflow = 'hidden';
          
          // Fix icons in links
          const icon = child.querySelector('i, svg');
          if (icon) {
            icon.style.flexShrink = '0';
            icon.style.minWidth = '1.5rem';
          }
        }
      });
    };
    
    // Apply nested fixes if sidebar exists
    if (this.elements.sidebar) {
      fixNestedElements(this.elements.sidebar);
    }
  }
}

// Initialize the resize manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create the resize manager instance
  window.resizeManager = new ResizeManager();
  
  console.log('Professional Resize Manager initialized');
});