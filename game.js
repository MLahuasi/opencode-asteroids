"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener("keydown", (e) => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (
    [
      "Space",
      "KeyC",
      "KeyS",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ].includes(e.code)
  )
    e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

function consumePressed(code) {
  justPressed[code] = false;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap = (v, max) => ((v % max) + max) % max;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
const POINTS = [0, 100, 50, 20]; // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ────────────────────────────────────────────────────────────
const SHOOTING_STAR_COLOR = "#ffd43b";
const SHOOTING_STAR_SPEED = 300;
const SHOOTING_STAR_TTL = 3.8;
const SHOOTING_STAR_RADIUS = 14;
const SHOOTING_STAR_POINTS = 200;
const SHOOTING_STAR_MIN_SPAWN = 8;
const SHOOTING_STAR_MAX_SPAWN = 15;
const TRIPLE_SHOT_DURATION = 5;
const TRIPLE_SHOT_SPREAD = Math.PI / 6;
const SHIELD_COST = 1000;
const SHIELD_DURATION = 45;
const SHIELD_INVINCIBLE_TIME = 0.45;
const SHIELD_MESSAGE_TIME = 1.4;
const SHIELD_COLOR_TRANSITION_TIME = 2;

class ShootingStar {
  constructor() {
    const side = randInt(0, 3);
    const margin = SHOOTING_STAR_RADIUS + 10;
    let targetX, targetY;

    if (side === 0) {
      this.x = rand(0, W);
      this.y = -margin;
      targetX = rand(0, W);
      targetY = H + margin;
    } else if (side === 1) {
      this.x = W + margin;
      this.y = rand(0, H);
      targetX = -margin;
      targetY = rand(0, H);
    } else if (side === 2) {
      this.x = rand(0, W);
      this.y = H + margin;
      targetX = rand(0, W);
      targetY = -margin;
    } else {
      this.x = -margin;
      this.y = rand(0, H);
      targetX = W + margin;
      targetY = rand(0, H);
    }

    const angle =
      Math.atan2(targetY - this.y, targetX - this.x) + rand(-0.25, 0.25);
    this.vx = Math.cos(angle) * SHOOTING_STAR_SPEED;
    this.vy = Math.sin(angle) * SHOOTING_STAR_SPEED;
    this.radius = SHOOTING_STAR_RADIUS;
    this.life = SHOOTING_STAR_TTL;
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.max(0, this.ttl / this.life);
    const angle = Math.atan2(this.vy, this.vx);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = SHOOTING_STAR_COLOR;
    ctx.fillStyle = SHOOTING_STAR_COLOR;
    ctx.lineWidth = 2;
    ctx.shadowColor = SHOOTING_STAR_COLOR;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(-8, -7);
    ctx.lineTo(-70, -20);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-70, 20);
    ctx.lineTo(-8, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ── Power-ups ─────────────────────────────────────────────────────────────────
const SPEED_POWERUP_DROP_CHANCE = 0.25;
const SPEED_POWERUP_DURATION = 5;
const SPEED_POWERUP_TTL = 10;

class SpeedPowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.ttl = SPEED_POWERUP_TTL;
    this.dead = false;
    this.phase = rand(0, Math.PI * 2);
  }

  update(dt) {
    this.ttl -= dt;
    this.phase += dt * 4;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const pulse = 1 + Math.sin(this.phase) * 0.12;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "#38d9ff";
    ctx.fillStyle = "#38d9ff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("V", 0, 1);
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
const SHIP_SKINS = [
  {
    name: "CLASICA",
    stroke: "#fff",
    fill: null,
    flame: "rgba(255, 130, 0, 0.85)",
    scale: 1,
    scoreMultiplier: 1,
    points: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    details: [],
  },
  {
    name: "DELTA",
    stroke: "#38d9ff",
    fill: "rgba(56, 217, 255, 0.12)",
    flame: "rgba(120, 220, 255, 0.9)",
    scale: 1,
    scoreMultiplier: 1,
    points: [[22, 0], [-10, -12], [-4, 0], [-10, 12]],
    details: [[4, -4, -8, -8], [4, 4, -8, 8]],
  },
  {
    name: "VIBORA",
    stroke: "#b2ff59",
    fill: "rgba(178, 255, 89, 0.1)",
    flame: "rgba(255, 214, 80, 0.9)",
    scale: 1,
    scoreMultiplier: 1,
    points: [[21, 0], [-3, -8], [-15, -5], [-8, 0], [-15, 5], [-3, 8]],
    details: [[8, 0, -6, 0], [-3, -8, -8, 0], [-3, 8, -8, 0]],
  },
  {
    name: "MORADA",
    stroke: "#d36bff",
    fill: "rgba(211, 107, 255, 0.16)",
    flame: "rgba(236, 155, 255, 0.95)",
    scale: 2,
    scoreMultiplier: 2,
    points: [[20, 0], [-12, -9], [-7, 0], [-12, 9]],
    details: [],
  },
];

let selectedShipSkinIndex = 0;

function getSelectedShipSkin() {
  return SHIP_SKINS[selectedShipSkinIndex];
}

function cycleShipSkin() {
  selectedShipSkinIndex = (selectedShipSkinIndex + 1) % SHIP_SKINS.length;
  if (ship) ship.radius = 12 * getSelectedShipSkin().scale;
}

function drawShipShape(skin, thrusting = false, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.strokeStyle = skin.stroke;
  ctx.fillStyle = skin.fill || "transparent";
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(skin.points[0][0], skin.points[0][1]);
  for (let i = 1; i < skin.points.length; i++) {
    ctx.lineTo(skin.points[i][0], skin.points[i][1]);
  }
  ctx.closePath();
  if (skin.fill) ctx.fill();
  ctx.stroke();

  for (const line of skin.details) {
    ctx.beginPath();
    ctx.moveTo(line[0], line[1]);
    ctx.lineTo(line[2], line[3]);
    ctx.stroke();
  }

  if (thrusting && Math.random() > 0.35) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8 - rand(6, 14), 0);
    ctx.lineTo(-8, 4);
    ctx.strokeStyle = skin.flame;
    ctx.stroke();
  }

  ctx.restore();
}

class Ship {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12 * getSelectedShipSkin().scale;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const ROT = 3.5; // rad/s
    const THRUST = 260 * (speedBoostTimer > 0 ? 2 : 1); // px/s²
    const DRAG = 0.987;

    if (keys["ArrowLeft"]) this.angle -= ROT * dt;
    if (keys["ArrowRight"]) this.angle += ROT * dt;

    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21 * getSelectedShipSkin().scale;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (tripleShotTimer <= 0) return [new Bullet(ox, oy, this.angle)];

    return [
      new Bullet(ox, oy, this.angle - TRIPLE_SHOT_SPREAD),
      new Bullet(ox, oy, this.angle),
      new Bullet(ox, oy, this.angle + TRIPLE_SHOT_SPREAD),
    ];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const skin = getSelectedShipSkin();
    drawShipShape(skin, this.thrusting, skin.scale);
    ctx.restore();
  }
}

function drawShield() {
  if (ship.dead || shieldTimer <= 0) return;

  const now = performance.now() / 1000;
  const progress = Math.min(
    1,
    (now - shieldActivatedAt) / SHIELD_COLOR_TRANSITION_TIME,
  );
  const green = Math.round(255 * progress);
  const alpha = 0.45 + (Math.sin(now * 8) + 1) * 0.25;
  const pulse = 1 + Math.sin(now * 7) * 0.04;
  const outerRadius = 31 * pulse;
  const innerRadius = 14 * pulse;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = `rgba(255, ${green}, 0, ${alpha.toFixed(2)})`;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.shadowColor = `rgb(255, ${green}, 0)`;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, shootingStars, powerUps, particles;
let score, lives, level, speedBoostTimer, tripleShotTimer, shootingStarSpawnTimer;
let shieldTimer, shieldMessage, shieldMessageTimer, shieldActivatedAt;
let state; // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function resetShootingStarTimer() {
  shootingStarSpawnTimer = rand(
    SHOOTING_STAR_MIN_SPAWN,
    SHOOTING_STAR_MAX_SPAWN,
  );
}

function updateShootingStarSpawn(dt) {
  shootingStarSpawnTimer -= dt;
  if (shootingStarSpawnTimer <= 0) {
    shootingStars.push(new ShootingStar());
    resetShootingStarTimer();
  }
}

function initGame() {
  ship = new Ship();
  bullets = [];
  asteroids = [];
  shootingStars = [];
  powerUps = [];
  particles = [];
  score = 0;
  lives = 3;
  level = 1;
  speedBoostTimer = 0;
  tripleShotTimer = 0;
  shieldTimer = 0;
  shieldMessage = "";
  shieldMessageTimer = 0;
  shieldActivatedAt = 0;
  state = "playing";
  resetShootingStarTimer();
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets = [];
  shootingStars = [];
  powerUps = [];
  particles = [];
  ship.reset();
  resetShootingStarTimer();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function showShieldMessage(message) {
  shieldMessage = message;
  shieldMessageTimer = SHIELD_MESSAGE_TIME;
}

function activateShield() {
  if (shieldTimer > 0) {
    showShieldMessage("ESCUDO YA ACTIVO");
    return;
  }
  if (score < SHIELD_COST) {
    showShieldMessage("PUNTOS INSUFICIENTES");
    return;
  }

  score -= SHIELD_COST;
  shieldTimer = SHIELD_DURATION;
  shieldActivatedAt = performance.now() / 1000;
  showShieldMessage("ESCUDO ACTIVADO");
}

function destroyAsteroid(a) {
  a.dead = true;
  score += POINTS[a.size] * getSelectedShipSkin().scoreMultiplier;
  if (a.size === 3 && Math.random() < SPEED_POWERUP_DROP_CHANCE)
    powerUps.push(new SpeedPowerUp(a.x, a.y));
  explode(a.x, a.y, a.size * 5);
  return a.split();
}

function destroyShootingStar(s) {
  s.dead = true;
  score += SHOOTING_STAR_POINTS * getSelectedShipSkin().scoreMultiplier;
  tripleShotTimer += TRIPLE_SHOT_DURATION;
  explode(s.x, s.y, 10);
}

function absorbHit() {
  ship.invincible = Math.max(ship.invincible, SHIELD_INVINCIBLE_TIME);
  showShieldMessage("ESCUDO ABSORBE IMPACTO");
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  speedBoostTimer = 0;
  tripleShotTimer = 0;
  lives--;
  if (lives <= 0) {
    state = "gameover";
  } else {
    state = "dead";
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (pressed("KeyC")) cycleShipSkin();

  if (state === "gameover") {
    if (pressed("Space")) initGame();
    consumePressed("KeyS");
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
    return;
  }

  if (state === "dead") {
    deadTimer -= dt;
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
    asteroids.forEach((a) => a.update(dt));
    shootingStars.forEach((s) => s.update(dt));
    shootingStars = shootingStars.filter((s) => !s.dead);
    powerUps.forEach((p) => p.update(dt));
    powerUps = powerUps.filter((p) => !p.dead);
    consumePressed("KeyS");
    if (deadTimer <= 0) {
      state = "playing";
      ship.reset();
    }
    return;
  }

  if (speedBoostTimer > 0) speedBoostTimer = Math.max(0, speedBoostTimer - dt);
  if (tripleShotTimer > 0) tripleShotTimer = Math.max(0, tripleShotTimer - dt);
  if (shieldTimer > 0) {
    shieldTimer = Math.max(0, shieldTimer - dt);
    if (shieldTimer <= 0) showShieldMessage("ESCUDO AGOTADO");
  }
  if (shieldMessageTimer > 0) {
    shieldMessageTimer = Math.max(0, shieldMessageTimer - dt);
    if (shieldMessageTimer <= 0) shieldMessage = "";
  }
  updateShootingStarSpawn(dt);

  if (pressed("KeyS")) activateShield();

  // Disparar
  if (pressed("Space")) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach((b) => b.update(dt));
  asteroids.forEach((a) => a.update(dt));
  shootingStars.forEach((s) => s.update(dt));
  powerUps.forEach((p) => p.update(dt));
  particles.forEach((p) => p.update(dt));

  bullets = bullets.filter((b) => !b.dead);
  shootingStars = shootingStars.filter((s) => !s.dead);
  powerUps = powerUps.filter((p) => !p.dead);
  particles = particles.filter((p) => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        newAsteroids.push(...destroyAsteroid(a));
      }
    }
  }
  asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
  bullets = bullets.filter((b) => !b.dead);
  newAsteroids.length = 0;

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        destroyShootingStar(s);
      }
    }
  }
  shootingStars = shootingStars.filter((s) => !s.dead);
  bullets = bullets.filter((b) => !b.dead);

  // Nave vs power-up velocidad
  for (const p of powerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      speedBoostTimer += SPEED_POWERUP_DURATION;
      explode(p.x, p.y, 5);
    }
  }
  powerUps = powerUps.filter((p) => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (!a.dead && dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (shieldTimer > 0) {
          newAsteroids.push(...destroyAsteroid(a));
          absorbHit();
          asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
        } else {
          killShip();
        }
        break;
      }
    }

    if (state === "playing" && ship.invincible <= 0) {
      for (const s of shootingStars) {
        if (!s.dead && dist(ship, s) < ship.radius + s.radius) {
          if (shieldTimer > 0) {
            destroyShootingStar(s);
            absorbHit();
            shootingStars = shootingStars.filter((s) => !s.dead);
          } else {
            killShip();
          }
          break;
        }
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  const skin = getSelectedShipSkin();
  drawShipShape(skin, false, 0.48 * skin.scale);
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "15px monospace";

  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  ctx.fillStyle = getSelectedShipSkin().stroke;
  ctx.textAlign = "right";
  ctx.fillText(`SKIN: ${getSelectedShipSkin().name} [C]`, W - 14, 48);

  for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);

  let statusY = 48;
  if (speedBoostTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#38d9ff";
    ctx.fillText(`VELOCIDAD x2  ${Math.ceil(speedBoostTimer)}s`, 14, statusY);
    statusY += 20;
  }

  if (tripleShotTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = SHOOTING_STAR_COLOR;
    ctx.fillText(`TRIPLE SHOT  ${Math.ceil(tripleShotTimer)}s`, 14, statusY);
    statusY += 20;
  }

  if (shieldTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#38d9ff";
    ctx.fillText(`ESCUDO ${Math.ceil(shieldTimer)}s`, 14, statusY);
  }

  ctx.textAlign = "right";
  ctx.fillStyle = shieldTimer > 0 ? "#38d9ff" : "rgba(255,255,255,0.65)";
  ctx.fillText(`S: ESCUDO (${SHIELD_COST} PTS)`, W - 14, 70);

  if (shieldMessage) {
    ctx.textAlign = "center";
    ctx.fillStyle =
      shieldMessage === "PUNTOS INSUFICIENTES" ? "#ff6b6b" : "#38d9ff";
    ctx.fillText(shieldMessage, W / 2, 54);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 46px monospace";
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font = "18px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  particles.forEach((p) => p.draw());
  asteroids.forEach((a) => a.draw());
  shootingStars.forEach((s) => s.draw());
  powerUps.forEach((p) => p.draw());
  bullets.forEach((b) => b.draw());
  drawShield();
  ship.draw();

  drawHUD();

  if (state === "gameover")
    drawOverlay("GAME OVER", `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
