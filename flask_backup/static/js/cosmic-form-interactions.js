/**
 * AstroBot AI - Cosmic Form Interactions
 * 
 * Enhances form elements with space-themed animations and
 * interactive feedback to create a smooth user experience
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all cosmic forms
  initCosmicForms();
  
  // Initialize password strength meters
  initPasswordStrengthMeters();
  
  // Initialize form validation
  initFormValidation();
  
  // Initialize multi-step forms
  initMultiStepForms();
});

/**
 * Initialize cosmic form animations and interactions
 */
function initCosmicForms() {
  // Add focus animations to form inputs
  const formInputs = document.querySelectorAll('.cosmic-form-input, .cosmic-form-select, .cosmic-form-textarea');
  
  formInputs.forEach(input => {
    // Add label animation
    const formGroup = input.closest('.cosmic-form-group');
    const label = formGroup ? formGroup.querySelector('.cosmic-form-label') : null;
    
    // Focus effects
    input.addEventListener('focus', function() {
      if (label) {
        label.style.color = 'rgba(99, 102, 241, 0.9)';
      }
      
      // Add subtle particle effect around the input
      createFocusParticles(input);
    });
    
    // Blur effects
    input.addEventListener('blur', function() {
      if (label) {
        label.style.color = '';
      }
      
      // Remove particle effect
      const particleContainer = document.querySelector('.focus-particles');
      if (particleContainer) {
        particleContainer.remove();
      }
    });
  });
  
  // Initialize radio and checkbox custom styling
  const customControls = document.querySelectorAll('.cosmic-form-radio input, .cosmic-form-checkbox input');
  
  customControls.forEach(control => {
    control.addEventListener('change', function() {
      if (this.checked) {
        // Add subtle pulse animation to indicator
        const indicator = this.nextElementSibling;
        
        // Reset animation by removing and re-adding class
        indicator.classList.remove('pulse-animation');
        void indicator.offsetWidth; // Trigger reflow
        indicator.classList.add('pulse-animation');
      }
    });
  });
  
  // Add form button effects
  const formButtons = document.querySelectorAll('.cosmic-form-button');
  
  formButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Don't add effects if button is disabled or loading
      if (this.disabled || this.classList.contains('loading')) {
        return;
      }
      
      // Add ripple effect on click
      const ripple = document.createElement('span');
      ripple.classList.add('button-ripple');
      
      // Position the ripple where the user clicked
      const rect = this.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      // Remove ripple after animation completes
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

/**
 * Create particle effect around focused inputs
 */
function createFocusParticles(input) {
  // Remove any existing particles
  const existingParticles = document.querySelector('.focus-particles');
  if (existingParticles) {
    existingParticles.remove();
  }
  
  // Create particle container
  const particleContainer = document.createElement('div');
  particleContainer.classList.add('focus-particles');
  
  // Position container relative to input
  const rect = input.getBoundingClientRect();
  particleContainer.style.position = 'absolute';
  particleContainer.style.top = `${rect.top - 10}px`;
  particleContainer.style.left = `${rect.left - 10}px`;
  particleContainer.style.width = `${rect.width + 20}px`;
  particleContainer.style.height = `${rect.height + 20}px`;
  particleContainer.style.pointerEvents = 'none';
  particleContainer.style.zIndex = '1';
  
  // Add to body
  document.body.appendChild(particleContainer);
  
  // Create particles
  const particleCount = 5;
  const colors = ['rgba(99, 102, 241, 0.7)', 'rgba(139, 92, 246, 0.7)'];
  
  for (let i = 0; i < particleCount; i++) {
    createParticle(particleContainer, colors);
  }
  
  // Start animation loop
  animateParticles(particleContainer);
}

/**
 * Create a single particle for focus effects
 */
function createParticle(container, colors) {
  const particle = document.createElement('div');
  
  // Random position along the border
  const borderPosition = Math.random();
  let x, y;
  
  if (borderPosition < 0.25) {
    // Top border
    x = Math.random() * 100;
    y = 0;
  } else if (borderPosition < 0.5) {
    // Right border
    x = 100;
    y = Math.random() * 100;
  } else if (borderPosition < 0.75) {
    // Bottom border
    x = Math.random() * 100;
    y = 100;
  } else {
    // Left border
    x = 0;
    y = Math.random() * 100;
  }
  
  // Set particle properties
  particle.style.position = 'absolute';
  particle.style.top = `${y}%`;
  particle.style.left = `${x}%`;
  particle.style.width = '4px';
  particle.style.height = '4px';
  particle.style.borderRadius = '50%';
  particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  particle.style.boxShadow = '0 0 6px 2px ' + particle.style.backgroundColor;
  
  // Set animation properties
  particle.dataset.vx = (Math.random() - 0.5) * 0.5; // X velocity
  particle.dataset.vy = (Math.random() - 0.5) * 0.5; // Y velocity
  
  container.appendChild(particle);
}

/**
 * Animate particles around the input
 */
function animateParticles(container) {
  if (!container || !document.body.contains(container)) {
    return; // Stop animation if container is gone
  }
  
  const particles = container.querySelectorAll('div');
  
  particles.forEach(particle => {
    // Get current position
    const x = parseFloat(particle.style.left);
    const y = parseFloat(particle.style.top);
    
    // Get velocity
    let vx = parseFloat(particle.dataset.vx);
    let vy = parseFloat(particle.dataset.vy);
    
    // Update position
    particle.style.left = `${x + vx}%`;
    particle.style.top = `${y + vy}%`;
    
    // Bounce off edges
    if (x <= 0 || x >= 100) {
      particle.dataset.vx = -vx;
    }
    
    if (y <= 0 || y >= 100) {
      particle.dataset.vy = -vy;
    }
  });
  
  // Continue animation
  requestAnimationFrame(() => animateParticles(container));
}

/**
 * Initialize password strength meter functionality
 */
function initPasswordStrengthMeters() {
  const passwordInputs = document.querySelectorAll('input[type="password"].with-strength-meter');
  
  passwordInputs.forEach(input => {
    // Find or create the strength meter
    let meterContainer = input.nextElementSibling;
    
    if (!meterContainer || !meterContainer.classList.contains('password-strength-meter')) {
      // Create meter if it doesn't exist
      meterContainer = document.createElement('div');
      meterContainer.classList.add('password-strength-meter');
      
      const meterBar = document.createElement('div');
      meterBar.classList.add('password-strength-meter-bar');
      meterContainer.appendChild(meterBar);
      
      // Insert after password input
      input.parentNode.insertBefore(meterContainer, input.nextSibling);
    }
    
    // Get the meter bar
    const meterBar = meterContainer.querySelector('.password-strength-meter-bar');
    
    // Update meter on input
    input.addEventListener('input', function() {
      const strengthScore = calculatePasswordStrength(this.value);
      
      // Update meter appearance
      meterBar.className = 'password-strength-meter-bar';
      if (strengthScore > 0) {
        meterBar.classList.add(`strength-${strengthScore}`);
      }
    });
  });
}

/**
 * Calculate password strength score (1-4)
 */
function calculatePasswordStrength(password) {
  let score = 0;
  
  // Skip empty passwords
  if (!password) {
    return score;
  }
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  }
  
  // Character variety checks
  if (/[A-Z]/.test(password)) {
    score += 1;
  }
  
  if (/[0-9]/.test(password)) {
    score += 1;
  }
  
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }
  
  return Math.min(4, score);
}

/**
 * Initialize form validation with cosmic-themed feedback
 */
function initFormValidation() {
  const forms = document.querySelectorAll('.cosmic-form.with-validation');
  
  forms.forEach(form => {
    // Get all inputs in the form
    const inputs = form.querySelectorAll('.cosmic-form-input, .cosmic-form-select, .cosmic-form-textarea');
    
    // Add input validation on blur
    inputs.forEach(input => {
      input.addEventListener('blur', function() {
        validateInput(this);
      });
    });
    
    // Validate all inputs on form submission
    form.addEventListener('submit', function(event) {
      let isValid = true;
      
      inputs.forEach(input => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });
      
      // Prevent submission if form is invalid
      if (!isValid) {
        event.preventDefault();
        
        // Scroll to first invalid input
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
      }
    });
  });
}

/**
 * Validate an individual form input
 */
function validateInput(input) {
  // Skip if the input doesn't have validation requirements
  if (!input.hasAttribute('required') && !input.pattern && !input.minLength) {
    return true;
  }
  
  let isValid = true;
  let errorMessage = '';
  
  // Required validation
  if (input.hasAttribute('required') && !input.value.trim()) {
    isValid = false;
    errorMessage = 'This field is required';
  }
  
  // Pattern validation
  if (isValid && input.pattern && input.value.trim()) {
    const pattern = new RegExp(input.pattern);
    if (!pattern.test(input.value)) {
      isValid = false;
      errorMessage = input.dataset.patternMessage || 'Invalid format';
    }
  }
  
  // Minimum length validation
  if (isValid && input.minLength && input.value.trim()) {
    if (input.value.length < input.minLength) {
      isValid = false;
      errorMessage = `Minimum length is ${input.minLength} characters`;
    }
  }
  
  // Email validation for email inputs
  if (isValid && input.type === 'email' && input.value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.value)) {
      isValid = false;
      errorMessage = 'Invalid email address';
    }
  }
  
  // Update input status classes
  input.classList.remove('is-valid', 'is-invalid');
  
  if (input.value.trim()) {
    if (isValid) {
      input.classList.add('is-valid');
    } else {
      input.classList.add('is-invalid');
    }
  }
  
  // Find or create feedback elements
  const formGroup = input.closest('.cosmic-form-group');
  
  if (formGroup) {
    // Valid feedback
    let validFeedback = formGroup.querySelector('.valid-feedback');
    if (!validFeedback) {
      validFeedback = document.createElement('div');
      validFeedback.classList.add('cosmic-form-feedback', 'valid-feedback');
      validFeedback.textContent = 'Looks good!';
      formGroup.appendChild(validFeedback);
    }
    
    // Invalid feedback
    let invalidFeedback = formGroup.querySelector('.invalid-feedback');
    if (!invalidFeedback) {
      invalidFeedback = document.createElement('div');
      invalidFeedback.classList.add('cosmic-form-feedback', 'invalid-feedback');
      formGroup.appendChild(invalidFeedback);
    }
    
    invalidFeedback.textContent = errorMessage;
  }
  
  return isValid;
}

/**
 * Initialize multi-step forms with progress indicators
 */
function initMultiStepForms() {
  const multiStepForms = document.querySelectorAll('.cosmic-form.multi-step');
  
  multiStepForms.forEach(form => {
    const steps = form.querySelectorAll('.form-step');
    const stepsCount = steps.length;
    
    if (stepsCount <= 1) {
      return; // Skip if there's only one step
    }
    
    // Create progress bar if it doesn't exist
    let progressContainer = form.querySelector('.cosmic-form-progress');
    
    if (!progressContainer) {
      progressContainer = document.createElement('div');
      progressContainer.classList.add('cosmic-form-progress');
      
      // Create progress bar
      const progressBar = document.createElement('div');
      progressBar.classList.add('cosmic-form-progress-bar');
      progressContainer.appendChild(progressBar);
      
      // Create step indicators
      for (let i = 0; i < stepsCount; i++) {
        const stepElement = document.createElement('div');
        stepElement.classList.add('cosmic-form-step');
        if (i === 0) {
          stepElement.classList.add('active');
        }
        
        const indicator = document.createElement('div');
        indicator.classList.add('cosmic-form-step-indicator');
        indicator.textContent = i + 1;
        
        const stepLabel = document.createElement('div');
        stepLabel.classList.add('cosmic-form-step-label');
        stepLabel.textContent = steps[i].dataset.title || `Step ${i + 1}`;
        
        stepElement.appendChild(indicator);
        stepElement.appendChild(stepLabel);
        progressContainer.appendChild(stepElement);
      }
      
      // Insert progress bar at the beginning of the form
      form.insertBefore(progressContainer, form.firstChild);
    }
    
    // Hide all steps except the first one
    steps.forEach((step, index) => {
      if (index === 0) {
        step.style.display = 'block';
      } else {
        step.style.display = 'none';
      }
    });
    
    // Add navigation buttons if they don't exist
    steps.forEach((step, index) => {
      let actionButtons = step.querySelector('.step-buttons');
      
      if (!actionButtons) {
        actionButtons = document.createElement('div');
        actionButtons.classList.add('cosmic-form-actions', 'step-buttons');
        
        // Previous button (except for first step)
        if (index > 0) {
          const prevButton = document.createElement('button');
          prevButton.type = 'button';
          prevButton.classList.add('cosmic-form-button', 'cosmic-form-button-secondary', 'prev-step');
          prevButton.textContent = 'Previous';
          actionButtons.appendChild(prevButton);
        }
        
        // Next/Submit button
        if (index < stepsCount - 1) {
          const nextButton = document.createElement('button');
          nextButton.type = 'button';
          nextButton.classList.add('cosmic-form-button', 'next-step');
          nextButton.textContent = 'Next';
          actionButtons.appendChild(nextButton);
        } else {
          const submitButton = document.createElement('button');
          submitButton.type = 'submit';
          submitButton.classList.add('cosmic-form-button');
          submitButton.textContent = 'Submit';
          actionButtons.appendChild(submitButton);
        }
        
        step.appendChild(actionButtons);
      }
    });
    
    // Add event listeners for navigation
    form.querySelectorAll('.next-step').forEach((button, index) => {
      button.addEventListener('click', function() {
        navigateToStep(form, index + 1);
      });
    });
    
    form.querySelectorAll('.prev-step').forEach((button, index) => {
      button.addEventListener('click', function() {
        // Account for the offset since the first step doesn't have a prev button
        const prevIndex = index > 0 ? index : 0;
        navigateToStep(form, prevIndex);
      });
    });
  });
}

/**
 * Navigate to a specific step in a multi-step form
 */
function navigateToStep(form, stepIndex) {
  const steps = form.querySelectorAll('.form-step');
  const stepsCount = steps.length;
  
  if (stepIndex < 0 || stepIndex >= stepsCount) {
    return; // Invalid step index
  }
  
  // Validate current step before moving to the next
  if (stepIndex > 0) {
    const currentStep = form.querySelector('.form-step[style*="display: block"]');
    const currentStepIndex = Array.from(steps).indexOf(currentStep);
    
    // Only validate when moving forward
    if (stepIndex > currentStepIndex) {
      const inputs = currentStep.querySelectorAll('.cosmic-form-input, .cosmic-form-select, .cosmic-form-textarea');
      let isValid = true;
      
      inputs.forEach(input => {
        if (!validateInput(input)) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        // Shake effect for invalid step
        currentStep.classList.add('shake-animation');
        setTimeout(() => {
          currentStep.classList.remove('shake-animation');
        }, 820);
        
        // Scroll to first invalid input
        const firstInvalid = currentStep.querySelector('.is-invalid');
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalid.focus();
        }
        
        return; // Don't proceed if validation fails
      }
    }
  }
  
  // Hide all steps and show the target step
  steps.forEach((step, index) => {
    step.style.display = 'none';
    if (index === stepIndex) {
      step.style.display = 'block';
      
      // Apply fade-in animation
      step.classList.add('fade-in-animation');
      setTimeout(() => {
        step.classList.remove('fade-in-animation');
      }, 500);
    }
  });
  
  // Update progress bar and step indicators
  const progressBar = form.querySelector('.cosmic-form-progress-bar');
  const stepIndicators = form.querySelectorAll('.cosmic-form-step');
  
  if (progressBar) {
    const progress = ((stepIndex + 1) / stepsCount) * 100;
    progressBar.style.width = `${progress}%`;
  }
  
  if (stepIndicators.length) {
    stepIndicators.forEach((indicator, index) => {
      indicator.classList.remove('active', 'completed');
      
      if (index === stepIndex) {
        indicator.classList.add('active');
      } else if (index < stepIndex) {
        indicator.classList.add('completed');
      }
    });
  }
  
  // Scroll to top of the form
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}