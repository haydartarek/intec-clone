// assets/js/main.js
// Enhanced multilingual version with robust i18n handling

document.addEventListener("DOMContentLoaded", function () {
  // =============================
  // Language Management
  // =============================
  const defaultLanguage = "nl";
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
    document.querySelectorAll("[data-lang-select]").forEach((btn) => {
      const lang = btn.dataset.lang;
      const active = lang === currentLanguage;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active);
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
    
    const elements = document.querySelectorAll("[data-animate]");
    if (elements.length === 0) return;
    
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

  // Partner Carousel (smooth, infinite, gap-safe, touch-friendly)
// =============================
function initPartnerCarousel() {
  const carousel = document.querySelector("[data-partner-carousel]");
  if (!carousel) return;

  const track = carousel.querySelector("[data-partner-track]");
  const dotsContainer = carousel.querySelector(".partner-carousel__dots");
  const prevButton = carousel.querySelector("[data-partner-prev]");
  const nextButton = carousel.querySelector("[data-partner-next]");
  const originalSlides = Array.from(track.querySelectorAll(".partner-carousel__slide"));
  if (!originalSlides.length) return;

  const REDUCED = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // 1) إنشاء كلونات للحواف لعمل حلقة سلسة
  const firstClone = originalSlides[0].cloneNode(true);
  const lastClone  = originalSlides[originalSlides.length - 1].cloneNode(true);
  firstClone.classList.add("is-clone"); firstClone.setAttribute("aria-hidden", "true");
  lastClone.classList.add("is-clone");  lastClone.setAttribute("aria-hidden", "true");
  track.insertBefore(lastClone, originalSlides[0]);
  track.appendChild(firstClone);

  const slides = Array.from(track.querySelectorAll(".partner-carousel__slide"));
  const REAL_COUNT = originalSlides.length;

  // 2) إعدادات الحركة
  const TRANSITION_MS = REDUCED ? 0 : 700;
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const HOLD_MS = REDUCED ? 2400 : 3000; // وقت البقاء على كل سلايد
  let stepX = 0;              // المسافة الفعلية بين السلايدات (تشمل أي gap)
  let currentIndex = 1;       // نبدأ بعد الكلون الخلفي مباشرةً
  let isTransitioning = false;
  let autoplayTimer = null;
  let isPaused = false;

  // 3) حساب خطوة التحريك من مواقع العناصر (يعالج وجود gap/margin)
  function computeStep() {
    if (slides.length < 2) {
      stepX = carousel.getBoundingClientRect().width; // fallback
      return;
    }
    const a = slides[0].getBoundingClientRect();
    const b = slides[1].getBoundingClientRect();
    const diff = Math.round(b.left - a.left);
    stepX = Math.abs(diff) || Math.round(a.width);
  }

  // 4) Helpers للحركة
  function setTransition(on) {
    track.style.transition = on && TRANSITION_MS > 0 ? `transform ${TRANSITION_MS}ms ${EASE}` : "none";
    track.style.willChange = on ? "transform" : "auto";
  }
  function setTransformByIndex(idx) {
    track.style.transform = `translate3d(${-idx * stepX}px, 0, 0)`;
  }

  const normalizeReal = (idx) => (idx === 0 ? REAL_COUNT - 1 : idx === REAL_COUNT + 1 ? 0 : idx - 1);

  function setActive(idx) {
    const real = normalizeReal(idx);
    slides.forEach((s, i) => {
      const on = i === idx;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
    });
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll(".partner-carousel__dot");
      dots.forEach((dot, i) => {
        const on = i === real;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-current", on ? "true" : "false");
      });
    }
    if (prevButton) prevButton.disabled = isTransitioning;
    if (nextButton) nextButton.disabled = isTransitioning;
  }

  // 5) حركة مع fallback لو ما جه transitionend
  let transitionFallbackTimer = null;
  function armTransitionFallback() {
    clearTimeout(transitionFallbackTimer);
    if (TRANSITION_MS === 0) { isTransitioning = false; return; }
    transitionFallbackTimer = setTimeout(() => {
      isTransitioning = false;
      snapIfClone();
      setActive(currentIndex);
    }, TRANSITION_MS + 80);
  }

  function goTo(idx) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex = idx;
    setTransition(true);
    setTransformByIndex(currentIndex);
    setActive(currentIndex);
    armTransitionFallback();
  }
  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  function snapIfClone() {
    // لو وقفنا على كلون، نقفز فوريًا لنظيره الحقيقي
    if (currentIndex === 0) {
      currentIndex = REAL_COUNT;
      setTransition(false);
      setTransformByIndex(currentIndex);
      void track.offsetHeight; // reflow
      setTransition(true);
    } else if (currentIndex === REAL_COUNT + 1) {
      currentIndex = 1;
      setTransition(false);
      setTransformByIndex(currentIndex);
      void track.offsetHeight;
      setTransition(true);
    }
  }

  track.addEventListener("transitionend", () => {
    clearTimeout(transitionFallbackTimer);
    isTransitioning = false;
    snapIfClone();
    setActive(currentIndex);
  });

  // 6) الأزرار
  if (nextButton) nextButton.addEventListener("click", () => { pauseAutoplay(); next(); resumeAutoplay(); });
  if (prevButton) prevButton.addEventListener("click", () => { pauseAutoplay(); prev(); resumeAutoplay(); });

  // 7) النقاط
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll(".partner-carousel__dot");
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        const idx = i + 1; // بسبب الكلون قبل أول سلايد
        if (idx !== currentIndex) {
          pauseAutoplay();
          goTo(idx);
          resumeAutoplay();
        }
      }, { passive: true });
    });
  }

  // 8) أوتوبلاي بسلسلة setTimeout (بدون انجراف)
  function schedule() {
    clearTimeout(autoplayTimer);
    if (isPaused || REDUCED) return;
    autoplayTimer = setTimeout(() => { next(); schedule(); }, HOLD_MS + TRANSITION_MS);
  }
  function pauseAutoplay() { isPaused = true; clearTimeout(autoplayTimer); }
  function resumeAutoplay() { isPaused = false; schedule(); }

  // 9) لمس/سحب سلس (بدون تعليق دائم لـ isTransitioning)
  let startX = 0, deltaX = 0, isSwiping = false;
  const MIN_PX = 60;
  const RATIO = 0.18;
  carousel.addEventListener("touchstart", (e) => {
    pauseAutoplay();
    const t = e.changedTouches[0];
    startX = t.clientX;
    deltaX = 0;
    isSwiping = true;
    setTransition(false); // drag بدون easing
  }, { passive: true });

  carousel.addEventListener("touchmove", (e) => {
    if (!isSwiping) return;
    const t = e.changedTouches[0];
    deltaX = t.clientX - startX;
    track.style.transform = `translate3d(${-(currentIndex * stepX - deltaX)}px, 0, 0)`;
  }, { passive: true });

  carousel.addEventListener("touchend", () => {
    if (!isSwiping) return;
    setTransition(true);
    const moved = Math.abs(deltaX);
    const passed = moved > Math.max(MIN_PX, stepX * RATIO);
    if (passed) {
      if (deltaX > 0) prev(); else next();
    } else {
      // ارتداد لطيف لموضعه الأصلي
      setTransformByIndex(currentIndex);
      armTransitionFallback();
    }
    isSwiping = false;
    deltaX = 0;
    resumeAutoplay();
  }, { passive: true });

  // 10) إيقاف عند إخفاء التبويب، وإعادة التشغيل عند الرجوع
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAutoplay(); else resumeAutoplay();
  });

  // 11) إعادة الحساب عند تغيير الحجم (أدقّ مع ResizeObserver)
  function relayout() {
    setTransition(false);
    computeStep();
    setTransformByIndex(currentIndex);
    void track.offsetHeight;
    setTransition(true);
  }
  computeStep();
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => relayout());
    ro.observe(carousel);
    ro.observe(track);
  } else {
    window.addEventListener("resize", relayout);
  }

  // 12) تهيئة البداية
  setTransition(false);
  setTransformByIndex(currentIndex);
  requestAnimationFrame(() => {
    setTransition(TRANSITION_MS > 0);
    setActive(currentIndex);
    if (!REDUCED) schedule();
  });

  console.log(`✅ Partner carousel ready · ${REAL_COUNT} slides · stepX=${stepX}px`);
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
// Back to Top Button
// =============================
const backToTopBtn = document.getElementById('backToTop');

if (backToTopBtn) {
  // Show/hide button on scroll
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('is-visible');
    } else {
      backToTopBtn.classList.remove('is-visible');
    }
  });

  // Scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// =============================
// Sticky Header Effect
// =============================
const siteHeader = document.querySelector('.site-header');

if (siteHeader) {
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  });
}
