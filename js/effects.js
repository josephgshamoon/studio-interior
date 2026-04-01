/* ============================================
   STUDIO CHENILLE — Premium Visual Effects
   All vanilla JS, no dependencies
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- Scroll Progress Indicator ---
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    document.body.appendChild(scrollProgress);

    // --- Shared Scroll Handler (RAF-throttled) ---
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                // Scroll progress
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (docHeight > 0) {
                    scrollProgress.style.transform = `scaleX(${scrollTop / docHeight})`;
                }

                // About parallax
                if (aboutImg && !prefersReducedMotion && window.innerWidth > 768) {
                    const rect = aboutImg.getBoundingClientRect();
                    const center = rect.top + rect.height / 2;
                    const offset = (window.innerHeight / 2 - center) * 0.06;
                    aboutImg.style.transform = `translateY(${offset}px) scale(1.05)`;
                }

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // --- About Section Parallax ---
    const aboutImg = document.querySelector('.about-image-wrapper img');
    if (aboutImg) {
        aboutImg.style.willChange = 'transform';
        aboutImg.style.transform = 'scale(1.05)';
    }

    // --- Portfolio Gold Wipe Reveal ---
    if (!prefersReducedMotion) {
        const wipeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.getAttribute('data-delay') || 0;
                    setTimeout(() => {
                        entry.target.classList.add('wipe-reveal');
                    }, parseInt(delay));
                    wipeObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.portfolio-item').forEach(item => {
            wipeObserver.observe(item);
        });
    } else {
        // Show images immediately if reduced motion
        document.querySelectorAll('.portfolio-item .portfolio-image img').forEach(img => {
            img.style.opacity = '1';
        });
    }

    // --- Blur-Up Images ---
    if (!prefersReducedMotion) {
        const blurObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
                    if (img.complete) img.classList.add('loaded');
                    blurObserver.unobserve(img);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.about-image-wrapper img, .blog-card-image img').forEach(img => {
            img.classList.add('blur-up');
            blurObserver.observe(img);
        });
    }

    // --- Text Split Animation ---
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && !prefersReducedMotion) {
        // Remove existing data-animate to prevent conflict
        heroTitle.removeAttribute('data-animate');
        heroTitle.removeAttribute('data-delay');

        function splitText(element) {
            const nodes = Array.from(element.childNodes);
            element.innerHTML = '';

            let charIndex = 0;
            nodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const words = node.textContent.split(/\s+/).filter(w => w.length > 0);
                    words.forEach((word, wi) => {
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'split-word';
                        word.split('').forEach(char => {
                            const charSpan = document.createElement('span');
                            charSpan.className = 'split-char';
                            charSpan.style.setProperty('--i', charIndex);
                            charSpan.textContent = char;
                            wordSpan.appendChild(charSpan);
                            charIndex++;
                        });
                        element.appendChild(wordSpan);
                        if (wi < words.length - 1) {
                            element.appendChild(document.createTextNode(' '));
                        }
                    });
                } else if (node.nodeName === 'BR') {
                    element.appendChild(document.createElement('br'));
                } else if (node.nodeName === 'SPAN') {
                    // Preserve accent span
                    const accentSpan = node.cloneNode(false);
                    const innerWords = node.textContent.split(/\s+/).filter(w => w.length > 0);
                    innerWords.forEach((word, wi) => {
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'split-word';
                        word.split('').forEach(char => {
                            const charSpan = document.createElement('span');
                            charSpan.className = 'split-char';
                            charSpan.style.setProperty('--i', charIndex);
                            charSpan.textContent = char;
                            wordSpan.appendChild(charSpan);
                            charIndex++;
                        });
                        accentSpan.appendChild(wordSpan);
                        if (wi < innerWords.length - 1) {
                            accentSpan.appendChild(document.createTextNode(' '));
                        }
                    });
                    element.appendChild(accentSpan);
                }
            });
        }

        splitText(heroTitle);

        // Trigger after preloader
        const path = window.location.pathname;
        const isHomepage = path === '/' || path.endsWith('/index.html') ||
                           path.endsWith('/studio-interior/') ||
                           path.endsWith('/studio-interior/index.html');
        const delay = isHomepage ? 2400 : 300;

        setTimeout(() => {
            heroTitle.classList.add('split-animated');
        }, delay);
    }


    // --- Portfolio Lightbox ---
    const portfolioImages = document.querySelectorAll('.portfolio-image');
    if (portfolioImages.length > 0) {
        // Create lightbox DOM
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.innerHTML = `
            <div class="lightbox-backdrop"></div>
            <div class="lightbox-content">
                <img src="" alt="">
                <div class="lightbox-info"><h3></h3><p></p></div>
            </div>
            <button class="lightbox-close" aria-label="Close lightbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <button class="lightbox-nav lightbox-prev" aria-label="Previous image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button class="lightbox-nav lightbox-next" aria-label="Next image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
        `;
        document.body.appendChild(lightbox);

        const lbImg = lightbox.querySelector('.lightbox-content img');
        const lbTitle = lightbox.querySelector('.lightbox-info h3');
        const lbDesc = lightbox.querySelector('.lightbox-info p');
        let currentLbIndex = 0;
        const items = Array.from(portfolioImages);

        function openLightbox(index) {
            currentLbIndex = index;
            const item = items[index];
            const img = item.querySelector('img');
            const title = item.querySelector('.portfolio-title');
            const desc = item.querySelector('.portfolio-desc');

            // Use higher res version
            let src = img.src;
            if (src.includes('unsplash.com')) {
                src = src.replace(/w=\d+/, 'w=1600');
            }
            lbImg.src = src;
            lbImg.alt = img.alt;
            lbTitle.textContent = title ? title.textContent : '';
            lbDesc.textContent = desc ? desc.textContent : '';

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function navigateLb(dir) {
            // Filter visible items
            const visible = items.filter(item => !item.classList.contains('hidden'));
            const currentInVisible = visible.indexOf(items[currentLbIndex]);
            let newIndex = currentInVisible + dir;
            if (newIndex >= visible.length) newIndex = 0;
            if (newIndex < 0) newIndex = visible.length - 1;
            const newGlobalIndex = items.indexOf(visible[newIndex]);
            openLightbox(newGlobalIndex);
        }

        items.forEach((item, i) => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => openLightbox(i));
        });

        lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
        lightbox.querySelector('.lightbox-prev').addEventListener('click', () => navigateLb(-1));
        lightbox.querySelector('.lightbox-next').addEventListener('click', () => navigateLb(1));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLb(-1);
            if (e.key === 'ArrowRight') navigateLb(1);
        });

        // Touch swipe in lightbox
        let lbTouchStart = 0;
        lightbox.addEventListener('touchstart', (e) => {
            lbTouchStart = e.changedTouches[0].screenX;
        }, { passive: true });
        lightbox.addEventListener('touchend', (e) => {
            const diff = lbTouchStart - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                navigateLb(diff > 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    // --- Magnetic Buttons ---
    if (hasHover && !prefersReducedMotion) {
        document.querySelectorAll('.btn').forEach(btn => {
            btn.classList.add('btn-magnetic');

            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // --- Page Transitions ---
    if (!prefersReducedMotion) {
        const transition = document.createElement('div');
        transition.className = 'page-transition';
        document.body.appendChild(transition);

        // Fade in on page load
        if (transition.classList.contains('entering')) {
            setTimeout(() => {
                transition.classList.remove('entering');
                transition.classList.add('exiting');
                setTimeout(() => transition.classList.remove('exiting'), 500);
            }, 100);
        }

        // Intercept internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Skip anchors, external links, mailto, tel, same page
            if (href.startsWith('#') || href.startsWith('mailto:') ||
                href.startsWith('tel:') || href.startsWith('http') ||
                href.startsWith('wa.me') || link.target === '_blank') return;

            e.preventDefault();
            transition.classList.add('entering');
            setTimeout(() => {
                window.location.href = href;
            }, 450);
        });
    }

});
