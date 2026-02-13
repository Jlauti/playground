/**
         * STICKMAN ARENA - UPDATED
         * Features: Improved Combat (Animations, Swoosh, Hit Frames), Visible Sneakers, Animals
         * Fixes: Logic Errors, Syntax Errors
         */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Config ---
const GRAVITY = 0.4;
const FRICTION = 0.85;
const GROUND_Y = 500;
let SCREEN_WIDTH = 800;
let SCREEN_HEIGHT = 600;

// --- Biome Data ---
const BIOMES = [
    {
        name: "The Plains",
        bgColor: "#87CEEB",
        groundColor: "#7f8c8d",
        getPlatforms: (w, h) => [
            { x: w * 0.2, y: h * 0.65, w: 150, h: 10 },
            { x: w * 0.6, y: h * 0.65, w: 150, h: 10 },
            { x: w * 0.4, y: h * 0.4, w: 200, h: 10 }
        ],
        getGround: (w) => [{ x: 0, w: w }],
        drawDecor: (ctx, w, h) => {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath(); ctx.arc(100, 100, 30, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(140, 90, 40, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(w - 100, 150, 30, 0, Math.PI * 2); ctx.fill();
        }
    },
    {
        name: "The Forest",
        bgColor: "#2ecc71",
        groundColor: "#27ae60",
        getPlatforms: (w, h) => [
            { x: w * 0.1, y: h * 0.7, w: 100, h: 10 },
            { x: w * 0.3, y: h * 0.5, w: 100, h: 10 },
            { x: w * 0.6, y: h * 0.5, w: 100, h: 10 },
            { x: w * 0.8, y: h * 0.7, w: 100, h: 10 }
        ],
        getGround: (w) => [{ x: 0, w: w }],
        drawDecor: (ctx, w, h) => {
            ctx.fillStyle = '#1e8449';
            for (let i = 50; i < w; i += 150) {
                ctx.fillStyle = '#795548';
                ctx.fillRect(i, h - 100 - 80, 20, 80);
                ctx.fillStyle = '#1e8449';
                ctx.beginPath(); ctx.moveTo(i - 30, h - 180); ctx.lineTo(i + 10, h - 280); ctx.lineTo(i + 50, h - 180); ctx.fill();
                ctx.beginPath(); ctx.moveTo(i - 30, h - 150); ctx.lineTo(i + 10, h - 250); ctx.lineTo(i + 50, h - 150); ctx.fill();
            }
        }
    },
    {
        name: "The Desert",
        bgColor: "#f1c40f",
        groundColor: "#e67e22",
        getPlatforms: (w, h) => [
            { x: w * 0.5 - 150, y: h * 0.7, w: 300, h: 20 },
            { x: w * 0.5 - 100, y: h * 0.6, w: 200, h: 20 },
            { x: w * 0.5 - 50, y: h * 0.5, w: 100, h: 20 }
        ],
        getGround: (w) => [{ x: 0, w: w }],
        drawDecor: (ctx, w, h) => {
            ctx.fillStyle = '#f39c12';
            ctx.beginPath(); ctx.arc(w - 80, 80, 50, 0, Math.PI * 2); ctx.fill();
        }
    },
    {
        name: "The Chasm",
        bgColor: "#2c3e50",
        groundColor: "#c0392b",
        getPlatforms: (w, h) => [
            { x: w * 0.4, y: h * 0.5, w: 160, h: 20 }
        ],
        getGround: (w) => [
            { x: 0, w: w * 0.3 },
            { x: w * 0.7, w: w * 0.3 }
        ],
        drawDecor: (ctx, w, h) => {
            ctx.fillStyle = '#34495e';
            ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(200, h - 300); ctx.lineTo(400, h); ctx.fill();
            ctx.beginPath(); ctx.moveTo(w, h); ctx.lineTo(w - 200, h - 300); ctx.lineTo(w - 400, h); ctx.fill();
        }
    }
];

// --- State ---
let gameActive = false;
let currentBiomeIndex = 0;
let particles = [];
let weapons = [];
let projectiles = [];
let platforms = [];
let groundSegments = [];
let lightningBolts = [];
let animals = [];

let round = 1;
let coins = 0;
let difficulty = 1; // 0: Easy, 1: Medium, 2: Hard
let selectedClass = 'fighter'; // Default class
let hats = []; // Hat pickups on the ground

// --- Hat Types Data ---
const HAT_TYPES = {
    crown: {
        name: 'Crown', color: '#FFD700', effect: 'coins', description: '+50% Coins',
        drawShape: (ctx) => {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-8, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, -4);
            ctx.lineTo(0, -10); ctx.lineTo(2, -4); ctx.lineTo(6, -8);
            ctx.lineTo(8, 0); ctx.closePath(); ctx.fill();
        }
    },
    viking: {
        name: 'Viking Helm', color: '#8B4513', effect: 'damage', description: '+30% Damage',
        drawShape: (ctx) => {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath(); ctx.arc(0, -3, 8, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#F5F5DC';
            ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(-6, -12); ctx.lineTo(-6, -3); ctx.fill();
            ctx.beginPath(); ctx.moveTo(10, -3); ctx.lineTo(6, -12); ctx.lineTo(6, -3); ctx.fill();
        }
    },
    propeller: {
        name: 'Propeller', color: '#FF6B6B', effect: 'doublejump', description: 'Double Jump',
        drawShape: (ctx) => {
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath(); ctx.arc(0, -5, 4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#FF6B6B'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(10, -5); ctx.stroke();
        }
    },
    halo: {
        name: 'Halo', color: '#FFFACD', effect: 'regen', description: 'Regen HP',
        drawShape: (ctx) => {
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(0, -12, 8, 3, 0, 0, Math.PI * 2); ctx.stroke();
        }
    },
    devil: {
        name: 'Devil Horns', color: '#DC143C', effect: 'lifesteal', description: '15% Lifesteal',
        drawShape: (ctx) => {
            ctx.fillStyle = '#DC143C';
            ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-5, -12); ctx.lineTo(-2, -2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(8, -2); ctx.lineTo(5, -12); ctx.lineTo(2, -2); ctx.fill();
        }
    },
    tophat: {
        name: 'Top Hat', color: '#1a1a1a', effect: 'allstats', description: '+10% All Stats',
        drawShape: (ctx) => {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(-10, -4, 20, 4);
            ctx.fillRect(-6, -14, 12, 10);
        }
    },
    ninja: {
        name: 'Ninja Mask', color: '#2c2c2c', effect: 'dodge', description: '20% Dodge',
        drawShape: (ctx) => {
            ctx.fillStyle = '#2c2c2c';
            ctx.fillRect(-10, -8, 20, 6);
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.ellipse(-4, -5, 2, 1, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(4, -5, 2, 1, 0, 0, Math.PI * 2); ctx.fill();
        }
    },
    wizard: {
        name: 'Wizard Hat', color: '#9400D3', effect: 'magic', description: '+50% Ranged Dmg',
        drawShape: (ctx) => {
            ctx.fillStyle = '#9400D3';
            ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
        }
    }
};

// --- Character Classes ---
const CLASSES = {
    barbarian: {
        name: 'Barbarian',
        hp: 150,
        speed: 0.8,
        damage: 1.5,
        color: '#8B0000',
        ability: 'rage', // 2x damage when HP < 30%
        description: 'Slow but powerful. Rage mode when hurt!'
    },
    cyborg: {
        name: 'Cyborg',
        hp: 100,
        speed: 1.2,
        damage: 1.0,
        color: '#708090',
        ability: 'shield', // Blocks 1 hit every 10 seconds
        description: 'Fast with a protective shield.'
    },
    wizard: {
        name: 'Wizard',
        hp: 80,
        speed: 0.9,
        damage: 1.3,
        color: '#9400D3',
        ability: 'teleport', // Teleport on double-tap jump
        description: 'Fragile but high magic damage.'
    },
    cleric: {
        name: 'Cleric',
        hp: 100,
        speed: 1.0,
        damage: 0.8,
        color: '#FFD700',
        ability: 'heal', // Heal 5 HP every 5 seconds
        description: 'Balanced with passive healing.'
    },
    fighter: {
        name: 'Fighter',
        hp: 120,
        speed: 1.0,
        damage: 1.1,
        color: '#e74c3c',
        ability: 'counter', // Counter-attack when hit
        description: 'Well-rounded warrior.'
    },
    rogue: {
        name: 'Rogue',
        hp: 90,
        speed: 1.4,
        damage: 1.2,
        color: '#2c3e50',
        ability: 'backstab', // 2x damage from behind
        description: 'Fast and deadly from behind.'
    },
    archer: {
        name: 'Archer',
        hp: 85,
        speed: 1.1,
        damage: 1.0,
        color: '#228B22',
        ability: 'bow', // Starts with ranged attack
        description: 'Starts with a bow weapon.'
    }
};

function setDifficulty(level) {
    difficulty = level;
    // Update button styles on game-over screen
    const diffEasy = document.getElementById('diff-easy');
    const diffMedium = document.getElementById('diff-medium');
    const diffHard = document.getElementById('diff-hard');
    if (diffEasy) diffEasy.style.opacity = level === 0 ? '1' : '0.6';
    if (diffMedium) diffMedium.style.opacity = level === 1 ? '1' : '0.6';
    if (diffHard) diffHard.style.opacity = level === 2 ? '1' : '0.6';
    // Update button styles on start screen
    const startEasy = document.getElementById('start-diff-easy');
    const startMedium = document.getElementById('start-diff-medium');
    const startHard = document.getElementById('start-diff-hard');
    if (startEasy) startEasy.style.opacity = level === 0 ? '1' : '0.6';
    if (startMedium) startMedium.style.opacity = level === 1 ? '1' : '0.6';
    if (startHard) startHard.style.opacity = level === 2 ? '1' : '0.6';
}

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Resize handling
function resize() {
    SCREEN_WIDTH = Math.min(window.innerWidth - 40, 1000);
    SCREEN_HEIGHT = Math.min(window.innerHeight - 40, 600);
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    if (typeof Animal !== 'undefined') {
        loadBiome(currentBiomeIndex);
    }
}
window.addEventListener('resize', resize);

function loadBiome(index) {
    if (index < 0) index = BIOMES.length - 1;
    if (index >= BIOMES.length) index = 0;

    currentBiomeIndex = index;
    const b = BIOMES[index];

    const nameEl = document.getElementById('location-ui');
    nameEl.innerText = b.name;
    nameEl.style.color = b.bgColor === '#2c3e50' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.5)';

    platforms = b.getPlatforms(SCREEN_WIDTH, SCREEN_HEIGHT);
    groundSegments = b.getGround(SCREEN_WIDTH);

    weapons = [];
    animals = [];

    let animalCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < animalCount; i++) {
        let typeRand = Math.random();
        let type = 'horse';
        if (typeRand < 0.25) type = 'llama';
        else if (typeRand < 0.5) type = 'pig';
        else if (typeRand < 0.75) type = 'cow';

        let startX = 100 + Math.random() * (SCREEN_WIDTH - 200);
        animals.push(new Animal(startX, GROUND_Y - 50, type));
    }
}

// --- Classes ---

class Animal {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.hp = 30;
        this.facing = 1;
        this.walkTimer = 0;

        if (type === 'pig') {
            this.width = 40; this.height = 25; this.color = '#e91e63';
        } else if (type === 'llama') {
            this.width = 40; this.height = 60; this.color = '#f5f5dc';
        } else if (type === 'cow') {
            this.width = 60; this.height = 40; this.color = '#fff';
        } else {
            this.width = 60; this.height = 50; this.color = '#795548';
        }
    }

    update() {
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.height > GROUND_Y) {
            let overGround = false;
            let cx = this.x + this.width / 2;
            for (let g of groundSegments) {
                if (cx >= g.x && cx <= g.x + g.w) {
                    overGround = true;
                    break;
                }
            }
            if (overGround) {
                this.y = GROUND_Y - this.height;
                this.vy = 0;
            }
        }

        if (this.y > SCREEN_HEIGHT + 100) {
            this.hp = 0;
        }

        this.vx *= FRICTION;

        this.walkTimer++;
        if (this.walkTimer > 100) {
            this.walkTimer = 0;
            if (Math.random() < 0.7) {
                this.vx = (Math.random() - 0.5) * 4;
                this.facing = Math.sign(this.vx) || 1;
            }
        }

        if (this.x < 0) { this.x = 0; this.vx *= -1; }
        if (this.x > SCREEN_WIDTH - this.width) { this.x = SCREEN_WIDTH - this.width; this.vx *= -1; }
    }

    takeDamage(amount, source) {
        this.hp -= amount;
        createParticles(this.x + this.width / 2, this.y + this.height / 2, 5, this.color);
        this.vx = (this.x - source.x > 0 ? 1 : -1) * 6;
        this.vy = -3;

        if (this.type === 'llama' && this.hp > 0) {
            let bx = this.x + (this.facing === 1 ? this.width : 0);
            let by = this.y + 10;
            let spitVx = (source.x - this.x > 0 ? 1 : -1) * 6;
            let spit = new Projectile(bx, by, spitVx, 'animal', 0.5);
            spit.color = '#2ecc71';
            projectiles.push(spit);
        }
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.facing === -1) ctx.scale(-1, 1);
        ctx.translate(-this.width / 2, -this.height / 2);

        if (this.type === 'llama') {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 20, 40, 40);
            ctx.fillRect(0, 0, 15, 30);
            ctx.fillRect(5, 0, 20, 15);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(15, 5, 2, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'pig') {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, 40, 25);
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(35, 10, 5, 10);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(32, 5, 2, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'cow') {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 0, 60, 40);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(15, 15, 8, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(45, 25, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(50, -5, 20, 20);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(60, 5, 2, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, 15, 60, 35);
            ctx.fillRect(40, -5, 15, 30);
            ctx.fillRect(45, -10, 20, 15);
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(55, -5, 2, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();

        if (this.hp < 30) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y - 10, this.width * (this.hp / 30), 4);
        }
    }
}

class Projectile {
    constructor(x, y, vx, owner, damageMult = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.owner = owner;
        this.radius = 4;
        this.active = true;
        this.damageMult = damageMult;
        this.color = '#333';
    }
    update() {
        this.x += this.vx;
        if (this.x < 0 || this.x > SCREEN_WIDTH) this.active = false;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Weapon {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 40;
        this.h = 40;
        this.type = type;
        this.vy = 0;
        this.grounded = false;

        if (type === 'sword') this.color = '#f1c40f';
        else if (type === 'axe') this.color = '#e67e22';
        else if (type === 'gun') this.color = '#2c3e50';
        else if (type === 'wand') this.color = '#9b59b6';
    }

    update() {
        if (!this.grounded) {
            this.vy += GRAVITY;
            this.y += this.vy;

            let landed = false;
            for (let p of platforms) {
                if (this.vy > 0 &&
                    this.x + this.w > p.x && this.x < p.x + p.w &&
                    this.y + this.h >= p.y && this.y + this.h <= p.y + this.vy + 5) {
                    this.y = p.y - this.h;
                    this.vy = 0;
                    this.grounded = true;
                    landed = true;
                }
            }
            if (!landed && this.y + this.h >= GROUND_Y) {
                let overGround = false;
                let cx = this.x + this.w / 2;
                for (let g of groundSegments) {
                    if (cx >= g.x && cx <= g.x + g.w) {
                        overGround = true;
                        break;
                    }
                }
                if (overGround) {
                    this.y = GROUND_Y - this.h;
                    this.vy = 0;
                    this.grounded = true;
                }
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillStyle = this.color;

        if (this.type === 'sword') {
            ctx.beginPath(); ctx.moveTo(-5, 10); ctx.lineTo(0, -15); ctx.lineTo(5, 10); ctx.lineTo(-5, 10); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(8, 10); ctx.stroke();
        } else if (this.type === 'axe') {
            ctx.beginPath(); ctx.rect(-2, -5, 4, 20); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#95a5a6';
            ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(10, 0); ctx.lineTo(10, 10); ctx.lineTo(0, 5); ctx.fill(); ctx.stroke();
        } else if (this.type === 'gun') {
            ctx.fillStyle = '#34495e';
            ctx.beginPath(); ctx.rect(-10, -5, 20, 8); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.rect(-10, -5, 6, 15); ctx.fill(); ctx.stroke();
        } else if (this.type === 'wand') {
            ctx.fillStyle = '#8e44ad';
            ctx.beginPath(); ctx.rect(-3, -15, 6, 30); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#e056fd'; ctx.beginPath(); ctx.arc(0, -15, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }

        ctx.restore();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
    }
}

class Hat {
    constructor(x, y, typeKey) {
        this.x = x; this.y = y; this.w = 30; this.h = 30;
        this.typeKey = typeKey;
        this.type = HAT_TYPES[typeKey];
        this.vy = 0; this.grounded = false;
    }
    update() {
        if (!this.grounded) {
            this.vy += GRAVITY; this.y += this.vy;
            for (let p of platforms) {
                if (this.vy > 0 && this.x + this.w > p.x && this.x < p.x + p.w &&
                    this.y + this.h >= p.y && this.y + this.h <= p.y + this.vy + 5) {
                    this.y = p.y - this.h; this.vy = 0; this.grounded = true;
                }
            }
            if (this.y + this.h >= GROUND_Y) {
                let cx = this.x + this.w / 2;
                for (let g of groundSegments) {
                    if (cx >= g.x && cx <= g.x + g.w) {
                        this.y = GROUND_Y - this.h; this.vy = 0; this.grounded = true; break;
                    }
                }
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.shadowBlur = 15; ctx.shadowColor = this.type.color;
        this.type.drawShape(ctx);
        ctx.restore();
        ctx.strokeStyle = this.type.color; ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]); ctx.strokeRect(this.x, this.y, this.w, this.h); ctx.setLineDash([]);
    }
}

class Stickman {
    constructor(x, isAi = false, className = null) {
        this.x = x;
        this.y = 200;
        this.vx = 0;
        this.vy = 0;
        this.width = 30;
        this.height = 80;
        this.speed = 3.2;
        this.jumpPower = -11;
        this.isAi = isAi;
        this.className = className;

        // Apply class stats for player
        if (!isAi && className && CLASSES[className]) {
            const classData = CLASSES[className];
            this.color = classData.color;
            this.hp = classData.hp;
            this.maxHp = classData.hp;
            this.speed = 3.2 * classData.speed;
            this.damageMult = classData.damage;
            this.ability = classData.ability;

            // Special ability properties
            this.shieldActive = false;
            this.shieldCooldown = 0;
            this.healTimer = 0;
            this.teleportReady = false;
            this.lastJumpTime = 0;

            // Archer starts with a bow (acts like gun but with bow styling)
            if (classData.ability === 'bow') {
                this.weapon = {
                    type: 'gun',
                    color: '#228B22',
                    w: 40,
                    h: 40,
                    x: 0,
                    y: 0,
                    grounded: true
                };
            }
        } else {
            this.color = isAi ? '#3498db' : '#e74c3c';
            this.hp = 100;
            this.maxHp = 100;
            this.damageMult = 1.0;
            this.ability = null;
        }

        this.facing = isAi ? -1 : 1;
        this.hasSneakers = false;

        this.weapon = this.weapon || null;
        this.hat = null; // Current equipped hat
        this.canDoubleJump = false; // For propeller hat
        this.hasDoubleJumped = false;

        this.attackCooldown = 0;
        this.isAttacking = false;
        this.attackDuration = 0;
        this.attackTimer = 0;
        this.damageDealt = false;

        this.frame = 0;
        this.animState = 'idle';
    }

    update(target) {
        if (this.hp <= 0) return;

        // Class ability updates
        if (this.ability === 'heal') {
            // Cleric heals 5 HP every 5 seconds (300 frames)
            this.healTimer = (this.healTimer || 0) + 1;
            if (this.healTimer >= 300 && this.hp < this.maxHp) {
                this.hp = Math.min(this.hp + 5, this.maxHp);
                this.healTimer = 0;
                createParticles(this.x + this.width / 2, this.y, 10, '#FFD700');
                updateUI();
            }
        }
        if (this.ability === 'shield') {
            // Cyborg shield recharges every 10 seconds (600 frames)
            if (!this.shieldActive) {
                this.shieldCooldown = (this.shieldCooldown || 0) + 1;
                if (this.shieldCooldown >= 600) {
                    this.shieldActive = true;
                    this.shieldCooldown = 0;
                    createParticles(this.x + this.width / 2, this.y + 20, 8, '#00BFFF');
                }
            }
        }

        // Hat ability updates
        if (this.hat && this.hat.effect === 'regen') {
            this.regenTimer = (this.regenTimer || 0) + 1;
            if (this.regenTimer >= 60 && this.hp < this.maxHp) { // 1 HP per second
                this.hp = Math.min(this.hp + 1, this.maxHp);
                this.regenTimer = 0;
                updateUI();
            }
        }
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y > SCREEN_HEIGHT + 100) {
            this.takeDamage(999);
            return;
        }

        let onGround = false;

        if (this.vy >= 0) {
            for (let p of platforms) {
                if (this.x + this.width > p.x && this.x < p.x + p.w &&
                    this.y + this.height >= p.y && this.y + this.height <= p.y + this.vy + 5) {
                    this.y = p.y - this.height;
                    this.vy = 0;
                    onGround = true;
                }
            }
        } // Closed platform loop

        if (!onGround && this.y + this.height > GROUND_Y) {
            let cx = this.x + this.width / 2;
            let overSegment = false;
            for (let g of groundSegments) {
                if (cx >= g.x && cx <= g.x + g.w) {
                    overSegment = true;
                    break;
                }
            }
            if (overSegment) {
                if (this.vy > 0 && this.y + this.height <= GROUND_Y + 50) {
                    this.y = GROUND_Y - this.height;
                    this.vy = 0;
                    onGround = true;
                }
            }
        }

        for (let a of animals) {
            if (a.hp <= 0) continue;
            if (this.x < a.x + a.width &&
                this.x + this.width > a.x &&
                this.y < a.y + a.height &&
                this.y + this.height > a.y) {

                let dx = (this.x + this.width / 2) - (a.x + a.width / 2);
                if (dx > 0) this.x += 2; else this.x -= 2;
                if (dx > 0) a.x -= 1; else a.x += 1;
            }
        }

        this.vx *= FRICTION;

        // Attack Timer Logic
        if (this.attackTimer > 0) {
            this.attackTimer--;
            if (this.attackTimer <= 0) this.isAttacking = false;

            // Check Hit logic at middle of swing for "Impact" feel
            if (this.isAttacking && !this.damageDealt && this.weapon && (this.weapon.type === 'sword' || this.weapon.type === 'axe' || !this.weapon || this.weapon.type === 'fist')) {
                let progress = 1 - (this.attackTimer / this.attackDuration);
                if (progress >= 0.4 && progress <= 0.6) {
                    this.checkMeleeHit(target);
                    this.damageDealt = true;
                }
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        if (!this.isAi) {
            if (this.x > SCREEN_WIDTH) {
                loadBiome(currentBiomeIndex + 1);
                this.x = 20;
                if (this.y + this.height > GROUND_Y - 50) this.y = GROUND_Y - this.height;
                target.x = 150;
                target.y = 200;
            } else if (this.x + this.width < 0) {
                loadBiome(currentBiomeIndex - 1);
                this.x = SCREEN_WIDTH - 50;
                if (this.y + this.height > GROUND_Y - 50) this.y = GROUND_Y - this.height;
                target.x = SCREEN_WIDTH - 150;
                target.y = 200;
            }
        } else {
            if (this.x < 0) { this.x = 0; this.vx *= -1; }
            if (this.x > SCREEN_WIDTH - this.width) { this.x = SCREEN_WIDTH - this.width; this.vx *= -1; }
        }

        // AI Logic
        if (this.isAi && gameActive) {
            // Reaction delay: skip AI decisions on some frames (Easy mode)
            if (this.aiReactionDelay && this.frame % this.aiReactionDelay !== 0) {
                // Skip decision-making on non-reaction frames
            } else {
                // DECISION MAKING
                let moveTarget = target;
                let mode = 'combat'; // 'combat' or 'loot'

                // 1. Look for weapon if unarmed (unless aiIgnoresWeapons is true)
                if (!this.weapon && weapons.length > 0 && !this.aiIgnoresWeapons) {
                    let nearest = null;
                    let minDist = Infinity;
                    for (let w of weapons) {
                        // Distance check
                        let d = Math.hypot(w.x - this.x, w.y - this.y);
                        if (d < minDist) {
                            minDist = d;
                            nearest = w;
                        }
                    }
                    if (nearest) {
                        moveTarget = nearest;
                        mode = 'loot';
                    }
                }

                const distX = moveTarget.x - this.x;
                const distY = moveTarget.y - this.y;
                const absDistX = Math.abs(distX);

                // 2. Facing
                if (mode === 'combat') {
                    // Face player always
                    this.facing = distX > 0 ? 1 : -1;
                } else {
                    // Face where running
                    this.facing = distX > 0 ? 1 : -1;
                }

                // 3. Movement
                let moveDir = 0;

                if (mode === 'loot') {
                    moveDir = this.facing;
                } else {
                    // Combat spacing
                    let idealDist = 40; // Melee default
                    if (this.weapon) {
                        if (this.weapon.type === 'gun' || this.weapon.type === 'wand') idealDist = 350; // Kite range
                        else if (this.weapon.type === 'axe') idealDist = 60;
                        else idealDist = 60;
                    }

                    if (this.weapon && (this.weapon.type === 'gun' || this.weapon.type === 'wand')) {
                        // Kiting Logic (smarter on Hard)
                        let kiteDist = this.canDodge ? 250 : 200; // Hard kites more precisely
                        let chaseDist = this.canDodge ? 400 : 450;
                        if (absDistX < kiteDist) moveDir = -this.facing; // Too close! Run!
                        else if (absDistX > chaseDist) moveDir = this.facing; // Chase
                        // Else stand ground
                    } else {
                        // Melee Logic
                        if (absDistX > idealDist) moveDir = this.facing;
                    }
                }

                this.vx += moveDir * (this.speed * 0.15); // slightly faster AI acceleration

                // 4. Jumping
                if (onGround) {
                    // Jump if target is above
                    if (distY < -50 && absDistX < 150) {
                        // Check if jump would land safely
                        let jumpLandingX = this.x + (this.facing * 80);
                        if (this.isOverGround(jumpLandingX)) {
                            this.vy = this.jumpPower;
                        }
                    }
                    // Jump over pits (only on medium/hard)
                    if (!this.aiIgnoresWeapons) { // Easy mode also ignores pit-jumping
                        let lookAhead = this.x + (this.vx * 20) + (this.facing * 40);
                        if (!this.isOverGround(lookAhead)) {
                            // Check if we can safely jump over
                            let jumpLandingX = this.x + (this.facing * 120);
                            if (this.isOverGround(jumpLandingX)) {
                                this.vy = this.jumpPower;
                            } else {
                                // Can't jump safely - reverse direction!
                                this.vx = -this.facing * 2;
                                this.facing = -this.facing;
                            }
                        }
                    }
                    // Random jump (rarely) - but only if safe
                    if (Math.random() < 0.005) {
                        let jumpLandingX = this.x + (this.facing * 80);
                        if (this.isOverGround(jumpLandingX)) {
                            this.vy = this.jumpPower;
                        }
                    }

                    // Dodge: Hard mode can jump away when player attacks
                    if (this.canDodge && target.isAttacking && absDistX < 100) {
                        // Jump away only if safe
                        let dodgeLandingX = this.x + (-this.facing * 100);
                        if (this.isOverGround(dodgeLandingX)) {
                            this.vy = this.jumpPower;
                            this.vx = -this.facing * 5;
                        }
                    }
                }

                // 5. Attacking (with accuracy check)
                if (mode === 'combat') {
                    let attackRange = 60;
                    if (this.weapon) {
                        if (this.weapon.type === 'gun' || this.weapon.type === 'wand') attackRange = 500;
                        else attackRange = 110;
                    }

                    let inVerticalRange = Math.abs(distY) < 80;
                    // Check if facing target
                    let facingTarget = (distX > 0 && this.facing === 1) || (distX < 0 && this.facing === -1);

                    // Apply accuracy: Only attack if random check passes
                    let accuracyCheck = !this.aiAccuracy || Math.random() < this.aiAccuracy;

                    if (facingTarget && absDistX < attackRange && inVerticalRange && this.attackCooldown === 0 && accuracyCheck) {
                        this.attack();
                    }
                }
            }
        }
        // Player Control
        else if (!this.isAi && gameActive) {
            let moveSpeed = this.speed;
            if (keys['ArrowRight'] || keys['KeyD']) { this.vx += (moveSpeed * 0.16); this.facing = 1; }
            if (keys['ArrowLeft'] || keys['KeyA']) { this.vx -= (moveSpeed * 0.16); this.facing = -1; }
            // Jump with double jump support (propeller hat)
            if (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) {
                if (onGround) {
                    this.vy = this.jumpPower;
                    this.hasDoubleJumped = false;
                } else if (this.canDoubleJump && !this.hasDoubleJumped) {
                    this.vy = this.jumpPower * 0.8;
                    this.hasDoubleJumped = true;
                    createParticles(this.x + this.width / 2, this.y + this.height, 8, '#FF6B6B');
                }
            }
            if (onGround) this.hasDoubleJumped = false;
            if ((keys['KeyZ'] || keys['KeyJ']) && this.attackCooldown === 0) {
                this.attack();
            }
        }

        // Weapon pickup
        if (!this.weapon) {
            for (let i = 0; i < weapons.length; i++) {
                let w = weapons[i];
                if (this.x < w.x + w.w && this.x + this.width > w.x && this.y < w.y + w.h && this.y + this.height > w.y) {
                    this.weapon = w; weapons.splice(i, 1);
                    createParticles(this.x, this.y, 10, '#f1c40f'); break;
                }
            }
        }

        // Hat pickup
        for (let i = 0; i < hats.length; i++) {
            let h = hats[i];
            if (this.x < h.x + h.w && this.x + this.width > h.x && this.y < h.y + h.h && this.y + this.height > h.y) {
                this.equipHat(h); hats.splice(i, 1); break;
            }
        }

        if (Math.abs(this.vx) > 0.5) this.animState = 'run';
        else this.animState = 'idle';
        if (!onGround) this.animState = 'jump';
        if (this.isAttacking) this.animState = 'attack';

        this.frame++;
    }

    isOverGround(checkX) {
        for (let g of groundSegments) {
            if (checkX >= g.x && checkX <= g.x + g.w) return true;
        }
        return false;
    }

    equipHat(hatPickup) {
        this.hat = hatPickup.type;
        createParticles(this.x + this.width / 2, this.y, 15, hatPickup.type.color);
        this.canDoubleJump = false;
        const effect = hatPickup.type.effect;
        if (effect === 'damage') this.damageMult *= 1.3;
        else if (effect === 'allstats') {
            this.damageMult *= 1.1; this.speed *= 1.1;
            this.maxHp = Math.floor(this.maxHp * 1.1);
            this.hp = Math.min(this.hp + 10, this.maxHp);
        } else if (effect === 'doublejump') this.canDoubleJump = true;
    }

    attack() {
        this.isAttacking = true;
        this.damageDealt = false;

        let type = this.weapon ? this.weapon.type : 'fist';

        // Config Attack Speed/Type (Faster now)
        if (type === 'sword') this.attackDuration = 16;
        else if (type === 'axe') this.attackDuration = 32;
        else if (type === 'gun') this.attackDuration = 12;
        else if (type === 'wand') this.attackDuration = 24;
        else this.attackDuration = 12;

        this.attackTimer = this.attackDuration;
        this.attackCooldown = this.attackDuration + 8;

        // Ranged fires immediately
        if (type === 'gun' || type === 'wand') {
            this.fireProjectile();
        }
    }

    checkMeleeHit(target) {
        let baseDamage = 5;
        let type = this.weapon ? this.weapon.type : 'fist';
        let range = 50;
        let knockback = 5;

        if (type === 'sword') { baseDamage = 15; range = 90; knockback = 8; }
        else if (type === 'axe') { baseDamage = 25; range = 90; knockback = 15; }
        else { baseDamage = 5; range = 50; knockback = 4; }

        // Calculate damage multiplier with class abilities
        let damageMult = this.damageMult;

        // Barbarian Rage: 2x damage when HP < 30%
        if (this.ability === 'rage' && this.hp < this.maxHp * 0.3) {
            damageMult *= 2;
            createParticles(this.x + this.width / 2, this.y, 5, '#FF4500');
        }

        // Check Main Target
        let dist = target.x - this.x;
        if (Math.abs(dist) < range && Math.sign(dist) === this.facing && Math.abs(target.y - this.y) < 60) {
            let finalDamage = baseDamage * damageMult;

            // Rogue Backstab: 2x damage when attacking from behind
            if (this.ability === 'backstab') {
                // Check if target is facing away from attacker
                let attackingFromBehind = (this.facing === 1 && target.facing === 1) ||
                    (this.facing === -1 && target.facing === -1);
                if (attackingFromBehind) {
                    finalDamage *= 2;
                    createParticles(target.x, target.y + 20, 20, '#800080');
                }
            }

            target.takeDamage(finalDamage, this);

            // Devil hat - 15% lifesteal
            if (this.hat && this.hat.effect === 'lifesteal') {
                this.hp = Math.min(this.hp + finalDamage * 0.15, this.maxHp);
                createParticles(this.x + this.width / 2, this.y, 5, '#DC143C');
            }
            createParticles(target.x, target.y + 40, 15, '#e74c3c');
            target.vx = this.facing * knockback;
            target.vy = -5;
        }

        // Check Animals
        for (let a of animals) {
            if (a.hp <= 0) continue;
            let d = a.x - this.x;
            if (Math.abs(d) < range && Math.sign(d) === this.facing && Math.abs(a.y - this.y) < 60) {
                a.takeDamage(baseDamage, this);
            }
        }
    }

    fireProjectile() {
        let target = this.isAi ? p1 : p2;
        if (!this.weapon) return; // No weapon to fire
        let type = this.weapon.type;

        // Wizard hat - 1.5x magic/ranged damage
        let magicMult = (this.hat && this.hat.effect === 'magic') ? 1.5 : 1.0;
        let finalMult = this.damageMult * magicMult;

        if (type === 'gun') {
            let bx = this.x + this.width / 2 + (this.facing * 30);
            let by = this.y + 35;
            let bvx = this.facing * 10;
            projectiles.push(new Projectile(bx, by, bvx, this.isAi ? 'p2' : 'p1', finalMult));
            this.vx -= this.facing * 2; // Recoil
        }
        else if (type === 'wand') {
            let range = 350;
            let baseDamage = 20;
            // Check Player
            let dist = target.x - this.x;
            if (Math.abs(dist) < range && Math.sign(dist) === this.facing) {
                target.takeDamage(baseDamage * finalMult, this);
                target.vx = this.facing * 5;
                target.vy = -5;
                lightningBolts.push({ x1: this.x + (this.facing === 1 ? 30 : 0), y1: this.y + 30, x2: target.x + 15, y2: target.y + 40, life: 10 });
            } else {
                lightningBolts.push({ x1: this.x + (this.facing === 1 ? 30 : 0), y1: this.y + 30, x2: this.x + (this.facing * 200), y2: this.y + Math.random() * 100, life: 10 });
            }
            // Check Animals
            for (let a of animals) {
                if (a.hp <= 0) continue;
                let d = a.x - this.x;
                if (Math.abs(d) < range && Math.sign(d) === this.facing) {
                    a.takeDamage(baseDamage * finalMult, this);
                    lightningBolts.push({ x1: this.x + (this.facing === 1 ? 30 : 0), y1: this.y + 30, x2: a.x + a.width / 2, y2: a.y + a.height / 2, life: 10 });
                }
            }
        }
    }

    takeDamage(amount, attacker = null) {
        // Ninja hat - 20% dodge chance
        if (this.hat && this.hat.effect === 'dodge' && Math.random() < 0.2) {
            createParticles(this.x + this.width / 2, this.y, 10, '#fff');
            return; // Dodged!
        }

        // Cyborg Shield ability - blocks one hit
        if (this.ability === 'shield' && this.shieldActive) {
            this.shieldActive = false;
            createParticles(this.x + this.width / 2, this.y + 20, 15, '#00BFFF');
            return; // Damage blocked!
        }

        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        updateUI();

        // Fighter Counter ability - automatically attack back when hit
        if (this.ability === 'counter' && attacker && this.hp > 0 && !this.isAttacking) {
            this.facing = attacker.x > this.x ? 1 : -1;
            this.attack();
            createParticles(this.x + this.width / 2, this.y + 20, 10, '#FFA500');
        }

        if (this.hp <= 0) endGame(this.isAi ? 'PLAYER' : 'ENEMY');
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        if (this.facing === -1) ctx.scale(-1, 1);

        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Head
        ctx.beginPath();
        ctx.arc(0, -30, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw hat on head
        if (this.hat) {
            ctx.save();
            ctx.translate(0, -42); // Position above head
            this.hat.drawShape(ctx);
            ctx.restore();
        }

        // Body
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, 10); ctx.stroke();

        let legOffset = 0;
        let armOffset = 0;
        if (this.animState === 'run') {
            legOffset = Math.sin(this.frame * 0.5) * 10;
            armOffset = Math.cos(this.frame * 0.5) * 10;
        } else if (this.animState === 'attack') {
            armOffset = -20; // Base arm offset
        }

        // Legs
        ctx.beginPath();
        ctx.moveTo(0, 10); ctx.lineTo(-10 + legOffset, 40);
        ctx.stroke();
        // Left Shoe
        if (this.hasSneakers) {
            ctx.fillStyle = '#00ff00'; // Neon Green
            ctx.fillRect(-14 + legOffset, 38, 12, 6);
        }

        ctx.beginPath();
        ctx.moveTo(0, 10); ctx.lineTo(10 - legOffset, 40);
        ctx.stroke();
        // Right Shoe
        if (this.hasSneakers) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(6 - legOffset, 38, 12, 6);
        }

        // Arms
        ctx.beginPath();
        ctx.moveTo(0, -15);

        if (this.weapon) {
            let wType = this.weapon.type;
            let holdAngle = 0;

            // Animated Swing Logic
            if (this.isAttacking && (wType === 'sword' || wType === 'axe')) {
                let progress = 1 - (this.attackTimer / this.attackDuration);

                // Windup
                if (progress < 0.2) {
                    holdAngle = -0.5 * (progress / 0.2);
                }
                // Swing
                else if (progress < 0.6) {
                    let swingP = (progress - 0.2) / 0.4;
                    holdAngle = -0.5 + (swingP * 2.5); // Swing form -0.5 to 2.0 rads

                    // Draw Swoosh trail
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = wType === 'sword' ? '#3498db' : '#e74c3c';
                    ctx.beginPath();
                    ctx.arc(10 + armOffset, 5, 50, -0.5, holdAngle, false);
                    ctx.lineTo(10 + armOffset, 5);
                    ctx.fill();
                    ctx.restore();
                }
                // Recover
                else {
                    let recP = (progress - 0.6) / 0.4;
                    holdAngle = 2.0 * (1 - recP);
                }
            }
            else if (this.isAttacking && (wType === 'gun' || wType === 'wand')) {
                holdAngle = -Math.PI / 2;
            }
            else {
                holdAngle = 0; // Idle hold
            }

            ctx.save();
            ctx.translate(10 + armOffset, 5);
            ctx.rotate(holdAngle);

            ctx.lineWidth = 2;
            if (wType === 'gun') {
                ctx.fillStyle = '#34495e';
                ctx.fillRect(0, 0, 15, 6);
                ctx.fillRect(0, 0, 5, 10);
            } else if (wType === 'wand') {
                ctx.strokeStyle = '#8e44ad';
                ctx.beginPath(); ctx.moveTo(0, 5); ctx.lineTo(0, -25); ctx.stroke();
                ctx.fillStyle = '#e056fd'; ctx.beginPath(); ctx.arc(0, -25, 4, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.strokeStyle = this.weapon.color;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -35); ctx.stroke();
                if (wType === 'axe') { ctx.fillStyle = this.weapon.color; ctx.fillRect(-10, -35, 20, 10); }
            }
            ctx.restore();
            ctx.lineTo(10 + armOffset, 5);
        } else {
            // Fist swing logic
            if (this.isAttacking) {
                let progress = 1 - (this.attackTimer / this.attackDuration);
                let reach = progress < 0.5 ? progress * 60 : (1 - progress) * 60;
                ctx.lineTo(15 + armOffset + reach, 0);
            } else {
                ctx.lineTo(15 + armOffset, 0);
            }
        }
        ctx.stroke();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = (Math.random() - 0.5) * 5;
        this.life = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// --- Game Logic ---

let p1, p2;
let spawnTimer = 0;

// Game Loop Timing
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

function fullReset() {
    round = 1;
    coins = 0;
    loadBiome(0); // Reset to plains
    p1 = new Stickman(100, false, selectedClass);
    startRound();
}

function startRound() {
    // Ensure player exists and is alive (fix respawn after cliff death)
    if (!p1 || p1.hp <= 0) {
        p1 = new Stickman(100, false, selectedClass);
    }

    // Enemy
    p2 = new Stickman(SCREEN_WIDTH - 100, true);
    p2.maxHp = 100 + (round - 1) * 20;
    p2.hp = p2.maxHp;
    p2.damageMult = 1.0 + (round - 1) * 0.1;
    p2.speed = 2.5 + (round - 1) * 0.1;

    // Apply difficulty modifiers to enemy
    if (difficulty === 0) { // Easy
        p2.speed *= 0.7;
        p2.damageMult *= 0.7;
        p2.aiReactionDelay = 30; // Slower reactions
        p2.aiAccuracy = 0.5; // Less accurate attacks
        p2.aiIgnoresWeapons = true; // Won't pick up weapons
    } else if (difficulty === 1) { // Medium (default)
        p2.aiReactionDelay = 10;
        p2.aiAccuracy = 0.8;
        p2.aiIgnoresWeapons = false;
    } else if (difficulty === 2) { // Hard
        p2.speed *= 1.3;
        p2.damageMult *= 1.2;
        p2.aiReactionDelay = 0; // Instant reactions
        p2.aiAccuracy = 1.0; // Perfect accuracy
        p2.aiIgnoresWeapons = false;
        p2.canDodge = true; // Can dodge attacks
    }

    // Reset positions, but player keeps stats/health
    p1.x = 100; p1.y = 200; p1.vx = 0; p1.vy = 0;
    // Only reset weapon if player doesn't have a class-based weapon (like archer's bow)
    if (p1.ability !== 'bow') {
        p1.weapon = null;
    }

    // Cleanup
    weapons = [];
    hats = []; // Clear existing hats
    particles = [];
    projectiles = [];
    lightningBolts = [];

    // Spawn a random hat
    const hatKeys = Object.keys(HAT_TYPES);
    const randomHatKey = hatKeys[Math.floor(Math.random() * hatKeys.length)];
    const hatX = 200 + Math.random() * (SCREEN_WIDTH - 400);
    hats.push(new Hat(hatX, 50, randomHatKey));

    if (animals.length === 0) loadBiome(currentBiomeIndex);

    gameActive = true;
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('shop').style.display = 'none';

    updateUI();
}

function openShop() {
    gameActive = false;
    document.getElementById('shop').style.display = 'block';
    document.getElementById('shop-coins').innerText = coins;
    document.getElementById('next-round-num').innerText = round + 1;
    updateShopButtons();
}

function updateShopButtons() {
    document.getElementById('shop-coins').innerText = coins;
    document.getElementById('btn-heal').disabled = coins < 50;
    document.getElementById('btn-damage').disabled = coins < 100;
    document.getElementById('btn-speed').disabled = coins < 100;
    updateUI();
}

function buyItem(item) {
    if (item === 'heal') {
        if (coins >= 50) {
            coins -= 50;
            p1.hp = Math.min(p1.hp + 50, p1.maxHp);
        }
    } else if (item === 'damage') {
        if (coins >= 100) {
            coins -= 100;
            p1.damageMult += 0.1;
        }
    } else if (item === 'speed') {
        if (coins >= 100) {
            coins -= 100;
            p1.speed *= 1.05;
            p1.hasSneakers = true; // Equip visible sneakers
        }
    }
    updateShopButtons();
}

function nextRound() {
    round++;
    startRound();
}

function setClass(className) {
    selectedClass = className;
    // Update UI to highlight selected class on ALL class buttons (both screens)
    const classButtons = document.querySelectorAll('.class-btn');
    classButtons.forEach(btn => {
        btn.style.opacity = btn.dataset.class === className ? '1' : '0.6';
    });
    const startClassButtons = document.querySelectorAll('.start-class-btn');
    startClassButtons.forEach(btn => {
        btn.style.opacity = btn.dataset.class === className ? '1' : '0.6';
    });
}

function startGame() {
    // Hide start screen and begin the game
    document.getElementById('start-screen').style.display = 'none';
    p1 = new Stickman(100, false, selectedClass);
    startRound();
}

function init() {
    // Show start screen on load, don't auto-start
    resize();
    loadBiome(0);
    // Draw initial background so it's not blank
    const biome = BIOMES[currentBiomeIndex];
    ctx.fillStyle = biome.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    biome.drawDecor(ctx, canvas.width, canvas.height);
    // Start the render loop but game won't be active until startGame() is called
    requestAnimationFrame(loop);
}

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateUI() {
    document.getElementById('hp-p1').style.width = (p1.hp / p1.maxHp * 100) + '%';
    document.getElementById('hp-p2').style.width = (p2.hp / p2.maxHp * 100) + '%';
    document.getElementById('round-display').innerText = round;
    document.getElementById('coin-ui').innerText = coins;
}

function endGame(winner) {
    gameActive = false;
    if (winner === 'PLAYER') {
        let reward = 100 + (round * 10);
        if (p1.hat && p1.hat.effect === 'coins') reward = Math.floor(reward * 1.5);
        coins += reward;
        openShop();
    } else {
        document.getElementById('winner-text').innerText = "GAME OVER (Round " + round + ")";
        document.getElementById('game-over').style.display = 'block';
    }
}

function loop(currentTime) {
    requestAnimationFrame(loop);

    if (!lastTime) lastTime = currentTime;
    const deltaTime = currentTime - lastTime;

    if (deltaTime > frameInterval) {
        // Adjust lastTime to snap to the grid, preserving excess for smooth animation
        lastTime = currentTime - (deltaTime % frameInterval);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const biome = BIOMES[currentBiomeIndex];

        ctx.fillStyle = biome.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (biome.drawDecor) biome.drawDecor(ctx, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Draw Ground
        ctx.fillStyle = biome.groundColor;
        for (let g of groundSegments) {
            ctx.fillRect(g.x, GROUND_Y, g.w, canvas.height - GROUND_Y);
        }

        // Draw Platforms
        ctx.fillStyle = '#2c3e50';
        if (currentBiomeIndex === 2) ctx.fillStyle = '#d35400';
        if (currentBiomeIndex === 3) ctx.fillStyle = '#7f8c8d';
        for (let p of platforms) {
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }

        if (gameActive) spawnTimer++;
        if (spawnTimer > 450) {
            spawnTimer = 0;
            if (weapons.length < 3) {
                let r = Math.random();
                let type = 'sword';
                if (r > 0.4) type = 'axe';
                if (r > 0.7) type = 'gun';
                if (r > 0.9) type = 'wand';

                let wx = 50 + Math.random() * (SCREEN_WIDTH - 100);
                weapons.push(new Weapon(wx, 0, type));
            }
        }

        weapons.forEach(w => { w.update(); w.draw(ctx); });

        // Hats
        hats.forEach(h => { h.update(); h.draw(ctx); });

        // Animals
        animals.forEach(a => { a.update(); a.draw(ctx); });

        p1.update(p2);
        p1.draw(ctx);
        p2.update(p1);
        p2.draw(ctx);

        for (let i = projectiles.length - 1; i >= 0; i--) {
            let b = projectiles[i];
            b.update();
            b.draw(ctx);
            if (!b.active) {
                projectiles.splice(i, 1);
                continue;
            }

            // Target Logic
            let target = (b.owner === 'p1') ? p2 : p1;
            // If projectile owner is animal, it targets player
            if (b.owner === 'animal') target = p1;

            if (b.x > target.x && b.x < target.x + target.width &&
                b.y > target.y && b.y < target.y + target.height) {

                target.takeDamage(10 * b.damageMult);
                createParticles(target.x, target.y + 20, 5, '#e74c3c');
                target.vx = (b.vx > 0 ? 1 : -1) * 2;
                b.active = false;
            }

            // Gun bullets hitting animals
            if (b.owner === 'p1' || b.owner === 'p2') {
                for (let a of animals) {
                    if (a.hp <= 0) continue;
                    if (b.x > a.x && b.x < a.x + a.width && b.y > a.y && b.y < a.y + a.height) {
                        a.takeDamage(10, (b.owner === 'p1' ? p1 : p2));
                        b.active = false;
                        break;
                    }
                }
            }
        }

        for (let i = lightningBolts.length - 1; i >= 0; i--) {
            let l = lightningBolts[i];
            ctx.strokeStyle = '#e056fd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(l.x1, l.y1);
            let midX = (l.x1 + l.x2) / 2;
            let midY = (l.y1 + l.y2) / 2;
            ctx.lineTo(midX + (Math.random() - 0.5) * 20, midY + (Math.random() - 0.5) * 20);
            ctx.lineTo(l.x2, l.y2);
            ctx.stroke();

            l.life--;
            if (l.life <= 0) lightningBolts.splice(i, 1);
        }

        particles.forEach((p, index) => {
            p.update();
            p.draw(ctx);
            if (p.life <= 0) particles.splice(index, 1);
        });
    }
}

// Start
resize(); // Initial resize to setup width/height
init();
requestAnimationFrame(loop);
