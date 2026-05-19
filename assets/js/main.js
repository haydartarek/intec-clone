// ============================================================================
// assets/js/main.js
// INTEC Brussels - Professional JavaScript Core (2025 Edition)
// Fully refactored with all fixes applied
// ============================================================================

(function () {
  "use strict";

  // Performance optimizations
  if ("scheduler" in window && typeof scheduler.yield === "function") {
    window.__intecScheduler = true;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) {
    document.documentElement.classList.add("reduce-motion");
  }

  if (
    window.outerWidth - window.innerWidth > 200 ||
    window.outerHeight - window.innerHeight > 200
  ) {
    document.documentElement.classList.add("devtools-open");
  }

  // ==========================================================================
  // GLOBAL CONFIGURATION & STATE
  // ==========================================================================

  const INTEC = window.INTEC || {};

  // Newsletter fallback config for static hosting environments.
  // Meta tags or window.INTEC_* values still override these defaults.
  const NEWSLETTER_SUPABASE_URL_FALLBACK =
    "https://cdupvdbgvjluexrodaho.supabase.co";
  const NEWSLETTER_SUPABASE_ANON_KEY_FALLBACK =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkdXB2ZGJndmpsdWV4cm9kYWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjU4MjEsImV4cCI6MjA4ODgwMTgyMX0.CpAS3hPIjXXgAdnuqBxjfqi0x_h3yTXpPgKqeqUHZMQ";
  const NEWSLETTER_SUPABASE_TABLE_FALLBACK = "newsletter_subscribers";
  const NEWSLETTER_SUPABASE_RPC_FALLBACK = "subscribe_newsletter";
  const REGISTRATION_SUPABASE_RPC_FALLBACK = "submit_intake_registration";
  const CONTACT_SUPABASE_RPC_FALLBACK = "submit_contact_message";
  const CONTACT_INBOX_EMAIL_FALLBACK = "heydertarek2000@gmail.com";

  const LANGUAGE_STORAGE_KEY = "intec-language";
  const LANGUAGE_STORAGE_VERSION = "intec-language-v2";
  const LANGUAGE_MANUAL_FLAG = "intec-language-manual";

  const normalizeLanguage = (lang) =>
    String(lang || "")
      .toLowerCase()
      .startsWith("en")
      ? "en"
      : "nl";

  INTEC.config = {
    defaultLanguage: "nl",
    maxLanguageLoadAttempts: 20,
    languageRetryDelay: 50,
    devToolsThreshold: 160,
    devToolsHysteresis: 80,
    devToolsConfirmDelay: 600,
    devToolsPollInterval: 1200,
    devToolsResizeDebounce: 300,
    monitorDevTools: false,
    scrollThrottleDelay: 16,
    resizeDebounceDelay: 250,
    countdownUpdateInterval: 3600000, // 1 hour
    carouselAutoplayDelay: 6000,
    carouselTransitionDuration: 800,
    newsletterSupabaseUrl:
      window.INTEC_SUPABASE_URL || NEWSLETTER_SUPABASE_URL_FALLBACK,
    newsletterSupabaseAnonKey:
      window.INTEC_SUPABASE_ANON_KEY || NEWSLETTER_SUPABASE_ANON_KEY_FALLBACK,
    newsletterSupabaseTable:
      window.INTEC_SUPABASE_TABLE || NEWSLETTER_SUPABASE_TABLE_FALLBACK,
    newsletterSupabaseRpc:
      window.INTEC_SUPABASE_RPC || NEWSLETTER_SUPABASE_RPC_FALLBACK,
    newsletterSubmitTimeout: 10000,
    registrationSupabaseUrl:
      window.INTEC_REGISTRATION_SUPABASE_URL ||
      window.INTEC_SUPABASE_URL ||
      NEWSLETTER_SUPABASE_URL_FALLBACK,
    registrationSupabaseAnonKey:
      window.INTEC_REGISTRATION_SUPABASE_ANON_KEY ||
      window.INTEC_SUPABASE_ANON_KEY ||
      NEWSLETTER_SUPABASE_ANON_KEY_FALLBACK,
    registrationSupabaseRpc:
      window.INTEC_REGISTRATION_SUPABASE_RPC ||
      REGISTRATION_SUPABASE_RPC_FALLBACK,
    registrationSubmitTimeout: 12000,
    contactSupabaseUrl:
      window.INTEC_CONTACT_SUPABASE_URL ||
      window.INTEC_SUPABASE_URL ||
      NEWSLETTER_SUPABASE_URL_FALLBACK,
    contactSupabaseAnonKey:
      window.INTEC_CONTACT_SUPABASE_ANON_KEY ||
      window.INTEC_SUPABASE_ANON_KEY ||
      NEWSLETTER_SUPABASE_ANON_KEY_FALLBACK,
    contactSupabaseRpc:
      window.INTEC_CONTACT_SUPABASE_RPC || CONTACT_SUPABASE_RPC_FALLBACK,
    contactInboxEmail:
      window.INTEC_CONTACT_INBOX_EMAIL || CONTACT_INBOX_EMAIL_FALLBACK,
    contactSubmitTimeout: 12000,
    contactOpenWebmailDraft: true,
    debug: false,
  };

  // ========================================================================
  // DESIGN TOKEN BRIDGE (Phase 4)
  // Exposes CSS custom properties + generated manifest to JavaScript modules.
  // ========================================================================

  INTEC.tokens = (() => {
    const cache = new Map();
    let manifest = { tokens: {} };
    let manifestPromise = null;

    const scriptCandidates = () => {
      if (document.currentScript) return [document.currentScript];
      return Array.from(document.getElementsByTagName("script"));
    };

    const manifestUrl = (() => {
      const scripts = scriptCandidates();
      for (let i = scripts.length - 1; i >= 0; i -= 1) {
        const src = scripts[i]?.getAttribute("src");
        if (!src || !src.includes("assets/js/main.js")) continue;
        try {
          const scriptUrl = new URL(src, window.location.href);
          return new URL("../../data/design-tokens.json", scriptUrl).toString();
        } catch (error) {
          /* noop – fall through to default */
        }
      }
      return new URL(
        "data/design-tokens.json",
        window.location.href,
      ).toString();
    })();

    const ensureCssVar = (name) => {
      if (!name) return "";
      return name.startsWith("--") ? name : `--${name}`;
    };

    const manifestKey = (name) => ensureCssVar(name).replace(/^--/, "");

    const readFromCss = (name) => {
      const normalized = ensureCssVar(name);
      if (!normalized) return "";
      if (cache.has(normalized)) return cache.get(normalized);
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(normalized)
        .trim();
      if (value) cache.set(normalized, value);
      return value;
    };

    const loadManifest = () => {
      if (manifestPromise || typeof fetch !== "function") {
        if (!manifestPromise) manifestPromise = Promise.resolve(manifest);
        return manifestPromise;
      }

      manifestPromise = fetch(manifestUrl, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to load design tokens (${response.status})`,
            );
          }
          return response.json();
        })
        .then((data) => {
          manifest = data || { tokens: {} };
          return manifest;
        })
        .catch((error) => {
          console.warn("[INTEC.tokens] Manifest load failed:", error.message);
          manifest = manifest || { tokens: {} };
          return manifest;
        });

      return manifestPromise;
    };

    const get = (name, options = {}) =>
      readFromCss(name) || options.fallback || "";

    const raw = (name) => {
      const key = manifestKey(name);
      return manifest.tokens?.[key];
    };

    const all = () => ({ ...(manifest.tokens || {}) });

    const refresh = () => {
      cache.clear();
      manifestPromise = null;
      return loadManifest();
    };

    // Kick off manifest fetch in the background so downstream code can await it.
    loadManifest();

    return {
      get,
      raw,
      all,
      ready: loadManifest,
      refresh,
      manifestUrl,
    };
  })();

  const savedLanguage =
    localStorage.getItem(LANGUAGE_STORAGE_VERSION) ||
    localStorage.getItem(LANGUAGE_STORAGE_KEY);
  let manualLanguageChoice =
    localStorage.getItem(LANGUAGE_MANUAL_FLAG) === "true";
  const htmlLanguage =
    document.documentElement.lang?.trim() || INTEC.config.defaultLanguage;

  const initialLanguage = normalizeLanguage(
    (manualLanguageChoice && savedLanguage) ||
      savedLanguage ||
      htmlLanguage ||
      INTEC.config.defaultLanguage,
  );

  INTEC.state = {
    currentLanguage: initialLanguage,
    languageLoadAttempts: 0,
    isInitialized: false,
    observers: [],
    timers: [],
  };

  // Lazy loader for optional language bundles so we only fetch what we need.
  const LanguageLoader = (() => {
    const getMainScript = () => {
      if (document.currentScript) return document.currentScript;
      const candidates = Array.from(document.querySelectorAll("script[src]"));
      return (
        candidates.find((script) =>
          (script.getAttribute("src") || "").includes("assets/js/main.js"),
        ) || null
      );
    };

    const scriptElement = getMainScript();
    const scriptBase = (() => {
      try {
        if (scriptElement) {
          const scriptUrl = new URL(
            scriptElement.getAttribute("src"),
            window.location.href,
          );
          const normalized = scriptUrl.href.split("?")[0];
          return normalized.slice(0, normalized.lastIndexOf("/") + 1);
        }
      } catch (error) {
        /* noop */
      }

      try {
        return new URL("assets/js/", window.location.href).href;
      } catch (error) {
        return "assets/js/";
      }
    })();

    const pendingLoads = new Map();

    const resolveUrl = (relativePath) => {
      try {
        return new URL(relativePath, scriptBase).toString();
      } catch (error) {
        return relativePath;
      }
    };

    const loadScript = (url) =>
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.defer = true;

        try {
          const target = new URL(url, window.location.href);
          if (target.origin !== window.location.origin) {
            script.crossOrigin = "anonymous";
          }
        } catch (error) {
          /* ignore URL parsing issues */
        }

        script.onload = () => resolve(url);
        script.onerror = () => reject(new Error(`Failed to load ${url}`));
        document.head.appendChild(script);
      });

    const ensureLanguage = (lang) => {
      if (!lang) return Promise.resolve();
      if (window.i18n?.[lang]) return Promise.resolve(window.i18n[lang]);
      if (pendingLoads.has(lang)) return pendingLoads.get(lang);

      const scriptUrl = resolveUrl(`i18n/${lang}.js`);
      const loadPromise = loadScript(scriptUrl)
        .then(() => {
          if (!window.i18n?.[lang]) {
            throw new Error(`Language bundle '${lang}' did not register`);
          }
          return window.i18n[lang];
        })
        .finally(() => {
          pendingLoads.delete(lang);
        });

      pendingLoads.set(lang, loadPromise);
      return loadPromise;
    };

    return {
      ensureLanguage,
    };
  })();

  const persistLanguage = (lang, manual = false) => {
    if (!lang) return;
    localStorage.setItem(LANGUAGE_STORAGE_VERSION, lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (manual) {
      localStorage.setItem(LANGUAGE_MANUAL_FLAG, "true");
    } else if (!manualLanguageChoice) {
      localStorage.setItem(LANGUAGE_MANUAL_FLAG, "false");
    }
  };

  const setLanguageReady = (isReady) => {
    document.documentElement.setAttribute(
      "data-language-ready",
      isReady ? "true" : "false",
    );
  };

  const applyLanguageUiState = (lang) => {
    const normalizedLang = normalizeLanguage(lang);

    document.documentElement.lang = normalizedLang;
    document.documentElement.setAttribute("data-language", normalizedLang);

    document.querySelectorAll("[data-lang-select]").forEach((btn) => {
      const active = normalizeLanguage(btn.dataset.lang) === normalizedLang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.setAttribute("aria-current", active ? "true" : "false");
    });

    document.querySelectorAll(".language-switch").forEach((switcher) => {
      const hasMatchingButton = !!switcher.querySelector(
        `[data-lang-select][data-lang="${normalizedLang}"]`,
      );
      switcher.dataset.activeLang = hasMatchingButton ? normalizedLang : "";
    });
  };

  setLanguageReady(false);
  applyLanguageUiState(initialLanguage);
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
      return function (...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => (inThrottle = false), limit);
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
      const header = document.querySelector(".site-header");
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
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) +
            threshold &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth) +
            threshold
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
    log(message, type = "info") {
      if (!INTEC.config.debug) return;
      const timestamp = new Date().toLocaleTimeString();
      const badge =
        { info: "INFO", success: "OK", warning: "WARN", error: "ERROR" }[
          type
        ] || "INFO";
      console[type === "error" ? "error" : "log"](
        `[${badge}] [${timestamp}] ${message}`,
      );
    },
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
      const confirmDelay = Math.max(
        200,
        INTEC.config.devToolsConfirmDelay || 600,
      );
      const pollInterval = Math.max(
        500,
        INTEC.config.devToolsPollInterval || 1200,
      );
      const resizeDebounce = Math.max(
        150,
        INTEC.config.devToolsResizeDebounce || 300,
      );

      let detectedState = false;
      let pendingState = false;
      let pendingSince = 0;
      let isChecking = false;
      let pollTimer = null;
      let resizeTimer = null;

      const detect = () => {
        const widthDelta = Math.abs(
          (window.outerWidth || 0) - window.innerWidth,
        );
        const heightDelta = Math.abs(
          (window.outerHeight || 0) - window.innerHeight,
        );
        const delta = Math.max(widthDelta, heightDelta);
        const closeThreshold = Math.max(0, openThreshold - hysteresis);

        return detectedState ? delta > closeThreshold : delta > openThreshold;
      };

      const applyState = (newState) => {
        if (this.currentState === newState) return;
        this.currentState = newState;
        requestAnimationFrame(() => {
          body.classList.toggle("devtools-open", newState);
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

      window.addEventListener("resize", onResize, { passive: true });

      pollTimer = window.setInterval(() => {
        if (!document.hidden) evaluate();
      }, pollInterval);

      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
          setTimeout(() => evaluate(), 100);
        }
      });

      window.addEventListener(
        "beforeunload",
        () => {
          clearInterval(pollTimer);
          if (resizeTimer) clearTimeout(resizeTimer);
        },
        { once: true },
      );

      detectedState = detect();
      pendingState = detectedState;
      pendingSince = performance.now() - confirmDelay;
      evaluate();

      Utils.log("DevTools detector initialized (anti-flicker)", "success");
    },
  };

  // ==========================================================================
  // LANGUAGE MANAGEMENT SYSTEM
  // ==========================================================================

  const LanguageManager = {
    translations: {},

    init() {
      this.setupLanguageSwitchers();
      this.loadLanguage(INTEC.state.currentLanguage);
      Utils.log("Language manager initialized", "success");
    },

    loadLanguage(lang) {
      if (!lang) return Promise.resolve();
      const normalizedLang = normalizeLanguage(lang);

      setLanguageReady(false);
      applyLanguageUiState(normalizedLang);

      const applyLanguage = () => {
        INTEC.state.languageLoadAttempts = 0;
        INTEC.state.currentLanguage = normalizedLang;
        const manualChoice =
          localStorage.getItem(LANGUAGE_MANUAL_FLAG) === "true";
        persistLanguage(INTEC.state.currentLanguage, manualChoice);
        applyLanguageUiState(INTEC.state.currentLanguage);

        this.applyTranslations();
        setLanguageReady(true);

        window.dispatchEvent(
          new CustomEvent("languageChanged", { detail: { lang } }),
        );
        Utils.log(`Language loaded: ${lang}`, "success");
        return lang;
      };

      if (window.i18n?.[lang]) {
        return Promise.resolve(applyLanguage());
      }

      return LanguageLoader.ensureLanguage(lang)
        .then(() => applyLanguage())
        .catch((error) => {
          Utils.log(
            `Language bundle error for '${lang}': ${error.message || error}`,
            "error",
          );
          if (
            INTEC.state.languageLoadAttempts <
            INTEC.config.maxLanguageLoadAttempts
          ) {
            INTEC.state.languageLoadAttempts += 1;
            return new Promise((resolve) => {
              setTimeout(
                () => resolve(this.loadLanguage(lang)),
                INTEC.config.languageRetryDelay,
              );
            });
          }
          Utils.log(
            `Failed to load language '${lang}' after max attempts`,
            "error",
          );
          // Prevent a permanent hidden state when a language bundle fails.
          setLanguageReady(true);
          return null;
        });
    },

    applyTranslations() {
      const dict = window.i18n?.[INTEC.state.currentLanguage] || {};
      const missing = new Set();
      let translated = 0;

      const translate = (selector, attr, setAttr = false) => {
        Utils.$$(selector).forEach((el) => {
          const key = el.getAttribute(attr);
          const text = dict[key];

          if (text) {
            if (setAttr) {
              el.setAttribute(attr.replace("data-i18n-", ""), text);
            } else {
              el[
                el.hasAttribute("data-i18n-allow-html")
                  ? "innerHTML"
                  : "textContent"
              ] = text;
            }
            translated++;
          } else {
            if (!setAttr && !el.hasAttribute("data-i18n-allow-html")) {
              el.textContent = key;
            }
            if (setAttr) {
              el.setAttribute(attr.replace("data-i18n-", ""), key);
            }
            missing.add(key);
          }
        });
      };

      translate("[data-i18n]", "data-i18n");
      translate("[data-i18n-content]", "data-i18n-content", true);
      translate("[data-i18n-placeholder]", "data-i18n-placeholder", true);
      translate("[data-i18n-aria-label]", "data-i18n-aria-label", true);
      this.syncSeoMeta();

      Utils.log(`Translated ${translated} elements`, "success");
      if (missing.size)
        Utils.log(
          `Missing translations: ${[...missing].join(", ")}`,
          "warning",
        );
    },

    syncSeoMeta() {
      const title = String(document.title || "").trim();
      const description = String(
        Utils.$('meta[name="description"]')?.getAttribute("content") || "",
      ).trim();

      const setMetaContent = (selector, value) => {
        if (!value) return;
        const node = Utils.$(selector);
        if (node) {
          node.setAttribute("content", value);
        }
      };

      setMetaContent('meta[property="og:title"]', title);
      setMetaContent('meta[name="twitter:title"]', title);
      setMetaContent('meta[property="og:description"]', description);
      setMetaContent('meta[name="twitter:description"]', description);
    },

    setupLanguageSwitchers() {
      Utils.$$("[data-lang-select]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const newLang = btn.dataset.lang;
          if (newLang !== INTEC.state.currentLanguage) {
            localStorage.setItem(LANGUAGE_MANUAL_FLAG, "true");
            this.loadLanguage(newLang);
          }
        });
      });
    },

    reset() {
      localStorage.removeItem(LANGUAGE_STORAGE_VERSION);
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
      localStorage.removeItem(LANGUAGE_MANUAL_FLAG);
      this.loadLanguage(INTEC.config.defaultLanguage);
      Utils.log("Language reset to default", "info");
    },
  };

  // ==========================================================================
  // SMOOTH SCROLL SYSTEM
  // ==========================================================================

  const SmoothScroll = {
    init() {
      this.setupSmoothScrollLinks();
      Utils.log("Smooth scroll initialized", "success");
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
      Utils.$$('a[href^="#"]:not([href="#"])').forEach((anchor) => {
        anchor.addEventListener("click", (e) => {
          const hash = anchor.getAttribute("href");
          const target = Utils.$(hash);

          if (!target) return;

          e.preventDefault();

          const targetY =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            Utils.getHeaderOffset();

          this.scrollTo(targetY);

          history.replaceState(null, "", hash);
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        });
      });
    },
  };

  // ==========================================================================
  // HASH TARGET FIELD FOCUS
  // ==========================================================================

  const HashTargetFocus = {
    init() {
      const focusFieldFromHash = () => {
        const hash = window.location.hash;
        if (!hash || hash.length < 2) return;

        let targetId = hash.slice(1);
        try {
          targetId = decodeURIComponent(targetId);
        } catch (error) {
          return;
        }

        const target = document.getElementById(targetId);
        if (!target) return;

        const isFocusableField = target.matches(
          "input, textarea, select, button, [contenteditable='true'], [tabindex]",
        );
        if (!isFocusableField) return;

        requestAnimationFrame(() => {
          try {
            target.focus({ preventScroll: true });
          } catch (error) {
            target.focus();
          }
        });
      };

      setTimeout(focusFieldFromHash, 0);
      window.addEventListener("hashchange", focusFieldFromHash);
      window.addEventListener("languageChanged", () => {
        setTimeout(focusFieldFromHash, 0);
      });
    },
  };

  // ==========================================================================
  // MAILTO TO WEBMAIL
  // ==========================================================================

  const MailtoLinks = {
    init() {
      this.applyAll(document);

      window.addEventListener("languageChanged", () => this.applyAll(document));
      window.addEventListener("intecLanguageChanged", () =>
        this.applyAll(document),
      );

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "childList" || !mutation.addedNodes.length) {
            continue;
          }

          for (const addedNode of mutation.addedNodes) {
            if (!(addedNode instanceof Element)) continue;
            this.applyAll(addedNode);
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      Utils.log("Mailto links upgraded to webmail", "success");
    },

    extractEmail(href) {
      const raw = String(href || "").replace(/^mailto:/i, "");
      const value = raw.split("?")[0];
      if (!value) return "";

      try {
        return decodeURIComponent(value).trim();
      } catch (error) {
        return value.trim();
      }
    },

    extractMailtoParams(href) {
      const raw = String(href || "");
      const queryIndex = raw.indexOf("?");
      if (queryIndex < 0) {
        return new URLSearchParams();
      }
      return new URLSearchParams(raw.slice(queryIndex + 1));
    },

    buildWebmailUrl(href, emailOverride = "") {
      const email = String(emailOverride || this.extractEmail(href)).trim();
      if (!email) return "";

      const params = this.extractMailtoParams(href);
      const webmailParams = new URLSearchParams({
        view: "cm",
        fs: "1",
        to: email,
      });

      const subject = params.get("subject") || params.get("su");
      const body = params.get("body");
      const cc = params.get("cc");
      const bcc = params.get("bcc");

      if (subject) webmailParams.set("su", subject);
      if (body) webmailParams.set("body", body);
      if (cc) webmailParams.set("cc", cc);
      if (bcc) webmailParams.set("bcc", bcc);

      return `https://mail.google.com/mail/?${webmailParams.toString()}`;
    },

    applyAnchor(anchor) {
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const sourceHref = String(
        anchor.getAttribute("data-mailto-original") ||
          anchor.getAttribute("href") ||
          "",
      ).trim();

      if (!sourceHref.toLowerCase().startsWith("mailto:")) return;

      const webmailUrl = this.buildWebmailUrl(sourceHref);
      if (!webmailUrl) return;

      anchor.setAttribute("data-mailto-original", sourceHref);
      anchor.setAttribute("href", webmailUrl);
      anchor.setAttribute("target", "_blank");
      anchor.setAttribute("rel", "noopener noreferrer");
    },

    applyAll(root) {
      if (!(root instanceof Element) && root !== document) return;

      if (root instanceof HTMLAnchorElement) {
        this.applyAnchor(root);
      }

      const links = root.querySelectorAll(
        'a[href^="mailto:"], a[data-mailto-original]',
      );
      links.forEach((link) => this.applyAnchor(link));
    },
  };

  // ==========================================================================
  // STICKY HEADER
  // ==========================================================================

  const StickyHeader = {
    header: null,
    lastScrollY: 0,
    ticking: false,

    init() {
      this.header = Utils.$(".site-header");
      if (!this.header) return;

      window.addEventListener("scroll", () => this.onScroll(), {
        passive: true,
      });
      Utils.log("Sticky header initialized", "success");
    },

    onScroll() {
      if (!this.ticking) {
        requestAnimationFrame(() => this.update());
        this.ticking = true;
      }
    },

    update() {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 60) {
        this.header.classList.add("scrolled");
      } else {
        this.header.classList.remove("scrolled");
      }

      this.lastScrollY = currentScrollY;
      this.ticking = false;
    },
  };

  // ==========================================================================
  // MOBILE NAVIGATION
  // ==========================================================================

  // ==========================================================================
  // MOBILE NAVIGATION - ENHANCED VERSION
  // ==========================================================================

  const MobileNav = {
    toggle: null,
    nav: null,
    navList: null,
    closeButton: null,
    isOpen: false,

    init() {
      this.toggle = Utils.$("[data-nav-toggle], .nav-toggle");
      this.nav = Utils.$(".primary-nav");
      this.navList = Utils.$(".nav-links");

      if (!this.toggle || !this.nav || !this.navList) {
        Utils.log("Mobile nav elements missing", "warning");
        return;
      }

      // Normalize stale navigation state on load (e.g. history restore/cached states).
      this.isOpen = false;
      this.nav.classList.remove("is-open");
      this.navList.classList.remove("is-open");
      document.body.classList.remove("nav-is-open");

      this.setupToggle();
      this.setupCloseButton();
      this.setupOutsideClick();
      this.setupEscapeKey();
      this.setupLinkClicks();
      this.syncActions();
      this.setupResizeHandler();

      Utils.log("Mobile navigation initialized", "success");
    },

    setupToggle() {
      this.toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMenu();
      });
    },

    setupCloseButton() {
      if (!this.nav) return;

      if (!this.closeButton) {
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "nav-close";
        closeBtn.setAttribute("aria-label", "Sluit menu");
        closeBtn.innerHTML =
          '<span aria-hidden="true">\u00d7</span><span>Sluit menu</span>';

        closeBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.closeMenu();
          this.toggle?.focus();
        });

        this.closeButton = closeBtn;
      }

      if (!this.nav.contains(this.closeButton)) {
        this.nav.appendChild(this.closeButton);
      }
    },

    toggleMenu() {
      this.isOpen = !this.isOpen;

      // Update ARIA attributes
      this.toggle.setAttribute("aria-expanded", String(this.isOpen));

      // Toggle classes
      this.toggle.classList.toggle("is-active", this.isOpen);
      this.nav.classList.toggle("is-open", this.isOpen);
      this.navList.classList.toggle("is-open", this.isOpen);
      document.body.classList.toggle("nav-is-open", this.isOpen);

      // Trap focus inside menu when open
      if (this.isOpen) {
        this.trapFocus();
      } else {
        this.releaseFocus();
      }

      Utils.log(`Menu ${this.isOpen ? "opened" : "closed"}`, "info");
    },

    closeMenu() {
      this.isOpen = false;
      this.toggle.setAttribute("aria-expanded", "false");
      this.toggle.classList.remove("is-active");
      this.nav.classList.remove("is-open");
      this.navList.classList.remove("is-open");
      document.body.classList.remove("nav-is-open");

      this.releaseFocus();
    },

    setupOutsideClick() {
      document.addEventListener("click", (e) => {
        if (!this.isOpen) return;

        const isClickInsideNav = this.nav.contains(e.target);
        const isClickOnToggle = this.toggle.contains(e.target);

        if (!isClickInsideNav && !isClickOnToggle) {
          this.closeMenu();
        }
      });
    },

    setupEscapeKey() {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this.isOpen) {
          this.closeMenu();
          this.toggle.focus();
        }
      });
    },

    setupLinkClicks() {
      Utils.$$("a", this.navList).forEach((link) => {
        link.addEventListener("click", () => {
          // Close menu when link is clicked on mobile
          if (window.innerWidth <= 1024) {
            setTimeout(() => this.closeMenu(), 300);
          }
        });
      });
    },

    trapFocus() {
      const focusableElements = Utils.$$(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        this.nav,
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      this.focusTrapHandler = (e) => {
        if (e.key !== "Tab") return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener("keydown", this.focusTrapHandler);
      firstElement.focus();
    },

    releaseFocus() {
      if (this.focusTrapHandler) {
        document.removeEventListener("keydown", this.focusTrapHandler);
        this.focusTrapHandler = null;
      }
    },

    syncActions() {
      const actions = Utils.$(".site-header__actions");
      const headerInner = Utils.$(".site-header__inner");

      if (!actions || !headerInner || !this.nav) return;

      if (!this.actionsPlaceholder) {
        this.actionsPlaceholder = document.createComment(
          "site-header__actions-placeholder",
        );
        headerInner.insertBefore(this.actionsPlaceholder, actions);
      }

      const relocate = () => {
        const isMobile = window.innerWidth <= 1024;

        if (isMobile) {
          if (!this.nav.contains(actions)) {
            this.nav.appendChild(actions);
          }
          if (this.closeButton) {
            this.nav.appendChild(this.closeButton);
          }
        } else if (!headerInner.contains(actions)) {
          headerInner.insertBefore(
            actions,
            this.actionsPlaceholder.nextSibling,
          );
          this.closeMenu();
        }
      };

      relocate();

      const debouncedRelocate = Utils.debounce(relocate, 150);
      window.addEventListener("resize", debouncedRelocate);
    },

    setupResizeHandler() {
      let resizeTimer;

      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
          // Close menu if resizing to desktop
          if (window.innerWidth > 1024 && this.isOpen) {
            this.closeMenu();
          }
        }, 250);
      });
    },
  };

  // ==========================================================================
  // LAZY IMAGE OPTIMIZATION
  // ==========================================================================

  const LazyImages = {
    init() {
      Utils.$$("img").forEach((img) => {
        const isCritical = img.dataset.critical === "true";
        const hasLazyAttr = img.hasAttribute("loading");

        img.setAttribute(
          "loading",
          isCritical ? "eager" : hasLazyAttr ? img.loading : "lazy",
        );
        img.setAttribute("decoding", "async");

        if (isCritical) {
          img.setAttribute("fetchpriority", "high");
        }
      });

      Utils.log("Lazy images optimized", "success");
    },
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
      Utils.log("Scroll animations initialized", "success");
    },

    ensureAnimationAttributes() {
      const animationTargets = [
        { selector: ".hero__content", animation: "slide-right" },
        { selector: ".hero__visual", animation: "slide-left" },
        {
          selector:
            ".hero-card, .section, .section-heading, .stats-item, .program-card, .course-card, .tip-card, .faq-item, .highlight-box, .logo-card, .cta-band, .timeline li",
          animation: "fade-up",
        },
      ];

      animationTargets.forEach(({ selector, animation }) => {
        Utils.$$(selector).forEach((el) => {
          if (!el.dataset.animate) {
            el.dataset.animate = animation;
          }
        });
      });
    },

    setupIntersectionObserver() {
      const animatedElements = Utils.$$("[data-animate]");

      if (animatedElements.length > 0) {
        const observerOptions = {
          threshold: 0.15,
          rootMargin: "0px 0px -60px 0px",
        };

        this.observer = new IntersectionObserver((entries) => {
          const toAnimate = [];

          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              toAnimate.push(entry.target);
            }
          });

          if (toAnimate.length) {
            requestAnimationFrame(() => {
              toAnimate.forEach((target) => {
                target.classList.add("is-visible");
                this.observer.unobserve(target);
              });
            });
          }
        }, observerOptions);

        animatedElements.forEach((el) => this.observer.observe(el));
        Utils.log(
          `Observing ${animatedElements.length} animated elements`,
          "info",
        );
      }

      // Fade-up observer
      const fadeUpElements = Utils.$$(".fade-up");

      if (fadeUpElements.length > 0) {
        this.fadeUpObserver = new IntersectionObserver(
          (entries) => {
            const visible = [];

            entries.forEach((entry) => {
              if (entry.isIntersecting) visible.push(entry.target);
            });

            if (visible.length) {
              requestAnimationFrame(() => {
                visible.forEach((target) => {
                  target.classList.add("is-visible");
                  this.fadeUpObserver.unobserve(target);
                });
              });
            }
          },
          { threshold: 0.1, rootMargin: "0px 0px -80px 0px" },
        );

        fadeUpElements.forEach((el) => this.fadeUpObserver.observe(el));
        Utils.log(
          `Observing ${fadeUpElements.length} fade-up elements`,
          "info",
        );
      }
    },

    setupFloatingCTA() {
      const floatingCta = Utils.$(".floating-cta");
      if (!floatingCta) return;

      const updateCta = Utils.throttle(() => {
        floatingCta.classList.toggle("is-visible", window.scrollY > 400);
      }, 100);

      window.addEventListener("scroll", updateCta, { passive: true });
      Utils.log("Floating CTA initialized", "info");
    },
  };

  // ==========================================================================
  // COUNTER ANIMATIONS
  // ==========================================================================

  const CounterAnimations = {
    observer: null,

    init() {
      const counters = Utils.$$("[data-counter]");
      if (counters.length === 0) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              !entry.target.classList.contains("counted")
            ) {
              this.startCounter(entry.target);
              entry.target.classList.add("counted");
              this.observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.45 },
      );

      counters.forEach((el) => {
        el.textContent = "0";
        this.observer.observe(el);
      });

      Utils.log("Counter animations initialized", "success");
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

        element.textContent = hasDecimals
          ? value.toFixed(1)
          : Math.floor(value);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.textContent = hasDecimals ? target.toFixed(1) : target;
        }
      };

      requestAnimationFrame(animate);
    },
  };

  // ==========================================================================
  // COURSE COUNTDOWN SYSTEM
  // ==========================================================================

  const CourseCountdown = {
    timer: null,

    messages: {
      en: {
        inMany: (d) => `Starts in ${d} days`,
        inOne: () => "Starts in 1 day",
        today: "Starts today",
        pastMany: (d) => `Started ${d} days ago`,
        pastOne: () => "Started 1 day ago",
      },
      nl: {
        inMany: (d) => `Start over ${d} dagen`,
        inOne: () => "Start over 1 dag",
        today: "Start vandaag",
        pastMany: (d) => `Gestart ${d} dagen geleden`,
        pastOne: () => "Gestart 1 dag geleden",
      },
    },

    t(key, fallback = "") {
      return (
        window.i18n?.[INTEC.state.currentLanguage]?.[key] ||
        window.i18n?.en?.[key] ||
        fallback
      );
    },

    normalizeStatusLabel(label) {
      return String(label || "")
        .trim()
        .toLocaleUpperCase();
    },

    isMarkedAsFull(statusEl) {
      if (!statusEl) return false;

      if (statusEl.dataset.capacityState) {
        return statusEl.dataset.capacityState === "full";
      }

      const explicitCapacity = (
        statusEl.dataset.capacity ||
        statusEl.closest("[data-capacity]")?.dataset.capacity ||
        ""
      ).toLowerCase();

      const key = (statusEl.getAttribute("data-i18n") || "").toLowerCase();
      const className = statusEl.className.toLowerCase();
      const text = (statusEl.textContent || "").trim().toLowerCase();

      const isFull =
        explicitCapacity === "full" ||
        key === "date.badge.full" ||
        className.includes("course-dates__status--full") ||
        /\b(full|volzet|vol)\b/.test(text);

      statusEl.dataset.capacityState = isFull ? "full" : "open";
      return isFull;
    },

    updateStatus(item, diffDays) {
      const statusEl = item.querySelector(".course-dates__status");
      if (!statusEl) return;

      const isFull = this.isMarkedAsFull(statusEl);
      const shouldWait = isFull || diffDays <= 0;
      const key = shouldWait ? "date.badge.waiting" : "date.badge.available";
      const fallback = shouldWait ? "WAITING" : "AVAILABLE";
      const label = this.normalizeStatusLabel(this.t(key, fallback));

      statusEl.dataset.i18n = key;
      statusEl.textContent = label;
      statusEl.classList.remove(
        "course-dates__status--available",
        "course-dates__status--full",
        "course-dates__status--waiting",
      );
      statusEl.classList.add(
        shouldWait
          ? "course-dates__status--waiting"
          : "course-dates__status--available",
      );
    },

    init() {
      this.update();
      this.timer = setInterval(
        () => this.update(),
        INTEC.config.countdownUpdateInterval,
      );
      window.addEventListener("languageChanged", () => this.update());
      Utils.log("Course countdown initialized", "success");
    },

    update() {
      const lang = INTEC.state.currentLanguage;
      const messages = this.messages[lang] || this.messages.en;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      Utils.$$("[data-start-date]").forEach((item) => {
        const dateStr = item.dataset.startDate;
        if (!dateStr) return;

        const targetDate = new Date(dateStr);
        if (isNaN(targetDate)) return;

        targetDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((targetDate - today) / 86400000);

        let message;
        if (diffDays > 0) {
          message =
            diffDays === 1 ? messages.inOne() : messages.inMany(diffDays);
        } else if (diffDays === 0) {
          message = messages.today;
        } else {
          const pastDays = Math.abs(diffDays);
          message =
            pastDays === 1 ? messages.pastOne() : messages.pastMany(pastDays);
        }

        this.updateStatus(item, diffDays);

        let badge =
          item.querySelector("[data-countdown]") ||
          item.querySelector(".course-dates__countdown") ||
          item.querySelector(".course-date__countdown");
        if (!badge) {
          badge = document.createElement("span");
          badge.className = "course-date__countdown";
          badge.setAttribute("role", "status");
          badge.setAttribute("aria-live", "polite");
          item.append(" ", badge);
        }
        badge.dataset.countdown = "";
        badge.classList.add("course-date__countdown");

        badge.textContent = message;
        badge.classList.remove(
          "course-date__countdown--soon",
          "course-date__countdown--today",
          "course-date__countdown--past",
        );

        if (diffDays === 0) {
          badge.classList.add("course-date__countdown--today");
        } else if (diffDays < 0) {
          badge.classList.add("course-date__countdown--past");
        } else if (diffDays <= 30) {
          badge.classList.add("course-date__countdown--soon");
        }
      });
    },

    destroy() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
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
    state: "idle", // 'idle', 'animating', 'dragging'
    startX: null,
    deltaX: 0,
    resizeRAF: null,

    init() {
      this.carousel = Utils.$('[data-carousel="partners"]');
      if (!this.carousel || this.carousel.__carouselInit) return;

      this.carousel.__carouselInit = true;
      this.track = Utils.$("[data-partner-track]", this.carousel);

      if (!this.track) {
        Utils.log("Partner carousel: missing track element", "error");
        return;
      }

      // Remove server-rendered clones
      Utils.$$(".partner-carousel__slide.is-clone", this.track).forEach(
        (clone) => clone.remove(),
      );

      this.slides = Utils.$$(".partner-carousel__slide", this.track);

      if (this.slides.length === 0) {
        Utils.log("Partner carousel: no slides found", "error");
        return;
      }

      this.dotsContainer = Utils.$(".partner-carousel__dots", this.carousel);
      this.prevBtn = Utils.$("[data-partner-prev]", this.carousel);
      this.nextBtn = Utils.$("[data-partner-next]", this.carousel);

      this.setupClones();
      this.setupControls();
      this.setupDragAndTouch();
      this.setupKeyboard();
      this.setupVisibilityControl();
      this.setupResize();
      this.computeStep();
      this.setTransform(this.currentIndex, false);
      this.updateUI();

      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        this.startAutoplay();
      }

      Utils.log(
        `Partner carousel initialized: ${this.slides.length} slides`,
        "success",
      );
    },

    setupClones() {
      const firstClone = this.slides[0].cloneNode(true);
      const lastClone = this.slides[this.slides.length - 1].cloneNode(true);

      [firstClone, lastClone].forEach((clone) => {
        clone.classList.add("is-clone");
        clone.setAttribute("aria-hidden", "true");
      });

      this.track.insertBefore(lastClone, this.slides[0]);
      this.track.appendChild(firstClone);

      this.allSlides = Utils.$$(".partner-carousel__slide", this.track);
    },

    computeStep() {
      if (this.allSlides.length < 2) return;
      const a = this.allSlides[0].getBoundingClientRect();
      const b = this.allSlides[1].getBoundingClientRect();
      this.stepX = Math.abs(b.left - a.left) || a.width;
    },

    setTransform(index, transition = true) {
      const x = -index * this.stepX;
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
        ? 0
        : 800;

      this.track.style.transition =
        transition && duration > 0
          ? `transform ${duration}ms cubic-bezier(0.33, 1, 0.68, 1)`
          : "none";
      this.track.style.transform = `translate3d(${x}px, 0, 0)`;
      this.track.style.willChange = transition ? "transform" : "auto";
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
      const realIndex =
        this.currentIndex === 0
          ? this.slides.length - 1
          : this.currentIndex === this.slides.length + 1
            ? 0
            : this.currentIndex - 1;

      this.allSlides.forEach((slide, i) => {
        const isActive = i === this.currentIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
      });

      if (this.dotsContainer) {
        Utils.$$("[data-partner-dot]", this.dotsContainer).forEach((dot, i) => {
          const isActive = i === realIndex;
          dot.classList.toggle("is-active", isActive);
          dot.setAttribute("aria-current", isActive ? "true" : "false");
        });
      }
    },

    goTo(newIndex) {
      if (this.state === "animating") return;

      this.state = "animating";
      this.currentIndex = newIndex;
      this.setTransform(this.currentIndex, true);
      this.updateUI();

      setTimeout(() => {
        this.state = "idle";
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
      const autoplayDelay = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? 0
        : INTEC.config.carouselAutoplayDelay;

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
        this.nextBtn.addEventListener("click", () => {
          this.stopAutoplay();
          this.next();
          this.startAutoplay();
        });
      }

      if (this.prevBtn) {
        this.prevBtn.addEventListener("click", () => {
          this.stopAutoplay();
          this.prev();
          this.startAutoplay();
        });
      }

      if (this.dotsContainer) {
        this.dotsContainer.addEventListener("click", (e) => {
          const dot = e.target.closest("[data-partner-dot]");
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
      const guardSelector =
        "[data-partner-prev], [data-partner-next], .partner-carousel__dot";
      const swipeThreshold = 0.2;
      const minSwipe = 50;

      const onStart = (x) => {
        if (this.state === "animating") return;
        this.state = "dragging";
        this.startX = x;
        this.deltaX = 0;
        this.stopAutoplay();
        this.setTransform(this.currentIndex, false);
      };

      const onMove = (x) => {
        if (this.state !== "dragging" || this.startX === null) return;
        this.deltaX = x - this.startX;
        const translateX = -(this.currentIndex * this.stepX) + this.deltaX;
        this.track.style.transform = `translate3d(${translateX}px, 0, 0)`;
      };

      const onEnd = () => {
        if (this.state !== "dragging") return;

        const threshold = Math.max(minSwipe, this.stepX * swipeThreshold);

        if (Math.abs(this.deltaX) > threshold) {
          this.deltaX > 0 ? this.prev() : this.next();
        } else {
          this.setTransform(this.currentIndex, true);
        }

        this.startX = null;
        this.deltaX = 0;
        this.startAutoplay();
        this.state = "idle";
      };

      // Touch events
      this.carousel.addEventListener(
        "touchstart",
        (e) => {
          if (e.target.closest(guardSelector)) return;
          onStart(e.touches[0].clientX);
        },
        { passive: true },
      );

      this.carousel.addEventListener(
        "touchmove",
        (e) => {
          onMove(e.touches[0].clientX);
        },
        { passive: true },
      );

      this.carousel.addEventListener("touchend", onEnd);

      // Mouse events
      this.carousel.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        if (e.target.closest(guardSelector)) return;

        e.preventDefault();
        onStart(e.clientX);

        const moveHandler = (ev) => onMove(ev.clientX);
        const upHandler = () => {
          onEnd();
          document.removeEventListener("mousemove", moveHandler);
          document.removeEventListener("mouseup", upHandler);
        };

        document.addEventListener("mousemove", moveHandler);
        document.addEventListener("mouseup", upHandler);
      });
    },

    setupKeyboard() {
      this.carousel.setAttribute("tabindex", "0");
      this.carousel.setAttribute("role", "region");
      this.carousel.setAttribute("aria-label", "Partner logos carousel");

      this.carousel.addEventListener("keydown", (e) => {
        if (this.state === "animating") return;

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            this.prev();
            break;
          case "ArrowRight":
            e.preventDefault();
            this.next();
            break;
          case "Home":
            e.preventDefault();
            this.goToDot(0);
            break;
          case "End":
            e.preventDefault();
            this.goToDot(this.slides.length - 1);
            break;
        }

        this.stopAutoplay();
        this.startAutoplay();
      });
    },

    setupVisibilityControl() {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.stopAutoplay();
        } else {
          this.startAutoplay();
        }
      });

      this.carousel.addEventListener("mouseenter", () => this.stopAutoplay());
      this.carousel.addEventListener("mouseleave", () => this.startAutoplay());
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

      window.addEventListener("resize", onResize);
    },

    destroy() {
      this.stopAutoplay();
      if (this.observer) this.observer.disconnect();
    },
  };

  // ==========================================================================
  // ACCORDION SYSTEM (FIXED)
  // ==========================================================================

  const AccordionSystem = {
    cleanupPendingState(body) {
      const pendingListener = body._intecAccordionTransitionEnd;
      if (typeof pendingListener === "function") {
        body.removeEventListener("transitionend", pendingListener);
        body._intecAccordionTransitionEnd = null;
      }

      const pendingRaf = body._intecAccordionRaf;
      if (typeof pendingRaf === "number") {
        cancelAnimationFrame(pendingRaf);
        body._intecAccordionRaf = null;
      }
    },

    init() {
      this.setupFAQAccordion();
      this.setupIntakePrepAccordion();
      Utils.log("Accordion system initialized", "success");
    },

    setupFAQAccordion() {
      const faqItems = Utils.$$(".faq-item");
      if (faqItems.length === 0) return;

      faqItems.forEach((item) => {
        const question = Utils.$(".faq-item__question", item);
        const answer = Utils.$(".faq-item__answer", item);

        if (!question || !answer) return;
        if (question.dataset.accordionBound === "true") return;

        // Ensure proper ARIA attributes
        const questionId =
          question.id || `faq-q-${Math.random().toString(36).substr(2, 9)}`;
        const answerId =
          answer.id || `faq-a-${Math.random().toString(36).substr(2, 9)}`;

        question.id = questionId;
        answer.id = answerId;
        question.setAttribute("aria-controls", answerId);
        answer.setAttribute("aria-labelledby", questionId);

        const toggle = () => {
          const isExpanded = question.getAttribute("aria-expanded") === "true";

          faqItems.forEach((otherItem) => {
            if (otherItem !== item) {
              const otherQuestion = Utils.$(".faq-item__question", otherItem);
              const otherAnswer = Utils.$(".faq-item__answer", otherItem);
              if (otherQuestion && otherAnswer) {
                this.closeAccordionItem(otherQuestion, otherAnswer);
              }
            }
          });

          if (isExpanded) {
            this.closeAccordionItem(question, answer);
          } else {
            this.openAccordionItem(question, answer);
          }
        };

        question.addEventListener("click", toggle);
        question.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        });

        question.dataset.accordionBound = "true";

        if (question.getAttribute("aria-expanded") !== "true") {
          answer.style.display = "none";
          answer.style.maxHeight = "0";
          answer.style.opacity = "0";
          answer.setAttribute("aria-hidden", "true");
        }
      });

      Utils.log(`FAQ accordion initialized: ${faqItems.length} items`, "info");
    },

    setupIntakePrepAccordion() {
      const accordionItems = Utils.$$(".page--inschrijven .accordion-item");
      if (accordionItems.length === 0) return;

      accordionItems.forEach((item, index) => {
        const header = Utils.$(".accordion-header", item);
        const body = Utils.$(".accordion-body", item);

        if (!header || !body) return;
        if (header.dataset.accordionBound === "true") return;

        if (!header.hasAttribute("tabindex")) {
          header.setAttribute("tabindex", "0");
        }

        const headerId = header.id || `accordion-header-${index}`;
        const bodyId = body.id || `accordion-body-${index}`;

        header.id = headerId;
        body.id = bodyId;
        header.setAttribute("aria-controls", bodyId);
        body.setAttribute("aria-labelledby", headerId);

        const toggle = () => {
          const isExpanded = header.getAttribute("aria-expanded") === "true";

          accordionItems.forEach((otherItem) => {
            if (otherItem !== item) {
              const otherHeader = Utils.$(".accordion-header", otherItem);
              const otherBody = Utils.$(".accordion-body", otherItem);
              if (otherHeader && otherBody) {
                this.closeAccordionItem(otherHeader, otherBody);
              }
            }
          });

          if (isExpanded) {
            this.closeAccordionItem(header, body);
          } else {
            this.openAccordionItem(header, body);
          }
        };

        header.addEventListener("click", toggle);
        header.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        });

        header.dataset.accordionBound = "true";

        if (header.getAttribute("aria-expanded") === "true") {
          body.style.display = "block";
          body.style.overflow = "";
          body.style.maxHeight = "none";
          body.style.opacity = "1";
          body.classList.add("is-open");
          header.classList.add("is-open");
          body.setAttribute("aria-hidden", "false");
        } else {
          body.style.display = "none";
          body.style.maxHeight = "0";
          body.style.opacity = "0";
          body.setAttribute("aria-hidden", "true");
        }
      });

      Utils.log(
        `Intake prep accordion initialized: ${accordionItems.length} items`,
        "info",
      );
    },

    openAccordionItem(header, body) {
      if (header.getAttribute("aria-expanded") === "true") {
        body.style.display = "block";
      }

      this.cleanupPendingState(body);

      header.setAttribute("aria-expanded", "true");
      body.setAttribute("aria-hidden", "false");
      body.classList.add("is-open");
      header.classList.add("is-open");

      body.style.display = "block";
      body.style.overflow = "hidden";
      body.style.opacity = "0";
      body.style.maxHeight = "0";
      body.offsetHeight;

      const measuredHeight = body.scrollHeight;

      body._intecAccordionRaf = requestAnimationFrame(() => {
        body._intecAccordionRaf = null;
        if (header.getAttribute("aria-expanded") !== "true") return;

        body.style.maxHeight = `${measuredHeight}px`;
        body.style.opacity = "1";
      });

      const onTransitionEnd = (e) => {
        if (e.target !== body) return;
        if (e.propertyName !== "max-height" && e.propertyName !== "opacity")
          return;

        body.removeEventListener("transitionend", onTransitionEnd);
        body._intecAccordionTransitionEnd = null;

        if (header.getAttribute("aria-expanded") === "true") {
          body.style.maxHeight = "none";
          body.style.overflow = "";
          body.style.opacity = "";
        }
      };

      body._intecAccordionTransitionEnd = onTransitionEnd;
      body.addEventListener("transitionend", onTransitionEnd);
    },

    closeAccordionItem(header, body) {
      if (
        header.getAttribute("aria-expanded") === "false" &&
        body.style.display === "none"
      ) {
        body.setAttribute("aria-hidden", "true");
        body.classList.remove("is-open");
        header.classList.remove("is-open");
        return;
      }

      this.cleanupPendingState(body);

      header.setAttribute("aria-expanded", "false");
      body.setAttribute("aria-hidden", "true");
      body.classList.remove("is-open");
      header.classList.remove("is-open");

      body.style.display = "block";
      body.style.overflow = "hidden";
      body.style.opacity = "1";
      body.style.maxHeight = `${body.scrollHeight}px`;
      body.offsetHeight;

      body._intecAccordionRaf = requestAnimationFrame(() => {
        body._intecAccordionRaf = null;
        if (header.getAttribute("aria-expanded") !== "false") return;

        body.style.opacity = "0";
        body.style.maxHeight = "0";
      });

      const onTransitionEnd = (e) => {
        if (e.target !== body) return;
        if (e.propertyName !== "max-height" && e.propertyName !== "opacity")
          return;

        body.removeEventListener("transitionend", onTransitionEnd);
        body._intecAccordionTransitionEnd = null;

        if (header.getAttribute("aria-expanded") === "false") {
          body.style.display = "none";
          body.style.maxHeight = "0";
          body.style.opacity = "0";
        }
      };

      body._intecAccordionTransitionEnd = onTransitionEnd;
      body.addEventListener("transitionend", onTransitionEnd);
    },
  };

  // ==========================================================================
  // FORM VALIDATION SYSTEM (FIXED)
  // ==========================================================================

  const FormValidation = {
    forms: [],

    init() {
      const selectors = [
        "#registration-form form",
        "#contact-form",
        "#partner-login-form",
        "form.contact-form",
        "form.form-container",
        ".form-container form",
      ];

      const uniqueForms = new Set();
      selectors.forEach((selector) => {
        Utils.$$(selector).forEach((form) => {
          if (form?.tagName === "FORM") {
            uniqueForms.add(form);
          }
        });
      });

      uniqueForms.forEach((form) => this.setupForm(form));

      Utils.log(
        `Form validation initialized for ${uniqueForms.size} form(s)`,
        "success",
      );
    },

    setupForm(form) {
      form.setAttribute("novalidate", "novalidate");

      const rules = {
        "full-name": {
          required: true,
          minLength: 5,
          maxLength: 25,
          pattern: /^[\p{L}'’-]{2,}(?:\s+[\p{L}'’-]{2,})+$/u,
          errorKey: "register.validation.fullName",
          minErrorKey: "register.validation.fullNameMin",
        },
        gender: {
          required: true,
          errorKey: "register.validation.gender",
        },
        email: {
          required: true,
          minLength: 6,
          maxLength: 50,
          pattern: /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/,
          errorKey: "register.validation.email",
        },
        phone: {
          required: true,
          pattern: /^0\d{8,9}$/,
          numbersOnly: true,
          errorKey: "register.validation.phone",
          numbersErrorKey: "register.validation.phoneNumbers",
        },
        "national-number": {
          required: true,
          exactLength: 11,
          numbersOnly: true,
          pattern: /^\d{11}$/,
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
          pattern: /^[\p{L}'’-]{2,30}(?:\s[\p{L}'’-]{2,30})?$/u,
          errorKey: "register.validation.city",
        },
        course: {
          required: true,
          errorKey: "register.validation.course",
        },
        username: {
          required: true,
          minLength: 3,
          maxLength: 50,
          errorKey: "register.validation.required",
        },
        password: {
          required: true,
          errorKey: "register.validation.required",
        },
        message: {
          required: false,
          maxLength: 500,
          errorKey: "register.validation.messageLength",
        },
      };

      const getDict = () => window.i18n?.[INTEC.state.currentLanguage] || {};

      const getErrorBox = (input, createIfMissing = false) => {
        const parent = input.parentNode;
        if (!parent) return null;

        let errorBox =
          parent.querySelector(".form-error") ||
          Utils.$(`#${input.name}-error`);
        if (!errorBox && createIfMissing) {
          errorBox = document.createElement("div");
          errorBox.className = "form-error";
          errorBox.id = `${input.name}-error`;
          errorBox.setAttribute("role", "alert");
          errorBox.setAttribute("aria-live", "polite");
          parent.appendChild(errorBox);
        }
        return errorBox;
      };

      const showError = (input, key) => {
        input.classList.add("has-error");
        input.classList.remove("is-valid");
        input.setAttribute("aria-invalid", "true");

        const errorBox = getErrorBox(input, true);

        if (errorBox) {
          const text = getDict()[key] || key;
          errorBox.textContent = text;
          errorBox.style.display = "block";
        }
      };

      const hideError = (input) => {
        input.classList.remove("has-error");
        input.classList.add("is-valid");
        input.setAttribute("aria-invalid", "false");

        const errorBox = getErrorBox(input);

        if (errorBox) {
          errorBox.style.display = "none";
          errorBox.textContent = "";
        }
      };

      const validate = (input) => {
        const name = input.name;
        const value = input.value.trim();
        const raw = input.value;
        const rule = rules[name];
        const compactValue = value.replace(/[\s.-]/g, "");

        if (!rule) {
          if (
            typeof input.checkValidity === "function" &&
            !input.checkValidity()
          ) {
            return {
              ok: false,
              key: input.validationMessage || "Please check this field.",
            };
          }
          return { ok: true };
        }

        const isContactPhoneOptional =
          form.id === "contact-form" && name === "phone" && !input.required;
        const isRequired = isContactPhoneOptional
          ? false
          : input.required || (!!rule && rule.required);

        // Required check
        if (isRequired) {
          if (input.type === "radio") {
            const radios = Utils.$$(`input[name="${name}"]`, form);
            const checked = radios.some((r) => r.checked);
            if (!checked)
              return {
                ok: false,
                key: rule.errorKey || "Please select an option.",
              };
          } else if (input.tagName === "SELECT") {
            if (!value || value === "")
              return {
                ok: false,
                key: rule.errorKey || "Please select a value.",
              };
          } else {
            if (!value)
              return {
                ok: false,
                key: rule.errorKey || "This field is required.",
              };
          }
        }

        if (!isRequired && !value) return { ok: true };

        // Numbers only check
        if (rule.numbersOnly && !/^\d+$/.test(compactValue)) {
          return {
            ok: false,
            key:
              rule.numbersErrorKey ||
              rule.errorKey ||
              "Only numbers are allowed.",
          };
        }

        // Min length check
        if (rule.minLength && raw.length < rule.minLength) {
          return {
            ok: false,
            key:
              rule.minErrorKey ||
              rule.errorKey ||
              `Please enter at least ${rule.minLength} characters.`,
          };
        }

        // Exact length check
        if (rule.exactLength) {
          const lengthTarget = rule.numbersOnly ? compactValue : value;
          if (lengthTarget.length !== rule.exactLength) {
            return {
              ok: false,
              key:
                rule.errorKey ||
                `Please enter exactly ${rule.exactLength} characters.`,
            };
          }
        }

        // Pattern check
        if (rule.pattern) {
          const patternTarget = rule.numbersOnly ? compactValue : value;
          if (!rule.pattern.test(patternTarget)) {
            return { ok: false, key: rule.errorKey || "Invalid format." };
          }
        }

        return { ok: true };
      };

      // Add error placeholders
      Utils.$$("input, select, textarea", form).forEach((field) => {
        const shouldCreate = !!rules[field.name] || field.required;
        if (shouldCreate) {
          getErrorBox(field, true);
        }
      });

      // Real-time validation
      Utils.$$("input, select, textarea", form).forEach((field) => {
        const rule = rules[field.name];
        if (!rule) return;

        // Max length enforcement
        if (rule.maxLength) {
          field.addEventListener("input", () => {
            if (field.value.length > rule.maxLength) {
              field.value = field.value.slice(0, rule.maxLength);
            }
          });
        }

        // Input validation
        field.addEventListener("input", () => {
          const result = validate(field);
          if (result.ok) {
            hideError(field);
          } else {
            showError(field, result.key);
          }
        });

        // Blur validation
        field.addEventListener("blur", () => {
          const result = validate(field);
          if (result.ok) {
            hideError(field);
          } else {
            showError(field, result.key);
          }
        });

        // Select/Radio change validation
        if (field.tagName === "SELECT" || field.type === "radio") {
          field.addEventListener("change", () => {
            const result = validate(field);
            if (result.ok) {
              hideError(field);
            } else {
              showError(field, result.key);
            }
          });
        }
      });

      const isContactMessageForm = form.id === "contact-form";
      const isRegistrationForm =
        form.classList.contains("contact-form--register") && !isContactMessageForm;
      let remoteSubmitInFlight = false;

      if (isRegistrationForm || isContactMessageForm) {
        form.setAttribute("method", "get");
        form.setAttribute("action", "");
      }

      const readMeta = (name) => {
        const node = document.querySelector(`meta[name="${name}"]`);
        return String(node?.getAttribute("content") || "").trim();
      };

      const sanitize = (value) => String(value || "").trim();

      const submitCopyPrefix = isContactMessageForm
        ? "contact.submitStatus"
        : "register.submitStatus";

      const getSubmitCopy = (key, fallback) =>
        getDict()[`${submitCopyPrefix}.${key}`] || fallback;

      const submitFallbacks = isContactMessageForm
        ? {
            submitting: "Bezig met verzenden...",
            duplicate:
              "Dit bericht lijkt al recent verzonden. Controleer je inbox.",
            unavailable:
              "Contactformulier is tijdelijk niet beschikbaar. Probeer later opnieuw.",
            invalid:
              "Niet alle velden zijn geldig. Controleer je gegevens en probeer opnieuw.",
            failed:
              "Verzenden mislukt. Controleer je verbinding en probeer opnieuw.",
          }
        : {
            submitting: "Bezig met verzenden...",
            duplicate:
              "Deze aanvraag lijkt al recent verzonden. Controleer je e-mail.",
            unavailable:
              "Inschrijven is tijdelijk niet beschikbaar. Probeer later opnieuw.",
            invalid:
              "Niet alle velden zijn geldig. Controleer je gegevens en probeer opnieuw.",
            failed:
              "Inschrijving mislukt. Controleer je verbinding en probeer opnieuw.",
          };

      const ensureSubmitStatusBox = () => {
        let statusBox = Utils.$(".form-submit-status", form);
        if (!statusBox) {
          statusBox = document.createElement("p");
          statusBox.className = "form-submit-status form-error";
          statusBox.hidden = true;
          statusBox.setAttribute("role", "status");
          statusBox.setAttribute("aria-live", "polite");
          const actions = Utils.$(".form-actions", form);
          if (actions) {
            actions.insertAdjacentElement("afterbegin", statusBox);
          } else {
            form.prepend(statusBox);
          }
        }
        return statusBox;
      };

      const setSubmitStatus = (state, text, key = "") => {
        const statusBox = ensureSubmitStatusBox();
        if (!text) {
          statusBox.hidden = true;
          statusBox.style.display = "none";
          statusBox.textContent = "";
          statusBox.removeAttribute("data-state");
          statusBox.removeAttribute("data-message-key");
          return;
        }

        statusBox.hidden = false;
        statusBox.style.display = "block";
        statusBox.textContent = text;
        statusBox.setAttribute("data-state", state);
        if (key) {
          statusBox.setAttribute("data-message-key", key);
        } else {
          statusBox.removeAttribute("data-message-key");
        }
      };

      const setSubmitButtonLoading = (isLoading) => {
        const submitBtn = Utils.$('button[type="submit"]', form);
        if (!submitBtn) return;

        if (!submitBtn.dataset.originalLabel) {
          submitBtn.dataset.originalLabel = submitBtn.textContent.trim();
        }

        submitBtn.disabled = isLoading;
        submitBtn.setAttribute("aria-busy", String(isLoading));
        submitBtn.textContent = isLoading
          ? getSubmitCopy("submitting", "Bezig met verzenden...")
          : submitBtn.dataset.originalLabel;
      };

      const ensureSuccessMessage = () => {
        let successMsg = Utils.$(".form-success", form);
        if (!successMsg) {
          const titleKey = isContactMessageForm
            ? "contact.success.title"
            : "register.success.title";
          const messageKey = isContactMessageForm
            ? "contact.success.message"
            : "register.success.message";
          const defaultTitle = isContactMessageForm
            ? "Bedankt voor je bericht!"
            : "Bedankt voor uw voorinschrijving!";
          const defaultMessage = isContactMessageForm
            ? "We antwoorden zo snel mogelijk via e-mail."
            : "U ontvangt binnen drie werkdagen een bevestiging per e-mail.";

          successMsg = document.createElement("div");
          successMsg.className = "form-success";
          successMsg.innerHTML = `
            <div class="form-success__title" data-i18n="${titleKey}">
              ${defaultTitle}
            </div>
            <p class="form-success__message" data-i18n="${messageKey}">
              ${defaultMessage}
            </p>
          `;
          const submitBtn = Utils.$('button[type="submit"]', form);
          if (submitBtn) {
            submitBtn.insertAdjacentElement("afterend", successMsg);
          } else {
            form.appendChild(successMsg);
          }
        }
        return successMsg;
      };

      const showSuccessMessage = () => {
        const successMsg = ensureSuccessMessage();
        const dict = getDict();
        const titleKey = isContactMessageForm
          ? "contact.success.title"
          : "register.success.title";
        const messageKey = isContactMessageForm
          ? "contact.success.message"
          : "register.success.message";
        const fallbackTitle = isContactMessageForm
          ? "Thank you for your message!"
          : "Thank you!";
        const fallbackMessage = isContactMessageForm
          ? "We will reply as soon as possible by email."
          : "We will contact you soon.";
        const titleEl = Utils.$(
          `[data-i18n="${titleKey}"]`,
          successMsg,
        );
        const messageEl = Utils.$(
          `[data-i18n="${messageKey}"]`,
          successMsg,
        );

        if (titleEl) {
          titleEl.textContent = dict[titleKey] || fallbackTitle;
        }
        if (messageEl) {
          messageEl.textContent = dict[messageKey] || fallbackMessage;
        }

        successMsg.classList.add("is-visible");
        successMsg.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
          form.reset();
          successMsg.classList.remove("is-visible");
          Utils.$$(".is-valid", form).forEach((field) =>
            field.classList.remove("is-valid"),
          );
        }, 5000);
      };

      const resolveRegistrationConfig = () => {
        const url =
          sanitize(readMeta("intec-registration-supabase-url")) ||
          sanitize(INTEC.config.registrationSupabaseUrl);
        const anonKey =
          sanitize(readMeta("intec-registration-supabase-anon-key")) ||
          sanitize(INTEC.config.registrationSupabaseAnonKey);
        const rpc =
          sanitize(readMeta("intec-registration-supabase-rpc")) ||
          sanitize(INTEC.config.registrationSupabaseRpc) ||
          "submit_intake_registration";

        return {
          url: url.replace(/\/+$/, ""),
          anonKey,
          rpc,
          timeoutMs: Number(INTEC.config.registrationSubmitTimeout) || 12000,
        };
      };

      const getRegistrationRpcEndpoint = (config) => {
        if (!config.url || !config.anonKey || !config.rpc) return "";
        return `${config.url}/rest/v1/rpc/${encodeURIComponent(config.rpc)}`;
      };

      const buildSupabaseHeaders = (config) => {
        const headers = {
          apikey: config.anonKey,
          "Content-Type": "application/json",
        };

        if (/^eyJ[A-Za-z0-9_-]+\./.test(config.anonKey)) {
          headers.Authorization = `Bearer ${config.anonKey}`;
        }

        return headers;
      };

      const getInputValue = (name) =>
        String(Utils.$(`[name="${name}"]`, form)?.value || "").trim();

      const getRadioValue = (name) =>
        String(Utils.$(`input[name="${name}"]:checked`, form)?.value || "").trim();

      const buildRegistrationPayload = () => ({
        p_full_name: getInputValue("full-name"),
        p_gender: getRadioValue("gender"),
        p_email: getInputValue("email"),
        p_phone: getInputValue("phone"),
        p_national_number: getInputValue("national-number"),
        p_address: getInputValue("address"),
        p_postcode: getInputValue("postcode"),
        p_city: getInputValue("city"),
        p_course: getInputValue("course"),
        p_message: getInputValue("message"),
        p_source_page: window.location.pathname,
        p_language:
          INTEC.state.currentLanguage ||
          document.documentElement.getAttribute("data-language") ||
          document.documentElement.lang ||
          "nl",
        p_submitted_at: new Date().toISOString(),
      });

      const parseSubmissionStatus = (payload) => {
        if (!payload) return "";
        if (Array.isArray(payload)) {
          return parseSubmissionStatus(payload[0]);
        }
        if (typeof payload === "string") {
          return payload.trim().toLowerCase();
        }
        if (typeof payload === "object") {
          return String(payload.status || payload.result || "").toLowerCase();
        }
        return "";
      };

      const submitRegistration = async () => {
        const config = resolveRegistrationConfig();
        const endpoint = getRegistrationRpcEndpoint(config);

        if (!endpoint) {
          return { ok: false, reason: "unavailable" };
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          config.timeoutMs,
        );

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: buildSupabaseHeaders(config),
            body: JSON.stringify(buildRegistrationPayload()),
            signal: controller.signal,
          });

          let body = null;
          try {
            body = await response.json();
          } catch (error) {
            /* noop */
          }

          if (!response.ok) {
            if (response.status === 404 || response.status === 405) {
              return { ok: false, reason: "unavailable" };
            }
            return { ok: false, reason: "failed" };
          }

          const status = parseSubmissionStatus(body);
          if (status === "duplicate") {
            return { ok: false, reason: "duplicate" };
          }
          if (status === "invalid") {
            return {
              ok: false,
              reason: "invalid",
              field: String(body?.field || "").trim(),
            };
          }
          if (status === "created" || status === "ok" || status === "success") {
            return { ok: true };
          }

          return { ok: false, reason: "failed" };
        } catch (error) {
          return { ok: false, reason: "failed" };
        } finally {
          clearTimeout(timeoutId);
        }
      };

      const resolveContactConfig = () => {
        const url =
          sanitize(readMeta("intec-contact-supabase-url")) ||
          sanitize(INTEC.config.contactSupabaseUrl);
        const anonKey =
          sanitize(readMeta("intec-contact-supabase-anon-key")) ||
          sanitize(INTEC.config.contactSupabaseAnonKey);
        const rpc =
          sanitize(readMeta("intec-contact-supabase-rpc")) ||
          sanitize(INTEC.config.contactSupabaseRpc) ||
          "submit_contact_message";
        const inboxEmail =
          sanitize(readMeta("intec-contact-inbox-email")) ||
          sanitize(INTEC.config.contactInboxEmail);

        return {
          url: url.replace(/\/+$/, ""),
          anonKey,
          rpc,
          inboxEmail,
          timeoutMs: Number(INTEC.config.contactSubmitTimeout) || 12000,
          openWebmailDraft: !!INTEC.config.contactOpenWebmailDraft,
        };
      };

      const getContactRpcEndpoint = (config) => {
        if (!config.url || !config.anonKey || !config.rpc) return "";
        return `${config.url}/rest/v1/rpc/${encodeURIComponent(config.rpc)}`;
      };

      const buildContactPayload = () => ({
        p_name: getInputValue("name"),
        p_email: getInputValue("email"),
        p_phone: getInputValue("phone"),
        p_subject: getInputValue("subject"),
        p_message: getInputValue("message"),
        p_source_page: window.location.pathname,
        p_language:
          INTEC.state.currentLanguage ||
          document.documentElement.getAttribute("data-language") ||
          document.documentElement.lang ||
          "nl",
        p_submitted_at: new Date().toISOString(),
      });

      const buildContactWebmailUrl = (config, payload) => {
        if (!config.inboxEmail) return "";

        const subjectLabels = {
          general: getDict()["contact.form.subject.general"] || "General question",
          training:
            getDict()["contact.form.subject.training"] || "Question about training",
          internship:
            getDict()["contact.form.subject.internship"] || "Internship request",
          partnership:
            getDict()["contact.form.subject.partnership"] || "Partnership",
          press: getDict()["contact.form.subject.press"] || "Press",
        };

        const readableSubject =
          subjectLabels[payload.p_subject] || payload.p_subject || "Contact";
        const mailSubject = `[INTEC Contact] ${readableSubject} - ${payload.p_name}`;
        const body = [
          `Name: ${payload.p_name}`,
          `Email: ${payload.p_email}`,
          `Phone: ${payload.p_phone || "-"}`,
          `Subject: ${readableSubject}`,
          "",
          "Message:",
          payload.p_message,
          "",
          `Source page: ${payload.p_source_page}`,
          `Language: ${payload.p_language}`,
        ].join("\n");

        const composeUrl =
          `https://mail.google.com/mail/?view=cm&fs=1&tf=1` +
          `&to=${encodeURIComponent(config.inboxEmail)}` +
          `&su=${encodeURIComponent(mailSubject)}` +
          `&body=${encodeURIComponent(body)}`;

        return composeUrl;
      };

      const submitContactMessage = async (payload) => {
        const config = resolveContactConfig();
        const endpoint = getContactRpcEndpoint(config);

        if (!endpoint) {
          return { ok: false, reason: "unavailable" };
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(
          () => controller.abort(),
          config.timeoutMs,
        );

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: buildSupabaseHeaders(config),
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          let body = null;
          try {
            body = await response.json();
          } catch (error) {
            /* noop */
          }

          if (!response.ok) {
            if (response.status === 404 || response.status === 405) {
              return { ok: false, reason: "unavailable" };
            }
            return { ok: false, reason: "failed" };
          }

          const status = parseSubmissionStatus(body);
          if (status === "duplicate") {
            return { ok: false, reason: "duplicate" };
          }

          if (status === "invalid") {
            return {
              ok: false,
              reason: "invalid",
              field: String(body?.field || "").trim(),
            };
          }

          if (status === "created" || status === "ok" || status === "success") {
            const webmailUrl = buildContactWebmailUrl(config, payload);
            return {
              ok: true,
              webmailUrl,
              openWebmailDraft: config.openWebmailDraft,
            };
          }

          return { ok: false, reason: "failed" };
        } catch (error) {
          return { ok: false, reason: "failed" };
        } finally {
          clearTimeout(timeoutId);
        }
      };

      // Ctrl+Enter submit for textarea
      const messageField = Utils.$('textarea[name="message"]', form);
      if (messageField) {
        messageField.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            form.requestSubmit();
          }
        });
      }

      // Form submit handler
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (remoteSubmitInFlight) return;

        let isValid = true;
        let firstInvalidField = null;

        // Clear all errors
        Utils.$$(".form-error", form).forEach(
          (box) => (box.style.display = "none"),
        );
        if (isRegistrationForm || isContactMessageForm) {
          setSubmitStatus("", "");
        }

        // Validate all fields
        Utils.$$("input, select, textarea", form).forEach((field) => {
          const name = field.name;
          if (name === "message" && !field.value.trim() && !field.required)
            return;

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
            firstInvalidField.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
          Utils.log("Form validation failed", "warning");
          return;
        }

        // Success handling
        Utils.log("Form validated successfully", "success");

        if (!isRegistrationForm && !isContactMessageForm) {
          showSuccessMessage();
          return;
        }

        remoteSubmitInFlight = true;
        setSubmitButtonLoading(true);
        setSubmitStatus(
          "info",
          getSubmitCopy("submitting", submitFallbacks.submitting),
          "submitting",
        );

        try {
          let result = null;
          let composeWindow = null;
          if (isContactMessageForm) {
            const contactPayload = buildContactPayload();
            const contactConfig = resolveContactConfig();
            if (contactConfig.openWebmailDraft && contactConfig.inboxEmail) {
              composeWindow = window.open("about:blank", "_blank");
              if (composeWindow) {
                composeWindow.opener = null;
              }
            }

            result = await submitContactMessage(contactPayload);

            if (result?.ok && result.webmailUrl && composeWindow) {
              composeWindow.location.replace(result.webmailUrl);
            } else if (composeWindow) {
              composeWindow.close();
            }
          } else {
            result = await submitRegistration();
          }

          if (result.ok) {
            setSubmitStatus("", "");
            showSuccessMessage();
          } else if (result.reason === "duplicate") {
            setSubmitStatus(
              "warning",
              getSubmitCopy("duplicate", submitFallbacks.duplicate),
              "duplicate",
            );
          } else if (result.reason === "unavailable") {
            setSubmitStatus(
              "error",
              getSubmitCopy("unavailable", submitFallbacks.unavailable),
              "unavailable",
            );
          } else if (result.reason === "invalid") {
            const fieldName = String(result.field || "");
            const field = fieldName
              ? Utils.$(`[name="${fieldName}"]`, form)
              : null;

            if (field && rules[fieldName]?.errorKey) {
              showError(field, rules[fieldName].errorKey);
              field.focus();
            }

            setSubmitStatus(
              "error",
              getSubmitCopy("invalid", submitFallbacks.invalid),
              "invalid",
            );
          } else {
            setSubmitStatus(
              "error",
              getSubmitCopy("failed", submitFallbacks.failed),
              "failed",
            );
          }
        } catch (error) {
          setSubmitStatus(
            "error",
            getSubmitCopy("failed", submitFallbacks.failed),
            "failed",
          );
        } finally {
          remoteSubmitInFlight = false;
          setSubmitButtonLoading(false);
        }
      });

      if (isRegistrationForm || isContactMessageForm) {
        window.addEventListener("languageChanged", () => {
          const statusBox = Utils.$(".form-submit-status", form);
          if (!statusBox || statusBox.hidden) return;

          const key = statusBox.getAttribute("data-message-key");
          if (!key) return;

          const fallback = submitFallbacks[key] || statusBox.textContent;
          const state = statusBox.getAttribute("data-state") || "info";
          setSubmitStatus(state, getSubmitCopy(key, fallback), key);
        });
      }

      this.forms.push(form);
    },
  };

  // ==========================================================================
  // NEWSLETTER EMAIL VALIDATION
  // ==========================================================================

  const NewsletterValidation = (() => {
    const EMAIL_PATTERN =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9-]{1,63})+$/;
    const LAST_NEWSLETTER_EMAIL_KEY = "intec-newsletter-last-email";
    const NEWSLETTER_EMAIL_CACHE_KEY = "intec-newsletter-email-cache-v1";
    const NEWSLETTER_EMAIL_CACHE_LIMIT = 50;

    const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

    const readCachedEmails = () => {
      const cache = new Set();
      try {
        const raw = window.localStorage.getItem(NEWSLETTER_EMAIL_CACHE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
          parsed.forEach((email) => {
            const normalized = normalizeEmail(email);
            if (normalized) {
              cache.add(normalized);
            }
          });
        }

        const legacyLast = normalizeEmail(
          window.localStorage.getItem(LAST_NEWSLETTER_EMAIL_KEY),
        );
        if (legacyLast) {
          cache.add(legacyLast);
        }
      } catch (error) {
        /* noop */
      }

      return cache;
    };

    const persistCachedEmails = (emailsSet) => {
      try {
        const emails = Array.from(emailsSet).slice(-NEWSLETTER_EMAIL_CACHE_LIMIT);
        window.localStorage.setItem(
          NEWSLETTER_EMAIL_CACHE_KEY,
          JSON.stringify(emails),
        );
        if (emails.length > 0) {
          window.localStorage.setItem(
            LAST_NEWSLETTER_EMAIL_KEY,
            emails[emails.length - 1],
          );
        }
      } catch (error) {
        /* noop */
      }
    };

    const isKnownSubscribedEmail = (email) => {
      const normalized = normalizeEmail(email);
      if (!normalized) return false;
      const cache = readCachedEmails();
      return cache.has(normalized);
    };

    const rememberSubscribedEmail = (email) => {
      const normalized = normalizeEmail(email);
      if (!normalized) return;
      const cache = readCachedEmails();
      if (cache.has(normalized)) return;
      cache.add(normalized);
      persistCachedEmails(cache);
      try {
        window.localStorage.setItem(
          LAST_NEWSLETTER_EMAIL_KEY,
          normalized,
        );
      } catch (error) {
        /* noop */
      }
    };

    const translations = {
      nl: {
        required: "Voer uw e-mailadres in.",
        invalid: "Gebruik een geldig e-mailadres, bijvoorbeeld naam@domein.be.",
        submitting: "Bezig met verzenden...",
        success: "Bedankt! Je bent ingeschreven op de nieuwsbrief.",
        duplicate: "Dit e-mailadres is al ingeschreven.",
        unavailable:
          "Nieuwsbrief is tijdelijk niet beschikbaar. Probeer later opnieuw.",
        failed:
          "Inschrijving mislukt. Controleer je verbinding en probeer opnieuw.",
      },
      en: {
        required: "Please enter your email address.",
        invalid: "Use a valid email address, for example name@domain.com.",
        submitting: "Submitting...",
        success: "Thank you! You are now subscribed to the newsletter.",
        duplicate: "This email address is already subscribed.",
        unavailable:
          "Newsletter is temporarily unavailable. Please try again later.",
        failed:
          "Subscription failed. Please check your connection and try again.",
      },
    };

    const getLocale = () => {
      const lang = (
        INTEC?.state?.currentLanguage ||
        document.documentElement.lang ||
        "nl"
      ).toLowerCase();
      return lang.startsWith("en") ? "en" : "nl";
    };

    const getMessage = (type) => {
      const locale = getLocale();
      return translations[locale]?.[type] || translations.nl[type];
    };

    const readMeta = (name) => {
      const node = document.querySelector(`meta[name="${name}"]`);
      return String(node?.getAttribute("content") || "").trim();
    };

    const sanitizeValue = (value) => String(value || "").trim();

    const resolveConfig = () => {
      const url =
        sanitizeValue(readMeta("intec-supabase-url")) ||
        sanitizeValue(INTEC.config.newsletterSupabaseUrl);
      const anonKey =
        sanitizeValue(readMeta("intec-supabase-anon-key")) ||
        sanitizeValue(INTEC.config.newsletterSupabaseAnonKey);
      const table =
        sanitizeValue(readMeta("intec-supabase-table")) ||
        sanitizeValue(INTEC.config.newsletterSupabaseTable) ||
        "newsletter_subscribers";
      const rpc =
        sanitizeValue(readMeta("intec-supabase-rpc")) ||
        sanitizeValue(INTEC.config.newsletterSupabaseRpc) ||
        "";

      return {
        url: url.replace(/\/+$/, ""),
        anonKey,
        table,
        rpc,
        timeoutMs: Number(INTEC.config.newsletterSubmitTimeout) || 10000,
      };
    };

    const getEndpoint = (config) => {
      if (!config.url || !config.anonKey || !config.table) return "";
      return `${config.url}/rest/v1/${encodeURIComponent(config.table)}`;
    };

    const getRpcEndpoint = (config) => {
      if (!config.url || !config.anonKey || !config.rpc) return "";
      return `${config.url}/rest/v1/rpc/${encodeURIComponent(config.rpc)}`;
    };

    const isJwtLike = (value) => /^eyJ[A-Za-z0-9_-]+\./.test(value);

    const isValidStructure = (email) => {
      if (!email || typeof email !== "string") return false;
      const trimmed = email.trim();
      if (!trimmed || /\s/.test(trimmed)) return false;
      if (trimmed.includes("..")) return false;
      const atParts = trimmed.split("@");
      if (atParts.length !== 2) return false;
      const [local, domain] = atParts;
      if (!local || !domain || local.endsWith(".") || domain.endsWith("."))
        return false;
      if (!EMAIL_PATTERN.test(trimmed)) return false;
      if (!domain.includes(".")) return false;

      const labels = domain.split(".");
      if (labels.length < 2) return false;

      const tld = labels[labels.length - 1];
      if (tld.length < 2 || /[^A-Za-z]/.test(tld)) return false;

      return labels.every(
        (label) =>
          !!label &&
          !label.startsWith("-") &&
          !label.endsWith("-") &&
          /^[A-Za-z0-9-]{1,63}$/.test(label),
      );
    };

    const validateEmail = (value) => {
      if (!value || !value.trim()) {
        return { ok: false, message: getMessage("required") };
      }

      if (!isValidStructure(value)) {
        return { ok: false, message: getMessage("invalid") };
      }

      return { ok: true };
    };

    const createStatusElement = (form, anchorNode) => {
      let status = form.querySelector(".newsletter-status");
      if (!status) {
        status = document.createElement("p");
        status.className = "newsletter-status";
        status.hidden = true;
        (anchorNode || form).insertAdjacentElement("afterend", status);
      }
      status.setAttribute("aria-live", "polite");
      status.setAttribute("role", "status");
      return status;
    };

    const setStatus = (statusEl, state, text, messageKey = "") => {
      if (!statusEl) return;
      if (!text) {
        statusEl.textContent = "";
        statusEl.hidden = true;
        statusEl.removeAttribute("data-state");
        statusEl.removeAttribute("data-message-key");
        return;
      }
      statusEl.hidden = false;
      statusEl.textContent = text;
      statusEl.setAttribute("data-state", state);
      if (messageKey) {
        statusEl.setAttribute("data-message-key", messageKey);
      } else {
        statusEl.removeAttribute("data-message-key");
      }
    };

    const toggleSubmitting = (form, isLoading) => {
      const submitBtn =
        form.querySelector(".newsletter-button") ||
        form.querySelector('button[type="submit"]');

      if (!submitBtn) return;

      submitBtn.classList.toggle("is-loading", isLoading);
      submitBtn.disabled = isLoading;
      submitBtn.setAttribute("aria-busy", String(isLoading));

      if (!submitBtn.dataset.originalLabel) {
        submitBtn.dataset.originalLabel = submitBtn.textContent.trim();
      }

      submitBtn.textContent = isLoading
        ? getMessage("submitting")
        : submitBtn.dataset.originalLabel;
    };

    const buildSupabaseHeaders = (config, withJsonBody = false) => {
      const headers = {
        apikey: config.anonKey,
      };

      if (withJsonBody) {
        headers["Content-Type"] = "application/json";
      }

      if (isJwtLike(config.anonKey)) {
        headers.Authorization = `Bearer ${config.anonKey}`;
      }

      return headers;
    };

    const checkDuplicateSubscription = async (endpoint, config, email) => {
      const queryUrl = new URL(endpoint);
      queryUrl.searchParams.set("select", "email");
      queryUrl.searchParams.set("email", `eq.${email}`);
      queryUrl.searchParams.set("limit", "1");

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        config.timeoutMs,
      );

      try {
        const response = await fetch(queryUrl.toString(), {
          method: "GET",
          headers: buildSupabaseHeaders(config, false),
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          return { ok: false, duplicate: false };
        }

        const rows = await response.json();
        const duplicate = Array.isArray(rows) && rows.length > 0;
        return { ok: true, duplicate };
      } catch (error) {
        return { ok: false, duplicate: false };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const parseRpcStatus = (payload) => {
      if (!payload) return "";
      if (Array.isArray(payload)) {
        return parseRpcStatus(payload[0]);
      }

      if (typeof payload === "string") {
        return payload.trim().toLowerCase();
      }

      if (typeof payload === "object") {
        return String(
          payload.status || payload.result || payload.state || "",
        ).toLowerCase();
      }

      return "";
    };

    const submitViaRpc = async (rpcEndpoint, config, email) => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        config.timeoutMs,
      );

      const payload = {
        p_email: email,
        p_source_page: window.location.pathname,
        p_language: getLocale(),
        p_subscribed_at: new Date().toISOString(),
      };

      try {
        const response = await fetch(rpcEndpoint, {
          method: "POST",
          headers: buildSupabaseHeaders(config, true),
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 404 || response.status === 405) {
            return { ok: false, reason: "rpc-unavailable" };
          }

          return { ok: false, reason: "failed" };
        }

        let body = null;
        try {
          body = await response.json();
        } catch (error) {
          /* noop */
        }

        const status = parseRpcStatus(body);
        if (status === "duplicate") {
          return { ok: false, reason: "duplicate" };
        }

        if (status === "invalid") {
          return { ok: false, reason: "failed" };
        }

        return { ok: true };
      } catch (error) {
        return { ok: false, reason: "failed" };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const submitToSupabase = async (email) => {
      const config = resolveConfig();
      const endpoint = getEndpoint(config);
      const rpcEndpoint = getRpcEndpoint(config);
      if (!endpoint && !rpcEndpoint) {
        return { ok: false, reason: "unavailable" };
      }

      if (rpcEndpoint) {
        const rpcResult = await submitViaRpc(rpcEndpoint, config, email);
        if (rpcResult.ok || rpcResult.reason === "duplicate") {
          return rpcResult;
        }

        if (rpcResult.reason !== "rpc-unavailable") {
          return rpcResult;
        }
      }

      if (!endpoint) {
        return { ok: false, reason: "unavailable" };
      }

      const duplicateCheck = await checkDuplicateSubscription(
        endpoint,
        config,
        email,
      );
      if (duplicateCheck.ok && duplicateCheck.duplicate) {
        return { ok: false, reason: "duplicate" };
      }

      const payload = {
        email,
        source_page: window.location.pathname,
        language: getLocale(),
        subscribed_at: new Date().toISOString(),
      };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        config.timeoutMs,
      );

      try {
        const headers = buildSupabaseHeaders(config, true);
        headers.Prefer = "return=minimal";

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (response.ok) {
          return { ok: true };
        }

        if (response.status === 409) {
          return { ok: false, reason: "duplicate" };
        }

        let body = null;
        try {
          body = await response.json();
        } catch (error) {
          /* noop */
        }

        const duplicateByBody = String(body?.message || body?.hint || "")
          .toLowerCase()
          .includes("duplicate");
        if (duplicateByBody) {
          return { ok: false, reason: "duplicate" };
        }

        return { ok: false, reason: "failed" };
      } catch (error) {
        return { ok: false, reason: "failed" };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const ensureErrorElement = (form, input) => {
      let error = form.querySelector(".newsletter-error");
      if (!error) {
        error = document.createElement("p");
        error.className = "newsletter-error form-error";
        error.hidden = true;
        input.insertAdjacentElement("afterend", error);
      } else {
        error.classList.add("newsletter-error");
        if (!error.classList.contains("form-error")) {
          error.classList.add("form-error");
        }
        error.hidden = true;
      }

      if (!error.id) {
        error.id = `newsletter-error-${Math.random().toString(36).slice(2, 9)}`;
      }

      error.setAttribute("role", "alert");
      error.setAttribute("aria-live", "polite");

      return error;
    };

    const attachValidation = (form) => {
      const emailInput = form.querySelector(
        'input[type="email"], .newsletter-input',
      );
      if (!emailInput) return;

      form.setAttribute("novalidate", "novalidate");

      const errorEl = ensureErrorElement(form, emailInput);
      const statusEl = createStatusElement(form, errorEl);
      let inFlight = false;

      const showError = (message) => {
        setStatus(statusEl, "", "");
        errorEl.textContent = message;
        errorEl.hidden = false;
        emailInput.classList.add("has-error");
        emailInput.setAttribute("aria-invalid", "true");
        emailInput.setAttribute("aria-describedby", errorEl.id);
      };

      const hideError = () => {
        errorEl.textContent = "";
        errorEl.hidden = true;
        emailInput.classList.remove("has-error");
        emailInput.removeAttribute("aria-invalid");
        emailInput.removeAttribute("aria-describedby");
      };

      const runValidation = () => {
        const { ok, message } = validateEmail(emailInput.value);
        if (!ok) {
          showError(message);
          return false;
        }
        hideError();
        return true;
      };

      emailInput.addEventListener("input", () => {
        if (errorEl.hidden) {
          return;
        }
        runValidation();
      });

      emailInput.addEventListener("blur", () => {
        if (!emailInput.value) {
          hideError();
          return;
        }
        runValidation();
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (inFlight) return;

        if (!runValidation()) {
          emailInput.focus();
          return;
        }

        const normalizedEmail = String(emailInput.value || "")
          .trim()
          .toLowerCase();

        if (isKnownSubscribedEmail(normalizedEmail)) {
          setStatus(
            statusEl,
            "warning",
            getMessage("duplicate"),
            "duplicate",
          );
          return;
        }

        inFlight = true;
        toggleSubmitting(form, true);
        setStatus(statusEl, "info", getMessage("submitting"), "submitting");

        submitToSupabase(normalizedEmail)
          .then((result) => {
            if (result.ok) {
              form.reset();
              hideError();
              rememberSubscribedEmail(normalizedEmail);
              setStatus(statusEl, "success", getMessage("success"), "success");
              return;
            }

            if (result.reason === "duplicate") {
              rememberSubscribedEmail(normalizedEmail);
              setStatus(
                statusEl,
                "warning",
                getMessage("duplicate"),
                "duplicate",
              );
              return;
            }

            if (result.reason === "unavailable") {
              setStatus(
                statusEl,
                "error",
                getMessage("unavailable"),
                "unavailable",
              );
              return;
            }

            setStatus(statusEl, "error", getMessage("failed"), "failed");
          })
          .finally(() => {
            inFlight = false;
            toggleSubmitting(form, false);
          });
      });

      window.addEventListener("languageChanged", () => {
        if (!errorEl.hidden) {
          const { message } = validateEmail(emailInput.value);
          if (message) {
            errorEl.textContent = message;
          }
        }

        if (!statusEl.hidden) {
          const messageKey = statusEl.getAttribute("data-message-key");
          if (messageKey) {
            statusEl.textContent = getMessage(messageKey);
          }
        }
      });
    };

    const init = () => {
      const forms = document.querySelectorAll(".newsletter-form");
      if (!forms.length) return;
      forms.forEach((form) => {
        // Prevent static hosts from returning 405 if submit happens before
        // handlers are attached (or if another script fails early).
        form.setAttribute("method", "get");
        form.setAttribute("action", "");
        attachValidation(form);
      });
    };

    return { init };
  })();

  // ==========================================================================
  // VACANCIES PAGE MODULE
  // ==========================================================================

  const VacanciesModule = {
    initialized: false,
    jobs: [],
    hasLoadError: false,

    setPlaceholderState(placeholder, state) {
      if (!placeholder) return;
      placeholder.setAttribute("data-state", state);
      placeholder.setAttribute(
        "aria-busy",
        state === "loading" ? "true" : "false",
      );
    },

    getPageElements() {
      const placeholder = Utils.$("#vacatures-placeholder");
      const grid = Utils.$("#vacatures-grid");
      if (!placeholder || !grid) return null;
      return { placeholder, grid };
    },

    getLanguage() {
      return (
        INTEC.state.currentLanguage ||
        document.documentElement.getAttribute("data-language") ||
        document.documentElement.lang ||
        "nl"
      );
    },

    t(key, fallback) {
      return window.i18n?.[this.getLanguage()]?.[key] || fallback || "";
    },

    getFallback(key) {
      const nodes = this.getPageElements();
      if (!nodes) return "";
      return nodes.placeholder.dataset[key] || "";
    },

    formatDate(value) {
      if (!value) {
        return this.t(
          "vacancies.card.postedUnknown",
          this.getFallback("postedUnknown"),
        );
      }

      try {
        const lang = this.getLanguage().toLowerCase().startsWith("en")
          ? "en-GB"
          : "nl-BE";
        return new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(
          new Date(value),
        );
      } catch (error) {
        return value;
      }
    },

    escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (char) => {
        const map = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };
        return map[char] || char;
      });
    },

    createMetaItem(labelKey, fallback, value) {
      if (!value) return "";
      return `<li><strong>${this.t(labelKey, fallback)}:</strong> <span>${this.escapeHtml(value)}</span></li>`;
    },

    resolveTeamKey(job) {
      const source =
        `${job.team || ""} ${job.title || ""} ${job.description || ""}`.toLowerCase();

      if (/(security|cyber|soc|pentest|incident)/.test(source)) {
        return "security";
      }

      if (/(instruct|trainer|docent|teacher|python|opleiding)/.test(source)) {
        return "instructors";
      }

      if (/(infra|systeem|system|network|devops|cloud)/.test(source)) {
        return "infra";
      }

      if (/(administr|intake|admission|office|backoffice)/.test(source)) {
        return "admin";
      }

      if (/(talent|jobcoach|coaching|coach|begeleiding)/.test(source)) {
        return "talent";
      }

      return "general";
    },

    getTeamIconSvg(teamKey) {
      const icons = {
        security:
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3"></path><path d="M9 12l2 2 4-4"></path></svg>',
        instructors:
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h6v18H6a2 2 0 0 0-2 2V5z"></path><path d="M20 5a2 2 0 0 0-2-2h-6v18h6a2 2 0 0 1 2 2V5z"></path></svg>',
        infra:
          '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="6" rx="2"></rect><rect x="3" y="14" width="18" height="6" rx="2"></rect><path d="M7 7h.01"></path><path d="M7 17h.01"></path></svg>',
        admin:
          '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="4" width="12" height="17" rx="2"></rect><path d="M9 4.5h6a1 1 0 0 0 1-1v-.7a.8.8 0 0 0-.8-.8H8.8a.8.8 0 0 0-.8.8v.7a1 1 0 0 0 1 1z"></path><path d="M9 10h6"></path><path d="M9 14h6"></path><path d="M9 18h4"></path></svg>',
        talent:
          '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2v3"></path><path d="M12 19v3"></path><path d="M2 12h3"></path><path d="M19 12h3"></path></svg>',
        general:
          '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M3 13h18"></path></svg>',
      };

      return icons[teamKey] || icons.general;
    },

    normalizeSlug(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    },

    getJobSlug(job, index = 0) {
      const explicitSlug = this.normalizeSlug(job.slug || job.id || "");
      if (explicitSlug) return explicitSlug;

      const composedSlug = this.normalizeSlug(
        `${job.title || ""}-${job.team || ""}`,
      );
      if (composedSlug) return composedSlug;

      return `vacature-${index + 1}`;
    },

    buildDefaultApplyUrl(job) {
      const title = String(job?.title || "Vacature").trim();
      const fallbackMailto = `mailto:info@intecbrussel.be?subject=${encodeURIComponent(`Sollicitatie ${title}`)}`;
      return MailtoLinks.buildWebmailUrl(fallbackMailto) || fallbackMailto;
    },

    buildDetailsUrl(job, index = 0) {
      const configuredDetailsUrl = String(job?.detailsUrl || "").trim();
      if (configuredDetailsUrl) return configuredDetailsUrl;

      const slug = this.getJobSlug(job, index);
      return `vacature.html?job=${encodeURIComponent(slug)}`;
    },

    updateStructuredData(schema) {
      const id = "intec-vacancies-itemlist";
      let node = document.getElementById(id);

      if (!schema) {
        if (node) node.remove();
        return;
      }

      if (!node) {
        node = document.createElement("script");
        node.id = id;
        node.type = "application/ld+json";
        document.head.appendChild(node);
      }

      node.textContent = JSON.stringify(schema);
    },

    buildAbsoluteUrl(value) {
      try {
        return new URL(value, window.location.origin).toString();
      } catch (error) {
        return "";
      }
    },

    syncStructuredData() {
      if (this.hasLoadError || !this.jobs.length) {
        this.updateStructuredData(null);
        return;
      }

      const itemListElement = this.jobs
        .map((job, index) => {
          const url = this.buildAbsoluteUrl(this.buildDetailsUrl(job, index));
          if (!url) return null;

          return {
            "@type": "ListItem",
            position: index + 1,
            name: String(job?.title || `Vacature ${index + 1}`).trim(),
            url,
          };
        })
        .filter(Boolean);

      if (!itemListElement.length) {
        this.updateStructuredData(null);
        return;
      }

      const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: this.t("vacancies.meta.title", "Vacatures bij INTEC Brussel"),
        description: this.t(
          "vacancies.meta.description",
          "Ontdek openstaande vacatures bij INTEC Brussel.",
        ),
        numberOfItems: itemListElement.length,
        itemListElement,
      };

      this.updateStructuredData(schema);
    },

    render() {
      const nodes = this.getPageElements();
      if (!nodes) return;

      const { placeholder, grid } = nodes;

      if (this.hasLoadError) {
        placeholder.hidden = false;
        this.setPlaceholderState(placeholder, "error");
        placeholder.textContent = this.t(
          "vacancies.error",
          this.getFallback("errorMessage"),
        );
        grid.innerHTML = "";
        this.syncStructuredData();
        return;
      }

      if (!this.jobs.length) {
        placeholder.hidden = false;
        this.setPlaceholderState(placeholder, "empty");
        placeholder.textContent = this.t(
          "vacancies.empty",
          this.getFallback("emptyMessage"),
        );
        grid.innerHTML = "";
        this.syncStructuredData();
        return;
      }

      placeholder.hidden = true;
      this.setPlaceholderState(placeholder, "ready");

      const cards = this.jobs.map((job, index) => {
        const teamKey = this.resolveTeamKey(job);
        const iconSvg = this.getTeamIconSvg(teamKey);
        const badge = job.team
          ? `<span class="card__badge">${this.escapeHtml(job.team)}</span>`
          : "";

        const description = job.description
          ? `<p class="card__text">${this.escapeHtml(job.description)}</p>`
          : "";

        const meta = [
          this.createMetaItem(
            "vacancies.card.location",
            this.getFallback("locationLabel"),
            job.location,
          ),
          this.createMetaItem(
            "vacancies.card.posted",
            this.getFallback("postedLabel"),
            this.formatDate(job.posted),
          ),
        ]
          .filter(Boolean)
          .join("");

        const detailsUrl = this.buildDetailsUrl(job, index);
        const safeHref = this.escapeHtml(detailsUrl);
        const isHttpLink = /^https?:/i.test(detailsUrl);
        const targetAttrs = isHttpLink
          ? ' target="_blank" rel="noreferrer noopener"'
          : "";
        const ctaText = this.t(
          "vacancies.card.details",
          this.getFallback("buttonLabel"),
        );
        const ctaAriaLabel = job.title ? `${ctaText}: ${job.title}` : ctaText;

        return `
          <article class="card card--feature card--vacature fade-up" data-delay="${(index % 3) + 1}" data-team-key="${teamKey}">
            <div class="card__header align-start">
              <span class="card__icon" aria-hidden="true">${iconSvg}</span>
              <div>
                ${badge}
                <h3 class="card__title">${this.escapeHtml(job.title || "")}</h3>
              </div>
            </div>
            <div class="card__body">
              ${description}
              ${meta ? `<ul class="card__meta">${meta}</ul>` : ""}
            </div>
            <div class="card__footer card__footer--start">
              <a class="btn btn--primary card__cta" href="${safeHref}" aria-label="${this.escapeHtml(ctaAriaLabel)}"${targetAttrs}>${this.escapeHtml(ctaText)}</a>
            </div>
          </article>
        `;
      });

      grid.innerHTML = cards.join("");
      this.syncStructuredData();
    },

    async loadJobs() {
      const nodes = this.getPageElements();
      if (!nodes) return;

      nodes.placeholder.hidden = false;
      this.setPlaceholderState(nodes.placeholder, "loading");
      nodes.placeholder.textContent = this.t(
        "vacancies.loading",
        this.getFallback("loadingMessage"),
      );

      try {
        const response = await fetch("data/jobs.json", { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load jobs (${response.status})`);
        }
        const data = await response.json();
        this.jobs = Array.isArray(data) ? data : [];
        this.hasLoadError = false;
      } catch (error) {
        this.jobs = [];
        this.hasLoadError = true;
        Utils.log(`Vacancies load error: ${error.message}`, "warning");
      }

      this.render();
    },

    init() {
      if (this.initialized) return;
      if (!this.getPageElements()) return;

      this.initialized = true;
      this.loadJobs();
      window.addEventListener("languageChanged", () => this.render());
      window.addEventListener("intecLanguageChanged", () => this.render());
      Utils.log("Vacancies module initialized", "success");
    },
  };

  const VacancyDetailModule = {
    initialized: false,
    jobs: [],
    hasLoadError: false,
    redirected: false,

    setPlaceholderState(placeholder, state) {
      if (!placeholder) return;
      placeholder.setAttribute("data-state", state);
      placeholder.setAttribute(
        "aria-busy",
        state === "loading" ? "true" : "false",
      );
    },

    getPageElements() {
      const placeholder = Utils.$("#vacature-detail-placeholder");
      const content = Utils.$("#vacature-detail-content");
      const team = Utils.$("#vacature-detail-team");
      const title = Utils.$("#vacature-detail-title");
      const description = Utils.$("#vacature-detail-description");
      const meta = Utils.$("#vacature-detail-meta");
      const sections = Utils.$("#vacature-detail-sections");
      const applyButton = Utils.$("#vacature-detail-apply");

      if (
        !placeholder ||
        !content ||
        !team ||
        !title ||
        !description ||
        !meta ||
        !sections ||
        !applyButton
      ) {
        return null;
      }

      return {
        placeholder,
        content,
        team,
        title,
        description,
        meta,
        sections,
        applyButton,
      };
    },

    getLanguage() {
      return (
        INTEC.state.currentLanguage ||
        document.documentElement.getAttribute("data-language") ||
        document.documentElement.lang ||
        "nl"
      );
    },

    t(key, fallback) {
      return window.i18n?.[this.getLanguage()]?.[key] || fallback || "";
    },

    getFallback(key) {
      const nodes = this.getPageElements();
      if (!nodes) return "";
      return nodes.placeholder.dataset[key] || "";
    },

    formatDate(value) {
      if (!value) {
        return this.t(
          "vacancies.card.postedUnknown",
          this.getFallback("postedUnknown"),
        );
      }

      try {
        const lang = this.getLanguage().toLowerCase().startsWith("en")
          ? "en-GB"
          : "nl-BE";
        return new Intl.DateTimeFormat(lang, { dateStyle: "long" }).format(
          new Date(value),
        );
      } catch (error) {
        return value;
      }
    },

    getRequestedSlug() {
      try {
        const params = new URLSearchParams(window.location.search);
        return String(params.get("job") || "")
          .trim()
          .toLowerCase();
      } catch (error) {
        return "";
      }
    },

    findJobBySlug(slug) {
      if (!slug) return null;

      for (let index = 0; index < this.jobs.length; index += 1) {
        const job = this.jobs[index];
        if (VacanciesModule.getJobSlug(job, index) === slug) {
          return { job, index };
        }
      }

      return null;
    },

    normalizeText(value) {
      return String(value || "").trim();
    },

    normalizeList(value) {
      if (!Array.isArray(value)) return [];
      return value.map((item) => this.normalizeText(item)).filter(Boolean);
    },

    renderSection(title, bodyHtml) {
      return `
        <section class="vacature-detail-section">
          <h3 class="vacature-detail-section__title">${VacanciesModule.escapeHtml(title)}</h3>
          ${bodyHtml}
        </section>
      `;
    },

    renderTextSection(titleKey, fallbackTitle, value) {
      const text = this.normalizeText(value);
      if (!text) return "";
      const title = this.t(titleKey, fallbackTitle);
      const body = `<p class="vacature-detail-section__text">${VacanciesModule.escapeHtml(text)}</p>`;
      return this.renderSection(title, body);
    },

    renderListSection(titleKey, fallbackTitle, listValue) {
      const items = this.normalizeList(listValue);
      if (!items.length) return "";

      const title = this.t(titleKey, fallbackTitle);
      const listItems = items
        .map((item) => `<li>${VacanciesModule.escapeHtml(item)}</li>`)
        .join("");
      const body = `<ul class="vacature-detail-list">${listItems}</ul>`;
      return this.renderSection(title, body);
    },

    renderDetailSections(job, targetNode) {
      const sections = [
        this.renderTextSection(
          "vacancy.detail.section.overview",
          "Over de functie",
          job.overview,
        ),
        this.renderTextSection(
          "vacancy.detail.section.impact",
          "Impact",
          job.impact,
        ),
        this.renderListSection(
          "vacancy.detail.section.responsibilities",
          "Wat ga je doen",
          job.responsibilities,
        ),
        this.renderListSection(
          "vacancy.detail.section.profile",
          "Jouw profiel",
          job.profile,
        ),
        this.renderListSection(
          "vacancy.detail.section.offer",
          "Wat bieden wij",
          job.offer,
        ),
      ].filter(Boolean);

      if (!sections.length) {
        targetNode.hidden = true;
        targetNode.innerHTML = "";
        return;
      }

      targetNode.hidden = false;
      targetNode.innerHTML = sections.join("");
    },

    redirectToVacancies() {
      if (this.redirected) return;
      this.redirected = true;
      window.location.replace("vacatures.html");
    },

    getCanonicalUrl(job, index = 0) {
      const canonicalUrl = new URL("vacature.html", window.location.origin);
      if (job) {
        const slug = VacanciesModule.getJobSlug(job, index);
        if (slug) {
          canonicalUrl.searchParams.set("job", slug);
        }
      }
      return canonicalUrl.toString();
    },

    updateStructuredData(job, index = 0) {
      const id = "intec-vacancy-jobposting";
      let node = document.getElementById(id);

      if (!job) {
        if (node) node.remove();
        return;
      }

      const description = [
        String(job.description || "").trim(),
        String(job.overview || "").trim(),
      ]
        .filter(Boolean)
        .join("\n\n");

      const locationText =
        String(job.location || "Brussel").trim() || "Brussel";

      const schema = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: String(job.title || "Vacature").trim(),
        description,
        datePosted: String(job.posted || "").trim() || undefined,
        url: this.getCanonicalUrl(job, index),
        hiringOrganization: {
          "@type": "Organization",
          name: "INTEC Brussel",
          sameAs: "https://www.intecbrussel.be/",
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: locationText,
            addressCountry: "BE",
          },
        },
      };

      if (!schema.description) {
        delete schema.description;
      }
      if (!schema.datePosted) {
        delete schema.datePosted;
      }

      if (!node) {
        node = document.createElement("script");
        node.id = id;
        node.type = "application/ld+json";
        document.head.appendChild(node);
      }

      node.textContent = JSON.stringify(schema);
    },

    setPageMeta(job, index = 0) {
      const defaultTitle = this.t(
        "vacancy.detail.meta.title",
        "Vacature details | INTEC Brussel",
      );
      const title = String(job?.title || "").trim();
      document.title = title ? `${title} | INTEC Brussel` : defaultTitle;

      const defaultDescription = this.t(
        "vacancy.detail.meta.description",
        "Lees de vacaturedetails en solliciteer via e-mail.",
      );
      const description =
        String(job?.description || "").trim() || defaultDescription;

      const canonicalUrl = this.getCanonicalUrl(job, index);

      const setMetaContent = (selector, value) => {
        const node = Utils.$(selector);
        if (node) node.setAttribute("content", value);
      };

      setMetaContent('meta[name="description"]', description);
      setMetaContent('meta[property="og:title"]', document.title);
      setMetaContent('meta[property="og:description"]', description);
      setMetaContent('meta[property="og:url"]', canonicalUrl);
      setMetaContent('meta[name="twitter:title"]', document.title);
      setMetaContent('meta[name="twitter:description"]', description);

      const canonicalNode = Utils.$('link[rel="canonical"]');
      if (canonicalNode) {
        canonicalNode.setAttribute("href", canonicalUrl);
      }
    },

    render() {
      const nodes = this.getPageElements();
      if (!nodes) return;

      const {
        placeholder,
        content,
        team,
        title,
        description,
        meta,
        sections,
        applyButton,
      } = nodes;

      if (this.hasLoadError) {
        content.hidden = true;
        placeholder.hidden = false;
        this.setPlaceholderState(placeholder, "error");
        placeholder.textContent = this.t(
          "vacancy.detail.error",
          this.getFallback("errorMessage"),
        );
        this.setPageMeta(null);
        this.updateStructuredData(null);
        return;
      }

      if (!this.jobs.length) {
        this.redirectToVacancies();
        return;
      }

      const requestedSlug = this.getRequestedSlug();
      if (!requestedSlug) {
        this.redirectToVacancies();
        return;
      }

      const result = this.findJobBySlug(requestedSlug);

      if (!result) {
        this.redirectToVacancies();
        return;
      }

      const { job, index } = result;
      const teamKey = VacanciesModule.resolveTeamKey(job);
      const teamText = String(
        job.team || this.getFallback("teamLabel") || "",
      ).trim();
      const titleText = String(job.title || "").trim();
      const descriptionText = String(job.description || "").trim();
      const applyText = this.t(
        "vacancy.detail.apply",
        this.getFallback("applyLabel"),
      );

      team.hidden = !teamText;
      team.textContent = teamText;
      title.textContent = titleText;
      description.hidden = !descriptionText;
      description.textContent = descriptionText;

      const locationLabel = this.t(
        "vacancies.card.location",
        this.getFallback("locationLabel"),
      );
      const postedLabel = this.t(
        "vacancies.card.posted",
        this.getFallback("postedLabel"),
      );
      const formattedDate = this.formatDate(job.posted);

      const metaItems = [
        job.location
          ? `<li><strong>${VacanciesModule.escapeHtml(locationLabel)}:</strong> <span>${VacanciesModule.escapeHtml(job.location)}</span></li>`
          : "",
        formattedDate
          ? `<li><strong>${VacanciesModule.escapeHtml(postedLabel)}:</strong> <span>${VacanciesModule.escapeHtml(formattedDate)}</span></li>`
          : "",
      ]
        .filter(Boolean)
        .join("");

      meta.innerHTML = metaItems;
      this.renderDetailSections(job, sections);

      const configuredApplyUrl = String(job.applyUrl || "").trim();
      let applyHref = "";

      if (configuredApplyUrl) {
        applyHref = configuredApplyUrl.toLowerCase().startsWith("mailto:")
          ? MailtoLinks.buildWebmailUrl(configuredApplyUrl) ||
            configuredApplyUrl
          : configuredApplyUrl;
      } else {
        applyHref = VacanciesModule.buildDefaultApplyUrl(job);
      }

      applyButton.setAttribute("href", applyHref);
      if (/^https?:/i.test(applyHref)) {
        applyButton.setAttribute("target", "_blank");
        applyButton.setAttribute("rel", "noopener noreferrer");
      } else {
        applyButton.removeAttribute("target");
        applyButton.removeAttribute("rel");
      }
      applyButton.textContent = applyText;
      applyButton.setAttribute(
        "aria-label",
        titleText ? `${applyText}: ${titleText}` : applyText,
      );

      content.setAttribute("data-team-key", teamKey);
      content.setAttribute(
        "data-job-slug",
        VacanciesModule.getJobSlug(job, index),
      );

      placeholder.hidden = true;
      this.setPlaceholderState(placeholder, "ready");
      content.hidden = false;
      this.setPageMeta(job, index);
      this.updateStructuredData(job, index);
    },

    async loadJobs() {
      const nodes = this.getPageElements();
      if (!nodes) return;

      nodes.placeholder.hidden = false;
      this.setPlaceholderState(nodes.placeholder, "loading");
      nodes.placeholder.textContent = this.t(
        "vacancy.detail.loading",
        this.getFallback("loadingMessage"),
      );

      try {
        const response = await fetch("data/jobs.json", { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load jobs (${response.status})`);
        }

        const data = await response.json();
        this.jobs = Array.isArray(data) ? data : [];
        this.hasLoadError = false;
      } catch (error) {
        this.jobs = [];
        this.hasLoadError = true;
        Utils.log(`Vacancy detail load error: ${error.message}`, "warning");
      }

      this.render();
    },

    init() {
      if (this.initialized) return;
      if (!this.getPageElements()) return;

      this.initialized = true;
      this.loadJobs();
      window.addEventListener("languageChanged", () => this.render());
      window.addEventListener("intecLanguageChanged", () => this.render());
      Utils.log("Vacancy detail module initialized", "success");
    },
  };

  // ==========================================================================
  // PROGRAM CARD CONTENT HEIGHT BALANCING
  // ==========================================================================

  const ProgramCardsLayout = {
    initialized: false,

    collectCards(grid) {
      const cards = Utils.$$(".program-card", grid);
      if (cards.length < 2) return [];

      return cards.map((card) => ({
        title: Utils.$(".program-card__title", card),
        description: Utils.$(".program-card__description", card),
        meta: Utils.$(".program-card__meta", card),
      }));
    },

    resetHeights(cards) {
      cards.forEach(({ title, description, meta }) => {
        [title, description, meta].forEach((element) => {
          if (element) {
            element.style.minHeight = "";
          }
        });
      });
    },

    measureTallest(cards, key) {
      return cards.reduce((maxHeight, card) => {
        const element = card[key];
        if (!element) return maxHeight;
        return Math.max(
          maxHeight,
          Math.ceil(element.getBoundingClientRect().height),
        );
      }, 0);
    },

    applyToGrid(grid) {
      const cards = this.collectCards(grid);
      if (!cards.length) return;

      this.resetHeights(cards);

      // Keep mobile cards naturally compact; equalization is only needed in multi-column layouts.
      if (window.matchMedia("(max-width: 768px)").matches) return;

      const tallestTitle = this.measureTallest(cards, "title");
      const tallestDescription = this.measureTallest(cards, "description");
      const tallestMeta = this.measureTallest(cards, "meta");

      cards.forEach(({ title, description, meta }) => {
        if (title && tallestTitle > 0) {
          title.style.minHeight = `${tallestTitle}px`;
        }

        if (description && tallestDescription > 0) {
          description.style.minHeight = `${tallestDescription}px`;
        }

        if (meta && tallestMeta > 0) {
          meta.style.minHeight = `${tallestMeta}px`;
        }
      });
    },

    apply() {
      Utils.$$(".programs-showcase__grid").forEach((grid) => {
        this.applyToGrid(grid);
      });
    },

    init() {
      if (this.initialized) return;
      this.initialized = true;

      const scheduleApply = Utils.debounce(() => {
        requestAnimationFrame(() => this.apply());
      }, 120);

      scheduleApply();
      window.addEventListener("load", scheduleApply);
      window.addEventListener("resize", scheduleApply);
      window.addEventListener("languageChanged", scheduleApply);
      window.addEventListener("intecLanguageChanged", scheduleApply);
    },
  };

  // ==========================================================================
  // SECTION BACKGROUND ALTERNATION SYSTEM
  // ==========================================================================

  const SectionBackgrounds = {
    observer: null,
    config: {
      surfaceClass: "section--surface",
      altClass: "section--alt",
      excludeSelectors: [
        ".hero",
        ".section--hero",
        ".cta-band",
        ".section--cta",
        ".footer",
        ".about-hero",
        ".contact-hero",
        ".team-hero",
        ".opleidingen-hero",
        "[data-no-alternating]",
      ],
    },

    init() {
      this.apply();
      this.setupObserver();
      this.setupEventListeners();
      Utils.log("Section backgrounds initialized", "success");
    },

    apply() {
      const sections = Utils.$$("section, .section");
      if (sections.length === 0) return;

      const validSections = sections.filter((section) => {
        return !this.config.excludeSelectors.some((selector) =>
          section.matches(selector),
        );
      });

      // Remove existing classes
      validSections.forEach((section) => {
        section.classList.remove(
          this.config.surfaceClass,
          this.config.altClass,
        );
      });

      // Apply alternating classes
      validSections.forEach((section, index) => {
        const className =
          index % 2 === 0 ? this.config.surfaceClass : this.config.altClass;
        section.classList.add(className);
      });

      Utils.log(
        `Applied backgrounds to ${validSections.length} sections`,
        "info",
      );
    },

    setupObserver() {
      const throttledApply = Utils.throttle(() => this.apply(), 500);

      this.observer = new MutationObserver((mutations) => {
        const relevant = mutations.some((mutation) => {
          if (mutation.type === "childList") return true;
          if (mutation.type === "attributes") {
            const target = mutation.target;
            return target && target.tagName === "SECTION";
          }
          return false;
        });

        if (relevant) throttledApply();
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: false,
        attributes: true,
        attributeFilter: ["class"],
      });
    },

    setupEventListeners() {
      window.addEventListener(
        "resize",
        Utils.debounce(() => this.apply(), 250),
      );
      window.addEventListener("languageChanged", () => this.apply());
    },

    refresh() {
      this.apply();
    },
  };

  // ==========================================================================
  // FOOTER YEAR UPDATE
  // ==========================================================================

  const FooterYear = {
    init() {
      const year = String(new Date().getFullYear());
      Utils.$$("#footer-year, #year").forEach((node) => {
        node.textContent = year;
      });
    },
  };

  // ==========================================================================
  // SERVICE WORKER
  // ==========================================================================

  const ServiceWorker = {
    resolveRegistrationUrl() {
      const scripts = Array.from(document.getElementsByTagName("script"));
      for (let i = scripts.length - 1; i >= 0; i -= 1) {
        const src = scripts[i]?.getAttribute("src");
        if (!src || !src.includes("assets/js/main.js")) continue;
        try {
          return new URL("../../sw.js", new URL(src, window.location.href));
        } catch (error) {
          /* noop */
        }
      }

      try {
        return new URL("sw.js", window.location.href);
      } catch (error) {
        return new URL("/sw.js", window.location.origin);
      }
    },

    init() {
      if (
        !("serviceWorker" in navigator) ||
        window.location.protocol !== "https:"
      ) {
        return;
      }

      window.addEventListener("load", () => {
        const swUrl = this.resolveRegistrationUrl();
        navigator.serviceWorker
          .register(swUrl)
          .then((registration) => {
            Utils.log(
              `Service Worker registered: ${registration.scope}`,
              "success",
            );
          })
          .catch((error) => {
            Utils.log(
              `Service Worker registration skipped: ${error.message}`,
              "warning",
            );
          });
      });
    },
  };

  // ==========================================================================
  // MAIN INITIALIZATION
  // ==========================================================================

  function initialize() {
    const startTime = performance.now();

    try {
      // Initialize critical systems first for faster first render.
      DevToolsDetector.init();
      LanguageManager.init();
      LazyImages.init();
      StickyHeader.init();
      MobileNav.init();
      SmoothScroll.init();
      HashTargetFocus.init();
      MailtoLinks.init();
      ScrollAnimations.init();
      AccordionSystem.init();
      FormValidation.init();
      NewsletterValidation.init();
      FooterYear.init();
      ServiceWorker.init();

      // Defer non-critical modules to reduce main-thread work during LCP window.
      const initDeferredModules = () => {
        CounterAnimations.init();
        CourseCountdown.init();
        PartnerCarousel.init();
        SectionBackgrounds.init();
        VacanciesModule.init();
        VacancyDetailModule.init();
        ProgramCardsLayout.init();
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => initDeferredModules(), {
          timeout: 1200,
        });
      } else {
        setTimeout(initDeferredModules, 180);
      }

      INTEC.state.isInitialized = true;

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);

      Utils.log(`INTEC Brussels initialized in ${duration}ms`, "success");

      // Announce page ready for screen readers
      setTimeout(() => {
        const srOnly = document.createElement("div");
        srOnly.className = "sr-only";
        srOnly.setAttribute("role", "status");
        srOnly.setAttribute("aria-live", "polite");
        srOnly.textContent = "Page loaded successfully";
        document.body.appendChild(srOnly);
      }, 100);
    } catch (error) {
      Utils.log(`Initialization error: ${error.message}`, "error");
      console.error("Full error:", error);
    }
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  window.INTEC = Object.assign(INTEC, {
    Utils,
    LanguageManager,
    SmoothScroll,
    MailtoLinks,
    PartnerCarousel,
    AccordionSystem,
    FormValidation,
    SectionBackgrounds,
    NewsletterValidation,
    VacanciesModule,
    VacancyDetailModule,
    ProgramCardsLayout,

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
      Utils.log("Debug mode enabled", "info");
      console.log("INTEC Configuration:", INTEC.config);
      console.log("INTEC State:", INTEC.state);
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
          forms: FormValidation.forms.length,
        },
      };
    },
  });

  // ==========================================================================
  // START APPLICATION
  // ==========================================================================

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
