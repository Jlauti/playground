# Content Authoring Guide

This project uses JSON files validated by Zod schemas to define game content. All content resides in `packages/content/data/`.

## Adding Skills

Edit `packages/content/data/skills.json`.

Schema:
- `id`: Unique string ID.
- `name`: Display name.
- `branch`: 'Blade Dance', 'Bloodcraft', or 'Iron Veil'.
- `tier`: 1-5.
- `effects`: List of effects.
  - `type`: 'stat', 'trigger', 'passive'.
  - `stat`: Stat name (e.g., 'atk', 'hp').
  - `value`: Numerical value.

## Adding Items

Edit `packages/content/data/items.json`.

Schema:
- `rarity`: 'Common', 'Rare', 'Epic', 'Legendary'.
- `slot`: 'Weapon', 'Armor', 'Trinket'.
- `stats`: Object with stat bonuses.

## Adding Enemies

Edit `packages/content/data/enemies.json`.

Schema:
- `baseStats`: Initial stats for level 1.
- `scaling`: Stats added per level (optional).
- `abilities`: List of special moves (optional).

## Adding Waves

Edit `packages/content/data/waves.json`.

Schema:
- `waveNumber`: Sequential integer.
- `enemies`: List of enemy definitions.
  - `enemyId`: ID referencing `enemies.json`.
  - `count`: How many to spawn.
  - `elite`: Boolean.
  - `affixes`: List of strings (e.g., "Frenzied", "Armored").

## Verification

After editing JSON files, run the build to verify schemas:

```bash
pnpm -C packages/content build
```
