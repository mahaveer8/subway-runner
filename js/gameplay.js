/* SUBWAY RUNNER - Gameplay Engine v3 - Seamless Track, Fixed Spawning & Collisions */

class GameEngine {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Game State
    this.state = 'MENU';
    this.score = 0;
    this.coins = 0;
    this.highScore = parseInt(localStorage.getItem('subway_high_score') || '0');
    this.totalCoins = parseInt(localStorage.getItem('subway_total_coins') || '0');
    this.multiplier = 1;

    // Lane & Speed
    this.LANES = [-2.4, 0.0, 2.4];
    this.currentLane = 1;
    this.targetX = 0;
    this.baseSpeed = 0.18;   // medium-slow comfortable start
    this.speed = 0.18;
    this.maxSpeed = 0.42;
    this.distanceTraveled = 0;

    // Player Physics
    this.player = null;
    this.playerY = 0;        // world Y of player root
    this.velocityY = 0;
    this.gravity = 0.011;
    this.jumpPower = 0.25;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.onTrainRoof = false;
    this.currentRoofHeight = 0;

    // Guard
    this.guard = null;
    this.guardDistance = 2.4;
    this.stumbleTimer = 0;

    // Equipment
    this.currentSkin = localStorage.getItem('subway_skin') || 'default';
    this.currentBoard = localStorage.getItem('subway_board') || 'board_blue';
    this.hoverboardActive = false;
    this.hoverboardMesh = null;

    // Power-ups
    this.powerups = {
      magnet:     { active: false, timer: 0, maxTime: 9 },
      boost:      { active: false, timer: 0, maxTime: 7 },
      slow:       { active: false, timer: 0, maxTime: 8 },
      multiplier: { active: false, timer: 0, maxTime: 12 },
      sneakers:   { active: false, timer: 0, maxTime: 10 }
    };

    // World tracking
    // All chunks & obstacles/coins use a "worldZ" system.
    // The "camera/player" is FIXED at z=0 in world space.
    // Everything moves in +Z direction (toward camera) each frame.
    this.chunks = [];
    this.chunkLength = 40;
    this.nextChunkStartZ = 0; // world Z where next chunk's FRONT edge starts
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];

    // Lights & animation
    this.dirLight = null;
    this.ambientLight = null;
    this.animTime = 0;
  }

  // ============================================================
  // INIT SCENE
  // ============================================================
  initScene(containerEl) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // clear blue sky
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.004);

    var aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 200);
    this.camera.position.set(0, 4.2, 8.0);
    this.camera.lookAt(0, 1.2, -6);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerEl.appendChild(this.renderer.domElement);

    // Ambient
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.scene.add(this.ambientLight);

    // Sun
    this.dirLight = new THREE.DirectionalLight(0xfff5e0, 1.5);
    this.dirLight.position.set(12, 30, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    this.dirLight.shadow.camera.left = -18;
    this.dirLight.shadow.camera.right = 18;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    this.scene.add(this.dirLight);

    // Sky fill
    var skyFill = new THREE.DirectionalLight(0x90caf9, 0.5);
    skyFill.position.set(-10, 15, -5);
    this.scene.add(skyFill);

    this.setupInitialTrack();
    this.spawnPlayer();
    this.spawnGuard();
  }

  // ============================================================
  // SPAWN ENTITIES
  // ============================================================
  spawnPlayer() {
    if (this.player) this.scene.remove(this.player);
    this.player = Graphics.createCharacter(this.currentSkin);
    this.player.position.set(0, 0, 0);
    this.scene.add(this.player);
  }

  spawnGuard() {
    if (this.guard) this.scene.remove(this.guard);
    this.guard = Graphics.createGuardAndDog();
    this.guard.position.set(0, 0, 2.4);
    this.scene.add(this.guard);
  }

  equipSkin(skinId) {
    this.currentSkin = skinId;
    localStorage.setItem('subway_skin', skinId);
    if (this.player) {
      var px = this.player.position.x, py = this.player.position.y;
      this.scene.remove(this.player);
      this.player = Graphics.createCharacter(skinId);
      this.player.position.set(px, py, 0);
      this.scene.add(this.player);
    }
  }

  equipBoard(boardId) {
    this.currentBoard = boardId;
    localStorage.setItem('subway_board', boardId);
  }

  activateHoverboard() {
    if (this.hoverboardActive || this.state !== 'PLAYING') return;
    this.hoverboardActive = true;
    this.hoverboardMesh = Graphics.createHoverboard(this.currentBoard);
    this.hoverboardMesh.position.y = -0.12;
    this.player.add(this.hoverboardMesh);
    if (window.soundEngine) soundEngine.playHoverboardSound();
  }

  deactivateHoverboard(shatterEffect) {
    if (!this.hoverboardActive) return;
    this.hoverboardActive = false;
    if (this.hoverboardMesh) {
      if (shatterEffect) this.spawnParticleExplosion(this.player.position.x, this.player.position.y + 0.2, 0, 0xffd700, 25);
      this.player.remove(this.hoverboardMesh);
      this.hoverboardMesh = null;
    }
  }

  // ============================================================
  // TRACK CHUNK SYSTEM (SEAMLESS)
  //
  // Coordinate convention:
  //   • Player is always at world (x, playerY, 0)
  //   • Track moves in +Z direction every frame
  //   • nextChunkStartZ tracks the world-Z of the FRONT (z=0 local face) of the next chunk
  //   • A chunk's ground covers world Z from nextChunkStartZ down to nextChunkStartZ - chunkLength
  //   • chunk.position.z = nextChunkStartZ so local z=0 == world z=nextChunkStartZ
  //     and local z=-length == world z=nextChunkStartZ-length
  //
  // Initially we spawn chunks behind the camera (negative Z).
  // After the first chunk front passes z > RECYCLE_THRESHOLD, we move it to the back.
  // ============================================================

  setupInitialTrack() {
    var self = this;
    this.chunks.forEach(function(c) { self.scene.remove(c.group); });
    this.obstacles.forEach(function(o) { self.scene.remove(o.mesh); });
    this.collectibles.forEach(function(c) { self.scene.remove(c.mesh); });
    this.particles.forEach(function(p) { self.scene.remove(p.mesh); });

    this.chunks = [];
    this.obstacles = [];
    this.collectibles = [];
    this.particles = [];

    // Spawn 6 chunks: first 2 are safe (no obstacles)
    // They start at z=0 going backward: chunk[0] front=0, chunk[1] front=-40, etc.
    this.nextChunkStartZ = 0;
    for (var i = 0; i < 6; i++) {
      this.spawnChunk(i < 2);
    }
  }

  spawnChunk(isSafe) {
    isSafe = isSafe || false;
    var chunkStartZ = this.nextChunkStartZ; // world Z of the front face of this chunk
    var len = this.chunkLength;

    var trackGroup = Graphics.createTrackSegment(len);
    // Local z=0 is front, local z=-length is back.
    // Set world position so local z=0 = chunkStartZ
    trackGroup.position.set(0, 0, chunkStartZ);
    this.scene.add(trackGroup);

    // Side platform walls (centered along chunk)
    var leftWall = Graphics.createPlatformWall(len, 'left');
    leftWall.position.set(0, 0, chunkStartZ - len / 2); // centered
    this.scene.add(leftWall);
    var rightWall = Graphics.createPlatformWall(len, 'right');
    rightWall.position.set(0, 0, chunkStartZ - len / 2);
    this.scene.add(rightWall);

    // City buildings
    var bh = 16 + Math.random() * 10;
    var leftB = Graphics.createCityBuilding(bh, 0);
    leftB.position.set(-9.5, 0, chunkStartZ - len / 2);
    this.scene.add(leftB);

    var rightB = Graphics.createCityBuilding(bh, 1);
    rightB.position.set(9.5, 0, chunkStartZ - len / 2);
    this.scene.add(rightB);

    // Overhead structure every 2nd chunk
    if (Math.floor(Math.abs(chunkStartZ) / len) % 2 === 0) {
      var arch = Graphics.createOverheadStructure();
      arch.position.set(0, 0, chunkStartZ - len * 0.5);
      this.scene.add(arch);
    }

    var chunk = {
      group: trackGroup,
      extras: [leftWall, rightWall, leftB, rightB],
      startZ: chunkStartZ,
      length: len
    };
    this.chunks.push(chunk);

    if (!isSafe) {
      this.populateChunk(chunkStartZ, len);
    }

    this.nextChunkStartZ -= len; // next chunk begins right behind this one
  }

  // Populate a chunk with obstacles & coins
  // Obstacles/coins have absolute world Z positions inside the chunk's span.
  populateChunk(chunkStartZ, chunkLen) {
    var self = this;
    var lanes = this.LANES;
    var chunkEndZ = chunkStartZ - chunkLen;

    // We spawn content from 8 units behind the front to 8 units before the back
    // to avoid spawning right at seams
    var spawnFront = chunkStartZ - 8;
    var spawnBack = chunkEndZ + 8;
    var spawnLen = spawnFront - spawnBack; // positive range

    var patternType = Math.floor(Math.random() * 6);
    var allowMoving = this.distanceTraveled > 300 && Math.random() < 0.3;

    if (patternType === 0) {
      // Train left + hurdle center + coin ribbon right
      var trainZ = spawnFront - 5;
      var trainMesh = Graphics.createTrain(true, false);
      trainMesh.position.set(lanes[0], 0, trainZ);
      this.scene.add(trainMesh);
      this.obstacles.push({ mesh: trainMesh, type: 'train', laneX: lanes[0], centerZ: trainZ, halfLen: 6, height: 2.6, hasRamp: true, rampLength: 3.5, isMoving: false });

      var hurdleZ = spawnFront - 22;
      var hurdleMesh = Graphics.createHurdle();
      hurdleMesh.position.set(lanes[1], 0, hurdleZ);
      this.scene.add(hurdleMesh);
      this.obstacles.push({ mesh: hurdleMesh, type: 'hurdle', laneX: lanes[1], centerZ: hurdleZ, halfLen: 0.5, height: 0.9 });

      this.spawnCoinRibbon(lanes[2], 0, spawnFront - 10, 6);

    } else if (patternType === 1) {
      // Laser gate center + train right (optionally moving) + coins left
      var laserZ = spawnFront - 8;
      var laserMesh = Graphics.createLaserGate();
      laserMesh.position.set(lanes[1], 0, laserZ);
      this.scene.add(laserMesh);
      this.obstacles.push({ mesh: laserMesh, type: 'lasergate', laneX: lanes[1], centerZ: laserZ, halfLen: 0.5, height: 3.2, clearance: 1.3 });

      var trainRZ = spawnFront - 18;
      var trainRMesh = Graphics.createTrain(false, allowMoving);
      trainRMesh.position.set(lanes[2], 0, trainRZ);
      this.scene.add(trainRMesh);
      this.obstacles.push({ mesh: trainRMesh, type: 'train', laneX: lanes[2], centerZ: trainRZ, halfLen: 6, height: 2.6, hasRamp: false, rampLength: 0, isMoving: allowMoving, moveSpeed: 0.08 });

      this.spawnCoinRibbon(lanes[0], 0, spawnFront - 8, 5);
      this.spawnRandomPowerup(lanes[0], spawnFront - 20);

    } else if (patternType === 2) {
      // Ramp train left + rooftop coins + hurdle right
      var trainLZ = spawnFront - 6;
      var trainLMesh = Graphics.createTrain(true, false);
      trainLMesh.position.set(lanes[0], 0, trainLZ);
      this.scene.add(trainLMesh);
      this.obstacles.push({ mesh: trainLMesh, type: 'train', laneX: lanes[0], centerZ: trainLZ, halfLen: 6, height: 2.6, hasRamp: true, rampLength: 3.5, isMoving: false });

      // Rooftop coins at y = trainHeight + 0.75
      for (var ri = 0; ri < 5; ri++) {
        var rCoin = Graphics.createCoin();
        var rCoinZ = trainLZ + 3 - ri * 2;
        rCoin.position.set(lanes[0], 2.7, rCoinZ);
        this.scene.add(rCoin);
        this.collectibles.push({ mesh: rCoin, type: 'coin', baseY: 2.7 });
      }

      var hR = Graphics.createHurdle();
      var hRZ = spawnFront - 22;
      hR.position.set(lanes[2], 0, hRZ);
      this.scene.add(hR);
      this.obstacles.push({ mesh: hR, type: 'hurdle', laneX: lanes[2], centerZ: hRZ, halfLen: 0.5, height: 0.9 });

    } else if (patternType === 3) {
      // Two hurdles on outer lanes, coin ribbon center
      var hLZ = spawnFront - 12;
      var hLMesh = Graphics.createHurdle();
      hLMesh.position.set(lanes[0], 0, hLZ);
      this.scene.add(hLMesh);
      this.obstacles.push({ mesh: hLMesh, type: 'hurdle', laneX: lanes[0], centerZ: hLZ, halfLen: 0.5, height: 0.9 });

      var hRMesh2 = Graphics.createHurdle();
      hRMesh2.position.set(lanes[2], 0, hLZ);
      this.scene.add(hRMesh2);
      this.obstacles.push({ mesh: hRMesh2, type: 'hurdle', laneX: lanes[2], centerZ: hLZ, halfLen: 0.5, height: 0.9 });

      this.spawnCoinRibbon(lanes[1], 0, spawnFront - 6, 7);

    } else if (patternType === 4) {
      // Three trains across, one lane free
      var freeLane = Math.floor(Math.random() * 3);
      for (var ti3 = 0; ti3 < 3; ti3++) {
        if (ti3 === freeLane) continue;
        var tMesh = Graphics.createTrain(false, false);
        var tZ = spawnFront - 8;
        tMesh.position.set(lanes[ti3], 0, tZ);
        this.scene.add(tMesh);
        this.obstacles.push({ mesh: tMesh, type: 'train', laneX: lanes[ti3], centerZ: tZ, halfLen: 6, height: 2.6, hasRamp: false, rampLength: 0, isMoving: false });
      }
      this.spawnCoinRibbon(lanes[freeLane], 0, spawnFront - 8, 6);

    } else {
      // Laser gate + power-up + coins
      var lgZ = spawnFront - 10;
      var lgMesh = Graphics.createLaserGate();
      lgMesh.position.set(lanes[Math.floor(Math.random() * 3)], 0, lgZ);
      this.scene.add(lgMesh);
      this.obstacles.push({ mesh: lgMesh, type: 'lasergate', laneX: lanes[1], centerZ: lgZ, halfLen: 0.5, height: 3.2, clearance: 1.3 });

      this.spawnCoinRibbon(lanes[0], 0, spawnFront - 5, 5);
      this.spawnCoinRibbon(lanes[2], 0, spawnFront - 15, 4);
      if (Math.random() < 0.75) this.spawnRandomPowerup(lanes[1], spawnFront - 20);
    }
  }

  spawnCoinRibbon(laneX, baseY, startZ, count) {
    baseY = baseY || 0;
    for (var i = 0; i < count; i++) {
      var coin = Graphics.createCoin();
      var cz = startZ - i * 1.8;
      coin.position.set(laneX, baseY, cz);
      this.scene.add(coin);
      this.collectibles.push({ mesh: coin, type: 'coin', baseY: baseY });
    }
  }

  spawnRandomPowerup(laneX, z) {
    var types = ['magnet', 'boost', 'slow', 'multiplier', 'sneakers'];
    var sel = types[Math.floor(Math.random() * types.length)];
    var pMesh = Graphics.createPowerup(sel);
    pMesh.position.set(laneX, 0, z);
    this.scene.add(pMesh);
    this.collectibles.push({ mesh: pMesh, type: 'powerup', powerupType: sel, baseY: 0 });
  }

  spawnParticleExplosion(x, y, z, colorHex, count) {
    colorHex = colorHex || 0xffd700; count = count || 18;
    for (var i = 0; i < count; i++) {
      var pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      var pMat = new THREE.MeshBasicMaterial({ color: colorHex });
      var pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(x, y, z);
      var vx = (Math.random() - 0.5) * 6;
      var vy = Math.random() * 5 + 1;
      var vz = (Math.random() - 0.5) * 6;
      this.scene.add(pMesh);
      this.particles.push({ mesh: pMesh, vx: vx, vy: vy, vz: vz, life: 0.65 });
    }
  }

  // ============================================================
  // CONTROLS
  // ============================================================
  moveLeft() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLane > 0) {
      this.currentLane--;
      this.targetX = this.LANES[this.currentLane];
      if (window.soundEngine) soundEngine.playLaneSwitchSound();
    }
  }

  moveRight() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLane < 2) {
      this.currentLane++;
      this.targetX = this.LANES[this.currentLane];
      if (window.soundEngine) soundEngine.playLaneSwitchSound();
    }
  }

  jump() {
    if (this.state !== 'PLAYING') return;
    if (!this.isJumping) {
      this.isJumping = true;
      var isSuper = this.powerups.sneakers.active;
      this.velocityY = isSuper ? 0.38 : this.jumpPower;
      if (this.isSliding) this.cancelSlide();
      if (window.soundEngine) soundEngine.playJumpSound(isSuper);
    }
  }

  slide() {
    if (this.state !== 'PLAYING') return;
    if (this.isJumping) { this.velocityY = -0.30; }
    if (!this.isSliding) {
      this.isSliding = true;
      this.slideTimer = 0.72;
      if (this.player && this.player.userData.bodyGroup) {
        this.player.userData.bodyGroup.scale.set(1, 0.45, 1.3);
      }
      if (window.soundEngine) soundEngine.playSlideSound();
      this.spawnParticleExplosion(this.player.position.x, 0.1, 0, 0xffa500, 6);
    }
  }

  cancelSlide() {
    this.isSliding = false;
    this.slideTimer = 0;
    if (this.player && this.player.userData.bodyGroup) {
      this.player.userData.bodyGroup.scale.set(1, 1, 1);
    }
  }

  // ============================================================
  // GAME FLOW
  // ============================================================
  startGame() {
    this.state = 'PLAYING';
    this.score = 0; this.coins = 0;
    this.distanceTraveled = 0;
    this.speed = this.baseSpeed;
    this.currentLane = 1; this.targetX = 0;
    this.playerY = 0; this.velocityY = 0;
    this.isJumping = false; this.stumbleTimer = 0;
    this.guardDistance = 2.4;
    this.cancelSlide();
    this.deactivateHoverboard(false);
    var self = this;
    Object.keys(this.powerups).forEach(function(k) {
      self.powerups[k].active = false;
      self.powerups[k].timer = 0;
    });
    if (this.player) this.player.position.set(0, 0, 0);
    if (this.guard) this.guard.position.set(0, 0, 2.4);
    this.setupInitialTrack();
    if (window.soundEngine) soundEngine.startMusic();
  }

  pauseGame() { if (this.state === 'PLAYING') this.state = 'PAUSED'; }
  resumeGame() { if (this.state === 'PAUSED') this.state = 'PLAYING'; }

  gameOver() {
    this.state = 'GAMEOVER';
    if (window.soundEngine) { soundEngine.playCrashSound(); soundEngine.stopMusic(); }
    this.totalCoins += this.coins;
    var isNewHigh = false;
    if (Math.floor(this.score) > this.highScore) {
      this.highScore = Math.floor(this.score);
      isNewHigh = true;
      if (window.soundEngine) soundEngine.playHighScoreFanfare();
      this.spawnParticleExplosion(0, 3, -2, 0xffd700, 60);
    }
    localStorage.setItem('subway_high_score', this.highScore.toString());
    localStorage.setItem('subway_total_coins', this.totalCoins.toString());
    if (window.UI) window.UI.showGameOver(Math.floor(this.score), this.coins, this.highScore, isNewHigh);
  }

  // ============================================================
  // MAIN UPDATE LOOP
  // ============================================================
  update(delta) {
    if (this.state !== 'PLAYING') return;

    this.animTime += delta;

    // Speed curve
    var speedBonus = Math.min(this.distanceTraveled * 0.000030, 0.24);
    var baseNow = this.baseSpeed + speedBonus;
    var speedMult = 1.0;
    if (this.powerups.boost.active) speedMult = 1.65;
    else if (this.powerups.slow.active) speedMult = 0.60;
    var currentSpeed = baseNow * speedMult;

    this.distanceTraveled += currentSpeed * 12;
    var activeMult = this.powerups.multiplier.active ? 2 : 1;
    this.score += currentSpeed * 18 * activeMult;

    // Move distance per frame (world units)
    // At delta=0.016 (60fps), moveDist ˜ speed * 0.32
    var moveDist = currentSpeed * 0.32 * (delta / 0.016);

    // Powerup timers
    var self = this;
    Object.keys(this.powerups).forEach(function(k) {
      var p = self.powerups[k];
      if (p.active) { p.timer -= delta; if (p.timer <= 0) { p.active = false; p.timer = 0; } }
    });

    // Jetpack flight
    if (this.powerups.boost.active) {
      var targetJY = 6.0;
      this.playerY += (targetJY - this.playerY) * 0.14;
      this.isJumping = false; this.velocityY = 0;
      if (Math.random() < 0.5) this.spawnParticleExplosion(this.player.position.x, this.playerY + 0.3, 0.2, 0x00aaff, 2);
    }

    // Lane lerp
    if (this.player) {
      var xDiff = this.targetX - this.player.position.x;
      this.player.position.x += xDiff * 0.28;
      this.player.rotation.z = -xDiff * 0.20;
      this.player.rotation.y = xDiff * 0.10;
    }

    // Guard tracking
    if (this.guard && this.player) {
      if (this.stumbleTimer > 0) {
        this.stumbleTimer -= delta;
        this.guardDistance = Math.max(1.0, this.guardDistance - delta * 3.0);
      } else {
        this.guardDistance = Math.min(2.4, this.guardDistance + delta * 0.35);
      }
      this.guard.position.x += (this.player.position.x - this.guard.position.x) * 0.22;
      this.guard.position.z = this.guardDistance;
      this.guard.position.y = this.player.position.y;
    }

    // Vertical physics
    if (!this.powerups.boost.active) {
      if (this.isJumping) {
        this.playerY += this.velocityY;
        this.velocityY -= this.gravity;
        if (this.playerY <= this.currentRoofHeight) {
          this.playerY = this.currentRoofHeight;
          this.isJumping = false;
          this.velocityY = 0;
        }
      } else {
        if (this.playerY > this.currentRoofHeight) {
          this.isJumping = true; this.velocityY = -0.04;
        } else {
          this.playerY = this.currentRoofHeight;
        }
      }
    }

    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) this.cancelSlide();
    }

    if (this.player) {
      this.player.position.y = this.playerY;

      if (this.player.userData.shadow) {
        var sh = this.player.userData.shadow;
        var hag = this.playerY - this.currentRoofHeight;
        var ss = Math.max(0.2, 1.0 - hag * 0.22);
        sh.scale.set(ss, ss, ss);
        sh.material.opacity = Math.max(0.08, 0.4 - hag * 0.08);
        sh.position.y = this.currentRoofHeight + 0.01;
      }
    }

    // Character animation
    if (this.player && this.player.userData) {
      var u = this.player.userData;
      if (this.hoverboardActive) {
        if (u.leftLegGroup) u.leftLegGroup.rotation.x = -0.2;
        if (u.rightLegGroup) u.rightLegGroup.rotation.x = 0.2;
        if (u.leftArmGroup) u.leftArmGroup.rotation.z = 0.4;
        if (u.rightArmGroup) u.rightArmGroup.rotation.z = -0.4;
      } else if (!this.isJumping && !this.isSliding) {
        var swing = Math.sin(this.animTime * 15 * speedMult) * 0.62;
        if (u.leftArmGroup) u.leftArmGroup.rotation.x = swing;
        if (u.rightArmGroup) u.rightArmGroup.rotation.x = -swing;
        if (u.leftLegGroup) u.leftLegGroup.rotation.x = -swing;
        if (u.rightLegGroup) u.rightLegGroup.rotation.x = swing;
      } else if (this.isJumping) {
        if (u.leftLegGroup) u.leftLegGroup.rotation.x = -0.58;
        if (u.rightLegGroup) u.rightLegGroup.rotation.x = 0.42;
      }
    }

    // Move all world objects in +Z
    // Chunks
    for (var ci = 0; ci < this.chunks.length; ci++) {
      var ch = this.chunks[ci];
      ch.group.position.z += moveDist;
      ch.startZ += moveDist;
      for (var ei = 0; ei < ch.extras.length; ei++) {
        ch.extras[ei].position.z += moveDist;
      }
    }

    // Obstacles
    for (var oi = 0; oi < this.obstacles.length; oi++) {
      var obs = this.obstacles[oi];
      var extraMv = 0;
      if (obs.isMoving) {
        extraMv = (obs.moveSpeed || 0.08) * 0.32 * (delta / 0.016);
        if (obs.mesh.userData.beacon) {
          obs.mesh.userData.beacon.material.color.setHex((Math.floor(this.animTime * 8) % 2 === 0) ? 0xff1744 : 0xffff00);
        }
      }
      obs.mesh.position.z += (moveDist + extraMv);
      obs.centerZ += (moveDist + extraMv);
    }

    // Collectibles
    for (var coli = 0; coli < this.collectibles.length; coli++) {
      var col = this.collectibles[coli];
      col.mesh.position.z += moveDist;
      col.mesh.rotation.y += delta * 3.2;
      var by = col.baseY || 0;
      col.mesh.position.y = by + Math.sin(this.animTime * 3.5 + col.mesh.position.z * 0.1) * 0.07;
    }

    // Particles
    this.particles = this.particles.filter(function(p) {
      p.life -= delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.vy -= 9.5 * delta;
      if (p.life <= 0) { self.scene.remove(p.mesh); return false; }
      return true;
    });

    // Recycle chunks: if the FRONT of the first chunk (startZ) > recycle threshold
    var RECYCLE_THRESHOLD = 20;
    if (this.chunks.length > 0 && this.chunks[0].startZ > RECYCLE_THRESHOLD) {
      var oldChunk = this.chunks.shift();
      this.scene.remove(oldChunk.group);
      for (var oe = 0; oe < oldChunk.extras.length; oe++) {
        this.scene.remove(oldChunk.extras[oe]);
      }
      // Spawn new chunk behind the last one
      this.nextChunkStartZ = this.chunks[this.chunks.length - 1].startZ - this.chunkLength;
      this.spawnChunk(false);
    }

    // Clean up obstacles & collectibles that passed the camera
    this.obstacles = this.obstacles.filter(function(o) {
      if (o.mesh.position.z > 15) { self.scene.remove(o.mesh); return false; }
      return true;
    });
    this.collectibles = this.collectibles.filter(function(c) {
      if (c.mesh.position.z > 15) { self.scene.remove(c.mesh); return false; }
      return true;
    });

    // Magnet
    if (this.powerups.magnet.active && this.player) {
      for (var mi = 0; mi < this.collectibles.length; mi++) {
        var mc = this.collectibles[mi];
        if (mc.type === 'coin' && Math.abs(mc.mesh.position.z) < 20) {
          mc.mesh.position.x += (this.player.position.x - mc.mesh.position.x) * 0.25;
          mc.mesh.position.y += (this.player.position.y + 0.75 - mc.mesh.position.y) * 0.25;
        }
      }
    }

    this.checkCollectibleCollisions();
    this.checkObstacleCollisions();

    // Smooth camera
    if (this.camera && this.player) {
      this.camera.position.x += (this.player.position.x * 0.32 - this.camera.position.x) * 0.10;
      this.camera.position.y = 4.2 + this.playerY * 0.42;
    }
  }

  // ============================================================
  // COLLISION DETECTION
  // Player is at world (playerX, playerY, 0)
  // Player hitbox: ±0.4 x, 0 to (isSliding ? 0.8 : 1.8) y
  // ============================================================
  checkCollectibleCollisions() {
    if (!this.player) return;
    var pX = this.player.position.x;
    var pY = this.playerY;
    var self = this;

    this.collectibles = this.collectibles.filter(function(col) {
      var cm = col.mesh;
      var dx = Math.abs(cm.position.x - pX);
      var dz = Math.abs(cm.position.z);   // player is at z=0
      var dy = Math.abs(cm.position.y + 0.75 - (pY + 0.9));

      if (dx < 1.0 && dz < 1.2 && dy < 1.0) {
        if (col.type === 'coin') {
          var mult = self.powerups.multiplier.active ? 2 : 1;
          self.coins += mult;
          if (window.soundEngine) soundEngine.playCoinSound();
          self.spawnParticleExplosion(cm.position.x, cm.position.y, cm.position.z, 0xffd700, 8);
        } else if (col.type === 'powerup') {
          var t = col.powerupType;
          self.powerups[t].active = true;
          self.powerups[t].timer = self.powerups[t].maxTime;
          if (window.soundEngine) soundEngine.playPowerupSound();
          self.spawnParticleExplosion(cm.position.x, cm.position.y, cm.position.z, 0x00f3ff, 15);
        }
        self.scene.remove(cm);
        return false;
      }
      return true;
    });
  }

  checkObstacleCollisions() {
    if (!this.player || this.powerups.boost.active) return;

    var pX = this.player.position.x;
    var pY = this.playerY;
    var pZ = 0; // player always at z=0

    var onTrainThisFrame = false;
    var roofY = 0;
    var self = this;

    for (var i = 0; i < this.obstacles.length; i++) {
      var obs = this.obstacles[i];
      var oX = obs.mesh.position.x;
      var oZ = obs.mesh.position.z; // world Z of obstacle center

      // Lane overlap: player hitbox ±0.42, obstacle half-width ±1.05
      var xOverlap = Math.abs(pX - oX) < 1.35;
      if (!xOverlap) continue;

      if (obs.type === 'train') {
        var halfLen = obs.halfLen || 6;
        var trainFront = oZ + halfLen;    // front face world Z
        var trainBack = oZ - halfLen;     // back face world Z
        var rampLen = obs.rampLength || 0;
        var rampFront = trainFront + rampLen; // ramp starts here (further from camera)

        // Check ramp zone: trainFront <= pZ <= rampFront
        if (obs.hasRamp && rampLen > 0 && pZ >= trainFront && pZ <= rampFront) {
          var progress = (rampFront - pZ) / rampLen;
          var slopeY = Math.max(0, Math.min(obs.height, progress * obs.height));
          onTrainThisFrame = true;
          roofY = slopeY;
          if (pY < slopeY) this.playerY = slopeY;
          continue;
        }

        // On top of train: trainBack <= pZ <= trainFront
        if (pZ >= trainBack && pZ <= trainFront) {
          if (pY >= obs.height - 0.35) {
            onTrainThisFrame = true;
            roofY = obs.height;
          } else {
            // Crash into train side/front
            this.handleCollisionImpact();
            return;
          }
        }

      } else if (obs.type === 'hurdle') {
        var hHalfLen = obs.halfLen || 0.5;
        if (pZ >= oZ - hHalfLen - 0.3 && pZ <= oZ + hHalfLen + 0.3) {
          var playerTop = this.isSliding ? 0.75 : 1.8;
          if (pY + playerTop > 0 && pY < obs.height) {
            this.handleCollisionImpact();
            return;
          }
        }

      } else if (obs.type === 'lasergate') {
        var gHalfLen = obs.halfLen || 0.5;
        if (pZ >= oZ - gHalfLen - 0.3 && pZ <= oZ + gHalfLen + 0.3) {
          var clearance = obs.clearance || 1.3;
          if (!this.isSliding && pY + 1.5 > clearance) {
            this.handleCollisionImpact();
            return;
          }
          // If sliding, player height ~0.7, must be < clearance
          if (this.isSliding && pY + 0.7 > clearance) {
            this.handleCollisionImpact();
            return;
          }
        }
      }
    }

    this.onTrainRoof = onTrainThisFrame;
    this.currentRoofHeight = onTrainThisFrame ? roofY : 0;
  }

  handleCollisionImpact() {
    if (this.hoverboardActive) {
      this.deactivateHoverboard(true);
      this.stumbleTimer = 1.5;
      if (window.soundEngine) soundEngine.playCrashSound();
    } else if (this.guardDistance > 1.3 && this.stumbleTimer <= 0) {
      this.stumbleTimer = 2.0;
      if (window.soundEngine) soundEngine.playCrashSound();
      this.spawnParticleExplosion(this.player.position.x, this.playerY + 0.5, 0, 0xff1744, 12);
    } else {
      this.gameOver();
    }
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

const gameEngine = new GameEngine();

