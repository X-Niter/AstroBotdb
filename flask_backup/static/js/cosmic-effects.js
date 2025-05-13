// AstroBot AI - Enhanced Cosmic Effects
// A comprehensive suite of space-themed animations and visual effects

/**
 * Copy code functionality for documentation blocks
 * Changes the button icon temporarily to show success
 */
function copyCode(button) {
    const pre = button.previousElementSibling;
    const code = pre.querySelector('code');
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code.textContent.trim())
            .then(() => {
                // Change button icon temporarily
                const originalIcon = button.innerHTML;
                button.innerHTML = '<i class="bi bi-check"></i>';
                
                // Show a tooltip-style notification
                const notification = document.createElement('div');
                notification.className = 'copy-notification';
                notification.textContent = 'Copied!';
                button.appendChild(notification);
                
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }
}

/**
 * Apply staggered animations to elements with the animate-on-scroll class
 * Uses IntersectionObserver for better performance
 */
function initStaggeredAnimations() {
    // Elements that should animate when scrolled into view
    const animateItems = document.querySelectorAll('.animate-on-scroll, .doc-content > h1, .doc-content > h2, .doc-content > p, .card, .glass-card, .feature-card');
    
    if (animateItems.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add delay based on index for staggered effect
                setTimeout(() => {
                    entry.target.classList.add('animated', 'animate__fadeInUp');
                }, index * 100); // 100ms delay between each item
                
                // Unobserve after animation to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
    
    animateItems.forEach((item) => {
        observer.observe(item);
    });
}

/**
 * Initialize twinkling stars background effect
 * Creates various sized stars with random positions and animations
 * Optimized to prevent clipping issues
 */
function initTwinklingStars() {
    // Find a suitable container or use body as last resort
    const starsContainer = document.querySelector('.cosmic-stars-bg') || 
                           document.querySelector('.cosmic-space-bg') || 
                           document.getElementById('starsContainer') || 
                           document.body;
    
    // Create a contained div for the stars if one doesn't exist
    let starField = document.getElementById('star-field-container');
    if (!starField) {
        starField = document.createElement('div');
        starField.id = 'star-field-container';
        starField.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
        `;
        starsContainer.appendChild(starField);
    }
    
    // Responsive star count based on viewport size
    const viewportArea = Math.min(window.innerWidth * window.innerHeight / 1000, 500);
    const starCount = Math.max(50, Math.min(viewportArea, 200)); 
    
    // Remove existing stars if re-initializing
    const existingStars = starField.querySelectorAll('.star');
    existingStars.forEach(star => star.remove());
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position - slightly inset to prevent clipping
        const top = Math.random() * 95 + 2.5; // 2.5-97.5%
        const left = Math.random() * 95 + 2.5; // 2.5-97.5%
        
        // Random size (0.5-3px) - smaller stars are less likely to cause rendering issues
        const size = Math.random() * 2.5 + 0.5;
        
        // Random opacity and animation duration for twinkling effect
        const opacity = Math.random() * 0.7 + 0.3;
        const duration = Math.random() * 5 + 3;
        
        star.style.cssText = `
            position: absolute;
            top: ${top}%;
            left: ${left}%;
            width: ${size}px;
            height: ${size}px;
            --initial-opacity: ${opacity};
            --twinkle-duration: ${duration}s;
            transform: translateZ(0);
            will-change: opacity;
            box-shadow: 0 0 ${size/2}px rgba(255, 255, 255, ${opacity*0.8});
            border-radius: 50%;
            background-color: #fff;
        `;
        
        starField.appendChild(star);
    }
}

/**
 * Create shooting stars effect
 * Animates diagonal lines across the screen
 * Optimized to prevent clipping issues
 */
function initShootingStars() {
    // Use a specific container for better control instead of the body
    const container = document.querySelector('.cosmic-stars-bg') || document.querySelector('.cosmic-space-bg') || document.body;
    const shootingStarCount = 3;
    
    // Clean up existing shooting stars if re-initializing
    const existingStars = document.querySelectorAll('.shooting-star-wrapper');
    existingStars.forEach(star => star.remove());
    
    // Create a container div to hold all shooting stars if needed
    let starContainer = document.getElementById('shooting-stars-container');
    if (!starContainer) {
        starContainer = document.createElement('div');
        starContainer.id = 'shooting-stars-container';
        starContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
        `;
        container.appendChild(starContainer);
    }
    
    for (let i = 0; i < shootingStarCount; i++) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('shooting-star-wrapper');
        
        const star = document.createElement('div');
        star.classList.add('shooting-star');
        
        // Random position and angle - contained within the visible area to avoid clipping
        const top = Math.random() * 40 + 5; // 5-45% from top
        const left = Math.random() * 70 + 5; // 5-75% from left
        const angle = Math.random() * 20 + 15; // 15-35 degrees
        
        // Random animation delay and duration
        const delay = Math.random() * 15 + i * 5; // Ensure they don't all animate at once
        const duration = Math.random() * 1.5 + 0.7; // 0.7-2.2s
        
        wrapper.style.cssText = `
            position: absolute;
            top: ${top}%;
            left: ${left}%;
            z-index: 0;
            transform: rotate(${angle}deg) translateZ(0);
            opacity: 0;
            animation: shootingStar ${duration}s ease-out ${delay}s infinite;
            will-change: transform, opacity;
            overflow: hidden;
            width: 150px;
            height: 150px;
            pointer-events: none;
        `;
        
        star.style.cssText = `
            width: 100px;
            height: 1px;
            background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 50%, rgba(255,255,255,0.8) 100%);
            border-radius: 50%;
            box-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
            transform: translateZ(0);
        `;
        
        wrapper.appendChild(star);
        starContainer.appendChild(wrapper);
    }
}

/**
 * Initialize cosmic dust particles
 * Creates floating specs of "space dust" in containers
 */
function initCosmicDust() {
    const dustContainers = document.querySelectorAll('.cosmic-dust');
    
    dustContainers.forEach(container => {
        // Clean existing particles if re-initializing
        const existingParticles = container.querySelectorAll('.dust-particle');
        existingParticles.forEach(particle => particle.remove());
        
        // Number of dust particles - responsive to container size
        const containerSize = container.offsetWidth * container.offsetHeight;
        const particleCount = Math.min(Math.max(5, Math.floor(containerSize / 10000)), 25);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('dust-particle');
            
            // Random position
            const top = Math.random() * 100;
            const left = Math.random() * 100;
            
            // Random size (1-3px)
            const size = Math.random() * 2 + 1;
            
            // Random opacity
            const opacity = Math.random() * 0.5 + 0.2;
            
            // Random animation duration (3-8s)
            const duration = Math.random() * 5 + 3;
            
            // Random color (blue, purple, white)
            const colors = [
                'rgba(255, 255, 255, ${opacity})',
                'rgba(147, 197, 253, ${opacity})',
                'rgba(167, 139, 250, ${opacity})'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)].replace('${opacity}', opacity);
            
            particle.style.cssText = `
                position: absolute;
                top: ${top}%;
                left: ${left}%;
                width: ${size}px;
                height: ${size}px;
                background-color: ${color};
                border-radius: 50%;
                animation: float ${duration}s infinite ease-in-out;
                animation-delay: ${Math.random() * 5}s;
                z-index: 1;
                pointer-events: none;
            `;
            
            container.appendChild(particle);
        }
    });
}

/**
 * Apply parallax effect to background elements on scroll
 * Creates depth illusion when scrolling
 */
function initParallaxEffect() {
    // Elements that should move at different speeds when scrolling
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;
    
    const handleScroll = () => {
        const scrollY = window.scrollY;
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.2;
            const offsetY = scrollY * speed;
            
            element.style.transform = `translateY(${offsetY}px)`;
        });
    };
    
    // Initial position
    handleScroll();
    
    // Update on scroll with throttling for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!scrollTimeout) {
            scrollTimeout = setTimeout(() => {
                handleScroll();
                scrollTimeout = null;
            }, 10);
        }
    });
}

/**
 * Initialize glow effects for buttons and UI elements
 * Adds subtle pulse animations to key interactive elements
 */
function initGlowEffects() {
    const glowElements = document.querySelectorAll('.btn-primary, .btn-cosmic, .feature-icon, [data-glow]');
    
    glowElements.forEach(element => {
        // Add glow shadow class if not already present
        if (!element.classList.contains('cosmic-glow')) {
            element.classList.add('cosmic-glow');
        }
    });
}

/**
 * Apply space-like lighting effects to 3D card elements
 * Creates subtle gradient overlays to simulate space lighting
 */
function initSpaceLighting() {
    const cards = document.querySelectorAll('.glass-card, .card, [data-space-lighting]');
    
    cards.forEach(card => {
        if (!card.querySelector('.space-lighting-overlay')) {
            const overlay = document.createElement('div');
            overlay.classList.add('space-lighting-overlay');
            overlay.style.cssText = `
                position: absolute;
                inset: 0;
                background: linear-gradient(45deg, rgba(59, 130, 246, 0.05), transparent 30%, rgba(139, 92, 246, 0.07));
                border-radius: inherit;
                pointer-events: none;
            `;
            card.style.position = card.style.position || 'relative';
            card.appendChild(overlay);
        }
    });
}

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all cosmic effects
    initStaggeredAnimations();
    initCosmicDust();
    initTwinklingStars();
    initShootingStars();
    initParallaxEffect();
    initGlowEffects();
    initSpaceLighting();
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltipTriggerList.forEach(tooltipTriggerEl => {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Initialize documentation-specific elements
    const feedbackButtons = document.querySelectorAll('#feedback-helpful, #feedback-needs-work, #feedback-suggest');
    feedbackButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Highlight the clicked button
            feedbackButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show a thank you message
            const feedbackSection = document.querySelector('.documentation-feedback');
            if (feedbackSection) {
                const originalContent = feedbackSection.innerHTML;
                feedbackSection.innerHTML = `
                    <div class="cosmic-dust"></div>
                    <h5 class="mb-3"><i class="bi bi-check-circle-fill me-2 text-success"></i> Thank You for Your Feedback!</h5>
                    <p class="mb-0">We appreciate your input and will use it to improve our documentation.</p>
                `;
                
                // Reinitialize cosmic dust
                initCosmicDust();
            }
        });
    });
    
    // Add animated indicator to navigation items that match current page
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .cosmic-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href) && href !== '/') {
            link.classList.add('active', 'cosmic-glow');
        }
    });
    
    // Fix for long code blocks - add horizontal scrolling
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        if (block.scrollWidth > block.clientWidth) {
            const container = block.parentElement;
            container.style.overflowX = 'auto';
        }
    });
});