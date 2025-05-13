/**
 * Custom Alpine.js Collapse Plugin Implementation
 * 
 * This implements a simplified version of the Alpine.js Collapse plugin
 * for expanding and collapsing elements with smooth transitions.
 * 
 * Usage:
 * <div x-data="{ open: false }">
 *   <button @click="open = !open">Toggle</button>
 *   <div x-show="open" x-collapse>Content</div>
 * </div>
 */

document.addEventListener('alpine:init', () => {
    // Register the x-collapse directive
    Alpine.directive('collapse', (el, { modifiers, expression }, { evaluateLater, cleanup }) => {
        // Initial setup
        const getStyle = (el, style) => window.getComputedStyle(el)[style];
        let overflow, height, opacity;
        
        // Store original overflow and transition values
        overflow = getStyle(el, 'overflow');

        // Add some basic transition styles if not already present
        if (!getStyle(el, 'transitionProperty').includes('height')) {
            el.style.transition = `height 250ms ease-out, opacity 200ms ease-out`;
        }

        // Handle enter (expand)
        const expand = () => {
            if (el._x_isShown) return;
            
            el._x_isShown = true;
            
            // Reset visibility
            el.style.visibility = null;
            el.style.height = 'auto';
            
            // Measure height
            height = getStyle(el, 'height');
            
            // Collapse first
            el.style.height = '0px';
            el.style.overflow = 'hidden';
            el.style.opacity = '0';
            
            // Force repaint
            void el.offsetHeight;
            
            // Expand
            el.style.height = height;
            el.style.opacity = '1';
            
            // Listen for transition end
            const transitionEnded = (e) => {
                if (e.target !== el || e.propertyName !== 'height') return;
                
                // Clean up after transition
                el.style.overflow = overflow;
                el.style.height = 'auto';
                
                el.removeEventListener('transitionend', transitionEnded);
            };
            
            el.addEventListener('transitionend', transitionEnded);
        };
        
        // Handle leave (collapse)
        const collapse = () => {
            if (!el._x_isShown) return;
            
            el._x_isShown = false;
            
            // Make sure we can measure height
            el.style.overflow = 'hidden';
            
            // Get current height
            height = getStyle(el, 'height');
            
            // Set explicit height
            el.style.height = height;
            
            // Force repaint
            void el.offsetHeight;
            
            // Collapse
            el.style.height = '0px';
            el.style.opacity = '0';
            
            // Listen for transition end
            const transitionEnded = (e) => {
                if (e.target !== el || e.propertyName !== 'height') return;
                
                // Set visibility to hidden after transition
                el.style.visibility = 'hidden';
                
                el.removeEventListener('transitionend', transitionEnded);
            };
            
            el.addEventListener('transitionend', transitionEnded);
        };

        // Connect to Alpine.js x-show directive
        cleanup(() => {
            // Remove any inline styles we added
            el.style.visibility = null;
            el.style.height = null;
            el.style.overflow = null;
            el.style.opacity = null;
        });

        // Monitor for x-show changes
        // This is a simplified implementation that works with Alpine.js v3
        el._x_doHide = () => collapse();
        el._x_doShow = () => expand();
    });

    console.log('Custom Alpine collapse directive registered');
});