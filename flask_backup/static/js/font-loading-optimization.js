/**
 * AstroBot AI - Font Loading Optimization
 * 
 * This script manages the optimal loading of custom fonts
 * to prevent layout shifts and ensure text renders properly
 */

(function() {
  // Check if FontFace API is supported
  if ('FontFace' in window) {
    // Function to load a font with proper timeout
    function loadFont(fontFamily, url, weight = 'normal', style = 'normal') {
      return new Promise((resolve, reject) => {
        try {
          const font = new FontFace(fontFamily, `url(${url})`, {
            weight: weight,
            style: style,
            display: 'swap' // Use system font while custom font loads
          });
          
          // Set a timeout to prevent hanging on font load
          const timeoutId = setTimeout(() => {
            console.log(`Font loading timeout for ${fontFamily} ${weight} ${style}`);
            resolve(false); // Resolve with false to indicate timeout
          }, 3000); // 3 second timeout
          
          // Load the font
          font.load().then(loadedFont => {
            clearTimeout(timeoutId);
            document.fonts.add(loadedFont);
            resolve(true);
          }).catch(err => {
            clearTimeout(timeoutId);
            console.warn(`Error loading font ${fontFamily} ${weight} ${style}:`, err);
            resolve(false); // Resolve with false to indicate error
          });
        } catch(e) {
          console.warn('Font loading error:', e);
          resolve(false);
        }
      });
    }
    
    // Main fonts to load for the space theme
    const fontsToLoad = [
      {
        family: 'Poppins',
        urls: [
          { url: 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.woff2', weight: '400' },
          { url: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLGT9Z1xlFQ.woff2', weight: '500' },
          { url: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6Z1xlFQ.woff2', weight: '600' },
          { url: 'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2', weight: '700' }
        ]
      },
      {
        family: 'Space Grotesk',
        urls: [
          { url: 'https://fonts.gstatic.com/s/spacegrotesk/v15/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7oUXskPMBBSSJLm2E.woff2', weight: '400' },
          { url: 'https://fonts.gstatic.com/s/spacegrotesk/v15/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj7aUXskPMBBSSJLm2E.woff2', weight: '700' }
        ]
      }
    ];
    
    // Load all fonts in parallel, then add the class when done
    Promise.all(
      fontsToLoad.flatMap(font => 
        font.urls.map(item => 
          loadFont(font.family, item.url, item.weight, item.style || 'normal')
        )
      )
    ).then(() => {
      // Add the class to indicate fonts are loaded
      document.documentElement.classList.add('fonts-loaded');
      
      // Fix any gradient text issues after fonts are loaded
      if (window.fixGradientTextRendering) {
        setTimeout(window.fixGradientTextRendering, 100);
      }
    });
  } else {
    // If FontFace API is not supported, add the class immediately to use fallbacks
    document.documentElement.classList.add('fonts-loaded');
  }
})();