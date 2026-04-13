// ============================================================
// THREATS.JS — Timed threat system with countdown and escalation
// ============================================================

const THREAT_DEFS = {
  // ---- MUNDANE THREATS ----
  suspicious_villagers: {
    id: 'suspicious_villagers', name: 'Suspicious Villagers',
    category: 'mundane', timer: 3,
    trigger: (gs) => gs.notoriety >= 2,
    triggerChance: 0.4,
    captures: 'coin', // steals a silver penny from the table
    effect: { notoriety: 2 },
    effectText: 'The villagers have spread their suspicions far. Your reputation darkens.',
    resolveRequires: ['coin'],
    resolveText: 'A few coins quiet the rumours. For now.',
    flavor: 'They gather at the market, glancing toward your dwelling. Their fear smells of woodsmoke and iron.',
    icon: '⚠', aspects: ['threat'],
  },
  curious_priest: {
    id: 'curious_priest', name: 'A Curious Priest',
    category: 'mundane', timer: 4,
    trigger: (gs) => gs.notoriety >= 3,
    triggerChance: 0.35,
    captures: 'text', // confiscates a text
    effect: { notoriety: 3 },
    effectSpawn: 'inquisitors_letter',
    effectText: 'The priest has written to his bishop. An Inquisitor\'s letter is on its way.',
    resolveRequires: ['companion'],
    resolveText: 'Your companion distracts the priest with theological debate. He forgets his suspicions.',
    flavor: 'He smiles too much. His questions about your nocturnal habits are phrased as concern. They are not.',
    icon: '⚠', aspects: ['threat'],
  },
  inquisitors_letter: {
    id: 'inquisitors_letter', name: 'The Inquisitor\'s Letter',
    category: 'mundane', timer: 3,
    trigger: null, // only spawned by curious_priest
    triggerChance: 1,
    effect: { notoriety: 4 },
    effectText: 'The letter reaches the bishop. Formal proceedings have begun.',
    resolveRequires: ['text'],
    resolveText: 'You forge counter-evidence and plant it in the church records. The letter is discredited.',
    flavor: 'Sealed with wax and malice. Its contents would see you burned.',
    icon: '⚠', aspects: ['threat'],
  },
  barons_tax_collector: {
    id: 'barons_tax_collector', name: 'The Baron\'s Tax Collector',
    category: 'mundane', timer: 2,
    trigger: (gs) => gs.totalSeasons > 0 && gs.totalSeasons % 6 === 0,
    triggerChance: 0.7,
    captures: 'coin',
    effect: { notoriety: 1 },
    effectText: 'Your refusal to pay draws unwanted attention.',
    resolveRequires: ['coin'],
    resolveText: 'Silver changes hands. The collector bows and departs.',
    resolveConsumeCard: true,
    flavor: 'He arrives with a ledger and two armed men. The baron requires his due.',
    icon: '⚠', aspects: ['threat'],
  },
  angry_mob: {
    id: 'angry_mob', name: 'An Angry Mob',
    category: 'mundane', timer: 2,
    trigger: (gs) => gs.notoriety >= 6,
    triggerChance: 0.5,
    captures: 'lore', // mob destroys your research
    effect: { notoriety: 2 },
    effectRemoveRandom: true,
    effectText: 'The mob storms your sanctum. They destroy what they find.',
    resolveRequires: ['mentem'],
    resolveAlt: { requires: ['location'] },
    resolveAltText: 'You flee to a place of safety, abandoning your home for a season.',
    resolveText: 'Your words carry unnatural calm. The mob disperses, confused.',
    flavor: 'Torches and pitchforks. The oldest spell against those who are different.',
    icon: '⚠', aspects: ['threat'],
  },
  witch_trial: {
    id: 'witch_trial', name: 'The Witch Trial',
    category: 'mundane', timer: 3,
    trigger: (gs) => gs.notoriety >= 8,
    triggerChance: 0.5,
    captures: 'companion', // they arrest your companion
    effect: null, // loss condition
    effectLoss: true,
    effectText: 'They come at dawn with blessed chains. Your Parma shatters. The pyre awaits.',
    resolveRequires: ['companion', 'coin'],
    resolveAlt: { requires: ['vim'] },
    resolveAltText: 'You vanish in a flash of light. The crowd screams. You wake miles away.',
    resolveText: 'Your companion arranges a legal defense. Coin ensures the right witnesses testify.',
    flavor: 'The verdict was written before the trial began. Only magic can save you now.',
    icon: '⚠', aspects: ['threat'],
  },
  plague_comes: {
    id: 'plague_comes', name: 'Plague Comes',
    category: 'mundane', timer: 5,
    trigger: (gs) => gs.totalSeasons >= 10,
    triggerChance: 0.12,
    captures: 'vigor', // saps your strength
    effect: {},
    effectRemoveCard: 'vigor',
    effectText: 'The plague takes your strength. You survive, but barely.',
    resolveRequires: ['creo'],
    resolveText: 'Your magic purifies the sickness. The village whispers of miracles.',
    flavor: 'Black rats in the grain stores. A cough that will not stop. The air itself feels wrong.',
    icon: '⚠', aspects: ['threat'],
  },

  // ---- SUPERNATURAL THREATS ----
  warping_tremor: {
    id: 'warping_tremor', name: 'Warping Tremor',
    category: 'supernatural', timer: 3,
    trigger: (gs) => gs.warping >= 3,
    triggerChance: 0.35,
    captures: 'vis', // warping absorbs vis
    effect: { warping: 2 },
    effectText: 'Reality buckles around you. Another scar upon your pattern.',
    resolveRequires: ['vim'],
    resolveText: 'You stabilize the warping through meditation. The tremor passes.',
    flavor: 'The walls breathe. Your shadow moves independently. Time skips.',
    icon: '⚠', aspects: ['threat', 'magic'],
  },
  twilight_beckons: {
    id: 'twilight_beckons', name: 'Twilight Beckons',
    category: 'supernatural', timer: 2,
    trigger: (gs) => gs.warping >= 5,
    triggerChance: 0.4,
    captures: 'acumen', // twilight clouds your mind
    effect: { warping: 3 },
    effectText: 'The Twilight surges. You are pulled deeper than you intended.',
    resolveRequires: ['mystery'],
    resolveText: 'You navigate the Twilight with the Enigma\'s guidance. You emerge transformed but intact.',
    flavor: 'The light is calling. It is beautiful. It will consume you.',
    icon: '⚠', aspects: ['threat', 'magic'],
  },
  whispers_of_the_infernal: {
    id: 'whispers_of_the_infernal', name: 'Whispers of the Infernal',
    category: 'supernatural', timer: 4,
    trigger: (gs) => gs.corruption >= 2,
    triggerChance: 0.3,
    captures: 'fervor', // the whispers feed on your passion
    effect: { corruption: 2 },
    effectSpawn: 'demonic_pact',
    effectText: 'The whispers crystallize into an offer. A demonic presence materializes.',
    resolveRequires: ['text'],
    resolveAlt: { requires: ['companion'] },
    resolveAltText: 'Your companion leads you in confession. The darkness recedes.',
    resolveText: 'You find prayers of warding in the text. The whispers retreat.',
    flavor: 'A voice like honey and ashes. It knows your name. It knows your desires.',
    icon: '⚠', aspects: ['threat', 'infernal'],
  },
  demonic_pact: {
    id: 'demonic_pact', name: 'A Demonic Pact',
    category: 'supernatural', timer: 3,
    trigger: null, // only spawned by whispers
    triggerChance: 1,
    captures: 'lore', // demon takes your knowledge
    effect: { corruption: 3 },
    effectText: 'You hesitate too long. The pact writes itself in your blood.',
    resolveRequires: ['perdo'],
    resolveText: 'You unmake the pact with raw destructive power. The demon screams.',
    flavor: 'The contract is written on skin. Yours, or another\'s — the choice is yours. Refuse, and it takes what it wants.',
    icon: '⚠', aspects: ['threat', 'infernal'],
  },
  faerie_bargain: {
    id: 'faerie_bargain', name: 'A Faerie Bargain',
    category: 'supernatural', timer: 3,
    trigger: (gs) => gs.tableCards.some(c => c.aspects?.includes('faerie')),
    triggerChance: 0.2,
    captures: 'coin', // fae demand tribute
    effect: { hubris: 1 },
    effectText: 'The faeries take what they are owed. Your vision dims at the edges.',
    resolveRequires: ['lore'],
    resolveReward: 'vis_imaginem',
    resolveText: 'You negotiate better terms. The fae respect a cunning tongue.',
    flavor: 'They offer a golden apple. The price seems small. Prices with the fae always seem small.',
    icon: '⚠', aspects: ['threat', 'faerie'],
  },
  wild_hunt: {
    id: 'wild_hunt', name: 'The Wild Hunt',
    category: 'supernatural', timer: 2,
    trigger: (gs) => gs.season === 2 && gs.tableCards.some(c => c.aspects?.includes('faerie')),
    triggerChance: 0.3,
    captures: 'companion', // the hunt takes one of yours
    effect: {},
    effectRemoveRandom: true,
    effectText: 'The Hunt rides through your sanctum. When dawn comes, something is missing.',
    resolveRequires: ['animal'],
    resolveAlt: { requires: ['rego'] },
    resolveAltText: 'Your wards hold against the Hunt. They ride past, howling.',
    resolveText: 'You join the Hunt in spirit. They accept you as one of their own — for tonight.',
    flavor: 'Horns in the distance. Hooves on the wind. The Wild Hunt rides, and the world trembles.',
    icon: '⚠', aspects: ['threat', 'faerie'],
  },
  vis_drought: {
    id: 'vis_drought', name: 'Vis Drought',
    category: 'supernatural', timer: 4,
    trigger: (gs) => gs.totalSeasons >= 8,
    triggerChance: 0.12,
    captures: 'vis', // drought absorbs vis
    effect: {},
    effectRemoveCard: 'vis',
    effectText: 'The vis sources dry up. Your reserves dwindle.',
    resolveRequires: ['intellego'],
    resolveReward: 'vis_vim',
    resolveText: 'Your senses find a new vis source, hidden beneath the ruins.',
    flavor: 'The wells of magic run dry. The stones stop humming. Even the wind tastes empty.',
    icon: '⚠', aspects: ['threat', 'magic'],
  },
  rival_magus_challenge: {
    id: 'rival_magus_challenge', name: 'A Rival Magus',
    category: 'supernatural', timer: 3,
    trigger: (gs) => gs.totalSeasons >= 6 && Object.values(gs.arts).some(v => v >= 2),
    triggerChance: 0.2,
    captures: 'spell', // rival seizes your spell
    effect: { hubris: 2 },
    effectText: 'The rival declares victory by default. Your reputation suffers.',
    resolveRequires: ['lore'],
    resolveText: 'You best the rival in Certamen. They withdraw, humbled.',
    flavor: 'He arrives at your threshold in full regalia. "I challenge you, sodalis. Let us see whose Art is greater."',
    icon: '⚠', aspects: ['threat', 'magic'],
  },
  quaesitors_summons: {
    id: 'quaesitors_summons', name: 'The Quaesitor\'s Summons',
    category: 'supernatural', timer: 4,
    trigger: (gs) => gs.hubris >= 4,
    triggerChance: 0.3,
    captures: 'text', // they confiscate your texts
    effect: { hubris: 3 },
    effectText: 'The Quaesitor finds you guilty. Your standing in the Order is diminished.',
    resolveRequires: ['companion'],
    resolveAlt: { requires: ['text'] },
    resolveAltText: 'You cite obscure precedents from the Code. The Quaesitor is impressed.',
    resolveText: 'Your companion provides legal counsel. The charges are dismissed.',
    flavor: 'The letter bears the Quaesitor\'s seal. You are summoned to answer for your ambitions.',
    icon: '⚠', aspects: ['threat', 'magic'],
  },
};

const ThreatSystem = {
  activeThreats: [],
  maxActiveThreats: 3,
  threatCooldowns: {}, // prevent same threat from re-appearing immediately

  reset() {
    this.activeThreats = [];
    this.threatCooldowns = {};
  },

  // Called each season from the time verb completion
  onSeasonAdvance() {
    this.tickTimers();
    this.checkForNewThreats();
  },

  tickTimers() {
    const expired = [];
    for (const threat of this.activeThreats) {
      threat.remainingSeasons--;
      if (threat.remainingSeasons <= 0) {
        expired.push(threat);
      }
    }

    const results = { notifications: [], newCards: [], losses: [] };
    for (const threat of expired) {
      this.applyThreatEffect(threat, results);
      this.activeThreats = this.activeThreats.filter(t => t !== threat);
    }
    return results;
  },

  applyThreatEffect(threat, results) {
    const def = THREAT_DEFS[threat.defId];
    if (!def) return;

    // If a resolve was in progress, cancel it and return the slotted card
    if (threat.resolving) {
      TimerSystem.remove(`threat_resolve_${def.id}`);
      const slottedCard = GameState.verbCards[`threat_${def.id}`]?.[0];
      if (slottedCard) {
        GameState.addCard(slottedCard);
        results.notifications.push(`${slottedCard.name} was returned — too late to resolve.`);
      }
      delete GameState.verbCards[`threat_${def.id}`];
    }

    results.notifications.push(`⚠ ${def.name} — ${def.effectText}`);

    // Apply stat changes
    if (def.effect) {
      for (const [stat, delta] of Object.entries(def.effect)) {
        if (ALL_STATS.includes(stat)) {
          GameState.modifyStat(stat, delta);
        }
      }
    }

    // Remove a random card
    if (def.effectRemoveRandom) {
      const candidates = GameState.tableCards.filter(c => !c.permanent && c.category !== 'condition');
      if (candidates.length > 0) {
        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        GameState.removeCard(victim.instanceId);
        results.notifications.push(`Lost: ${victim.name}`);
      }
    }

    // Remove a specific card type (respect permanent flag)
    if (def.effectRemoveCard) {
      const target = GameState.tableCards.find(c =>
        !c.permanent && (c.id === def.effectRemoveCard || c.aspects?.includes(def.effectRemoveCard))
      );
      if (target) {
        GameState.removeCard(target.instanceId);
        results.notifications.push(`Lost: ${target.name}`);
      }
    }

    // Captured card is destroyed when threat expires unresolved
    if (threat.capturedCard) {
      results.notifications.push(`The ${threat.capturedCard.name} held by this threat is lost.`);
    }

    // Spawn a follow-up threat
    if (def.effectSpawn && THREAT_DEFS[def.effectSpawn]) {
      this.spawnThreat(def.effectSpawn);
      results.notifications.push(`A new danger emerges: ${THREAT_DEFS[def.effectSpawn].name}`);
    }

    // Loss condition
    if (def.effectLoss) {
      results.losses.push({
        type: 'threat_' + def.id,
        title: def.name,
        text: def.effectText
      });
    }
  },

  checkForNewThreats() {
    if (this.activeThreats.length >= this.maxActiveThreats) return;

    // Scale threat frequency with game progression
    const yearsPassed = GameState.totalSeasons / 4;
    const pressureMultiplier = yearsPassed < 0.5 ? 0.5 : yearsPassed < 1 ? 0.7 : yearsPassed < 2 ? 0.85 : 1.0;

    for (const [id, def] of Object.entries(THREAT_DEFS)) {
      if (this.activeThreats.length >= this.maxActiveThreats) break;
      if (this.activeThreats.some(t => t.defId === id)) continue; // already active
      if (this.threatCooldowns[id] > 0) { this.threatCooldowns[id]--; continue; }
      if (!def.trigger) continue; // only spawned by other threats

      if (def.trigger(GameState) && Math.random() < def.triggerChance * pressureMultiplier) {
        this.spawnThreat(id);
      }
    }
  },

  spawnThreat(defId) {
    const def = THREAT_DEFS[defId];
    if (!def) return;
    if (this.activeThreats.some(t => t.defId === defId)) return;

    // Capture a card from the table if the threat defines a capture aspect
    let capturedCard = null;
    if (def.captures) {
      const candidates = GameState.tableCards.filter(c =>
        !c.permanent && c.aspects?.includes(def.captures)
      );
      if (candidates.length > 0) {
        const victim = candidates[Math.floor(Math.random() * candidates.length)];
        GameState.removeCard(victim.instanceId);
        capturedCard = victim;
      }
    }

    this.activeThreats.push({
      defId: defId,
      remainingSeasons: def.timer,
      maxSeasons: def.timer,
      spawnedAt: GameState.totalSeasons,
      capturedCard: capturedCard,
    });
    this.threatCooldowns[defId] = def.timer + 2;
  },

  // Attempt to resolve a threat by dropping a card on its slot
  resolveThreat(defId, cards) {
    const def = THREAT_DEFS[defId];
    if (!def) return null;
    if (!cards || cards.length === 0) return null;

    const allAccepts = [...(def.resolveRequires || [])];
    if (def.resolveAlt?.requires) allAccepts.push(...def.resolveAlt.requires);

    const met = allAccepts.some(req => cards.some(c => CardFactory.hasAspect(c, req)));
    if (!met) return null;

    // Check primary resolution
    const primaryMet = def.resolveRequires?.every(req =>
      cards.some(c => CardFactory.hasAspect(c, req))
    );

    // Check alt resolution
    const altMet = def.resolveAlt?.requires?.every(req =>
      cards.some(c => CardFactory.hasAspect(c, req))
    );

    const threat = this.activeThreats.find(t => t.defId === defId);
    const capturedCard = threat?.capturedCard;

    // Clean up resolve timer
    TimerSystem.remove(`threat_resolve_${defId}`);

    this.activeThreats = this.activeThreats.filter(t => t.defId !== defId);
    this.threatCooldowns[defId] = def.timer + 2;

    // Return captured card to the table
    if (capturedCard) {
      GameState.addCard(capturedCard);
    }

    return {
      resolved: true,
      text: primaryMet ? def.resolveText : (altMet ? def.resolveAltText : def.resolveText),
      consumeCard: def.resolveConsumeCard || false,
      reward: def.resolveReward || null,
      returnedCard: capturedCard,
    };
  },

  // Save/load
  toJSON() {
    return {
      activeThreats: this.activeThreats,
      threatCooldowns: this.threatCooldowns,
    };
  },

  fromJSON(data) {
    if (!data) return;
    this.activeThreats = data.activeThreats || [];
    this.threatCooldowns = data.threatCooldowns || {};

    // Restart resolve timers for threats that were resolving when saved
    for (const threat of this.activeThreats) {
      if (threat.resolving) {
        const card = GameState.verbCards[`threat_${threat.defId}`]?.[0];
        if (card) {
          TimerSystem.create(`threat_resolve_${threat.defId}`, 10000, () => {
            Game.resolveThreatWithCard(threat.defId, card);
          });
        } else {
          threat.resolving = false;
        }
      }
    }
  },
};
