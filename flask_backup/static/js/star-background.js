/**
 * AstroBot AI - Star Background Animation
 * 
 * Creates an interactive star background that enhances the space theme
 * with subtle animations and parallax effects that don't distract from content
 */

(function() {
  // Only initialize on pages with the .star-background element
  const starContainers = document.querySelectorAll('.star-background');
  
  if (starContainers.length === 0) return;
  
  // Create the stars for each container
  starContainers.forEach(container => createStarBackground(container));
  
  /**
   * Creates a star background within the specified container
   */
  function createStarBackground(container) {
    // Set container style
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.classList.add('star-canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0';
    canvas.style.opacity = '0.8';
    
    // Append canvas to container
    container.appendChild(canvas);
    
    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    
    // Initialize canvas size
    setCanvasSize();
    
    // Update canvas size on window resize
    window.addEventListener('resize', setCanvasSize);
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    
    // Star properties
    const stars = [];
    const starCount = Math.min(Math.floor(canvas.width * canvas.height / 5000), 300); // Limit max stars
    const starSizes = [1, 1.5, 2, 2.5];
    const starColors = [
      'rgba(255, 255, 255, 0.8)',
      'rgba(173, 216, 230, 0.8)',
      'rgba(240, 240, 255, 0.8)',
      'rgba(200, 200, 255, 0.8)',
      'rgba(255, 200, 200, 0.8)',
      'rgba(200, 255, 255, 0.8)'
    ];
    
    // Create stars
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: starSizes[Math.floor(Math.random() * starSizes.length)],
        color: starColors[Math.floor(Math.random() * starColors.length)],
        speed: Math.random() * 0.05 + 0.01,
        alpha: Math.random() * 0.5 + 0.5,
        alphaChange: Math.random() * 0.005 + 0.001,
        alphaDirection: Math.random() > 0.5 ? 1 : -1
      });
    }
    
    // Mouse position for parallax effect
    let mouseX = 0;
    let mouseY = 0;
    
    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    });
    
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Animation loop
    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw stars
      stars.forEach(star => {
        // Update star alpha for twinkling effect
        if (!prefersReducedMotion) {
          star.alpha += star.alphaChange * star.alphaDirection;
          if (star.alpha > 1) {
            star.alpha = 1;
            star.alphaDirection = -1;
          } else if (star.alpha < 0.5) {
            star.alpha = 0.5;
            star.alphaDirection = 1;
          }
        }
        
        // Apply parallax effect based on mouse position
        const parallaxX = prefersReducedMotion ? 0 : (mouseX - 0.5) * 20 * star.speed;
        const parallaxY = prefersReducedMotion ? 0 : (mouseY - 0.5) * 20 * star.speed;
        
        // Draw star
        ctx.beginPath();
        ctx.arc(
          star.x + parallaxX,
          star.y + parallaxY,
          star.radius,
          0,
          Math.PI * 2
        );
        
        // Set star color with current alpha
        const color = star.color.replace(/[\d\.]+\)$/, star.alpha + ')');
        ctx.fillStyle = color;
        ctx.fill();
      });
      
      // Continue animation loop
      requestAnimationFrame(animate);
    }
    
    // Start animation
    animate();
  }
  
  // Add shooting stars occasionally
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setInterval(() => {
      const container = starContainers[Math.floor(Math.random() * starContainers.length)];
      
      // Create shooting star element
      const shootingStar = document.createElement('div');
      shootingStar.classList.add('shooting-star');
      shootingStar.style.position = 'absolute';
      shootingStar.style.width = '2px';
      shootingStar.style.height = '2px';
      shootingStar.style.backgroundColor = 'white';
      shootingStar.style.boxShadow = '0 0 5px 1px white';
      shootingStar.style.borderRadius = '50%';
      shootingStar.style.zIndex = '1';
      shootingStar.style.pointerEvents = 'none';
      
      // Random position and angle
      const startX = Math.random() * container.offsetWidth;
      const startY = Math.random() * container.offsetHeight;
      const angle = Math.random() * Math.PI / 4 + Math.PI / 4; // 45-90 degrees
      
      // Set initial position
      shootingStar.style.left = startX + 'px';
      shootingStar.style.top = startY + 'px';
      
      // Add shooting star to container
      container.appendChild(shootingStar);
      
      // Animate shooting star
      shootingStar.animate(
        [
          { 
            transform: 'translate(0, 0) scale(1)',
            opacity: 1
          },
          { 
            transform: `translate(${Math.cos(angle) * 200}px, ${Math.sin(angle) * 200}px) scale(0.2)`,
            opacity: 0
          }
        ],
        {
          duration: 1000,
          easing: 'ease-out'
        }
      );
      
      // Remove shooting star after animation
      setTimeout(() => {
        shootingStar.remove();
      }, 1000);
    }, 10000); // Create a shooting star every 10 seconds
  }
})();