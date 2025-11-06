// ============================================================================
// assets/js/main.js
// Enhanced multilingual core with safe i18n initialization, accessibility,
// and smooth scrolling system (Stable 2025 Edition)
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // --------------------------------------------------------------------------
  // LANGUAGE MANAGEMENT SYSTEM
  // --------------------------------------------------------------------------
  const DEFAULT_LANG = "en";
  const MAX_LOAD_ATTEMPTS = 20;
  const RETRY_DELAY = 50;
  let currentLanguage = localStorage.getItem("intec-language") || DEFAULT_LANG;
  let loadAttempts = 0;

  /**
   * Robust DevTools Detection
   * Adds `devtools-open` to <body> for debugging hover lag or visual shifts.
   */
  (() => {
    const body = document.body;
    if (!body) return;

    const THRESHOLD = 160;
    let devtoolsOpen = false;

    const detectDevTools = () => {
      const widthDelta = Math.abs(window.outerWidth - window.innerWidth);
      const heightDelta = Math.abs(window.outerHeight - window.innerHeight);
      return widthDelta > THRESHOLD || heightDelta > THRESHOLD;
    };

    const update = () => {
      const detected = detectDevTools();
      if (detected !== devtoolsOpen) {
        devtoolsOpen = detected;
        body.classList.toggle("devtools-open", detected);
      }
    };

    const debouncedUpdate = () => window.requestAnimationFrame(update);

    ["resize", "orientationchange"].forEach(evt =>
      window.addEventListener(evt, debouncedUpdate, { passive: true })
    );

    window.addEventListener("keydown", e => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["C", "I", "J"].includes(e.key.toUpperCase()))
      ) {
        setTimeout(update, 400);
      }
    });

    setInterval(update, 2000);
    update();
  })();

  // --------------------------------------------------------------------------
  // LANGUAGE LOADING & TRANSLATION
  // --------------------------------------------------------------------------
  function loadLanguage(lang) {
    if (!window.i18n || !window.i18n[lang]) {
      if (loadAttempts++ < MAX_LOAD_ATTEMPTS) {
        console.warn(`⚙ Waiting for language '${lang}' to load... (${loadAttempts})`);
        return setTimeout(() => loadLanguage(lang), RETRY_DELAY);
      }
      console.error(`❌ Failed to load '${lang}' after ${MAX_LOAD_ATTEMPTS} attempts.`);
      return;
    }

    // Success
    loadAttempts = 0;
    currentLanguage = lang;
    localStorage.setItem("intec-language", lang);
    document.documentElement.lang = lang;
    console.info(`🌐 Language applied: ${lang}`);

    applyTranslations();
    updateLanguageButtons();

    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
  }

  function applyTranslations() {
    const dict = window.i18n?.[currentLanguage] || {};
    const missing = new Set();
    let translated = 0;

    const translate = (selector, attr, setAttr = false) => {
      document.querySelectorAll(selector).forEach(el => {
        const key = el.getAttribute(attr);
        const text = dict[key];
        if (text) {
          setAttr
            ? el.setAttribute(attr.replace("data-i18n-", ""), text)
            : el[el.hasAttribute("data-i18n-allow-html") ? "innerHTML" : "textContent"] = text;
          translated++;
        } else {
          if (!setAttr && !el.hasAttribute("data-i18n-allow-html")) el.textContent = key;
          if (setAttr) el.setAttribute(attr.replace("data-i18n-", ""), key);
          missing.add(key);
        }
      });
    };

    translate("[data-i18n]", "data-i18n");
    translate("[data-i18n-placeholder]", "data-i18n-placeholder", true);
    translate("[data-i18n-aria-label]", "data-i18n-aria-label", true);

    console.info(`✅ ${translated} elements translated`);
    if (missing.size) console.warn("⚠ Missing translations:", [...missing]);
  }

  function updateLanguageButtons() {
    document.querySelectorAll("[data-lang-select]").forEach(btn => {
      const lang = btn.dataset.lang;
      const active = lang === currentLanguage;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active);
      btn.setAttribute("aria-current", active ? "true" : "false");

      const switcher = btn.closest(".language-switch");
      if (switcher) switcher.dataset.activeLang = active ? lang : "";
    });
  }

  // Language Switchers
  document.querySelectorAll("[data-lang-select]").forEach(btn => {
    btn.addEventListener("click", () => {
      const newLang = btn.dataset.lang;
      if (newLang !== currentLanguage) loadLanguage(newLang);
    });
  });

  // Utility for resetting
  window.resetLanguage = () => {
    localStorage.removeItem("intec-language");
    loadLanguage(DEFAULT_LANG);
    console.info("🔁 Language reset to English");
  };

  // Initial language load
  loadLanguage(currentLanguage);

  // --------------------------------------------------------------------------
  // SMOOTH SCROLL SYSTEM (header-aware)
  // --------------------------------------------------------------------------
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const getHeaderOffset = () => (document.querySelector(".site-header")?.offsetHeight || 0) + 16;

  function smoothScrollTo(targetY) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const duration = 650;
    const startTime = performance.now();

    const step = now => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
      anchor.addEventListener("click", e => {
        const hash = anchor.getAttribute("href");
        const target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        const targetY = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
        smoothScrollTo(targetY);
        history.replaceState(null, "", hash);
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      });
    });
  }
  setupSmoothScroll();
  // Expose for callers outside this DOMContentLoaded closure. Some
  // initializers call setupSmoothScroll() from the global scope, so
  // attach it to window to avoid ReferenceError when invoked later.
  try {
    window.setupSmoothScroll = setupSmoothScroll;
  } catch (e) {
    /* ignore */
  }

  // --------------------------------------------------------------------------
  // COURSE COUNTDOWN BADGES
  // --------------------------------------------------------------------------
  const DAY_MS = 86400000;
  const CLASS = "course-date__countdown";
  const STATES = [`${CLASS}--soon`, `${CLASS}--today`, `${CLASS}--past`];

  const MESSAGES = {
    en: {
      inMany: d => `Starts in ${d} days`,
      inOne: () => "Starts in 1 day",
      today: "Starts today",
      pastMany: d => `Started ${d} days ago`,
      pastOne: () => "Started 1 day ago",
    },
    nl: {
      inMany: d => `Start over ${d} dagen`,
      inOne: () => "Start over 1 dag",
      today: "Start vandaag",
      pastMany: d => `Gestart ${d} dagen geleden`,
      pastOne: () => "Gestart 1 dag geleden",
    },
  };

  const getLang = () =>
    typeof currentLanguage === "string"
      ? currentLanguage
      : document.documentElement.lang.slice(0, 2) || "en";

  function formatCountdown(diff, lang) {
    const msg = MESSAGES[lang] || MESSAGES.en;
    if (diff > 0) return diff === 1 ? msg.inOne() : msg.inMany(diff);
    if (diff === 0) return msg.today;
    const past = Math.abs(diff);
    return past === 1 ? msg.pastOne() : msg.pastMany(past);
  }

  function updateCountdowns() {
    const lang = getLang();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    document.querySelectorAll("[data-start-date]").forEach(item => {
      const dateStr = item.dataset.startDate;
      if (!dateStr) return;

      const targetDate = new Date(dateStr);
      if (isNaN(targetDate)) return;

      targetDate.setHours(0, 0, 0, 0);
      const diff = Math.round((targetDate - today) / DAY_MS);
      const message = formatCountdown(diff, lang);
      if (!message) return;

      let badge = item.querySelector("[data-countdown]");
      if (!badge) {
        badge = document.createElement("span");
        badge.dataset.countdown = "";
        badge.className = CLASS;
        badge.role = "status";
        badge.ariaLive = "polite";
        item.append(" ", badge);
      }
      badge.textContent = message;

      STATES.forEach(c => badge.classList.remove(c));
      if (diff === 0) badge.classList.add(`${CLASS}--today`);
      else if (diff < 0) badge.classList.add(`${CLASS}--past`);
      else if (diff <= 30) badge.classList.add(`${CLASS}--soon`);
    });
  }

  let countdownTimer;
  function startCountdown() {
    updateCountdowns();
    clearInterval(countdownTimer);
    countdownTimer = setInterval(updateCountdowns, 3600000); // 1 hour
  }

  startCountdown();
  window.addEventListener("languageChanged", updateCountdowns);
});
// ============================================================================
// Sticky Header, Mobile Nav, Lazy Images, and Scroll Animations
// (Stable 2025 Professional Edition)
// ============================================================================

/* ---------------------------------------------------------------------------
   STICKY HEADER WITH SMART HIDE/SHOW
--------------------------------------------------------------------------- */
function setupStickyHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateHeaderState = () => {
    const y = window.scrollY;
    header.classList.toggle("is-condensed", y > 40);
    if (y > 120 && y > lastScrollY) header.classList.add("is-hidden");
    else header.classList.remove("is-hidden");
    lastScrollY = y;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    },
    { passive: true }
  );
}

/* ---------------------------------------------------------------------------
   MOBILE NAVIGATION TOGGLE
--------------------------------------------------------------------------- */
function setupMobileNav() {
  const toggles = document.querySelectorAll("[data-nav-toggle]");
  if (!toggles.length) return;

  toggles.forEach(btn => {
    const target = document.querySelector(btn.dataset.navToggle);
    if (!target) return;

    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      btn.classList.toggle("is-active");
      target.classList.toggle("is-open");
      document.body.classList.toggle("nav-is-open");
    });
  });

  // Close when clicking outside
  document.addEventListener("click", e => {
    const nav = document.querySelector(".primary-nav");
    const toggle = document.querySelector("[data-nav-toggle]");
    if (
      nav &&
      toggle &&
      nav.classList.contains("is-open") &&
      !nav.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      toggle.click();
    }
  });
}

/* ---------------------------------------------------------------------------
   LAZY IMAGE OPTIMIZATION
--------------------------------------------------------------------------- */
function optimizeLazyImages() {
  document.querySelectorAll("img").forEach(img => {
    const isCritical = img.dataset.critical === "true";
    const alreadyLazy = img.hasAttribute("loading");

    img.setAttribute("loading", isCritical ? "eager" : alreadyLazy ? img.loading : "lazy");
    img.setAttribute("decoding", "async");

    if (isCritical) img.setAttribute("fetchpriority", "high");
  });
}

/* ---------------------------------------------------------------------------
   SCROLL ANIMATION SYSTEM — IntersectionObserver API
--------------------------------------------------------------------------- */
const animationTargets = [
  { selector: ".hero__content", animation: "slide-right" },
  { selector: ".hero__visual", animation: "slide-left" },
  { selector: ".hero-card, .section, .section-heading, .stats-item, .program-card, .course-card, .tip-card, .faq-item, .highlight-box, .logo-card, .cta-band, .timeline li", animation: "fade-up" },
];

function ensureAnimationAttributes() {
  animationTargets.forEach(({ selector, animation }) => {
    document.querySelectorAll(selector).forEach(el => {
      if (!el.dataset.animate) el.dataset.animate = animation;
    });
  });
}

function setupScrollAnimations() {
  ensureAnimationAttributes();

  const animatedEls = document.querySelectorAll("[data-animate]");
  if (!animatedEls.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );

  animatedEls.forEach(el => observer.observe(el));
  console.log(`🎬 Observing ${animatedEls.length} animated elements`);

  // Secondary observer for elements using .fade-up directly
  const fadeUpEls = document.querySelectorAll(".fade-up");
  if (fadeUpEls.length) {
    const fadeUpObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            fadeUpObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    fadeUpEls.forEach(el => fadeUpObserver.observe(el));
    console.log(`🎞 Observing ${fadeUpEls.length} fade-up elements`);
  }

  // Floating CTA button (appears after 400px scroll)
  const floatingCta = document.querySelector(".floating-cta");
  if (floatingCta) {
    let ticking = false;
    const updateCta = () => {
      floatingCta.classList.toggle("is-visible", window.scrollY > 400);
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(updateCta);
          ticking = true;
        }
      },
      { passive: true }
    );
    console.log("💡 Floating CTA initialized");
  }
}

/* ---------------------------------------------------------------------------
   INITIALIZATION WRAPPER
--------------------------------------------------------------------------- */
function initPageEnhancements() {
  optimizeLazyImages();
  setupStickyHeader();
  setupMobileNav();
  setupScrollAnimations();
  console.log("✅ UI Enhancements Initialized");
}

// Initialize after DOM ready (with minimal blocking)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageEnhancements);
} else {
  initPageEnhancements();
}

// ============================================================================
// COUNTER ANIMATIONS + SMART FORM VALIDATION
// (Stable, Accessible, and Performance-Optimized)
// ============================================================================

/* ---------------------------------------------------------------------------
   COUNTER ANIMATIONS
--------------------------------------------------------------------------- */
function setupCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting && !el.classList.contains("counted")) {
          startCounter(el);
          el.classList.add("counted");
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach(el => {
    el.textContent = "0";
    observer.observe(el);
  });
}

function startCounter(el) {
  const target = parseFloat(el.dataset.target) || 0;
  const duration = parseInt(el.dataset.duration) || 1800;
  const decimals = target % 1 !== 0;
  const startTime = performance.now();

  const animate = now => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic inline
    const value = target * eased;

    el.textContent = decimals ? value.toFixed(1) : Math.floor(value);
    if (progress < 1) requestAnimationFrame(animate);
    else el.textContent = decimals ? target.toFixed(1) : target;
  };
  requestAnimationFrame(animate);
}

/* ---------------------------------------------------------------------------
   UNIVERSAL FORM VALIDATION SYSTEM
--------------------------------------------------------------------------- */
function setupValidation(form) {
  if (!form) return;

  const dict = () => window.i18n?.[window.currentLanguage || "en"] || {};

  const rules = {
    "full-name": {
      required: true,
      minLength: 5,
      maxLength: 25,
      pattern: /^[A-Za-zÀ-ÿ' -]{2,}\s[A-Za-zÀ-ÿ' -]{2,}$/,
      errorKey: "register.validation.fullName",
      minErrorKey: "register.validation.fullNameMin",
    },
    gender: { required: true, errorKey: "register.validation.gender" },
    email: {
      required: true,
      minLength: 6,
      maxLength: 50,
      pattern: /^[\\w.-]+@[a-zA-Z\\d.-]+\\.[a-zA-Z]{2,}$/,
      errorKey: "register.validation.email",
    },
    phone: {
      required: true,
      pattern: /^0\\d{8,9}$/,
      numbersOnly: true,
      errorKey: "register.validation.phone",
      numbersErrorKey: "register.validation.phoneNumbers",
    },
    "national-number": {
      required: true,
      exactLength: 11,
      numbersOnly: true,
      pattern: /^\\d{11}$/,
      errorKey: "register.validation.national",
    },
    address: {
      required: true,
      minLength: 5,
      maxLength: 40,
      errorKey: "register.validation.address",
    },
    postcode: {
      required: true,
      exactLength: 4,
      pattern: /^[1-9][0-9]{3}$/,
      errorKey: "register.validation.postcode",
    },
    city: {
      required: true,
      minLength: 2,
      maxLength: 30,
      pattern: /^[A-Za-zÀ-ÿ' -]{2,30}$/,
      errorKey: "register.validation.city",
    },
    course: { required: true, errorKey: "register.validation.course" },
    message: {
      required: false,
      maxLength: 500,
      errorKey: "register.validation.messageLength",
    },
  };

  // --- Utilities ------------------------------------------------------------
  const showError = (input, key) => {
    input.classList.add("has-error");
    const box = input.parentNode.querySelector(".form-error");
    if (box) {
      const text = dict()[key] || key;
      box.textContent = text;
      box.style.display = "block";
    }
  };

  const hideError = input => {
    input.classList.remove("has-error");
    const box = input.parentNode.querySelector(".form-error");
    if (box) {
      box.style.display = "none";
      box.textContent = "";
    }
  };

  const validate = input => {
    const name = input.name;
    const value = input.value.trim();
    const raw = input.value;
    const r = rules[name];
    if (!r) return { ok: true };

    if (r.required && !value) return { ok: false, key: r.errorKey };
    if (!r.required && !value) return { ok: true };
    if (r.numbersOnly && !/^\\d+$/.test(value.replace(/[\\s.-]/g, "")))
      return { ok: false, key: r.numbersErrorKey || r.errorKey };
    if (r.minLength && raw.length < r.minLength)
      return { ok: false, key: r.minErrorKey || r.errorKey };
    if (r.exactLength && value.replace(/[\\s.-]/g, "").length !== r.exactLength)
      return { ok: false, key: r.errorKey };
    if (r.pattern && !r.pattern.test(value.replace(/[\\s.-]/g, "")))
      return { ok: false, key: r.errorKey };
    if (input.tagName === "SELECT" && (!value || value === ""))
      return { ok: false, key: r.errorKey };
    return { ok: true };
  };

  // --- Add error placeholders once -----------------------------------------
  form.querySelectorAll("input, select, textarea").forEach(el => {
    if (!el.parentNode.querySelector(".form-error")) {
      const box = document.createElement("div");
      box.className = "form-error";
      el.parentNode.appendChild(box);
    }
  });

  // --- Submit Handler -------------------------------------------------------
  form.addEventListener("submit", e => {
    e.preventDefault();
    let valid = true;
    let first = null;
    form.querySelectorAll(".form-error").forEach(box => (box.style.display = "none"));

    form.querySelectorAll("input, select, textarea").forEach(el => {
      const name = el.name;
      if (name === "message" && !el.value.trim() && !el.required) return;
      const res = validate(el);
      if (!res.ok) {
        showError(el, res.key);
        valid = false;
        if (!first) first = el;
      } else hideError(el);
    });

    if (!valid) {
      first?.focus();
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      console.warn("⚠ Form validation failed");
      return;
    }

    // Success
    console.log("✅ Form validated successfully");
    let msg = form.querySelector(".form-success");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "form-success";
      msg.innerHTML = `
        <div class="form-success__title" data-i18n="register.success.title">
          Bedankt voor uw voorinschrijving!
        </div>
        <p class="form-success__message" data-i18n="register.success.message">
          U ontvangt binnen drie werkdagen een bevestiging per e-mail.
        </p>`;
      const submit = form.querySelector('button[type="submit"]');
      submit ? submit.insertAdjacentElement("afterend", msg) : form.appendChild(msg);
    }

    const d = dict();
    msg.querySelector("[data-i18n='register.success.title']").textContent =
      d["register.success.title"] || "Thank you!";
    msg.querySelector("[data-i18n='register.success.message']").textContent =
      d["register.success.message"] || "We will contact you soon.";

    msg.classList.add("is-visible");
    msg.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      form.reset();
      msg.classList.remove("is-visible");
    }, 5000);
  });

  // --- Real-time validation -------------------------------------------------
  form.querySelectorAll("input, select, textarea").forEach(el => {
    const r = rules[el.name];
    if (!r) return;

    if (r.maxLength) {
      el.addEventListener("input", () => {
        if (el.value.length > r.maxLength)
          el.value = el.value.slice(0, r.maxLength);
      });
    }

    el.addEventListener("input", () => {
      const res = validate(el);
      res.ok ? hideError(el) : showError(el, res.key);
    });

    el.addEventListener("blur", () => {
      const res = validate(el);
      res.ok ? hideError(el) : showError(el, res.key);
    });

    if (el.tagName === "SELECT") {
      el.addEventListener("change", () => {
        const res = validate(el);
        res.ok ? hideError(el) : showError(el, res.key);
      });
    }
  });
}

// ---------------------------------------------------------------------------
// INITIALIZATION
// ---------------------------------------------------------------------------
setupCounters();
setupValidation(document.querySelector("#registration-form"));
setupValidation(document.querySelector("#contact-form"));
setupValidation(document.querySelector("#partner-login-form"));

  // =============================
// Partner Carousel (Stable 2025 Edition)
// =============================
function initPartnerCarousel() {
  const carousel = document.querySelector("[data-carousel='partners']");
  if (!carousel || carousel.__carouselInit) return;
  carousel.__carouselInit = true;

  const track = carousel.querySelector("[data-partner-track]");
  if (!track) {
    console.warn("⚠️ Partner carousel: missing track element.");
    return;
  }

  // Remove any server-rendered clone slides to avoid double cloning.
  track.querySelectorAll(".partner-carousel__slide.is-clone").forEach(clone => clone.remove());

  const slides = Array.from(track.querySelectorAll(".partner-carousel__slide"));
  if (!slides.length) {
    console.warn("⚠️ Partner carousel: no slides found.");
    return;
  }

  const dotsContainer = carousel.querySelector(".partner-carousel__dots");
  const prevBtn = carousel.querySelector("[data-partner-prev]");
  const nextBtn = carousel.querySelector("[data-partner-next]");

  const STATE = { IDLE: 0, ANIMATING: 1, DRAGGING: 2 };
  let state = STATE.IDLE;
  let currentIndex = 1;
  let stepX = 0;
  let autoplayTimer = null;
  let resizeRAF = null;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TRANSITION = REDUCED ? 0 : 800;
  const EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
  const AUTOPLAY = REDUCED ? 0 : 6000;
  const SWIPE_THRESHOLD = 0.2;
  const MIN_SWIPE = 50;

  // Clone for infinite loop
  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[slides.length - 1].cloneNode(true);
  [firstClone, lastClone].forEach(c => {
    c.classList.add("is-clone");
    c.setAttribute("aria-hidden", "true");
  });
  track.insertBefore(lastClone, slides[0]);
  track.appendChild(firstClone);

  const allSlides = Array.from(track.querySelectorAll(".partner-carousel__slide"));
  const REAL_COUNT = slides.length;

  function computeStep() {
    const a = allSlides[0].getBoundingClientRect();
    const b = allSlides[1].getBoundingClientRect();
    stepX = Math.abs(b.left - a.left) || a.width;
  }

  function setTransform(index, transition = true) {
    const x = -index * stepX;
    track.style.transition = transition && TRANSITION > 0 ? `transform ${TRANSITION}ms ${EASE}` : "none";
    track.style.transform = `translate3d(${x}px,0,0)`;
    track.style.willChange = transition ? "transform" : "auto";
  }

  function snap() {
    if (currentIndex === 0) {
      currentIndex = REAL_COUNT;
      setTransform(currentIndex, false);
    } else if (currentIndex === REAL_COUNT + 1) {
      currentIndex = 1;
      setTransform(currentIndex, false);
    }
  }

  function updateUI() {
    const realIndex = currentIndex === 0 ? REAL_COUNT - 1 :
                      currentIndex === REAL_COUNT + 1 ? 0 :
                      currentIndex - 1;

    allSlides.forEach((s, i) => {
      const active = i === currentIndex;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-hidden", active ? "false" : "true");
    });

    dotsContainer?.querySelectorAll("[data-partner-dot]").forEach((dot, i) => {
      const active = i === realIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  function goTo(newIndex) {
    if (state === STATE.ANIMATING) return;
    state = STATE.ANIMATING;
    currentIndex = newIndex;
    setTransform(currentIndex, true);
    updateUI();

    setTimeout(() => {
      state = STATE.IDLE;
      snap();
      updateUI();
    }, TRANSITION + 50);
  }

  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);
  const goToDot = i => goTo(i + 1);

  function autoplay() {
    if (AUTOPLAY === 0) return;
    clearTimeout(autoplayTimer);
    autoplayTimer = setTimeout(() => {
      next();
      autoplay();
    }, AUTOPLAY);
  }

  // Buttons
  nextBtn?.addEventListener("click", () => { clearTimeout(autoplayTimer); next(); autoplay(); });
  prevBtn?.addEventListener("click", () => { clearTimeout(autoplayTimer); prev(); autoplay(); });

  // Dots
  dotsContainer?.addEventListener("click", e => {
    const dot = e.target.closest("[data-partner-dot]");
    if (!dot) return;
    const i = parseInt(dot.dataset.partnerDot, 10);
    if (!isNaN(i) && i !== currentIndex - 1) { clearTimeout(autoplayTimer); goToDot(i); autoplay(); }
  });

  // Drag / Touch
  let startX = null, deltaX = 0;
  const DRAG_GUARD_SELECTOR = "[data-partner-prev], [data-partner-next], .partner-carousel__dot";
  const onStart = x => {
    if (state === STATE.ANIMATING) return;
    state = STATE.DRAGGING; startX = x; deltaX = 0; clearTimeout(autoplayTimer);
    setTransform(currentIndex, false);
  };
  const onMove = x => {
    if (state !== STATE.DRAGGING || startX == null) return;
    deltaX = x - startX;
    track.style.transform = `translate3d(${-(currentIndex * stepX) + deltaX}px,0,0)`;
  };
  const onEnd = () => {
    if (state !== STATE.DRAGGING) return;
    const threshold = Math.max(MIN_SWIPE, stepX * SWIPE_THRESHOLD);
    if (Math.abs(deltaX) > threshold) (deltaX > 0 ? prev() : next());
    else setTransform(currentIndex, true);
    startX = null; deltaX = 0; autoplay(); state = STATE.IDLE;
  };

  carousel.addEventListener("touchstart", e => {
    if (e.target.closest(DRAG_GUARD_SELECTOR)) return;
    onStart(e.touches[0].clientX);
  }, { passive: true });
  carousel.addEventListener("touchmove", e => onMove(e.touches[0].clientX), { passive: true });
  carousel.addEventListener("touchend", onEnd);

  carousel.addEventListener("mousedown", e => {
    if (e.button !== 0) return;
    if (e.target.closest(DRAG_GUARD_SELECTOR)) return;
    e.preventDefault();
    onStart(e.clientX);
    const move = ev => onMove(ev.clientX);
    const up = () => { onEnd(); document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });

  // Keyboard navigation
  carousel.setAttribute("tabindex", "0");
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-label", "Partner logos carousel");
  carousel.addEventListener("keydown", e => {
    if (state === STATE.ANIMATING) return;
    switch (e.key) {
      case "ArrowLeft": prev(); break;
      case "ArrowRight": next(); break;
      case "Home": goToDot(0); break;
      case "End": goToDot(REAL_COUNT - 1); break;
    }
    clearTimeout(autoplayTimer); autoplay();
  });

  // Visibility pause
  document.addEventListener("visibilitychange", () => {
    document.hidden ? clearTimeout(autoplayTimer) : autoplay();
  });
  carousel.addEventListener("mouseenter", () => clearTimeout(autoplayTimer));
  carousel.addEventListener("mouseleave", autoplay);

  // Resize handler
  const onResize = () => {
    if (resizeRAF) return;
    resizeRAF = requestAnimationFrame(() => {
      computeStep();
      setTransform(currentIndex, false);
      resizeRAF = null;
    });
  };
  window.addEventListener("resize", onResize);

  // Init
  computeStep();
  setTransform(currentIndex, false);
  updateUI();
  if (!REDUCED) autoplay();
  console.log(`✅ Partner carousel ready: ${REAL_COUNT} slides (${stepX}px each)`);
}

// ====================================================
// Registration Form Validation (Stable 2025 Edition)
// ====================================================
function initRegistrationForm() {
  const form = document.querySelector('.contact-form--register');
  if (!form) return;

  // Dutch error messages
  const errorMessages = {
    'full-name': 'Vul je volledige naam in.',
    'email': 'Vul een geldig e-mailadres in.',
    'phone': 'Vul je telefoonnummer in.',
    'national-number': 'Vul een geldig rijksregisternummer in.',
    'postcode': 'Vul je postcode in.',
    'city': 'Vul je gemeente of stad in.',
    'address': 'Vul je adres in.',
    'course': 'Kies een opleiding.',
    'gender': 'Kies een geslacht.',
    'default': 'Dit veld is verplicht.'
  };

  // Unified validator
  function validateField(field) {
    const name = field.getAttribute('name');
    const errorEl = document.getElementById(`${name}-error`);
    if (!errorEl) return true;

    let valid = true;
    let msg = '';

    // Required validation
    if (field.hasAttribute('required')) {
      if (field.type === 'radio') {
        const radios = form.querySelectorAll(`input[name="${name}"]`);
        valid = Array.from(radios).some(r => r.checked);
      } else if (field.tagName === 'SELECT') {
        valid = field.value.trim() !== '';
      } else {
        valid = field.value.trim() !== '';
      }
      if (!valid) msg = errorMessages[name] || errorMessages.default;
    }

    // Email pattern check
    if (valid && field.type === 'email' && field.value.trim() !== '') {
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      valid = pattern.test(field.value);
      if (!valid) msg = errorMessages['email'];
    }

    // Update UI state
    field.setAttribute('aria-invalid', valid ? 'false' : 'true');
    field.classList.toggle('has-error', !valid);
    field.classList.toggle('is-valid', valid);

    if (errorEl) errorEl.textContent = valid ? '' : msg;

    return valid;
  }

  // Validate entire form
  function validateForm() {
    let validForm = true;
    const all = form.querySelectorAll('input[required], select[required], textarea[required]');
    all.forEach(input => {
      if (!validateField(input)) validForm = false;
    });
    return validForm;
  }

  // Attach listeners
  const fields = form.querySelectorAll('input, select, textarea');

  fields.forEach(f => {
    f.addEventListener('blur', () => {
      if (f.value.trim() !== '' || f.classList.contains('has-error')) {
        validateField(f);
      }
    });
    f.addEventListener('input', () => {
      const errEl = document.getElementById(`${f.name}-error`);
      if (errEl && errEl.textContent !== '') validateField(f);
    });
  });

  // Radio buttons revalidate on change
  form.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => validateField(radio));
  });

  // Ctrl + Enter submits the form
  const msgField = form.querySelector('textarea[name="message"]');
  if (msgField) {
    msgField.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }

  // Handle form submission
  form.addEventListener('submit', e => {
    if (!validateForm()) {
      e.preventDefault();
      const firstError = form.querySelector('.has-error');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  });

  console.log('✅ Registration form validation initialized successfully');
}


  // =============================
  // Update Footer Year
  // =============================
  // Intake Prep Accordion (Redesigned Section)
  // =============================
  
  function initIntakePrepAccordion() {
    const accordionItems = document.querySelectorAll('.page--inschrijven .accordion-item');

    console.debug('? initIntakePrepAccordion: found', accordionItems.length, 'items');

    if (accordionItems.length === 0) return;
    
    accordionItems.forEach((item, idx) => {
      const header = item.querySelector('.accordion-header');
      const body = item.querySelector('.accordion-body');

      if (!header || !body) return;

      // Ensure header is focusable and add debug logging
      header.tabIndex = header.tabIndex || 0;

      const closeBody = (elBody, elHeader) => {
        elHeader.setAttribute('aria-expanded', 'false');
        elBody.setAttribute('aria-hidden', 'true');
        elBody.classList.remove('is-open');
        elHeader.classList.remove('is-open');

        // Prepare for collapse: ensure visible and measure current height
        try { elBody.style.display = elBody.style.display || 'block'; } catch (e) {}
        elBody.style.overflow = 'hidden';
        const startH = elBody.scrollHeight || elBody.getBoundingClientRect().height || 0;
        elBody.style.maxHeight = startH + 'px';
        // force reflow
        // eslint-disable-next-line no-unused-expressions
        elBody.offsetHeight;

        // Transition to 0 to collapse
        requestAnimationFrame(() => {
          elBody.style.opacity = '0';
          elBody.style.maxHeight = '0';
        });

        const onEnd = (ev) => {
          if (ev && ev.propertyName && ev.propertyName !== 'max-height' && ev.propertyName !== 'opacity') return;
          elBody.removeEventListener('transitionend', onEnd);
          try { elBody.style.display = 'none'; } catch (e) {}
          elBody.style.maxHeight = '0';
          elBody.style.overflow = '';
        };
        elBody.addEventListener('transitionend', onEnd);
      };

      const openBody = (elBody, elHeader) => {
        // mark opened
        elHeader.setAttribute('aria-expanded', 'true');
        elBody.setAttribute('aria-hidden', 'false');
        elBody.classList.add('is-open');
        elHeader.classList.add('is-open');

        // Make visible and prepare for animation
        try { elBody.style.display = 'block'; } catch (e) {}
        elBody.style.overflow = 'hidden';
        elBody.style.opacity = '0';
        elBody.style.maxHeight = '0';

        // force reflow then expand to measured height
        // eslint-disable-next-line no-unused-expressions
        elBody.offsetHeight;

        const measured = elBody.scrollHeight || (elBody.getBoundingClientRect && elBody.getBoundingClientRect().height) || 0;
        console.debug(`? accordion open idx=${idx} measuredHeight=`, measured, 'computed before open:', window.getComputedStyle(elBody).display, window.getComputedStyle(elBody).maxHeight, window.getComputedStyle(elBody).opacity);

        requestAnimationFrame(() => {
          elBody.style.maxHeight = measured + 'px';
          elBody.style.opacity = '1';
        });

        const onTransitionEnd = (ev) => {
          if (ev && ev.propertyName && ev.propertyName !== 'max-height' && ev.propertyName !== 'opacity') return;
          elBody.removeEventListener('transitionend', onTransitionEnd);
          // clear maxHeight so content can grow naturally
          if (elHeader.getAttribute('aria-expanded') === 'true') {
            try { elBody.style.maxHeight = 'none'; } catch (e) {}
            elBody.style.overflow = '';
          }
        };
        elBody.addEventListener('transitionend', onTransitionEnd);
      };

      const toggle = (ev) => {
        console.debug(`? accordion click idx=${idx}`, { header, ev });
        const isExpanded = header.getAttribute('aria-expanded') === 'true';

        // Collapse others first
        accordionItems.forEach(otherItem => {
          if (otherItem === item) return;
          const otherHeader = otherItem.querySelector('.accordion-header');
          const otherBody = otherItem.querySelector('.accordion-body');
          if (!otherHeader || !otherBody) return;
          closeBody(otherBody, otherHeader);
        });

        // Toggle this one
        if (isExpanded) closeBody(body, header);
        else openBody(body, header);
      };

      // Attach to header and inner clickable regions (icon/text) in case clicks are intercepted
      header.addEventListener('click', toggle);
      const innerIcon = header.querySelector('.accordion-header__icon');
      const innerText = header.querySelector('.accordion-header__text');
      if (innerIcon) innerIcon.addEventListener('click', toggle);
      if (innerText) innerText.addEventListener('click', toggle);

      // Keyboard support: toggle on Enter or Space
      header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle(e);
        }
      });

      // Initialize starting open state
      if (header.getAttribute('aria-expanded') === 'true') {
        // immediate open without animation
        try { body.style.display = 'block'; } catch (e) {}
        body.style.overflow = '';
        body.style.maxHeight = 'none';
        body.style.opacity = '1';
        body.classList.add('is-open');
        header.classList.add('is-open');
      } else {
        // ensure closed state
        try { body.style.display = 'none'; } catch (e) {}
        body.style.maxHeight = '0';
        body.setAttribute('aria-hidden', 'true');
        body.style.opacity = '0';
      }
    });
    
    if (window.INTEC?.debug) {
      console.log(`? Intake prep accordion initialized (${accordionItems.length} items)`);
    }
  }

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
  
  console.log("?? Initializing INTEC Brussels website...");
  
  // Performance monitoring
  const initStart = performance.now();
  
  try {
  optimizeLazyImages();
  setupStickyHeader();
  setupMobileNav();
  setupSmoothScroll();
  setupScrollAnimations();
  setupCounters();
  // Correct countdown starter: startCountdown is defined above. An incorrect
  // call to startCourseCountdownTimer() caused a ReferenceError and prevented
  // subsequent initializers (like initIntakePrepAccordion) from running.
  startCountdown();
    initPartnerCarousel();
    if (typeof enhanceAccordions === "function") {
      enhanceAccordions();
    }
    if (typeof initFAQAccordion === "function") {
      initFAQAccordion();
    }
    initIntakePrepAccordion();
    initRegistrationForm();
    updateFooterYear();
    
    const initEnd = performance.now();
    console.log(`? All features initialized in ${(initEnd - initStart).toFixed(2)}ms`);
  } catch (error) {
    console.error("? Initialization error:", error);
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

// =============================
// Service Worker Registration (Optional)
// =============================

if ("serviceWorker" in navigator && window.location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("? Service Worker registered:", registration.scope);
      })
      .catch((error) => {
        console.log("?? Service Worker registration skipped:", error);
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

(function initSectionBackgroundSystem() {
  'use strict';
  
  const CONFIG = {
    // ??? selectors ???????? - ????? ????? ???? ???????
    mainSelector: 'section, .section',
    
    // ??????? ????????? ?? ??????
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
    
    useClasses: true,
    
    evenClass: 'section--surface',
    oddClass: 'section--alt',
    
    evenBackground: 'var(--color-bg-surface)',
    oddBackground: 'var(--color-bg-section)',
    
    enableTransitions: true,
    
    debug: false
  };

  /**
   * @param {Element} section 
   * @returns {boolean}
   */
  function isExcludedSection(section) {
    return CONFIG.excludeClasses.some(className => 
      section.classList.contains(className)
    );
  }

  /**
   * @param {Element} section 
   * @param {number} visualIndex
   */
  function applySectionBackground(section, visualIndex) {
    if (isExcludedSection(section)) {
      if (CONFIG.debug) {
        console.log(`?? Skipping excluded section:`, section.className);
      }
      return;
    }

    const isEven = visualIndex % 2 === 0;
    
    if (CONFIG.useClasses) {
      section.classList.remove(CONFIG.evenClass, CONFIG.oddClass);
      
      const targetClass = isEven ? CONFIG.evenClass : CONFIG.oddClass;
      section.classList.add(targetClass);
      
      if (CONFIG.debug) {
        console.log(`? Applied class "${targetClass}" to section ${visualIndex}`);
      }
    } else {
      // inline style ?? fallback
      const targetBackground = isEven ? CONFIG.evenBackground : CONFIG.oddBackground;
      section.style.background = targetBackground;
      
      if (CONFIG.debug) {
        console.log(`? Applied background "${targetBackground}" to section ${visualIndex}`);
      }
    }
  }

  function applySectionBackgrounds() {
    const sections = document.querySelectorAll(CONFIG.mainSelector);
    
    if (sections.length === 0) {
      if (CONFIG.debug) {
        console.warn('?? No sections found with selector:', CONFIG.mainSelector);
      }
      return;
    }

    let visualIndex = 0;
    let processedCount = 0;

    sections.forEach((section, absoluteIndex) => {
      if (isExcludedSection(section)) {
        if (CONFIG.debug) {
          console.log(`?? Section ${absoluteIndex} excluded:`, section.className);
        }
        return;
      }

      applySectionBackground(section, visualIndex);
      
      visualIndex++;
      processedCount++;
    });

    if (CONFIG.debug) {
      console.log(`? Section backgrounds applied: ${processedCount}/${sections.length} sections processed`);
    }

    window.dispatchEvent(new CustomEvent('sectionBackgroundsApplied', {
      detail: { 
        processedCount, 
        totalCount: sections.length,
        config: CONFIG 
      }
    }));
  }

  /**
   * Debounce function 
   * @param {Function} func 
   * @param {number} wait - 
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
  function refreshSectionBackgrounds() {
    if (CONFIG.debug) {
      console.log('?? Refreshing section backgrounds...');
    }
    applySectionBackgrounds();
  }

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
      console.log('? Smooth transitions enabled for section backgrounds');
    }
  }

  function setupDOMObserver() {
    const observer = new MutationObserver(debounce((mutations) => {
      let shouldRefresh = false;

      mutations.forEach((mutation) => {
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

        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            mutation.target.matches('section, .section')) {
          shouldRefresh = true;
        }
      });

      if (shouldRefresh) {
        if (CONFIG.debug) {
          console.log('?? DOM changes detected, refreshing section backgrounds...');
        }
        refreshSectionBackgrounds();
      }
    }, 250));

    const bodyContainer = document.body;
    if (bodyContainer) {
      observer.observe(bodyContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      if (CONFIG.debug) {
        console.log('??? DOM observer setup for dynamic content changes (body-wide)');
      }
    }

    return observer;
  }

  function setupEventListeners() {
    window.addEventListener('resize', debounce(refreshSectionBackgrounds, 250));

    // ????? ????? ??? ????? ?????
    window.addEventListener('languageChanged', refreshSectionBackgrounds);

    // API ??? ????????? ???????
    window.INTEC_SectionBackgrounds = {
      refresh: refreshSectionBackgrounds,
      config: CONFIG,
      apply: applySectionBackgrounds
    };

    // ????? applyAlternatingSectionClasses ???? ??????
    window.applyAlternatingSectionClasses = refreshSectionBackgrounds;
    window.refreshBackgrounds = refreshSectionBackgrounds;
    
    // ???? ?????? debug mode
    window.debugBackgroundSystem = function() {
      CONFIG.debug = true;
      console.log('?? Debug mode enabled for Section Background System');
      console.log('?? Current Config:', CONFIG);
      refreshSectionBackgrounds();
    };

    if (CONFIG.debug) {
      console.log('?? Event listeners setup complete');
      console.log('?? Use window.INTEC_SectionBackgrounds.refresh() to manually refresh');
    }
  }

  /**
   * ????? ?????? ???????
   */
  function initializeSystem() {
    const startTime = performance.now();

    try {
      // ????? ?????????? ??????
      enableSmoothTransitions();

      // ????? ?????? ????? ??????
      applySectionBackgrounds();

      // ????? ?????? ?????????
      setupDOMObserver();

      // ????? event listeners
      setupEventListeners();

      const endTime = performance.now();
      const initTime = (endTime - startTime).toFixed(2);

      console.log(`?? Section Background System initialized successfully in ${initTime}ms`);
      
      if (CONFIG.debug) {
        console.log('?? System Config:', CONFIG);
      }

    } catch (error) {
      console.error('? Section Background System initialization failed:', error);
    }
  }

  // ????? ?????? ??? ????? DOM ?? ????? ??? ??? ??????
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    // DOM ????? ????? ????
    initializeSystem();
  }

  // ????? ????? ??? ????? ??????? (?????? ?? ????? ???? ???????)
  window.addEventListener('load', refreshSectionBackgrounds);

})();

// ============================================================================
// ?? ALTERNATING SECTION BACKGROUNDS SYSTEM
// ???? ???????? ????????? ????????
// ============================================================================

(function() {
  'use strict';

  /**
   * ?? ??????? ??????
   */
  const CONFIG = {
    // CSS classes ???????? ?????????
    surfaceClass: 'section--surface',  // ??????? ??????? (????)
    altClass: 'section--alt',          // ??????? ??????? (??????)
    
    // ????? ??????? ????????? ?? ?????? ????????
    excludeSelectors: [
      '.hero',
      '.footer', 
      '.header',
      '.navigation',
      '[data-no-alternating]',
      '.section--no-alternating'
    ],
    
    // ??????? ????????
    observeChanges: false,       // ????? ???????? ???? ?????? ?? DevTools
    debounceDelay: 300,         // ????? ????? ??????????? ????????
    
    // ??? ???????
    debug: true                // ???? ?????? ?????? ?? console
  };

  /**
   * ?? ????? ????? ???????? ?????????
   */
  function applyAlternatingSectionClasses() {
    // ????? ?? ???? ??????? ?? ??????
    const sections = document.querySelectorAll('section, .section');
    
    if (sections.length === 0) {
      if (CONFIG.debug) {
        console.log('?? No sections found for alternating backgrounds');
      }
      return;
    }

    // ????? ??????? ?????????
    const validSections = Array.from(sections).filter(section => {
      // ???? ?? ???????????
      for (const excludeSelector of CONFIG.excludeSelectors) {
        if (section.matches(excludeSelector)) {
          if (CONFIG.debug) {
            console.log(`?? Excluding section: ${excludeSelector}`);
          }
          return false;
        }
      }
      return true;
    });

    if (CONFIG.debug) {
      console.log(`?? Processing ${validSections.length} sections for alternating backgrounds`);
    }

    // ????? ???????? ??????? ?????
    validSections.forEach(section => {
      section.classList.remove(CONFIG.surfaceClass, CONFIG.altClass);
    });

    // ????? ???????? ?????????
    validSections.forEach((section, index) => {
      const isEven = index % 2 === 0;
      const className = isEven ? CONFIG.surfaceClass : CONFIG.altClass;
      
      section.classList.add(className);
      
      if (CONFIG.debug) {
        console.log(`? Section ${index + 1}: Applied .${className}`);
      }
    });

    if (CONFIG.debug) {
      console.log('?? Alternating section backgrounds applied successfully');
    }
  }

  /**
   * ?? ????? Debounce ?????? ??????
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
   * ??? ????? ????????? ?? DOM
   */
  function setupDOMObserver() {
    if (!CONFIG.observeChanges) return null;

    let isObserving = true;
    let mutationTimeout = null;

    const debouncedRefresh = debounce(() => {
      if (CONFIG.debug) {
        console.log('?? DOM changes detected, refreshing section backgrounds...');
      }
      applyAlternatingSectionClasses();
    }, CONFIG.debounceDelay);

    const observer = new MutationObserver((mutations) => {
      // ????? ???? ???????? ????? ??????
      if (!isObserving) return;
      
      // ????? ???????? ???? 2 ????? ??? ?? ?????
      if (mutationTimeout) clearTimeout(mutationTimeout);
      isObserving = false;
      
      mutationTimeout = setTimeout(() => {
        isObserving = true;
      }, 2000);

      let shouldRefresh = false;

      mutations.forEach((mutation) => {
        // ??? sections ??????
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE && 
                (node.matches('section, .section') || 
                 node.querySelector('section, .section'))) {
              shouldRefresh = true;
              break;
            }
          }
        }
      });

      if (shouldRefresh) {
        debouncedRefresh();
      }
    });

    // ?????? body container ????? ???? ???????
    const bodyContainer = document.body;
    if (bodyContainer) {
      observer.observe(bodyContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });

      if (CONFIG.debug) {
        console.log('??? DOM observer setup for dynamic content changes');
      }
    }

    return observer;
  }

  /**
   * ??? ????? event listeners ??????? ??????
   */
  function setupEventListeners() {
    // ????? ????? ??? ????? ??? ?????? (?? debounce)
    const debouncedResize = debounce(applyAlternatingSectionClasses, 250);
    window.addEventListener('resize', debouncedResize);

    // ????? ????? ??? ????? ?????
    window.addEventListener('languageChanged', applyAlternatingSectionClasses);

    if (CONFIG.debug) {
      console.log('??? Event listeners setup complete');
    }
  }

  /**
   * ?? ????? ??????
   */
  function initializeSystem() {
    if (CONFIG.debug) {
      console.log('?? Initializing alternating section backgrounds system...');
    }

    // ????? ???? ????????
    applyAlternatingSectionClasses();
    
    // ????? ???????? ?????????? ???????
    setupDOMObserver();
    setupEventListeners();

    // API ??? ????????? ???????
    window.INTEC_SectionBackgrounds = {
      refresh: applyAlternatingSectionClasses,
      config: CONFIG,
      apply: applyAlternatingSectionClasses
    };

    if (CONFIG.debug) {
      console.log('? Alternating section backgrounds system initialized');
    }
  }

  // ????? ?????? ??? ????? ??????
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem();
  }

})();

// PUBLIC API ????????? ???????
// ============================================================================

/**
 * ?? API ??? ?????? ?????? ???????
 * ???? ???????? ?? ?? ???? ?? ??????
 */
window.INTEC = window.INTEC || {};
window.INTEC.SectionBackgrounds = {
  /**
   * ????? ????? ????? ??????? ?????????
   */
  refresh() {
    if (window.INTEC_SectionBackgrounds) {
      window.INTEC_SectionBackgrounds.refresh();
    }
  },

  /**
   * ?????? ??? ??????? ??????
   */
  getConfig() {
    return window.INTEC_SectionBackgrounds?.config || null;
  },

  /**
   * ????? ?????? ??????
   */
  apply() {
    if (window.INTEC_SectionBackgrounds) {
      window.INTEC_SectionBackgrounds.apply();
    }
  }
};

// ============================================================================
// CONSOLE INFO ????????
// ============================================================================
console.log(`
?? INTEC Brussels - Section Background System
-----------------------------------------------

? System Status: Active
?? Mode: Automatic alternating backgrounds  
?? Responsive: Yes
?? Transitions: Enabled
?? Debug Mode: ${window.INTEC_SectionBackgrounds?.config?.debug ? 'ON' : 'OFF'}

?? Usage:
   window.INTEC.SectionBackgrounds.refresh()  // ????? ?????
   window.INTEC.SectionBackgrounds.apply()    // ????? ????
   window.INTEC.SectionBackgrounds.getConfig() // ??? ?????????

?? CSS Classes:
   .section--surface  // ??????? ??????? (????)
   .section--alt      // ??????? ??????? (????)

-----------------------------------------------
`);

