/**
 * AstroBot AI - Layout Management
 * 
 * Modern reactive layout system using Alpine.js for state management
 * This handles sidebar, navigation, and responsive behavior
 */

document.addEventListener('alpine:init', () => {
  /**
   * Global layout store
   * Contains state shared across components
   */
  Alpine.store('layout', {
    sidebarCollapsed: localStorage.getItem('sidebar-collapsed') === 'true',
    mobileMenuOpen: false,
    theme: localStorage.getItem('theme') || 'dark',
    activeSection: localStorage.getItem('active-section') || 'dashboard',
    expandedSections: JSON.parse(localStorage.getItem('expanded-sections')) || ['dashboard'],
    
    /**
     * Responsive breakpoints
     */
    isMobile() {
      return window.innerWidth < 768;
    },
    
    isTablet() {
      return window.innerWidth >= 768 && window.innerWidth < 1024;
    },
    
    isDesktop() {
      return window.innerWidth >= 1024;
    },
    
    /**
     * Sidebar state management
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('sidebar-collapsed', this.sidebarCollapsed);
      
      // Dispatch custom event for components that might need to adjust
      window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: this.sidebarCollapsed }));
    },
    
    /**
     * Mobile menu state management
     */
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
      
      // Control body scroll when menu is open
      if (this.mobileMenuOpen) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    },
    
    closeMobileMenu() {
      if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
        document.body.classList.remove('overflow-hidden');
      }
    },
    
    /**
     * Theme management
     */
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', this.theme);
      
      // Update document classes
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Also update cookie for server-side rendering
      document.cookie = `theme=${this.theme};path=/;max-age=31536000`;
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('theme-change', { detail: this.theme }));
    },
    
    /**
     * Initialization
     */
    init() {
      // Set initial theme
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // Handle window resize
      window.addEventListener('resize', () => {
        if (this.isDesktop()) {
          this.closeMobileMenu();
        }
      });
      
      // Listen for navigation events
      window.addEventListener('navigate', (e) => {
        this.closeMobileMenu();
      });
    }
  });
  
  /**
   * Sidebar component 
   * Handles sidebar behavior and section management
   */
  Alpine.data('sidebar', () => ({
    expanded: {},
    
    init() {
      // Initialize expanded sections from store
      const expandedSections = Alpine.store('layout').expandedSections;
      expandedSections.forEach(section => {
        this.expanded[section] = true;
      });
      
      // Listen for window resize
      window.addEventListener('resize', () => {
        // Collapse sidebar on mobile if it was expanded
        if (Alpine.store('layout').isMobile() && !Alpine.store('layout').sidebarCollapsed) {
          Alpine.store('layout').sidebarCollapsed = true;
          localStorage.setItem('sidebar-collapsed', 'true');
        }
      });
    },
    
    /**
     * Toggle a section's expanded state
     */
    toggleSection(section) {
      this.expanded[section] = !this.expanded[section];
      
      // Update store
      const expandedSections = Object.keys(this.expanded).filter(key => this.expanded[key]);
      Alpine.store('layout').expandedSections = expandedSections;
      localStorage.setItem('expanded-sections', JSON.stringify(expandedSections));
    },
    
    /**
     * Check if a section is expanded
     */
    isExpanded(section) {
      return this.expanded[section] || false;
    },
    
    /**
     * Check if a navigation item is active
     */
    isActive(path) {
      if (!path) return false;
      
      // Get current path
      const currentPath = window.location.pathname;
      
      // Exact match
      if (path === currentPath) return true;
      
      // Root path special case
      if (path === '/' && currentPath === '/') return true;
      
      // Section match (path is a prefix of current path)
      if (path !== '/' && currentPath.startsWith(path)) return true;
      
      return false;
    },
    
    /**
     * Set active section
     */
    setActive(section) {
      Alpine.store('layout').activeSection = section;
      localStorage.setItem('active-section', section);
    }
  }));
  
  /**
   * Modal component
   */
  Alpine.data('modal', (options = {}) => ({
    open: false,
    loading: false,
    confirmAction: options.confirmAction || (() => {}),
    cancelAction: options.cancelAction || (() => {}),
    
    init() {
      // Listen for escape key
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.open) {
          this.close();
        }
      });
    },
    
    toggle() {
      this.open = !this.open;
      
      // Control body scroll
      if (this.open) {
        document.body.classList.add('overflow-hidden');
      } else {
        document.body.classList.remove('overflow-hidden');
      }
    },
    
    close() {
      this.open = false;
      document.body.classList.remove('overflow-hidden');
      this.cancelAction();
    },
    
    async confirm() {
      this.loading = true;
      try {
        await this.confirmAction();
        this.close();
      } catch (error) {
        console.error('Modal action error:', error);
      } finally {
        this.loading = false;
      }
    }
  }));
  
  /**
   * Notification component
   * Handles toast notifications
   */
  Alpine.data('notifications', () => ({
    items: [],
    nextId: 1,
    
    /**
     * Add a notification
     */
    add(message, type = 'info', timeout = 5000) {
      const id = this.nextId++;
      const notification = { id, message, type, timeout };
      
      this.items.push(notification);
      
      // Auto-remove after timeout
      if (timeout > 0) {
        setTimeout(() => {
          this.remove(id);
        }, timeout);
      }
      
      return id;
    },
    
    /**
     * Remove a notification by ID
     */
    remove(id) {
      const index = this.items.findIndex(item => item.id === id);
      if (index !== -1) {
        this.items.splice(index, 1);
      }
    }
  }));
});

// Initialize the cosmic dust effect
document.addEventListener('DOMContentLoaded', function() {
  const dustContainer = document.getElementById('cosmicDust');
  if (!dustContainer) return;
  
  // Create dust particles
  for (let i = 0; i < 50; i++) {
    const dust = document.createElement('div');
    dust.classList.add('cosmic-dust-particle');
    
    // Random positioning
    dust.style.left = `${Math.random() * 100}%`;
    dust.style.top = `${Math.random() * 100}%`;
    
    // Random size
    const size = Math.random() * 3 + 1;
    dust.style.width = `${size}px`;
    dust.style.height = `${size}px`;
    
    // Random opacity
    dust.style.opacity = Math.random() * 0.7 + 0.3;
    
    // Random animation delay
    dust.style.animationDelay = `${Math.random() * 5}s`;
    
    dustContainer.appendChild(dust);
  }
});