/**
 * AstroBot AI - Alpine.js Plugins
 * 
 * This file contains custom Alpine.js plugin implementations and extensions
 * that enhance the UI functionality of the application.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Alpine.js plugins initializing');
    registerAlpinePlugins();
});

/**
 * Register custom Alpine.js plugins
 */
function registerAlpinePlugins() {
    // Collapse plugin implementation
    document.addEventListener('alpine:init', () => {
        // Create a global reference to expose this directive for potential use
        window.AlpineCollapse = true;
        
        Alpine.directive('collapse', (el, { modifiers, expression }, { evaluate, effect }) => {
            // Parse duration from modifiers
            let duration = 300; // Default duration
            
            // Handle duration modifier - supports both dot and colon syntax
            modifiers.forEach(mod => {
                if (mod.startsWith('duration.') || mod.startsWith('duration:')) {
                    const durationVal = mod.split(/[.:]/)[1];
                    if (durationVal.endsWith('ms')) {
                        duration = parseInt(durationVal);
                    } else if (durationVal.endsWith('s')) {
                        duration = parseFloat(durationVal) * 1000;
                    } else {
                        duration = parseInt(durationVal);
                    }
                }
            });
            
            // Store original styles
            const originalStyles = {
                paddingTop: el.style.paddingTop,
                paddingBottom: el.style.paddingBottom,
                overflow: el.style.overflow,
                height: el.style.height,
                opacity: el.style.opacity,
                transition: el.style.transition,
                display: el.style.display
            };
            
            // Set initial style setup
            el.style.overflow = 'hidden';
            
            // Set transition style
            if (!el.style.transition) {
                el.style.transition = `height ${duration}ms ease-out, opacity ${duration}ms ease-out, padding ${duration}ms ease-out`;
            }
            
            const showEl = () => {
                // First get the height with all styling removed
                el.style.display = '';
                el.style.height = 'auto';
                el.style.paddingTop = originalStyles.paddingTop;
                el.style.paddingBottom = originalStyles.paddingBottom;
                el.style.opacity = '1';
                
                const height = el.scrollHeight;
                
                // Now set to 0 and trigger transition
                el.style.height = '0px';
                
                // Force browser to recognize the transition
                void el.offsetWidth;
                
                // Trigger transition
                el.style.height = `${height}px`;
                
                // After transition, reset styles
                setTimeout(() => {
                    el.style.height = 'auto';
                    el.style.overflow = 'visible';
                }, duration);
            };
            
            const hideEl = () => {
                // Set to exact height before transition
                const height = el.scrollHeight;
                el.style.height = `${height}px`;
                el.style.overflow = 'hidden';
                
                // Force browser to recognize the transition
                void el.offsetWidth;
                
                // Trigger transition
                el.style.height = '0px';
                el.style.opacity = '0';
                
                // Only change display property after transition to maintain animation
                if (modifiers.includes('display-none')) {
                    setTimeout(() => {
                        el.style.display = 'none';
                    }, duration);
                }
            };
            
            // Handle Alpine x-show integration when available
            if (typeof el._x_isShown !== 'undefined') {
                effect(() => {
                    if (el._x_isShown) {
                        showEl();
                    } else {
                        hideEl();
                    }
                });
            } else {
                // Standard evaluation
                effect(() => {
                    const shouldShow = evaluate(expression);
                    if (shouldShow) {
                        showEl();
                    } else {
                        hideEl();
                    }
                });
            }
        });
        
        console.log('Alpine collapse directive registered');
        
        // Trigger event so other components know plugins are ready
        window.dispatchEvent(new CustomEvent('alpine-plugins-ready'));
    });
}