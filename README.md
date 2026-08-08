# The Abyssal Archive

An explorable underwater portfolio. **You are the jellyfish.** Fifteen projects
are sunk across the reef; you swim out and open them.

**Phase 1 is complete: the vertical slice.** Enter the ocean, swim to a
submerged artifact, open the full case study, close it, swim on. All fifteen
projects are ported from the `isaiahramirezdev` portfolio, which remains the
source of truth for the prose and is not modified by anything here.

## Running it

This project needs Node 20.19+ or 22.12+ (Vite 8's floor). A `.nvmrc` pins 24.
The machine default of Node 21 is EOL and **will fail the build** with a
confusing `styleText` error.

```bash
nvm use          # reads .nvmrc
npm install
npm run dev
```

If `npm install` leaves `node_modules/@rolldown/` without a
`binding-darwin-arm64` directory, that is npm's optional-dependency bug. Delete
`node_modules` and `package-lock.json` and install again **on Node 24** — that
was the actual fix, not installing the binding by hand.

## Controls

| Input | Action |
| --- | --- |
| `W` `A` `S` `D` | Swim the jellyfish, relative to where the camera is looking |
| Mouse | Orbit the camera around it (click first to lock the pointer) |
| `Space` / `Shift` | Rise / sink |
| `E` | Inspect the nearby landmark |
| `Esc` | Close the case study or the credits |
| `P` | Toggle the FPS meter |

Touch devices get a left-half virtual stick, drag-right to orbit, and rise/sink
buttons.

## The camera follows the jellyfish, not the other way round

This was backwards for the whole of the first pass and it is worth naming,
because the old shape looks reasonable in code. The jellyfish was an autonomous
guide that computed its position *from* `state.camera.position` every frame:
you were a first-person diver, and the mascot held station off your lens. The
result is that the thing the site is built around chased the camera instead of
being the thing you drive.

Now `JellyfishPlayer` owns movement and `FollowCamera` trails it. Three pieces
make that work:

- **`controllers/player.ts`** holds the live player position and the orbit rig.
  The camera, the landmarks and the wildlife all read it. It cannot be React
  state — it changes every frame.
- **Movement is built from `rig.yaw`, not from the camera transform.** The
  camera lags on purpose; reading that lagging transform back as the input
  basis is a feedback loop, and hard turns wander.
- **Proximity is measured from the jellyfish.** The camera sits 13 units back
  on a spring, so measuring from it arms the inspect prompt before you arrive
  and holds it after you leave.

The camera position runs on a real spring (`SPRING`/`DAMPING`, ζ ≈ 0.69) rather
than the exponential approach used everywhere else in this codebase,
specifically so it can overshoot on a hard turn and settle. An exponential
approach can only ever arrive; it never swings past, and the rig reads as a
stick bolted to the model.

## How the feel is built

There is no physics engine. Underwater movement is three stacked effects, now
in `src/creatures/JellyfishPlayer.tsx`:

1. **Velocity approaches its target exponentially** rather than snapping —
   instant response at the start of a stroke, a long coast at the end. This
   contributes more than anything else.
2. **The body turns toward its direction of travel and banks into it**, scaled
   by speed, so a stationary nudge does not roll the bell over.
3. **A slow ambient current** built from out-of-phase sines means the world is
   never completely still.

Per-frame input lives in a mutable singleton (`controllers/input.ts`), not React
state. Keyboard, pointer and touch all write to it, so the controller does not
care which device you are using — and the tree does not re-render 60x/second.

## Wildlife

`src/creatures/Wildlife.tsx` runs a manta ray, a whale shark and a great white
on slow Lissajous circuits. They do nothing and are not meant to: scale only
reads once something large passes at a distance you cannot reach.

Four things in there are load-bearing, and three of them are scar tissue from
creatures that swam backwards or drifted out of the scene:

- **Bounds are measured in the model's own frame**, by `localBounds()`, not by
  `Box3.setFromObject`. `setFromObject` calls `updateWorldMatrix(true, …)` and
  walks *up* the parent chain, so it hands back a world-space box that already
  contains the fit scale and the body's current heading. Measuring with it makes
  the fit depend on which way the animal happens to be facing when the memo
  runs — the axis choice flips as it turns. This was the actual cause of the
  wrong facings, and it is invisible in a still screenshot.
- **The transform is reset before measuring.** `useGLTF` returns the cache's
  object, not a copy. Measuring it while it still carries the previous mount's
  scale and recentring offset feeds that offset back into the next one, and the
  animal walks itself out of the scene a few metres at a time. The symptom was a
  manta ray rendering 19 units from where its own group said it was.
- **`lengthAxis` and `orient` are in different frames, on purpose.** For a
  skinned mesh the bounding box describes *bind space*, which is not where the
  animal renders — the whale shark's box is longest on Z while its skeleton runs
  along X. The box extent is still the body length, so it is still the right
  number to scale by; but the facing has to come from somewhere else.
- **Facing was read off the skeletons, not guessed.** The whale shark ships
  bones called `Head_15` and `Jaw_14` sitting at +X. The great white's bones are
  generically named, but its paired pectoral-fin bones and single dorsal-fin
  bone place its head at +Z. The manta has no skeleton, so it was read from a
  cross-section profile along its body axis: the wings sit at z ≈ −0.35 at full
  half-span, with the narrow cephalic lobes just ahead of them and a thin tail
  whip tapering away to +Z.

Each facing is verified numerically rather than by eye — project the head and
the travel direction onto the same screen axis and check they agree. Eyeballing
a still is genuinely unreliable here: a manta with too strong a wing flap reads
as having its head at the wrong end, which cost a full wrong diagnosis.

The manta ships **no animation clip at all**, so its wings are driven by a
vertex-shader patch instead of an `AnimationMixer`: lift rises with the square
of the distance from the spine, so the body stays rigid while the tips travel,
and the phase lags outward so it reads as a wave rolling down the wing rather
than a flat see-saw. Amplitude is a fraction of half-span, and it is sensitive —
the body is only 0.34 deep against a 1.01 half-span, so 0.5 folded the wings
through the animal. It is 0.18.

All four models are CC BY 4.0. The licence requires attribution to reach
viewers, not just the repo, so `src/ui/Credits.tsx` renders it from
`src/creatures/modelCredits.ts` and opens from all three entry paths. See
`ASSETS.md`.

## Project discovery has three layers

Getting this wrong is how artistic portfolios fail: they look impressive and
leave the work illegible.

1. **Distant landmark** — a beacon that survives the fog and reads from 60m out.
2. **Proximity card** — title, stack, one-line summary, `Inspect`. Appears on a
   threshold crossing, never re-rendered per frame.
3. **Full case study** — plain HTML outside the canvas. Long-form text a
   recruiter must be able to read, copy, translate and screen-read does not
   belong in 3D.

Adding a project is one entry in `src/projects/projectData.ts`. All fifteen live
there now, on two rings — the featured six at ~62 units, the rest at ~112,
against a 150-unit bound and roughly 120 units of fog. Nothing is visible from
spawn except the nearest beacon, which is the point.

The jellyfish used to answer "where next" by leading you there. It cannot any
more — you drive it — so `NavigationTracker` in `World.tsx` names the nearest
landmark and its distance in the HUD instead.

Each project's `caseStudy.lessons` is optional. A retrospective is a
first-person claim, so a project carries one only where the ported source
material actually supports it; the section is omitted rather than invented.
Three of the fifteen have one so far.

## Escape hatches

- **Quick portfolio** — every project reachable in one interaction, from the
  gate and from the HUD, with working links to each live build.
- **No WebGL** — detected at startup; the site opens on the readable path
  instead of a black void.
- **Reduced motion** — honoured from the OS and toggleable on the gate. Kills
  drift, bob, roll, FOV push and orbit speed; the camera still points where you
  ask, just without the overshoot.
- **Low power** — coarse pointer or ≤4 cores cuts particle count, godray count,
  seafloor tessellation and pixel ratio. `PerformanceMonitor` drops DPR further
  before it drops frames.

## Verified so far

Typecheck and production build pass (362 kB gzip JS). Checked on a real GPU in
a headed browser: the gate, the dive, all three creatures rendering at the right
scale and facing, forward swim, the movement basis rotating with the camera
orbit, the proximity prompt, a case study opening on `E`, the credits panel, and
the quick-portfolio fallback.

All eight copied sub-sites serve at their new paths (`/lyrx/`, `/datacore/`,
`/tesseraxis/`, `/blom/`, `/rave/`, `/datagate/`, `/trade-assistant/`,
`/unwritten-age/`), along with `shared/`, `images/` and `video/`. They use
relative asset paths, so they needed no rewriting.

The scene's first pass was badly overexposed; see below for what the exposure
budget now is and where to change it.

All three creatures were then re-verified swimming head-first, each measured
rather than eyeballed: the manta by projecting its nose and its travel onto the
same screen axis, and both sharks by the world-space offset of a named head bone
along the direction of travel.

Not yet checked: touch controls against the new third-person rig, and the
reduced-motion path end to end.

## Why it feels submerged rather than boxed in

The ocean has a **ceiling you can see**: `environment/WaterSurface.tsx` renders
the underside of the surface at `y = 22`, and it is doing real optics.

Light only refracts into water within a cone of about 48.7° (cos 0.659). Look up
from below and you get **Snell's window** — a bright circular porthole of sky
directly overhead, ringed by total internal reflection where the surface turns
into a mirror of the dark water. The wave normals ripple that boundary. This one
effect does more for "I am underwater" than any amount of fog, and it costs a
single plane with no tessellation, because all the detail is in the fragment
shader.

Without a ceiling, looking up showed empty fog and the world read as a sealed
box no matter how far out the walls were pushed.

World dimensions live in one place, `experience/oceanConfig.ts`, because the
diver bounds, the surface, the seafloor and the godrays all have to agree.
Bounds are a 150-unit radius against roughly 120 units of fog visibility, so the
edge of the world is always hidden behind the fog rather than found.

## Exposure budget

Everything renders through ACES tone mapping at `toneMappingExposure: 0.9`, and
bloom only catches pixels above **0.85** luminance. Three rules keep it there:

- **Never set `toneMapped={false}`.** It sends raw linear colour past ACES
  directly into bloom. Three materials did this and were the main blowout.
- **Point lights are physical.** With `decay={2}` the brightness at a surface is
  `intensity / distance²`. The landmark's 26 put its own core at roughly 6x
  white; it is 5 now. The jellyfish guide floats 3-7 units off the lens, so it
  is the most sensitive light in the scene — it is 4.
- **Additive geometry needs a near fade.** The godray cones are 44 units tall
  and the diver swims through them; without the `smoothstep(3, 18, vDepth)` fade
  in `Godrays.tsx`, entering one fills the screen.
- **Clamp anything feeding `totalEmissiveRadiance`.** The seafloor caustic
  function divides by a `length()` that can approach zero and then raises the
  result to the eighth power. Unclamped it wrote wave-shaped white patches
  brighter than the sun. The `clamp(..., 0.0, 1.0)` before the `pow` is load
  bearing — do not remove it.

The knobs, in order of effect: `Bloom` threshold and intensity in
`OceanCanvas.tsx`, then `toneMappingExposure`, then the individual
`pointLight intensity` values.

## What's next

Phase 2 — central hub, opening sequence through the surface, map, three visible
destinations. Then Phase 3 builds the reef zone to portfolio quality.

Fifteen landmarks on two rings is a placement, not a design. They are evenly
spaced around the origin, which is legible but arbitrary: nothing about a
project's position says anything about the project. Grouping them into zones by
category is the obvious next move, and it is what the hub in Phase 2 is for.

Also open:

- Eight case studies have no `lessons` section, because the ported source
  material has no retrospective to draw one from. Those need Isaiah's own words
  rather than an invented paragraph.
- `maya-3d` has a gallery and a video in the old portfolio that this schema has
  nowhere to put. Right now it links straight to the MP4.
- The six data-analysis projects have no live build to link to, so their
  `links` arrays are empty and the case study is all there is.

Deferred on purpose: audio (Phase 6), physics (proximity is a distance check,
which is cheaper and enough here), zone streaming (there is one zone so far).

See `ASSETS.md` for the model ledger and the attribution rules.
