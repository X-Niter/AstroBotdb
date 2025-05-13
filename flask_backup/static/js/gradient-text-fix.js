/**
 * AstroBot AI - Gradient Text Rendering Optimization
 * 
 * This specialized script fixes rendering issues with gradient text,
 * particularly focused on clipping problems with background-clip: text elements
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for fonts to load before fixing gradient text
    setTimeout(fixGradientTextRendering, 300);
    
    // Also fix on window resize
    window.addEventListener('resize', debounce(fixGradientTextRendering, 200));
    
    // Fix again after all resources load (for late-loading fonts)
    window.addEventListener('load', fixGradientTextRendering);
});

/**
 * Comprehensively fix gradient text rendering issues
 */
function fixGradientTextRendering() {
    console.log('Optimizing gradient text rendering...');
    
    // Identify all gradient text elements
    const gradientTextElements = document.querySelectorAll('.text-transparent.bg-clip-text, [class*="bg-gradient"].text-transparent');
    
    gradientTextElements.forEach(element => {
        // Save original content for proper remeasuring
        const originalContent = element.innerHTML;
        
        // Fix CSS properties
        element.style.webkitBackgroundClip = 'text';
        element.style.backgroundClip = 'text';
        element.style.webkitTextFillColor = 'transparent';
        element.style.display = 'inline-block';
        element.style.overflow = 'visible';
        element.style.maxWidth = '100%';
        element.style.overflowWrap = 'break-word';
        element.style.wordWrap = 'break-word';
        element.style.whiteSpace = 'normal';
        
        // Add protective padding to prevent cropping
        element.style.paddingRight = '0.25em';
        element.style.paddingLeft = '0.1em';
        
        // Ensure the gradient starts properly
        if (element.classList.contains('bg-gradient-to-r')) {
            element.style.backgroundPosition = '0 0';
            element.style.backgroundSize = '100% 100%';
        }
        
        // Wrap text in spans to prevent clipping on line breaks for multi-line text
        if (element.innerHTML.includes('<br>') || element.innerHTML.includes('</br>')) {
            const lines = originalContent.split(/<br\s*\/?>/i);
            element.innerHTML = lines.map(line => 
                `<span class="d-inline-block" style="max-width: 100%; overflow-wrap: break-word;">${line}</span>`
            ).join('<br>');
        }
    });
    
    // Fix navbar brand specifically (often an issue area)
    const navbarBrand = document.querySelectorAll('.navbar-brand .text-transparent, .navbar-brand-astro .text-transparent');
    navbarBrand.forEach(brand => {
        brand.style.paddingLeft = '0.1em';
    });
}

/**
 * Debounce function to prevent excessive function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}