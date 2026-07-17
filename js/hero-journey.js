/* ============================================
   STUDIO CHENILLE — Hero Journey Engine
   Scroll-scrubbed pinned hero: as the visitor scrolls,
   they travel deeper into the home.

   Modes:
   - zoom  (default): layered zoom-through of portfolio images
   - video: canvas frame-sequence scrub. Activates automatically
     when images/hero/manifest.json exists (see
     tools/hero-video-to-frames.sh and HIGGSFIELD-HERO-RECIPE.md).
   ============================================ */

(function () {
    'use strict';

    var wrapper = document.getElementById('heroJourney');
    if (!wrapper) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return; // classic static hero

    // Sticky pinning needs overflow-x: clip on <body> (hidden would break
    // it) — browsers too old for clip get the classic static hero instead.
    if (!(window.CSS && CSS.supports && CSS.supports('overflow-x', 'clip'))) return;

    var hero = wrapper.querySelector('.hero');
    var layers = Array.prototype.slice.call(wrapper.querySelectorAll('.hero-layer'));
    var canvas = document.getElementById('heroCanvas');
    var content = wrapper.querySelector('.hero-content');
    var finale = wrapper.querySelector('.hero-finale');
    var vignette = wrapper.querySelector('.hero-vignette');
    var scrollHint = wrapper.querySelector('.hero-scroll');

    wrapper.classList.add('is-journey');

    /* ---------- helpers ---------- */

    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    // progress of p through [a, b]
    function span(p, a, b) { return clamp01((p - a) / (b - a)); }

    function smooth(t) { return t * t * (3 - 2 * t); } // smoothstep

    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ---------- scroll progress with inertia ---------- */

    var target = 0;      // raw scroll progress 0..1
    var current = -1;    // smoothed progress (forces first paint)
    var rafId = null;
    var lastTime = 0;

    function readProgress() {
        var travel = wrapper.offsetHeight - window.innerHeight;
        if (travel <= 0) { target = 0; return; }
        var y = -wrapper.getBoundingClientRect().top;
        target = clamp01(y / travel);
    }

    function tick(now) {
        var dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
        lastTime = now;
        // time-normalised exponential smoothing (~feels like a heavy camera)
        var k = 1 - Math.exp(-7 * dt);
        current = current < 0 ? target : lerp(current, target, k);
        if (Math.abs(target - current) < 0.0004) current = target;
        render(current);
        if (current !== target) {
            rafId = requestAnimationFrame(tick);
        } else {
            rafId = null;
            lastTime = 0;
        }
    }

    function requestRender() {
        readProgress();
        if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', function () {
        if (mode === 'video') sizeCanvas();
        requestRender();
    });

    /* ---------- shared text choreography ---------- */

    function renderText(p) {
        // Opening titles: hold, then rise away as we move in
        var out = smooth(span(p, 0.06, 0.22));
        content.style.opacity = String(1 - out);
        content.style.transform = 'translateY(' + (-46 * out) + 'px)';
        content.style.visibility = out >= 1 ? 'hidden' : 'visible';

        // Scroll hint disappears as soon as the journey starts
        if (scrollHint) {
            var hintOut = span(p, 0.01, 0.07);
            scrollHint.style.opacity = String(1 - hintOut);
        }

        // Vignette deepens on arrival
        if (vignette) {
            vignette.style.opacity = String(0.9 * smooth(span(p, 0.72, 0.96)));
        }

        // Finale: arrival statement + CTAs — lands after the room resolves
        if (finale) {
            var fin = smooth(span(p, 0.86, 0.97));
            finale.style.opacity = String(fin);
            finale.style.transform = 'translateY(' + (34 * (1 - fin)) + 'px)';
            finale.classList.toggle('is-live', fin > 0.6);
        }
    }

    /* ---------- mode: zoom-through layers ---------- */
    // Each stage: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd,
    //             scaleFrom, scaleTo, scaleStart, scaleEnd, originY]
    var STAGES = [
        { fade: [-1, -1, 0.34, 0.46], scale: [1.0, 2.5, 0.0, 0.46], origin: '50% 42%' },
        { fade: [0.3, 0.42, 0.64, 0.76], scale: [0.6, 2.4, 0.28, 0.76], origin: '50% 46%' },
        { fade: [0.6, 0.74, -1, -1], scale: [0.68, 1.16, 0.58, 1.0], origin: '50% 50%' }
    ];

    function renderZoom(p) {
        for (var i = 0; i < layers.length && i < STAGES.length; i++) {
            var s = STAGES[i];
            var o = 1;
            if (s.fade[0] >= 0) o *= smooth(span(p, s.fade[0], s.fade[1]));
            if (s.fade[2] >= 0) o *= 1 - smooth(span(p, s.fade[2], s.fade[3]));
            var t = smooth(span(p, s.scale[2], s.scale[3]));
            var sc = lerp(s.scale[0], s.scale[1], t);
            var el = layers[i];
            el.style.opacity = String(o);
            el.style.transform = 'scale(' + sc.toFixed(4) + ')';
            el.style.transformOrigin = s.origin;
            el.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
        }
    }

    /* ---------- mode: video frame scrub ---------- */

    var mode = 'zoom';
    var frames = [];        // Image objects (sparse until loaded)
    var frameCount = 0;
    var loaded = [];        // booleans
    var ctx = null;
    var dpr = 1;
    var finaleLayer = null; // real portfolio photo the video dissolves into

    // The video scrubs over the first part of the pin, then dissolves into
    // the real portfolio photo — the journey always lands on Studio
    // Chenille's actual work, whatever the AI footage ends on. The video
    // keeps moving until fully covered (never visibly freezes) and the
    // photo continues the same forward push, easing to rest at the end.
    var VIDEO_END = 0.9;
    var PHOTO_IN = [0.72, 0.88];

    function sizeCanvas() {
        if (!canvas) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(hero.clientWidth * dpr);
        canvas.height = Math.round(hero.clientHeight * dpr);
    }

    function nearestLoaded(index) {
        for (var d = 0; d < frameCount; d++) {
            if (index - d >= 0 && loaded[index - d]) return frames[index - d];
            if (index + d < frameCount && loaded[index + d]) return frames[index + d];
        }
        return null;
    }

    function coverDraw(img) {
        var cw = canvas.width, ch = canvas.height;
        var iw = img.naturalWidth, ih = img.naturalHeight;
        var s = Math.max(cw / iw, ch / ih);
        var dw = iw * s, dh = ih * s;
        ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    // Fractional index with a crossfade between neighbouring frames —
    // hides the stepping between sampled frames so the scrub flows.
    function drawFrame(x) {
        if (!ctx) return;
        var i0 = Math.floor(x);
        var i1 = Math.min(i0 + 1, frameCount - 1);
        var frac = x - i0;
        var a = nearestLoaded(i0);
        if (!a) return;
        ctx.globalAlpha = 1;
        coverDraw(a);
        if (i1 !== i0 && frac > 0.02 && loaded[i1] && frames[i1] !== a) {
            ctx.globalAlpha = frac;
            coverDraw(frames[i1]);
            ctx.globalAlpha = 1;
        }
    }

    function renderVideo(p) {
        drawFrame(clamp01(p / VIDEO_END) * (frameCount - 1));
        if (finaleLayer) {
            var f = smooth(span(p, PHOTO_IN[0], PHOTO_IN[1]));
            // match the video's forward motion, decelerating to a stop
            var drift = span(p, PHOTO_IN[0], 1);
            drift = 1 - (1 - drift) * (1 - drift) * (1 - drift);
            finaleLayer.style.opacity = String(f);
            finaleLayer.style.transform = 'scale(' + (1 + 0.07 * drift).toFixed(4) + ')';
            finaleLayer.style.visibility = f <= 0.001 ? 'hidden' : 'visible';
        }
    }

    function loadFrames(manifest, base) {
        frameCount = manifest.frames;
        var isMobile = window.innerWidth < 768;
        var pad = manifest.pad || 4;

        function src(i) {
            var n = String(i + 1);
            while (n.length < pad) n = '0' + n;
            return base + manifest.pattern.replace('{i}', n);
        }

        function load(i, then) {
            if (frames[i]) { if (then) then(); return; }
            var img = new Image();
            img.decoding = 'async';
            img.onload = function () {
                loaded[i] = true;
                // repaint if this frame is near the current position
                var want = Math.round(current * (frameCount - 1));
                if (Math.abs(want - i) < 8) requestRender();
                if (then) then();
            };
            img.src = src(i);
            frames[i] = img;
        }

        // pass 1: coarse skeleton so scrubbing works immediately
        var step = isMobile ? 2 : 6;
        var pending = 0;
        for (var i = 0; i < frameCount; i += step) { pending++; load(i, done); }
        load(frameCount - 1, done); pending++;

        function done() {
            if (--pending > 0) return;
            if (isMobile) return; // mobile keeps the light coarse set
            // pass 2: fill everything for a fully fluid scrub
            for (var j = 0; j < frameCount; j++) load(j, null);
        }
    }

    /* ---------- render dispatch ---------- */

    function render(p) {
        if (mode === 'video') renderVideo(p);
        else renderZoom(p);
        renderText(p);
    }

    /* ---------- boot: probe for a generated frame sequence ---------- */

    var manifestUrl = wrapper.getAttribute('data-hero-frames');
    if (manifestUrl && canvas && window.fetch) {
        fetch(manifestUrl, { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .then(function (manifest) {
                if (!manifest || !manifest.frames) return; // placeholder manifest — zoom mode stays
                // Phones get their own portrait frame set — a 16:9-only set
                // over-crops on a portrait screen, so without one keep zoom mode.
                var portrait = hero.clientHeight > hero.clientWidth;
                var variant = manifest;
                if (portrait) {
                    if (manifest.mobile && manifest.mobile.frames) variant = manifest.mobile;
                    else return;
                }
                var finaleIndex = variant.finale_layer != null ? variant.finale_layer : 0;
                var base = manifestUrl.slice(0, manifestUrl.lastIndexOf('/') + 1);
                ctx = canvas.getContext('2d');
                sizeCanvas();
                mode = 'video';
                canvas.hidden = false;
                layers.forEach(function (el, i) { el.style.display = i === finaleIndex ? '' : 'none'; });
                finaleLayer = layers[finaleIndex] || null;
                if (finaleLayer) {
                    finaleLayer.style.zIndex = '1'; // above the canvas
                    finaleLayer.style.opacity = '0';
                    finaleLayer.style.visibility = 'hidden';
                    finaleLayer.style.transformOrigin = '50% 50%';
                }
                loadFrames(variant, base);
                requestRender();
            })
            .catch(function () { /* no frames yet — zoom mode stays */ });
    }

    requestRender();
})();
