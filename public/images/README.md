# Public landing visuals

These generated images are illustrative visuals for the public landing page:

- `peatland-hero-poster.png` — hero poster and video fallback.
- `peatland-arsip-bumi.webp` — optimized Arsip Bumi illustration: a peat cross-section on a warm cream background, used by the full-height introduction after the hero video.
- `peatland-water-gate.png` — peatland story section background.
- `peatland-parallax-panorama.webp` — retained illustrative peatland canal-blocking panorama.
- `peatland-foreground.webp` — retained first version of the transparent wetland foreground. Generation prompt: [peatland-foreground.prompt.md](peatland-foreground.prompt.md).
- `peatland-foreground-v2.webp` — active panoramic wetland foreground, edited with built-in imagegen to give the vegetation complete, naturally tapered horizontal edges. Its alpha is preserved. Edit prompt: [peatland-foreground-v2.prompt.md](peatland-foreground-v2.prompt.md).
- `peatland-patrol-hero.png` — wide hero background.
- `peatland-patrol-mobile.png` — patrol illustration card.
- `community-water-gate.png` — community water infrastructure illustration.
- `peatland-offline-patrol.webp` — full-size optimized copy of `community-water-gate.png`, used behind the offline reporting scroll story.

They do not show verified PEATGUARD patrols, real incident locations, or
operational evidence. Keep the visible illustration labels in the UI. Do not
use these assets in reports or as proof of field activity.

## Application screenshots

These are captures from the running application using the local demo volunteer
account. They retain the application's own demo labels and are displayed inside
the phone frame without an additional illustration caption.

- `field-app-capture.webp` — real application screenshot of the volunteer report form with a demo canal sample selected.
- `field-app-saved.webp` — real application screenshot of the offline queue with one local draft.
- `field-app-sent.webp` — real application screenshot of the volunteer home after that demo report synced. Capture details: [field-app-screenshots.md](field-app-screenshots.md).

## Landing behavior

The hero can use an optional local video at
`public/videos/peatland-hero.mp4`. When that file is unavailable, the generated
poster remains visible.

The introduction uses the existing forest/green text and action tokens over a
light paper-colored gradient, leaving the peat detail visible on the right.
Both the video viewport and introduction occupy `100dvh`; the introduction may
grow when large text or a short viewport needs more room. The video and
introduction have overlapping sticky stages. The introduction's track reserves
one viewport of scroll distance, while Motion raises the panel from `y: 100%`
to `y: 0%` and expands it to full size. Vertical movement, scale, and corner
radius all derive from the same smoothed progress value; native scrolling does
not raise the panel ahead of its expansion during the reveal. The header also
observes the panel crossing its midpoint, so its colors follow the animated
surface after scrolling stops.
Scroll progress is measured from the separate, untransformed video marker,
then smoothed with an overdamped spring and clamped
to `scale(0.38)` through `scale(1)`. The panel has no CSS scroll animation or
focus rule that can restart its scale. Keyboard focus reveals the panel at full
size; pointer focus keeps the current scroll position and scale.
The response starts gently, accelerates smoothly, and slows toward its target.
Its timing is stretched to twice the original response: stiffness is divided by
four and damping and rest speed by two, preserving the non-bouncing profile
while reducing the initial acceleration.
The panel scales from its bottom edge. This keeps the panel's center, heading,
and other content moving upward while the expansion settles after a downward
scroll, rather than dropping back down as a top-anchored panel would.
The server-rendered panel starts at the same small scale as Motion's initial
value, so hydration cannot reset a full-size panel back to its small state.

The introduction footer contains only the illustration label. Navigation uses
native fragment links and CSS smooth scrolling. With reduced motion, the video
viewport is skipped and the static introduction appears first. The following
story section uses a sticky full-viewport scene: a decorative word grows while
the larger transparent wetland foreground rises from the viewport bottom in
front of it. The explanatory copy stays stationary; the three expanded editorial
rows follow outside the animation track, before the next chapter.
The subsequent full-viewport chapters use restrained entrance
motion and a scroll-driven workflow line. See [public landing chapters](../../docs/application/public-landing-motion.md)
for layout, motion, and reduced-motion behavior.

The offline reporting chapter follows the gambut editorial rows and precedes
“03 / Membaca bentang”. Its full-screen patrol photo remains pinned while text
and a portrait phone with real application screenshots explain local storage and
later sending. The landing page never submits or fetches reports. Demo labels
inside the captured application remain visible; the exterior mockup caption is
removed. The background photo retains its illustration label.
