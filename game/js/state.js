// ============================================================
// STATE.JS — Central game state management with save/load
// ============================================================

// Stat name enums — use these everywhere to prevent typos
const STATS = Object.freeze({
  WARPING: 'warping',
  NOTORIETY: 'notoriety',
  CORRUPTION: 'corruption',
  HUBRIS: 'hubris',
});
const ALL_STATS = Object.values(STATS);

const GameState = {
  initialized: false,
  paused: false,
  gameOver: false,
  season: 0,
  year: 1220,
  totalSeasons: 0,
  messageCount: 0, // monotonic counter for chronicle ordering

  // Status trackers (0-10) — Ars Magica themed
  warping: 0,      // Magical warping from power use; at 10 → Twilight
  notoriety: 0,    // How much the mundane world knows; at 10 → Inquisition
  corruption: 0,   // Infernal taint; at 10 → Damnation
  hubris: 0,       // Overreach and pride; at 10 → Lost to obsession

  tableCards: [],
  verbCards: {},
  activeVerbs: {},
  unlockedVerbs: ['study', 'time'],

  mysteryProgress: { enigma: 0, heartbeast: 0, artifice: 0, arcadia: 0, necromancy: 0, runes: 0, hymns: 0, body: 0, strife: 0 },
  discoveredRecipes: new Set(),

  arts: {
    creo: 0, intellego: 0, muto: 0, perdo: 0, rego: 0,
    animal: 0, aquam: 0, auram: 0, corpus: 0, herbam: 0,
    ignem: 0, imaginem: 0, mentem: 0, terram: 0, vim: 0
  },

  flags: {
    firstSpellCast: false, metMagus: false, enteredTwilight: false,
    foundCovenant: false, hasFamiliar: false, hasApprentice: false,
    aegisEstablished: false, threatsResolved: 0,
  },

  nextCardId: 1,

  generateCardId() { return `card_${this.nextCardId++}`; },

  addCard(cardDef) {
    const instance = { ...cardDef, instanceId: this.generateCardId(), createdAt: Date.now() };
    this.tableCards.push(instance);
    return instance;
  },

  removeCard(instanceId) {
    const idx = this.tableCards.findIndex(c => c.instanceId === instanceId);
    if (idx >= 0) { this.tableCards.splice(idx, 1); return true; }
    return false;
  },

  findCards(filter) { return this.tableCards.filter(filter); },
  getSeasonName() { return ['Spring', 'Summer', 'Autumn', 'Winter'][this.season]; },

  advanceSeason() {
    this.season = (this.season + 1) % 4;
    if (this.season === 0) this.year++;
    this.totalSeasons++;
  },

  modifyStat(stat, delta) {
    if (!ALL_STATS.includes(stat)) {
      console.error(`Invalid stat name: "${stat}". Valid: ${ALL_STATS.join(', ')}`);
      return;
    }
    this[stat] = Math.max(0, Math.min(10, this[stat] + delta));
  },

  updateArt(artName, level) {
    if (artName in this.arts && level > this.arts[artName]) {
      this.arts[artName] = level;
    }
  },

  checkUnlocks() {
    const unlocks = [];
    if (!this.unlockedVerbs.includes('work')) {
      if (Object.values(this.arts).some(v => v >= 3)) {
        this.unlockedVerbs.push('work');
        unlocks.push({ type: 'verb', id: 'work', message: 'Your understanding deepens. The laboratory beckons. You may now Work.' });
      }
    }
    if (!this.unlockedVerbs.includes('dream')) {
      if (this.warping >= 2) {
        this.unlockedVerbs.push('dream');
        unlocks.push({ type: 'verb', id: 'dream', message: 'Your brush with raw magic has torn a veil in your mind. You may now Dream.' });
      }
    }
    if (!this.unlockedVerbs.includes('explore') && this.arts.intellego >= 1) {
      this.unlockedVerbs.push('explore');
      unlocks.push({ type: 'verb', id: 'explore', message: 'Your senses extend beyond the mundane. You may now Explore.' });
    }
    if (!this.unlockedVerbs.includes('speak') && this.flags.metMagus) {
      this.unlockedVerbs.push('speak');
      unlocks.push({ type: 'verb', id: 'speak', message: 'You have been noticed by the Order. You may now Speak.' });
    }
    return unlocks;
  },

  reset() {
    this.initialized = false;
    this.paused = false;
    this.gameOver = false;
    this.season = 0;
    this.year = 1220;
    this.totalSeasons = 0;
    this.warping = 0;
    this.notoriety = 0;
    this.corruption = 0;
    this.hubris = 0;
    this.tableCards = [];
    this.verbCards = {};
    this.activeVerbs = {};
    this.unlockedVerbs = ['study', 'time'];
    this.mysteryProgress = { enigma: 0, heartbeast: 0, artifice: 0, arcadia: 0, necromancy: 0, runes: 0, hymns: 0, body: 0, strife: 0 };
    this.discoveredRecipes = new Set();
    this.arts = {
      creo: 0, intellego: 0, muto: 0, perdo: 0, rego: 0,
      animal: 0, aquam: 0, auram: 0, corpus: 0, herbam: 0,
      ignem: 0, imaginem: 0, mentem: 0, terram: 0, vim: 0
    };
    this.flags = {
      firstSpellCast: false, metMagus: false, enteredTwilight: false,
      foundCovenant: false, hasFamiliar: false, hasApprentice: false,
      aegisEstablished: false, threatsResolved: 0,
    };
    this.nextCardId = 1;
    this.messageCount = 0;
  },

  // ---- SAVE / LOAD ----

  toJSON() {
    return {
      version: 2,
      season: this.season,
      year: this.year,
      totalSeasons: this.totalSeasons,
      warping: this.warping,
      notoriety: this.notoriety,
      corruption: this.corruption,
      hubris: this.hubris,
      tableCards: this.tableCards,
      unlockedVerbs: this.unlockedVerbs,
      mysteryProgress: this.mysteryProgress,
      discoveredRecipes: [...this.discoveredRecipes],
      arts: this.arts,
      flags: this.flags,
      nextCardId: this.nextCardId,
      threats: typeof ThreatSystem !== 'undefined' ? ThreatSystem.toJSON() : null,
    };
  },

  fromJSON(data) {
    if (!data || (data.version !== 1 && data.version !== 2)) return false;
    this.season = data.season ?? 0;
    this.year = data.year ?? 1220;
    this.totalSeasons = data.totalSeasons ?? 0;
    this.warping = data.warping ?? 0;
    this.notoriety = data.notoriety ?? 0;
    this.corruption = data.corruption ?? 0;
    this.hubris = data.hubris ?? 0;
    this.tableCards = data.tableCards ?? [];
    this.verbCards = {};
    this.activeVerbs = {};
    this.unlockedVerbs = data.unlockedVerbs ?? ['study', 'time'];
    this.mysteryProgress = data.mysteryProgress ?? { enigma: 0, heartbeast: 0, artifice: 0, arcadia: 0, necromancy: 0, runes: 0, hymns: 0, body: 0, strife: 0 };
    this.discoveredRecipes = new Set(data.discoveredRecipes ?? []);
    this.arts = data.arts ?? {};
    this.flags = data.flags ?? {};
    this.nextCardId = data.nextCardId ?? 1;
    if (typeof ThreatSystem !== 'undefined') {
      ThreatSystem.fromJSON(data.threats);
    }
    this.initialized = true;
    this.paused = false;
    this.gameOver = false;
    return true;
  },

  saveToStorage() {
    try {
      localStorage.setItem('occulta_magicae_save', JSON.stringify(this.toJSON()));
      return true;
    } catch (e) { return false; }
  },

  loadFromStorage() {
    try {
      const raw = localStorage.getItem('occulta_magicae_save');
      if (!raw) return false;
      return this.fromJSON(JSON.parse(raw));
    } catch (e) { return false; }
  },

  hasSavedGame() {
    return !!localStorage.getItem('occulta_magicae_save');
  },

  clearSave() {
    localStorage.removeItem('occulta_magicae_save');
  },

  exportJSON() {
    return JSON.stringify(this.toJSON(), null, 2);
  },

  importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      return this.fromJSON(data);
    } catch (e) { return false; }
  }
};
