/**
 * AstroBot AI - Theme Manager
 * 
 * Manages theme selection, persistence, and transitions.
 * Supports dark/light mode toggling and premium themes.
 */

// Theme constants
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SPACE: 'space',
  NEON: 'neon',
  CONTRAST: 'contrast'
};

// Theme options available to users
const THEME_OPTIONS = [
  { id: THEMES.LIGHT, name: 'Light', isPremium: false },
  { id: THEMES.DARK, name: 'Dark', isPremium: false },
  // Space theme is now available to all users as default
  { id: THEMES.SPACE, name: 'Space', isPremium: false },
  { id: THEMES.NEON, name: 'Neon', isPremium: true },
  { id: THEMES.CONTRAST, name: 'High Contrast', isPremium: true }
];

// Default theme if none is selected
const DEFAULT_THEME = THEMES.SPACE;

// Main theme handler
window.ThemeManager = {
  /**
   * Alpine.js init function
   */
  init() {
    // Always start with space theme if none is set
    this.theme = this.getSavedTheme() || THEMES.SPACE;
    this.mounted = false;
    
    // Get premium status from body data attribute
    this.premium = document.body.getAttribute('data-premium') === 'true';
    this.isPremiumUser = this.premium;
    
    console.log('Premium status:', this.premium ? 'Premium' : 'Not Premium');

    // Check if current theme is premium and user doesn't have premium access
    const currentTheme = this.getSavedTheme();
    if (currentTheme && this.isPremiumTheme(currentTheme) && !this.isPremiumUser && currentTheme !== THEMES.SPACE) {
      // For premium themes other than Space, fallback to Space theme
      this.theme = THEMES.SPACE;
      localStorage.setItem('theme', THEMES.SPACE); // Update localStorage as well
      console.log('Using Space theme as default');
    }
    
    // Apply theme after validation
    this.setTheme(this.theme);

    // Set initial view data
    this.darkMode = this.isDarkMode();
    this.selectedTheme = this.theme;
    this.availableThemes = THEME_OPTIONS;
    
    // Check premium status from server on load
    this.checkPremiumStatus();

    // Wait for document to be ready before showing UI
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        this.mounted = true;
      }, 200);
    });
    
    // Listen for OS dark mode changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!this.getSavedTheme()) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        this.darkMode = e.matches;
        this.setTheme(newTheme);
      }
    });
  },
  
  /**
   * Checks premium status from server
   */
  checkPremiumStatus() {
    fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        this.premium = data.isPremium === true;
        this.isPremiumUser = data.isPremium === true;
        
        // If user has selected a premium theme but lost premium access,
        // fallback to dark theme
        if (this.isPremiumTheme(this.theme) && !this.premium) {
          this.setTheme(THEMES.DARK);
          this.saveThemePreference(THEMES.DARK);
          
          // Show warning toast about premium theme restrictions
          this.showPremiumRestrictionMessage();
        }
      }
    })
    .catch(error => {
      console.error('Error fetching premium status:', error);
    });
  },
  
  /**
   * Shows a toast notification about premium theme restrictions
   */
  showPremiumRestrictionMessage() {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center transform transition-all duration-300 translate-y-0 opacity-0';
    toast.innerHTML = `
      <i class="bi bi-stars mr-2 text-amber-600 dark:text-amber-300"></i>
      <div>Premium theme requires a premium account. <a href="/premium-plans" class="underline font-medium">Upgrade now</a></div>
      <button class="ml-3 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200" onclick="this.parentNode.remove()">
        <i class="bi bi-x-lg"></i>
      </button>
    `;
    
    // Add to body and animate in
    document.body.appendChild(toast);
    
    // Apply animation with delay for smoother effect
    setTimeout(() => {
      toast.classList.remove('opacity-0');
      toast.classList.add('opacity-100');
    }, 10);
    
    // Remove toast after delay
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },

  /**
   * Toggles between dark and light mode
   */
  toggleDarkMode() {
    const newTheme = this.isDarkMode() ? THEMES.LIGHT : THEMES.DARK;
    this.darkMode = !this.darkMode;
    this.setTheme(newTheme);
    this.saveThemePreference(newTheme);
  },

  /**
   * Sets a premium theme
   * @param {string} themeId Theme identifier
   */
  setPremiumTheme(themeId) {
    // Check if user is trying to use a premium theme without premium access
    if (!this.premium && this.isPremiumTheme(themeId)) {
      console.log('Premium theme not available for non-premium users');
      // Show premium restriction message
      this.showPremiumRestrictionMessage();
      return;
    }

    if (this.isPremiumTheme(themeId) || themeId === THEMES.LIGHT || themeId === THEMES.DARK) {
      this.selectedTheme = themeId;
      this.darkMode = themeId === THEMES.DARK || this.isPremiumTheme(themeId);
      this.setTheme(themeId);
      this.saveThemePreference(themeId);
    }
  },

  /**
   * Checks if a theme is premium
   * @param {string} themeId Theme identifier
   * @returns {boolean} True if premium
   */
  isPremiumTheme(themeId) {
    const theme = THEME_OPTIONS.find(t => t.id === themeId);
    return theme ? theme.isPremium : false;
  },

  /**
   * Checks if dark mode is active
   * @returns {boolean} True if dark mode
   */
  isDarkMode() {
    return [THEMES.DARK, THEMES.SPACE, THEMES.NEON].includes(this.theme);
  },
  
  /**
   * Checks if current theme has dark background
   * @returns {boolean} True if dark background
   */
  hasDarkBackground() {
    return [THEMES.DARK, THEMES.SPACE, THEMES.NEON, THEMES.CONTRAST].includes(this.theme);
  },

  /**
   * Applies theme classes to HTML element
   * @param {string} theme Theme identifier
   */
  setTheme(theme) {
    const root = document.documentElement;
    const isDark = [THEMES.DARK, THEMES.SPACE, THEMES.NEON, THEMES.CONTRAST].includes(theme);

    // Apply theme class
    THEME_OPTIONS.forEach(t => {
      if (t.id === theme) {
        root.classList.add(`theme-${t.id}`);
      } else {
        root.classList.remove(`theme-${t.id}`);
      }
    });

    // Apply dark/light class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Store current theme
    this.theme = theme;
    this.selectedTheme = theme;

    // Update UI state
    this.darkMode = this.isDarkMode();

    // Dispatch event for other components
    this.dispatchThemeChanged(theme);
  },

  /**
   * Saves theme selection to localStorage
   * @param {string} theme Theme identifier
   */
  saveThemePreference(theme) {
    localStorage.setItem('theme', theme);
    this.dispatchThemeChanged(theme);
  },

  /**
   * Retrieves saved theme from localStorage
   * @returns {string|null} Saved theme or null
   */
  getSavedTheme() {
    return localStorage.getItem('theme');
  },

  /**
   * Gets system preferred color scheme
   * @returns {string} THEMES.DARK or THEMES.LIGHT
   */
  getPreferredTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
  },
  
  /**
   * Resets to system preferred theme
   */
  resetToSystemTheme() {
    localStorage.removeItem('theme');
    const preferredTheme = this.getPreferredTheme();
    this.setTheme(preferredTheme);
    this.darkMode = preferredTheme === THEMES.DARK;
    this.selectedTheme = preferredTheme;
    this.dispatchThemeChanged(preferredTheme);
  },

  /**
   * Dispatches custom event when theme changes
   * @param {string} theme New theme
   */
  dispatchThemeChanged(theme) {
    const event = new CustomEvent('theme-changed', { 
      detail: { theme, isDark: this.isDarkMode() } 
    });
    window.dispatchEvent(event);
  }
};