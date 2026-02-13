// Stick Fighter Arena - Game Logic

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1200;
canvas.height = 700;

// Game state
let gameState = 'title'; // title, playing, roundEnd, gameOver
let round = 1;
const WINNING_SCORE = 5;

// Mouse position for aiming
let mouseX = 0;
let mouseY = 0;

// Player class
class StickFighter {
    constructor(x, y, color, isPlayer1) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 80;
        this.color = color;
        this.isPlayer1 = isPlayer1;
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 3.5; // SLOWER movement
        this.jumpForce = -12; // SLOWER jump
        this.grounded = false;
        this.health = 100;
        this.maxHealth = 100;
        this.score = 0;
        this.facing = isPlayer1 ? 1 : -1;
        this.aimAngle = 0; // Angle towards mouse
        this.attacking = false;
        this.attackFrame = 0;
        this.attackCooldown = 0;
        this.weapon = null;
        this.animFrame = 0;
        this.animTimer = 0;
        this.invulnerable = 0;
        this.hitEffect = 0;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = this.maxHealth;
        this.grounded = false;
        this.attacking = false;
        this.attackFrame = 0;
        this.attackCooldown = 0;
        this.weapon = null;
        this.invulnerable = 60;
        this.hitEffect = 0;
    }

    update(platforms) {
        // Apply gravity (slower)
        this.velocityY += 0.5;

        // Cap fall speed
        if (this.velocityY > 10) this.velocityY = 10;

        // Apply velocity
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Friction (more friction = slower feel)
        this.velocityX *= 0.8;

        // Platform collision - check all platforms properly
        this.grounded = false;
        for (let platform of platforms) {
            const collision = this.checkPlatformCollision(platform);
            if (collision) {
                if (collision === 'top') {
                    this.y = platform.y - this.height;
                    this.velocityY = 0;
                    this.grounded = true;
                }
            }
        }

        // Ground collision
        if (this.y + this.height > canvas.height - 50) {
            this.y = canvas.height - 50 - this.height;
            this.velocityY = 0;
            this.grounded = true;
        }

        // Wall collision
        if (this.x < 10) this.x = 10;
        if (this.x + this.width > canvas.width - 10) this.x = canvas.width - 10 - this.width;

        // Attack animation
        if (this.attacking) {
            this.attackFrame++;
            if (this.attackFrame > 20) {
                this.attacking = false;
                this.attackFrame = 0;
            }
        }

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.hitEffect > 0) this.hitEffect--;

        // Animation
        this.animTimer++;
        if (this.animTimer > 15) { // Slower animation
            this.animFrame = (this.animFrame + 1) % 2;
            this.animTimer = 0;
        }
    }

    checkPlatformCollision(platform) {
        const playerBottom = this.y + this.height;
        const playerTop = this.y;
        const playerLeft = this.x;
        const playerRight = this.x + this.width;

        const platTop = platform.y;
        const platBottom = platform.y + platform.height;
        const platLeft = platform.x;
        const platRight = platform.x + platform.width;

        // Check if horizontally overlapping
        if (playerRight > platLeft && playerLeft < platRight) {
            // Check if landing on top
            const prevBottom = playerBottom - this.velocityY;
            if (prevBottom <= platTop && playerBottom >= platTop && this.velocityY > 0) {
                return 'top';
            }
        }

        return null;
    }

    jump() {
        if (this.grounded) {
            this.velocityY = this.jumpForce;
            this.grounded = false;
        }
    }

    moveLeft() {
        this.velocityX = -this.speed;
        this.facing = -1;
    }

    moveRight() {
        this.velocityX = this.speed;
        this.facing = 1;
    }

    updateAim(targetX, targetY) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        this.aimAngle = Math.atan2(targetY - centerY, targetX - centerX);
        // Update facing based on aim
        this.facing = Math.cos(this.aimAngle) >= 0 ? 1 : -1;
    }

    attack(opponent, directionX, directionY) {
        if (this.attackCooldown > 0) return false;

        this.attacking = true;
        this.attackFrame = 0;
        this.attackCooldown = 40; // Slower attack rate

        // Check hit based on aim direction
        const attackRange = this.weapon ? this.weapon.range : 70;
        const attackDamage = this.weapon ? this.weapon.damage : 10;

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Calculate attack endpoint based on aim
        const attackEndX = centerX + Math.cos(this.aimAngle) * attackRange;
        const attackEndY = centerY + Math.sin(this.aimAngle) * attackRange;

        // Check if opponent is in attack arc
        const oppCenterX = opponent.x + opponent.width / 2;
        const oppCenterY = opponent.y + opponent.height / 2;

        const dist = Math.sqrt((oppCenterX - centerX) ** 2 + (oppCenterY - centerY) ** 2);

        // Check angle difference
        const angleToOpp = Math.atan2(oppCenterY - centerY, oppCenterX - centerX);
        const angleDiff = Math.abs(this.aimAngle - angleToOpp);
        const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

        if (opponent.invulnerable <= 0 && dist < attackRange + 30 && normalizedAngleDiff < 0.8) {
            const knockbackDir = Math.cos(this.aimAngle) >= 0 ? 1 : -1;
            opponent.takeDamage(attackDamage, knockbackDir);
            return true;
        }
        return false;
    }

    takeDamage(amount, direction) {
        this.health -= amount;
        this.velocityX = direction * 5; // Less knockback
        this.velocityY = -3;
        this.hitEffect = 15;
        this.invulnerable = 45;

        if (this.health < 0) this.health = 0;
    }

    pickupWeapon(weapon) {
        this.weapon = weapon;
    }

    draw() {
        ctx.save();

        // Flash when hit
        if (this.hitEffect > 0 && this.hitEffect % 4 < 2) {
            ctx.globalAlpha = 0.5;
        }

        // Invulnerability flash
        if (this.invulnerable > 0 && this.invulnerable % 6 < 3) {
            ctx.globalAlpha = 0.7;
        }

        const centerX = this.x + this.width / 2;
        const headY = this.y + 15;

        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // Head
        ctx.beginPath();
        ctx.arc(centerX, headY, 12, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Body
        ctx.beginPath();
        ctx.moveTo(centerX, headY + 12);
        ctx.lineTo(centerX, this.y + 50);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Arms - one arm points in aim direction
        ctx.beginPath();
        const armLength = 25;

        // Aiming arm (right for P1, left for P2 by default, follows mouse)
        const aimArmEndX = centerX + Math.cos(this.aimAngle) * armLength;
        const aimArmEndY = this.y + 30 + Math.sin(this.aimAngle) * armLength;

        ctx.moveTo(centerX, this.y + 30);
        ctx.lineTo(aimArmEndX, aimArmEndY);

        // Other arm (idle position)
        const otherArmX = centerX - this.facing * 15;
        ctx.moveTo(centerX, this.y + 30);
        ctx.lineTo(otherArmX, this.y + 45);
        ctx.stroke();

        // Legs
        const legOffset = this.grounded ? Math.sin(this.animTimer * 0.3) * 4 : 0;
        ctx.beginPath();
        ctx.moveTo(centerX, this.y + 50);
        ctx.lineTo(centerX - 12 + legOffset, this.y + this.height);
        ctx.moveTo(centerX, this.y + 50);
        ctx.lineTo(centerX + 12 - legOffset, this.y + this.height);
        ctx.stroke();

        // Draw weapon if equipped
        if (this.weapon) {
            this.drawWeapon(centerX);
        }

        // Draw aim line (subtle)
        if (gameState === 'playing') {
            ctx.strokeStyle = this.color + '44';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(centerX, this.y + 30);
            const aimLineLength = this.weapon ? this.weapon.range : 70;
            ctx.lineTo(
                centerX + Math.cos(this.aimAngle) * aimLineLength,
                this.y + 30 + Math.sin(this.aimAngle) * aimLineLength
            );
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Attack effect
        if (this.attacking && this.attackFrame < 12) {
            this.drawAttackEffect(centerX);
        }

        ctx.restore();
    }

    drawWeapon(centerX) {
        const armLength = 25;
        const weaponX = centerX + Math.cos(this.aimAngle) * armLength;
        const weaponY = this.y + 30 + Math.sin(this.aimAngle) * armLength;

        ctx.save();
        ctx.translate(weaponX, weaponY);
        ctx.rotate(this.aimAngle + Math.PI / 2);

        switch (this.weapon.type) {
            case 'sword':
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(-3, -25, 6, 30);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-5, 5, 10, 8);
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur = 10;
                break;
            case 'hammer':
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(-2, -20, 4, 25);
                ctx.fillStyle = '#666';
                ctx.fillRect(-10, -30, 20, 12);
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 10;
                break;
            case 'lightning':
                ctx.fillStyle = '#9932cc';
                ctx.fillRect(-2, -25, 4, 30);
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(0, -30, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 20;
                break;
        }
        ctx.restore();
    }

    drawAttackEffect(centerX) {
        const effectDist = 50;
        const effectX = centerX + Math.cos(this.aimAngle) * effectDist;
        const effectY = this.y + 30 + Math.sin(this.aimAngle) * effectDist;

        ctx.save();

        if (this.weapon && this.weapon.type === 'lightning') {
            // Lightning effect
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 20;

            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                let x = centerX;
                let y = this.y + 30;
                ctx.moveTo(x, y);
                for (let j = 0; j < 5; j++) {
                    x += Math.cos(this.aimAngle) * 20;
                    y += Math.sin(this.aimAngle) * 20 + (Math.random() - 0.5) * 15;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        } else {
            // Slash effect - arc in aim direction
            const slashColor = this.weapon ?
                (this.weapon.type === 'sword' ? '#00ffff' : '#ff6600') :
                this.color;

            ctx.strokeStyle = slashColor;
            ctx.lineWidth = 4;
            ctx.shadowColor = slashColor;
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.arc(effectX, effectY, 25 + this.attackFrame * 1.5,
                this.aimAngle - 0.6,
                this.aimAngle + 0.6);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Platform class - simplified for better collision
class Platform {
    constructor(x, y, width, height, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
    }

    draw() {
        ctx.save();

        if (this.type === 'mountain') {
            // Draw mountain with solid top for collision
            // The collision box is now the full rectangle

            // Draw decorative mountain shape
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#4a3f6b');
            gradient.addColorStop(1, '#2d1b4e');
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = '#8a7ab0';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw platform top line (the actual collision surface)
            ctx.strokeStyle = '#9a8aba';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.stroke();
        } else {
            // Normal platform
            const gradient = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            gradient.addColorStop(0, '#6b5b8a');
            gradient.addColorStop(1, '#3d2b5e');
            ctx.fillStyle = gradient;

            ctx.shadowColor = '#8a2be2';
            ctx.shadowBlur = 10;

            // Use fillRect as fallback if roundRect not supported
            if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.width, this.height, 5);
                ctx.fill();
            } else {
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }

            ctx.strokeStyle = '#9a8aba';
            ctx.lineWidth = 2;
            if (ctx.roundRect) {
                ctx.stroke();
            } else {
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
        }

        ctx.restore();
    }
}

// Weapon pickup class
class WeaponPickup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type;
        this.bobOffset = 0;
        this.bobSpeed = 0.003; // Slower bob
        this.active = true;
        this.respawnTimer = 0;

        // Weapon stats
        switch (type) {
            case 'sword':
                this.damage = 18;
                this.range = 90;
                this.color = '#00ffff';
                break;
            case 'hammer':
                this.damage = 28;
                this.range = 75;
                this.color = '#ff6600';
                break;
            case 'lightning':
                this.damage = 14;
                this.range = 120;
                this.color = '#ffff00';
                break;
        }
    }

    update() {
        this.bobOffset = Math.sin(Date.now() * this.bobSpeed) * 5;

        if (!this.active) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.active = true;
            }
        }
    }

    draw() {
        if (!this.active) return;

        ctx.save();

        const drawY = this.y + this.bobOffset;

        // Glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;

        // Pickup circle
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, drawY + this.height / 2, 18, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '33';
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Weapon icon
        ctx.translate(this.x + this.width / 2, drawY + this.height / 2);

        switch (this.type) {
            case 'sword':
                ctx.fillStyle = '#c0c0c0';
                ctx.fillRect(-2, -12, 4, 20);
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(-4, 8, 8, 4);
                break;
            case 'hammer':
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(-1, -8, 3, 18);
                ctx.fillStyle = '#666';
                ctx.fillRect(-7, -12, 14, 8);
                break;
            case 'lightning':
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(-5, 0);
                ctx.lineTo(2, 0);
                ctx.lineTo(-2, 12);
                ctx.stroke();
                break;
        }

        ctx.restore();
    }

    pickup() {
        this.active = false;
        this.respawnTimer = 360; // 6 seconds at 60fps
        return {
            type: this.type,
            damage: this.damage,
            range: this.range,
            color: this.color
        };
    }
}

// Ladder class
class Ladder {
    constructor(x, y, height) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = height;
    }

    draw() {
        ctx.save();
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 4;

        // Side rails
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.moveTo(this.x + this.width, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.stroke();

        // Rungs
        ctx.lineWidth = 3;
        const rungSpacing = 25;
        for (let i = 0; i < this.height; i += rungSpacing) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Particle system
class Particle {
    constructor(x, y, color, velocity, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.08; // Slower particle fall
        this.life--;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Game objects
let player1, player2;
let platforms = [];
let weapons = [];
let ladders = [];
let particles = [];

// Input
const keys = {};

// Initialize game
function init() {
    // Create players
    player1 = new StickFighter(200, 400, '#00bfff', true);
    player2 = new StickFighter(900, 400, '#ff4757', false);

    // Create platforms - all with solid rectangular collision
    platforms = [
        // Ground
        new Platform(0, canvas.height - 50, canvas.width, 50, 'normal'),

        // Left mountain - collision at TOP of the visible mountain
        new Platform(50, canvas.height - 200, 180, 20, 'mountain'),

        // Center platform
        new Platform(400, canvas.height - 180, 350, 25, 'normal'),

        // Right mountain
        new Platform(950, canvas.height - 220, 180, 20, 'mountain'),

        // Upper platforms
        new Platform(120, canvas.height - 330, 180, 20, 'normal'),
        new Platform(480, canvas.height - 300, 220, 20, 'normal'),
        new Platform(820, canvas.height - 360, 180, 20, 'normal'),

        // Top platform
        new Platform(380, canvas.height - 450, 280, 20, 'normal'),
    ];

    // Create weapon pickups - positioned ON platforms
    weapons = [
        new WeaponPickup(560, canvas.height - 220, 'sword'),
        new WeaponPickup(190, canvas.height - 370, 'lightning'),
        new WeaponPickup(890, canvas.height - 400, 'hammer'),
        new WeaponPickup(500, canvas.height - 490, 'sword'),
    ];

    // Create ladders
    ladders = [
        new Ladder(1100, canvas.height - 250, 200),
    ];

    // Keyboard event listeners
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        keys[e.key] = true;
        keys[e.code] = true;

        // Prevent space from scrolling
        if (e.code === 'Space') {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        keys[e.key] = false;
        keys[e.code] = false;
    });

    // Mouse event listeners
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (gameState === 'playing') {
            e.preventDefault();

            // Left click = Player 1 attack
            if (e.button === 0) {
                if (player1.attack(player2, mouseX, mouseY)) {
                    createHitParticles(player2.x + player2.width / 2, player2.y + 30, player1.color);
                }
            }
            // Right click = Player 2 attack
            if (e.button === 2) {
                if (player2.attack(player1, mouseX, mouseY)) {
                    createHitParticles(player1.x + player1.width / 2, player1.y + 30, player2.color);
                }
            }
        }
    });

    // Prevent right-click context menu on canvas
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('rematch-btn').addEventListener('click', rematch);

    // Start game loop
    gameLoop();
}

function startGame() {
    document.getElementById('title-screen').classList.add('hidden');
    gameState = 'playing';
    round = 1;
    player1.score = 0;
    player2.score = 0;
    resetRound();
    updateHUD();
}

function rematch() {
    document.getElementById('victory-screen').classList.add('hidden');
    gameState = 'playing';
    round = 1;
    player1.score = 0;
    player2.score = 0;
    resetRound();
    updateHUD();
}

function resetRound() {
    player1.reset(200, 400);
    player2.reset(900, 400);

    // Reset weapons
    for (let weapon of weapons) {
        weapon.active = true;
        weapon.respawnTimer = 0;
    }

    particles = [];
}

function handleInput() {
    // Player 1 controls: A/D to move, SPACE to jump, LEFT CLICK to attack (aims at mouse)
    if (keys['a']) player1.moveLeft();
    if (keys['d']) player1.moveRight();
    if (keys['Space'] || keys[' ']) player1.jump();
    if (keys['e']) tryPickupWeapon(player1);

    // Update P1 aim towards mouse
    player1.updateAim(mouseX, mouseY);

    // Player 2 controls: Arrow keys to move, UP to jump, RIGHT CLICK to attack
    if (keys['arrowleft'] || keys['ArrowLeft']) player2.moveLeft();
    if (keys['arrowright'] || keys['ArrowRight']) player2.moveRight();
    if (keys['arrowup'] || keys['ArrowUp']) player2.jump();
    if (keys['/']) tryPickupWeapon(player2);

    // Update P2 aim towards mouse as well
    player2.updateAim(mouseX, mouseY);
}

function tryPickupWeapon(player) {
    for (let weapon of weapons) {
        if (weapon.active &&
            player.x < weapon.x + weapon.width &&
            player.x + player.width > weapon.x &&
            player.y < weapon.y + weapon.height + 20 &&
            player.y + player.height > weapon.y) {

            player.pickupWeapon(weapon.pickup());
            createPickupParticles(weapon.x + weapon.width / 2, weapon.y + weapon.height / 2, weapon.color);
            break;
        }
    }
}

function createHitParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 / 10) * i;
        const speed = Math.random() * 3 + 2;
        particles.push(new Particle(
            x, y, color,
            { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
            35
        ));
    }
}

function createPickupParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        particles.push(new Particle(
            x, y, color,
            { x: Math.cos(angle) * 2, y: -Math.random() * 3 - 1 },
            45
        ));
    }
}

function checkRoundEnd() {
    if (player1.health <= 0) {
        player2.score++;
        endRound(2);
    } else if (player2.health <= 0) {
        player1.score++;
        endRound(1);
    }
}

function endRound(winner) {
    updateHUD();

    if (player1.score >= WINNING_SCORE) {
        gameState = 'gameOver';
        showVictory(1);
    } else if (player2.score >= WINNING_SCORE) {
        gameState = 'gameOver';
        showVictory(2);
    } else {
        round++;
        gameState = 'roundEnd';
        setTimeout(() => {
            resetRound();
            gameState = 'playing';
        }, 2000); // Longer pause between rounds
    }
}

function showVictory(winner) {
    document.getElementById('winner-text').textContent = `Player ${winner} Wins!`;
    document.getElementById('winner-text').style.color = winner === 1 ? '#00bfff' : '#ff4757';
    document.getElementById('victory-screen').classList.remove('hidden');
}

function updateHUD() {
    document.getElementById('p1-health').style.width = `${player1.health}%`;
    document.getElementById('p2-health').style.width = `${player2.health}%`;
    document.getElementById('p1-score').textContent = player1.score;
    document.getElementById('p2-score').textContent = player2.score;
    document.getElementById('round-text').textContent = `Round ${round}`;
    document.getElementById('p1-weapon').textContent = player1.weapon ? player1.weapon.type : 'Fists';
    document.getElementById('p2-weapon').textContent = player2.weapon ? player2.weapon.type : 'Fists';
}

function update() {
    if (gameState !== 'playing') return;

    handleInput();

    player1.update(platforms);
    player2.update(platforms);

    // Update weapons
    for (let weapon of weapons) {
        weapon.update();
    }

    // Update particles
    particles = particles.filter(p => {
        p.update();
        return p.life > 0;
    });

    checkRoundEnd();
    updateHUD();
}

function drawBackground() {
    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137) % canvas.width;
        const y = (i * 77) % (canvas.height - 100);
        const size = (i % 3) + 1;
        const alpha = 0.3 + (Math.sin(Date.now() * 0.0005 + i) + 1) * 0.35; // Slower twinkle
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0d0015';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'title') return;

    // Draw background
    drawBackground();

    // Draw ladders
    for (let ladder of ladders) {
        ladder.draw();
    }

    // Draw platforms
    for (let platform of platforms) {
        platform.draw();
    }

    // Draw weapons
    for (let weapon of weapons) {
        weapon.draw();
    }

    // Draw particles
    for (let particle of particles) {
        particle.draw();
    }

    // Draw players
    player1.draw();
    player2.draw();

    // Round end overlay
    if (gameState === 'roundEnd') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Segoe UI';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 20;
        ctx.fillText(`Round ${round}`, canvas.width / 2, canvas.height / 2);
        ctx.shadowBlur = 0;
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start
init();
