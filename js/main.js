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

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            portfolioItems.forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.classList.remove('hidden');
                    item.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

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

    // --- Contact Form ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span>Sending...</span>';
            btn.disabled = true;

            const formData = new FormData(contactForm);
            const data = {};
            formData.forEach((value, key) => data[key] = value);

            const subject = `New Enquiry from ${data.firstName} ${data.lastName}`;
            const body = `Name: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nPhone: ${data.phone || 'Not provided'}\nProject Type: ${data.projectType || 'Not specified'}\n\nMessage:\n${data.message}`;

            window.location.href = `mailto:info@studiochenille.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                contactForm.reset();
            }, 2000);
        });
    }

    // --- Parallax Effect on Hero ---
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            if (scrolled < window.innerHeight) {
                heroBg.style.transform = `scale(1.05) translateY(${scrolled * 0.3}px)`;
            }
        }, { passive: true });
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
