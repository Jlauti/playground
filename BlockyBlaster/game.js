/* ============================================
   BLOCKY BLASTER - Game Logic
   ============================================ */

// Game State
const game = {
    canvas: null,
    ctx: null,
    width: 800,
    height: 520,
    running: false,
    score: 0,
    highScore: 0,
    wave: 1,
    nextWaveScore: 100,
    lives: 3,
    player: null,
    bullets: [],
    enemies: [],
    particles: [],
    enemyBullets: [],
    powerups: [],
    boss: null,
    bossWarning: false,
    bossWarningTimer: 0,
    bossDefeatedThisWave: false,
    lastBossWave: 0,
    waveProgressionCooldown: 0,
    lastTime: 0,
    enemySpawnTimer: 0,
    playerSpeedMultiplier: 1.0,
    keys: {}
};

// Powerup Types
const POWERUP_TYPES = {
    RAPID_FIRE: {
        name: 'Rapid Fire',
        color: '#FF6B6B',
        icon: '🔥',
        duration: 5000,
        description: 'Faster shooting!'
    },
    TRIPLE_SHOT: {
        name: 'Triple Shot',
        color: '#9B59B6',
        icon: '🎯',
        duration: 6000,
        description: 'Three bullets at once!'
    },
    SHIELD: {
        name: 'Shield',
        color: '#3498DB',
        icon: '🛡️',
        duration: 4000,
        description: 'Temporary invincibility!'
    },
    EXTRA_LIFE: {
        name: 'Extra Life',
        color: '#E74C3C',
        icon: '❤️',
        duration: 0,
        description: '+1 Life!'
    },
    SPEED_BOOST: {
        name: 'Speed Boost',
        color: '#F1C40F',
        icon: '⚡',
        duration: 5000,
        description: 'Move faster!'
    }
};

// ============================================
// Character Drawing Functions (Based on the blocky art)
// ============================================

function drawOrangePlayer(ctx, x, y, width, height) {
    const scale = width / 60;

    // Body (orange rectangle)
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x, y + height * 0.2, width, height * 0.6);

    // Darker orange outline
    ctx.strokeStyle = '#CC7000';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, y + height * 0.2, width, height * 0.6);

    // Head/ears (triangle horns)
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.1, y + height * 0.2);
    ctx.lineTo(x + width * 0.2, y);
    ctx.lineTo(x + width * 0.3, y + height * 0.2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + width * 0.7, y + height * 0.2);
    ctx.lineTo(x + width * 0.8, y);
    ctx.lineTo(x + width * 0.9, y + height * 0.2);
    ctx.fill();

    // Orange flame on top
    ctx.fillStyle = '#FF6B00';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.4, y + height * 0.2);
    ctx.lineTo(x + width * 0.5, y - height * 0.1);
    ctx.lineTo(x + width * 0.6, y + height * 0.2);
    ctx.fill();

    // Eyes (blue like in drawing)
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(x + width * 0.2, y + height * 0.35, width * 0.2, height * 0.15);
    ctx.fillRect(x + width * 0.6, y + height * 0.35, width * 0.2, height * 0.15);

    // Eye pupils
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(x + width * 0.25, y + height * 0.38, width * 0.1, height * 0.1);
    ctx.fillRect(x + width * 0.65, y + height * 0.38, width * 0.1, height * 0.1);

    // X mark (like in the drawing)
    ctx.strokeStyle = '#CC3300';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.35, y + height * 0.55);
    ctx.lineTo(x + width * 0.5, y + height * 0.7);
    ctx.moveTo(x + width * 0.5, y + height * 0.55);
    ctx.lineTo(x + width * 0.35, y + height * 0.7);
    ctx.stroke();

    // Legs
    ctx.fillStyle = '#FFA500';
    ctx.fillRect(x + width * 0.15, y + height * 0.8, width * 0.2, height * 0.2);
    ctx.fillRect(x + width * 0.65, y + height * 0.8, width * 0.2, height * 0.2);
}

function drawGreenEnemy(ctx, x, y, width, height, variant = 0) {
    const scale = width / 50;

    // Body (green rectangle)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x, y + height * 0.25, width, height * 0.5);

    // Darker green outline
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, y + height * 0.25, width, height * 0.5);

    // Flame hair (orange/red like in drawing)
    ctx.fillStyle = '#FF5722';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + width * (0.2 + i * 0.25), y + height * 0.25);
        ctx.lineTo(x + width * (0.3 + i * 0.25), y - height * 0.05 - Math.sin(Date.now() / 100 + i) * 5);
        ctx.lineTo(x + width * (0.4 + i * 0.25), y + height * 0.25);
        ctx.fill();
    }

    // Red eyes/glasses (like in drawing)
    ctx.fillStyle = '#F44336';
    ctx.fillRect(x + width * 0.1, y + height * 0.35, width * 0.3, height * 0.12);
    ctx.fillRect(x + width * 0.6, y + height * 0.35, width * 0.3, height * 0.12);

    // Eye bridge
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(x + width * 0.4, y + height * 0.38, width * 0.2, height * 0.06);

    // Arms (stretched out like in drawing)
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x - width * 0.3, y + height * 0.35, width * 0.35, height * 0.15);
    ctx.fillRect(x + width * 0.95, y + height * 0.35, width * 0.35, height * 0.15);

    // Legs
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x + width * 0.1, y + height * 0.75, width * 0.25, height * 0.25);
    ctx.fillRect(x + width * 0.65, y + height * 0.75, width * 0.25, height * 0.25);
}

function drawBlueEnemy(ctx, x, y, width, height) {
    const scale = width / 50;

    // Body (blue rectangle)
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x, y + height * 0.2, width, height * 0.55);

    // Darker blue outline
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, y + height * 0.2, width, height * 0.55);

    // Head antenna
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x + width * 0.45, y, width * 0.1, height * 0.2);
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y, width * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (grid pattern like in drawing)
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(x + width * 0.15, y + height * 0.3, width * 0.25, height * 0.2);
    ctx.fillRect(x + width * 0.6, y + height * 0.3, width * 0.25, height * 0.2);

    // Eye pupils (cross pattern)
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.275, y + height * 0.3);
    ctx.lineTo(x + width * 0.275, y + height * 0.5);
    ctx.moveTo(x + width * 0.15, y + height * 0.4);
    ctx.lineTo(x + width * 0.4, y + height * 0.4);
    ctx.stroke();

    // Bow tie (red like in drawing)
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.moveTo(x + width * 0.4, y + height * 0.55);
    ctx.lineTo(x + width * 0.5, y + height * 0.6);
    ctx.lineTo(x + width * 0.4, y + height * 0.65);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + width * 0.6, y + height * 0.55);
    ctx.lineTo(x + width * 0.5, y + height * 0.6);
    ctx.lineTo(x + width * 0.6, y + height * 0.65);
    ctx.fill();

    // Legs
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(x + width * 0.15, y + height * 0.75, width * 0.2, height * 0.25);
    ctx.fillRect(x + width * 0.65, y + height * 0.75, width * 0.2, height * 0.25);
}

function drawRedEnemy(ctx, x, y, width, height) {
    const scale = width / 50;

    // Body (dark red rectangle - based on the red creature in drawing)
    ctx.fillStyle = '#E53935';
    ctx.fillRect(x, y + height * 0.2, width, height * 0.6);

    // Darker outline
    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x, y + height * 0.2, width, height * 0.6);

    // Spiky top (crown-like from the drawing)
    ctx.fillStyle = '#E53935';
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x + width * (0.1 + i * 0.22), y + height * 0.2);
        ctx.lineTo(x + width * (0.2 + i * 0.22), y - height * 0.1);
        ctx.lineTo(x + width * (0.3 + i * 0.22), y + height * 0.2);
        ctx.fill();
    }

    // Angry eyes
    ctx.fillStyle = '#FFEB3B';
    ctx.fillRect(x + width * 0.15, y + height * 0.35, width * 0.25, height * 0.15);
    ctx.fillRect(x + width * 0.6, y + height * 0.35, width * 0.25, height * 0.15);

    // Angry eyebrows
    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.1, y + height * 0.35);
    ctx.lineTo(x + width * 0.4, y + height * 0.28);
    ctx.moveTo(x + width * 0.9, y + height * 0.35);
    ctx.lineTo(x + width * 0.6, y + height * 0.28);
    ctx.stroke();

    // Zigzag pattern on body (like in drawing)
    ctx.strokeStyle = '#B71C1C';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.1, y + height * 0.55);
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(x + width * (0.2 + i * 0.15), y + height * (0.5 + (i % 2) * 0.1));
    }
    ctx.stroke();

    // Legs
    ctx.fillStyle = '#E53935';
    ctx.fillRect(x + width * 0.1, y + height * 0.8, width * 0.25, height * 0.2);
    ctx.fillRect(x + width * 0.65, y + height * 0.8, width * 0.25, height * 0.2);
}

// ============================================
// Game Classes
// ============================================

class Player {
    constructor() {
        this.width = 60;
        this.height = 70;
        this.x = game.width / 2 - this.width / 2;
        this.y = game.height - this.height - 20;
        this.baseSpeed = 6;
        this.speed = this.baseSpeed;
        this.shootCooldown = 0;
        this.baseShootDelay = 200; // ms between shots
        this.shootDelay = this.baseShootDelay;
        this.invincible = false;
        this.invincibleTimer = 0;

        // Powerup states
        this.powerups = {
            rapidFire: { active: false, timer: 0 },
            tripleShot: { active: false, timer: 0 },
            shield: { active: false, timer: 0 },
            speedBoost: { active: false, timer: 0 }
        };

        // For displaying active powerups
        this.activePowerupDisplay = null;
        this.powerupDisplayTimer = 0;
    }

    update(deltaTime) {
        // Update powerup timers
        this.updatePowerups(deltaTime);

        // Calculate current speed with global multiplier
        const currentSpeed = this.speed * game.playerSpeedMultiplier;

        // Movement
        if (game.keys['ArrowLeft'] || game.keys['a']) {
            this.x -= currentSpeed;
        }
        if (game.keys['ArrowRight'] || game.keys['d']) {
            this.x += currentSpeed;
        }

        // Boundaries
        this.x = Math.max(0, Math.min(game.width - this.width, this.x));

        // Shooting
        this.shootCooldown -= deltaTime;
        if ((game.keys[' '] || game.keys['Space']) && this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.shootDelay;
        }

        // Invincibility timer (from damage, not shield powerup)
        if (this.invincible && !this.powerups.shield.active) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Powerup display timer
        if (this.powerupDisplayTimer > 0) {
            this.powerupDisplayTimer -= deltaTime;
        }
    }

    updatePowerups(deltaTime) {
        // Rapid Fire
        if (this.powerups.rapidFire.active) {
            this.powerups.rapidFire.timer -= deltaTime;
            this.shootDelay = this.baseShootDelay * 0.4; // 60% faster
            if (this.powerups.rapidFire.timer <= 0) {
                this.powerups.rapidFire.active = false;
                this.shootDelay = this.baseShootDelay;
            }
        }

        // Triple Shot - just tracks timer, shooting logic in shoot()
        if (this.powerups.tripleShot.active) {
            this.powerups.tripleShot.timer -= deltaTime;
            if (this.powerups.tripleShot.timer <= 0) {
                this.powerups.tripleShot.active = false;
            }
        }

        // Shield
        if (this.powerups.shield.active) {
            this.powerups.shield.timer -= deltaTime;
            this.invincible = true;
            if (this.powerups.shield.timer <= 0) {
                this.powerups.shield.active = false;
                this.invincible = false;
            }
        }

        // Speed Boost
        if (this.powerups.speedBoost.active) {
            this.powerups.speedBoost.timer -= deltaTime;
            this.speed = this.baseSpeed * 1.6; // 60% faster
            if (this.powerups.speedBoost.timer <= 0) {
                this.powerups.speedBoost.active = false;
                this.speed = this.baseSpeed;
            }
        }
    }

    applyPowerup(type) {
        const powerupInfo = POWERUP_TYPES[type];

        // Show powerup notification
        this.activePowerupDisplay = powerupInfo;
        this.powerupDisplayTimer = 2000;

        // Create pickup particles
        for (let i = 0; i < 20; i++) {
            game.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 600,
                color: powerupInfo.color,
                size: Math.random() * 6 + 3
            });
        }

        switch (type) {
            case 'RAPID_FIRE':
                this.powerups.rapidFire.active = true;
                this.powerups.rapidFire.timer = powerupInfo.duration;
                break;
            case 'TRIPLE_SHOT':
                this.powerups.tripleShot.active = true;
                this.powerups.tripleShot.timer = powerupInfo.duration;
                break;
            case 'SHIELD':
                this.powerups.shield.active = true;
                this.powerups.shield.timer = powerupInfo.duration;
                break;
            case 'EXTRA_LIFE':
                game.lives = Math.min(game.lives + 1, 5); // Max 5 lives
                updateLivesDisplay();
                break;
            case 'SPEED_BOOST':
                this.powerups.speedBoost.active = true;
                this.powerups.speedBoost.timer = powerupInfo.duration;
                break;
        }
    }

    shoot() {
        const bulletColor = this.powerups.rapidFire.active ? '#FF6B6B' : '#4ECDC4';

        if (this.powerups.tripleShot.active) {
            // Triple shot - three bullets in a spread
            const angles = [-0.3, 0, 0.3];
            for (const angle of angles) {
                game.bullets.push({
                    x: this.x + this.width / 2 - 5,
                    y: this.y,
                    width: 10,
                    height: 20,
                    speed: 10,
                    vx: Math.sin(angle) * 3,
                    color: '#9B59B6'
                });
            }
        } else {
            // Normal single bullet
            game.bullets.push({
                x: this.x + this.width / 2 - 5,
                y: this.y,
                width: 10,
                height: 20,
                speed: 10,
                vx: 0,
                color: bulletColor
            });
        }

        // Muzzle flash particles
        const flashColor = this.powerups.tripleShot.active ? '#9B59B6' :
            (this.powerups.rapidFire.active ? '#FF6B6B' : '#4ECDC4');
        for (let i = 0; i < 5; i++) {
            game.particles.push({
                x: this.x + this.width / 2,
                y: this.y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 2,
                life: 300,
                color: flashColor,
                size: Math.random() * 5 + 2
            });
        }
    }

    draw(ctx) {
        // Draw shield effect
        if (this.powerups.shield.active) {
            ctx.save();
            ctx.strokeStyle = '#3498DB';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#3498DB';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2,
                Math.max(this.width, this.height) / 2 + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Speed boost trail effect
        if (this.powerups.speedBoost.active) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#F1C40F';
            ctx.fillRect(this.x - 5, this.y + this.height, this.width + 10, 20);
            ctx.restore();
        }

        // Flash when invincible from damage (not shield)
        if (this.invincible && !this.powerups.shield.active && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        drawOrangePlayer(ctx, this.x, this.y, this.width, this.height);

        ctx.globalAlpha = 1;

        // Draw powerup notification
        if (this.powerupDisplayTimer > 0 && this.activePowerupDisplay) {
            const alpha = Math.min(1, this.powerupDisplayTimer / 500);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = this.activePowerupDisplay.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.activePowerupDisplay.color;
            ctx.fillText(
                `${this.activePowerupDisplay.icon} ${this.activePowerupDisplay.name}!`,
                this.x + this.width / 2,
                this.y - 20
            );
            ctx.restore();
        }

        // Draw active powerup indicators at bottom of player
        this.drawPowerupIndicators(ctx);
    }

    drawPowerupIndicators(ctx) {
        const activeOnes = [];
        if (this.powerups.rapidFire.active) activeOnes.push({ type: POWERUP_TYPES.RAPID_FIRE, timer: this.powerups.rapidFire.timer, max: POWERUP_TYPES.RAPID_FIRE.duration });
        if (this.powerups.tripleShot.active) activeOnes.push({ type: POWERUP_TYPES.TRIPLE_SHOT, timer: this.powerups.tripleShot.timer, max: POWERUP_TYPES.TRIPLE_SHOT.duration });
        if (this.powerups.shield.active) activeOnes.push({ type: POWERUP_TYPES.SHIELD, timer: this.powerups.shield.timer, max: POWERUP_TYPES.SHIELD.duration });
        if (this.powerups.speedBoost.active) activeOnes.push({ type: POWERUP_TYPES.SPEED_BOOST, timer: this.powerups.speedBoost.timer, max: POWERUP_TYPES.SPEED_BOOST.duration });

        if (activeOnes.length === 0) return;

        const barWidth = 40;
        const barHeight = 4;
        const startX = this.x + (this.width - barWidth * activeOnes.length - 5 * (activeOnes.length - 1)) / 2;

        activeOnes.forEach((p, i) => {
            const x = startX + i * (barWidth + 5);
            const y = this.y + this.height + 5;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(x, y, barWidth, barHeight);

            // Progress
            ctx.fillStyle = p.type.color;
            ctx.fillRect(x, y, barWidth * (p.timer / p.max), barHeight);
        });
    }

    hit() {
        if (this.invincible) return false;

        game.lives--;
        updateLivesDisplay();

        // Explosion particles
        for (let i = 0; i < 20; i++) {
            game.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 500,
                color: '#FFA500',
                size: Math.random() * 8 + 3
            });
        }

        if (game.lives <= 0) {
            gameOver();
            return true;
        }

        // Brief invincibility
        this.invincible = true;
        this.invincibleTimer = 2000;
        return false;
    }
}

// Powerup Class
class Powerup {
    constructor(x, y, type) {
        this.width = 30;
        this.height = 30;
        this.x = x - this.width / 2;
        this.y = y;
        this.type = type;
        this.speed = 2;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
        this.info = POWERUP_TYPES[type];
    }

    update(deltaTime) {
        this.y += this.speed;
        this.rotation += deltaTime * 0.003;

        // Remove if off screen
        if (this.y > game.height + 50) {
            return true;
        }
        return false;
    }

    draw(ctx) {
        const bobY = Math.sin(Date.now() / 200 + this.bobOffset) * 3;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2 + bobY;

        ctx.save();

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.info.color;

        // Outer ring
        ctx.strokeStyle = this.info.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circle
        ctx.fillStyle = this.info.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.globalAlpha = 1;
        ctx.strokeStyle = this.info.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Icon
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(this.info.icon, centerX, centerY);

        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, type) {
        this.width = 50;
        this.height = 55;
        this.x = x;
        this.y = y;
        this.type = type; // 'green', 'blue', 'red'
        this.speed = 1 + game.wave * 0.2;
        this.direction = 1;
        this.shootTimer = Math.random() * 2000 + 1000;
        this.health = type === 'red' ? 3 : (type === 'blue' ? 2 : 1);
        this.points = type === 'red' ? 30 : (type === 'blue' ? 20 : 10);
        this.moveTimer = 0;
        this.movePhase = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        // Sinusoidal movement
        this.moveTimer += deltaTime;
        this.x += Math.sin(this.moveTimer / 500 + this.movePhase) * 0.5;

        // Slow descent
        this.y += 0.3 + game.wave * 0.05;

        // Boundaries
        if (this.x <= 0 || this.x >= game.width - this.width) {
            this.direction *= -1;
        }

        // Shooting
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0 && Math.random() < 0.3) {
            this.shoot();
            this.shootTimer = Math.random() * 3000 + 2000 - game.wave * 100;
        }

        // Remove if off screen
        if (this.y > game.height + 50) {
            return true; // Mark for removal
        }

        return false;
    }

    shoot() {
        game.enemyBullets.push({
            x: this.x + this.width / 2 - 4,
            y: this.y + this.height,
            width: 8,
            height: 15,
            speed: 2 + game.wave * 0.1,
            color: this.type === 'red' ? '#FF5722' : (this.type === 'blue' ? '#2196F3' : '#4CAF50')
        });
    }

    draw(ctx) {
        switch (this.type) {
            case 'green':
                drawGreenEnemy(ctx, this.x, this.y, this.width, this.height);
                break;
            case 'blue':
                drawBlueEnemy(ctx, this.x, this.y, this.width, this.height);
                break;
            case 'red':
                drawRedEnemy(ctx, this.x, this.y, this.width, this.height);
                break;
        }

        // Health bar for multi-health enemies
        if (this.health > 1) {
            const maxHealth = this.type === 'red' ? 3 : 2;
            const barWidth = this.width * 0.8;
            const barHeight = 4;
            const barX = this.x + (this.width - barWidth) / 2;
            const barY = this.y - 8;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(barX, barY, barWidth * (this.health / maxHealth), barHeight);
        }
    }

    hit() {
        this.health--;

        // Hit particles
        for (let i = 0; i < 8; i++) {
            const color = this.type === 'green' ? '#4CAF50' : (this.type === 'blue' ? '#2196F3' : '#E53935');
            game.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 400,
                color: color,
                size: Math.random() * 6 + 2
            });
        }

        if (this.health <= 0) {
            game.score += this.points;
            updateScoreDisplay();

            // Death explosion
            for (let i = 0; i < 15; i++) {
                const color = this.type === 'green' ? '#4CAF50' : (this.type === 'blue' ? '#2196F3' : '#E53935');
                game.particles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 600,
                    color: color,
                    size: Math.random() * 10 + 4
                });
            }

            // Chance to spawn powerup (20% base, higher for stronger enemies)
            const dropChance = this.type === 'red' ? 0.4 : (this.type === 'blue' ? 0.3 : 0.2);
            if (Math.random() < dropChance) {
                spawnPowerup(this.x + this.width / 2, this.y + this.height / 2);
            }

            return true;
        }
        return false;
    }
}

// Boss Class - appears every 5 waves
class Boss {
    constructor() {
        this.width = 120;
        this.height = 130;
        this.x = game.width / 2 - this.width / 2;
        this.y = -this.height - 50;
        this.targetY = 60;
        this.maxHealth = 25 + game.wave * 5;
        this.health = this.maxHealth;
        this.speed = 2;
        this.direction = 1;
        this.shootTimer = 0;
        this.attackPattern = 0;
        this.patternTimer = 0;
        this.entering = true;
        this.defeated = false;
        this.points = 500 + game.wave * 100;
        this.flashTimer = 0;
    }

    update(deltaTime) {
        // Enter animation
        if (this.entering) {
            this.y += 2;
            if (this.y >= this.targetY) {
                this.y = this.targetY;
                this.entering = false;
            }
            return false;
        }

        // Movement
        this.x += this.speed * this.direction;
        if (this.x <= 20 || this.x >= game.width - this.width - 20) {
            this.direction *= -1;
        }

        // Attack patterns
        this.patternTimer += deltaTime;
        if (this.patternTimer > 5000) {
            this.attackPattern = (this.attackPattern + 1) % 3;
            this.patternTimer = 0;
        }

        // Shooting based on pattern
        this.shootTimer -= deltaTime;
        if (this.shootTimer <= 0) {
            this.shoot();
            this.shootTimer = this.attackPattern === 0 ? 800 :
                (this.attackPattern === 1 ? 1200 : 400);
        }

        // Flash timer
        if (this.flashTimer > 0) {
            this.flashTimer -= deltaTime;
        }

        return false;
    }

    shoot() {
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height;

        switch (this.attackPattern) {
            case 0: // Spread shot
                for (let i = -2; i <= 2; i++) {
                    game.enemyBullets.push({
                        x: centerX - 4,
                        y: bottomY,
                        width: 8,
                        height: 15,
                        speed: 2.5,
                        vx: i * 0.8,
                        color: '#FF5722'
                    });
                }
                break;
            case 1: // Aimed shot at player
                if (game.player) {
                    const dx = (game.player.x + game.player.width / 2) - centerX;
                    const dy = (game.player.y + game.player.height / 2) - bottomY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    game.enemyBullets.push({
                        x: centerX - 6,
                        y: bottomY,
                        width: 12,
                        height: 20,
                        speed: 0,
                        vx: (dx / dist) * 3,
                        vy: (dy / dist) * 3,
                        color: '#E91E63'
                    });
                }
                break;
            case 2: // Rapid fire
                game.enemyBullets.push({
                    x: centerX - 4 + (Math.random() - 0.5) * 40,
                    y: bottomY,
                    width: 8,
                    height: 15,
                    speed: 3,
                    color: '#9C27B0'
                });
                break;
        }
    }

    draw(ctx) {
        const flashAlpha = this.flashTimer > 0 ? 0.5 : 1;
        ctx.globalAlpha = flashAlpha;

        // Draw giant blocky boss based on the drawing style
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        // Main body - dark purple/maroon color
        ctx.fillStyle = '#8E24AA';
        ctx.fillRect(x + w * 0.1, y + h * 0.25, w * 0.8, h * 0.55);

        // Outline
        ctx.strokeStyle = '#6A1B9A';
        ctx.lineWidth = 4;
        ctx.strokeRect(x + w * 0.1, y + h * 0.25, w * 0.8, h * 0.55);

        // Crown spikes (like the red enemy but bigger)
        ctx.fillStyle = '#F44336';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(x + w * (0.15 + i * 0.15), y + h * 0.25);
            ctx.lineTo(x + w * (0.22 + i * 0.15), y + Math.sin(Date.now() / 200 + i) * 5);
            ctx.lineTo(x + w * (0.29 + i * 0.15), y + h * 0.25);
            ctx.fill();
        }

        // Angry eyes with glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFEB3B';
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(x + w * 0.2, y + h * 0.35, w * 0.2, h * 0.12);
        ctx.fillRect(x + w * 0.6, y + h * 0.35, w * 0.2, h * 0.12);
        ctx.shadowBlur = 0;

        // Evil eyebrows
        ctx.strokeStyle = '#4A148C';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.15, y + h * 0.38);
        ctx.lineTo(x + w * 0.4, y + h * 0.32);
        ctx.moveTo(x + w * 0.85, y + h * 0.38);
        ctx.lineTo(x + w * 0.6, y + h * 0.32);
        ctx.stroke();

        // Menacing mouth
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(x + w * 0.3, y + h * 0.55, w * 0.4, h * 0.1);

        // Teeth
        ctx.fillStyle = '#FFFFFF';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(x + w * (0.32 + i * 0.09), y + h * 0.55, w * 0.06, h * 0.05);
        }

        // Arms
        ctx.fillStyle = '#8E24AA';
        ctx.fillRect(x - w * 0.15, y + h * 0.35, w * 0.2, h * 0.2);
        ctx.fillRect(x + w * 0.95, y + h * 0.35, w * 0.2, h * 0.2);

        // Legs
        ctx.fillRect(x + w * 0.2, y + h * 0.8, w * 0.2, h * 0.2);
        ctx.fillRect(x + w * 0.6, y + h * 0.8, w * 0.2, h * 0.2);

        ctx.globalAlpha = 1;

        // Health bar
        const barWidth = w;
        const barHeight = 10;
        const barX = x;
        const barY = y - 20;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#4CAF50' :
            (healthPercent > 0.25 ? '#FFC107' : '#F44336');
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Boss name
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('MEGA BLOCKY BOSS', x + w / 2, barY - 5);
    }

    hit() {
        this.health--;
        this.flashTimer = 100;

        // Hit particles
        for (let i = 0; i < 5; i++) {
            game.particles.push({
                x: this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 400,
                color: '#8E24AA',
                size: Math.random() * 8 + 3
            });
        }

        if (this.health <= 0) {
            this.defeated = true;
            game.score += this.points;
            updateScoreDisplay();

            // Massive explosion
            for (let i = 0; i < 50; i++) {
                game.particles.push({
                    x: this.x + this.width / 2,
                    y: this.y + this.height / 2,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    life: 1000,
                    color: ['#8E24AA', '#F44336', '#FFEB3B', '#FF5722'][Math.floor(Math.random() * 4)],
                    size: Math.random() * 15 + 5
                });
            }

            // Drop multiple powerups
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    spawnPowerup(
                        this.x + this.width / 2 + (Math.random() - 0.5) * 100,
                        this.y + this.height / 2
                    );
                }, i * 200);
            }

            return true;
        }
        return false;
    }
}

// ============================================
// Game Functions
// ============================================

function init() {
    game.canvas = document.getElementById('game-canvas');
    game.ctx = game.canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Load high score from localStorage
    loadHighScore();

    // Draw preview characters
    drawPreview();

    // Event listeners
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    speedSlider.addEventListener('input', (e) => {
        game.playerSpeedMultiplier = parseFloat(e.target.value);
        speedValue.textContent = game.playerSpeedMultiplier.toFixed(1) + 'x';
    });

    // Keyboard events
    window.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;
        // Prevent scrolling with arrow keys and space
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });
}

function resizeCanvas() {
    const container = document.getElementById('game-screen');
    game.canvas.width = game.width;
    game.canvas.height = game.height;
}

function drawPreview() {
    const canvas = document.getElementById('preview-canvas');
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all character types
    drawOrangePlayer(ctx, 10, 15, 40, 50);
    drawGreenEnemy(ctx, 60, 20, 35, 45);
    drawBlueEnemy(ctx, 110, 20, 35, 45);
    drawRedEnemy(ctx, 155, 20, 35, 45);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    resetGame();
    game.running = true;
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    game.score = 0;
    game.wave = 1;
    game.lives = 3;
    game.player = new Player();
    game.bullets = [];
    game.enemies = [];
    game.particles = [];
    game.enemyBullets = [];
    game.powerups = [];
    game.boss = null;
    game.bossWarning = false;
    game.bossWarningTimer = 0;
    game.bossDefeatedThisWave = false;
    game.lastBossWave = 0;
    game.waveProgressionCooldown = 0;
    game.enemySpawnTimer = 0;

    updateScoreDisplay();
    updateWaveDisplay();
    updateLivesDisplay();
}

function restartGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');

    resetGame();
    game.running = true;
    game.lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    game.running = false;

    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').textContent = game.score;
    document.getElementById('final-wave').textContent = game.wave;

    // Check for new high score
    const newHighScoreEl = document.getElementById('new-high-score');
    if (game.score > game.highScore) {
        game.highScore = game.score;
        saveHighScore();
        newHighScoreEl.classList.remove('hidden');
    } else {
        newHighScoreEl.classList.add('hidden');
    }

    document.getElementById('best-score').textContent = game.highScore;
}

function spawnEnemies(deltaTime) {
    // Boss warning countdown
    if (game.bossWarning) {
        game.bossWarningTimer -= deltaTime;
        if (game.bossWarningTimer <= 0) {
            game.bossWarning = false;
            game.boss = new Boss();
            // Clear regular enemies when boss spawns
            game.enemies = [];
        }
        return; // Don't spawn regular enemies during warning
    }

    // Don't spawn enemies while boss is active
    if (game.boss) {
        return;
    }

    game.enemySpawnTimer -= deltaTime;

    if (game.enemySpawnTimer <= 0 && game.enemies.length < 8 + game.wave * 2) {
        const x = Math.random() * (game.width - 60) + 30;
        const y = -60;

        // Randomly choose enemy type based on wave
        let type = 'green';
        const roll = Math.random();

        if (game.wave >= 3 && roll > 0.7) {
            type = 'red';
        } else if (game.wave >= 2 && roll > 0.5) {
            type = 'blue';
        }

        game.enemies.push(new Enemy(x, y, type));
        game.enemySpawnTimer = Math.max(500, 2000 - game.wave * 150);
    }

    // Wave progression cooldown
    if (game.waveProgressionCooldown > 0) {
        game.waveProgressionCooldown -= deltaTime;
    }

    // Wave progression - only progress if no boss is active, not in warning, and cooldown is done
    if (game.score >= game.nextWaveScore && !game.boss && !game.bossWarning && game.waveProgressionCooldown <= 0) {
        game.wave++;

        // Calculate requirement for NEXT wave relative to CURRENT score
        // Scaling difficulty: 100 + (wave * 50) points needed per wave
        game.nextWaveScore = Math.floor(game.score + 100 + (game.wave * 50));

        updateWaveDisplay();

        // Set cooldown to prevent rapid wave advancement (2 seconds between waves)
        game.waveProgressionCooldown = 2000;

        // Reset boss defeated flag for new wave
        game.bossDefeatedThisWave = false;

        // Check if it's time for a boss (every 5 waves from the last boss)
        // Boss spawns at wave 5, 10, 15, etc. but only if we've had 5 waves since last boss
        const wavesSinceLastBoss = game.wave - game.lastBossWave;
        const isBossWave = game.wave % 5 === 0 && wavesSinceLastBoss >= 5;

        if (isBossWave) {
            game.bossWarning = true;
            game.bossWarningTimer = 2000; // 2 second warning
            game.lastBossWave = game.wave; // Record this as a boss wave
        }

        // Wave announcement particles
        for (let i = 0; i < 30; i++) {
            game.particles.push({
                x: game.width / 2,
                y: game.height / 2,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 1000,
                color: game.bossWarning ? '#FF0000' : '#feca57',
                size: Math.random() * 8 + 4
            });
        }
    }
}

function updateBullets(deltaTime) {
    // Player bullets
    for (let i = game.bullets.length - 1; i >= 0; i--) {
        const bullet = game.bullets[i];
        bullet.y -= bullet.speed;
        // Handle horizontal movement for triple shot
        if (bullet.vx) {
            bullet.x += bullet.vx;
        }

        // Remove if off screen
        if (bullet.y < -bullet.height || bullet.x < -bullet.width || bullet.x > game.width) {
            game.bullets.splice(i, 1);
            continue;
        }

        // Check collision with boss first
        if (game.boss && checkCollision(bullet, game.boss)) {
            game.bullets.splice(i, 1);
            if (game.boss.hit()) {
                game.boss = null; // Boss defeated
            }
            continue;
        }

        // Check collision with enemies
        for (let j = game.enemies.length - 1; j >= 0; j--) {
            const enemy = game.enemies[j];
            if (checkCollision(bullet, enemy)) {
                game.bullets.splice(i, 1);
                if (enemy.hit()) {
                    game.enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Enemy bullets (including boss bullets)
    for (let i = game.enemyBullets.length - 1; i >= 0; i--) {
        const bullet = game.enemyBullets[i];

        // Handle different bullet movement types
        if (bullet.vy !== undefined) {
            // Aimed bullet with custom velocity
            bullet.x += bullet.vx || 0;
            bullet.y += bullet.vy;
        } else {
            // Normal downward bullet
            bullet.y += bullet.speed;
            if (bullet.vx) {
                bullet.x += bullet.vx;
            }
        }

        // Remove if off screen
        if (bullet.y > game.height || bullet.y < -50 || bullet.x < -50 || bullet.x > game.width + 50) {
            game.enemyBullets.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (checkCollision(bullet, game.player)) {
            game.enemyBullets.splice(i, 1);
            if (game.player.hit()) {
                return; // Game over
            }
        }
    }
}

function updateParticles(deltaTime) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= deltaTime;
        p.vy += 0.1; // Gravity

        if (p.life <= 0) {
            game.particles.splice(i, 1);
        }
    }
}

function updateEnemies(deltaTime) {
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        const enemy = game.enemies[i];
        if (enemy.update(deltaTime)) {
            game.enemies.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (checkCollision(enemy, game.player)) {
            game.enemies.splice(i, 1);
            if (game.player.hit()) {
                return; // Game over
            }
        }
    }
}

function spawnPowerup(x, y) {
    const types = Object.keys(POWERUP_TYPES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    game.powerups.push(new Powerup(x, y, randomType));
}

function updatePowerups(deltaTime) {
    for (let i = game.powerups.length - 1; i >= 0; i--) {
        const powerup = game.powerups[i];

        if (powerup.update(deltaTime)) {
            game.powerups.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (checkCollision(powerup, game.player)) {
            game.player.applyPowerup(powerup.type);
            game.powerups.splice(i, 1);
        }
    }
}

function checkCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function draw() {
    const ctx = game.ctx;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, game.height);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, game.width, game.height);

    // Draw stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 73) % game.width;
        const y = (i * 47 + Date.now() / 50) % game.height;
        const size = (i % 3) + 1;
        ctx.fillRect(x, y, size, size);
    }

    // Draw particles (behind characters)
    for (const p of game.particles) {
        ctx.globalAlpha = p.life / 600;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw enemies
    for (const enemy of game.enemies) {
        enemy.draw(ctx);
    }

    // Draw player
    if (game.player) {
        game.player.draw(ctx);
    }

    // Draw bullets
    for (const bullet of game.bullets) {
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = bullet.color;

        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        // Bullet trail
        ctx.fillStyle = 'rgba(78, 205, 196, 0.3)';
        ctx.fillRect(bullet.x, bullet.y + bullet.height, bullet.width, 15);

        ctx.shadowBlur = 0;
    }

    // Draw enemy bullets
    for (const bullet of game.enemyBullets) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = bullet.color;

        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

        ctx.shadowBlur = 0;
    }

    // Draw powerups
    for (const powerup of game.powerups) {
        powerup.draw(ctx);
    }

    // Draw boss
    if (game.boss) {
        game.boss.draw(ctx);
    }

    // Draw boss warning
    if (game.bossWarning) {
        ctx.save();
        const pulse = Math.sin(Date.now() / 100) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FF0000';
        ctx.fillText('⚠️ BOSS INCOMING! ⚠️', game.width / 2, game.height / 2);
        ctx.font = 'bold 24px Arial';
        ctx.fillText('GET READY!', game.width / 2, game.height / 2 + 40);
        ctx.restore();
    }
}

function gameLoop(currentTime) {
    if (!game.running) return;

    const deltaTime = currentTime - game.lastTime;
    game.lastTime = currentTime;

    // Update
    game.player.update(deltaTime);
    updateEnemies(deltaTime);
    updateBullets(deltaTime);
    updateParticles(deltaTime);
    updatePowerups(deltaTime);
    spawnEnemies(deltaTime);

    // Update boss
    if (game.boss) {
        game.boss.update(deltaTime);
    }

    // Draw
    draw();

    requestAnimationFrame(gameLoop);
}

// UI Updates
function updateScoreDisplay() {
    document.getElementById('score').textContent = game.score;
}

function updateWaveDisplay() {
    document.getElementById('wave').textContent = game.wave;
}

function updateLivesDisplay() {
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, game.lives));
}

// High Score Functions
function loadHighScore() {
    try {
        const saved = localStorage.getItem('blockyBlasterHighScore');
        game.highScore = saved ? parseInt(saved, 10) : 0;
    } catch (e) {
        game.highScore = 0;
    }
    updateHighScoreDisplay();
}

function saveHighScore() {
    try {
        localStorage.setItem('blockyBlasterHighScore', game.highScore.toString());
    } catch (e) {
        console.log('Could not save high score');
    }
    updateHighScoreDisplay();
}

function updateHighScoreDisplay() {
    // Update all high score displays
    const startHighScore = document.getElementById('start-high-score');
    const hudHighScore = document.getElementById('high-score');

    if (startHighScore) startHighScore.textContent = game.highScore;
    if (hudHighScore) hudHighScore.textContent = game.highScore;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
