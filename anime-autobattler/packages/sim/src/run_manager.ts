import { Entity } from './entity.js';
import { CombatState, TICKS_PER_SECOND } from './combat.js';
import { RNG } from './rng.js';
import { Stats, Content } from '@anime-autobattler/content';

export type GamePhase = 'combat' | 'intermission' | 'gameover' | 'victory';

export class RunManager {
  public seed: number;
  public rng: RNG;
  public player: Entity;

  public currentWave: number = 0;
  public maxWaves: number = 10;
  public combat: CombatState | null = null;
  public phase: GamePhase = 'intermission';

  // Economy
  public gold: number = 0;
  public xp: number = 0;
  public level: number = 1;
  public skillPoints: number = 0;

  // Rewards / Choice State
  public choices: any[] = []; // Stores the current intermission options
  public itemsDroppedSinceLastPick: number = 0; // Pity Timer tracking: waves passed without item drop

  constructor(seed: number) {
    this.seed = seed;
    this.rng = new RNG(seed);

    // Init Player
    const baseStats: Stats = {
      hp: 100, maxHp: 100, atk: 10, arm: 0, res: 0, as: 1.0,
      critChance: 5, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0
    };
    this.player = new Entity('player', 'Vanguard', baseStats);
  }

  public startWave() {
    if (this.phase !== 'intermission') return;

    this.currentWave++;
    if (this.currentWave > this.maxWaves + 1) { // +1 for boss
       this.phase = 'victory';
       return;
    }

    // Load Wave Data
    const waveData = Content.waves.find(w => w.waveNumber === this.currentWave);
    if (!waveData) {
        // console.error(`Wave ${this.currentWave} not found!`);
        this.phase = 'victory'; // Or error
        return;
    }

    const enemies: Entity[] = [];
    for (const eDef of waveData.enemies) {
        const count = eDef.count || 1;
        for (let i = 0; i < count; i++) {
            const template = Content.enemies.find(en => en.id === eDef.enemyId);
            if (template) {
                // Apply scaling based on wave/level if needed
                // For MVP, just use baseStats or simple multiplier

                // Helper to ensure all required Stats fields are present (defaulting to 0)
                const enemyStats: Stats = {
                    hp: template.baseStats.hp ?? 100,
                    maxHp: template.baseStats.maxHp ?? 100,
                    atk: template.baseStats.atk ?? 10,
                    arm: template.baseStats.arm ?? 0,
                    res: template.baseStats.res ?? 0,
                    as: template.baseStats.as ?? 1.0,
                    critChance: template.baseStats.critChance ?? 0,
                    critMultiplier: template.baseStats.critMultiplier ?? 1.5,
                    pwr: template.baseStats.pwr ?? 0,
                    cdr: template.baseStats.cdr ?? 0,
                    lifesteal: template.baseStats.lifesteal ?? 0,
                    evasion: template.baseStats.evasion ?? 0
                };

                const enemy = new Entity(`${template.id}_${i}`, template.name, enemyStats);

                // Elite Affixes
                if (eDef.elite && eDef.affixes) {
                    enemy.name = `Elite ${enemy.name}`;
                    // Apply Affixes (Simple stat bumps for MVP)
                    if (eDef.affixes.includes('Frenzied')) enemy.stats.as *= 1.5;
                    if (eDef.affixes.includes('Armored')) enemy.stats.arm += 10;
                    if (eDef.affixes.includes('Toxic')) { /* Logic handled in combat/status */ }
                    if (eDef.affixes.includes('Vampiric')) enemy.stats.lifesteal += 20;
                    if (eDef.affixes.includes('Volatile')) { /* Logic handled in death */ }
                }

                enemies.push(enemy);
            }
        }
    }

    this.combat = new CombatState(this.rng.nextInt(0, 100000), this.player, enemies);
    this.phase = 'combat';
  }

  public tick() {
    if (this.phase === 'combat' && this.combat) {
        this.combat.tick();

        if (this.combat.player.isDead) {
            this.phase = 'gameover';
        } else if (this.combat.enemies.length === 0) {
            this.endWave();
        }
    }
  }

  private endWave() {
      this.phase = 'intermission';
      // Grant Rewards
      this.gold += 50 + (this.currentWave * 10);
      this.xp += 100; // Check Level Up

      // Level Up Logic
      if (this.xp >= this.level * 100) {
          this.level++;
          this.skillPoints++;
          this.xp -= (this.level - 1) * 100;
          // Heal on level up?
          this.player.heal(this.player.maxHp * 0.2);
      }

      this.generateChoices();
  }

  private generateChoices() {
      // "After EVERY wave, the player performs EXACTLY ONE meaningful choice"

      this.choices = [];

      this.itemsDroppedSinceLastPick++;

      const offerItem = this.itemsDroppedSinceLastPick >= 2;

      if (offerItem) {
          const items = [...Content.items];
          const picks = [];
          for(let i=0; i<3; i++) {
              if (items.length === 0) break;
              const idx = this.rng.nextInt(0, items.length - 1);
              picks.push(items[idx]);
              items.splice(idx, 1);
          }
          // Placeholder structure for internal logic before mapped to UI choices
      }

      // UX Requirements: "Intermission screen: Three big cards: Skill Tree, Pick a Perk, Pick an Item"

      const perkOptions = this.rollPerks(3);
      const itemOptions = this.rollItems(3);

      this.choices = [
          { type: 'skill_tree', label: 'Skill Tree' },
          { type: 'perk_selection', options: perkOptions },
          { type: 'item_selection', options: itemOptions }
      ];

      // Spec: "Item pity timer: Every 2 waves, offer an item choice if no item dropped."
      if (!offerItem) {
          this.choices = this.choices.filter(c => c.type !== 'item_selection');
      }
  }

  private rollPerks(count: number) {
       const perks = [...Content.perks];
       const picks = [];
       for(let i=0; i<count; i++) {
          if (perks.length === 0) break;
          const idx = this.rng.nextInt(0, perks.length - 1);
          picks.push(perks[idx]);
          perks.splice(idx, 1);
       }
       return picks;
  }

  private rollItems(count: number) {
       const items = [...Content.items];
       const picks = [];
       for(let i=0; i<count; i++) {
          if (items.length === 0) break;
          const idx = this.rng.nextInt(0, items.length - 1);
          picks.push(items[idx]);
          items.splice(idx, 1);
       }
       return picks;
  }

  public choose(choiceIndex: number, subIndex?: number) {
      if (this.phase !== 'intermission') return;

      const choice = this.choices[choiceIndex];
      if (!choice) return;

      if (choice.type === 'perk_selection' && typeof subIndex === 'number') {
          const perk = choice.options[subIndex];
          this.applyPerk(perk);
      } else if (choice.type === 'item_selection' && typeof subIndex === 'number') {
           const item = choice.options[subIndex];
           this.equipItem(item);
           this.itemsDroppedSinceLastPick = 0; // Reset pity
      } else if (choice.type === 'skill_tree') {
          // No-op for headless sim usually, just acknowledge
          return { status: 'open_skill_tree' };
      }

      this.choices = []; // Clear choices
  }

  private applyPerk(perk: any) {
      // Apply stats
      if (perk.stats) {
          for (const [key, val] of Object.entries(perk.stats)) {
              if (val === undefined) continue;

              if (key === 'maxHp') {
                  this.player.maxHp += (val as number);
                  this.player.currentHp += (val as number);
              } else if (key === 'hp') {
                   this.player.heal(val as number);
              } else {
                  // Safe cast because we know stats structure
                  (this.player.stats as any)[key] += val;
              }
          }
      }
  }

  private equipItem(item: any) {
       if (item.stats) {
          for (const [key, val] of Object.entries(item.stats)) {
              if (val === undefined) continue;

              if (key === 'maxHp') {
                  this.player.maxHp += (val as number);
                  this.player.currentHp += (val as number);
              } else if (key === 'hp') {
                   this.player.maxHp += (val as number);
                   this.player.currentHp += (val as number);
              } else {
                  (this.player.stats as any)[key] += val;
              }
          }
      }
  }
}
