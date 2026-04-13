// ============================================================
// MYSTERIES.JS — Mystery cult progression and initiation
// ============================================================

const MysterySystem = {
  paths: {
    enigma: {
      name: 'The Enigma of Criamon',
      description: 'The path of Twilight mastery and temporal transcendence.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'vim', amount: 1 },
        { type: 'art_boost', art: 'mentem', amount: 1 },
        { type: 'stat_resist', stat: 'warping', amount: 2 },
        { type: 'win_condition', condition: 'ascension' }
      ],
      completionFlavor: 'You have unraveled the Enigma. Time is a garment you may now fold and unfold at will. The Twilight welcomes you not as a prisoner, but as a sovereign.'
    },
    heartbeast: {
      name: 'The Heartbeast of Bjornaer',
      description: 'The path of primal transformation and animal communion.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'animal', amount: 1 },
        { type: 'art_boost', art: 'corpus', amount: 1 },
        { type: 'card', cardId: 'spell_eyes_of_the_cat' },
        { type: 'card', cardId: 'spell_command_the_harnessed_beast' }
      ],
      completionFlavor: 'The beast and the magus are one. You run on four legs through the forests of the world, and no boundary can hold you.'
    },
    artifice: {
      name: 'The Verdant Artifice of Verditius',
      description: 'The path of magical craftsmanship and item enchantment.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'terram', amount: 1 },
        { type: 'art_boost', art: 'vim', amount: 1 },
        { type: 'card', cardId: 'enchanted_ring' },
        { type: 'card', cardId: 'wand_of_fire' }
      ],
      completionFlavor: 'Every object sings its potential to you. You are the Maker, and the world is your material. Even the stars are raw ore.'
    },
    arcadia: {
      name: 'The Path of Arcadia',
      description: 'The path of faerie magic and story-weaving.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'imaginem', amount: 1 },
        { type: 'art_boost', art: 'herbam', amount: 1 },
        { type: 'stat_resist', stat: 'corruption', amount: 2 },
        { type: 'card', cardId: 'spell_veil_of_invisibility' }
      ],
      completionFlavor: 'You have passed through the Arcadian Gate. Stories are your medium now. You can see the narrative threads of reality and pluck them like harp strings.'
    },
    necromancy: {
      name: 'Path of Necromancy',
      description: 'The dead have much to teach, if you dare ask.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'perdo', amount: 1 },
        { type: 'art_boost', art: 'corpus', amount: 1 },
        { type: 'stat_change', stat: STATS.CORRUPTION, amount: 1 },
        { type: 'card', cardId: 'companion_ghostly_scholar' }
      ],
      completionFlavor: 'Death is a door. You hold the key. The boundary between the living and the dead dissolves at your command.'
    },
    runes: {
      name: 'Path of the Runes',
      description: 'The Order of Odin remembers.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'vim', amount: 1 },
        { type: 'card', cardId: 'silver_penny' },
        { type: 'stat_change', stat: STATS.WARPING, amount: 1 },
        { type: 'card', cardId: 'item_ring_of_warding' }
      ],
      completionFlavor: 'The runes are carved into your soul. Ancient Scandinavian magic flows through channels Bonisagus never imagined. The Order of Odin lives again — in you.'
    },
    hymns: {
      name: 'Path of the Hyperborean Hymns',
      description: 'Songs that shook the pillars of heaven.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'imaginem', amount: 1 },
        { type: 'art_boost', art: 'vim', amount: 1 },
        { type: 'stat_change', stat: STATS.WARPING, amount: 2 },
        { type: 'win_condition', condition: 'hymn_primordial' }
      ],
      completionFlavor: 'You sing the song that began the world. Reality reshapes itself around your voice. You are no longer a magus — you are a force of creation.'
    },
    body: {
      name: 'Path of the Body',
      description: 'The body is the universe made manifest.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'corpus', amount: 1 },
        { type: 'art_boost', art: 'creo', amount: 1 },
        { type: 'stat_resist', stat: 'warping', amount: 1 },
        { type: 'card', cardId: 'item_longevity_elixir' }
      ],
      completionFlavor: 'Your body contains the world. All places are within you. Movement becomes unnecessary — you simply are wherever you choose to be.'
    },
    strife: {
      name: 'Path of Strife',
      description: 'Accept darkness so others need not.',
      steps: 4,
      rewards: [
        { type: 'art_boost', art: 'perdo', amount: 1 },
        { type: 'stat_change', stat: STATS.HUBRIS, amount: 2 },
        { type: 'card', cardId: 'spell_the_unmaking_word' },
        { type: 'card', cardId: 'item_necromancers_grimoire' }
      ],
      completionFlavor: 'You have consumed every sin, absorbed every transgression. The darkness within you is absolute — and absolutely controlled. You are the shield that bleeds.'
    },
  },

  getProgress(pathId) {
    return GameState.mysteryProgress[pathId] || 0;
  },

  isComplete(pathId) {
    const path = this.paths[pathId];
    return path && this.getProgress(pathId) >= path.steps;
  },

  getCompletedPaths() {
    return Object.keys(this.paths).filter(p => this.isComplete(p));
  },

  applyStepReward(pathId, step) {
    const path = this.paths[pathId];
    if (!path || step < 1 || step > path.rewards.length) return [];

    const reward = path.rewards[step - 1];
    const results = [];

    switch (reward.type) {
      case 'art_boost':
        const currentLevel = GameState.arts[reward.art] || 0;
        const newLevel = Math.min(currentLevel + reward.amount, 5);
        GameState.updateArt(reward.art, newLevel);
        results.push(`${ASPECTS[reward.art].name} knowledge deepened.`);
        break;
      case 'stat_resist':
        GameState.modifyStat(reward.stat, -reward.amount);
        results.push(`${reward.stat} resistance gained.`);
        break;
      case 'stat_change':
        GameState.modifyStat(reward.stat, reward.amount);
        results.push(`The path exacts its toll.`);
        break;
      case 'card':
        if (CardDB[reward.cardId]) {
          GameState.addCard(CardFactory.create(reward.cardId));
          results.push(`Received: ${CardDB[reward.cardId].name}`);
        }
        break;
      case 'win_condition':
        results.push('A path to victory has opened.');
        break;
    }

    return results;
  },

  checkWinConditions() {
    // Ascension: Enigma complete + Warping >= 8 + Vim >= 5
    if (this.isComplete('enigma') && GameState.warping >= 8 && GameState.arts.vim >= 5) {
      return {
        type: 'ascension',
        title: 'Ascension Through Twilight',
        text: 'You step willingly into the Final Twilight, but you do not dissolve. The Enigma has taught you to walk between the edges of time. You ascend — not consumed, but transformed. The world remembers you as a legend whispered in the halls of the Order. You are now something more than mortal, more than magus. You are eternal.'
      };
    }

    // Archmagus: 2 Techniques >= 4 and 2 Forms >= 4
    const highTechs = TECHNIQUES.filter(t => (GameState.arts[t] || 0) >= 4).length;
    const highForms = FORMS.filter(f => (GameState.arts[f] || 0) >= 4).length;
    if (highTechs >= 2 && highForms >= 2) {
      return {
        type: 'archmagus',
        title: 'Archmagus',
        text: 'Your mastery of the Hermetic Arts is undeniable. The Order convenes a special Tribunal and, after witnessing your power, names you Archmagus — one of the great wizards of the age. Your name will be spoken with reverence for centuries. You have proved that knowledge is the truest form of power.'
      };
    }

    // Mystery Hierophant: Complete 3+ mystery paths
    if (this.getCompletedPaths().length >= 3) {
      return {
        type: 'hierophant',
        title: 'Hierophant of the Mysteries',
        text: 'You have walked not one but three paths of mystery to their ends. You are a Hierophant — a keeper of multiple secrets, a bridge between traditions. Mystagogues from across the Order seek your counsel. You hold keys that were never meant for one person. The Mysteries themselves reshape around your understanding.'
      };
    }

    // Covenant Primus: Aegis + 3 Companions + 2 Locations + 3 Texts
    const hasAegis = GameState.tableCards.some(c => c.id === 'spell_aegis_of_the_hearth');
    const companionCount = GameState.tableCards.filter(c => c.category === 'companion').length;
    const locationCount = GameState.tableCards.filter(c => c.category === 'location').length;
    const textCount = GameState.tableCards.filter(c => c.category === 'text').length;
    if (hasAegis && companionCount >= 3 && locationCount >= 2 && textCount >= 3) {
      return {
        type: 'covenant_primus',
        title: 'Covenant Primus',
        text: 'The covenant stands. Companions share your table. Your library grows. The Aegis wards against all threats. Others will come — apprentices, fellow magi, seekers of knowledge. A tradition begins. You have built something that will outlast you, and that is the truest magic of all.'
      };
    }

    // The Great Working: 5 different items + specific named items
    const itemCards = GameState.tableCards.filter(c => c.aspects?.includes('item'));
    const uniqueItems = new Set(itemCards.map(c => c.id));
    if (uniqueItems.size >= 5 && this.isComplete('artifice')) {
      return {
        type: 'great_working',
        title: 'The Great Working',
        text: 'Your laboratory hums with purpose. Every object bends to your will. You have become Verditius reborn — the greatest artificer the Order has seen in centuries. Your enchanted devices reshape the world. Kings beg for your creations. The Maker\'s path is complete.'
      };
    }

    // Hymn Primordial: complete hymns path + warping >= 5
    if (this.isComplete('hymns') && GameState.warping >= 5) {
      return {
        type: 'hymn_primordial',
        title: 'The Hymn Primordial',
        text: 'You sing the song that began the world. Mountains rise and fall at your command. Seas part. Stars rearrange themselves. You are no longer a magus — you are a force of creation, a voice from before the first dawn. Reality itself is your instrument, and you play it with terrible beauty.'
      };
    }

    // Peacemaker: Resolve 8+ threats via recipes + 3 companions + notoriety <= 2
    const threatsResolved = (GameState.flags.threatsResolved || 0);
    if (threatsResolved >= 8 && companionCount >= 3 && GameState.notoriety <= 2) {
      return {
        type: 'peacemaker',
        title: 'Peacemaker of the Order',
        text: 'Where others destroy, you negotiate. Where others flee, you stand. The Order recognizes a leader. You have resolved every crisis through wisdom, diplomacy, and the strength of your alliances. Your name is spoken not with fear, but with gratitude. Peace is the hardest magic of all.'
      };
    }

    // Forbidden Synthesis: hold cards from all 4 realms
    const hasMagic = GameState.tableCards.some(c => c.aspects?.includes('magic') && !c.aspects?.includes('condition'));
    const hasDivine = GameState.tableCards.some(c => c.aspects?.includes('divine'));
    const hasFaerie = GameState.tableCards.some(c => c.aspects?.includes('faerie'));
    const hasInfernal = GameState.tableCards.some(c => c.aspects?.includes('infernal'));
    if (hasMagic && hasDivine && hasFaerie && hasInfernal && this.getCompletedPaths().length >= 1) {
      return {
        type: 'forbidden_synthesis',
        title: 'The Forbidden Synthesis',
        text: 'You have touched all four pillars of creation. The boundaries blur. You stand at the crossroads of everything — Magic, Divine, Faerie, and Infernal — and you hold them all in balance. No magus has ever achieved this. The world itself is uncertain what to make of you. You are something new.'
      };
    }

    return null;
  },

  checkLossConditions() {
    // Consumed by Twilight
    if (GameState.warping >= 10 && !this.isComplete('enigma')) {
      return {
        type: 'twilight_consumed',
        title: 'Consumed by Twilight',
        text: 'The Final Twilight takes you. Without mastery of the Enigma, you cannot navigate the infinite light. Your body dissolves into crackling motes of power. Your companions find only a scorch mark and the lingering scent of ozone. The Order records your passing as "lost to Twilight" — a fate both pitied and feared.'
      };
    }

    // The Inquisition
    if (GameState.notoriety >= 10) {
      return {
        type: 'inquisition',
        title: 'The Inquisition',
        text: 'They come at dawn with torches and iron chains. The Inquisition has gathered enough testimony. Your Parma Magica shatters under blessed iron. As the flames rise, you think: perhaps I should have been more careful. The crowd prays for your soul. The Order does not intervene — it was, after all, your own fault.'
      };
    }

    // Corrupted
    if (GameState.corruption >= 10) {
      return {
        type: 'damnation',
        title: 'Corrupted',
        text: 'The darkness you have glimpsed has seeped into your bones. You can no longer distinguish nightmare from waking. The Infernal has claimed you — not through dramatic temptation, but through the slow erosion of hope. You wander the roads of Mythic Europe, muttering in languages no one recognizes, until the cold claims you.'
      };
    }

    // Consumed by Fascination
    if (GameState.hubris >= 10) {
      return {
        type: 'obsession',
        title: 'Consumed by Hubris',
        text: 'The mysteries have consumed you utterly. You sit in your laboratory, staring at patterns only you can see, forgetting to eat, forgetting to sleep. Your companions try to reach you but you are elsewhere — lost in the infinite recursion of magical theory. They find your body weeks later, your face frozen in an expression of terrible wonder.'
      };
    }

    return null;
  }
};
