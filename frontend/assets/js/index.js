    (function() {
        'use strict';

        // ==========================================
        // LENIS SMOOTH SCROLL
        // ==========================================
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
        });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);

        // ==========================================
        // GSAP SCROLL ANIMATIONS
        // ==========================================
        gsap.registerPlugin(ScrollTrigger);

        document.querySelectorAll('.gs-reveal').forEach(el => {
            gsap.fromTo(el, { opacity: 0, y: 60 }, {
                opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
            });
        });

        // Animated stat counters
        document.querySelectorAll('.about-stat-number[data-target]').forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'), 10);
            ScrollTrigger.create({
                trigger: counter,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.to(counter, {
                        innerText: target,
                        duration: 1.8,
                        ease: 'power2.out',
                        snap: { innerText: 1 },
                        onUpdate: function () {
                            counter.textContent = Math.round(parseFloat(counter.textContent));
                        }
                    });
                }
            });
        });

        gsap.to('.hero-content', {
            y: -80, opacity: 0, ease: 'none',
            scrollTrigger: { trigger: '#premium-hero', start: 'top top', end: '60% top', scrub: 1 }
        });

        gsap.to('.hero-explore', {
            y: 150, ease: 'none',
            scrollTrigger: { trigger: '#premium-hero', start: 'top top', end: 'bottom top', scrub: 1 }
        });

        gsap.to('.hero-sky, .hero-mountain', {
            scale: 1.05, ease: 'none',
            scrollTrigger: { trigger: '#premium-hero', start: 'top top', end: 'bottom top', scrub: 1 }
        });

        // ==========================================
        // MAGNETIC BUTTONS
        // ==========================================





        // ==========================================
        // MAGNETIC BUTTONS
        // ==========================================
        document.querySelectorAll('.magnetic-btn').forEach(btn => {
            btn.addEventListener('mousemove', e => {
                const r = btn.getBoundingClientRect();
                btn.style.transform = 'translate(' + ((e.clientX - r.left - r.width/2) * 0.2) + 'px,' + ((e.clientY - r.top - r.height/2) * 0.2) + 'px)';
            });
            btn.addEventListener('mouseleave', () => { btn.style.transform = ''; btn.style.transition = 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)'; setTimeout(() => btn.style.transition = '', 400); });
        });

        // ==========================================
        // EXPERIENCES DUO CAROUSEL
        // ==========================================
        document.querySelectorAll('.exp-duo-card').forEach(function(card) {
            var slides = card.querySelectorAll('.exp-duo-slide');
            var nameEl = card.querySelector('.exp-duo-name');
            var locEl = card.querySelector('.exp-duo-location');
            var descEl = card.querySelector('.exp-duo-desc');
            var current = 0;

            function goTo(index) {
                slides[current].classList.remove('active');
                current = (index + slides.length) % slides.length;
                slides[current].classList.add('active');
                nameEl.textContent = slides[current].dataset.name;
                locEl.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + slides[current].dataset.location;
                if (descEl) descEl.textContent = slides[current].dataset.desc;
            }

            card.querySelector('.exp-duo-prev').addEventListener('click', function() { goTo(current - 1); });
            card.querySelector('.exp-duo-next').addEventListener('click', function() { goTo(current + 1); });
        });

        (function() {
            var carousel = document.getElementById('offer-carousel');
            var prevBtn = document.querySelector('.offer-prev');
            var nextBtn = document.querySelector('.offer-next');
            if (!carousel || !prevBtn || !nextBtn) return;
            var card = carousel.querySelector('.offer-card');
            if (!card) return;
            var scrollAmount = card.offsetWidth + 24;
            prevBtn.addEventListener('click', function() { carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); });
            nextBtn.addEventListener('click', function() { carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' }); });
        })();

        // ==========================================
        // TESTIMONIALS CAROUSEL
        // ==========================================
        (function() {
            var track = document.getElementById('testimonials-track');
            var prevBtn = document.querySelector('.testimonials-prev');
            var nextBtn = document.querySelector('.testimonials-next');
            if (!track || !prevBtn || !nextBtn) return;
            var card = track.querySelector('.testimonial-card');
            if (!card) return;
            var scrollAmount = card.offsetWidth + 24;
            prevBtn.addEventListener('click', function() { track.scrollBy({ left: -scrollAmount, behavior: 'smooth' }); });
            nextBtn.addEventListener('click', function() { track.scrollBy({ left: scrollAmount, behavior: 'smooth' }); });
        })();

        // ==========================================
        // LOAD DATA
        // ==========================================
        (async function loadHomepageData() {
            function escHtml(str) {
                var div = document.createElement('div');
                div.appendChild(document.createTextNode(str == null ? '' : String(str)));
                return div.innerHTML;
            }

            // Load page content sections
            try {
                const pcResult = await api.getPageContent();
                const sections = pcResult.sections || {};

                if (sections.hero) {
                    var s = sections.hero;
                    if (s.title) { var el = document.querySelector('.hero-kenya'); if (el) el.textContent = s.title; }
                    if (s.subtitle) { var el2 = document.querySelector('.hero-description'); if (el2) el2.textContent = s.subtitle; }
                    if (s.heading) { var el3 = document.querySelector('.intro-text h2'); if (el3) el3.innerHTML = s.heading.replace(/\n/g, '<br>'); }
                    if (s.description) { var el4 = document.querySelector('.intro-text p'); if (el4) el4.textContent = s.description; }
                    if (s.cta_text) { var el5 = document.querySelector('.hero-cta-white span'); if (el5) el5.textContent = s.cta_text; }
                }
                if (sections.kabura_venture) {
                    var s2 = sections.kabura_venture;
                    var sec = document.getElementById('kabura-venture');
                    if (sec) {
                        if (s2.grey_heading) { var g = sec.querySelector('.grey h2'); if (g) g.innerHTML = s2.grey_heading.replace(/\n/g, '<br>'); }
                        if (s2.heading) { var h = sec.querySelector('.venture-heading'); if (h) h.innerHTML = s2.heading.replace(/\n/g, '<br>'); }
                        if (s2.description) { var d = sec.querySelector('.venture-desc'); if (d) d.textContent = s2.description; }
                    }
                }
                if (sections.enjoy_safari) {
                    var s3 = sections.enjoy_safari;
                    var sec3 = document.getElementById('enjoy-safari');
                    if (sec3) {
                        if (s3.grey_heading) { var g3 = sec3.querySelector('.grey h2'); if (g3) g3.innerHTML = s3.grey_heading.replace(/\n/g, '<br>'); }
                        if (s3.heading) { var h3 = sec3.querySelector('.venture-heading'); if (h3) h3.innerHTML = s3.heading.replace(/\n/g, '<br>'); }
                        if (s3.description) { var d3 = sec3.querySelector('.venture-desc'); if (d3) d3.textContent = s3.description; }
                    }
                }
                if (sections.about_us) {
                    var s4 = sections.about_us;
                    var sec4 = document.getElementById('about-us');
                    if (sec4) {
                        if (s4.heading) { var h4 = sec4.querySelector('.about-us-heading'); if (h4) h4.textContent = s4.heading; }
                        if (s4.description) { var d4 = sec4.querySelector('.about-hero-desc'); if (d4) d4.textContent = s4.description; }
                        if (s4.stat1_number != null) { var st1 = sec4.querySelector('[data-target]'); if (st1) st1.setAttribute('data-target', s4.stat1_number); }
                        if (s4.stat1_label) { var sl1 = sec4.querySelector('.about-stat-label'); if (sl1) sl1.textContent = s4.stat1_label; }
                        var statItems = sec4.querySelectorAll('.about-stat-item');
                        if (statItems.length >= 2) {
                            if (s4.stat2_number != null) { var st2 = statItems[1].querySelector('[data-target]'); if (st2) st2.setAttribute('data-target', s4.stat2_number); }
                            if (s4.stat2_label) { var sl2 = statItems[1].querySelector('.about-stat-label'); if (sl2) sl2.textContent = s4.stat2_label; }
                        }
                        if (statItems.length >= 3) {
                            if (s4.stat3_number != null) { var st3 = statItems[2].querySelector('[data-target]'); if (st3) st3.setAttribute('data-target', s4.stat3_number); }
                            if (s4.stat3_label) { var sl3 = statItems[2].querySelector('.about-stat-label'); if (sl3) sl3.textContent = s4.stat3_label; }
                        }
                    }
                }
                if (sections.fly_with_us) {
                    var s5 = sections.fly_with_us;
                    var sec5 = document.getElementById('fly-with-us');
                    if (sec5) {
                        if (s5.grey_heading) { var g5 = sec5.querySelector('.grey h2'); if (g5) g5.innerHTML = s5.grey_heading.replace(/\n/g, '<br>'); }
                        if (s5.heading) { var h5 = sec5.querySelector('.venture-heading'); if (h5) h5.innerHTML = s5.heading.replace(/\n/g, '<br>'); }
                        if (s5.description) { var d5 = sec5.querySelector('.venture-desc'); if (d5) d5.textContent = s5.description; }
                    }
                }
                if (sections.testimonials) {
                    var s6 = sections.testimonials;
                    var sec6 = document.getElementById('testimonials');
                    if (sec6) {
                        if (s6.title) { var h6 = sec6.querySelector('.hp-section-title'); if (h6) h6.textContent = s6.title; }
                        if (s6.subtitle) { var d6 = sec6.querySelector('.hp-section-subtitle'); if (d6) d6.textContent = s6.subtitle; }
                    }
                }
                if (sections.featured_locations) {
                    var s7 = sections.featured_locations;
                    var sec7 = document.getElementById('featured-experiences');
                    if (sec7 && s7.title) { var h7 = sec7.querySelector('.hp-section-title'); if (h7) h7.textContent = s7.title; }
                }
                if (sections.what_we_offer) {
                    var s8 = sections.what_we_offer;
                    var sec8 = document.getElementById('what-we-offer');
                    if (sec8) {
                        if (s8.title) { var h8 = sec8.querySelector('.hp-section-title'); if (h8) h8.textContent = s8.title; }
                        if (s8.subtitle) { var d8 = sec8.querySelector('.hp-section-subtitle'); if (d8) d8.textContent = s8.subtitle; }
                    }
                }
            } catch (err) {
                console.log('Could not load page content:', err);
            }

            // Load thrilling locations
            try {
                const destResult = await api.getDestinations();
                const destinations = destResult.destinations || [];
                if (destinations.length) {
                    var duoCards = document.querySelectorAll('.exp-duo-card');
                    if (duoCards.length >= 2) {
                        var topItems = destinations.filter(function(d, i) { return i % 2 === 0; });
                        var botItems = destinations.filter(function(d, i) { return i % 2 === 1; });
                        if (botItems.length === 0) botItems = destinations.slice(Math.ceil(destinations.length / 2));

                        function buildDuoSlides(items) {
                            return items.map(function(d, i) {
                                return '<div class="exp-duo-slide' + (i === 0 ? ' active' : '') + '" data-name="' + escHtml(d.name) + '" data-location="' + escHtml(d.location_text || '') + '" data-desc="' + escHtml(d.description || '') + '">'
                                    + '<img src="' + escHtml(d.image_url) + '" alt="' + escHtml(d.name) + '" loading="lazy">'
                                    + '</div>';
                            }).join('');
                        }

                        function initDuoCard(card, items) {
                            if (!items.length) return;
                            var slidesContainer = card.querySelector('.exp-duo-slides');
                            slidesContainer.innerHTML = buildDuoSlides(items);
                            var slides = slidesContainer.querySelectorAll('.exp-duo-slide');
                            var nameEl = card.querySelector('.exp-duo-name');
                            var locEl = card.querySelector('.exp-duo-location');
                            var descEl = card.querySelector('.exp-duo-desc');
                            var current = 0;

                            nameEl.textContent = items[0].name;
                            locEl.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + (items[0].location_text || '');
                            if (descEl) descEl.textContent = items[0].description || '';

                            function goTo(index) {
                                slides[current].classList.remove('active');
                                current = (index + slides.length) % slides.length;
                                slides[current].classList.add('active');
                                nameEl.textContent = items[current].name;
                                locEl.innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + (items[current].location_text || '');
                                if (descEl) descEl.textContent = items[current].description || '';
                            }
                            card.querySelector('.exp-duo-prev').onclick = function() { goTo(current - 1); };
                            card.querySelector('.exp-duo-next').onclick = function() { goTo(current + 1); };
                        }

                        if (topItems.length) initDuoCard(duoCards[0], topItems);
                        if (botItems.length) initDuoCard(duoCards[1], botItems);
                    }
                } else {
                    document.querySelectorAll('.exp-duo-card').forEach(function(card) {
                        card.querySelector('.exp-duo-slides').innerHTML = '<div class="exp-duo-slide active"><img src="/assets/images/savannah.jpg" alt="Coming Soon" loading="lazy"></div>';
                        var n = card.querySelector('.exp-duo-name'); if (n) n.textContent = 'Coming Soon';
                        var l = card.querySelector('.exp-duo-location'); if (l) l.innerHTML = '<i class="fas fa-map-marker-alt"></i> Locations coming soon';
                        var d = card.querySelector('.exp-duo-desc'); if (d) d.textContent = 'Check back soon for thrilling location updates.';
                    });
                }
            } catch (err) {
                console.log('Could not load locations:', err);
            }

            // Load what we offer
            try {
                const offResult = await api.getOffers();
                const offers = offResult.offers || [];
                if (offers.length) {
                    var carousel = document.getElementById('offer-carousel');
                    if (carousel) {
                        carousel.innerHTML = offers.map(function(o) {
                            var img = o.image_url || '/assets/images/savannah.jpg';
                            return '<a href="' + escHtml(o.link_url || '#') + '" class="offer-card">'
                                + '<img src="' + escHtml(img) + '" alt="' + escHtml(o.title) + '" class="offer-card-img" loading="lazy">'
                                + '<div class="offer-card-overlay">'
                                + '<div class="offer-card-overlay-inner">'
                                + '<div class="offer-card-heading">'
                                + '<h3 class="offer-card-title">' + escHtml(o.title) + '</h3>'
                                + '<img src="/assets/images/right-arrow.png" alt="" class="offer-card-chevron" loading="lazy">'
                                + '</div>'
                                + '<p class="offer-card-desc">' + escHtml(o.description) + '</p>'
                                + '</div></div></a>';
                        }).join('');

                        var prevBtn = document.querySelector('.offer-prev');
                        var nextBtn = document.querySelector('.offer-next');
                        if (prevBtn && nextBtn) {
                            var card = carousel.querySelector('.offer-card');
                            if (card) {
                                var scrollAmt = card.offsetWidth + 24;
                                prevBtn.onclick = function() { carousel.scrollBy({ left: -scrollAmt, behavior: 'smooth' }); };
                                nextBtn.onclick = function() { carousel.scrollBy({ left: scrollAmt, behavior: 'smooth' }); };
                            }
                        }
                    }
                } else {
                    var carousel = document.getElementById('offer-carousel');
                    if (carousel) {
                        carousel.innerHTML = '<div class="offer-card">'
                            + '<img src="/assets/images/savannah.jpg" alt="Coming Soon" class="offer-card-img" loading="lazy">'
                            + '<div class="offer-card-overlay"><div class="offer-card-overlay-inner">'
                            + '<div class="offer-card-heading"><h3 class="offer-card-title">Coming Soon</h3></div>'
                            + '<p class="offer-card-desc">Our services are being set up. Check back soon!</p>'
                            + '</div></div></div>';
                    }
                }
            } catch (err) {
                console.log('Could not load offers:', err);
            }

            // Load testimonials
            try {
                const testResult = await api.getTestimonials();
                const testimonials = testResult.testimonials || [];
                const track = document.getElementById('testimonials-track');
                if (track && testimonials.length) {
                    track.innerHTML = testimonials.map(function(t) {
                        var stars = '';
                        for (var i = 0; i < (t.rating || 5); i++) stars += '<i class="fas fa-star"></i>';
                        var initials = t.initials || (t.name || 'A').split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
                        return '<div class="testimonial-card gs-reveal">'
                            + '<div class="testimonial-stars">' + stars + '</div>'
                            + '<p class="testimonial-text">"' + escHtml(t.text) + '"</p>'
                            + '<div class="testimonial-author">'
                            + '<div class="testimonial-avatar">' + escHtml(initials) + '</div>'
                            + '<div>'
                            + '<span class="testimonial-name">' + escHtml(t.name) + '</span>'
                            + '<span class="testimonial-from">' + escHtml(t.location || '') + '</span>'
                            + '</div></div></div>';
                    }).join('');

                    track.querySelectorAll('.gs-reveal').forEach(function(el) {
                        gsap.fromTo(el, { opacity: 0, y: 60 }, {
                            opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
                        });
                    });

                    var prevBtn = document.querySelector('.testimonials-prev');
                    var nextBtn = document.querySelector('.testimonials-next');
                    if (prevBtn && nextBtn) {
                        var card = track.querySelector('.testimonial-card');
                        if (card) {
                            var scrollAmt = card.offsetWidth + 24;
                            prevBtn.onclick = function() { track.scrollBy({ left: -scrollAmt, behavior: 'smooth' }); };
                            nextBtn.onclick = function() { track.scrollBy({ left: scrollAmt, behavior: 'smooth' }); };
                        }
                    }
                }
            } catch (err) {
                console.log('Could not load testimonials:', err);
            }
        })();

    })();
