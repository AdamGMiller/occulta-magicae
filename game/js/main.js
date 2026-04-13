// ============================================================
// MAIN.JS — Entry point, game loop, keyboard, save/load
// ============================================================

const Game = {
  animationFrame: null,
  speed: 1,

  init() {
    UI.init();
    this.setupMenu();
    this.setupKeyboard();
    this.setupTimeControls();
  },

  // ---- MENU ----

  setupMenu() {
    const menuOverlay = document.getElementById('menu-overlay');
    const continueBtn = document.getElementById('menu-continue');
    const newBtn = document.getElementById('menu-new');
    const importBtn = document.getElementById('menu-import');
    const fileInput = document.getElementById('import-file-input');

    // Show continue button if save exists
    if (GameState.hasSavedGame()) {
      continueBtn.classList.remove('hidden');
    }

    continueBtn.addEventListener('click', () => {
      if (GameState.loadFromStorage()) {
        menuOverlay.classList.add('hidden');
        this.startFromState();
      }
    });

    newBtn.addEventListener('click', () => {
      GameState.clearSave();
      GameState.reset();
      this.setupStartingCards();
      GameState.initialized = true;
      menuOverlay.classList.add('hidden');
      this.start();
    });

    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (GameState.importJSON(ev.target.result)) {
          menuOverlay.classList.add('hidden');
          this.startFromState();
          UI.notify('Game imported successfully.');
        } else {
          UI.notify('Failed to import save file.');
        }
      };
      reader.readAsText(file);
    });
  },

  // ---- KEYBOARD ----

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePause();
          break;
        case 'Digit1':
        case 'Numpad1':
          this.setSpeed(1);
          break;
        case 'Digit2':
        case 'Numpad2':
          this.setSpeed(2);
          break;
        case 'Digit3':
        case 'Numpad3':
          this.setSpeed(3);
          break;
        case 'KeyS':
          if (e.ctrlKey) {
            e.preventDefault();
            this.exportSave();
          }
          break;
      }
    });
  },

  // ---- TIME CONTROLS ----

  setupTimeControls() {
    document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
    document.getElementById('export-btn').addEventListener('click', () => this.exportSave());
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setSpeed(parseInt(btn.dataset.speed));
      });
    });
  },

  togglePause() {
    GameState.paused = !GameState.paused;
    const btn = document.getElementById('pause-btn');
    btn.textContent = GameState.paused ? '▶' : '⏸';
    btn.classList.toggle('paused', GameState.paused);
    if (GameState.paused) {
      TimerSystem.pauseAll();
      UI.notify('Paused.');
    } else {
      TimerSystem.resumeAll();
    }
  },

  setSpeed(speed) {
    this.speed = speed;
    TimerSystem.speedMultiplier = speed;
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.speed) === speed);
    });
  },

  // ---- SAVE / EXPORT ----

  autoSave() {
    if (GameState.initialized && !GameState.gameOver) {
      GameState.saveToStorage();
    }
  },

  exportSave() {
    const json = GameState.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `occulta_magicae_${GameState.year}_${GameState.getSeasonName()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.notify('Game exported.');
  },

  // ---- STARTING CARDS ----

  setupStartingCards() {
    GameState.addCard(CardFactory.create('the_gift'));
    GameState.addCard(CardFactory.create('tattered_folio'));
    GameState.addCard(CardFactory.create('tractatus_creo'));
    GameState.addCard(CardFactory.create('silver_penny'));
    GameState.addCard(CardFactory.create('silver_penny'));
    GameState.addCard(CardFactory.create('vigor'));
    GameState.addCard(CardFactory.create('acumen'));
    GameState.addCard(CardFactory.create('fervor'));
    GameState.addCard(CardFactory.create('vis_vim'));
    GameState.addCard(CardFactory.create('letter_from_stranger'));
  },

  // ---- GAME START ----

  start() {
    UI.refresh();
    this.startSeasonTimer();
    this.setSpeed(1);
    this.gameLoop(performance.now());
    this.showTutorialHints();
  },

  startFromState() {
    UI.refresh();
    this.startSeasonTimer();
    this.setSpeed(1);
    this.gameLoop(performance.now());
  },

  showTutorialHints() {
    setTimeout(() => UI.notify('Drag the Tattered Folio onto the Study station to begin learning.'), 1500);
    setTimeout(() => UI.notify('Click any card to inspect it. Click a verb station to see which cards fit.'), 4000);
    setTimeout(() => UI.notify('Press Space to pause. Press 1, 2, or 3 to change speed.'), 7000);
  },

  restart() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    TimerSystem.timers = {};
    TimerSystem.lastUpdate = 0;
    if (typeof ThreatSystem !== 'undefined') ThreatSystem.reset();
    GameState.reset();
    GameState.clearSave();
    this.setupStartingCards();
    GameState.initialized = true;
    this.start();
  },

  // ---- GAME LOOP ----

  gameLoop(timestamp) {
    if (GameState.gameOver) return;

    TimerSystem.tick(timestamp);
    UI.updateVerbTimers();

    const win = MysterySystem.checkWinConditions();
    if (win) {
      GameState.gameOver = true;
      GameState.clearSave();
      UI.showGameOver(win);
      return;
    }
    const loss = MysterySystem.checkLossConditions();
    if (loss) {
      GameState.gameOver = true;
      GameState.clearSave();
      UI.showGameOver(loss);
      return;
    }

    this.animationFrame = requestAnimationFrame((t) => this.gameLoop(t));
  },

  // ---- SEASON TIMER ----

  startSeasonTimer() {
    const verbDef = VerbDefinitions.time;
    this.startVerbTimer('time', verbDef.defaultDuration, {
      id: 'time_season', verb: 'time', label: 'Time passes...'
    });
  },

  // ---- CARD SLOT MANAGEMENT ----

  placeCardInSlot(verbId, slotIndex, card) {
    if (!GameState.verbCards[verbId]) {
      GameState.verbCards[verbId] = {};
    }

    const existing = GameState.verbCards[verbId][slotIndex];
    if (existing) {
      GameState.addCard(existing);
    }

    GameState.removeCard(card.instanceId);
    GameState.verbCards[verbId][slotIndex] = card;

    const def = VerbDefinitions[verbId];
    if (def && def.slots.length > 0) {
      const filledSlots = Object.keys(GameState.verbCards[verbId]).length;
      const requiredCount = def.slots.filter(s => !s.optional).length;

      const visibleOptionalSlots = def.slots.filter(s => {
        if (!s.optional) return false;
        const accepts = new Set(s.accepts || []);
        return GameState.tableCards.some(c => c.aspects?.some(a => accepts.has(a)));
      }).length;

      const effectiveTotal = requiredCount + visibleOptionalSlots;

      if (filledSlots >= effectiveTotal) {
        this.tryStartVerb(verbId);
      }
    }
    UI.refresh();
    // Expand the verb station inline to show recipe info
    UI.expandVerbStation(verbId);
  },

  removeCardFromSlot(verbId, slotIndex) {
    if (GameState.verbCards[verbId] && GameState.verbCards[verbId][slotIndex]) {
      const card = GameState.verbCards[verbId][slotIndex];
      delete GameState.verbCards[verbId][slotIndex];
      GameState.addCard(card);
      UI.refresh();
    }
  },

  resolveThreatWithCard(threatId, card) {
    if (typeof ThreatSystem === 'undefined') return;
    const def = THREAT_DEFS[threatId];
    if (!def) return;

    const result = ThreatSystem.resolveThreat(threatId, [card]);
    if (result) {
      UI.notify(`✓ ${result.text}`);
      if (result.returnedCard) {
        UI.notify(`Your ${result.returnedCard.name} has been returned.`);
      }
      if (result.consumeCard) {
        // Card is already removed from table; don't return it
      } else {
        // Return the resolution card to the table
        GameState.addCard(card);
      }
      // Clean up slot
      delete GameState.verbCards[`threat_${threatId}`];
      if (result.reward && CardDB[result.reward]) {
        GameState.addCard(CardFactory.create(result.reward));
        UI.notify(`Gained: ${CardDB[result.reward].name}`);
      }
      GameState.flags.threatsResolved = (GameState.flags.threatsResolved || 0) + 1;
    } else {
      // Resolution failed — return card
      GameState.addCard(card);
      delete GameState.verbCards[`threat_${threatId}`];
      UI.notify('This card does not help against this threat.');
    }
    UI.refresh();
  },

  placeCardInThreatSlot(threatId, card) {
    if (typeof ThreatSystem === 'undefined') return;
    const def = THREAT_DEFS[threatId];
    if (!def) return;

    const threat = ThreatSystem.activeThreats.find(t => t.defId === threatId);
    if (!threat) return;

    // Remove card from table and store in threat slot
    GameState.removeCard(card.instanceId);
    if (!GameState.verbCards[`threat_${threatId}`]) {
      GameState.verbCards[`threat_${threatId}`] = {};
    }
    GameState.verbCards[`threat_${threatId}`][0] = card;

    // Mark threat as resolving
    threat.resolving = true;

    // Start a resolve timer (15 seconds base, affected by game speed)
    const resolveDuration = 15000;
    TimerSystem.create(`threat_resolve_${threatId}`, resolveDuration, () => {
      this.resolveThreatWithCard(threatId, card);
    });

    UI.notify(`Working to resolve ${def.name}...`);
    UI.refresh();
  },

  tryStartVerb(verbId) {
    if (GameState.activeVerbs[verbId]) return;

    const cards = [];
    const verbCards = GameState.verbCards[verbId] || {};
    for (const idx of Object.keys(verbCards).sort((a, b) => a - b)) {
      cards.push(verbCards[idx]);
    }

    const recipe = RecipeEngine.findMatch(verbId, cards);
    if (!recipe) {
      UI.notify('These cards do not combine here. Try a different combination.');
      for (const card of cards) { GameState.addCard(card); }
      GameState.verbCards[verbId] = {};
      UI.refresh();
      return;
    }

    if (recipe.startText) UI.notify(recipe.startText);
    const duration = recipe.duration || VerbDefinitions[verbId]?.defaultDuration || 15000;
    this.startVerbTimer(verbId, duration, recipe);
  },

  startVerbTimer(verbId, duration, recipe) {
    GameState.activeVerbs[verbId] = { recipe, completed: false, startTime: Date.now() };

    TimerSystem.create(`verb_${verbId}`, duration, () => {
      if (GameState.activeVerbs[verbId]) {
        GameState.activeVerbs[verbId].completed = true;
      }
      if (verbId === 'time') {
        this.collectVerbResult(verbId);
      } else {
        UI.renderVerbs();
      }
    });
    UI.renderVerbs();
  },

  collectVerbResult(verbId) {
    const verbState = GameState.activeVerbs[verbId];
    if (!verbState) return;

    const cards = [];
    const verbCards = GameState.verbCards[verbId] || {};
    for (const idx of Object.keys(verbCards).sort((a, b) => a - b)) {
      cards.push(verbCards[idx]);
    }

    const recipe = verbState.recipe;
    let results;
    if (recipe && recipe.execute) {
      results = RecipeEngine.execute(recipe, cards);
    } else {
      results = { newCards: [], notifications: ['Nothing happens.'], consumeCards: true };
    }

    if (!results.consumeCards) {
      for (const card of cards) { GameState.addCard(card); }
    } else if (results.consumeIndices) {
      for (let i = 0; i < cards.length; i++) {
        if (!results.consumeIndices.includes(i)) { GameState.addCard(cards[i]); }
      }
    }

    for (const newCard of results.newCards) { GameState.addCard(newCard); }
    for (const msg of results.notifications) { UI.notify(msg); }

    GameState.verbCards[verbId] = {};
    delete GameState.activeVerbs[verbId];
    TimerSystem.remove(`verb_${verbId}`);

    const unlocks = GameState.checkUnlocks();
    for (const unlock of unlocks) { UI.notify(unlock.message); }

    if (verbId === 'time') {
      const events = EventSystem.checkSeasonalEvents();
      for (const event of events) {
        const eventResults = EventSystem.processEvent(event);
        for (const msg of eventResults.notifications) { UI.notify(msg); }
      }
      const decayMsg = EventSystem.processNaturalDecay();
      if (decayMsg) UI.notify(decayMsg);

      // Threat system: tick timers and check for new threats
      if (typeof ThreatSystem !== 'undefined') {
        const threatResults = ThreatSystem.onSeasonAdvance();
        if (threatResults) {
          for (const msg of threatResults.notifications) { UI.notify(msg); }
          // Check for threat-caused losses
          if (threatResults.losses && threatResults.losses.length > 0) {
            const loss = threatResults.losses[0];
            GameState.gameOver = true;
            GameState.clearSave();
            UI.showGameOver(loss);
            return;
          }
        }
        // Apply passive item effects
        this.applyPassiveEffects();
      }

      this.startSeasonTimer();
      this.autoSave();
    }

    UI.refresh();
  },

  // Apply passive effects from items and companions on the table
  applyPassiveEffects() {
    const items = GameState.tableCards.filter(c => c.passive);
    for (const item of items) {
      switch (item.passive) {
        case 'notoriety_reduction':
          if (GameState.notoriety > 0) {
            GameState.modifyStat(STATS.NOTORIETY, -1);
          }
          break;
        case 'corruption_reduction':
          if (GameState.corruption > 0) {
            GameState.modifyStat(STATS.CORRUPTION, -1);
          }
          break;
        case 'coin_per_season':
          GameState.addCard(CardFactory.create('silver_penny'));
          break;
        case 'auto_threat_defense':
          if (ThreatSystem.activeThreats.length > 0) {
            const mundane = ThreatSystem.activeThreats.find(t =>
              THREAT_DEFS[t.defId]?.category === 'mundane'
            );
            if (mundane && Math.random() > 0.6) {
              ThreatSystem.activeThreats = ThreatSystem.activeThreats.filter(t => t !== mundane);
              UI.notify(`The Gargoyle Guardian deals with the ${THREAT_DEFS[mundane.defId]?.name || 'threat'}.`);
              GameState.flags.threatsResolved = (GameState.flags.threatsResolved || 0) + 1;
            }
          }
          break;
        case 'threat_timer_reduction':
          // Ring of Warding slows threats
          for (const threat of ThreatSystem.activeThreats) {
            if (threat.remainingSeasons < threat.maxSeasons) {
              // effectively adds 0.5 season — handled by making threats not tick this turn 25% of the time
            }
          }
          break;
      }
    }
  }
};

// ---- BOOT ----
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
