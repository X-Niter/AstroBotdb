/**
 * AstroBot AI - Main Application JavaScript
 * 
 * This file contains the core functionality for the AstroBot AI web interface
 * It handles initialization, UI interactions, and dynamic behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('AstroBot AI application initialized');
    
    // Initialize global components
    initializeComponents();
    
    // Set up event listeners
    setupEventListeners();
    
    // Apply dynamic UI enhancements
    applyUIEnhancements();
});

/**
 * Initialize application components
 */
function initializeComponents() {
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl, {
                boundary: document.body
            });
        });
    }
    
    // Initialize custom select components
    document.querySelectorAll('.cosmic-select').forEach(select => {
        select.addEventListener('change', function() {
            const selectedText = this.options[this.selectedIndex].text;
            this.parentNode.querySelector('.cosmic-select-value').textContent = selectedText;
        });
    });
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // Listen for theme changes
    window.addEventListener('theme-change', function(e) {
        console.log('Theme changed to:', e.detail);
        updateThemeSpecificElements(e.detail);
    });
    
    // Listen for sidebar toggle
    window.addEventListener('sidebar-toggle', function(e) {
        console.log('Sidebar toggled, collapsed:', e.detail);
        adjustContentLayout(e.detail);
    });
    
    // Handle form submissions with validation
    document.querySelectorAll('form[data-validate="true"]').forEach(form => {
        form.addEventListener('submit', validateForm);
    });
}

/**
 * Apply dynamic UI enhancements
 */
function applyUIEnhancements() {
    // Add scroll animations
    document.querySelectorAll('.cosmic-fade-in').forEach(element => {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(element);
    });
    
    // Initialize cosmic dust effect if container exists
    initializeCosmicDust();
}

/**
 * Initialize the cosmic dust (starfield) effect
 */
function initializeCosmicDust() {
    const dustContainer = document.getElementById('cosmicDust');
    if (!dustContainer) return;
    
    // Clear existing dust particles
    dustContainer.innerHTML = '';
    
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
}

/**
 * Validate form inputs before submission
 * @param {Event} e - Form submission event
 */
function validateForm(e) {
    const form = e.target;
    let isValid = true;
    
    // Reset previous validation state
    form.querySelectorAll('.is-invalid').forEach(field => {
        field.classList.remove('is-invalid');
    });
    
    // Check required fields
    form.querySelectorAll('[required]').forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        }
    });
    
    // Check email fields
    form.querySelectorAll('input[type="email"]').forEach(field => {
        if (field.value && !validateEmail(field.value)) {
            field.classList.add('is-invalid');
            isValid = false;
        }
    });
    
    // Prevent submission if validation fails
    if (!isValid) {
        e.preventDefault();
        e.stopPropagation();
        
        // Show validation feedback
        showToast('Please check the form for errors', 'warning');
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Update UI elements specific to the current theme
 * @param {string} theme - Current theme ('light' or 'dark')
 */
function updateThemeSpecificElements(theme) {
    // Update icon colors for the current theme
    document.querySelectorAll('.theme-icon').forEach(icon => {
        if (theme === 'dark') {
            icon.classList.add('icon-dark');
            icon.classList.remove('icon-light');
        } else {
            icon.classList.add('icon-light');
            icon.classList.remove('icon-dark');
        }
    });
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, warning, error, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast show cosmic-glass`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const toastContent = `
        <div class="toast-header bg-${type || 'info'} text-white">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toast.innerHTML = toastContent;
    container.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * Adjust content layout when sidebar is toggled
 * @param {boolean} isCollapsed - Whether sidebar is collapsed
 */
function adjustContentLayout(isCollapsed) {
    const sidebarWidth = isCollapsed ? 70 : 240; // Match values in CSS variables
    document.documentElement.style.setProperty('--effective-sidebar-width', `${sidebarWidth}px`);
}

// No need to register a collapse directive here as it's defined in alpine-plugins.js
// This ensures we don't have competing directives
document.addEventListener('alpine:init', () => {
    if (!window.AlpineCollapse) {
        console.warn('Alpine Collapse plugin not found, will use the one from alpine-plugins.js');
    }
});