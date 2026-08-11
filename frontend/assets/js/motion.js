/* ============================================================
   KABURA MOTION — GSAP + ScrollTrigger entrance system
   Loaded site-wide via components.js. Safe, additive, guarded.
   - Never modifies the hero (#premium-hero) or its buttons.
   - Respects prefers-reduced-motion.
   - Exposes window.KaburaMotion { init, refresh, reveal }.
   ============================================================ */
(function () {
    'use strict';

    var GSAP_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    var SRT_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';

    var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Card containers rendered by page scripts (tours/hotels/destinations/category/index)
    var CONTAINERS = [
        { sel: '#tours-list', target: '.tour-card, .category-tour-card', stagger: 0.08 },
        { sel: '#hotels-list', target: '.hotel-stay-card:not([data-aos])', stagger: 0.08 },
        { sel: '#destinations-grid', target: '.dest-card', stagger: 0.1 },
        { sel: '#offer-carousel', target: '.offer-card', stagger: 0.08 },
        { sel: '#testimonials-track', target: '.testimonial-card', stagger: 0.08 }
    ];

    function isMobile() {
        return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
    }

    function done(el) { el.setAttribute('data-motion-done', '1'); }
    function isDone(el) { return el.getAttribute('data-motion-done') === '1'; }

    function loadScript(src, cb) {
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () { if (cb) cb(); };
        s.onerror = function () { if (cb) cb(); };
        document.head.appendChild(s);
    }

    // Single-element scroll reveal (fade + translate, once)
    function reveal(el, opts) {
        if (!el || isDone(el)) return;
        opts = opts || {};
        var distance = opts.distance != null ? opts.distance : (isMobile() ? 30 : 50);
        var from = { opacity: 0 };
        var to = {
            opacity: 1,
            duration: opts.duration || 0.9,
            ease: opts.ease || 'power3.out',
            delay: opts.delay || 0
        };
        if (opts.dir === 'x') { from.x = -distance; to.x = 0; }
        else { from.y = distance; to.y = 0; }
        to.scrollTrigger = { trigger: el, start: 'top 90%', once: true };
        gsap.fromTo(el, from, to);
        done(el);
    }

    // Grid/carousel reveal — one trigger on the container, staggered items
    function revealGrid(container, selector, stagger) {
        if (!container) return;
        var els = container.querySelectorAll(selector);
        var pending = [];
        Array.prototype.forEach.call(els, function (el) {
            if (!isDone(el)) pending.push(el);
        });
        if (!pending.length) return;
        gsap.fromTo(pending, { opacity: 0, y: isMobile() ? 30 : 40 }, {
            opacity: 1, y: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: stagger || 0.08,
            scrollTrigger: { trigger: container, start: 'top 88%', once: true }
        });
        pending.forEach(done);
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    function animateMobileMenu() {
        var overlay = document.getElementById('mobile-menu-overlay');
        if (!overlay || overlay.style.display !== 'block') return;
        overlay.style.opacity = '';
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' });
        var card = overlay.querySelector('.mobile-menu-card');
        if (card) gsap.fromTo(card, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.05, ease: 'power3.out' });
        var items = overlay.querySelectorAll('.mobile-menu-item, .mobile-menu-dropdown, .mobile-menu-section-label, .mobile-menu-card-header, .mobile-menu-login-row, .mobile-menu-signup-link, .mobile-menu-footer, .mobile-menu-roles, .mobile-menu-close');
        gsap.fromTo(items, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, delay: 0.1, ease: 'power2.out' });
    }

    function initNavigationAnimations() {
        if (window.toggleMobileMenu && !window.__kaburaMotionPatched) {
            var orig = window.toggleMobileMenu;
            window.__kaburaMotionPatched = true;
            window.toggleMobileMenu = function (open) {
                orig.apply(this, arguments);
                requestAnimationFrame(animateMobileMenu);
            };
        } else {
            var mo = new MutationObserver(animateMobileMenu);
            mo.observe(document.body, { childList: true, subtree: false });
        }
    }

    // ==========================================
    // SECTIONS (.gs-reveal and friends)
    // ==========================================
    function initSectionReveals() {
        document.querySelectorAll('.gs-reveal, .gs-reveal-left, .gs-reveal-right, .gs-reveal-scale').forEach(function (el) {
            if (isDone(el)) return;
            if (el.closest('#premium-hero')) return;
            var from = { opacity: 0, y: 50 };
            if (el.classList.contains('gs-reveal-left')) { from.x = -50; from.y = 0; }
            else if (el.classList.contains('gs-reveal-right')) { from.x = 50; from.y = 0; }
            else if (el.classList.contains('gs-reveal-scale')) { from.scale = 0.9; from.y = 0; }
            gsap.fromTo(el, from, {
                opacity: 1, x: 0, y: 0, scale: 1,
                duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 88%', once: true }
            });
            done(el);
        });
    }

    // ==========================================
    // HEADINGS (clip reveal)
    // ==========================================
    function initHeadingAnimations() {
        document.querySelectorAll('.hp-section-title, .about-us-heading, .venture-heading').forEach(function (el) {
            if (isDone(el)) return;
            if (el.closest('#premium-hero')) return;
            gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, {
                clipPath: 'inset(0 0 0% 0)',
                duration: 0.9, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 88%', once: true }
            });
            done(el);
        });
    }

    // ==========================================
    // STAT COUNTERS
    // ==========================================
    function initCounterAnimations() {
        document.querySelectorAll('.about-stat-number[data-target]').forEach(function (el) {
            if (isDone(el)) return;
            done(el);
            ScrollTrigger.create({
                trigger: el,
                start: 'top 88%',
                once: true,
                onEnter: function () {
                    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
                    var suffix = el.textContent.replace(/[0-9]/g, '').trim();
                    var obj = { v: 0 };
                    gsap.to(obj, {
                        v: target,
                        duration: 1.8,
                        ease: 'power2.out',
                        onUpdate: function () {
                            el.textContent = Math.round(obj.v) + (suffix ? ' ' + suffix : '');
                        }
                    });
                }
            });
        });
    }

    // ==========================================
    // FORMS (additive visual feedback only)
    // ==========================================
    function initFormAnimations() {
        document.addEventListener('submit', function (e) {
            var form = e.target;
            if (!form || form.tagName !== 'FORM') return;
            var invalid = [];
            Array.prototype.forEach.call(
                form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]), textarea, select'),
                function (field) {
                    if (field.disabled || !field.checkValidity) return;
                    if (!field.checkValidity()) invalid.push(field);
                }
            );
            if (!invalid.length) return;
            var group = invalid[0].closest('.form-group, .form-field, .field');
            invalid.forEach(function (f) { f.classList.add('motion-invalid'); });
            if (group) {
                group.classList.remove('motion-shake');
                void group.offsetWidth;
                group.classList.add('motion-shake');
            }
        });
        document.addEventListener('input', function (e) {
            var t = e.target;
            if (t && t.classList && t.classList.contains('motion-invalid')) {
                t.classList.remove('motion-invalid');
            }
        });
    }

    // ==========================================
    // MAP MARKERS (Leaflet pop-in)
    // ==========================================
    function initMapAnimations() {
        ['#dest-map', '#map'].forEach(function (sel) {
            var c = document.querySelector(sel);
            if (!c) return;
            var mo = new MutationObserver(function () {
                Array.prototype.forEach.call(
                    c.querySelectorAll('img.leaflet-marker-icon:not([data-motion-done])'),
                    function (img) {
                        img.setAttribute('data-motion-done', '1');
                        gsap.fromTo(img, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.6)' });
                    }
                );
            });
            mo.observe(c, { childList: true, subtree: true });
        });
    }

    // ==========================================
    // GALLERIES
    // ==========================================
    function initGalleryAnimations() {
        ['#tour-gallery-grid', '#hotel-gallery-grid'].forEach(function (sel) {
            var grid = document.querySelector(sel);
            if (!grid) return;
            Array.prototype.forEach.call(grid.children, function (item) {
                if (!item.classList.contains('motion-zoom')) item.classList.add('motion-zoom');
                reveal(item, { duration: 0.7 });
            });
        });
    }

    // ==========================================
    // FOOTER
    // ==========================================
    function initFooterAnimations() {
        var ph = document.getElementById('footer-placeholder');
        if (!ph) return;
        var shown = false;
        function animate() {
            if (shown) return;
            var footer = ph.querySelector('.footer');
            if (!footer) return;
            shown = true;
            gsap.fromTo(footer, { opacity: 0, y: 30 }, {
                opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
                scrollTrigger: { trigger: footer, start: 'top 95%', once: true }
            });
        }
        var mo = new MutationObserver(animate);
        mo.observe(ph, { childList: true, subtree: true });
        animate();
    }

    // ==========================================
    // CARD GRIDS (static + dynamically rendered)
    // ==========================================
    function initCardAnimations() {
        CONTAINERS.forEach(function (cfg) {
            var container = document.querySelector(cfg.sel);
            if (!container) return;
            revealGrid(container, cfg.target, cfg.stagger);
            var mo = new MutationObserver(function () {
                revealGrid(container, cfg.target, cfg.stagger);
                if (window.ScrollTrigger) ScrollTrigger.refresh();
            });
            mo.observe(container, { childList: true, subtree: false });
        });
    }

    // ==========================================
    // AUTO-SCROLL CAROUSELS (offer / testimonials / exp-duo)
    // Pauses on hover or touch-drag, resumes on leave.
    // ==========================================
    // Step carousel: ~3 cards sit for `dwell` ms, then a single card
    // glides out left / in from right (soft power3.inOut), then hold
    // again. Content is cloned so the wrap to the start is seamless
    // (no rewind sweep), and scroll-snap is suspended only while the
    // glide runs so it never fights the motion.
    function autoScrollCarousel(id, dwell) {
        var el = document.getElementById(id);
        if (!el) return;
        var timer = null;
        var glide = null;
        var loopEnd = 0;
        var stepAmount = 0;

        function rebuildLoop() {
            if (mo) mo.disconnect();
            var children = Array.prototype.slice.call(el.children);
            var originals = children.filter(function (c) { return c.getAttribute('data-kabura-clone') !== '1'; });
            if (originals.length < 2) { loopEnd = 0; if (mo) mo.observe(el, { childList: true }); return; }
            children.forEach(function (c) {
                if (c.getAttribute('data-kabura-clone') === '1') c.parentNode.removeChild(c);
            });
            var step = originals[1].offsetLeft - originals[0].offsetLeft;
            // Repeat the original set until the track is long enough that the
            // last card is always followed immediately by the first (no empty
            // slots), regardless of viewport width.
            var viewSlots = Math.max(1, Math.round(el.clientWidth / (step || 1)));
            var sets = Math.max(1, Math.ceil((2 * viewSlots) / originals.length));
            for (var s = 0; s < sets; s++) {
                originals.forEach(function (c) {
                    var clone = c.cloneNode(true);
                    clone.setAttribute('data-kabura-clone', '1');
                    clone.setAttribute('data-motion-done', '1');
                    clone.classList.remove('gs-reveal', 'gs-reveal-left', 'gs-reveal-right', 'gs-reveal-scale', 'active');
                    clone.style.opacity = '';
                    clone.style.transform = '';
                    el.appendChild(clone);
                });
            }
            loopEnd = el.children[originals.length].offsetLeft - el.children[0].offsetLeft;
            stepAmount = step;
            el.scrollLeft = 0;
            if (mo) mo.observe(el, { childList: true });
        }

        function finishGlide(target) {
            glide = null;
            el.scrollLeft = target;
            if (target >= loopEnd - 1) el.scrollLeft -= loopEnd;
            el.style.scrollSnapType = '';
            resume();
        }

        function glideTo(target) {
            var start = el.scrollLeft;
            if (Math.abs(target - start) < 2) { resume(); return; }
            el.style.scrollSnapType = 'none';
            var obj = { v: start };
            glide = gsap.to(obj, {
                v: target,
                duration: 1.2,
                ease: 'power3.inOut',
                onUpdate: function () { el.scrollLeft = obj.v; },
                onComplete: function () { finishGlide(target); }
            });
        }

        function advance() {
            stop();
            if (document.hidden || !loopEnd || !stepAmount) { resume(); return; }
            glideTo(el.scrollLeft + stepAmount);
        }

        function start() { if (!timer) timer = setInterval(advance, dwell); }
        function stop() { if (timer) { clearInterval(timer); timer = null; } }
        function pause() {
            stop();
            if (glide) { glide.kill(); glide = null; }
        }
        function resume() { if (!timer) timer = setInterval(advance, dwell); }

        el.style.scrollBehavior = 'auto';
        var mo = new MutationObserver(function () { rebuildLoop(); start(); });
        mo.observe(el, { childList: true });
        rebuildLoop();
        start();

        el.addEventListener('mouseenter', pause, { passive: true });
        el.addEventListener('mouseleave', resume, { passive: true });
        el.addEventListener('touchstart', pause, { passive: true });
        el.addEventListener('touchend', resume, { passive: true });
    }

    function initAutoScroll() {
        autoScrollCarousel('offer-carousel', 4000);
        autoScrollCarousel('testimonials-track', 4000);
        document.querySelectorAll('.exp-duo-card').forEach(function (card) {
            var next = card.querySelector('.exp-duo-next');
            if (!next) return;
            var timer = null;
            function tick() { if (!document.hidden) next.click(); }
            function start() { if (!timer) timer = setInterval(tick, 5000); }
            function stop() { if (timer) { clearInterval(timer); timer = null; } }
            card.addEventListener('mouseenter', stop, { passive: true });
            card.addEventListener('mouseleave', start, { passive: true });
            card.addEventListener('touchstart', stop, { passive: true });
            card.addEventListener('touchend', start, { passive: true });
            start();
        });
    }

    // ==========================================
    // INIT / REFRESH
    // ==========================================
    function init() {
        if (REDUCED) return;
        if (!window.gsap) return;
        gsap.registerPlugin(ScrollTrigger);
        initNavigationAnimations();
        initSectionReveals();
        initHeadingAnimations();
        initCounterAnimations();
        initFormAnimations();
        initMapAnimations();
        initGalleryAnimations();
        initFooterAnimations();
        initCardAnimations();
        initAutoScroll();
        window.addEventListener('load', function () { ScrollTrigger.refresh(); }, { passive: true });
    }

    function refresh() {
        if (REDUCED || !window.gsap) return;
        initSectionReveals();
        initHeadingAnimations();
        initCounterAnimations();
        initGalleryAnimations();
        CONTAINERS.forEach(function (cfg) {
            var c = document.querySelector(cfg.sel);
            if (c) revealGrid(c, cfg.target, cfg.stagger);
        });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
    }

    window.KaburaMotion = {
        init: init,
        refresh: refresh,
        reveal: function (el) { reveal(el); }
    };

    // Page-load fade-in (CSS animation, guarded)
    document.body.classList.add('motion-page');

    function boot() {
        if (REDUCED) return;
        if (window.gsap) {
            if (window.ScrollTrigger) init();
            else loadScript(SRT_SRC, init);
            return;
        }
        loadScript(GSAP_SRC, function () {
            if (window.gsap) {
                if (window.ScrollTrigger) init();
                else loadScript(SRT_SRC, init);
            } else {
                document.documentElement.classList.add('motion-no-gsap');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
