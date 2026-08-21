

// ===== SMOOTH SCROLL (Lenis) =====
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smoothWheel: true,
  wheelMultiplier: 1.3,
  infinite: false,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);



/* ==========================================================
   Md Asif — navbar + banner interactions
   Requires: GSAP 3
========================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";

  /* ========================================================
     1) GLOBAL BUTTON ANIMATION  (reusable)
     Any element with [data-btn] gets it — nav, banner, future
     sections, and even buttons injected later (call
     window.SiteButtons.refresh()).
  ======================================================== */
  function initButtons(scope) {
    var root = scope || document;
    var buttons = root.querySelectorAll("[data-btn]");

    buttons.forEach(function (btn) {
      if (btn.dataset.btnReady === "true") return;
      btn.dataset.btnReady = "true";

      var icon = btn.querySelector("[data-btn-icon]");
      var shine = btn.querySelector("[data-btn-shine]");
      var arrows = btn.querySelectorAll("[data-btn-arrow]");
      var arrowOut = arrows[0] || null; // visible at rest
      var arrowIn = arrows[1] || null; // waits at bottom-left

      if (!hasGSAP || reduced) return;

      // resting state
      if (arrowIn) {
        gsap.set(arrowIn, { xPercent: -110, yPercent: 110, opacity: 0 });
      }

      var tl = gsap.timeline({
        paused: true,
        defaults: { duration: 0.45, ease: "power3.out" }
      });

      tl.to(btn, { y: -4, duration: 0.4 }, 0);

      if (icon) {
        tl.to(icon, { scale: 1, duration: 0.4 }, 0);
      }
      if (arrowOut) {
        // swipe out to top-right
        tl.to(arrowOut, { xPercent: 110, yPercent: -110, opacity: 0 }, 0);
      }
      if (arrowIn) {
        // swipe in from bottom-left
        tl.to(arrowIn, { xPercent: 0, yPercent: 0, opacity: 1 }, 0.08);
      }

      // shine sweep plays forward only (never rewinds)
      var shineTween = null;
      if (shine) {
        shineTween = gsap.fromTo(
          shine,
          { x: "-180%", skewX: -20 },
          {
            x: "260%",
            skewX: -20,
            duration: 0.85,
            ease: "power2.inOut",
            paused: true,
            immediateRender: false
          }
        );
      }

      function enter() {
        tl.timeScale(1).play();
        if (shineTween) shineTween.restart();
      }
      function leave() {
        tl.timeScale(1.35).reverse();
      }

      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      btn.addEventListener("focus", enter);
      btn.addEventListener("blur", leave);

      // press feedback (works on touch too)
      btn.addEventListener("pointerdown", function () {
        gsap.to(btn, { scale: 0.97, duration: 0.15, ease: "power2.out" });
        if (shineTween) shineTween.restart();
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
        btn.addEventListener(ev, function () {
          gsap.to(btn, { scale: 1, duration: 0.25, ease: "power2.out" });
        });
      });
    });
  }

  window.SiteButtons = { refresh: initButtons };

  /* ========================================================
     2) MOBILE MENU
  ======================================================== */
  function initMenu() {
    var toggle = document.getElementById("menuToggle");
    var menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    var bars = toggle.querySelectorAll(".bar");
    var open = false;
    var animating = false;

    function setBars(state) {
      if (!hasGSAP) return;
      if (state) {
        gsap.to(bars[0], { y: 7, rotate: 45, duration: 0.3, ease: "power2.out" });
        gsap.to(bars[1], { opacity: 0, duration: 0.2 });
        gsap.to(bars[2], { y: -7, rotate: -45, duration: 0.3, ease: "power2.out" });
      } else {
        gsap.to([bars[0], bars[2]], { y: 0, rotate: 0, duration: 0.3, ease: "power2.out" });
        gsap.to(bars[1], { opacity: 1, duration: 0.2, delay: 0.1 });
      }
    }

    function openMenu() {
      animating = true;
      menu.classList.remove("hidden");
      if (!hasGSAP || reduced) {
        animating = false;
      } else {
        gsap.fromTo(
          menu,
          { height: 0, opacity: 0 },
          {
            height: "auto",
            opacity: 1,
            duration: 0.4,
            ease: "power3.out",
            onComplete: function () {
              gsap.set(menu, { clearProps: "height" });
              animating = false;
            }
          }
        );
      }
      open = true;
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      setBars(true);
    }

    function closeMenu() {
      animating = true;
      if (!hasGSAP || reduced) {
        menu.classList.add("hidden");
        animating = false;
      } else {
        gsap.to(menu, {
          height: 0,
          opacity: 0,
          duration: 0.32,
          ease: "power3.inOut",
          onComplete: function () {
            menu.classList.add("hidden");
            gsap.set(menu, { clearProps: "height,opacity" });
            animating = false;
          }
        });
      }
      open = false;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      setBars(false);
    }

    toggle.addEventListener("click", function () {
      if (animating) return;
      open ? closeMenu() : openMenu();
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (open) closeMenu();
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && open) closeMenu();
    });
  }

  /* ========================================================
     3) BANNER ENTRANCE
  ======================================================== */
  function initBanner() {
    if (!hasGSAP || reduced) return;

    var items = document.querySelectorAll("[data-anim]");
    var media = document.querySelector("[data-anim-img]");

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.from("header nav", { y: -24, opacity: 0, duration: 0.7 }, 0);

    if (items.length) {
      tl.from(
        items,
        { y: 34, opacity: 0, duration: 0.9, stagger: 0.12 },
        0.15
      );
    }

    if (media) {
      // entrance: image scales in from slightly larger, feels like a push-in
      tl.from(
        media,
        { opacity: 0, scale: 1.18, duration: 1.2, ease: "power3.out" },
        0.1
      );

      // continuous eye-catching zoom — scale only, no y-shift, so it never
      // creeps past the section's overflow-hidden edge
      gsap.set(media, { transformOrigin: "50% 50%" });
      gsap.to(media, {
        scale: 1.06,
        duration: 3.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1.3
      });
    }
  }

  /* ======================================================== */
  function boot() {
    initButtons(document);
    initMenu();
    initBanner();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();








// ================= TRUSTED-BY LOGO SLIDER (Splide + AutoScroll) =================
document.addEventListener('DOMContentLoaded', () => {
  const trustedEl = document.querySelector('.trusted-slider');
  if (!trustedEl) return;
 
  const slideCount = trustedEl.querySelectorAll('.splide__slide').length;
 
  const trustedSplide = new Splide(trustedEl, {
    type: 'loop',
    direction: 'ltr',
    perPage: 6, // desktop: 6 cards per view
    gap: 32,
    arrows: false,
    pagination: false,
    drag: 'free',
    clones: slideCount * 4,
    breakpoints: {
      1440: { perPage: 5 },
      1200: { perPage: 4 },
      991: { perPage: 3, gap: 20 },
      776: { perPage: 2.5, gap: 16 },
      667: { perPage: 2, gap: 12 },
    },
    autoScroll: {
      speed: 0.5,
      pauseOnHover: true,
      pauseOnFocus: false,
    },
  });
 
  trustedSplide.on('mounted', () => {
    const autoScroll = trustedSplide.Components.AutoScroll;
    trustedSplide.on('drag', () => autoScroll.pause());
    trustedSplide.on('dragged', () => autoScroll.play());
  });
 
  trustedSplide.mount({ AutoScroll: window.splide.Extensions.AutoScroll });
});




// ================= STAT COUNTERS (GSAP + ScrollTrigger) =================
document.addEventListener("DOMContentLoaded", function () {
  var counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  var hasGSAP = typeof window.gsap !== "undefined";
  var hasST = typeof window.ScrollTrigger !== "undefined";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function format(num) {
    return Math.round(num).toLocaleString("en-US");
  }

  function setFinal(el, target, suffix) {
    el.textContent = format(target) + suffix;
  }

  if (!hasGSAP || reduced) {
    // no animation available/allowed — just show the final numbers
    counters.forEach(function (el) {
      var target = parseFloat(el.dataset.target || "0");
      var suffix = el.dataset.suffix || "";
      setFinal(el, target, suffix);
    });
    return;
  }

  if (hasST) gsap.registerPlugin(ScrollTrigger);

  counters.forEach(function (el) {
    var target = parseFloat(el.dataset.target || "0");
    var suffix = el.dataset.suffix || "";
    var proxy = { val: 0 };

    var tween = gsap.to(proxy, {
      val: target,
      duration: 2,
      ease: "power2.out",
      paused: true,
      onUpdate: function () {
        el.textContent = format(proxy.val) + suffix;
      },
      onComplete: function () {
        setFinal(el, target, suffix);
      }
    });

    if (hasST) {
      ScrollTrigger.create({
        trigger: el.closest("#results") || el,
        start: "top 80%",
        once: true,
        onEnter: function () {
          tween.play();
        }
      });
    } else {
      // no ScrollTrigger loaded — play once on page load
      tween.play();
    }
  });
});

//  Project showcase cursor pointer
document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".project-card");

  cards.forEach((card) => {
    const cursor = card.querySelector(".custom-cursor");
    if (!cursor) return;

    // Smooth physics configuration (0.7s duration for smooth trailing)
    const xTo = gsap.quickTo(cursor, "x", {
      duration: 0.7,
      ease: "power2.out"
    });
    const yTo = gsap.quickTo(cursor, "y", {
      duration: 0.7,
      ease: "power2.out"
    });

    let prevX = 0;

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();

      // Center badge on mouse position relative to card boundaries
      const mouseX = e.clientX - rect.left - cursor.offsetWidth / 2;
      const mouseY = e.clientY - rect.top - cursor.offsetHeight / 2;

      xTo(mouseX);
      yTo(mouseY);

      // Dynamic tilt during movement
      const deltaX = e.clientX - prevX;
      const tilt = Math.min(Math.max(deltaX * 0.15, -12), 12);
      gsap.to(cursor, {
        rotation: -6 + tilt,
        duration: 0.4,
        ease: "power1.out"
      });

      prevX = e.clientX;
    });

    // Reveal badge on enter
    card.addEventListener("mouseenter", () => {
      gsap.to(cursor, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.5)",
      });
    });

    // Hide badge on leave
    card.addEventListener("mouseleave", () => {
      gsap.to(cursor, {
        opacity: 0,
        scale: 0.4,
        duration: 0.3,
        ease: "power2.in",
      });
    });
  });
});


// 
document.addEventListener('DOMContentLoaded', function () {
  const splideElement = document.querySelector('.testimonials-slider');

  if (!splideElement || typeof Splide === 'undefined') {
    return;
  }

  const splide = new Splide(splideElement, {
    type: 'loop',
    perPage: 3.5,
    perMove: 1,
    gap: '24px',
    pagination: false,
    arrows: false,

    breakpoints: {
      1280: {
        perPage: 2,
      },
      768: {
        perPage: 1,
      },
    },
  });

  const progressBar = document.querySelector('.testimonial-progress-bar');
  const currentSlideEl = document.querySelector('.current-slide');
  const totalSlidesEl = document.querySelector('.total-slides');

  function updateProgress() {
    const index = splide.index;
    const total = splide.length;

    if (currentSlideEl) {
      currentSlideEl.textContent = index + 1;
    }

    if (totalSlidesEl) {
      totalSlidesEl.textContent = total;
    }

    if (progressBar && total) {
      const progress = ((index + 1) / total) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  splide.on('mounted move', updateProgress);

  splide.mount();

  const prevButton = document.querySelector('.testimonial-prev');
  const nextButton = document.querySelector('.testimonial-next');

  if (prevButton) {
    prevButton.addEventListener('click', function () {
      splide.go('<');
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function () {
      splide.go('>');
    });
  }
});

// Footer big name crsor follow

  const area = document.getElementById("ctaCursorArea");
  const cursorBtn = document.getElementById("customCursorBtn");

  const updateX = gsap.utils.pipe(
    gsap.utils.clamp(
      () => (cursorBtn.offsetWidth / 2) + 20, 
      () => document.documentElement.clientWidth - (cursorBtn.offsetWidth / 2) - 20
    ),
    gsap.quickTo(cursorBtn, "x", { duration: 0.4, ease: "power3.out" })
  );

  const updateY = gsap.quickTo(cursorBtn, "y", { duration: 0.4, ease: "power3.out" });

  area.addEventListener("mousemove", (e) => {
    updateX(e.clientX);
    updateY(e.clientY);
  });

  area.addEventListener("mouseenter", (e) => {
    const btnWidth = cursorBtn.offsetWidth;
    const padding = 20;
    const minX = (btnWidth / 2) + padding;
    const maxX = document.documentElement.clientWidth - (btnWidth / 2) - padding;
    const clampedX = Math.max(minX, Math.min(e.clientX, maxX));

    gsap.set(cursorBtn, { x: clampedX, y: e.clientY });

    gsap.to(cursorBtn, {
      opacity: 1,
      scale: 1, // scales up to full size (or whatever scale matches your CSS)
      duration: 0.3,
      ease: "back.out(1.7)"
    });
  });

  area.addEventListener("mouseleave", () => {
    gsap.to(cursorBtn, {
      opacity: 0,
      scale: 0,
      duration: 0.2,
      ease: "power2.in"
    });
  });