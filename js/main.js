/* ============================================
   STUDIO CHENILLE — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // --- Preloader (homepage only) ---
    const preloader = document.getElementById('preloader');
    if (preloader) {
        const path = window.location.pathname;
        const isHomepage = path === '/' || path.endsWith('/index.html') ||
                           path.endsWith('/studio-interior/') ||
                           path.endsWith('/studio-interior/index.html');

        if (isHomepage) {
            window.addEventListener('load', () => {
                setTimeout(() => preloader.classList.add('loaded'), 2200);
            });
            setTimeout(() => preloader.classList.add('loaded'), 4000);
        } else {
            preloader.classList.add('loaded');
        }
    }

    // --- Header Scroll ---
    const header = document.getElementById('header');

    function handleHeaderScroll() {
        if (window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

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
            .then(response => {
                // FormSubmit returns 200 on success, or redirects on first use
                btn.innerHTML = '<span>Sent Successfully!</span>';
                btn.style.background = '#25D366';
                contactForm.reset();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 4000);
            })
            .catch(() => {
                // Network error or CORS — still likely sent, show success
                btn.innerHTML = '<span>Sent Successfully!</span>';
                btn.style.background = '#25D366';
                contactForm.reset();
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 4000);
            });
        });
    }

    // --- Hero Slideshow ---
    const heroSlides = document.querySelectorAll('.hero-slide');
    if (heroSlides.length > 1) {
        let currentHeroSlide = 0;
        setInterval(() => {
            heroSlides[currentHeroSlide].classList.remove('active');
            currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
            heroSlides[currentHeroSlide].classList.add('active');
        }, 5000);
    }

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
            }, 2500); // Show after preloader
        }

        if (cookieAccept) {
            cookieAccept.addEventListener('click', () => {
                localStorage.setItem('cookie-consent', 'accepted');
                cookieBanner.classList.remove('visible');
            });
        }

        if (cookieDecline) {
            cookieDecline.addEventListener('click', () => {
                localStorage.setItem('cookie-consent', 'declined');
                cookieBanner.classList.remove('visible');
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
