/**
 * AstroBot AI - Dynamic Clipping Detection & Fixing
 * 
 * This script provides runtime fixes for UI elements that might still
 * have overflow or clipping issues despite CSS fixes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for any fonts to load
    setTimeout(function() {
        console.log('Initializing dynamic clipping fixes...');
        // Fix layout issues on initial load
        fixClippingIssues();
        
        // Apply specific fixes for landing page
        fixLandingPageLayout();
        
        // Also fix on window resize
        window.addEventListener('resize', debounce(function() {
            fixClippingIssues();
            fixLandingPageLayout();
        }, 250));
        
        // Re-check after all resources load
        window.addEventListener('load', function() {
            fixClippingIssues();
            fixLandingPageLayout();
        });
    }, 500);
});

/**
 * Main function to detect and fix clipping issues
 */
function fixClippingIssues() {
    // Fix headings that might be too wide
    fixHeadingOverflow();
    
    // Fix side navigation if it's clipping
    fixSidebarClipping();
    
    // Fix gradients that might be clipped
    fixGradientText();
    
    // Fix positioned content that might extend beyond viewport
    fixPositionedContent();
    
    // Fix SVG elements that might overflow
    fixSvgOverflow();
}

/**
 * Fix headings that might overflow their containers
 */
function fixHeadingOverflow() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .display-1, .display-2, .display-3, .display-4, .display-5, .display-6');
    
    headings.forEach(heading => {
        const parent = heading.parentElement;
        if (!parent) return;
        
        const parentWidth = parent.clientWidth;
        const headingWidth = heading.scrollWidth;
        
        // If heading is wider than its parent container
        if (headingWidth > parentWidth) {
            // Calculate a new font size based on current size and how much it overflows
            const currentSize = parseInt(window.getComputedStyle(heading).fontSize);
            const scaleFactor = parentWidth / headingWidth;
            const newSize = Math.floor(currentSize * scaleFactor * 0.95); // 5% buffer
            
            // Apply new size
            heading.style.fontSize = `${newSize}px`;
            heading.style.lineHeight = '1.2';
            heading.style.maxWidth = '100%';
            heading.style.overflowWrap = 'break-word';
        }
    });
}

/**
 * Fix any sidebar/navigation elements that might be clipping
 */
function fixSidebarClipping() {
    const sidenavs = document.querySelectorAll('.sidebar, .side-navigation, .side-navbar-astro, .sidenav');
    
    sidenavs.forEach(nav => {
        // Ensure sidebar doesn't exceed viewport width
        nav.style.maxWidth = 'calc(100vw - 30px)';
        nav.style.overflowX = 'hidden';
        
        // Find all links and ensure they don't overflow
        const links = nav.querySelectorAll('a, .nav-link, .nav-item');
        links.forEach(link => {
            link.style.maxWidth = '100%';
            link.style.overflowWrap = 'break-word';
            link.style.whiteSpace = 'normal';
        });
    });
}

/**
 * Fix gradient text elements that might be clipping
 */
function fixGradientText() {
    const gradientTexts = document.querySelectorAll('.text-transparent.bg-clip-text');
    
    gradientTexts.forEach(text => {
        // Ensure gradient text doesn't clip at edges
        text.style.paddingRight = '0.25em';
        text.style.display = 'inline-block';
        text.style.maxWidth = '100%';
    });
}

/**
 * Fix absolutely positioned content that might extend beyond viewport
 */
function fixPositionedContent() {
    const positioned = document.querySelectorAll('.position-absolute, .position-fixed');
    
    positioned.forEach(element => {
        const rect = element.getBoundingClientRect();
        
        // If element extends beyond right edge of viewport
        if (rect.right > window.innerWidth) {
            element.style.right = '0';
            element.style.left = 'auto';
        }
        
        // If element extends beyond bottom edge of viewport
        if (rect.bottom > window.innerHeight && !element.classList.contains('ignore-overflow')) {
            element.style.bottom = '0';
            element.style.top = 'auto';
        }
    });
}

/**
 * Fix SVG elements that might be overflowing
 */
function fixSvgOverflow() {
    const svgs = document.querySelectorAll('svg');
    
    svgs.forEach(svg => {
        // Add preserveAspectRatio attribute if not present
        if (!svg.hasAttribute('preserveAspectRatio')) {
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        }
        
        // Ensure SVG is responsive
        if (!svg.hasAttribute('viewBox') && svg.hasAttribute('width') && svg.hasAttribute('height')) {
            const width = svg.getAttribute('width');
            const height = svg.getAttribute('height');
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            svg.style.width = '100%';
            svg.style.height = 'auto';
            svg.style.maxWidth = width + 'px';
        }
    });
}

/**
 * Specific fixes for the landing page layout
 */
function fixLandingPageLayout() {
    // Fix landing page hero section content
    const heroSections = document.querySelectorAll('.relative.overflow-hidden.bg-gradient-cosmic');
    
    heroSections.forEach(hero => {
        // Ensure the hero section doesn't clip
        hero.style.maxWidth = '100vw';
        hero.style.overflowX = 'hidden';
        
        // Fix the container inside hero section
        const container = hero.querySelector('.container');
        if (container) {
            container.style.maxWidth = 'calc(100vw - 30px)';
            container.style.boxSizing = 'border-box';
            container.style.paddingLeft = 'max(15px, 5%)';
            container.style.paddingRight = 'max(15px, 5%)';
        }
        
        // Fix any gradients in headings
        const gradientTexts = hero.querySelectorAll('.text-transparent.bg-clip-text');
        gradientTexts.forEach(text => {
            text.style.display = 'inline-block';
            text.style.maxWidth = '100%';
            text.style.overflowWrap = 'break-word';
        });
        
        // Fix any SVG animations
        const svgs = hero.querySelectorAll('svg');
        svgs.forEach(svg => {
            // Make SVG responsive
            svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svg.style.maxWidth = '100%';
            svg.style.height = 'auto';
        });
    });
    
    // Fix feature section layout
    const featureSections = document.querySelectorAll('#features');
    featureSections.forEach(section => {
        // Fix container
        const container = section.querySelector('.container');
        if (container) {
            container.style.maxWidth = 'calc(100vw - 30px)';
            container.style.boxSizing = 'border-box';
            container.style.paddingLeft = 'max(15px, 5%)';
            container.style.paddingRight = 'max(15px, 5%)';
        }
        
        // Fix feature cards
        const cards = section.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.maxWidth = '100%';
            card.style.overflowX = 'hidden';
        });
    });
    
    // General fix for any main elements
    const main = document.querySelector('main');
    if (main) {
        main.style.maxWidth = '100vw';
        main.style.overflowX = 'hidden';
        main.style.position = 'relative';
    }
}

/**
 * Debounce function to limit how often a function runs during rapid events like resize
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