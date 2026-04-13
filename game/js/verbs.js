// ============================================================
// VERBS.JS — Verb station definitions and slot rules
// ============================================================

const VerbDefinitions = {
  study: {
    id: 'study',
    name: 'Study',
    description: 'Read texts, study vis, or deepen your knowledge of the Arts.',
    icon: '',
    slots: [
      { label: 'Text, Vis, or Art', accepts: ['text', 'vis', 'lore', 'acumen', 'fervor'] },
      { label: 'Matching Art', accepts: ['lore'], optional: true }
    ],
    defaultDuration: 15000,
  },
  work: {
    id: 'work',
    name: 'Work',
    description: 'Combine Arts to craft spells, or use spells and vis to enchant items.',
    icon: '',
    slots: [
      { label: 'Art or Spell', accepts: ['lore', 'spell', 'item'] },
      { label: 'Art or Vis', accepts: ['lore', 'vis'] }
    ],
    defaultDuration: 25000,
  },
  dream: {
    id: 'dream',
    name: 'Dream',
    description: 'Enter the Twilight, pursue mysteries, or rest to recover.',
    icon: '',
    slots: [
      { label: 'Vim, Mystery, or Vigor', accepts: ['vim', 'mystery', 'vigor'] }
    ],
    defaultDuration: 20000,
  },
  explore: {
    id: 'explore',
    name: 'Explore',
    description: 'Seek places of power, discover vis sources, venture into the unknown.',
    icon: '',
    slots: [
      { label: 'Location, Intellego, or Fervor', accepts: ['location', 'intellego', 'fervor'] }
    ],
    defaultDuration: 18000,
  },
  speak: {
    id: 'speak',
    name: 'Speak',
    description: 'Converse with companions, trade silver, or address threats.',
    icon: '',
    slots: [
      { label: 'Companion, Threat, or Coin', accepts: ['companion', 'threat', 'coin'] }
    ],
    defaultDuration: 12000,
  },
  time: {
    id: 'time',
    name: 'Time Passes',
    description: 'The seasons turn. The world does not wait.',
    icon: '',
    slots: [],
    defaultDuration: SEASON_DURATION,
    autoStart: true,
    autoRepeat: true
  }
};
