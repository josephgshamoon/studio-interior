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
    var overlay = wrapper.querySelector('.hero-overlay');
    var poster = document.getElementById('heroPoster');

    // The poster covers the stage until either the canvas draws its first
    // real frame (video mode) or zoom mode is chosen.
    function hidePoster() {
        if (!poster) return;
        var el = poster;
        poster = null;
        el.classList.add('is-done');
        setTimeout(function () { el.hidden = true; }, 550);
    }

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

    // How far the hero has slid off-screen past the end of the pin,
    // reaching 1 once it has exited by a quarter viewport. A hard fling
    // can unpin the hero while the lerp is still mid-choreography — the
    // finale would pop in during the exit (or never be seen). This is
    // raw scroll, not smoothed time, so the finale is guaranteed settled
    // early in the exit and unwinds seamlessly if the visitor scrolls up.
    var exitBoost = 0;

    function readProgress() {
        var travel = wrapper.offsetHeight - window.innerHeight;
        if (travel <= 0) { target = 0; exitBoost = 0; return; }
        var y = -wrapper.getBoundingClientRect().top;
        target = clamp01(y / travel);
        exitBoost = clamp01((y - travel) / (0.25 * window.innerHeight));
    }

    function tick(now) {
        var dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
        lastTime = now;
        // time-normalised exponential smoothing (~feels like a heavy camera)
        var k = 1 - Math.exp(-7 * dt);
        current = current < 0 ? target : lerp(current, target, k);
        if (Math.abs(target - current) < 0.0004) current = target;
        render(current);
        if (current !== target || settleTarget()) {
            rafId = requestAnimationFrame(tick);
        } else {
            rafId = null;
            lastTime = 0;
            if (hybrid) idleSharpen();
        }
    }

    // Resting between two source frames would freeze the crossfade as a
    // double-exposure ghost — when scrolling goes idle, glide the last
    // fraction of progress so the scrub settles on one clean frame (the
    // nearest one that has actually loaded; mobile keeps a coarse set).
    // The next real scroll event re-reads progress and takes over again.
    function settleTarget() {
        if (mode !== 'video' || frameCount < 2) return false;
        var scale = JOURNEY_END * VIDEO_END; // page progress spanned by the scrub
        if (target >= scale) return false;   // finale photo covers the canvas
        var i = Math.round((target / scale) * (frameCount - 1));
        for (var d = 0; d < frameCount; d++) {
            if (i - d >= 0 && loaded[i - d]) { i -= d; break; }
            if (i + d < frameCount && loaded[i + d]) { i += d; break; }
        }
        var settled = (i / (frameCount - 1)) * scale;
        if (Math.abs(settled - target) < 0.00005) return false;
        target = settled;
        return true;
    }

    function requestRender() {
        readProgress();
        if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', function () {
        if (mode === 'video' || mode === 'videoscrub') sizeCanvas();
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

        // The darkening gradient exists for text legibility — keep it full
        // while the titles or finale are up, lighten it mid-journey so the
        // footage shows at closer to its native brightness and punch.
        if (overlay) {
            var textiness = Math.max(1 - smooth(span(p, 0.16, 0.3)), smooth(span(p, 0.72, 0.88)), exitBoost);
            overlay.style.opacity = String(0.45 + 0.55 * textiness);
        }

        // Vignette deepens on arrival
        if (vignette) {
            vignette.style.opacity = String(0.9 * Math.max(smooth(span(p, 0.85, 0.98)), smooth(exitBoost)));
        }

        // Finale: arrival statement + CTAs — lands after the room resolves
        if (finale) {
            var fin = Math.max(smooth(span(p, 0.92, 0.995)), smooth(exitBoost));
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
    var VIDEO_END = 0.97;
    var PHOTO_IN = [0.9, 0.985];

    // The widened desktop footage ends on a wider framing than the finale
    // photo (photo ≈ its final frame zoomed 1.23x, crop window at
    // [0.090, 0.140] — measured, +3.2% for the photo's drift scale at
    // cover time). Crossfading two different framings double-exposes:
    // ghost pendants, doubled window bars. So during the dissolve the
    // canvas zooms INTO the photo's framing in lockstep with the fade —
    // the blend is then between aligned images and reads as one
    // continuous push-in. Landscape only; the phone's footage already
    // ends on its photo.
    var DISSOLVE_MATCH = null; // set at boot: { z: 1.27, x: 0.103, y: 0.153 }

    function dissolveT() {
        if (!DISSOLVE_MATCH) return 0;
        var p = clamp01((current < 0 ? 0 : current) / JOURNEY_END);
        return Math.max(smooth(span(p, PHOTO_IN[0], PHOTO_IN[1])), smooth(exitBoost));
    }

    function sizeCanvas() {
        if (!canvas) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.round(hero.clientWidth * dpr);
        var h = Math.round(hero.clientHeight * dpr);
        // assigning width/height blanks the canvas even when unchanged —
        // mobile URL-bar show/hide fires resize storms while scrolling,
        // and each needless clear flashed a blank frame (seen as flicker)
        if (canvas.width === w && canvas.height === h) return;
        canvas.width = w;
        canvas.height = h;
        // setting width/height resets context state — restore quality
        if (ctx) ctx.imageSmoothingQuality = 'high';
        // repaint in the same task so a real resize never shows a blank
        if (mode === 'video' && current >= 0) render(current);
        if (mode === 'videoscrub' && scrubReady) coverDraw(scrubVideo);
    }

    function nearestLoadedIndex(index) {
        for (var d = 0; d < frameCount; d++) {
            if (index - d >= 0 && loaded[index - d]) return index - d;
            if (index + d < frameCount && loaded[index + d]) return index + d;
        }
        return -1;
    }

    // Portrait footage on a landscape stage is shown whole (no crop-zoom,
    // which would both amputate the composition and stretch 720px source
    // pixels 2x): the full frame sits centred and pin-sharp over a dark
    // ambient blur of itself — a tall doorway into the house.
    var backdrop = null;

    function coverDraw(img) {
        var cw = canvas.width, ch = canvas.height;
        var iw = img.naturalWidth || img.videoWidth,
            ih = img.naturalHeight || img.videoHeight;
        if (!(ih > iw && cw > ch)) {
            var t = dissolveT();
            var z = DISSOLVE_MATCH ? 1 + (DISSOLVE_MATCH.z - 1) * t : 1;
            var s = Math.max(cw / iw, ch / ih) * z;
            var dw = iw * s, dh = ih * s;
            // slide the visible window from centred cover toward the
            // photo-matching crop as the dissolve progresses; at t=0 this
            // is exactly the old centred draw
            var lx = (dw - cw) / (2 * dw), ly = (dh - ch) / (2 * dh);
            if (t > 0) {
                lx = Math.min(Math.max(lerp(lx, DISSOLVE_MATCH.x, t), 0), 1 - cw / dw);
                ly = Math.min(Math.max(lerp(ly, DISSOLVE_MATCH.y, t), 0), 1 - ch / dh);
            }
            ctx.drawImage(img, -lx * dw, -ly * dh, dw, dh);
            return;
        }
        applyPortraitStage();
        // ambient wings: draw tiny and stretch back up — a cheap large blur
        if (!backdrop) {
            backdrop = document.createElement('canvas');
            backdrop.width = 32;
            backdrop.height = 18;
        }
        backdrop.getContext('2d').drawImage(img, 0, 0, 32, 18);
        ctx.drawImage(backdrop, 0, 0, cw, ch);
        ctx.fillStyle = 'rgba(16, 14, 12, 0.62)';
        ctx.fillRect(0, 0, cw, ch);
        var s2 = Math.min(cw / iw, ch / ih);
        var dw2 = iw * s2, dh2 = ih * s2;
        ctx.drawImage(img, (cw - dw2) / 2, (ch - dh2) / 2, dw2, dh2);
    }

    // The DOM pieces around the canvas (finale photo, poster) must match
    // the contain-fit stage or the dissolve would snap back to a crop-zoom.
    var stagedPortrait = false;
    function applyPortraitStage() {
        if (stagedPortrait) return;
        stagedPortrait = true;
        var stage = '#171310';
        if (finaleLayer) {
            finaleLayer.style.background = stage;
            var fi = finaleLayer.querySelector('img');
            if (fi) fi.style.objectFit = 'contain';
        }
        var posterEl = document.getElementById('heroPoster');
        if (posterEl) {
            posterEl.style.background = stage;
            var pi = posterEl.querySelector('img');
            if (pi) pi.style.objectFit = 'contain';
        }
    }

    // Fractional index with a crossfade between neighbouring frames —
    // hides the stepping between sampled frames so the scrub flows.
    var drawnIndex = -1;
    function drawFrame(x) {
        if (!ctx) return;
        var i0 = Math.floor(x);
        var i1 = Math.min(i0 + 1, frameCount - 1);
        var frac = x - i0;
        if (frac > 0.98 && loaded[i1]) { i0 = i1; frac = 0; }
        var ni = nearestLoadedIndex(i0);
        if (ni < 0) return;
        // While the sequence is still streaming in, painting whatever
        // frame happens to be loaded makes the canvas roll through
        // distant moments (reads as flicker at high-motion segments).
        // Only swap the canvas once a frame near the scrub position is
        // ready; until then keep what's showing (or the poster).
        if (Math.abs(ni - i0) > 8) {
            if (drawnIndex < 0 || !loaded[drawnIndex]) return;
            ni = drawnIndex;
        }
        var a = frames[ni];
        ctx.globalAlpha = 1;
        coverDraw(a);
        drawnIndex = ni;
        hidePoster();
        if (i1 !== i0 && frac > 0.02 && loaded[i1] && frames[i1] !== a) {
            ctx.globalAlpha = frac;
            coverDraw(frames[i1]);
            ctx.globalAlpha = 1;
        }
    }

    /* ---------- mode: videoscrub — seek a dense-keyframe (g=6) mp4 ----------
       High-DPI desktop screens scrub a real <video> tier instead of the
       1280px webp frames: full 24fps granularity at 1440/2160-class
       resolution for a fraction of the bytes a frame set would cost.
       Seeks are chained (never more than one in flight); the webp frame
       path remains the fallback if the video errors or stalls. */

    var scrubVideo = null;
    var scrubReady = false;
    var seekBusy = false;
    var seekPending = -1;
    var scrubVariant = null;
    var scrubBase = '';

    // Not every machine can seek-decode 4K fast enough for a fluid scrub.
    // Each visitor's device measures its own seek latency; if the rolling
    // median says the scrub is lagging the scroll, that machine switches
    // to the instant webp frame path for motion and keeps the video only
    // to re-sharpen the still image whenever scrolling pauses.
    var hybrid = false;
    var idleVideo = null;
    var seekT0 = 0;
    var seekLat = [];

    function noteSeekLatency() {
        var lat = performance.now() - seekT0;
        // one catastrophic seek (network stall, cold decoder) is enough
        if (lat > 300) { engageHybrid(); return; }
        seekLat.push(lat);
        if (seekLat.length > 6) seekLat.shift();
        if (seekLat.length === 6) {
            var s = seekLat.slice().sort(function (a, b) { return a - b; });
            // a >40ms median is under 25 paints/sec — visibly laggy
            if (s[3] > 40) engageHybrid();
        }
    }

    // Warm the coarse frame skeleton in the background while the video
    // scrubs, so an engageHybrid handoff has instant material instead of
    // starting its downloads mid-scroll (~1.5MB, low priority).
    function warmFrames(variant, base) {
        var pad = variant.pad || 4;
        var count = variant.frames;
        function src(i) {
            var n = String(i + 1);
            while (n.length < pad) n = '0' + n;
            return base + variant.pattern.replace('{i}', n);
        }
        function warmOne(i) {
            if (frames[i]) return;
            var img = new Image();
            img.decoding = 'async';
            if ('fetchPriority' in img) img.fetchPriority = 'low';
            function mark() { loaded[i] = true; }
            img.onload = function () {
                if (img.decode) img.decode().then(mark, mark);
                else mark();
            };
            img.src = src(i);
            frames[i] = img;
        }
        for (var i = 0; i < count; i += 6) warmOne(i);
        warmOne(count - 1);
    }

    function engageHybrid() {
        if (hybrid || !scrubVideo) return;
        hybrid = true;
        idleVideo = scrubVideo;
        scrubVideo = null;
        scrubReady = false;
        seekBusy = false;
        seekPending = -1;
        mode = 'video';
        loadFrames(scrubVariant, scrubBase);
        requestRender();
    }

    // One sharp 4K paint at rest: called when the render loop goes idle.
    function idleSharpen() {
        if (!idleVideo || mode !== 'video') return;
        var dur = idleVideo.duration;
        if (!dur) return;
        var frac = clamp01(clamp01(target / JOURNEY_END) / VIDEO_END);
        if (frac >= 1) return; // finale photo covers the canvas
        idleVideo.currentTime = Math.min(frac * dur, dur - 0.05);
    }

    function seekDraw(t) {
        if (!scrubReady) return;
        if (seekBusy) { seekPending = t; return; }
        if (Math.abs(scrubVideo.currentTime - t) < 0.012) return; // same frame
        seekBusy = true;
        seekT0 = performance.now();
        scrubVideo.currentTime = t;
    }

    function initVideoScrub(tier, variant, base) {
        scrubVariant = variant;
        scrubBase = base;
        var v = document.createElement('video');
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        var fellBack = false;
        function fallbackToFrames() {
            if (fellBack) return;
            fellBack = true;
            scrubVideo = null;
            scrubReady = false;
            v.removeAttribute('src');
            v.load(); // abort the stream — free the bandwidth for frames
            mode = 'video';
            loadFrames(variant, base);
            requestRender();
        }
        // If the tier can't produce a first frame quickly, drop to frames —
        // the visitor should never stare at the poster on a stuck request.
        var bootTimer = setTimeout(fallbackToFrames, 8000);
        v.addEventListener('error', fallbackToFrames);
        v.addEventListener('loadeddata', function () {
            if (fellBack) return;
            clearTimeout(bootTimer);
            scrubReady = true;
            // paint frame 0 now — the first seek may be to t=0, which
            // fires no 'seeked', and the poster must not linger
            coverDraw(v);
            hidePoster();
            requestRender();
        });
        v.addEventListener('seeked', function () {
            if (hybrid) {
                // idle sharpening: only paint if the scrub is still at rest
                if (mode === 'video' && rafId === null) coverDraw(v);
                return;
            }
            if (fellBack || !scrubReady) return;
            noteSeekLatency();
            coverDraw(v);
            hidePoster();
            seekBusy = false;
            if (seekPending >= 0) {
                var t = seekPending;
                seekPending = -1;
                seekDraw(t);
            }
        });
        v.src = tier.src;
        scrubVideo = v;
        canvas._scrubVideo = v; // inspection handle (headless QA probes)
        mode = 'videoscrub';
        warmFrames(variant, base);
    }

    function renderVideoScrub(p) {
        if (scrubReady) {
            var dur = scrubVideo.duration || 0;
            if (dur > 0) {
                // keep a frame's headroom: seeking to the exact end can
                // report duration and freeze on a black terminator frame
                seekDraw(Math.min(clamp01(p / VIDEO_END) * dur, dur - 0.05));
                // during the dissolve the canvas zoom animates with the
                // fade — repaint every tick, not only on 'seeked', or the
                // zoom steps at video-frame granularity (slow scrolling
                // showed it as a split-second judder against the smooth
                // photo fade above)
                if (dissolveT() > 0) coverDraw(scrubVideo);
            }
        }
        renderFinale(p);
    }

    function renderFinale(p) {
        if (finaleLayer) {
            var f = Math.max(smooth(span(p, PHOTO_IN[0], PHOTO_IN[1])), smooth(exitBoost));
            // match the video's forward motion, decelerating to a stop
            var drift = span(p, PHOTO_IN[0], 1);
            drift = 1 - (1 - drift) * (1 - drift) * (1 - drift);
            drift = Math.max(drift, exitBoost);
            finaleLayer.style.opacity = String(f);
            finaleLayer.style.transform = 'scale(' + (1 + 0.035 * drift).toFixed(4) + ')';
        }
    }

    function renderVideo(p) {
        drawFrame(clamp01(p / VIDEO_END) * (frameCount - 1));
        renderFinale(p);
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

        function load(i, then, priority) {
            if (frames[i]) { if (then) then(); return; }
            var img = new Image();
            img.decoding = 'async';
            if (priority && 'fetchPriority' in img) img.fetchPriority = priority;
            // mark loaded only once decoded — drawing an undecoded image
            // forces a synchronous decode on the main thread (jank)
            function ready() {
                if (loaded[i]) return;
                loaded[i] = true;
                var want = Math.round(current * (frameCount - 1));
                if (Math.abs(want - i) < 8) requestRender();
                if (then) then();
            }
            img.onload = function () {
                if (img.decode) img.decode().then(ready, ready);
                else ready();
            };
            img.src = src(i);
            frames[i] = img;
        }

        // pass 1: coarse skeleton so scrubbing works immediately
        var step = isMobile ? 2 : 6;
        var pending = 0;
        for (var i = 0; i < frameCount; i += step) { pending++; load(i, done, i === 0 ? 'high' : undefined); }
        load(frameCount - 1, done); pending++;

        function done() {
            if (--pending > 0) return;
            // Retina phones carry the full set (manifest full_scrub) for the
            // smoothest scrub; non-retina phones keep the light coarse set.
            if (isMobile && !manifest.full_scrub) return;
            // pass 2: fill everything for a fully fluid scrub, nearest
            // to the visitor's current position first so the segment
            // they are actually looking at densifies quickest
            var scale = JOURNEY_END * VIDEO_END;
            var want = Math.round(clamp01(target / scale) * (frameCount - 1));
            var order = [];
            for (var j = 0; j < frameCount; j++) order.push(j);
            order.sort(function (a, b) { return Math.abs(a - want) - Math.abs(b - want); });
            for (var k = 0; k < order.length; k++) load(order[k], null, 'low');
        }
    }

    /* ---------- render dispatch ---------- */

    // The choreography completes at this fraction of the pin; the
    // remainder is a hold plateau so momentum can't overshoot the finale.
    var JOURNEY_END = 0.8;

    function render(p) {
        p = clamp01(p / JOURNEY_END);
        if (mode === 'video') renderVideo(p);
        else if (mode === 'videoscrub') renderVideoScrub(p);
        else renderZoom(p);
        renderText(p);
    }

    /* ---------- boot: probe for a generated frame sequence ---------- */

    var manifestUrl = wrapper.getAttribute('data-hero-frames');
    if (manifestUrl && canvas && window.fetch) {
        fetch(manifestUrl, { cache: 'no-cache' })
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .then(function (manifest) {
                if (!manifest || !manifest.frames) { hidePoster(); return; } // placeholder — zoom mode
                // Phones get their own portrait frame set — a 16:9-only set
                // over-crops on a portrait screen, so without one keep zoom mode.
                var portrait = hero.clientHeight > hero.clientWidth;
                var variant = manifest;
                var effDpr = Math.min(window.devicePixelRatio || 1, 2);
                if (portrait) {
                    if (manifest.mobile && manifest.mobile.frames) {
                        variant = manifest.mobile;
                        // retina phones get the portrait hi-res cut
                        if (effDpr >= 2 && variant.hd && variant.hd.frames) {
                            variant = variant.hd;
                        }
                    }
                    else { hidePoster(); return; }
                }
                // The widened 16:9 footage never fully clears the doorway:
                // an outpainted blank wall parks across the right quarter
                // for the last ~0.7s (the phone's portrait crop never sees
                // it). Land the finale photo earlier on landscape screens,
                // while that wall is still sliding, so the journey never
                // rests on it — the photo is settled before the text.
                // Landscape: land the photo while the footage is still in
                // motion (the widened tail parks on an outpainted wall).
                // No DISSOLVE_MATCH zoom — the owner reads any synthetic
                // camera move at the end as footage that isn't theirs.
                if (!portrait) PHOTO_IN = [0.85, 0.935];
                var finaleIndex = variant.finale_layer != null ? variant.finale_layer : 0;
                var base = manifestUrl.slice(0, manifestUrl.lastIndexOf('/') + 1);
                // opaque context: the canvas is always fully covered, so
                // skipping the alpha channel saves compositing every frame.
                // No `desynchronized` — it bypasses vsync composition and
                // produces visible tearing/flicker on some mobile GPUs.
                ctx = canvas.getContext('2d', { alpha: false });
                sizeCanvas();
                canvas.hidden = false;
                layers.forEach(function (el, i) { el.style.display = i === finaleIndex ? '' : 'none'; });
                finaleLayer = layers[finaleIndex] || null;
                if (finaleLayer) {
                    finaleLayer.style.zIndex = '1'; // above the canvas
                    finaleLayer.style.opacity = '0';
                    // stays visible at opacity 0 — a hidden layer is not
                    // rasterised, so flipping visibility at dissolve time
                    // made the photo POP in a frame or two late on busy
                    // machines (4K canvas + video decode) instead of fading
                    finaleLayer.style.visibility = 'visible';
                    finaleLayer.style.transformOrigin = '50% 50%';
                    // pre-decode so the dissolve doesn't jank on first paint
                    var finaleImg = finaleLayer.querySelector('img');
                    if (finaleImg && finaleImg.decode) finaleImg.decode().catch(function () {});
                }
                // portrait-footage hint on a landscape viewport: stage the
                // poster and finale before the first frame even paints
                if (!portrait && variant.width && variant.width < 1000) applyPortraitStage();
                // Landscape hi-DPI screens scrub a dense-keyframe video tier
                // instead of the webp frames — picked by physical pixels
                // (innerWidth x devicePixelRatio), never CSS width alone.
                var tier = null;
                if (!portrait && manifest.tiers && window.HTMLVideoElement) {
                    var phys = window.innerWidth * effDpr;
                    for (var ti = 0; ti < manifest.tiers.length; ti++) {
                        if (phys >= manifest.tiers[ti].min_phys) { tier = manifest.tiers[ti]; break; }
                    }
                }
                if (tier) {
                    initVideoScrub(tier, variant, base);
                } else {
                    mode = 'video';
                    loadFrames(variant, base);
                }
                // The variant is chosen once at boot — a window resized
                // across the portrait/landscape boundary (a half-snapped
                // laptop window maximised later) would otherwise keep the
                // wrong aspect's footage. Reload once when the stage
                // orientation genuinely flips; assets are cached, so the
                // reload is quick and lands on the right variant.
                var orientTimer = null;
                window.addEventListener('resize', function () {
                    clearTimeout(orientTimer);
                    orientTimer = setTimeout(function () {
                        var nowPortrait = hero.clientHeight > hero.clientWidth;
                        if (nowPortrait !== portrait) location.reload();
                    }, 600);
                });
                requestRender();
            })
            .catch(function () { hidePoster(); /* no frames — zoom mode stays */ });
    } else {
        hidePoster();
    }

    requestRender();
})();
