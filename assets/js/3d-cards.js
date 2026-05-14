// 3D Tilt Effect for Timeline Cards
// Inspired by modern 3D card interactions

document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll('.timeline--four li');
  
  if (cards.length === 0) return;

  // Check if device supports hover (not touch device)
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  
  if (!supportsHover) return; // Skip 3D effect on touch devices

  cards.forEach(card => {
    const cardContent = card.querySelector('.timeline__content');
    if (!cardContent) return;

    // Create shine overlay
    const shineOverlay = document.createElement('div');
    shineOverlay.className = 'shine-overlay';
    card.appendChild(shineOverlay);

    // Mouse move handler for 3D tilt effect
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation angles (max ±12 degrees)
      const rotateX = ((y - centerY) / centerY) * -12;
      const rotateY = ((x - centerX) / centerX) * 12;
      
      // Apply 3D transform to card
      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale3d(1.05, 1.05, 1.05)
        translateZ(10px)
      `;
      
      // Move the number badge slightly in opposite direction
      cardContent.style.setProperty('--rotate-x', `${rotateX * -0.3}deg`);
      cardContent.style.setProperty('--rotate-y', `${rotateY * -0.3}deg`);
      
      // Update shine position
      const xPercent = (x / rect.width) * 100;
      shineOverlay.style.left = `${xPercent - 15}%`;
    });

    // Mouse enter - activate 3D effect
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease-out';
      cardContent.style.transition = 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      shineOverlay.style.opacity = '1';
    });

    // Mouse leave - reset to original position
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
      card.style.transform = `
        perspective(1000px)
        rotateX(0deg)
        rotateY(0deg)
        scale3d(1, 1, 1)
        translateZ(0px)
      `;
      
      cardContent.style.setProperty('--rotate-x', '0deg');
      cardContent.style.setProperty('--rotate-y', '0deg');
      shineOverlay.style.opacity = '0';
      shineOverlay.style.left = '-100%';
    });
  });

});
