// assets/js/main.js
// Enhanced multilingual version with robust i18n handling

document.addEventListener("DOMContentLoaded", function () {
  // =============================
  // Language Management
  // =============================
  const defaultLanguage = "en";
  const savedLanguage = localStorage.getItem("intec-language") || defaultLanguage;
  let currentLanguage = savedLanguage;
  let languageLoadAttempts = 0;
  const MAX_LOAD_ATTEMPTS = 20; // 20 attempts × 50ms = 1 second max wait

  // Debug: Check if i18n is loaded
  console.log("🌍 Checking i18n availability...");
  console.log("📦 window.i18n exists:", !!window.i18n);
  console.log("📦 Dutch (nl) loaded:", !!window.i18n?.nl);
  console.log("📦 English (en) loaded:", !!window.i18n?.en);

  /**
   * Load and apply language translations
   * @param {string} lang - Language code (nl/en)
   */
  function loadLanguage(lang) {
    // Check if i18n object and requested language are available
    if (!window.i18n || !window.i18n[lang]) {
      languageLoadAttempts++;
      
      if (languageLoadAttempts < MAX_LOAD_ATTEMPTS) {
        console.warn(`⏳ Waiting for language '${lang}' to load... (attempt ${languageLoadAttempts})`);
        setTimeout(() => loadLanguage(lang), 50);
        return;
      } else {
        console.error(`❌ Language '${lang}' failed to load after ${MAX_LOAD_ATTEMPTS} attempts`);
        console.error("💡 Check if i18n script files are loaded before main.js");
        return;
      }
    }

    // Reset attempt counter on success
    languageLoadAttempts = 0;
    
    currentLanguage = lang;
    localStorage.setItem("intec-language", lang);
    document.documentElement.setAttribute("lang", lang);
    
    console.log(`✅ Language loaded: ${lang}`);
    
    applyTranslations();
    updateLanguageButtons();
    
    // Dispatch event for other scripts that might need to react
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
  }

  /**
   * Apply translations to all elements with data-i18n attributes
   */
  function applyTranslations() {
    const dict = window.i18n?.[currentLanguage] || {};
    let translatedCount = 0;
    let missingKeys = [];

    // Translate text content
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translation = dict[key];
      
      if (translation) {
        // Check if HTML content is allowed
        if (el.hasAttribute("data-i18n-allow-html")) {
          el.innerHTML = translation;
        } else {
          el.textContent = translation;
        }
        translatedCount++;
      } else {
        // Keep original key as fallback
        if (!el.hasAttribute("data-i18n-allow-html")) {
          el.textContent = key;
        }
        missingKeys.push(key);
      }
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const translation = dict[key];
      
      if (translation) {
        el.setAttribute("placeholder", translation);
        translatedCount++;
      } else {
        el.setAttribute("placeholder", key);
        missingKeys.push(`${key} (placeholder)`);
      }
    });

    // Translate aria-labels
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      const translation = dict[key];
      
      if (translation) {
        el.setAttribute("aria-label", translation);
        translatedCount++;
      } else {
        el.setAttribute("aria-label", key);
        missingKeys.push(`${key} (aria-label)`);
      }
    });

    // Log translation results
    console.log(`✅ Translated ${translatedCount} elements`);
    if (missingKeys.length > 0) {
      console.warn(`⚠️ Missing translation keys (${missingKeys.length}):`, [...new Set(missingKeys)]);
    }
  }

  /**
   * Update language button states
   */
  function updateLanguageButtons() {
    document.querySelectorAll(".language-switch").forEach((switcher) => {
      switcher.dataset.activeLang = currentLanguage;
    });

    document.querySelectorAll("[data-lang-select]").forEach((btn) => {
      const lang = btn.dataset.lang;
      const active = lang === currentLanguage;
      
      // Update visual state
      btn.classList.toggle("is-active", active);
      
      const switcher = btn.closest(".language-switch");
      if (switcher) {
        if (active) {
          switcher.dataset.activeLang = lang;
        } else if (!switcher.querySelector(".is-active")) {
          delete switcher.dataset.activeLang;
        }
      }
      
      // Update ARIA attributes for accessibility
      btn.setAttribute("aria-pressed", active);
      btn.setAttribute("aria-current", active ? "true" : "false");
      
      // Log for debugging
      if (active) {
        console.log(`✅ Active language button: ${lang.toUpperCase()}`);
      }
    });
  }

  // Language switcher event listeners
  document.querySelectorAll("[data-lang-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const newLang = btn.dataset.lang;
      console.log(`🔄 Switching to: ${newLang}`);
      loadLanguage(newLang);
    });
  });

  // Clear localStorage and reset to English if needed (for debugging)
  window.resetLanguage = function() {
    localStorage.removeItem("intec-language");
    loadLanguage("en");
    console.log("🔄 Language reset to English");
  };

  // Load saved or default language on page load
  loadLanguage(currentLanguage);

  // =============================
  // Smooth Scroll with Header Offset
  // =============================
  
  /**
   * Get dynamic header height for scroll offset
   */
  function getHeaderOffset() {
    const header = document.querySelector(".site-header");
    return header ? header.offsetHeight + 16 : 0;
  }

  /**
   * Easing function for smooth animations
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Smooth scroll to target Y position
   */
  function smoothScrollTo(targetY) {
    const start = window.pageYOffset;
    const distance = targetY - start;
    const duration = 650;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, start + distance * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }


function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const hash = anchor.getAttribute("href");
      const target = document.querySelector(hash);
      
      if (target) {
        e.preventDefault();
        const offset = getHeaderOffset();
        const targetY = target.getBoundingClientRect().top + window.pageYOffset - offset;
        smoothScrollTo(targetY);
        
        // Update URL without page jump
        history.replaceState(null, "", hash);
        
        // Set focus for accessibility
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  });
}

  // =============================
  // Course Countdown Badges
  // =============================

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const COURSE_COUNTDOWN_CLASS = "course-date__countdown";
  const COURSE_COUNTDOWN_MODIFIERS = [
    `${COURSE_COUNTDOWN_CLASS}--soon`,
    `${COURSE_COUNTDOWN_CLASS}--today`,
    `${COURSE_COUNTDOWN_CLASS}--past`
  ];

  const COURSE_COUNTDOWN_MESSAGES = {
    en: {
      inMany(days) {
        return `Starts in ${days} days`;
      },
      inOne() {
        return "Starts in 1 day";
      },
      today: "Starts today",
      pastMany(days) {
        return `Started ${days} days ago`;
      },
      pastOne() {
        return "Started 1 day ago";
      }
    },
    nl: {
      inMany(days) {
        return `Start over ${days} dagen`;
      },
      inOne() {
        return "Start over 1 dag";
      },
      today: "Start vandaag",
      pastMany(days) {
        return `Gestart ${days} dagen geleden`;
      },
      pastOne() {
        return "Gestart 1 dag geleden";
      }
    }
  };

  function getActiveLanguageCode() {
    if (typeof currentLanguage === "string") {
      return currentLanguage;
    }
    const docLang = document.documentElement.getAttribute("lang") || "en";
    return docLang.slice(0, 2);
  }

  function formatCountdownMessage(diffDays, lang) {
    const messages = COURSE_COUNTDOWN_MESSAGES[lang] || COURSE_COUNTDOWN_MESSAGES.en;
    if (diffDays > 0) {
      return diffDays === 1 ? messages.inOne() : messages.inMany(diffDays);
    }
    if (diffDays === 0) {
      return messages.today;
    }
    const pastDays = Math.abs(diffDays);
    return pastDays === 1 ? messages.pastOne() : messages.pastMany(pastDays);
  }

  function updateCourseCountdowns() {
    const lang = getActiveLanguageCode();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    document.querySelectorAll("[data-start-date]").forEach((item) => {
      const isoDate = item.getAttribute("data-start-date");
      if (!isoDate) {
        return;
      }

      const targetDate = new Date(isoDate);
      if (Number.isNaN(targetDate.getTime())) {
        return;
      }

      targetDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((targetDate - today) / MS_PER_DAY);

      const message = formatCountdownMessage(diffDays, lang);
      if (!message) {
        return;
      }

      let badge = item.querySelector("[data-countdown]");
      if (!badge) {
        badge = document.createElement("span");
        badge.setAttribute("data-countdown", "");
        badge.setAttribute("aria-live", "polite");
        badge.setAttribute("role", "status");
        badge.classList.add(COURSE_COUNTDOWN_CLASS);
        item.appendChild(document.createTextNode(" "));
        item.appendChild(badge);
      } else {
        badge.classList.add(COURSE_COUNTDOWN_CLASS);
      }

      badge.textContent = message;
      COURSE_COUNTDOWN_MODIFIERS.forEach((cls) => badge.classList.remove(cls));

      if (diffDays === 0) {
        badge.classList.add(`${COURSE_COUNTDOWN_CLASS}--today`);
      } else if (diffDays < 0) {
        badge.classList.add(`${COURSE_COUNTDOWN_CLASS}--past`);
      } else if (diffDays <= 30) {
        badge.classList.add(`${COURSE_COUNTDOWN_CLASS}--soon`);
      }
    });
  }

  let courseCountdownTimer = null;

  function startCourseCountdownTimer() {
    updateCourseCountdowns();
    if (courseCountdownTimer) {
      clearInterval(courseCountdownTimer);
    }
    courseCountdownTimer = setInterval(updateCourseCountdowns, 60 * 60 * 1000);
  }

  window.addEventListener("languageChanged", () => {
    updateCourseCountdowns();
  });

  // =============================
  // Sticky Header with Hide/Show
  // =============================
  
  function setupStickyHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    
    let lastY = window.scrollY;
    let ticking = false;

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          
          // Add condensed class after scrolling down
          header.classList.toggle("is-condensed", y > 40);
          
          // Hide header when scrolling down, show when scrolling up
          if (y > 120 && y > lastY) {
            header.classList.add("is-hidden");
          } else {
            header.classList.remove("is-hidden");
          }
          
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // =============================
  // Mobile Navigation Toggle
  // =============================
  
  function setupMobileNav() {
    const toggleButtons = document.querySelectorAll("[data-nav-toggle]");
    
    toggleButtons.forEach((button) => {
      const targetSelector = button.getAttribute("data-nav-toggle");
      const targetNav = document.querySelector(targetSelector);
      
      if (!targetNav) return;
      
      button.addEventListener("click", () => {
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        
        // Toggle states
        button.setAttribute("aria-expanded", !isExpanded);
        targetNav.classList.toggle("is-open");
        document.body.classList.toggle("nav-is-open");
        
        // Toggle icon if needed
        button.classList.toggle("is-active");
      });
    });
    
    // Close nav when clicking outside
    document.addEventListener("click", (e) => {
      const nav = document.querySelector(".primary-nav");
      const toggle = document.querySelector("[data-nav-toggle]");
      
      if (nav && toggle && 
          !nav.contains(e.target) && 
          !toggle.contains(e.target) &&
          nav.classList.contains("is-open")) {
        toggle.click();
      }
    });
  }

  // =============================
  // Lazy Loading Images
  // =============================
  
  function optimizeLazyImages() {
    document.querySelectorAll("img").forEach((img) => {
      // Critical images load immediately
      if (img.dataset.critical === "true") {
        img.setAttribute("loading", "eager");
        img.setAttribute("fetchpriority", "high");
      } else if (!img.hasAttribute("loading")) {
        // Non-critical images lazy load
        img.setAttribute("loading", "lazy");
      }
      
      // Async decoding for better performance
      if (!img.hasAttribute("decoding")) {
        img.setAttribute("decoding", "async");
      }
    });
  }

  // =============================
  // Scroll Animations
  // =============================
  
  const animationConfig = [
    { selector: ".hero__content", animation: "slide-right" },
    { selector: ".hero__visual", animation: "slide-left" },
    { selector: ".hero-card", animation: "fade-up" },
    { selector: ".section", animation: "fade-up" },
    { selector: ".section-heading", animation: "fade-up" },
    { selector: ".stats-item", animation: "fade-up" },
    { selector: ".program-card", animation: "fade-up" },
    { selector: ".course-card", animation: "fade-up" },
    { selector: ".tip-card", animation: "fade-up" },
    { selector: ".faq-item", animation: "fade-up" },
    { selector: ".highlight-box", animation: "fade-up" },
    { selector: ".logo-card", animation: "fade-up" },
    { selector: ".cta-band", animation: "fade-up" },
    { selector: ".timeline li", animation: "fade-up" },
  ];

  /**
   * Add animation attributes to elements
   */
  function ensureAnimationAttributes() {
    animationConfig.forEach(({ selector, animation }) => {
      document.querySelectorAll(selector).forEach((el) => {
        if (!el.dataset.animate) {
          el.dataset.animate = animation;
        }
      });
    });
  }

  /**
   * Setup intersection observer for scroll animations
   */
  function setupScrollAnimations() {
    ensureAnimationAttributes();
    
    // Handle existing data-animate elements
    const elements = document.querySelectorAll("[data-animate]");
    if (elements.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              // Unobserve after animation to improve performance
              observer.unobserve(entry.target);
            }
          });
        },
        { 
          threshold: 0.15,
          rootMargin: "0px 0px -50px 0px" // Trigger slightly before element enters viewport
        }
      );
      
      elements.forEach((el) => observer.observe(el));
      console.log(`✅ Observing ${elements.length} elements for animations`);
    }
    
    // Handle new fade-up elements for python.html and other enhanced pages
    const fadeUpElements = document.querySelectorAll(".fade-up");
    if (fadeUpElements.length > 0) {
      const fadeUpObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              // Unobserve after animation to improve performance
              fadeUpObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -80px 0px"
        }
      );
      
      fadeUpElements.forEach((el) => fadeUpObserver.observe(el));
      console.log(`✅ Observing ${fadeUpElements.length} fade-up elements`);
    }
    
    // Setup floating CTA button visibility
    const floatingCta = document.querySelector(".floating-cta");
    if (floatingCta) {
      let lastScrollY = 0;
      let ticking = false;
      
      const updateFloatingCta = () => {
        const scrollY = window.pageYOffset;
        
        // Show after scrolling 400px down
        if (scrollY > 400) {
          floatingCta.classList.add("is-visible");
        } else {
          floatingCta.classList.remove("is-visible");
        }
        
        lastScrollY = scrollY;
        ticking = false;
      };
      
      window.addEventListener("scroll", () => {
        if (!ticking) {
          window.requestAnimationFrame(updateFloatingCta);
          ticking = true;
        }
      });
      
      console.log("✅ Floating CTA button initialized");
    }
  }

  // =============================
  // Counter Animations
  // =============================
  
  function setupCounters() {
    const counters = document.querySelectorAll("[data-counter]");
    if (counters.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !entry.target.classList.contains("counted")) {
            startCounter(entry.target);
            entry.target.classList.add("counted");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    
    counters.forEach((el) => {
      el.textContent = "0";
      observer.observe(el);
    });
  }

  /**
   * Animate counter from 0 to target value
   */
  function startCounter(el) {
    const target = parseFloat(el.dataset.target) || 0;
    const duration = parseInt(el.dataset.duration) || 2000;
    const decimals = (target % 1 !== 0) ? 1 : 0; // Check if target has decimals
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = target * easeOutCubic(progress);
      
      el.textContent = decimals ? value.toFixed(1) : Math.floor(value);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        // Ensure final value is exact
        el.textContent = decimals ? target.toFixed(1) : target;
      }
    }
    requestAnimationFrame(step);
  }

  // =============================
  // Form Validation
  // =============================
  
  // =============================
  // Form Validation with Smart Real-Time Logic
  // =============================
  
  function setupValidation(form) {
    if (!form) return;
    
    // Validation patterns and rules
    const validationRules = {
      'full-name': {
        required: true,
        minLength: 5,
        maxLength: 25,
        pattern: /^[A-Za-zÀ-ÿ' -]{2,}\s[A-Za-zÀ-ÿ' -]{2,}$/,
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
        pattern: /^[A-Za-zÀ-ÿ' -]{2,30}$/,
        errorKey: 'register.validation.city'
      },
      'course': {
        required: true,
        errorKey: 'register.validation.course'
      },
      'message': {
        required: false,
        maxLength: 500,
        errorKey: 'register.validation.messageLength'
      }
    };

    // Add error message elements to all fields
    form.querySelectorAll("input, select, textarea").forEach((input) => {
      const existingError = input.parentNode.querySelector('.form-error');
      if (!existingError) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'form-error';
        input.parentNode.appendChild(errorMsg);
      }
    });

    // Enforce max length on input
    function enforceMaxLength(input, maxLength) {
      if (input.value.length > maxLength) {
        input.value = input.value.substring(0, maxLength);
      }
    }

    // Validation function with smart error detection
    function validateField(input, realTime = false) {
      const value = input.value.trim();
      const rawValue = input.value; // Keep spaces for length check
      const name = input.name;
      const rules = validationRules[name];
      
      if (!rules) return { isValid: true, errorKey: null };

      let isValid = true;
      let errorKey = null;

      // Required check
      if (rules.required && !value) {
        isValid = false;
        errorKey = rules.errorKey;
        return { isValid, errorKey };
      }

      // Skip validation if field is optional and empty
      if (!rules.required && !value) {
        return { isValid: true, errorKey: null };
      }

      // Check for numbers only fields
      if (rules.numbersOnly && value && !/^\d+$/.test(value.replace(/[\s.-]/g, ''))) {
        isValid = false;
        errorKey = rules.numbersErrorKey || rules.errorKey;
        return { isValid, errorKey };
      }

      // Min length check
      if (rules.minLength && rawValue.length < rules.minLength) {
        isValid = false;
        errorKey = rules.minErrorKey || rules.errorKey;
        return { isValid, errorKey };
      }

      // Exact length check
      if (rules.exactLength && value.replace(/[\s.-]/g, '').length !== rules.exactLength) {
        isValid = false;
        errorKey = rules.errorKey;
        return { isValid, errorKey };
      }

      // Pattern validation
      if (rules.pattern && value) {
        const cleanValue = name === 'phone' || name === 'national-number' 
          ? value.replace(/[\s.-]/g, '') 
          : value;
        
        if (!rules.pattern.test(cleanValue)) {
          isValid = false;
          errorKey = rules.errorKey;
          return { isValid, errorKey };
        }
      }

      // Select field validation
      if (input.tagName === 'SELECT' && (!value || value === '')) {
        isValid = false;
        errorKey = rules.errorKey;
        return { isValid, errorKey };
      }

      return { isValid, errorKey };
    }

    // Show error message
    function showError(input, errorKey) {
      if (!errorKey) return;
      
      input.classList.add("has-error");
      const errorMsg = input.parentNode.querySelector('.form-error');
      if (errorMsg) {
        errorMsg.setAttribute('data-i18n', errorKey);
        const dict = window.i18n?.[currentLanguage] || {};
        errorMsg.textContent = dict[errorKey] || errorKey;
        errorMsg.style.display = 'block';
      }
    }

    // Hide error message
    function hideError(input) {
      input.classList.remove("has-error");
      const errorMsg = input.parentNode.querySelector('.form-error');
      if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.textContent = '';
      }
    }

    // Form submit handler
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      let valid = true;
      let firstError = null;

      // Hide success message if visible
      const successMsg = form.querySelector('.form-success');
      if (successMsg) {
        successMsg.classList.remove('is-visible');
      }

      // Clear all previous errors
      form.querySelectorAll(".has-error").forEach((el) => {
        el.classList.remove("has-error");
      });
      form.querySelectorAll(".form-error").forEach((el) => {
        el.style.display = 'none';
      });

      // Validate all fields
      const fieldsToValidate = form.querySelectorAll("input, select, textarea");
      fieldsToValidate.forEach((input) => {
        // Skip optional empty message field
        if (input.name === 'message' && !input.value.trim() && !input.hasAttribute('required')) {
          return;
        }

        const validation = validateField(input);
        if (!validation.isValid) {
          showError(input, validation.errorKey);
          valid = false;
          if (!firstError) firstError = input;
        }
      });

      if (!valid) {
        // Focus first error field
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        
        console.warn("⚠️ Form validation failed");
      } else {
        // Form is valid - show success message
        console.log("✅ Form validated successfully");
        
        // Create or show success message
        let successMsg = form.querySelector('.form-success');
        if (!successMsg) {
          successMsg = document.createElement('div');
          successMsg.className = 'form-success';
          successMsg.innerHTML = `
            <div class="form-success__title" data-i18n="register.success.title">Bedankt voor uw voorinschrijving!</div>
            <p class="form-success__message" data-i18n="register.success.message">U ontvangt binnen drie werkdagen een bevestiging per e-mail.</p>
          `;
          
          // Insert after submit button
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.parentNode.insertBefore(successMsg, submitBtn.nextSibling);
          } else {
            form.appendChild(successMsg);
          }
        }
        
        // Translate success message
        const dict = window.i18n?.[currentLanguage] || {};
        const titleEl = successMsg.querySelector('[data-i18n="register.success.title"]');
        const msgEl = successMsg.querySelector('[data-i18n="register.success.message"]');
        
        if (titleEl) titleEl.textContent = dict['register.success.title'] || titleEl.textContent;
        if (msgEl) msgEl.textContent = dict['register.success.message'] || msgEl.textContent;
        
        // Show success message
        successMsg.classList.add('is-visible');
        
        // Scroll to success message
        successMsg.scrollIntoView({ behavior: "smooth", block: "center" });
        
        // Reset form after 5 seconds
        setTimeout(() => {
          form.reset();
          successMsg.classList.remove('is-visible');
        }, 5000);
      }
    });

    // Real-time validation on input (auto-hide warnings)
    form.querySelectorAll("input, select, textarea").forEach((input) => {
      const name = input.name;
      const rules = validationRules[name];
      
      // Max length enforcement
      if (rules && rules.maxLength) {
        input.addEventListener("input", () => {
          enforceMaxLength(input, rules.maxLength);
        });
      }

      // Real-time validation on input
      input.addEventListener("input", () => {
        const validation = validateField(input, true);
        
        if (validation.isValid) {
          // Auto-hide warning when field becomes valid
          hideError(input);
        } else if (input.value.trim() || input.hasAttribute('required')) {
          // Show error only if user started typing or field is required
          showError(input, validation.errorKey);
        }
      });

      // Validation on blur
      input.addEventListener("blur", () => {
        const validation = validateField(input, false);
        
        if (!validation.isValid && (input.value.trim() || input.hasAttribute('required'))) {
          showError(input, validation.errorKey);
        } else if (validation.isValid) {
          hideError(input);
        }
      });

      // For select fields - immediate validation on change
      if (input.tagName === 'SELECT') {
        input.addEventListener("change", () => {
          const validation = validateField(input, true);
          
          if (validation.isValid) {
            hideError(input);
          } else {
            showError(input, validation.errorKey);
          }
        });
      }
    });
  }

  // Setup validation for all forms
  setupValidation(document.querySelector("#registration-form"));
  setupValidation(document.querySelector("#contact-form"));
  setupValidation(document.querySelector("#partner-login-form"));

  // =============================
  // 🎠 Partner Carousel - 60fps, Zero Jitter, Full A11y
  // =============================
  function initPartnerCarousel() {
    const carousel = document.querySelector("[data-carousel='partners']");
    if (!carousel || carousel.__carouselInit) return; // Guard: prevent double init
    
    carousel.__carouselInit = true; // Mark as initialized
    
    const track = carousel.querySelector("[data-partner-track]");
    const dotsContainer = carousel.querySelector(".partner-carousel__dots");
    const prevBtn = carousel.querySelector("[data-partner-prev]");
    const nextBtn = carousel.querySelector("[data-partner-next]");
    const originalSlides = Array.from(track?.querySelectorAll(".partner-carousel__slide") || []);
    
    if (!track || !originalSlides.length) {
      console.warn("⚠️ Partner carousel: missing track or slides");
      return;
    }

    // ═══════════════════════════════════════════
    // STATE MACHINE: idle → animating → idle
    // ═══════════════════════════════════════════
    const STATE = {
      IDLE: "idle",
      ANIMATING: "animating",
      DRAGGING: "dragging"
    };
    
    let state = STATE.IDLE;
    let currentIndex = 1; // Start after last clone
    let stepX = 0;
    let autoplayTimer = null;
    let transitionEndTimer = null;
    let resizeRAF = null;

    // ═══════════════════════════════════════════
    // CONFIG: All from :root or computed
    // ═══════════════════════════════════════════
    const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = getComputedStyle(document.documentElement);
    const TRANSITION_MS = REDUCED_MOTION ? 0 : 850;
    const EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
    const AUTOPLAY_MS = REDUCED_MOTION ? 0 : 6500;
    const MIN_SWIPE_PX = 50;
    const SWIPE_THRESHOLD = 0.2; // 20% of slide width

    // ═══════════════════════════════════════════
    // CLONE SLIDES for infinite loop
    // ═══════════════════════════════════════════
    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
    
    firstClone.classList.add("is-clone");
    firstClone.setAttribute("aria-hidden", "true");
    lastClone.classList.add("is-clone");
    lastClone.setAttribute("aria-hidden", "true");
    
    track.insertBefore(lastClone, originalSlides[0]);
    track.appendChild(firstClone);
    
    const allSlides = Array.from(track.querySelectorAll(".partner-carousel__slide"));
    const REAL_COUNT = originalSlides.length;

    // ═══════════════════════════════════════════
    // CORE: Compute slide width + gap
    // ═══════════════════════════════════════════
    function computeStepX() {
      if (allSlides.length < 2) {
        stepX = carousel.offsetWidth;
        return;
      }
      const rectA = allSlides[0].getBoundingClientRect();
      const rectB = allSlides[1].getBoundingClientRect();
      stepX = Math.abs(rectB.left - rectA.left) || rectA.width;
    }

    // ═══════════════════════════════════════════
    // TRANSFORM: Only on X axis (no Y jitter!)
    // ═══════════════════════════════════════════
    function setTransform(index, withTransition = true) {
      const x = -index * stepX;
      const apply = () => {
        track.style.transition = withTransition && TRANSITION_MS > 0
          ? `transform ${TRANSITION_MS}ms ${EASE}`
          : "none";
        track.style.transform = `translate3d(${x}px, 0, 0)`;
        track.style.willChange = withTransition ? "transform" : "auto";
      };

      if (withTransition && TRANSITION_MS > 0) {
        requestAnimationFrame(apply);
      } else {
        apply();
      }
    }

    // ═══════════════════════════════════════════
    // ARIA + DOTS: Update UI state
    // ═══════════════════════════════════════════
    function updateUI() {
      const realIndex = currentIndex === 0 ? REAL_COUNT - 1 
                      : currentIndex === REAL_COUNT + 1 ? 0 
                      : currentIndex - 1;

      // Update slides
      allSlides.forEach((slide, i) => {
        const isActive = i === currentIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll("[data-partner-dot]");
        dots.forEach((dot, i) => {
          const isActive = i === realIndex;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-current", isActive ? "true" : "false");
        });
      }

      // Update buttons (disable during animation, enable at bounds)
      const isAnimating = state === STATE.ANIMATING;
      if (prevBtn) {
        prevBtn.disabled = isAnimating;
        prevBtn.setAttribute("aria-disabled", isAnimating ? "true" : "false");
      }
      if (nextBtn) {
        nextBtn.disabled = isAnimating;
        nextBtn.setAttribute("aria-disabled", isAnimating ? "true" : "false");
      }
    }

    // ═══════════════════════════════════════════
    // SNAP: Jump to real slide after clone
    // ═══════════════════════════════════════════
    function snapToReal() {
      if (currentIndex === 0) {
        currentIndex = REAL_COUNT;
        setTransform(currentIndex, false);
        void track.offsetHeight; // Force reflow
      } else if (currentIndex === REAL_COUNT + 1) {
        currentIndex = 1;
        setTransform(currentIndex, false);
        void track.offsetHeight;
      }
    }

    // ═══════════════════════════════════════════
    // NAVIGATE: Go to specific index
    // ═══════════════════════════════════════════
    function goToIndex(newIndex) {
      if (state === STATE.ANIMATING) return;
      
      state = STATE.ANIMATING;
      currentIndex = newIndex;
      setTransform(currentIndex, true);
      updateUI();

      // Fallback timer in case transitionend doesn't fire
      clearTimeout(transitionEndTimer);
      if (TRANSITION_MS > 0) {
        transitionEndTimer = setTimeout(() => {
          state = STATE.IDLE;
          snapToReal();
          updateUI();
        }, TRANSITION_MS + 100);
      } else {
        state = STATE.IDLE;
        snapToReal();
        updateUI();
      }
    }

    const next = () => goToIndex(currentIndex + 1);
    const prev = () => goToIndex(currentIndex - 1);
    const goTo = (realIdx) => goToIndex(realIdx + 1); // +1 for clone offset

    // ═══════════════════════════════════════════
    // AUTOPLAY: Chain-based timing
    // ═══════════════════════════════════════════
    function startAutoplay() {
      if (AUTOPLAY_MS === 0 || REDUCED_MOTION) return;
      clearTimeout(autoplayTimer);
      autoplayTimer = setTimeout(() => {
        next();
        startAutoplay();
      }, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      clearTimeout(autoplayTimer);
    }

    function resumeAutoplay() {
      startAutoplay();
    }

    // ═══════════════════════════════════════════
    // EVENTS: Buttons
    // ═══════════════════════════════════════════
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        stopAutoplay();
        next();
        resumeAutoplay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        stopAutoplay();
        prev();
        resumeAutoplay();
      });
    }

    // ═══════════════════════════════════════════
    // EVENTS: Dots
    // ═══════════════════════════════════════════
    if (dotsContainer) {
      dotsContainer.addEventListener("click", (e) => {
        const dot = e.target.closest("[data-partner-dot]");
        if (!dot) return;
        
        const idx = parseInt(dot.dataset.partnerDot, 10);
        if (!isNaN(idx) && idx !== currentIndex - 1) {
          stopAutoplay();
          goTo(idx);
          resumeAutoplay();
        }
      });
    }

    // ═══════════════════════════════════════════
    // EVENTS: Touch/Mouse Drag
    // ═══════════════════════════════════════════
    let dragStart = null;
    let dragDelta = 0;

    function handleDragStart(clientX) {
      if (state === STATE.ANIMATING) return;
      stopAutoplay();
      state = STATE.DRAGGING;
      dragStart = clientX;
      dragDelta = 0;
      setTransform(currentIndex, false);
    }

    function handleDragMove(clientX) {
      if (state !== STATE.DRAGGING || dragStart === null) return;
      dragDelta = clientX - dragStart;
      const x = -currentIndex * stepX + dragDelta;
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    function handleDragEnd() {
      if (state !== STATE.DRAGGING) return;
      state = STATE.IDLE;
      
      const threshold = Math.max(MIN_SWIPE_PX, stepX * SWIPE_THRESHOLD);
      const shouldChange = Math.abs(dragDelta) > threshold;

      if (shouldChange) {
        if (dragDelta > 0) prev();
        else next();
      } else {
        setTransform(currentIndex, true);
      }

      dragStart = null;
      dragDelta = 0;
      resumeAutoplay();
    }

    // Touch events (passive for performance)
    carousel.addEventListener("touchstart", (e) => {
      handleDragStart(e.touches[0].clientX);
    }, { passive: true });

    carousel.addEventListener("touchmove", (e) => {
      handleDragMove(e.touches[0].clientX);
    }, { passive: true });

    carousel.addEventListener("touchend", handleDragEnd, { passive: true });

    // Mouse events
    carousel.addEventListener("mousedown", (e) => {
      e.preventDefault();
      handleDragStart(e.clientX);
      
      const handleMouseMove = (moveEvent) => {
        handleDragMove(moveEvent.clientX);
      };
      
      const handleMouseUp = () => {
        handleDragEnd();
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    });

    // ═══════════════════════════════════════════
    // EVENTS: Keyboard (Accessibility)
    // ═══════════════════════════════════════════
    carousel.addEventListener("keydown", (e) => {
      if (state === STATE.ANIMATING) return;
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          stopAutoplay();
          prev();
          resumeAutoplay();
          break;
        case "ArrowRight":
          e.preventDefault();
          stopAutoplay();
          next();
          resumeAutoplay();
          break;
        case "Home":
          e.preventDefault();
          stopAutoplay();
          goTo(0);
          resumeAutoplay();
          break;
        case "End":
          e.preventDefault();
          stopAutoplay();
          goTo(REAL_COUNT - 1);
          resumeAutoplay();
          break;
      }
    });

    // Make carousel focusable for keyboard
    if (!carousel.hasAttribute("tabindex")) {
      carousel.setAttribute("tabindex", "0");
    }
    carousel.setAttribute("role", "region");
    carousel.setAttribute("aria-label", "Partner logos carousel");

    // ═══════════════════════════════════════════
    // EVENTS: TransitionEnd (clean state)
    // ═══════════════════════════════════════════
    track.addEventListener("transitionend", (e) => {
      if (e.target !== track || e.propertyName !== "transform") return;
      
      clearTimeout(transitionEndTimer);
      state = STATE.IDLE;
      snapToReal();
      updateUI();
    });

    // ═══════════════════════════════════════════
    // EVENTS: Visibility (pause when hidden)
    // ═══════════════════════════════════════════
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        resumeAutoplay();
      }
    });

    // Pause on hover
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", resumeAutoplay);

    // ═══════════════════════════════════════════
    // EVENTS: Resize (debounced with RAF)
    // ═══════════════════════════════════════════
    function handleResize() {
      if (resizeRAF) return; // Debounce with RAF
      
      resizeRAF = requestAnimationFrame(() => {
        setTransform(currentIndex, false);
        computeStepX();
        setTransform(currentIndex, false);
        void track.offsetHeight; // Force reflow
        resizeRAF = null;
      });
    }

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(handleResize);
      ro.observe(carousel);
      ro.observe(track);
    } else {
      let resizeTimer;
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(handleResize, 150);
      });
    }

    // ═══════════════════════════════════════════
    // INIT: Start the carousel
    // ═══════════════════════════════════════════
    computeStepX();
    setTransform(currentIndex, false);
    
    requestAnimationFrame(() => {
      updateUI();
      if (!REDUCED_MOTION) startAutoplay();
    });

    console.log(`✅ Partner carousel initialized: ${REAL_COUNT} slides, stepX=${stepX}px, 60fps mode`);
  }

  // =============================
  // Details/Accordion Enhancement
  // =============================
  
  function enhanceAccordions() {
    const details = document.querySelectorAll("details");
    
    details.forEach((detail) => {
      const summary = detail.querySelector("summary");
      if (!summary) return;
      
      summary.addEventListener("click", (e) => {
        // Add smooth animation class
        detail.classList.add("is-animating");
        
        setTimeout(() => {
          detail.classList.remove("is-animating");
        }, 300);
      });
    });
  }

  // =============================
  // Update Footer Year
  // =============================
  
  function updateFooterYear() {
    const yearElement = document.getElementById("year");
    if (yearElement) {
      yearElement.textContent = new Date().getFullYear();
    }
  }

  // =============================
  // Initialize All Features
  // =============================
  
  console.log("🚀 Initializing INTEC Brussels website...");
  
  // Performance monitoring
  const initStart = performance.now();
  
  try {
    optimizeLazyImages();
    setupStickyHeader();
    setupMobileNav();
    setupSmoothScroll();
    setupScrollAnimations();
    setupCounters();
    startCourseCountdownTimer();
    initPartnerCarousel();
    enhanceAccordions();
    updateFooterYear();
    
    const initEnd = performance.now();
    console.log(`✅ All features initialized in ${(initEnd - initStart).toFixed(2)}ms`);
  } catch (error) {
    console.error("❌ Initialization error:", error);
  }
  
  // Announce page ready for screen readers
  setTimeout(() => {
    const srOnly = document.createElement("div");
    srOnly.className = "sr-only";
    srOnly.setAttribute("role", "status");
    srOnly.setAttribute("aria-live", "polite");
    srOnly.textContent = "Page loaded successfully";
    document.body.appendChild(srOnly);
  }, 100);
});

// =============================
// Service Worker Registration (Optional)
// =============================

if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.log("ℹ️ Service Worker registration skipped:", error);
      });
  });
}

// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('is-open');
    const isOpen = navLinks.classList.contains('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header__inner')) {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', false);
    }
  });
}

// =============================
// Back to Top Button - Modern
// =============================
const backToTopBtn = document.getElementById('backToTopBtn');

if (backToTopBtn) {
  // Show/Hide button on scroll based on 60% of page
  const toggleBackToTop = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / documentHeight) * 100;
    
    if (scrollPercentage > 60) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  };

  // Throttle scroll event for better performance
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(toggleBackToTop);
  });

  // Smooth scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  // Initial check
  toggleBackToTop();
}

// =============================
// Sticky Header Effect
// =============================
const siteHeader = document.querySelector('.site-header');

if (siteHeader) {
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 60) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  });
}

// ============================================================================
// SECTION BACKGROUND ALTERNATION SYSTEM
// ============================================================================

/**
 * 🎨 نظام متقدم لتطبيق ألوان خلفية متناوبة على الأقسام
 * يدعم تخصيص الألوان والاستثناءات مع تحسين الأداء
 */
(function initSectionBackgroundSystem() {
  'use strict';
  
  // إعدادات النظام
  const CONFIG = {
    // الـ selectors الأساسية - تحديث لتشمل جميع الأقسام
    mainSelector: 'section, .section',
    
    // الأقسام المستثناة من النظام
    excludeClasses: [
      'hero',
      'section--hero', 
      'cta-band',
      'section--cta',
      'footer',
      'about-hero',
      'contact-hero',
      'team-hero',
      'opleidingen-hero'
    ],
    
    // استخدام classes بدلاً من inline styles (أفضل للأداء)
    useClasses: true,
    
    // الـ classes المستخدمة
    evenClass: 'section--surface',  // للأقسام الزوجية
    oddClass: 'section--alt',       // للأقسام الفردية
    
    // Fallback inline styles (إذا لم نستخدم classes)
    evenBackground: 'var(--color-bg-surface)',
    oddBackground: 'var(--color-bg-section)',
    
    // تمكين/تعطيل الانتقالات السلسة
    enableTransitions: true,
    
    // تمكين/تعطيل الـ debug logging
    debug: false
  };

  /**
   * التحقق من أن القسم مستثنى من النظام
   * @param {Element} section - عنصر القسم
   * @returns {boolean}
   */
  function isExcludedSection(section) {
    return CONFIG.excludeClasses.some(className => 
      section.classList.contains(className)
    );
  }

  /**
   * تطبيق الخلفية المناسبة على القسم
   * @param {Element} section - عنصر القسم
   * @param {number} visualIndex - الفهرس المرئي (بعد استثناء الأقسام الخاصة)
   */
  function applySectionBackground(section, visualIndex) {
    // تخطي الأقسام المستثناة
    if (isExcludedSection(section)) {
      if (CONFIG.debug) {
        console.log(`🚫 Skipping excluded section:`, section.className);
      }
      return;
    }

    const isEven = visualIndex % 2 === 0;
    
    if (CONFIG.useClasses) {
      // إزالة الـ classes القديمة أولاً
      section.classList.remove(CONFIG.evenClass, CONFIG.oddClass);
      
      // إضافة الـ class المناسب
      const targetClass = isEven ? CONFIG.evenClass : CONFIG.oddClass;
      section.classList.add(targetClass);
      
      if (CONFIG.debug) {
        console.log(`✅ Applied class "${targetClass}" to section ${visualIndex}`);
      }
    } else {
      // تطبيق inline style كـ fallback
      const targetBackground = isEven ? CONFIG.evenBackground : CONFIG.oddBackground;
      section.style.background = targetBackground;
      
      if (CONFIG.debug) {
        console.log(`✅ Applied background "${targetBackground}" to section ${visualIndex}`);
      }
    }
  }

  /**
   * تطبيق النظام على جميع الأقسام
   */
  function applySectionBackgrounds() {
    const sections = document.querySelectorAll(CONFIG.mainSelector);
    
    if (sections.length === 0) {
      if (CONFIG.debug) {
        console.warn('⚠️ No sections found with selector:', CONFIG.mainSelector);
      }
      return;
    }

    let visualIndex = 0; // العداد المرئي (بعد استثناء الأقسام الخاصة)
    let processedCount = 0;

    sections.forEach((section, absoluteIndex) => {
      if (isExcludedSection(section)) {
        if (CONFIG.debug) {
          console.log(`🚫 Section ${absoluteIndex} excluded:`, section.className);
        }
        return;
      }

      // تطبيق الخلفية المناسبة
      applySectionBackground(section, visualIndex);
      
      visualIndex++;
      processedCount++;
    });

    if (CONFIG.debug) {
      console.log(`✅ Section backgrounds applied: ${processedCount}/${sections.length} sections processed`);
    }

    // إرسال event مخصص لإشعار النظائم الأخرى
    window.dispatchEvent(new CustomEvent('sectionBackgroundsApplied', {
      detail: { 
        processedCount, 
        totalCount: sections.length,
        config: CONFIG 
      }
    }));
  }

  /**
   * Debounce function لتحسين الأداء
   * @param {Function} func - الدالة المراد تأخيرها
   * @param {number} wait - وقت التأخير بالميلي ثانية
   * @returns {Function}
   */
  function debounce(func, wait = 100) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * إعادة تطبيق النظام (مفيد عند تغيير المحتوى ديناميكياً)
   */
  function refreshSectionBackgrounds() {
    if (CONFIG.debug) {
      console.log('🔄 Refreshing section backgrounds...');
    }
    applySectionBackgrounds();
  }

  /**
   * تطبيق الانتقالات السلسة على الأقسام
   */
  function enableSmoothTransitions() {
    if (!CONFIG.enableTransitions) return;

    const style = document.createElement('style');
    style.textContent = `
      /* Smooth transitions for section background changes */
      main > section:not(.hero):not(.cta-band),
      main > .section:not(.hero):not(.cta-band) {
        transition: background-color 0.3s ease;
      }
    `;
    document.head.appendChild(style);

    if (CONFIG.debug) {
      console.log('✅ Smooth transitions enabled for section backgrounds');
    }
  }

  /**
   * مراقبة تغييرات DOM لإعادة تطبيق النظام تلقائياً
   */
  function setupDOMObserver() {
    // مراقبة إضافة/حذف الأقسام
    const observer = new MutationObserver(debounce((mutations) => {
      let shouldRefresh = false;

      mutations.forEach((mutation) => {
        // التحقق من إضافة أو حذف عقد
        if (mutation.type === 'childList') {
          const addedSections = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === 1 && 
                   (node.matches('section') || node.matches('.section')));
          
          const removedSections = Array.from(mutation.removedNodes)
            .filter(node => node.nodeType === 1 && 
                   (node.matches('section') || node.matches('.section')));

          if (addedSections.length > 0 || removedSections.length > 0) {
            shouldRefresh = true;
          }
        }

        // التحقق من تغيير classes
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            mutation.target.matches('section, .section')) {
          shouldRefresh = true;
        }
      });

      if (shouldRefresh) {
        if (CONFIG.debug) {
          console.log('🔍 DOM changes detected, refreshing section backgrounds...');
        }
        refreshSectionBackgrounds();
      }
    }, 250));

    // مراقبة body container لتشمل جميع الأقسام
    const bodyContainer = document.body;
    if (bodyContainer) {
      observer.observe(bodyContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      if (CONFIG.debug) {
        console.log('👁️ DOM observer setup for dynamic content changes (body-wide)');
      }
    }

    return observer;
  }

  /**
   * إعداد event listeners للأحداث المهمة
   */
  function setupEventListeners() {
    // إعادة تطبيق عند تغيير حجم الشاشة (مع debounce)
    window.addEventListener('resize', debounce(refreshSectionBackgrounds, 250));

    // إعادة تطبيق عند تغيير اللغة
    window.addEventListener('languageChanged', refreshSectionBackgrounds);

    // API عام للاستخدام الخارجي
    window.INTEC_SectionBackgrounds = {
      refresh: refreshSectionBackgrounds,
      config: CONFIG,
      apply: applySectionBackgrounds
    };

    // إضافة applyAlternatingSectionClasses كاسم مستعار
    window.applyAlternatingSectionClasses = refreshSectionBackgrounds;
    window.refreshBackgrounds = refreshSectionBackgrounds;
    
    // دالة لتمكين debug mode
    window.debugBackgroundSystem = function() {
      CONFIG.debug = true;
      console.log('🐛 Debug mode enabled for Section Background System');
      console.log('📊 Current Config:', CONFIG);
      refreshSectionBackgrounds();
    };

    if (CONFIG.debug) {
      console.log('🔧 Event listeners setup complete');
      console.log('💡 Use window.INTEC_SectionBackgrounds.refresh() to manually refresh');
    }
  }

  /**
   * تشغيل النظام الرئيسي
   */
  function initializeSystem() {
    const startTime = performance.now();

    try {
      // تمكين الانتقالات السلسة
      enableSmoothTransitions();

      // تطبيق النظام للمرة الأولى
      applySectionBackgrounds();

      // إعداد مراقبة التغييرات
      setupDOMObserver();

      // إعداد event listeners
      setupEventListeners();

      const endTime = performance.now();
      const initTime = (endTime - startTime).toFixed(2);

      console.log(`🎨 Section Background System initialized successfully in ${initTime}ms`);
      
      if (CONFIG.debug) {
        console.log('📊 System Config:', CONFIG);
      }

    } catch (error) {
      console.error('❌ Section Background System initialization failed:', error);
    }
  }

  // تشغيل النظام عند تحميل DOM أو فوراً إذا كان جاهزاً
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    // DOM جاهز، تشغيل فوري
    initializeSystem();
  }

  // تشغيل إضافي عند تحميل النافذة (للتأكد من تحميل جميع الموارد)
  window.addEventListener('load', refreshSectionBackgrounds);

})();

// ============================================================================
// 🎨 ALTERNATING SECTION BACKGROUNDS SYSTEM
// نظام الخلفيات المتناوبة التلقائي
// ============================================================================

(function() {
  'use strict';

  /**
   * ⚙️ إعدادات النظام
   */
  const CONFIG = {
    // CSS classes للخلفيات المتناوبة
    surfaceClass: 'section--surface',  // الأقسام الزوجية (فاتح)
    altClass: 'section--alt',          // الأقسام الفردية (متناوب)
    
    // قائمة الأقسام المستثناة من النظام التلقائي
    excludeSelectors: [
      '.hero',
      '.footer', 
      '.header',
      '.navigation',
      '[data-no-alternating]',
      '.section--no-alternating'
    ],
    
    // إعدادات المراقبة
    observeChanges: true,        // مراقبة التغييرات في DOM
    debounceDelay: 300,         // تأخير لتجنب الاستدعاءات المتكررة
    
    // وضع التطوير
    debug: true                // لعرض تفاصيل إضافية في console
  };

  /**
   * 🎯 وظيفة تطبيق الخلفيات المتناوبة
   */
  function applyAlternatingSectionClasses() {
    // البحث عن جميع الأقسام في الصفحة
    const sections = document.querySelectorAll('section, .section');
    
    if (sections.length === 0) {
      if (CONFIG.debug) {
        console.log('🔍 No sections found for alternating backgrounds');
      }
      return;
    }

    // تصفية الأقسام المستثناة
    const validSections = Array.from(sections).filter(section => {
      // تحقق من الاستثناءات
      for (const excludeSelector of CONFIG.excludeSelectors) {
        if (section.matches(excludeSelector)) {
          if (CONFIG.debug) {
            console.log(`⏭️ Excluding section: ${excludeSelector}`);
          }
          return false;
        }
      }
      return true;
    });

    if (CONFIG.debug) {
      console.log(`🎨 Processing ${validSections.length} sections for alternating backgrounds`);
    }

    // إزالة الخلفيات القديمة أولاً
    validSections.forEach(section => {
      section.classList.remove(CONFIG.surfaceClass, CONFIG.altClass);
    });

    // تطبيق الخلفيات المتناوبة
    validSections.forEach((section, index) => {
      const isEven = index % 2 === 0;
      const className = isEven ? CONFIG.surfaceClass : CONFIG.altClass;
      
      section.classList.add(className);
      
      if (CONFIG.debug) {
        console.log(`✅ Section ${index + 1}: Applied .${className}`);
      }
    });

    if (CONFIG.debug) {
      console.log('🎨 Alternating section backgrounds applied successfully');
    }
  }

  /**
   * ⏱️ تطبيق Debounce لتحسين الأداء
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

  /**
   * 👁️ مراقب التغييرات في DOM
   */
  function setupDOMObserver() {
    if (!CONFIG.observeChanges) return null;

    const debouncedRefresh = debounce(() => {
      if (CONFIG.debug) {
        console.log('🔄 DOM changes detected, refreshing section backgrounds...');
      }
      applyAlternatingSectionClasses();
    }, CONFIG.debounceDelay);

    const observer = new MutationObserver((mutations) => {
      let shouldRefresh = false;

      mutations.forEach((mutation) => {
        // التحقق من إضافة/حذف sections
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches('section, .section') || 
                  node.querySelector('section, .section')) {
                shouldRefresh = true;
                break;
              }
            }
          }
          
          for (const node of mutation.removedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.matches('section, .section') || 
                  node.querySelector('section, .section')) {
                shouldRefresh = true;
                break;
              }
            }
          }
        }

        // التحقق من تغيير classes
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            mutation.target.matches('section, .section')) {
          shouldRefresh = true;
        }
      });

      if (shouldRefresh) {
        debouncedRefresh();
      }
    });

    // مراقبة body container لتشمل جميع الأقسام
    const bodyContainer = document.body;
    if (bodyContainer) {
      observer.observe(bodyContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      if (CONFIG.debug) {
        console.log('👁️ DOM observer setup for dynamic content changes');
      }
    }

    return observer;
  }

  /**
   * 🎛️ إعداد event listeners للأحداث المهمة
   */
  function setupEventListeners() {
    // إعادة تطبيق عند تغيير حجم الشاشة (مع debounce)
    const debouncedResize = debounce(applyAlternatingSectionClasses, 250);
    window.addEventListener('resize', debouncedResize);

    // إعادة تطبيق عند تغيير اللغة
    window.addEventListener('languageChanged', applyAlternatingSectionClasses);

    if (CONFIG.debug) {
      console.log('🎛️ Event listeners setup complete');
    }
  }

  /**
   * 🚀 تهيئة النظام
   */
  function initializeSystem() {
    if (CONFIG.debug) {
      console.log('🚀 Initializing alternating section backgrounds system...');
    }

    // تطبيق فوري للخلفيات
    applyAlternatingSectionClasses();
    
    // إعداد المراقبة والاستجابة للأحداث
    setupDOMObserver();
    setupEventListeners();

    // API عام للاستخدام الخارجي
    window.INTEC_SectionBackgrounds = {
      refresh: applyAlternatingSectionClasses,
      config: CONFIG,
      apply: applyAlternatingSectionClasses
    };

    if (CONFIG.debug) {
      console.log('✅ Alternating section backgrounds system initialized');
    }
  }

  // تشغيل النظام عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }

})();

// PUBLIC API للاستخدام الخارجي
// ============================================================================

/**
 * 🌐 API عام لإدارة خلفيات الأقسام
 * يمكن استخدامه من أي مكان في الموقع
 */
window.INTEC = window.INTEC || {};
window.INTEC.SectionBackgrounds = {
  /**
   * إعادة تطبيق ألوان الخلفية المتناوبة
   */
  refresh() {
    if (window.INTEC_SectionBackgrounds) {
      window.INTEC_SectionBackgrounds.refresh();
    }
  },

  /**
   * الحصول على إعدادات النظام
   */
  getConfig() {
    return window.INTEC_SectionBackgrounds?.config || null;
  },

  /**
   * تطبيق النظام يدوياً
   */
  apply() {
    if (window.INTEC_SectionBackgrounds) {
      window.INTEC_SectionBackgrounds.apply();
    }
  }
};

// ============================================================================
// CONSOLE INFO للمطورين
// ============================================================================
console.log(`
🎨 INTEC Brussels - Section Background System
═══════════════════════════════════════════════

✅ System Status: Active
🔧 Mode: Automatic alternating backgrounds  
📱 Responsive: Yes
🎭 Transitions: Enabled
🔍 Debug Mode: ${window.INTEC_SectionBackgrounds?.config?.debug ? 'ON' : 'OFF'}

💡 Usage:
   window.INTEC.SectionBackgrounds.refresh()  // إعادة تطبيق
   window.INTEC.SectionBackgrounds.apply()    // تطبيق يدوي
   window.INTEC.SectionBackgrounds.getConfig() // عرض الإعدادات

🎯 CSS Classes:
   .section--surface  // للأقسام الزوجية (فاتح)
   .section--alt      // للأقسام الفردية (داكن)

═══════════════════════════════════════════════
`);
