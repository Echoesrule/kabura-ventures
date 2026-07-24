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
            // Load featured tours
            try {
                const toursResult = await api.getTours({ featured: true, per_page: 4 });
                const tours = toursResult.tours || [];
                const featuredGrid = document.getElementById('featured-tours-grid');
                if (featuredGrid && tours.length) {
                    featuredGrid.innerHTML = tours.map(tour => {
                        const img = (tour.images && tour.images.length) ? tour.images.find(i => i.is_primary)?.image_url || tour.images[0].image_url : '/assets/images/savannah.jpg';
                        return '<a href="/tour-detail.html?id=' + tour.id + '" class="featured-tour-card">'
                            + '<img src="' + img + '" alt="' + (tour.title || '') + '" loading="lazy">'
                            + '<div class="featured-tour-info">'
                            + '<h3>' + (tour.title || '') + '</h3>'
                            + '<p>' + (tour.location || '') + '</p>'
                            + '<span class="price-amount" data-kes="' + (tour.price || 0) + '">' + formatPrice(tour.price || 0) + '</span>'
                            + '</div></a>';
                    }).join('');
                }
            } catch (err) {
                console.log('Could not load featured tours:', err);
            }

            // Load reviews into testimonials
            try {
                const reviewsResult = await api.getReviews({ per_page: 8 });
                const reviews = reviewsResult.reviews || [];
                const track = document.getElementById('testimonials-track');
                if (track && reviews.length) {
                    track.innerHTML = reviews.map(review => {
                        const initials = (review.user_name || 'A').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                        const stars = '<i class="fas fa-star"></i>'.repeat(Math.min(review.rating || 5, 5));
                        return '<div class="testimonial-card gs-reveal">'
                            + '<div class="testimonial-stars">' + stars + '</div>'
                            + '<p class="testimonial-text">"' + (review.comment || 'Great experience!') + '"</p>'
                            + '<div class="testimonial-author">'
                            + '<div class="testimonial-avatar">' + initials + '</div>'
                            + '<div>'
                            + '<span class="testimonial-name">' + (review.user_name || 'Traveler') + '</span>'
                            + '<span class="testimonial-from">Kenya</span>'
                            + '</div></div></div>';
                    }).join('');

                    // Re-init GSAP reveal for new cards
                    track.querySelectorAll('.gs-reveal').forEach(el => {
                        gsap.fromTo(el, { opacity: 0, y: 60 }, {
                            opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
                        });
                    });

                    // Re-init carousel navigation
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
                console.log('Could not load reviews:', err);
            }

            // Load destinations
            try {
                const destResult = await api.getDestinations();
                const destinations = destResult.destinations || [];
                if (destinations.length) {
                    console.log('Destinations loaded:', destinations.length);
                }
            } catch (err) {
                console.log('Could not load destinations:', err);
            }
        })();

    })();
