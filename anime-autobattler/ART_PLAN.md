# Art Plan (Painted 512x512) — Skeletal-First Pipeline

Goal: ship a coherent anime 2D look with minimal animation labor by using skeletal rigs (recommended), while keeping a frame-by-frame fallback for a few high-impact moments (crit slash, boss telegraph).

This plan assumes:
- Painted style (not pixel art).
- Nominal character canvas: `512x512` per pose/asset.
- Rendering target: PixiJS (web).

## Why Skeletal (Vs Frame-by-Frame)

Skeletal is easier for:
- Many enemies with basic loops (idle, attack, hit, death).
- Reusing the same animation set across variants/skins.
- Iterating timing without re-drawing frames.

Frame-by-frame is still useful for:
- 1–2 premium “impact” effects (crit, ult, boss phase change) where smear frames look best.

Recommendation:
- Skeletal for all units (player + enemies + boss).
- Frame-by-frame only for VFX overlays.

## Visual Targets (MVP)

Units:
- Player (Vanguard): 1 rig.
- Enemies: 6–10 rigs (can share skeleton proportions for speed).
- Boss (Kurogane Warden): 1 rig with 2 phase variants (color/armor overlay swap).

Animations (per unit):
- `idle` (loop, 1–2s)
- `attack` (0.4–0.8s, snap + follow-through)
- `hit` (0.2–0.3s, additive recoil)
- `death` (0.8–1.2s)
- Optional for boss: `cast` / `shield_up`

VFX overlays (frame-by-frame spritesheets OK):
- `slash_arc`
- `bleed_tick`
- `poison_puff`
- `shield_shimmer`
- `vulnerable_mark`
- `crit_flash`

## Tooling Options

Rigging/Animation:
- Preferred paid: Spine 2D
- Free: DragonBones (export quality varies; still viable)

Painting:
- Krita (free), Clip Studio Paint (common for anime), Photoshop

Packing/Export:
- Spine: export JSON + atlas (preferred) or binary + atlas
- Texture packer: Spine built-in, or external packers if needed

Pixi Runtime:
- `pixi-spine` for Spine exports, OR render spritesheets if you avoid runtimes.

## Asset Spec (512x512 Painted)

1. Canvas and scale
- Unit “design canvas”: `512x512`.
- Keep feet grounded around a consistent baseline (e.g., y=460).
- Leave headroom for VFX (top ~15% of canvas).

2. Layer strategy (important for rigs)
Minimum cut list (player + most humanoids):
- Head: `head_base`, `hair_front`, `hair_back`
- Torso: `torso`
- Arms: `upper_arm_L`, `lower_arm_L`, `hand_L`, same for R
- Legs: `thigh_L`, `shin_L`, `foot_L`, same for R
- Weapon: `weapon`
- Accessories: `cape`, `scarf`, `armor_overlay` (optional)
- FX attachment points: empty bones `fx_hand`, `fx_hit`, `fx_head`

Non-humanoid enemies:
- Still split into 6–12 parts: core/body, jaw, arms, spikes, etc.
- Favor fewer parts over perfect anatomy; readability wins.

3. Shading consistency
- Choose 1 global light direction (top-left is typical).
- Hard edge highlights + soft gradients: “anime painted” look.
- Use outline as a stylistic choice:
  - Either no outline (painterly) + strong rim light
  - Or thin colored outline (dark navy), not black

## Production Workflow

### Phase 0: Style Lock (1 evening)
Deliverables:
- 1 color key sheet: palette + materials (metal, cloth, skin).
- 1 finished “key art” bust for Vanguard and 1 enemy.

Quality check:
- Can you recognize the unit at 128px tall on screen?

### Phase 1: Character Sheets (per unit)
Deliverables per unit:
- `front` pose (neutral)
- `3/4` pose (optional but helps)
- Callouts for materials + small details
- “Cut map” notes (what parts will be separated)

### Phase 2: Cut & Rig
Steps:
1. Paint the unit as a single piece at `512x512`.
2. Duplicate file, cut into parts on separate layers (as per cut list).
3. Export each part as PNG with transparency.
4. Rig in Spine/DragonBones:
   - Bones + weights (keep weights simple; avoid overfitting).
   - Add attachment points for VFX.

Tips:
- Hide seams under armor straps, sleeves, hair layers.
- Prefer fewer deformation meshes; use rotations where possible.

### Phase 3: Animate Core Loops
Create:
- `idle`: subtle breathing + hair/cape secondary.
- `attack`: strong anticipation + impact frame; weapon trail is VFX.
- `hit`: quick recoil + flash VFX (handled in renderer).
- `death`: collapse + dissolve (optionally handled via alpha fade).

Export:
- Atlas page size: 2048 or 4096 depending on count.
- Keep textures power-of-two friendly for web performance.

### Phase 4: VFX Pack (Frame-by-Frame)
Deliverables:
- 512x512 VFX frames, packed into spritesheets (e.g., `slash_arc_01..12`).
- Separate additive-blend friendly versions (bright edges, minimal dark).

### Phase 5: Integration & Iteration
Integration tasks:
- Build a `unit preview` scene in the web app to view rigs + animations.
- Verify timing aligns with sim events (attack impact tick, status tick).
- Add hit-stop (1–3 frames) and camera shake (small) for crits/boss.

## Naming Conventions (Suggested)

Directory layout under `anime-autobattler/apps/web/public/assets/`:
- `units/vanguard/`:
  - `skeleton.json` (or `.skel`)
  - `atlas.atlas`
  - `atlas.png`
- `units/enemies/<enemy_id>/...`
- `vfx/` spritesheets + JSON frame data (or simple sequential naming)

Animation names:
- `idle`, `attack`, `hit`, `death`, `cast`, `shield_up`

## Performance Guardrails (Web)

- Prefer skeletal attachments packed into 1–2 atlases per unit.
- Avoid exporting every unit at full 512 texture density if it’s always drawn smaller:
  - If on-screen size is ~256px tall, consider exporting at 0.5x scale.
- VFX spritesheets: keep frames tight (trim transparent borders).

## “Done” Definition For Art MVP

Art MVP is done when:
- Vanguard + 3 enemy rigs + boss rig exist.
- Each has `idle/attack/hit/death` and looks readable at gameplay scale.
- VFX overlays exist for slash + bleed + poison + shield.
- No glaring seams or jitter during loops.

## Fallback: Frame-by-Frame Only (If You Abandon Rigs)

If you decide to go frame-by-frame for units:
- Use 6–8 frames for `idle`, 6–10 for `attack`, 2–3 for `hit`, 8–12 for `death`.
- Keep silhouettes consistent with a locked ground plane.
- Still do VFX as separate spritesheets to avoid re-drawing effects per unit.

