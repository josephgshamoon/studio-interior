# Hero Video Recipe — "The Arrival" (Seedance 2.0)

The homepage hero is a scroll-scrubbed journey into a home. It currently runs
on a zoom-through of three portfolio photos. A Seedance 2.0 video upgrades it
to the full cinematic version.

> Billing reality (checked 17 July 2026): there is NO unlimited Seedance on
> the Plus plan — Seedance 2.0 bills credits both in the app and via Claude
> (~4.5 credits/second at 720p std). Via the Claude MCP connector, image
> models bill too (Nano Banana 1cr, Nano Banana Pro 2cr, Seedream V5 Lite
> 1cr) — nothing is free at 0 balance.
>
> Deployed state (17 July 2026): ONE journey, two native takes. Both
> devices play the same walk — manor, door opens once, lantern-lit
> panelled hall bending LEFT, open-plan kitchen with the glass doors
> closed (garden only behind glass). Desktop: 8s 16:9 take v4 in
> `frames-v4/` (job 7cd2bf23 — generated with the mobile take as
> `video_references` plus "the door opens once and never moves again";
> ends on `images/res-kitchen-ascot-hero-wide.jpg`, a 16:9 widening of
> the kitchen finale). Mobile: 8s 9:16 take v3 in `frames-mobile-v3/`,
> ending on `images/res-kitchen-ascot-hero.jpg`. finale_layer 0 =
> wide kitchen (desktop), 1 = portrait kitchen (mobile).
>
> QA lessons: sample EVERY frame of a door transit (the v3 desktop
> take's self-closing door hid between 1fps samples); `video_references`
> imposes the reference's layout — poison when changing the shot's
> architecture, but exactly right when the reference IS the target (v4
> succeeded first try with the clean mobile take as reference).
> hero-journey.js since v11
> renders portrait footage on landscape stages contain-fit over an
> ambient blur — dormant now, but it activates automatically if a
> portrait-only manifest is ever served again. Source backups in
> /home/clawdbot/: hero-desktop-v4-source.mp4, hero-mobile-v3-source.mp4
> (all takes also in the Higgsfield media library).
>
> Regeneration lessons: (1) Do NOT run tools/hero-video-to-frames.sh
> desktop-only without restoring the mobile block in manifest.json
> afterwards — a desktop-only run rewrites the manifest without it.
> (2) Whenever frames are replaced, ship them under a NEW directory name
> (frames-mobile-v4/ etc., old dir deleted in the same commit) and point
> the manifest pattern there. A query-string bump is NOT enough: Pages
> deploys propagate over ~a minute and a visitor in that window caches
> OLD bytes under the NEW query URLs (seen 17 July as old/new flicker at
> the door). Fresh filenames can only 404 mid-deploy, which the engine's
> nearest-loaded fallback hides. (3) Passing an old take as Seedance
> `video_references` makes its LAYOUT override both the prompt and the
> end_image — great when only surface content changes (parkland
> windows), fatal when changing the architecture of the shot (the
> enclosed-hall regen only worked after dropping the video reference).

## Settings (higgsfield.ai → Video → Seedance 2.0, or ask Claude)

Two videos — the site serves each device its native aspect:

| Setting        | Desktop | Mobile |
|----------------|---------|--------|
| Model          | Seedance 2.0 (std) | Seedance 2.0 (std) |
| Resolution     | 720p | 720p |
| Duration       | 10–15 s | 8–12 s |
| Aspect ratio   | **16:9** | **9:16** |
| Audio          | Off | Off |
| End frame      | `showhome-living.jpg` | `res-kitchen-ascot.jpg` (portrait) |
| Image refs     | `res-kitchen-ascot.jpg` | `showhome-living.jpg` |

**Lesson from the first draft:** do NOT include `hotel-reception.jpg` as a
reference — Seedance planted its receptionist and desk in the finale. Keep
"completely empty, no people anywhere, no reception desk" in the prompt.

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
# from the repo root
bash tools/hero-video-to-frames.sh desktop-16x9.mp4 mobile-9x16.mp4
```

That writes `images/hero/frames/` (desktop), `images/hero/frames-mobile/`
(phones) and `manifest.json`. The hero detects the manifest and switches
from zoom mode to the video scrub automatically — no code changes.
Landscape screens scrub the 16:9 set and dissolve into the living-room
photo; portrait screens scrub the 9:16 set and dissolve into the kitchen
photo. Omit the second video and phones simply keep the zoom-mode hero.
To revert everything, restore the placeholder manifest (`"frames": 0`).

If a take has a flaw near the end (like the receptionist), trim it before
building frames — the dissolve hides the junction:

```bash
ffmpeg -i take.mp4 -t 8.5 -c copy take-trim.mp4
```
