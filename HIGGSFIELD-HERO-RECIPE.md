# Hero Video Recipe — "The Arrival" (Seedance 2.0)

The homepage hero is a scroll-scrubbed journey into a home. It currently runs
on a zoom-through of three portfolio photos. A Seedance 2.0 video upgrades it
to the full cinematic version.

> Billing reality (checked 17 July 2026): there is NO unlimited Seedance on
> the Plus plan — Seedance 2.0 bills credits both in the app and via Claude
> (~4.5 credits/second at 720p std). The plan's "unlimited" perks cover other
> models (Seedream, Flux, Nano Banana images; a Kling 3.0 promo that ended
> 14 July). A 5s draft was generated on 17 July with the last credits; this
> recipe is for the full 15s version once credits are topped up.

## Settings (higgsfield.ai → Video → Seedance 2.0, or ask Claude)

| Setting        | Value |
|----------------|-------|
| Model          | Seedance 2.0 |
| Resolution     | **720p** (this is the unlimited tier — don't pick 1080p/4K) |
| Duration       | **15 s** |
| Aspect ratio   | **16:9** |
| Audio          | Off |
| End frame      | `showhome-living.jpg` — already in your media library uploads |
| Image refs     | `res-kitchen-ascot.jpg`, `hotel-reception.jpg` (also in uploads) |
| Start frame    | none |

## Prompt (paste as-is)

```
Single continuous unbroken camera shot, no cuts, no editing transitions.
Golden dusk in Ascot, England: a stately Georgian country manor of
honey-toned limestone stands at the end of a long gravel drive, clipped
boxwood hedges and mature oak trees framing the approach, every window
glowing warm amber from within, soft blue-hour sky with the last light
fading. The camera glides forward at a slow, perfectly steady constant pace
down the gravel drive toward the front entrance, rises gently over the stone
steps as the grand panelled front door swings open, passes smoothly through
the doorway into a warm softly-lit entrance hall, and continues in one
unbroken push into an elegant living room with cream plush sofas, walnut
furniture, warm cove lighting, brass pendant lights and fresh flowers,
settling exactly on the composition of the reference end frame.
Photorealistic architectural cinematography, warm luxury palette of cream,
gold and charcoal, gimbal-smooth constant forward dolly motion for the
entire duration, no people, no text, no camera shake.
```

## Picking the take

If credits allow several takes, choose the one with:

- **One continuous forward move** — reject any take with a hidden cut or a
  pause; the scroll scrub telegraphs both instantly.
- **Constant speed** — a take that accelerates/decelerates will make the
  scroll feel rubbery.
- Clean door transit (no warping doorframe), no people, no invented text
  on signage.
- An ending that actually matches the living room end frame.

## Installing it

```bash
# from the repo root, with the downloaded take as hero.mp4
bash tools/hero-video-to-frames.sh ~/Downloads/hero.mp4
```

That writes `images/hero/frames/*.webp` + `images/hero/manifest.json`.
The hero detects the manifest and switches from zoom mode to the video
scrub automatically — no code changes. To go back to zoom mode, delete
`images/hero/manifest.json`.
