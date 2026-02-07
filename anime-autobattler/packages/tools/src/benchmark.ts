import { Command } from 'commander';
import { RunManager, TICKS_PER_SECOND } from '@anime-autobattler/sim';

const program = new Command();

program
  .name('sim-benchmark')
  .description('Run headless simulation benchmarks')
  .requiredOption('--seed <string>', 'RNG seed')
  .action((options) => {
    const seed = parseInt(options.seed, 10);
    console.log(`Running simulation with seed: ${seed}`);

    const run = new RunManager(seed);

    // Auto-play loop
    let ticks = 0;
    const maxTicks = TICKS_PER_SECOND * 60 * 20; // 20 mins of combat max

    // Initial Start
    run.startWave();

    // Loop
    while (run.phase !== 'victory' && run.phase !== 'gameover' && ticks < maxTicks) {
        if (run.phase === 'intermission') {
            // Check for choices
            if (run.choices.length > 0) {
                 // Simulate User Input: Pick First Available Option
                 // Priorities: Item > Perk > Skill Tree
                 let picked = false;

                 // Try Item
                 const itemIdx = run.choices.findIndex(c => c.type === 'item_selection');
                 if (itemIdx >= 0) {
                     run.choose(itemIdx, 0); // Pick first item
                     console.log(`[Intermission] Picked Item 0`);
                     picked = true;
                 }

                 if (!picked) {
                     const perkIdx = run.choices.findIndex(c => c.type === 'perk_selection');
                     if (perkIdx >= 0) {
                         run.choose(perkIdx, 0); // Pick first perk
                         console.log(`[Intermission] Picked Perk 0`);
                         picked = true;
                     }
                 }

                 if (!picked) {
                      const skillIdx = run.choices.findIndex(c => c.type === 'skill_tree');
                      if (skillIdx >= 0) {
                          run.choose(skillIdx); // "Open" tree (sim just acknowledges)
                          console.log(`[Intermission] Skill Tree (skip)`);
                          picked = true;
                      }
                 }

                 // If we picked something, choices are cleared.
            }

            // Now start next wave
            console.log(`[Run] Starting Wave ${run.currentWave + 1}`);
            run.startWave();
        } else if (run.phase === 'combat') {
            run.tick();
            ticks++;
        }
    }

    // Output Summary
    console.log('--- Simulation End ---');
    console.log(`Result: ${run.phase}`);
    console.log(`Wave Reached: ${run.currentWave}`);
    console.log(`Level: ${run.level}`);
    console.log(`Player HP: ${run.player.currentHp.toFixed(1)}/${run.player.maxHp}`);

    // Last combat log summary
    const lastLogs = run.combat?.log.getLogs() || [];
    console.log(`Last Combat Logs: ${lastLogs.length}`);
    const checksum = lastLogs.reduce((acc, log) => acc + log.message.length + log.tick, 0);
    console.log(`Log Checksum: ${checksum}`);
  });

program.parse();
