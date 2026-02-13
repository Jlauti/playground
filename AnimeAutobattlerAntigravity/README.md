# Anime Autobattler

A browser-based 2D anime-style wave roguelite autobattler with deterministic combat simulation, data-driven content, and local persistence.

## 🎮 Features

- **10 Waves + Boss** - Fight through the Shattered Gate
- **Deterministic Combat** - Seeded RNG for reproducible runs
- **3 Skill Branches** - Blade Dance, Bloodcraft, Iron Veil
- **30+ Items** - Weapons, Armor, Trinkets across 4 rarities
- **Data-Driven** - All content defined in validated JSON

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:5173
```

## 📦 Project Structure

```
anime-autobattler/
├── apps/
│   └── web/          # React + Vite + PixiJS frontend
├── packages/
│   ├── sim/          # Deterministic combat simulation
│   ├── content/      # Zod schemas + JSON content
│   └── tools/        # CLI utilities
└── pnpm-workspace.yaml
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run all tests |
| `pnpm test:sim` | Run simulation tests |
| `pnpm sim:benchmark --seed 123` | Run headless benchmark |

## 🎯 Gameplay

### Run Flow
1. **Choose a Relic** - Start with a run modifier
2. **Battle Waves 1-10** - Auto-combat with strategic choices
3. **Intermission** - Pick perks, items, or allocate skills
4. **Boss Fight** - Defeat the Kurogane Warden

### Skill Branches

| Branch | Focus | Keystone |
|--------|-------|----------|
| ⚔️ Blade Dance | Attack Speed, Crits | Frenzy Loop |
| 🩸 Bloodcraft | Bleed, DoT | Hemorrhage Engine |
| 🛡️ Iron Veil | Defense, Shields | Unbreakable |

### Status Effects

- **Bleed** - Stacking physical DoT
- **Poison** - Stacking magic DoT
- **Vulnerable** - Increased damage taken
- **Shield** - Temporary HP buffer

## 🛠️ Development

### Adding Content

All content is defined in `packages/content/data/`:

```bash
packages/content/data/
├── skills.json    # Skill tree nodes
├── perks.json     # Run perks
├── items.json     # Equipment
├── enemies.json   # Enemy templates + affixes
├── waves.json     # Wave configurations
└── relics.json    # Starting relics
```

Content is validated with Zod schemas in `packages/content/src/schemas.ts`.

### Simulation

The combat sim is pure TypeScript with no DOM dependencies:

```typescript
import { SeededRNG, simulateCombat, createPlayer, createEnemy } from '@anime-autobattler/sim';

const rng = new SeededRNG(12345);
const player = createPlayer('player', 'Vanguard');
const enemies = [createEnemy('enemy', 'shadow_imp', 'Shadow Imp', baseStats)];

const result = simulateCombat(player, enemies, rng);
console.log(result.winner); // 'player' | 'enemies'
```

### Determinism Test

Same seed = same results:

```typescript
const run1 = simulateCombat(player, enemies, new SeededRNG(123));
const run2 = simulateCombat(player, enemies, new SeededRNG(123));
assert(run1.events.length === run2.events.length);
```

## 📄 License

MIT
