/* ============================================
   STUDIO CHENILLE — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // Stale-cache guard: HTML cached before the preloader was removed
    // still contains it, and without the old dismiss code it would sit
    // as a full-screen dark overlay forever.
    document.querySelectorAll('.preloader').forEach(el => el.remove());

    // --- Header Scroll ---
    const header = document.getElementById('header');
    const heroJourney = document.getElementById('heroJourney');

    function handleHeaderScroll() {
        // On the homepage the hero journey pins for several viewport
        // heights — keep the header transparent until the hero's bottom
        // edge scrolls up past the header.
        const heroHeight = heroJourney
            ? heroJourney.offsetHeight - 100
            : window.innerHeight - 100;
        if (window.scrollY > heroHeight) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // --- Logo click on the homepage: scroll to top, don't reload ---
    document.querySelectorAll('.nav-logo').forEach(logo => {
        logo.addEventListener('click', (e) => {
            const path = window.location.pathname;
            if (path === '/' || path.endsWith('/index.html')) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // --- Mobile Navigation ---
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // --- Scroll Animations ---
    const animateElements = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('animated');
                }, parseInt(delay));
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach(el => observer.observe(el));

    // --- Counter Animation ---
    const counters = document.querySelectorAll('[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                animateCounter(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));

    function animateCounter(element, target) {
        let current = 0;
        const increment = target / 60;
        const stepTime = 2000 / 60;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, stepTime);
    }

    // --- Portfolio Filter ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    function applyFilter(filter) {
        portfolioItems.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-category') === filter) {
                item.classList.remove('hidden');
                item.style.animation = 'fadeIn 0.5s ease forwards';
            } else {
                item.classList.add('hidden');
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.getAttribute('data-filter'));
        });
    });

    // Apply default filter on load (whichever button has .active)
    const activeBtn = document.querySelector('.filter-btn.active');
    if (activeBtn) {
        applyFilter(activeBtn.getAttribute('data-filter'));
    }

    // --- Portfolio ambient video loops ---
    // Hover-capable devices: the still comes alive on mouseenter and fades
    // back on leave (clips start on exactly the still frame). Touch devices
    // play the one tile in view instead, since hover doesn't exist there.
    // Static images remain for reduced-motion, Save-Data, and no-JS visitors.
    const videoTiles = document.querySelectorAll('.portfolio-image[data-video]');
    const conn = navigator.connection;
    const VIDEO_RATE = 0.65;
    if (videoTiles.length &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
        !(conn && conn.saveData) &&
        'IntersectionObserver' in window) {

        const hoverMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        // Tier by physical pixels (never CSS width alone): retina phones and
        // hi-DPI desktops get the 1440-class encode; only genuinely small
        // non-retina screens stay on the 720-class file.
        const dpr = window.devicePixelRatio || 1;
        const hdTier = dpr >= 1.5 || window.innerWidth * dpr > 1440;

        function tileSrc(tile) {
            return (hdTier && tile.getAttribute('data-video-hd')) ||
                tile.getAttribute('data-video');
        }

        function tileRate(tile) {
            return parseFloat(tile.getAttribute('data-video-rate')) || VIDEO_RATE;
        }

        function ensureVideo(tile) {
            let video = tile.querySelector('video');
            if (!video) {
                video = document.createElement('video');
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.preload = 'auto';
                video.setAttribute('muted', '');
                video.setAttribute('playsinline', '');
                video.setAttribute('aria-hidden', 'true');
                video.src = tileSrc(tile);
                video.defaultPlaybackRate = tileRate(tile);
                video.playbackRate = tileRate(tile);
                video.addEventListener('playing', () => {
                    tile.classList.add('video-live');
                });
                const overlay = tile.querySelector('.portfolio-overlay');
                tile.insertBefore(video, overlay || null);
            }
            return video;
        }

        // Touch devices have no hover, and playing every visible tile at
        // once reads as noise (and decodes 2-3 videos simultaneously).
        // Instead, spotlight the single tile nearest the viewport centre —
        // the motion follows the thumb, one room at a time, mirroring the
        // desktop's one-at-a-time hover. The settle delay keeps fast
        // flicks from flickering tiles on and off mid-scroll.
        const visibleTiles = new Set();
        let spotlightTile = null;
        let settleTimer = null;

        function stopTile(tile) {
            const video = tile.querySelector('video');
            if (video) video.pause();
            tile.classList.remove('video-live');
        }

        function pickSpotlight() {
            let best = null;
            let bestDist = Infinity;
            const mid = window.innerHeight / 2;
            visibleTiles.forEach(tile => {
                const r = tile.getBoundingClientRect();
                const dist = Math.abs(r.top + r.height / 2 - mid);
                if (dist < bestDist) { bestDist = dist; best = tile; }
            });
            if (best === spotlightTile) return;
            if (spotlightTile) stopTile(spotlightTile);
            spotlightTile = best;
            if (best) {
                const video = ensureVideo(best);
                video.playbackRate = tileRate(best);
                video.play().catch(() => {});
            }
        }

        function scheduleSpotlight() {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(pickSpotlight, 300);
        }

        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const tile = entry.target;
                if (entry.isIntersecting) {
                    ensureVideo(tile); // buffer early, play only on spotlight/hover
                    if (!hoverMode) {
                        visibleTiles.add(tile);
                        scheduleSpotlight();
                    }
                } else {
                    if (!hoverMode) {
                        visibleTiles.delete(tile);
                        if (tile === spotlightTile) spotlightTile = null;
                        scheduleSpotlight();
                    }
                    stopTile(tile);
                }
            });
        }, { threshold: 0.2 });

        if (!hoverMode) {
            window.addEventListener('scroll', scheduleSpotlight, { passive: true });
        }

        videoTiles.forEach(tile => {
            videoObserver.observe(tile);
            if (hoverMode) {
                tile.addEventListener('mouseenter', () => {
                    const video = ensureVideo(tile);
                    video.currentTime = 0;
                    video.playbackRate = tileRate(tile);
                    video.play().catch(() => {});
                });
                tile.addEventListener('mouseleave', () => {
                    const video = tile.querySelector('video');
                    if (video) {
                        video.pause();
                        tile.classList.remove('video-live');
                    }
                });
            }
        });
    }

    // --- Testimonials Slider ---
    const track = document.getElementById('testimonialTrack');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const dotsContainer = document.getElementById('testimonialDots');

    if (track) {
        const cards = track.querySelectorAll('.testimonial-card');
        let currentSlide = 0;

        if (cards.length > 0 && dotsContainer) {
            cards.forEach((_, i) => {
                const dot = document.createElement('div');
                dot.classList.add('testimonial-dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToSlide(i));
                dotsContainer.appendChild(dot);
            });

            function goToSlide(index) {
                currentSlide = index;
                track.style.transform = `translateX(-${index * 100}%)`;
                dotsContainer.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    currentSlide = currentSlide > 0 ? currentSlide - 1 : cards.length - 1;
                    goToSlide(currentSlide);
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    currentSlide = currentSlide < cards.length - 1 ? currentSlide + 1 : 0;
                    goToSlide(currentSlide);
                });
            }

            // Auto-advance
            let autoSlide = setInterval(() => {
                currentSlide = currentSlide < cards.length - 1 ? currentSlide + 1 : 0;
                goToSlide(currentSlide);
            }, 6000);

            track.addEventListener('mouseenter', () => clearInterval(autoSlide));
            track.addEventListener('mouseleave', () => {
                autoSlide = setInterval(() => {
                    currentSlide = currentSlide < cards.length - 1 ? currentSlide + 1 : 0;
                    goToSlide(currentSlide);
                }, 6000);
            });

            // Touch/swipe
            let touchStartX = 0;
            track.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            track.addEventListener('touchend', (e) => {
                const diff = touchStartX - e.changedTouches[0].screenX;
                if (Math.abs(diff) > 50) {
                    if (diff > 0) {
                        currentSlide = currentSlide < cards.length - 1 ? currentSlide + 1 : 0;
                    } else {
                        currentSlide = currentSlide > 0 ? currentSlide - 1 : cards.length - 1;
                    }
                    goToSlide(currentSlide);
                }
            }, { passive: true });
        }
    }

    // --- Contact Form (sends via FormSubmit) ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>Sending...</span>';
            btn.disabled = true;

            const formData = new FormData(contactForm);

            fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            })
            .then(() => showFormSuccess())
            .catch(() => showFormSuccess());

            function showFormSuccess() {
                const wrapper = contactForm.closest('.contact-form-wrapper');
                if (wrapper) {
                    wrapper.innerHTML = '<div style="text-align:center;padding:60px 20px;"><div style="width:64px;height:64px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div><h3 style="font-family:var(--font-heading);font-size:24px;margin-bottom:12px;">Thank You</h3><p style="color:var(--color-text-light);font-size:15px;line-height:1.7;max-width:360px;margin:0 auto;">Your enquiry has been received. We will be in touch within 24 hours.<br><br>If urgent, call us on <a href="tel:+441344249233" style="color:var(--color-accent);">+44 (0) 1344 249233</a></p></div>';
                }
            }
        });
    }

    // --- Nav anchor clicks jump straight to their section ---
    // The page scrolls smoothly by default, so an anchor click from the top
    // would ride the whole hero journey scrub on the way down. Nav clicks
    // are wayfinding, not sightseeing: jump instantly.
    document.querySelectorAll('a.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const root = document.documentElement;
            const prev = root.style.scrollBehavior;
            root.style.scrollBehavior = 'auto';
            target.scrollIntoView();
            root.style.scrollBehavior = prev;
            history.pushState(null, '', link.getAttribute('href'));
        });
    });

    // --- Active nav link on scroll ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });

    // --- Sticky CTA visibility ---
    const stickyCta = document.getElementById('stickyCta');
    if (stickyCta) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 600) {
                stickyCta.classList.add('visible');
            } else {
                stickyCta.classList.remove('visible');
            }
        }, { passive: true });
    }

    // --- Cookie Consent ---
    const cookieBanner = document.getElementById('cookieBanner');
    const cookieAccept = document.getElementById('cookieAccept');
    const cookieDecline = document.getElementById('cookieDecline');

    if (cookieBanner) {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setTimeout(() => {
                cookieBanner.classList.add('visible');
            }, 1500);
        }

        const updateGtagConsent = (state) => {
            if (typeof window.gtag === 'function') {
                window.gtag('consent', 'update', {
                    ad_storage: state,
                    ad_user_data: state,
                    ad_personalization: state,
                    analytics_storage: state
                });
            }
        };

        if (cookieAccept) {
            cookieAccept.addEventListener('click', () => {
                localStorage.setItem('cookie-consent', 'accepted');
                cookieBanner.classList.remove('visible');
                updateGtagConsent('granted');
            });
        }

        if (cookieDecline) {
            cookieDecline.addEventListener('click', () => {
                localStorage.setItem('cookie-consent', 'declined');
                cookieBanner.classList.remove('visible');
                updateGtagConsent('denied');
            });
        }
    }

    // --- FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.closest('.faq-item');
            const isActive = item.classList.contains('active');

            // Close all
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

            // Open clicked if not already active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
});

// Inject fadeIn keyframe
const style = document.createElement('style');
style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(style);
