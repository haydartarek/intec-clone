/**
 * Accessible Accordion Component for INTEC Brussels
 * Implements WCAG 2.1 AA guidelines for keyboard navigation and screen readers
 */

class AccessibleAccordion {
  constructor(container) {
    this.container = container;
    this.triggers = container.querySelectorAll('.accordion-trigger');
    this.panels = container.querySelectorAll('.accordion-panel');
    
    this.init();
  }
  
  init() {
    // Set initial states
    this.triggers.forEach((trigger, index) => {
      // Set up ARIA attributes
      trigger.setAttribute('tabindex', index === 0 ? '0' : '-1');
      
      // Add event listeners
      trigger.addEventListener('click', (e) => this.handleClick(e));
      trigger.addEventListener('keydown', (e) => this.handleKeydown(e));
    });
    
    // Ensure only one panel is open initially (first one)
    this.closeAllPanels();
    if (this.triggers.length > 0) {
      this.openPanel(this.triggers[0]);
    }
  }
  
  handleClick(event) {
    const trigger = event.currentTarget;
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    
    if (trigger.getAttribute('aria-expanded') === 'true') {
      this.closePanel(trigger);
    } else {
      this.closeAllPanels();
      this.openPanel(trigger);
    }
    
    // Focus management
    trigger.focus();
  }
  
  handleKeydown(event) {
    const trigger = event.currentTarget;
    const triggers = Array.from(this.triggers);
    const currentIndex = triggers.indexOf(trigger);
    
    let targetTrigger = null;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        targetTrigger = triggers[currentIndex + 1] || triggers[0];
        break;
        
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        targetTrigger = triggers[currentIndex - 1] || triggers[triggers.length - 1];
        break;
        
      case 'Home':
        event.preventDefault();
        targetTrigger = triggers[0];
        break;
        
      case 'End':
        event.preventDefault();
        targetTrigger = triggers[triggers.length - 1];
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.handleClick(event);
        return;
    }
    
    if (targetTrigger) {
      // Update tabindex
      triggers.forEach(t => t.setAttribute('tabindex', '-1'));
      targetTrigger.setAttribute('tabindex', '0');
      targetTrigger.focus();
    }
  }
  
  openPanel(trigger) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    
    trigger.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('tabindex', '0');
    panel.setAttribute('aria-hidden', 'false');
    
    // Smooth animation
    panel.style.maxHeight = panel.scrollHeight + 'px';
    
    // Announce to screen readers
    this.announceChange(trigger, 'expanded');
  }
  
  closePanel(trigger) {
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));
    
    trigger.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    
    // Smooth animation
    panel.style.maxHeight = '0';
    
    // Announce to screen readers
    this.announceChange(trigger, 'collapsed');
  }
  
  closeAllPanels() {
    this.triggers.forEach(trigger => {
      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('tabindex', '-1');
      panel.setAttribute('aria-hidden', 'true');
      panel.style.maxHeight = '0';
    });
  }
  
  announceChange(trigger, state) {
    // Create a live region announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `${trigger.querySelector('.accordion-title').textContent} ${state}`;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// Initialize accordion when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const accordionContainers = document.querySelectorAll('.accordion-container');
  accordionContainers.forEach(container => {
    new AccessibleAccordion(container);
  });
});

// Loading state management
class LoadingStateManager {
  constructor() {
    this.init();
  }
  
  init() {
    // Show loading skeleton initially
    this.showLoading();
    
    // Simulate content loading (replace with actual data loading)
    setTimeout(() => {
      this.hideLoading();
      this.showContent();
    }, 500);
  }
  
  showLoading() {
    const loadingElement = document.querySelector('.programs-loading');
    const contentElement = document.querySelector('.programs-grid');
    
    if (loadingElement && contentElement) {
      loadingElement.style.display = 'block';
      loadingElement.setAttribute('aria-hidden', 'false');
      contentElement.style.display = 'none';
      contentElement.setAttribute('aria-hidden', 'true');
    }
  }
  
  hideLoading() {
    const loadingElement = document.querySelector('.programs-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
      loadingElement.setAttribute('aria-hidden', 'true');
    }
  }
  
  showContent() {
    const contentElement = document.querySelector('.programs-grid');
    if (contentElement) {
      contentElement.style.display = 'grid';
      contentElement.setAttribute('aria-hidden', 'false');
      
      // Trigger fade-in animation
      contentElement.classList.add('content-loaded');
    }
  }
  
  showEmptyState() {
    const emptyElement = document.querySelector('.programs-empty');
    const contentElement = document.querySelector('.programs-grid');
    
    if (emptyElement && contentElement) {
      contentElement.style.display = 'none';
      emptyElement.style.display = 'block';
      emptyElement.setAttribute('aria-live', 'polite');
    }
  }
}

// Initialize loading state management
document.addEventListener('DOMContentLoaded', () => {
  new LoadingStateManager();
});

// Performance optimization for scroll animations
let ticking = false;

function updateAnimations() {
  // Add intersection observer for fade-up animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  document.querySelectorAll('[data-animate="fade-up"]').forEach(el => {
    observer.observe(el);
  });
  
  ticking = false;
}

// Debounced scroll handler
function requestTick() {
  if (!ticking) {
    requestAnimationFrame(updateAnimations);
    ticking = true;
  }
}

// Initialize animations
document.addEventListener('DOMContentLoaded', () => {
  requestTick();
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AccessibleAccordion, LoadingStateManager };
}