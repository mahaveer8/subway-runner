/* CYBER DASH / SUBWAY SURFERS 3D - Ultra-Responsive UI, Instant Swipe Engine & Shop */

class UIManager {
  constructor() {
    // Instant Swipe Tracking
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.isSwiping = false;
    this.swipeThreshold = 22; // Quick 22px threshold for instant response
    this.lastTapTime = 0;

    // Shop Catalog
    this.skinsCatalog = [
      { id: 'default', name: 'Jake (Street Runner)', cost: 0, icon: '🧢', desc: 'Classic Subway Surfers Runner' },
      { id: 'cyber',   name: 'Cyber Nova', cost: 150, icon: '🤖', desc: 'Futuristic Neon Exoskeleton' },
      { id: 'tricky',  name: 'Tricky (Beanie)', cost: 300, icon: '🎀', desc: 'Street Skater Girl' },
      { id: 'fresh',   name: 'Fresh (Boombox)', cost: 600, icon: '📻', desc: 'Retro Hip-Hop Surfer' },
      { id: 'gold',    name: 'Golden Legend', cost: 1200, icon: '👑', desc: 'Pure Gold Legend' }
    ];

    this.boardsCatalog = [
      { id: 'board_blue',   name: 'Star Board', cost: 0, icon: '🛹', desc: 'Classic Red & Yellow Hoverboard' },
      { id: 'board_purple', name: 'Teleporter', cost: 350, icon: '⚡', desc: 'Zap Teleport Board' },
      { id: 'board_gold',   name: 'Freestyler', cost: 900, icon: '✨', desc: 'Golden High-Bounce Hoverboard' }
    ];

    this.unlockedSkins = JSON.parse(localStorage.getItem('subway_unlocked_skins') || '["default"]');
    this.unlockedBoards = JSON.parse(localStorage.getItem('subway_unlocked_boards') || '["board_blue"]');
  }

  init() {
    this.bindEvents();
    this.setupInstantControls();
    this.setupKeyboard();
    this.updateMenuStats();
    this.renderShop('runners');
  }

  // --- BUTTON EVENT LISTENERS ---

  bindEvents() {
    // Menu Play Run
    document.getElementById('btn-start-game').addEventListener('click', () => {
      this.showScreen('hud');
      gameEngine.startGame();
    });

    document.getElementById('btn-open-shop').addEventListener('click', () => {
      this.updateShopCoins();
      this.showModal('screen-shop');
    });

    document.getElementById('btn-open-settings').addEventListener('click', () => {
      this.showModal('screen-settings');
    });

    document.getElementById('btn-open-how-to').addEventListener('click', () => {
      this.showModal('screen-how-to');
    });

    // Close Modals
    document.getElementById('btn-close-shop').addEventListener('click', () => this.hideModal('screen-shop'));
    document.getElementById('btn-close-settings').addEventListener('click', () => this.hideModal('screen-settings'));
    document.getElementById('btn-close-how-to').addEventListener('click', () => this.hideModal('screen-how-to'));

    // Pause Controls
    document.getElementById('btn-pause-hud').addEventListener('click', () => {
      gameEngine.pauseGame();
      document.getElementById('pause-score').textContent = Math.floor(gameEngine.score);
      document.getElementById('pause-coins').textContent = gameEngine.coins;
      this.showModal('screen-pause');
    });

    document.getElementById('btn-resume-game').addEventListener('click', () => {
      this.hideModal('screen-pause');
      gameEngine.resumeGame();
    });

    document.getElementById('btn-restart-pause').addEventListener('click', () => {
      this.hideModal('screen-pause');
      gameEngine.startGame();
    });

    document.getElementById('btn-quit-main').addEventListener('click', () => {
      this.hideModal('screen-pause');
      this.showScreen('screen-main-menu');
      gameEngine.state = 'MENU';
      this.updateMenuStats();
    });

    // Game Over Actions
    document.getElementById('btn-restart-game').addEventListener('click', () => {
      this.hideModal('screen-game-over');
      this.showScreen('hud');
      gameEngine.startGame();
    });

    document.getElementById('btn-game-over-shop').addEventListener('click', () => {
      this.hideModal('screen-game-over');
      this.updateShopCoins();
      this.showModal('screen-shop');
    });

    document.getElementById('btn-game-over-menu').addEventListener('click', () => {
      this.hideModal('screen-game-over');
      this.showScreen('screen-main-menu');
      gameEngine.state = 'MENU';
      this.updateMenuStats();
    });

    // On-Screen Accessibility Buttons
    document.getElementById('touch-left-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      gameEngine.moveLeft();
    });
    document.getElementById('touch-right-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      gameEngine.moveRight();
    });
    document.getElementById('btn-touch-jump').addEventListener('click', (e) => {
      e.stopPropagation();
      gameEngine.jump();
    });
    document.getElementById('btn-touch-slide').addEventListener('click', (e) => {
      e.stopPropagation();
      gameEngine.slide();
    });
    document.getElementById('btn-touch-board').addEventListener('click', (e) => {
      e.stopPropagation();
      gameEngine.activateHoverboard();
    });

    // Settings Toggles
    document.getElementById('toggle-audio').addEventListener('click', (e) => {
      const active = soundEngine.toggleAudio();
      e.target.textContent = active ? 'ON' : 'OFF';
      e.target.classList.toggle('active', active);
    });

    document.getElementById('toggle-touch-btn').addEventListener('click', (e) => {
      const controls = document.getElementById('touch-controls-layer');
      const isVisible = !controls.classList.contains('hidden');
      controls.classList.toggle('hidden', isVisible);
      e.target.textContent = isVisible ? 'OFF' : 'ON';
      e.target.classList.toggle('active', !isVisible);
    });

    // Shop Tabs
    document.querySelectorAll('.shop-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderShop(e.target.dataset.tab);
      });
    });
  }

  // --- INSTANT RESPONSE SWIPE ENGINE (TOUCH + MOUSE DRAG) ---

  setupInstantControls() {
    const handleStart = (clientX, clientY) => {
      this.startX = clientX;
      this.startY = clientY;
      this.startTime = Date.now();
      this.isSwiping = true;

      // Double-Tap detection for Hoverboard deployment
      const timeSinceLastTap = Date.now() - this.lastTapTime;
      if (timeSinceLastTap < 260) {
        gameEngine.activateHoverboard();
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = Date.now();
      }
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isSwiping || gameEngine.state !== 'PLAYING') return;

      const dx = clientX - this.startX;
      const dy = clientY - this.startY;

      // Trigger action INSTANTLY as soon as threshold is crossed
      if (Math.abs(dx) > this.swipeThreshold || Math.abs(dy) > this.swipeThreshold) {
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) gameEngine.moveRight();
          else gameEngine.moveLeft();
        } else {
          if (dy > 0) gameEngine.slide();
          else gameEngine.jump();
        }
        // Reset to prevent double triggering within the same swipe
        this.isSwiping = false;
      }
    };

    const handleEnd = () => {
      this.isSwiping = false;
    };

    // Touch Event Listeners (Passive: false to avoid scroll hitch)
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', handleEnd, { passive: true });

    // Pointer & Mouse Drag Listeners (For PC testing & mouse gestures)
    window.addEventListener('pointerdown', (e) => {
      // Don't intercept UI buttons
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
      handleStart(e.clientX, e.clientY);
    });

    window.addEventListener('pointermove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    window.addEventListener('pointerup', handleEnd);
  }

  // --- KEYBOARD CONTROLS ---

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (gameEngine.state === 'MENU' && (e.code === 'Space' || e.code === 'Enter')) {
        this.showScreen('hud');
        gameEngine.startGame();
        return;
      }

      if (gameEngine.state === 'GAMEOVER' && (e.code === 'Space' || e.code === 'Enter')) {
        this.hideModal('screen-game-over');
        this.showScreen('hud');
        gameEngine.startGame();
        return;
      }

      if (gameEngine.state !== 'PLAYING') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          gameEngine.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          gameEngine.moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          gameEngine.jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          gameEngine.slide();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          gameEngine.activateHoverboard();
          break;
        case 'KeyP':
        case 'Escape':
          gameEngine.pauseGame();
          document.getElementById('pause-score').textContent = Math.floor(gameEngine.score);
          document.getElementById('pause-coins').textContent = gameEngine.coins;
          this.showModal('screen-pause');
          break;
      }
    });
  }

  // --- SCREEN & MODALS ---

  showScreen(screenId) {
    document.querySelectorAll('.ui-overlay').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('screen-active');
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.remove('hidden');
      target.classList.add('screen-active');
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('screen-active');
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('screen-active');
    }
  }

  updateMenuStats() {
    document.getElementById('menu-high-score').textContent = gameEngine.highScore;
    document.getElementById('menu-total-coins').textContent = gameEngine.totalCoins;
  }

  updateShopCoins() {
    document.getElementById('shop-coin-count').textContent = gameEngine.totalCoins;
  }

  showGameOver(score, coins, highScore, isNewHigh) {
    document.getElementById('final-score-val').textContent = score;
    document.getElementById('final-coins-val').textContent = `🪙 ${coins}`;
    document.getElementById('best-score-val').textContent = highScore;

    const badge = document.getElementById('new-high-score-badge');
    if (isNewHigh) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    this.showModal('screen-game-over');
  }

  // --- SHOP CATALOG & PURCHASING ---

  renderShop(tabType = 'runners') {
    const grid = document.getElementById('shop-items-grid');
    grid.innerHTML = '';

    const items = (tabType === 'runners') ? this.skinsCatalog : this.boardsCatalog;
    const currentEquipped = (tabType === 'runners') ? gameEngine.currentSkin : gameEngine.currentBoard;
    const unlockedList = (tabType === 'runners') ? this.unlockedSkins : this.unlockedBoards;

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `shop-item-card ${item.id === currentEquipped ? 'equipped' : ''}`;

      const isUnlocked = unlockedList.includes(item.id);
      let btnHtml = '';

      if (item.id === currentEquipped) {
        btnHtml = `<button class="btn-secondary btn-buy-equip" disabled>EQUIPPED</button>`;
      } else if (isUnlocked) {
        btnHtml = `<button class="btn-primary btn-buy-equip" onclick="UI.equipItem('${tabType}', '${item.id}')">EQUIP</button>`;
      } else {
        btnHtml = `<button class="btn-secondary btn-buy-equip" onclick="UI.buyItem('${tabType}', '${item.id}', ${item.cost})">🪙 ${item.cost}</button>`;
      }

      card.innerHTML = `
        <div class="item-preview-icon">${item.icon}</div>
        <div class="item-name">${item.name}</div>
        ${btnHtml}
      `;

      grid.appendChild(card);
    });
  }

  equipItem(tabType, itemId) {
    if (tabType === 'runners') {
      gameEngine.equipSkin(itemId);
    } else {
      gameEngine.equipBoard(itemId);
    }
    if (window.soundEngine) soundEngine.playPowerupSound();
    this.renderShop(tabType);
  }

  buyItem(tabType, itemId, cost) {
    if (gameEngine.totalCoins >= cost) {
      gameEngine.totalCoins -= cost;
      localStorage.setItem('subway_total_coins', gameEngine.totalCoins.toString());

      if (tabType === 'runners') {
        this.unlockedSkins.push(itemId);
        localStorage.setItem('subway_unlocked_skins', JSON.stringify(this.unlockedSkins));
        gameEngine.equipSkin(itemId);
      } else {
        this.unlockedBoards.push(itemId);
        localStorage.setItem('subway_unlocked_boards', JSON.stringify(this.unlockedBoards));
        gameEngine.equipBoard(itemId);
      }

      if (window.soundEngine) soundEngine.playPowerupSound();
      this.updateShopCoins();
      this.renderShop(tabType);
    } else {
      alert('Not enough coins! Run and collect more gold coins first.');
    }
  }

  // --- REAL-TIME HUD LOOP ---

  updateHUD() {
    if (gameEngine.state !== 'PLAYING') return;

    document.getElementById('hud-score').textContent = Math.floor(gameEngine.score);
    document.getElementById('hud-coins').textContent = gameEngine.coins;

    const multVal = gameEngine.powerups.multiplier.active ? 2 : 1;
    document.getElementById('hud-multiplier').textContent = `${multVal}x`;

    // Powerup Timers HUD Badges
    const container = document.getElementById('powerup-hud-container');
    container.innerHTML = '';

    const pDefs = [
      { key: 'magnet', icon: '🧲', name: 'Magnet' },
      { key: 'boost', icon: '🚀', name: 'Jetpack' },
      { key: 'slow', icon: '⏳', name: 'Slow' },
      { key: 'multiplier', icon: '2️⃣', name: '2X' },
      { key: 'sneakers', icon: '👟', name: 'Sneakers' }
    ];

    pDefs.forEach(p => {
      const state = gameEngine.powerups[p.key];
      if (state.active) {
        const pct = Math.max(0, (state.timer / state.maxTime) * 100);
        const badge = document.createElement('div');
        badge.className = 'powerup-badge';
        badge.innerHTML = `
          <span class="powerup-icon">${p.icon}</span>
          <div class="powerup-bar-bg">
            <div class="powerup-bar-fill" style="width: ${pct}%"></div>
          </div>
          <span class="powerup-timer-text">${Math.ceil(state.timer)}s</span>
        `;
        container.appendChild(badge);
      }
    });

    // Hoverboard Action Button Toggle
    const boardBtn = document.getElementById('btn-touch-board');
    if (boardBtn) {
      if (gameEngine.hoverboardActive) {
        boardBtn.textContent = '🛹 ACTIVE SHIELD';
        boardBtn.classList.remove('hidden');
      } else {
        boardBtn.textContent = '🛹 DEPLOY BOARD';
        boardBtn.classList.remove('hidden');
      }
    }
  }
}

const UI = new UIManager();
