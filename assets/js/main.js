// ============================================================================
// assets/js/main.js
// INTEC Brussels - Professional JavaScript Core (2025 Edition)
// Fully refactored with all fixes applied
// ============================================================================

(function() {
  'use strict';

  // Performance optimizations
  if ('scheduler' in window && typeof scheduler.yield === 'function') {
    window.__intecScheduler = true;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.documentElement.classList.add('reduce-motion');
  }

  if (
    (window.outerWidth - window.innerWidth > 200) ||
    (window.outerHeight - window.innerHeight > 200)
  ) {
    document.documentElement.classList.add('devtools-open');
  }

  // ==========================================================================
  // GLOBAL CONFIGURATION & STATE
  // ==========================================================================
  
  const INTEC = window.INTEC || {};
  
  const LANGUAGE_STORAGE_KEY = 'intec-language';
  const LANGUAGE_STORAGE_VERSION = 'intec-language-v2';
  const LANGUAGE_MANUAL_FLAG = 'intec-language-manual';

  INTEC.config = {
    defaultLanguage: 'nl',
    maxLanguageLoadAttempts: 20,
    languageRetryDelay: 50,
    devToolsThreshold: 160,
    devToolsHysteresis: 80,
    devToolsConfirmDelay: 600,
    devToolsPollInterval: 1200,
    devToolsResizeDebounce: 300,
    monitorDevTools: true,
    scrollThrottleDelay: 16,
    resizeDebounceDelay: 250,
    countdownUpdateInterval: 3600000, // 1 hour
    carouselAutoplayDelay: 6000,
    carouselTransitionDuration: 800,
    debug: false
  };

  const savedLanguage =
    localStorage.getItem(LANGUAGE_STORAGE_VERSION) ||
    localStorage.getItem(LANGUAGE_STORAGE_KEY);
  let manualLanguageChoice = localStorage.getItem(LANGUAGE_MANUAL_FLAG) === 'true';
  const htmlLanguage = document.documentElement.lang?.trim() || INTEC.config.defaultLanguage;

  const initialLanguage =
    (manualLanguageChoice && savedLanguage) ||
    savedLanguage ||
    htmlLanguage ||
    INTEC.config.defaultLanguage;

  INTEC.state = {
    currentLanguage: initialLanguage,
    languageLoadAttempts: 0,
    isInitialized: false,
    observers: [],
    timers: []
  };

  const persistLanguage = (lang, manual = false) => {
    if (!lang) return;
    localStorage.setItem(LANGUAGE_STORAGE_VERSION, lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (manual) {
      localStorage.setItem(LANGUAGE_MANUAL_FLAG, 'true');
    } else if (!manualLanguageChoice) {
      localStorage.setItem(LANGUAGE_MANUAL_FLAG, 'false');
    }
  };

  persistLanguage(initialLanguage);

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  const Utils = {
    /**
     * Debounce function execution
     */
    debounce(func, wait = 250) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Throttle function execution
     */
    throttle(func, limit = 16) {
      let inThrottle;
      return function(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },

    /**
     * Cubic ease-out animation
     */
    easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    },

    /**
     * Get header offset for smooth scrolling
     */
    getHeaderOffset() {
      const header = document.querySelector('.site-header');
      return header ? header.offsetHeight + 16 : 16;
    },

    /**
     * Check if element is in viewport
     */
    isInViewport(element, threshold = 0) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= -threshold &&
        rect.left >= -threshold &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
      );
    },

    /**
     * Safe query selector
     */
    $(selector, context = document) {
      return context.querySelector(selector);
    },

    /**
     * Safe query selector all
     */
    $$(selector, context = document) {
      return Array.from(context.querySelectorAll(selector));
    },

    /**
     * Log with timestamp (only if debug enabled)
     */
    log(message, type = 'info') {
      if (!INTEC.config.debug) return;
      const timestamp = new Date().toLocaleTimeString();
      const emoji = { info: 'ðŸ“˜', success: 'âœ…', warning: 'âš ï¸', error: 'âŒ' }[type] || 'â„¹ï¸';
      console[type === 'error' ? 'error' : 'log'](`${emoji} [${timestamp}] ${message}`);
    }
  };

  // ==========================================================================
  // DEVTOOLS DETECTION
  // ==========================================================================
const DevToolsDetector = {
  initialized: false,
  currentState: null,

  init(force = false) {
    if ((!INTEC.config.monitorDevTools || this.initialized) && !force) return;

    const body = document.body;
    if (!body) return;

    this.initialized = true;
    this.currentState = null;

    const openThreshold = Number.isFinite(INTEC.config.devToolsThreshold)
      ? INTEC.config.devToolsThreshold
      : 160;
    const hysteresis = Math.max(0, INTEC.config.devToolsHysteresis || 80);
    const confirmDelay = Math.max(200, INTEC.config.devToolsConfirmDelay || 600);
    const pollInterval = Math.max(500, INTEC.config.devToolsPollInterval || 1200);
    const resizeDebounce = Math.max(150, INTEC.config.devToolsResizeDebounce || 300);

    let detectedState = false;
    let pendingState = false;
    let pendingSince = 0;
    let isChecking = false;
    let pollTimer = null;
    let resizeTimer = null;

    const detect = () => {
      const widthDelta = Math.abs((window.outerWidth || 0) - window.innerWidth);
      const heightDelta = Math.abs((window.outerHeight || 0) - window.innerHeight);
      const delta = Math.max(widthDelta, heightDelta);
      const closeThreshold = Math.max(0, openThreshold - hysteresis);

      return detectedState
        ? delta > closeThreshold
        : delta > openThreshold;
    };

    const applyState = (newState) => {
      if (this.currentState === newState) return;
      this.currentState = newState;
      requestAnimationFrame(() => {
        body.classList.toggle('devtools-open', newState);
      });
    };

    const evaluate = () => {
      if (isChecking) return;
      isChecking = true;

      const nowDetected = detect();

      if (nowDetected !== pendingState) {
        pendingState = nowDetected;
        pendingSince = performance.now();
        isChecking = false;
        return;
      }

      if (detectedState !== pendingState) {
        const elapsed = performance.now() - pendingSince;
        if (elapsed >= confirmDelay) {
          detectedState = pendingState;
          applyState(detectedState);
        }
      }

      isChecking = false;
    };

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => evaluate(), resizeDebounce);
    };

    window.addEventListener('resize', onResize, { passive: true });

    pollTimer = window.setInterval(() => {
      if (!document.hidden) evaluate();
    }, pollInterval);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(() => evaluate(), 100);
      }
    });

    window.addEventListener('beforeunload', () => {
      clearInterval(pollTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
    }, { once: true });

    detectedState = detect();
    pendingState = detectedState;
    pendingSince = performance.now() - confirmDelay;
    evaluate();

    Utils.log('DevTools detector initialized (anti-flicker)', 'success');
  }
};

  // ==========================================================================
  // LANGUAGE MANAGEMENT SYSTEM
  // ==========================================================================

  const LanguageManager = {
    translations: {},

    init() {
      this.loadLanguage(INTEC.state.currentLanguage);
      this.setupLanguageSwitchers();
      Utils.log('Language manager initialized', 'success');
    },

    loadLanguage(lang) {
      if (!window.i18n || !window.i18n[lang]) {
        if (INTEC.state.languageLoadAttempts++ < INTEC.config.maxLanguageLoadAttempts) {
          Utils.log(`Waiting for language '${lang}' (attempt ${INTEC.state.languageLoadAttempts})`, 'warning');
          setTimeout(() => this.loadLanguage(lang), INTEC.config.languageRetryDelay);
          return;
        }
        Utils.log(`Failed to load language '${lang}' after max attempts`, 'error');
        return;
      }

      INTEC.state.languageLoadAttempts = 0;
      INTEC.state.currentLanguage = lang;
      const manualChoice = localStorage.getItem(LANGUAGE_MANUAL_FLAG) === 'true';
      persistLanguage(lang, manualChoice);
      document.documentElement.lang = lang;

      this.applyTranslations();
      this.updateLanguageButtons();

      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
      Utils.log(`Language loaded: ${lang}`, 'success');
    },

    applyTranslations() {
      const dict = window.i18n?.[INTEC.state.currentLanguage] || {};
      const missing = new Set();
      let translated = 0;

      const translate = (selector, attr, setAttr = false) => {
        Utils.$$(selector).forEach(el => {
          const key = el.getAttribute(attr);
          const text = dict[key];
          
          if (text) {
            if (setAttr) {
              el.setAttribute(attr.replace('data-i18n-', ''), text);
            } else {
              el[el.hasAttribute('data-i18n-allow-html') ? 'innerHTML' : 'textContent'] = text;
            }
            translated++;
          } else {
            if (!setAttr && !el.hasAttribute('data-i18n-allow-html')) {
              el.textContent = key;
            }
            if (setAttr) {
              el.setAttribute(attr.replace('data-i18n-', ''), key);
            }
            missing.add(key);
          }
        });
      };

      translate('[data-i18n]', 'data-i18n');
      translate('[data-i18n-placeholder]', 'data-i18n-placeholder', true);
      translate('[data-i18n-aria-label]', 'data-i18n-aria-label', true);

      Utils.log(`Translated ${translated} elements`, 'success');
      if (missing.size) Utils.log(`Missing translations: ${[...missing].join(', ')}`, 'warning');
    },

    updateLanguageButtons() {
      Utils.$$('[data-lang-select]').forEach(btn => {
        const lang = btn.dataset.lang;
        const active = lang === INTEC.state.currentLanguage;
        
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
        btn.setAttribute('aria-current', active ? 'true' : 'false');

        const switcher = btn.closest('.language-switch');
        if (switcher) switcher.dataset.activeLang = active ? lang : '';
      });
    },

    setupLanguageSwitchers() {
      Utils.$$('[data-lang-select]').forEach(btn => {
        btn.addEventListener('click', () => {
          const newLang = btn.dataset.lang;
          if (newLang !== INTEC.state.currentLanguage) {
            localStorage.setItem(LANGUAGE_MANUAL_FLAG, 'true');
            this.loadLanguage(newLang);
          }
        });
      });
    },

    reset() {
      localStorage.removeItem('intec-language');
      this.loadLanguage(INTEC.config.defaultLanguage);
      Utils.log('Language reset to default', 'info');
    }
  };

  // ==========================================================================
  // SMOOTH SCROLL SYSTEM
  // ==========================================================================

  const SmoothScroll = {
    init() {
      this.setupSmoothScrollLinks();
      Utils.log('Smooth scroll initialized', 'success');
    },

    scrollTo(targetY, duration = 650) {
      const startY = window.pageYOffset;
      const distance = targetY - startY;
      const startTime = performance.now();

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = Utils.easeOutCubic(progress);
        
        window.scrollTo(0, startY + distance * eased);
        
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    },

    setupSmoothScrollLinks() {
      Utils.$$('a[href^="#"]:not([href="#"])').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const hash = anchor.getAttribute('href');
          const target = Utils.$(hash);
          
          if (!target) return;
          
          e.preventDefault();
          
          const targetY = target.getBoundingClientRect().top + 
                         window.pageYOffset - 
                         Utils.getHeaderOffset();
          
          this.scrollTo(targetY);
          
          history.replaceState(null, '', hash);
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        });
      });
    }
  };

  // ==========================================================================
  // STICKY HEADER
  // ==========================================================================

  const StickyHeader = {
    header: null,
    lastScrollY: 0,
    ticking: false,

    init() {
      this.header = Utils.$('.site-header');
      if (!this.header) return;

      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      Utils.log('Sticky header initialized', 'success');
    },

    onScroll() {
      if (!this.ticking) {
        requestAnimationFrame(() => this.update());
        this.ticking = true;
      }
    },

    update() {
      const currentScrollY = window.scrollY;
      
      this.header.classList.toggle('is-condensed', currentScrollY > 40);
      
      if (currentScrollY > 120 && currentScrollY > this.lastScrollY) {
        this.header.classList.add('is-hidden');
      } else {
        this.header.classList.remove('is-hidden');
      }

      if (currentScrollY > 60) {
        this.header.classList.add('scrolled');
      } else {
        this.header.classList.remove('scrolled');
      }
      
      this.lastScrollY = currentScrollY;
      this.ticking = false;
    }
  };

  // ==========================================================================
  // MOBILE NAVIGATION
  // ==========================================================================

  const MobileNav = {
    init() {
      this.setupToggle();
      this.setupOutsideClick();
      Utils.log('Mobile navigation initialized', 'success');
    },

    setupToggle() {
      const toggle = Utils.$('[data-nav-toggle], .nav-toggle');
      const nav = Utils.$('.primary-nav, .nav-links');
      
      if (!toggle || !nav) return;

      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        toggle.setAttribute('aria-expanded', String(newState));
        toggle.classList.toggle('is-active', newState);
        nav.classList.toggle('is-open', newState);
        document.body.classList.toggle('nav-is-open', newState);
      });
    },

    setupOutsideClick() {
      document.addEventListener('click', (e) => {
        const nav = Utils.$('.primary-nav, .nav-links');
        const toggle = Utils.$('[data-nav-toggle], .nav-toggle');
        
        if (!nav || !toggle) return;
        
        if (nav.classList.contains('is-open') &&
            !nav.contains(e.target) &&
            !toggle.contains(e.target) &&
            !e.target.closest('.site-header__inner')) {
          toggle.click();
        }
      });
    }
  };

  // ==========================================================================
  // LAZY IMAGE OPTIMIZATION
  // ==========================================================================

  const LazyImages = {
    init() {
      Utils.$$('img').forEach(img => {
        const isCritical = img.dataset.critical === 'true';
        const hasLazyAttr = img.hasAttribute('loading');

        img.setAttribute('loading', isCritical ? 'eager' : (hasLazyAttr ? img.loading : 'lazy'));
        img.setAttribute('decoding', 'async');

        if (isCritical) {
          img.setAttribute('fetchpriority', 'high');
        }
      });

      Utils.log('Lazy images optimized', 'success');
    }
  };

  // ==========================================================================
  // SCROLL ANIMATIONS
  // ==========================================================================

  const ScrollAnimations = {
    observer: null,
    fadeUpObserver: null,

    init() {
      this.ensureAnimationAttributes();
      this.setupIntersectionObserver();
      this.setupFloatingCTA();
      Utils.log('Scroll animations initialized', 'success');
    },

    ensureAnimationAttributes() {
      const animationTargets = [
        { selector: '.hero__content', animation: 'slide-right' },
        { selector: '.hero__visual', animation: 'slide-left' },
        { 
          selector: '.hero-card, .section, .section-heading, .stats-item, .program-card, .course-card, .tip-card, .faq-item, .highlight-box, .logo-card, .cta-band, .timeline li', 
          animation: 'fade-up' 
        }
      ];

      animationTargets.forEach(({ selector, animation }) => {
        Utils.$$(selector).forEach(el => {
          if (!el.dataset.animate) {
            el.dataset.animate = animation;
          }
        });
      });
    },

    setupIntersectionObserver() {
      const animatedElements = Utils.$$('[data-animate]');
      
      if (animatedElements.length > 0) {
        const observerOptions = {
          threshold: 0.15,
          rootMargin: '0px 0px -60px 0px'
        };

        this.observer = new IntersectionObserver((entries) => {
          const toAnimate = [];

          entries.forEach(entry => {
            if (entry.isIntersecting) {
              toAnimate.push(entry.target);
            }
          });

          if (toAnimate.length) {
            requestAnimationFrame(() => {
              toAnimate.forEach(target => {
                target.classList.add('is-visible');
                this.observer.unobserve(target);
              });
            });
          }
        }, observerOptions);

        animatedElements.forEach(el => this.observer.observe(el));
        Utils.log(`Observing ${animatedElements.length} animated elements`, 'info');
      }

      // Fade-up observer
      const fadeUpElements = Utils.$$('.fade-up');
      
      if (fadeUpElements.length > 0) {
        this.fadeUpObserver = new IntersectionObserver((entries) => {
          const visible = [];

          entries.forEach(entry => {
            if (entry.isIntersecting) visible.push(entry.target);
          });

          if (visible.length) {
            requestAnimationFrame(() => {
              visible.forEach(target => {
                target.classList.add('is-visible');
                this.fadeUpObserver.unobserve(target);
              });
            });
          }
        }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

        fadeUpElements.forEach(el => this.fadeUpObserver.observe(el));
        Utils.log(`Observing ${fadeUpElements.length} fade-up elements`, 'info');
      }
    },

    setupFloatingCTA() {
      const floatingCta = Utils.$('.floating-cta');
      if (!floatingCta) return;

      const updateCta = Utils.throttle(() => {
        floatingCta.classList.toggle('is-visible', window.scrollY > 400);
      }, 100);

      window.addEventListener('scroll', updateCta, { passive: true });
      Utils.log('Floating CTA initialized', 'info');
    }
  };

  // ==========================================================================
  // COUNTER ANIMATIONS
  // ==========================================================================

  const CounterAnimations = {
    observer: null,

    init() {
      const counters = Utils.$$('[data-counter]');
      if (counters.length === 0) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
              this.startCounter(entry.target);
              entry.target.classList.add('counted');
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.45 }
      );

      counters.forEach(el => {
        el.textContent = '0';
        this.observer.observe(el);
      });

      Utils.log('Counter animations initialized', 'success');
    },

    startCounter(element) {
      const target = parseFloat(element.dataset.target) || 0;
      const duration = parseInt(element.dataset.duration) || 1800;
      const hasDecimals = target % 1 !== 0;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = Utils.easeOutCubic(progress);
        const value = target * eased;

        element.textContent = hasDecimals ? value.toFixed(1) : Math.floor(value);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.textContent = hasDecimals ? target.toFixed(1) : target;
        }
      };

      requestAnimationFrame(animate);
    }
  };

  // ==========================================================================
  // COURSE COUNTDOWN SYSTEM
  // ==========================================================================

  const CourseCountdown = {
    timer: null,

    messages: {
      en: {
        inMany: (d) => `Starts in ${d} days`,
        inOne: () => 'Starts in 1 day',
        today: 'Starts today',
        pastMany: (d) => `Started ${d} days ago`,
        pastOne: () => 'Started 1 day ago'
      },
      nl: {
        inMany: (d) => `Start over ${d} dagen`,
        inOne: () => 'Start over 1 dag',
        today: 'Start vandaag',
        pastMany: (d) => `Gestart ${d} dagen geleden`,
        pastOne: () => 'Gestart 1 dag geleden'
      }
    },

    init() {
      this.update();
      this.timer = setInterval(() => this.update(), INTEC.config.countdownUpdateInterval);
      window.addEventListener('languageChanged', () => this.update());
      Utils.log('Course countdown initialized', 'success');
    },

    update() {
      const lang = INTEC.state.currentLanguage;
      const messages = this.messages[lang] || this.messages.en;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      Utils.$$('[data-start-date]').forEach(item => {
        const dateStr = item.dataset.startDate;
        if (!dateStr) return;

        const targetDate = new Date(dateStr);
        if (isNaN(targetDate)) return;

        targetDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((targetDate - today) / 86400000);
        
        let message;
        if (diffDays > 0) {
          message = diffDays === 1 ? messages.inOne() : messages.inMany(diffDays);
        } else if (diffDays === 0) {
          message = messages.today;
        } else {
          const pastDays = Math.abs(diffDays);
          message = pastDays === 1 ? messages.pastOne() : messages.pastMany(pastDays);
        }

        let badge = item.querySelector('[data-countdown]');
        if (!badge) {
          badge = document.createElement('span');
          badge.dataset.countdown = '';
          badge.className = 'course-date__countdown';
          badge.setAttribute('role', 'status');
          badge.setAttribute('aria-live', 'polite');
          item.append(' ', badge);
        }

        badge.textContent = message;
        badge.classList.remove('course-date__countdown--soon', 'course-date__countdown--today', 'course-date__countdown--past');

        if (diffDays === 0) {
          badge.classList.add('course-date__countdown--today');
        } else if (diffDays < 0) {
          badge.classList.add('course-date__countdown--past');
        } else if (diffDays <= 30) {
          badge.classList.add('course-date__countdown--soon');
        }
      });
    },

    destroy() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  };

  // ==========================================================================
  // PARTNER CAROUSEL (FIXED)
  // ==========================================================================

  const PartnerCarousel = {
    carousel: null,
    track: null,
    slides: [],
    allSlides: [],
    dotsContainer: null,
    prevBtn: null,
    nextBtn: null,
    currentIndex: 1,
    stepX: 0,
    autoplayTimer: null,
    state: 'idle', // 'idle', 'animating', 'dragging'
    startX: null,
    deltaX: 0,
    resizeRAF: null,

    init() {
      this.carousel = Utils.$('[data-carousel="partners"]');
      if (!this.carousel || this.carousel.__carouselInit) return;

      this.carousel.__carouselInit = true;
      this.track = Utils.$('[data-partner-track]', this.carousel);
      
      if (!this.track) {
        Utils.log('Partner carousel: missing track element', 'error');
        return;
      }

      // Remove server-rendered clones
      Utils.$$('.partner-carousel__slide.is-clone', this.track).forEach(clone => clone.remove());

      this.slides = Utils.$$('.partner-carousel__slide', this.track);
      
      if (this.slides.length === 0) {
        Utils.log('Partner carousel: no slides found', 'error');
        return;
      }

      this.dotsContainer = Utils.$('.partner-carousel__dots', this.carousel);
      this.prevBtn = Utils.$('[data-partner-prev]', this.carousel);
      this.nextBtn = Utils.$('[data-partner-next]', this.carousel);

      this.setupClones();
      this.setupControls();
      this.setupDragAndTouch();
      this.setupKeyboard();
      this.setupVisibilityControl();
      this.setupResize();
      this.computeStep();
      this.setTransform(this.currentIndex, false);
      this.updateUI();
      
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.startAutoplay();
      }

      Utils.log(`Partner carousel initialized: ${this.slides.length} slides`, 'success');
    },

    setupClones() {
      const firstClone = this.slides[0].cloneNode(true);
      const lastClone = this.slides[this.slides.length - 1].cloneNode(true);
      
      [firstClone, lastClone].forEach(clone => {
        clone.classList.add('is-clone');
        clone.setAttribute('aria-hidden', 'true');
      });

      this.track.insertBefore(lastClone, this.slides[0]);
      this.track.appendChild(firstClone);

      this.allSlides = Utils.$$('.partner-carousel__slide', this.track);
    },

    computeStep() {
      if (this.allSlides.length < 2) return;
      const a = this.allSlides[0].getBoundingClientRect();
      const b = this.allSlides[1].getBoundingClientRect();
      this.stepX = Math.abs(b.left - a.left) || a.width;
    },

    setTransform(index, transition = true) {
      const x = -index * this.stepX;
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800;
      
      this.track.style.transition = transition && duration > 0 ? 
        `transform ${duration}ms cubic-bezier(0.33, 1, 0.68, 1)` : 'none';
      this.track.style.transform = `translate3d(${x}px, 0, 0)`;
      this.track.style.willChange = transition ? 'transform' : 'auto';
    },

    snap() {
      if (this.currentIndex === 0) {
        this.currentIndex = this.slides.length;
        this.setTransform(this.currentIndex, false);
      } else if (this.currentIndex === this.slides.length + 1) {
        this.currentIndex = 1;
        this.setTransform(this.currentIndex, false);
      }
    },

    updateUI() {
      const realIndex = this.currentIndex === 0 ? this.slides.length - 1 :
                        this.currentIndex === this.slides.length + 1 ? 0 :
                        this.currentIndex - 1;

      this.allSlides.forEach((slide, i) => {
        const isActive = i === this.currentIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      if (this.dotsContainer) {
        Utils.$$('[data-partner-dot]', this.dotsContainer).forEach((dot, i) => {
          const isActive = i === realIndex;
          dot.classList.toggle('is-active', isActive);
          dot.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
      }
    },

    goTo(newIndex) {
      if (this.state === 'animating') return;
      
      this.state = 'animating';
      this.currentIndex = newIndex;
      this.setTransform(this.currentIndex, true);
      this.updateUI();

      setTimeout(() => {
        this.state = 'idle';
        this.snap();
        this.updateUI();
      }, 850);
    },

    next() {
      this.goTo(this.currentIndex + 1);
    },

    prev() {
      this.goTo(this.currentIndex - 1);
    },

    goToDot(index) {
      this.goTo(index + 1);
    },

    startAutoplay() {
      const autoplayDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 
        0 : INTEC.config.carouselAutoplayDelay;
      
      if (autoplayDelay === 0) return;

      this.stopAutoplay();
      this.autoplayTimer = setTimeout(() => {
        this.next();
        this.startAutoplay();
      }, autoplayDelay);
    },

    stopAutoplay() {
      if (this.autoplayTimer) {
        clearTimeout(this.autoplayTimer);
        this.autoplayTimer = null;
      }
    },

    setupControls() {
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => {
          this.stopAutoplay();
          this.next();
          this.startAutoplay();
        });
      }

      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => {
          this.stopAutoplay();
          this.prev();
          this.startAutoplay();
        });
      }

      if (this.dotsContainer) {
        this.dotsContainer.addEventListener('click', (e) => {
          const dot = e.target.closest('[data-partner-dot]');
          if (!dot) return;

          const index = parseInt(dot.dataset.partnerDot, 10);
          if (!isNaN(index) && index !== this.currentIndex - 1) {
            this.stopAutoplay();
            this.goToDot(index);
            this.startAutoplay();
          }
        });
      }
    },

    setupDragAndTouch() {
      const guardSelector = '[data-partner-prev], [data-partner-next], .partner-carousel__dot';
      const swipeThreshold = 0.2;
      const minSwipe = 50;

      const onStart = (x) => {
        if (this.state === 'animating') return;
        this.state = 'dragging';
        this.startX = x;
        this.deltaX = 0;
        this.stopAutoplay();
        this.setTransform(this.currentIndex, false);
      };

      const onMove = (x) => {
        if (this.state !== 'dragging' || this.startX === null) return;
        this.deltaX = x - this.startX;
        const translateX = -(this.currentIndex * this.stepX) + this.deltaX;
        this.track.style.transform = `translate3d(${translateX}px, 0, 0)`;
      };

      const onEnd = () => {
        if (this.state !== 'dragging') return;
        
        const threshold = Math.max(minSwipe, this.stepX * swipeThreshold);
        
        if (Math.abs(this.deltaX) > threshold) {
          this.deltaX > 0 ? this.prev() : this.next();
        } else {
          this.setTransform(this.currentIndex, true);
        }

        this.startX = null;
        this.deltaX = 0;
        this.startAutoplay();
        this.state = 'idle';
      };

      // Touch events
      this.carousel.addEventListener('touchstart', (e) => {
        if (e.target.closest(guardSelector)) return;
        onStart(e.touches[0].clientX);
      }, { passive: true });

      this.carousel.addEventListener('touchmove', (e) => {
        onMove(e.touches[0].clientX);
      }, { passive: true });

      this.carousel.addEventListener('touchend', onEnd);

      // Mouse events
      this.carousel.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest(guardSelector)) return;
        
        e.preventDefault();
        onStart(e.clientX);

        const moveHandler = (ev) => onMove(ev.clientX);
        const upHandler = () => {
          onEnd();
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', upHandler);
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
      });
    },

    setupKeyboard() {
      this.carousel.setAttribute('tabindex', '0');
      this.carousel.setAttribute('role', 'region');
      this.carousel.setAttribute('aria-label', 'Partner logos carousel');

      this.carousel.addEventListener('keydown', (e) => {
        if (this.state === 'animating') return;

        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.prev();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.next();
            break;
          case 'Home':
            e.preventDefault();
            this.goToDot(0);
            break;
          case 'End':
            e.preventDefault();
            this.goToDot(this.slides.length - 1);
            break;
        }

        this.stopAutoplay();
        this.startAutoplay();
      });
    },

    setupVisibilityControl() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stopAutoplay();
        } else {
          this.startAutoplay();
        }
      });

      this.carousel.addEventListener('mouseenter', () => this.stopAutoplay());
      this.carousel.addEventListener('mouseleave', () => this.startAutoplay());
    },

    setupResize() {
      const onResize = () => {
        if (this.resizeRAF) return;
        
        this.resizeRAF = requestAnimationFrame(() => {
          this.computeStep();
          this.setTransform(this.currentIndex, false);
          this.resizeRAF = null;
        });
      };

      window.addEventListener('resize', onResize);
    },

    destroy() {
      this.stopAutoplay();
      if (this.observer) this.observer.disconnect();
    }
  };

  // ==========================================================================
  // ACCORDION SYSTEM (FIXED)
  // ==========================================================================

  const AccordionSystem = {
    init() {
      this.setupFAQAccordion();
      this.setupIntakePrepAccordion();
      Utils.log('Accordion system initialized', 'success');
    },

    setupFAQAccordion() {
      const faqItems = Utils.$$('.faq-item');
      if (faqItems.length === 0) return;

      faqItems.forEach((item) => {
        const question = Utils.$('.faq-item__question', item);
        const answer = Utils.$('.faq-item__answer', item);

        if (!question || !answer) return;

        // Ensure proper ARIA attributes
        const questionId = question.id || `faq-q-${Math.random().toString(36).substr(2, 9)}`;
        const answerId = answer.id || `faq-a-${Math.random().toString(36).substr(2, 9)}`;
        
        question.id = questionId;
        answer.id = answerId;
        question.setAttribute('aria-controls', answerId);
        answer.setAttribute('aria-labelledby', questionId);

        const toggle = () => {
          const isExpanded = question.getAttribute('aria-expanded') === 'true';
          
          // Close all other items
          faqItems.forEach((otherItem) => {
            if (otherItem !== item) {
              const otherQuestion = Utils.$('.faq-item__question', otherItem);
              const otherAnswer = Utils.$('.faq-item__answer', otherItem);
              if (otherQuestion && otherAnswer) {
                this.closeAccordionItem(otherQuestion, otherAnswer);
              }
            }
          });

          // Toggle current item
          if (isExpanded) {
            this.closeAccordionItem(question, answer);
          } else {
            this.openAccordionItem(question, answer);
          }
        };

        question.addEventListener('click', toggle);
        question.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });

        // Initialize closed state
        if (question.getAttribute('aria-expanded') !== 'true') {
          answer.style.display = 'none';
          answer.style.maxHeight = '0';
          answer.setAttribute('aria-hidden', 'true');
        }
      });

      Utils.log(`FAQ accordion initialized: ${faqItems.length} items`, 'info');
    },

    setupIntakePrepAccordion() {
      const accordionItems = Utils.$$('.page--inschrijven .accordion-item');
      if (accordionItems.length === 0) return;

      accordionItems.forEach((item, index) => {
        const header = Utils.$('.accordion-header', item);
        const body = Utils.$('.accordion-body', item);

        if (!header || !body) return;

        // Ensure header is focusable
        if (!header.hasAttribute('tabindex')) {
          header.setAttribute('tabindex', '0');
        }

        // Ensure proper IDs for accessibility
        const headerId = header.id || `accordion-header-${index}`;
        const bodyId = body.id || `accordion-body-${index}`;
        
        header.id = headerId;
        body.id = bodyId;
        header.setAttribute('aria-controls', bodyId);
        body.setAttribute('aria-labelledby', headerId);

        const toggle = () => {
          const isExpanded = header.getAttribute('aria-expanded') === 'true';

          // Close all other items
          accordionItems.forEach((otherItem) => {
            if (otherItem !== item) {
              const otherHeader = Utils.$('.accordion-header', otherItem);
              const otherBody = Utils.$('.accordion-body', otherItem);
              if (otherHeader && otherBody) {
                this.closeAccordionItem(otherHeader, otherBody);
              }
            }
          });

          // Toggle current item
          if (isExpanded) {
            this.closeAccordionItem(header, body);
          } else {
            this.openAccordionItem(header, body);
          }
        };

        // Attach event listeners
        header.addEventListener('click', toggle);
        
        const icon = Utils.$('.accordion-header__icon', header);
        const text = Utils.$('.accordion-header__text', header);
        
        if (icon) icon.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
        if (text) text.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });

        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });

        // Initialize state
        if (header.getAttribute('aria-expanded') === 'true') {
          body.style.display = 'block';
          body.style.overflow = '';
          body.style.maxHeight = 'none';
          body.style.opacity = '1';
          body.classList.add('is-open');
          header.classList.add('is-open');
          body.setAttribute('aria-hidden', 'false');
        } else {
          body.style.display = 'none';
          body.style.maxHeight = '0';
          body.style.opacity = '0';
          body.setAttribute('aria-hidden', 'true');
        }
      });

      Utils.log(`Intake prep accordion initialized: ${accordionItems.length} items`, 'info');
    },

    openAccordionItem(header, body) {
      header.setAttribute('aria-expanded', 'true');
      body.setAttribute('aria-hidden', 'false');
      body.classList.add('is-open');
      header.classList.add('is-open');

      body.style.display = 'block';
      body.style.overflow = 'hidden';
      body.style.opacity = '0';
      body.style.maxHeight = '0';

      // Force reflow
      body.offsetHeight;

      const measuredHeight = body.scrollHeight;

      requestAnimationFrame(() => {
        body.style.maxHeight = `${measuredHeight}px`;
        body.style.opacity = '1';
      });

      const onTransitionEnd = (e) => {
        if (e.propertyName !== 'max-height' && e.propertyName !== 'opacity') return;
        body.removeEventListener('transitionend', onTransitionEnd);
        
        if (header.getAttribute('aria-expanded') === 'true') {
          body.style.maxHeight = 'none';
          body.style.overflow = '';
        }
      };

      body.addEventListener('transitionend', onTransitionEnd);
    },

    closeAccordionItem(header, body) {
      header.setAttribute('aria-expanded', 'false');
      body.setAttribute('aria-hidden', 'true');
      body.classList.remove('is-open');
      header.classList.remove('is-open');

      body.style.overflow = 'hidden';
      const currentHeight = body.scrollHeight;
      body.style.maxHeight = `${currentHeight}px`;

      // Force reflow
      body.offsetHeight;

      requestAnimationFrame(() => {
        body.style.opacity = '0';
        body.style.maxHeight = '0';
      });

      const onTransitionEnd = (e) => {
        if (e.propertyName !== 'max-height' && e.propertyName !== 'opacity') return;
        body.removeEventListener('transitionend', onTransitionEnd);
        body.style.display = 'none';
      };

      body.addEventListener('transitionend', onTransitionEnd);
    }
  };

  // ==========================================================================
  // FORM VALIDATION SYSTEM (FIXED)
  // ==========================================================================

  const FormValidation = {
    forms: [],

    init() {
      const selectors = [
        '#registration-form form',
        '#contact-form',
        '#partner-login-form',
        'form.contact-form',
        'form.form-container',
        '.form-container form'
      ];

      const uniqueForms = new Set();
      selectors.forEach(selector => {
        Utils.$$(selector).forEach(form => {
          if (form?.tagName === 'FORM') {
            uniqueForms.add(form);
          }
        });
      });

      uniqueForms.forEach(form => this.setupForm(form));

      Utils.log(`Form validation initialized for ${uniqueForms.size} form(s)`, 'success');
    },

    setupForm(form) {
      form.setAttribute('novalidate', 'novalidate');

      const rules = {
        'full-name': {
          required: true,
          minLength: 5,
          maxLength: 25,
          pattern: /^[\p{L}'’-]{2,}(?:\s+[\p{L}'’-]{2,})+$/u,
          errorKey: 'register.validation.fullName',
          minErrorKey: 'register.validation.fullNameMin'
        },
        'gender': {
          required: true,
          errorKey: 'register.validation.gender'
        },
        'email': {
          required: true,
          minLength: 6,
          maxLength: 50,
          pattern: /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/,
          errorKey: 'register.validation.email'
        },
        'phone': {
          required: true,
          pattern: /^0\d{8,9}$/,
          numbersOnly: true,
          errorKey: 'register.validation.phone',
          numbersErrorKey: 'register.validation.phoneNumbers'
        },
        'national-number': {
          required: true,
          exactLength: 11,
          numbersOnly: true,
          pattern: /^\d{11}$/,
          errorKey: 'register.validation.national'
        },
        'address': {
          required: true,
          minLength: 5,
          maxLength: 40,
          errorKey: 'register.validation.address'
        },
        'postcode': {
          required: true,
          exactLength: 4,
          pattern: /^[1-9][0-9]{3}$/,
          errorKey: 'register.validation.postcode'
        },
        'city': {
          required: true,
          minLength: 2,
          maxLength: 30,
          pattern: /^[\p{L}'’-]{2,30}(?:\s[\p{L}'’-]{2,30})?$/u,
          errorKey: 'register.validation.city'
        },
        'course': {
          required: true,
          errorKey: 'register.validation.course'
        },
        'username': {
          required: true,
          minLength: 3,
          maxLength: 50,
          errorKey: 'register.validation.required'
        },
        'password': {
          required: true,
          errorKey: 'register.validation.required'
        },
        'message': {
          required: false,
          maxLength: 500,
          errorKey: 'register.validation.messageLength'
        }
      };

      const getDict = () => window.i18n?.[INTEC.state.currentLanguage] || {};

      const getErrorBox = (input, createIfMissing = false) => {
        const parent = input.parentNode;
        if (!parent) return null;

        let errorBox = parent.querySelector('.form-error') || Utils.$(`#${input.name}-error`);
        if (!errorBox && createIfMissing) {
          errorBox = document.createElement('div');
          errorBox.className = 'form-error';
          errorBox.id = `${input.name}-error`;
          errorBox.setAttribute('role', 'alert');
          errorBox.setAttribute('aria-live', 'polite');
          parent.appendChild(errorBox);
        }
        return errorBox;
      };

      const showError = (input, key) => {
        input.classList.add('has-error');
        input.classList.remove('is-valid');
        input.setAttribute('aria-invalid', 'true');
        
        const errorBox = getErrorBox(input, true);
        
        if (errorBox) {
          const text = getDict()[key] || key;
          errorBox.textContent = text;
          errorBox.style.display = 'block';
        }
      };

      const hideError = (input) => {
        input.classList.remove('has-error');
        input.classList.add('is-valid');
        input.setAttribute('aria-invalid', 'false');
        
        const errorBox = getErrorBox(input);
        
        if (errorBox) {
          errorBox.style.display = 'none';
          errorBox.textContent = '';
        }
      };

      const validate = (input) => {
        const name = input.name;
        const value = input.value.trim();
        const raw = input.value;
        const rule = rules[name];

        if (!rule) {
          if (typeof input.checkValidity === 'function' && !input.checkValidity()) {
            return { ok: false, key: input.validationMessage || 'Please check this field.' };
          }
          return { ok: true };
        }

        const isRequired = input.required || (!!rule && rule.required);

        // Required check
        if (isRequired) {
          if (input.type === 'radio') {
            const radios = Utils.$$(`input[name="${name}"]`, form);
            const checked = radios.some(r => r.checked);
            if (!checked) return { ok: false, key: rule.errorKey || 'Please select an option.' };
          } else if (input.tagName === 'SELECT') {
            if (!value || value === '') return { ok: false, key: rule.errorKey || 'Please select a value.' };
          } else {
            if (!value) return { ok: false, key: rule.errorKey || 'This field is required.' };
          }
        }

        if (!isRequired && !value) return { ok: true };

        // Numbers only check
        if (rule.numbersOnly && !/^\d+$/.test(value.replace(/[\s.-]/g, ''))) {
          return { ok: false, key: rule.numbersErrorKey || rule.errorKey || 'Only numbers are allowed.' };
        }

        // Min length check
        if (rule.minLength && raw.length < rule.minLength) {
          return { ok: false, key: rule.minErrorKey || rule.errorKey || `Please enter at least ${rule.minLength} characters.` };
        }

        // Exact length check
        if (rule.exactLength && value.replace(/[\s.-]/g, '').length !== rule.exactLength) {
          return { ok: false, key: rule.errorKey || `Please enter exactly ${rule.exactLength} characters.` };
        }

        // Pattern check
        if (rule.pattern && !rule.pattern.test(value.replace(/[\s.-]/g, ''))) {
          return { ok: false, key: rule.errorKey || 'Invalid format.' };
        }

        return { ok: true };
      };

      // Add error placeholders
      Utils.$$('input, select, textarea', form).forEach(field => {
        const shouldCreate = !!rules[field.name] || field.required;
        if (shouldCreate) {
          getErrorBox(field, true);
        }
      });

      // Real-time validation
      Utils.$$('input, select, textarea', form).forEach(field => {
        const rule = rules[field.name];
        if (!rule) return;

        // Max length enforcement
        if (rule.maxLength) {
          field.addEventListener('input', () => {
            if (field.value.length > rule.maxLength) {
              field.value = field.value.slice(0, rule.maxLength);
            }
          });
        }

        // Input validation
        field.addEventListener('input', () => {
          const result = validate(field);
          if (result.ok) {
            hideError(field);
          } else {
            showError(field, result.key);
          }
        });

        // Blur validation
        field.addEventListener('blur', () => {
          const result = validate(field);
          if (result.ok) {
            hideError(field);
          } else {
            showError(field, result.key);
          }
        });

        // Select/Radio change validation
        if (field.tagName === 'SELECT' || field.type === 'radio') {
          field.addEventListener('change', () => {
            const result = validate(field);
            if (result.ok) {
              hideError(field);
            } else {
              showError(field, result.key);
            }
          });
        }
      });

      // Ctrl+Enter submit for textarea
      const messageField = Utils.$('textarea[name="message"]', form);
      if (messageField) {
        messageField.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            form.requestSubmit();
          }
        });
      }

      // Form submit handler
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        let firstInvalidField = null;

        // Clear all errors
        Utils.$$('.form-error', form).forEach(box => box.style.display = 'none');

        // Validate all fields
        Utils.$$('input, select, textarea', form).forEach(field => {
          const name = field.name;
          if (name === 'message' && !field.value.trim() && !field.required) return;

          const result = validate(field);
          if (!result.ok) {
            showError(field, result.key);
            isValid = false;
            if (!firstInvalidField) firstInvalidField = field;
          } else {
            hideError(field);
          }
        });

        if (!isValid) {
          if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          Utils.log('Form validation failed', 'warning');
          return;
        }

        // Success handling
        Utils.log('Form validated successfully', 'success');
        
        let successMsg = Utils.$('.form-success', form);
        if (!successMsg) {
          successMsg = document.createElement('div');
          successMsg.className = 'form-success';
          successMsg.innerHTML = `
            <div class="form-success__title" data-i18n="register.success.title">
              Bedankt voor uw voorinschrijving!
            </div>
            <p class="form-success__message" data-i18n="register.success.message">
              U ontvangt binnen drie werkdagen een bevestiging per e-mail.
            </p>
          `;
          const submitBtn = Utils.$('button[type="submit"]', form);
          if (submitBtn) {
            submitBtn.insertAdjacentElement('afterend', successMsg);
          } else {
            form.appendChild(successMsg);
          }
        }

        const dict = getDict();
        const titleEl = Utils.$('[data-i18n="register.success.title"]', successMsg);
        const messageEl = Utils.$('[data-i18n="register.success.message"]', successMsg);
        
        if (titleEl) {
          titleEl.textContent = dict['register.success.title'] || 'Thank you!';
        }
        if (messageEl) {
          messageEl.textContent = dict['register.success.message'] || 'We will contact you soon.';
        }

        successMsg.classList.add('is-visible');
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          form.reset();
          successMsg.classList.remove('is-visible');
          Utils.$$('.is-valid', form).forEach(field => field.classList.remove('is-valid'));
        }, 5000);
      });

      this.forms.push(form);
    }
  };

// ==========================================================================
// BACK TO TOP BUTTON — Classic Global Version (to keep compatibility)
// ==========================================================================
window.BackToTop = (() => {
  let button;
  let scrollRAF = null;

  const toggleButton = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    const viewportThreshold = document.documentElement.clientHeight * 0.4;
    const shouldShow = scrollTop > viewportThreshold || scrollPercent > 20;
    if (button) button.classList.toggle('show', shouldShow);
  };

  const throttledScroll = () => {
    if (scrollRAF) return;
    scrollRAF = requestAnimationFrame(() => {
      toggleButton();
      scrollRAF = null;
    });
  };

  const init = () => {
    button = document.querySelector('#backToTopBtn');
    if (!button) return console.warn('⚠️ BackToTop button not found');

    window.addEventListener('scroll', throttledScroll, { passive: true });
    button.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    toggleButton();
    console.log('%c✔ BackToTop initialized', 'color:#0f828a');
  };

  return { init };
})();

// Safe initialization

  // ==========================================================================
  // SECTION BACKGROUND ALTERNATION SYSTEM
  // ==========================================================================

  const SectionBackgrounds = {
    observer: null,
    config: {
      surfaceClass: 'section--surface',
      altClass: 'section--alt',
      excludeSelectors: [
        '.hero',
        '.section--hero',
        '.cta-band',
        '.section--cta',
        '.footer',
        '.about-hero',
        '.contact-hero',
        '.team-hero',
        '.opleidingen-hero',
        '[data-no-alternating]'
      ]
    },

    init() {
      this.apply();
      this.setupObserver();
      this.setupEventListeners();
      Utils.log('Section backgrounds initialized', 'success');
    },

    apply() {
      const sections = Utils.$$('section, .section');
      if (sections.length === 0) return;

      const validSections = sections.filter(section => {
        return !this.config.excludeSelectors.some(selector => section.matches(selector));
      });

      // Remove existing classes
      validSections.forEach(section => {
        section.classList.remove(this.config.surfaceClass, this.config.altClass);
      });

      // Apply alternating classes
      validSections.forEach((section, index) => {
        const className = index % 2 === 0 ? this.config.surfaceClass : this.config.altClass;
        section.classList.add(className);
      });

      Utils.log(`Applied backgrounds to ${validSections.length} sections`, 'info');
    },

    setupObserver() {
      const throttledApply = Utils.throttle(() => this.apply(), 500);

      this.observer = new MutationObserver((mutations) => {
        const relevant = mutations.some((mutation) => {
          if (mutation.type === 'childList') return true;
          if (mutation.type === 'attributes') {
            const target = mutation.target;
            return target && target.tagName === 'SECTION';
          }
          return false;
        });

        if (relevant) throttledApply();
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: false,
        attributes: true,
        attributeFilter: ['class']
      });
    },

    setupEventListeners() {
      window.addEventListener('resize', Utils.debounce(() => this.apply(), 250));
      window.addEventListener('languageChanged', () => this.apply());
    },

    refresh() {
      this.apply();
    }
  };

  // ==========================================================================
  // FOOTER YEAR UPDATE
  // ==========================================================================

  const FooterYear = {
    init() {
      const yearElement = Utils.$('#year');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
    }
  };

  // ==========================================================================
  // SERVICE WORKER
  // ==========================================================================

  const ServiceWorker = {
    init() {
      if (!('serviceWorker' in navigator) || window.location.protocol !== 'https:') {
        return;
      }

      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            Utils.log(`Service Worker registered: ${registration.scope}`, 'success');
          })
          .catch((error) => {
            Utils.log(`Service Worker registration skipped: ${error.message}`, 'warning');
          });
      });
    }
  };

  // ==========================================================================
  // MAIN INITIALIZATION
  // ==========================================================================

  function initialize() {
    const startTime = performance.now();

    try {
      // Initialize all systems in correct order
      DevToolsDetector.init();
      LanguageManager.init();
      LazyImages.init();
      StickyHeader.init();
      MobileNav.init();
      SmoothScroll.init();
      ScrollAnimations.init();
      CounterAnimations.init();
      CourseCountdown.init();
      PartnerCarousel.init();
      AccordionSystem.init();
      FormValidation.init();
      BackToTop.init();
      SectionBackgrounds.init();
      FooterYear.init();
      ServiceWorker.init();

      INTEC.state.isInitialized = true;

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      Utils.log(`âœ¨ INTEC Brussels initialized successfully in ${duration}ms`, 'success');

      // Announce page ready for screen readers
      setTimeout(() => {
        const srOnly = document.createElement('div');
        srOnly.className = 'sr-only';
        srOnly.setAttribute('role', 'status');
        srOnly.setAttribute('aria-live', 'polite');
        srOnly.textContent = 'Page loaded successfully';
        document.body.appendChild(srOnly);
      }, 100);

    } catch (error) {
      Utils.log(`Initialization error: ${error.message}`, 'error');
      console.error('Full error:', error);
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  window.INTEC = Object.assign(INTEC, {
    Utils,
    LanguageManager,
    SmoothScroll,
    PartnerCarousel,
    AccordionSystem,
    FormValidation,
    SectionBackgrounds,
    
    // Legacy support
    resetLanguage: () => LanguageManager.reset(),
    setupSmoothScroll: () => SmoothScroll.init(),
    refreshBackgrounds: () => SectionBackgrounds.refresh(),
    
    // Debug mode toggle
    enableDebug() {
      INTEC.config.debug = true;
      INTEC.config.monitorDevTools = true;
      DevToolsDetector.initialized = false;
      DevToolsDetector.init(true);
      Utils.log('Debug mode enabled', 'info');
      console.log('INTEC Configuration:', INTEC.config);
      console.log('INTEC State:', INTEC.state);
    },

    // Get system status
    getStatus() {
      return {
        initialized: INTEC.state.isInitialized,
        language: INTEC.state.currentLanguage,
        config: INTEC.config,
        modules: {
          languageManager: !!LanguageManager,
          smoothScroll: !!SmoothScroll,
          carousel: !!PartnerCarousel.carousel,
          accordions: AccordionSystem,
          forms: FormValidation.forms.length
        }
      };
    }
  });

  // ==========================================================================
  // START APPLICATION
  // ==========================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Console branding
  console.log([
    '==============================================',
    ' INTEC Brussels - Professional Website Core 2025',
    ' Ready: window.INTEC | Debug: INTEC.enableDebug()',
    ' Status: INTEC.getStatus()',
    '=============================================='
  ].join('\n'));

})();

