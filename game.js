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
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
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
    this.radius = 12;
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
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
      ctx.stroke();
    }

    ctx.restore();
  }
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
let score, lives, level, speedBoostTimer, shootingStarSpawnTimer;
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

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  speedBoostTimer = 0;
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
  if (state === "gameover") {
    if (pressed("Space")) initGame();
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
    if (deadTimer <= 0) {
      state = "playing";
      ship.reset();
    }
    return;
  }

  if (speedBoostTimer > 0) speedBoostTimer = Math.max(0, speedBoostTimer - dt);
  updateShootingStarSpawn(dt);

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
        a.dead = true;
        score += POINTS[a.size];
        if (a.size === 3 && Math.random() < SPEED_POWERUP_DROP_CHANCE)
          powerUps.push(new SpeedPowerUp(a.x, a.y));
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
  bullets = bullets.filter((b) => !b.dead);

  // Bala vs estrella fugaz
  for (const b of bullets) {
    for (const s of shootingStars) {
      if (!s.dead && !b.dead && dist(b, s) < s.radius) {
        b.dead = true;
        s.dead = true;
        score += SHOOTING_STAR_POINTS;
        explode(s.x, s.y, 10);
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
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        killShip();
        break;
      }
    }

    if (state === "playing") {
      for (const s of shootingStars) {
        if (dist(ship, s) < ship.radius + s.radius) {
          killShip();
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
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "15px monospace";

  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);

  if (speedBoostTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#38d9ff";
    ctx.fillText(`VELOCIDAD x2  ${Math.ceil(speedBoostTimer)}s`, 14, 48);
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
