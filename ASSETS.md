# Asset ledger

Every model that ships in `public/` gets a row here before it ships. License
verification happens at download time, not at launch time.

Each row below was read out of the GLB's own `asset.extras` block rather than
transcribed from a download page, so it cannot drift from the file that ships.
To re-check any of them:

```bash
python3 - public/models/jellyfish.glb <<'PY'
import json, struct, sys
d = open(sys.argv[1], 'rb').read()
off = 12
while off < len(d):
    ln, ty = struct.unpack_from('<II', d, off)
    if ty == 0x4E4F534A:
        print(json.dumps(json.loads(d[off+8:off+8+ln])['asset'], indent=2))
        break
    off += 8 + ln
PY
```

| Asset | File | Creator | Source | License | Modifications |
| --- | --- | --- | --- | --- | --- |
| Crystal Jellyfish (Leptomedusae) | `public/models/jellyfish.glb` | [n-](https://sketchfab.com/n-) | [Sketchfab](https://sketchfab.com/3d-models/crystal-jellyfish-leptomedusae-38ac0d91213d447eb3366f615298ce8f) | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | Copied from the `isaiahramirezdev` portfolio unchanged. Scaled 0.3 at runtime. Not yet compressed. |
| Manta Ray | `public/models/manta-ray.glb` | [Chenzoss](https://sketchfab.com/Chenzoss) | [Sketchfab](https://sketchfab.com/3d-models/manta-ray-c9989ab953164ee5baa3f401f6041fc9) | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | Renamed from `manta_ray.glb`. Fitted to 4.2 m and recentred at runtime. Ships no animation clip; its motion is procedural. Not yet compressed. |
| Whale Shark Game Ready | `public/models/whale-shark.glb` | [kenchoo](https://sketchfab.com/kenchoo) | [Sketchfab](https://sketchfab.com/3d-models/whale-shark-game-ready-e32a1b2715384935a7f23d1498463339) | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | Renamed from `whale_shark_game_ready.glb`. Fitted to 11 m and recentred at runtime. Plays its `Animation` clip. Not yet compressed. |
| Great White Shark | `public/models/great-white-shark.glb` | [charliegodofsharks](https://sketchfab.com/charliegodofsharks) | [Sketchfab](https://sketchfab.com/3d-models/great-white-shark-bf81b64f0121443da38112f706b7356f) | [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/) | Renamed from `great_white_shark.glb`. Fitted to 5.4 m and recentred at runtime. Plays `Swim`; the `Bite` and `ArmatureAction` clips are deliberately unused. Not yet compressed. |

## Attribution

All four are CC BY 4.0, which requires attribution to reach the people who see
the work — not just the repository. `src/ui/Credits.tsx` renders the list from
`src/creatures/modelCredits.ts`, and the panel opens from the gate, the HUD and
the quick portfolio, because those are three separate entry paths and only one
of them has a HUD.

Adding a model means adding a row here **and** an entry in
`src/creatures/modelCredits.ts`. This ledger on its own does not satisfy the
licence.

## Open items

- [ ] Compress all four GLBs. Together they are 6.7 MB and are the largest item
      in the initial load.
- [ ] The three wildlife models load eagerly. Once the world grows past one
      zone they should stream per zone instead.

## Pipeline

Every downloaded model passes through this before it enters `public/`:

```text
download → verify license → Blender (scale, origin, materials, decimate)
→ export GLB → gltf-transform optimize → test on desktop + mobile
```

```bash
npm install --global @gltf-transform/cli
gltf-transform inspect public/models/jellyfish.glb
gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp
```

Scale and origin are normalised at runtime instead, in
`src/creatures/Wildlife.tsx`: it measures each model's own bounds and fits it to
a target length. That is deliberate — three sources with three unit conventions
should not each need a manual Blender pass before they are usable — but a real
Blender step would still cut the file sizes above.

Keep one art direction (semi-realistic silhouettes, simplified textures,
cinematic lighting). Do not mix ten sources' styles.
