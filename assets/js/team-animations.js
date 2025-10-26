// Team page animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    // Observe all elements with data-animate
    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // Counter animation for diversity stats
    function animateCounter(element, target) {
        const duration = 2000; // 2 seconds
        const start = performance.now();
        const isPercentage = target === 100;
        const suffix = isPercentage ? '%' : '+';

        function updateCounter(currentTime) {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easing function
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(easedProgress * target);
            
            element.textContent = currentValue + suffix;
            element.classList.add('counting');
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.classList.remove('counting');
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // Counter observer for diversity stats
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const numberElement = entry.target.querySelector('.diversity-stat__number');
                if (numberElement && !numberElement.classList.contains('animated')) {
                    numberElement.classList.add('animated');
                    const text = numberElement.textContent;
                    const number = parseInt(text.replace(/[^0-9]/g, ''));
                    animateCounter(numberElement, number);
                }
            }
        });
    }, { threshold: 0.5 });

    // Observe diversity stats
    document.querySelectorAll('.diversity-stat').forEach(stat => {
        counterObserver.observe(stat);
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('.hero-nav__links a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offset = 80; // Account for header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Enhanced hover effects for cards
    document.querySelectorAll('.board-card, .value-card, .testimonial-card, .diversity-highlight').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
});