// ============================================================
// CARDS.JS — Card definitions, factory, aspect utilities
// ============================================================

const CardFactory = {
  create(templateId, overrides = {}) {
    const template = CardDB[templateId];
    if (!template) {
      console.warn(`Unknown card template: ${templateId}`);
      return null;
    }
    return { ...template, id: templateId, ...overrides };
  },

  createFromDef(def) {
    return { ...def };
  },

  hasAspect(card, aspect) {
    return card.aspects && card.aspects.includes(aspect);
  },

  getAspectLevel(card, aspect) {
    if (!card.aspects) return 0;
    if (!card.aspects.includes(aspect)) return 0;
    return card.level || 1;
  },

  matchesSlot(card, slotRequirement) {
    if (!slotRequirement) return true;
    if (slotRequirement === 'any') return true;
    // Slot requirement can be an aspect name or array of acceptable aspects
    if (Array.isArray(slotRequirement)) {
      return slotRequirement.some(req => this.hasAspect(card, req));
    }
    return this.hasAspect(card, slotRequirement);
  }
};

// Card database - populated by content.js
const CardDB = {};

// Aspect definitions for display
const ASPECTS = {
  // Techniques
  creo: { name: 'Creo', color: '#4a8a4a', icon: '✦', tip: 'The Art of Creation — brings forth what was not, heals, restores to perfection.' },
  intellego: { name: 'Intellego', color: '#3a6a9a', icon: '◈', tip: 'The Art of Perception — reveals hidden truths, pierces illusion, sees the unseen.' },
  muto: { name: 'Muto', color: '#7a4a8a', icon: '↻', tip: 'The Art of Transformation — grants properties a thing cannot naturally have.' },
  perdo: { name: 'Perdo', color: '#8a2a2a', icon: '✕', tip: 'The Art of Destruction — unmakes, decays, and destroys.' },
  rego: { name: 'Rego', color: '#8a6a2a', icon: '⊕', tip: 'The Art of Control — commands and shapes existing things to your will.' },
  // Forms
  animal: { name: 'Animal', color: '#5a6a3a', icon: '🐺', tip: 'The Form of Beasts — governs all animals and their nature.' },
  aquam: { name: 'Aquam', color: '#2a5a7a', icon: '💧', tip: 'The Form of Water — governs liquids, rivers, rain, and the sea.' },
  auram: { name: 'Auram', color: '#5a7a8a', icon: '🌬', tip: 'The Form of Air — governs wind, weather, and gaseous things.' },
  corpus: { name: 'Corpus', color: '#6a4a3a', icon: '♱', tip: 'The Form of the Body — governs the human form, living and dead.' },
  herbam: { name: 'Herbam', color: '#3a6a2a', icon: '🌿', tip: 'The Form of Plants — governs all growing things, wood, and plant matter.' },
  ignem: { name: 'Ignem', color: '#b44a22', icon: '🔥', tip: 'The Form of Fire — governs flame, heat, and light.' },
  imaginem: { name: 'Imaginem', color: '#7a5a6a', icon: '👁', tip: 'The Form of Images — governs sensory appearances and illusions.' },
  mentem: { name: 'Mentem', color: '#5a4a7a', icon: '🧠', tip: 'The Form of the Mind — governs thoughts, emotions, and spirits.' },
  terram: { name: 'Terram', color: '#6a5a3a', icon: '⛰', tip: 'The Form of Earth — governs stone, metal, and solid matter.' },
  vim: { name: 'Vim', color: '#4a5a8a', icon: '⚡', tip: 'The Form of Magic — governs raw magical power and supernatural forces.' },
  // Realms
  magic: { name: 'Magic', color: '#4a5a8a', icon: '✧', tip: 'The Magic Realm — source of Hermetic power, indifferent to mortal concerns.' },
  divine: { name: 'Divine', color: '#c4a430', icon: '✝', tip: 'The Divine Realm — the power of God, which transcends all other forces.' },
  faerie: { name: 'Faerie', color: '#3a7a5a', icon: '❧', tip: 'The Faerie Realm — a world of stories, bargains, and dangerous beauty.' },
  infernal: { name: 'Infernal', color: '#6a1a1a', icon: '⛧', tip: 'The Infernal Realm — demonic corruption that tempts and damns.' },
  // Qualities
  lore: { name: 'Lore', color: '#5a3a28', icon: '📜', tip: 'Arcane knowledge — can be combined with matching lore in Study, or used in Work to craft spells.' },
  vis: { name: 'Vis', color: '#5a2a6a', icon: '◆', tip: 'Raw magical essence — study it to learn its Form, or use in Work to enchant items.' },
  coin: { name: 'Coin', color: '#8a6d1f', icon: '●', tip: 'Silver currency — use in Speak to bribe and reduce Notoriety.' },
  vigor: { name: 'Vigor', color: '#4a8a4a', icon: '♥', tip: 'Physical vitality — use in Dream to rest and reduce Corruption.' },
  acumen: { name: 'Acumen', color: '#3a6a9a', icon: '⚙', tip: 'Mental sharpness — use in Study to clear your mind and reduce Hubris.' },
  fervor: { name: 'Fervor', color: '#c23a22', icon: '♦', tip: 'Passionate drive — use in Study or Explore for bold but risky results.' },
  companion: { name: 'Companion', color: '#2a5a2a', icon: '👤', tip: 'An ally — use in Speak to converse, learn, and trade.' },
  threat: { name: 'Threat', color: '#c23a22', icon: '⚠', tip: 'A danger that must be addressed — use in Speak to attempt resolution.' },
  mystery: { name: 'Mystery', color: '#5a2a6a', icon: '❋', tip: 'Hidden knowledge — use in Dream to pursue deeper initiation.' },
  text: { name: 'Text', color: '#5a3a28', icon: '📖', tip: 'A written work — use in Study to learn the Art within.' },
  location: { name: 'Location', color: '#2a5a2a', icon: '⌂', tip: 'A place of power — use in Explore to search for vis, texts, and secrets.' },
  season: { name: 'Season', color: '#8a6d1f', icon: '☀', tip: 'A measure of time — three months of labor.' },
  spell: { name: 'Spell', color: '#1a3a6a', icon: '★', tip: 'A formulaic spell — use in Work to cast, or combine with Vis to enchant an item.' },
  item: { name: 'Item', color: '#8a6d1f', icon: '⚒', tip: 'An enchanted object — a permanent magical device.' },
  condition: { name: 'Condition', color: '#c23a22', icon: '◉', tip: 'A state affecting your character — may be permanent or temporary.' }
};

const TECHNIQUES = ['creo', 'intellego', 'muto', 'perdo', 'rego'];
const FORMS = ['animal', 'aquam', 'auram', 'corpus', 'herbam', 'ignem', 'imaginem', 'mentem', 'terram', 'vim'];
