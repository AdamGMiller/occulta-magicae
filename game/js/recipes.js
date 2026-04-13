// ============================================================
// RECIPES.JS — Recipe matching engine
// ============================================================

const RecipeEngine = {
  recipes: [],

  register(recipe) {
    this.recipes.push(recipe);
  },

  /**
   * Find matching recipe for a verb + cards combination
   * @param {string} verbId - The verb station id
   * @param {object[]} cards - Array of card instances in slots
   * @returns {object|null} - Matching recipe or null
   */
  findMatch(verbId, cards) {
    if (!cards || cards.length === 0) return null;

    const candidates = this.recipes.filter(r => r.verb === verbId);

    // Score each candidate and return best match
    let bestMatch = null;
    let bestScore = -1;

    for (const recipe of candidates) {
      const score = this.scoreMatch(recipe, cards);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = recipe;
      }
    }

    return bestScore > 0 ? bestMatch : null;
  },

  scoreMatch(recipe, cards) {
    // Check required aspects on primary card
    const primary = cards[0];
    if (!primary) return 0;

    if (recipe.primaryRequires) {
      const allMet = recipe.primaryRequires.every(req => {
        if (typeof req === 'string') {
          return CardFactory.hasAspect(primary, req);
        }
        if (req.aspect && req.minLevel) {
          return CardFactory.hasAspect(primary, req.aspect) && (primary.level || 0) >= req.minLevel;
        }
        return false;
      });
      if (!allMet) return 0;
    }

    // Check secondary card requirements
    if (recipe.secondaryRequires && cards.length < 2) return 0;
    if (recipe.secondaryRequires) {
      const secondary = cards[1];
      const allMet = recipe.secondaryRequires.every(req => {
        if (typeof req === 'string') {
          return CardFactory.hasAspect(secondary, req);
        }
        if (req.aspect && req.minLevel) {
          return CardFactory.hasAspect(secondary, req.aspect) && (secondary.level || 0) >= req.minLevel;
        }
        return false;
      });
      if (!allMet) return 0;
    }

    // Check extra conditions
    if (recipe.condition && !recipe.condition(cards, GameState)) return 0;

    // Calculate specificity score (more specific = higher priority)
    let score = 1;
    if (recipe.primaryRequires) score += recipe.primaryRequires.length * 2;
    if (recipe.secondaryRequires) score += recipe.secondaryRequires.length * 2;
    if (recipe.condition) score += 1;
    return score;
  },

  /**
   * Execute a recipe and return results
   * @param {object} recipe
   * @param {object[]} cards
   * @returns {{ results: object[], notifications: string[], stateChanges: object }}
   */
  execute(recipe, cards) {
    const results = {
      newCards: [],
      notifications: [],
      stateChanges: {},
      consumeCards: recipe.consumeCards !== false, // default true
      consumeIndices: recipe.consumeIndices || null // specific indices to consume
    };

    if (recipe.execute) {
      recipe.execute(cards, results, GameState);
    }

    // Apply state changes
    if (results.stateChanges.warping !== undefined) GameState.modifyStat(STATS.WARPING, results.stateChanges.warping);
    if (results.stateChanges.notoriety !== undefined) GameState.modifyStat(STATS.NOTORIETY, results.stateChanges.notoriety);
    if (results.stateChanges.corruption !== undefined) GameState.modifyStat(STATS.CORRUPTION, results.stateChanges.corruption);
    if (results.stateChanges.hubris !== undefined) GameState.modifyStat(STATS.HUBRIS, results.stateChanges.hubris);

    // Track discovered recipe
    GameState.discoveredRecipes.add(recipe.id);

    return results;
  }
};

// ================================================================
//  RECIPE DEFINITIONS
// ================================================================

(function defineRecipes() {

  // ---- STUDY: Text → Art Fragment ----
  RecipeEngine.register({
    id: 'study_text_to_art',
    verb: 'study',
    primaryRequires: ['text'],
    duration: 15000,
    label: 'Studying...',
    startText: 'You open the pages and begin to read. The Latin is dense, the diagrams stranger.',
    execute(cards, results) {
      const text = cards[0];
      const helper = cards[1]; // optional matching art card
      const artAspect = text.aspects.find(a => TECHNIQUES.includes(a) || FORMS.includes(a));
      const textLevel = text.level || 1;

      // Advanced texts (level 2+, e.g. Summae) require existing knowledge to fully benefit
      if (artAspect && textLevel >= 2) {
        const currentLevel = GameState.arts[artAspect] || 0;
        if (currentLevel < 1) {
          results.consumeCards = false;
          results.notifications.push(`This text is too advanced. You need basic knowledge of ${ASPECTS[artAspect].name} before you can comprehend it.`);
          return;
        }
      }

      // If a matching art card was provided, give a bonus level
      let bonus = 0;
      if (helper && artAspect) {
        const helperArt = helper.aspects.find(a => TECHNIQUES.includes(a) || FORMS.includes(a));
        if (helperArt === artAspect) {
          bonus = 1;
          results.notifications.push('Your existing knowledge amplifies the text\'s teachings!');
        } else if (helperArt) {
          results.notifications.push('This art does not match the text\'s subject. It provides no insight.');
        }
      }

      if (artAspect) {
        const currentLevel = GameState.arts[artAspect] || 0;
        const newLevel = Math.min(currentLevel + 1 + bonus, 5);
        const cardId = `${artAspect}_${newLevel}`;
        if (CardDB[cardId]) {
          results.newCards.push(CardFactory.create(cardId));
          GameState.updateArt(artAspect, newLevel);
          if (bonus > 0) {
            results.notifications.push(`Your combined study yields deep understanding of ${ASPECTS[artAspect].name} (level ${newLevel})!`);
          } else {
            results.notifications.push(`You have gained understanding of ${ASPECTS[artAspect].name}.`);
          }
        }
      }
      // If text has 'mystery' aspect, give mystery clue
      if (CardFactory.hasAspect(text, 'mystery')) {
        results.notifications.push('The coded passages hint at deeper secrets...');
        results.stateChanges.hubris = 1;
      }
      // Studying the companion letter triggers meeting a magus
      if (CardFactory.hasAspect(text, 'companion') && !GameState.flags.metMagus) {
        results.newCards.push(CardFactory.create('wandering_magus'));
        GameState.flags.metMagus = true;
        results.notifications.push('A figure emerges from the shadows. "So. You are the one." You have met a Magus of the Order.');
      }

      // Mystery triggers from studying certain Art texts at level 2+
      if (artAspect) {
        const newLvl = GameState.arts[artAspect] || 0;
        if (artAspect === 'animal' && newLvl >= 2 && GameState.mysteryProgress.heartbeast === 0) {
          results.newCards.push(CardFactory.create('mystery_heartbeast_1'));
          GameState.mysteryProgress.heartbeast = 1;
          results.notifications.push('Your study of Animal stirs something primal and ancient within you...');
        }
        if (artAspect === 'terram' && newLvl >= 2 && GameState.mysteryProgress.artifice === 0) {
          results.newCards.push(CardFactory.create('mystery_artifice_1'));
          GameState.mysteryProgress.artifice = 1;
          results.notifications.push('Your hands ache with the desire to shape and enchant...');
        }
      }
    }
  });

  // ---- STUDY: Vis → Art Fragment ----
  RecipeEngine.register({
    id: 'study_vis_to_art',
    verb: 'study',
    primaryRequires: ['vis'],
    duration: 12000,
    label: 'Studying vis...',
    startText: 'You hold the vis and let its essence wash through you. The sensation is intoxicating.',
    execute(cards, results) {
      const vis = cards[0];
      const artAspect = vis.aspects.find(a => FORMS.includes(a));
      if (artAspect) {
        const currentLevel = GameState.arts[artAspect] || 0;
        const newLevel = Math.min(currentLevel + 1, 5);
        const cardId = `${artAspect}_${newLevel}`;
        if (CardDB[cardId]) {
          results.newCards.push(CardFactory.create(cardId));
          GameState.updateArt(artAspect, newLevel);
          results.notifications.push(`The vis of ${ASPECTS[artAspect].name} yields its secrets.`);
        }
      }
      if (Math.random() > 0.7) { results.stateChanges.warping = 1; results.notifications.push('The vis leaves a faint tremor in your bones.'); }
    }
  });

  // ---- STUDY: Two same-art fragments → Upgraded fragment ----
  RecipeEngine.register({
    id: 'study_combine_arts',
    verb: 'study',
    primaryRequires: ['lore'],
    secondaryRequires: ['lore'],
    duration: 20000,
    label: 'Deepening understanding...',
    startText: 'You compare your fragmentary insights, seeking the deeper pattern beneath.',
    condition(cards) {
      if (cards.length < 2) return false;
      const arts = [...TECHNIQUES, ...FORMS];
      const a1 = cards[0].aspects.find(a => arts.includes(a));
      const a2 = cards[1].aspects.find(a => arts.includes(a));
      return a1 && a2 && a1 === a2 && (cards[0].level || 1) === (cards[1].level || 1);
    },
    execute(cards, results) {
      const arts = [...TECHNIQUES, ...FORMS];
      const artAspect = cards[0].aspects.find(a => arts.includes(a));
      const currentLevel = cards[0].level || 1;
      const newLevel = Math.min(currentLevel + 1, 5);
      const cardId = `${artAspect}_${newLevel}`;
      if (CardDB[cardId] && newLevel <= 5) {
        results.newCards.push(CardFactory.create(cardId));
        GameState.updateArt(artAspect, newLevel);
        results.notifications.push(`Your understanding of ${ASPECTS[artAspect].name} deepens to level ${newLevel}.`);
        if (newLevel >= 3) {
          results.stateChanges.hubris = 1;
          results.notifications.push('The deeper you go, the harder it is to look away.');
        }
      } else {
        // Return one card if can't upgrade
        results.newCards.push(CardFactory.create(`${artAspect}_${currentLevel}`));
        results.notifications.push('You have reached the limit of what these fragments can teach.');
      }
    }
  });

  // ---- STUDY: Reason card → clears Fascination ----
  RecipeEngine.register({
    id: 'study_reason_clear_fascination',
    verb: 'study',
    primaryRequires: ['acumen'],
    duration: 10000,
    label: 'Applying reason...',
    startText: 'You force yourself to think clearly. The allure of mystery can wait.',
    execute(cards, results) {
      results.consumeCards = false;
      if (GameState.hubris > 0) {
        results.stateChanges.hubris = -1;
        results.notifications.push('Cold logic tempers the fascination. For now.');
      } else {
        results.notifications.push('Your mind is already clear.');
      }
    }
  });

  // ---- WORK: Technique + Form → Spell ----
  RecipeEngine.register({
    id: 'work_invent_spell',
    verb: 'work',
    primaryRequires: ['lore'],
    secondaryRequires: ['lore'],
    duration: 25000,
    label: 'Inventing a spell...',
    startText: 'You retreat to your workspace. Chalk circles, muttered Latin, the smell of ozone.',
    condition(cards) {
      if (cards.length < 2) return false;
      // Need one card with a Technique and one with a Form (not two of the same type)
      const c0techs = cards[0].aspects.filter(a => TECHNIQUES.includes(a));
      const c0forms = cards[0].aspects.filter(a => FORMS.includes(a));
      const c1techs = cards[1].aspects.filter(a => TECHNIQUES.includes(a));
      const c1forms = cards[1].aspects.filter(a => FORMS.includes(a));
      // Valid: (tech in card0 + form in card1) or (form in card0 + tech in card1)
      return (c0techs.length > 0 && c1forms.length > 0) || (c0forms.length > 0 && c1techs.length > 0);
    },
    execute(cards, results) {
      const techCard = cards.find(c => c.aspects.some(a => TECHNIQUES.includes(a)));
      const formCard = cards.find(c => c.aspects.some(a => FORMS.includes(a)));
      const tech = techCard.aspects.find(a => TECHNIQUES.includes(a));
      const form = formCard.aspects.find(a => FORMS.includes(a));
      const level = Math.min((techCard.level || 1), (formCard.level || 1));

      // Find a matching predefined spell
      const spellKey = `${tech}_${form}`;
      const matchingSpells = Object.entries(CardDB).filter(([id, c]) =>
        c.category === 'spell' && c.aspects.includes(tech) && c.aspects.includes(form)
      );

      // Check if player already has this spell (avoid duplicates)
      const ownedSpellIds = GameState.tableCards.filter(c => c.category === 'spell').map(c => c.id);

      if (matchingSpells.length > 0) {
        // Find a spell the player doesn't already own, preferring level match
        const unowned = matchingSpells.filter(([id]) => !ownedSpellIds.includes(id));
        const pick = unowned.length > 0 ? unowned[0] : matchingSpells[0];
        results.newCards.push(CardFactory.create(pick[0]));
        results.notifications.push(`You have invented: ${pick[1].name}!`);
      } else {
        // Generate a generic spell with unique name based on level
        const levelName = ['Minor', 'Lesser', 'Standard', 'Greater', 'Grand'][Math.min(level - 1, 4)];
        const spellName = `${levelName} ${ASPECTS[tech].name} ${ASPECTS[form].name}`;
        const genId = `spell_gen_${spellKey}_${level}`;

        // Only create if player doesn't already have this exact generated spell
        if (!ownedSpellIds.includes(genId)) {
          results.newCards.push({
            id: genId,
            name: spellName,
            category: 'spell',
            icon: '★',
            aspects: ['spell', tech, form],
            level: level,
            flavor: `A ${ASPECTS[tech].name} working upon ${ASPECTS[form].name}. ${level >= 3 ? 'Potent and dangerous.' : 'Rough but functional.'}`
          });
          results.notifications.push(`You have invented: ${spellName}!`);
        } else {
          results.notifications.push('You refine your existing knowledge, but create nothing new.');
        }
      }

      if (!GameState.flags.firstSpellCast) {
        GameState.flags.firstSpellCast = true;
        results.stateChanges.notoriety = 1;
        results.notifications.push('The act of creation has not gone unnoticed.');
      }
      if (Math.random() > 0.6) results.stateChanges.warping = 1;

      // Return the art cards (don't consume knowledge)
      results.consumeCards = false;
    }
  });

  // ---- WORK: Spell + Vis → Enchanted Item ----
  RecipeEngine.register({
    id: 'work_enchant_item',
    verb: 'work',
    primaryRequires: ['spell'],
    secondaryRequires: ['vis'],
    duration: 30000,
    label: 'Enchanting...',
    startText: 'You pour vis into the prepared vessel. The enchantment takes shape.',
    execute(cards, results) {
      const spell = cards[0];
      const tech = spell.aspects.find(a => TECHNIQUES.includes(a));
      const form = spell.aspects.find(a => FORMS.includes(a));

      results.newCards.push({
        id: 'enchanted_item_' + Date.now(),
        name: `Enchanted ${ASPECTS[form] ? ASPECTS[form].name : 'Arcane'} Device`,
        category: 'resource',
        icon: '⚒',
        aspects: ['item', tech, form].filter(Boolean),
        level: (spell.level || 1) + 1,
        flavor: `An item humming with bound ${ASPECTS[form] ? ASPECTS[form].name : 'magical'} power. It responds to your will alone.`
      });

      results.notifications.push('The enchantment takes hold. The item awakens.');
      results.stateChanges.warping = 1;
      // Only consume the vis, return the spell
      results.consumeCards = false;
      if (cards[1]) GameState.removeCard(cards[1].instanceId);
    }
  });

  // ---- DREAM: Vim lore → Twilight Vision ----
  RecipeEngine.register({
    id: 'dream_twilight_vision',
    verb: 'dream',
    primaryRequires: ['vim'],
    duration: 20000,
    label: 'Entering the Twilight...',
    startText: 'You close your eyes and reach for the boundary. The world dissolves into light.',
    execute(cards, results) {
      if (!GameState.flags.enteredTwilight) {
        GameState.flags.enteredTwilight = true;
      }

      const roll = Math.random();
      if (roll > 0.3) {
        // Good twilight — advance enigma, gain insight
        results.newCards.push(CardFactory.create('twilight_scar_knowledge'));
        results.notifications.push('The Twilight yields knowledge. You return marked, but wiser.');
        const step = GameState.mysteryProgress.enigma;
        if (step < 4) {
          const mysteryCard = `mystery_enigma_${step + 1}`;
          if (CardDB[mysteryCard]) {
            results.newCards.push(CardFactory.create(mysteryCard));
            GameState.mysteryProgress.enigma = step + 1;
            results.notifications.push('In the Twilight, you glimpse the Enigma...');
          }
        }
      results.stateChanges.hubris = 1;
      } else {
        // Bad twilight — warping only (corruption is for infernal, not twilight)
        results.newCards.push(CardFactory.create('twilight_scar_minor'));
        if (Math.random() > 0.5) results.stateChanges.warping = 1;
        results.notifications.push('The Twilight resists comprehension. You return shaken, scarred.');
      }
    }
  });

  // ---- DREAM: Mystery card → Advance mystery ----
  RecipeEngine.register({
    id: 'dream_mystery_advance',
    verb: 'dream',
    primaryRequires: ['mystery'],
    duration: 25000,
    label: 'Pursuing the mystery...',
    startText: 'You meditate on the mystery. Symbols dance behind your eyelids.',
    // Higher priority: condition ensures this beats dream_twilight_vision for mystery cards
    condition(cards) { return cards[0]?.category === 'mystery'; },
    execute(cards, results) {
      const card = cards[0];
      const path = card.mysteryPath;
      const step = card.mysteryStep;

      if (path && step) {
        const nextStep = step + 1;
        const nextCardId = `mystery_${path}_${nextStep}`;
        if (CardDB[nextCardId] && GameState.mysteryProgress[path] < nextStep) {
          results.newCards.push(CardFactory.create(nextCardId));
          GameState.mysteryProgress[path] = nextStep;
          results.notifications.push(`The ${path} mystery deepens...`);
        } else if (step >= 4) {
          results.notifications.push(`You have plumbed the depths of this mystery. Its power transforms you.`);
          // Grant a permanent bonus
          results.newCards.push({
            id: `mastery_${path}`,
            name: `${path.charAt(0).toUpperCase() + path.slice(1)} Mastery`,
            category: 'condition',
            icon: '❋',
            aspects: ['condition', 'magic'],
            level: 5,
            permanent: true,
            flavor: `You have completed the path of the ${path}. Its secrets are yours forever.`
          });
        }
      }
      if (Math.random() > 0.4) results.stateChanges.hubris = 1;
    }
  });

  // ---- DREAM: Health → Clear Dread ----
  RecipeEngine.register({
    id: 'dream_health_clear_dread',
    verb: 'dream',
    primaryRequires: ['vigor'],
    duration: 12000,
    label: 'Resting...',
    startText: 'You sleep deeply, letting the body repair what the mind has strained.',
    execute(cards, results) {
      results.consumeCards = false;
      if (GameState.corruption > 0) {
        results.stateChanges.corruption = -1;
        if (Math.random() > 0.65) {
          results.stateChanges.warping = 1;
          results.notifications.push('Your dreams brush against the Twilight. The corruption fades, but leaves a mark.');
        } else {
          results.notifications.push('Sleep eases the dread. Slowly.');
        }
      } else {
        if (Math.random() > 0.8) {
          const visForms = ['vis_vim', 'vis_mentem', 'vis_imaginem'];
          const pick = visForms[Math.floor(Math.random() * visForms.length)];
          results.newCards.push(CardFactory.create(pick));
          results.notifications.push('In peaceful sleep, vis crystallizes from your dreams.');
        } else {
          results.notifications.push('You sleep peacefully. A rare luxury.');
        }
      }
    }
  });

  // ---- EXPLORE: Location → Vis/Discovery ----
  RecipeEngine.register({
    id: 'explore_location',
    verb: 'explore',
    primaryRequires: ['location'],
    duration: 18000,
    label: 'Exploring...',
    startText: 'You set out to investigate. The journey itself is part of the discovery.',
    execute(cards, results) {
      const loc = cards[0];
      results.consumeCards = false;

      // Vis discovery
      if (CardFactory.hasAspect(loc, 'vis') || CardFactory.hasAspect(loc, 'magic')) {
        const visTypes = FORMS.filter(f => CardFactory.hasAspect(loc, f));
        const visForm = visTypes.length > 0 ? visTypes[0] : 'vim';
        const visId = `vis_${visForm}`;
        if (CardDB[visId]) {
          results.newCards.push(CardFactory.create(visId));
          results.notifications.push(`You discover ${ASPECTS[visForm].name} vis at this location.`);
        }
      }

      // Faerie encounter
      if (CardFactory.hasAspect(loc, 'faerie') && Math.random() > 0.4) {
        if (GameState.mysteryProgress.arcadia === 0) {
          results.newCards.push(CardFactory.create('mystery_arcadia_1'));
          GameState.mysteryProgress.arcadia = 1;
          results.notifications.push('The faerie realm stirs. A ring of mushrooms appears...');
        }
        results.stateChanges.hubris = 1;
      }

      // Infernal encounter
      if (CardFactory.hasAspect(loc, 'infernal')) {
        if (Math.random() > 0.5) {
          results.stateChanges.corruption = 1;
          results.notifications.push('This place is tainted. You feel something unwholesome brush against your soul.');
        } else {
          results.notifications.push('This place is tainted, but you resist its pull. For now.');
        }
        if (Math.random() > 0.6) {
          results.newCards.push(CardFactory.create('threat_infernal_whisper'));
        }
      }

      // Chance for text discovery at any magical location
      if (Math.random() > 0.3) {
        const texts = ['summa_vim', 'coded_journal', 'lab_text_spell', 'tractatus_mentem',
          'tractatus_intellego', 'tractatus_creo', 'tractatus_rego', 'tractatus_muto',
          'tractatus_perdo', 'tractatus_animal', 'tractatus_auram', 'tractatus_terram',
          'tractatus_aquam', 'tractatus_imaginem', 'tractatus_corpus'];
        const pick = texts[Math.floor(Math.random() * texts.length)];
        if (CardDB[pick]) {
          results.newCards.push(CardFactory.create(pick));
          results.notifications.push('You discover a text — half-buried, but legible.');
        }
      }

      // Suspicion from exploring
      if (Math.random() > 0.7) {
        results.stateChanges.notoriety = 1;
        results.notifications.push('Your absence has been noted by the locals.');
      }
    }
  });

  // ---- EXPLORE: Intellego art → New Location ----
  RecipeEngine.register({
    id: 'explore_with_intellego',
    verb: 'explore',
    primaryRequires: ['intellego'],
    duration: 15000,
    label: 'Seeking...',
    startText: 'You extend your senses beyond the mundane, searching for places of power.',
    execute(cards, results) {
      results.consumeCards = false;
      const level = cards[0].level || 1;
      const locations = [
        { id: 'crossroads_inn', minLevel: 1 },
        { id: 'standing_stones', minLevel: 1 },
        { id: 'silver_wood', minLevel: 2 },
        { id: 'ruined_chapel', minLevel: 1 },
        { id: 'hidden_cave', minLevel: 3 },
        { id: 'covenant_ruins', minLevel: 3 },
      ];
      const available = locations.filter(l => l.minLevel <= level);
      // Check which locations player already has
      const owned = GameState.tableCards.filter(c => c.category === 'location').map(c => c.id);
      const unowned = available.filter(l => !owned.includes(l.id));
      if (unowned.length > 0) {
        const pick = unowned[Math.floor(Math.random() * unowned.length)];
        results.newCards.push(CardFactory.create(pick.id));
        results.notifications.push(`Your magical senses reveal a place of power: ${CardDB[pick.id].name}.`);
      } else {
        results.notifications.push('Your senses find nothing new. Perhaps you need greater perception.');
      }
    }
  });

  // ---- SPEAK: Companion → Trade/Recruit ----
  RecipeEngine.register({
    id: 'speak_companion',
    verb: 'speak',
    primaryRequires: ['companion'],
    duration: 12000,
    label: 'Conversing...',
    startText: 'You seek counsel and companionship. Even a wizard needs allies.',
    execute(cards, results) {
      const companion = cards[0];
      results.consumeCards = false;

      if (CardFactory.hasAspect(companion, 'lore') && CardFactory.hasAspect(companion, 'magic')) {
        // Wandering magus teaches
        if (!GameState.flags.metMagus) GameState.flags.metMagus = true;
        const timesSpoken = GameState.flags.magusConversations || 0;
        GameState.flags.magusConversations = timesSpoken + 1;

        if ((GameState.arts.intellego || 0) < 1) {
          results.newCards.push(CardFactory.create('intellego_1'));
          GameState.updateArt('intellego', 1);
          results.notifications.push('"Open your eyes — not the outer ones," the magus says. He teaches you Intellego.');
        } else if (timesSpoken < 4) {
          const allArts = [...TECHNIQUES, ...FORMS];
          const teachable = allArts.filter(a => (GameState.arts[a] || 0) < 2);
          if (teachable.length > 0) {
            const art = teachable[Math.floor(Math.random() * teachable.length)];
            const lvl = Math.min((GameState.arts[art] || 0) + 1, 2);
            const cardId = `${art}_${lvl}`;
            if (CardDB[cardId]) {
              results.newCards.push(CardFactory.create(cardId));
              GameState.updateArt(art, lvl);
              results.notifications.push(`The magus instructs you in ${ASPECTS[art].name}.`);
            }
          }
        } else {
          // Diminishing returns — occasional teaching, more flavor
          if (Math.random() > 0.6) {
            results.notifications.push('"I have taught you what I can. Seek your own path now, sodalis."');
          } else {
            const allArts = [...TECHNIQUES, ...FORMS];
            const teachable = allArts.filter(a => (GameState.arts[a] || 0) < 2);
            if (teachable.length > 0) {
              const art = teachable[Math.floor(Math.random() * teachable.length)];
              const cardId = `${art}_1`;
              if (CardDB[cardId]) {
                results.newCards.push(CardFactory.create(cardId));
                GameState.updateArt(art, 1);
                results.notifications.push(`The magus shares one last insight into ${ASPECTS[art].name}.`);
              }
            }
          }
        }

        // Chance for Parma Magica
        if (!GameState.tableCards.find(c => c.id === 'parma_magica') && Math.random() > 0.5) {
          results.newCards.push(CardFactory.create('parma_magica'));
          results.notifications.push('"You will need this," he says, teaching you the Parma Magica.');
        }
      } else if (CardFactory.hasAspect(companion, 'herbam')) {
        // Hedge witch gives herbam vis or knowledge
        if (Math.random() > 0.5) {
          results.newCards.push(CardFactory.create('vis_herbam'));
          results.notifications.push('The hedge witch shares vis harvested from the old ways.');
        } else {
          results.newCards.push(CardFactory.create('tractatus_herbam'));
          results.notifications.push('She teaches you herb-lore from a tradition older than the Order.');
        }
      } else {
        // Generic companion - news and rumors
        if (Math.random() > 0.5) {
          results.newCards.push(CardFactory.create('silver_penny'));
          results.notifications.push('Your companion brings silver from honest work.');
        }
        if (Math.random() > 0.7) {
          results.newCards.push(CardFactory.create('letter_from_stranger'));
          results.notifications.push('Your companion passes along a mysterious letter.');
        }
      }
    }
  });

  // ---- SPEAK: Threat → Try to resolve via ThreatSystem ----
  RecipeEngine.register({
    id: 'speak_resolve_threat',
    verb: 'speak',
    primaryRequires: ['threat'],
    duration: 15000,
    label: 'Addressing the threat...',
    startText: 'You must deal with this before it worsens.',
    execute(cards, results) {
      const threat = cards[0];

      // Try ThreatSystem resolution
      if (typeof ThreatSystem !== 'undefined') {
        for (const active of ThreatSystem.activeThreats) {
          const resolution = ThreatSystem.resolveThreat(active.defId, cards);
          if (resolution && resolution.resolved) {
            results.notifications.push(resolution.text);
            GameState.flags.threatsResolved = (GameState.flags.threatsResolved || 0) + 1;
            if (resolution.returnedCard) {
              results.notifications.push(`Your ${resolution.returnedCard.name} has been returned.`);
            }
            if (resolution.reward && CardDB[resolution.reward]) {
              results.newCards.push(CardFactory.create(resolution.reward));
            }
            return;
          }
        }
      }

      // Fallback: generic resolution
      const roll = Math.random();
      if (roll > 0.4) {
        results.notifications.push(`You have dealt with the ${threat.name}. For now.`);
        const statType = threat.threatType;
        if (statType) results.stateChanges[statType] = -1;
        GameState.flags.threatsResolved = (GameState.flags.threatsResolved || 0) + 1;
      } else {
        results.notifications.push(`Your efforts to address the ${threat.name} have backfired.`);
        const statType = threat.threatType;
        if (statType) results.stateChanges[statType] = 1;
        results.stateChanges.notoriety = 1;
      }
    }
  });

  // ---- SPEAK: Coin → Reduce suspicion ----
  RecipeEngine.register({
    id: 'speak_bribe',
    verb: 'speak',
    primaryRequires: ['coin'],
    duration: 8000,
    label: 'Smoothing things over...',
    startText: 'Silver opens doors and closes mouths.',
    execute(cards, results) {
      if (GameState.notoriety > 0) {
        results.stateChanges.notoriety = -1;
        results.notifications.push('A few coins in the right hands. The whispers quiet.');
      } else {
        results.notifications.push('There is nothing to smooth over. Your silver is wasted.');
      }
    }
  });

  // ---- STUDY: Passion → Boost Fascination (but also Art) ----
  RecipeEngine.register({
    id: 'study_passion',
    verb: 'study',
    primaryRequires: ['fervor'],
    duration: 10000,
    label: 'Driven by passion...',
    startText: 'You throw yourself into study with reckless intensity.',
    execute(cards, results) {
      results.consumeCards = false;
      // Give a random low-level art fragment
      const allArts = [...TECHNIQUES, ...FORMS];
      const art = allArts[Math.floor(Math.random() * allArts.length)];
      const currentLevel = GameState.arts[art] || 0;
      if (currentLevel < 2) {
        const cardId = `${art}_1`;
        if (CardDB[cardId]) {
          results.newCards.push(CardFactory.create(cardId));
          GameState.updateArt(art, 1);
          results.notifications.push(`Passion yields insight into ${ASPECTS[art].name}!`);
        }
      }
      results.stateChanges.hubris = 1;
      results.notifications.push('The fire burns hot but not always true.');
    }
  });

  // ---- WORK: Spell → Use spell (various effects) ----
  RecipeEngine.register({
    id: 'work_cast_spell',
    verb: 'work',
    primaryRequires: ['spell'],
    duration: 10000,
    label: 'Casting...',
    startText: 'You speak the words of power. The Art responds.',
    condition(cards) {
      return cards.length === 1;
    },
    execute(cards, results) {
      const spell = cards[0];
      results.consumeCards = false;
      const level = spell.level || 1;

      // Different effects based on spell type
      if (CardFactory.hasAspect(spell, 'perdo') && CardFactory.hasAspect(spell, 'vim')) {
        // Demon's Eternal Oblivion - clear dread and threats
        results.stateChanges.corruption = -(level);
        results.notifications.push('The banishing word rings out. The darkness recoils.');
      } else if (CardFactory.hasAspect(spell, 'creo') && CardFactory.hasAspect(spell, 'corpus')) {
        // Healing - restore health concept (reduce dread)
        results.stateChanges.corruption = -1;
        results.notifications.push('Healing light flows through your hands. You feel restored.');
      } else if (CardFactory.hasAspect(spell, 'rego') && CardFactory.hasAspect(spell, 'vim')) {
        // Aegis-like - reduce suspicion from magical threats
        results.stateChanges.notoriety = -1;
        results.notifications.push('A ward settles over your dwelling. Magic cannot easily find you.');
      } else if (CardFactory.hasAspect(spell, 'perdo') && CardFactory.hasAspect(spell, 'imaginem')) {
        // Invisibility - reduce suspicion
        results.stateChanges.notoriety = -2;
        results.notifications.push('You vanish from sight. The world forgets you for a time.');
      } else {
        // Generic spell cast - small warping, variable effect
        results.stateChanges.warping = 1;
        if (Math.random() > 0.5) {
          results.stateChanges.notoriety = 1;
          results.notifications.push('The spell succeeds, but the display of power draws attention.');
        } else {
          results.notifications.push('The spell executes cleanly. Power well-wielded.');
        }
      }
    }
  });

  // ---- TIME: Season passes ----
  RecipeEngine.register({
    id: 'time_season',
    verb: 'time',
    primaryRequires: [],
    duration: SEASON_DURATION,
    label: 'Time passes...',
    startText: null,
    execute(cards, results, state) {
      state.advanceSeason();
      results.consumeCards = false;

      // Grant a new season token
      results.newCards.push(CardFactory.create('season_token'));

      // Random vis discovery (25% chance, down from 40%)
      if (Math.random() > 0.75) {
        const visForms = ['vis_vim', 'vis_ignem', 'vis_corpus', 'vis_herbam', 'vis_terram',
          'vis_aquam', 'vis_auram', 'vis_mentem', 'vis_animal', 'vis_imaginem'];
        const pick = visForms[Math.floor(Math.random() * visForms.length)];
        results.newCards.push(CardFactory.create(pick));
        results.notifications.push('Vis manifests in the changing of the season.');
      }

      // Seasonal environmental effects
      const seasonName = state.getSeasonName();
      if (seasonName === 'Spring' && Math.random() > 0.7) {
        results.notifications.push('The Spring Equinox stirs the magic of the land.');
      }
      if (seasonName === 'Summer' && Math.random() > 0.8) {
        results.notifications.push('Midsummer Fire — the forge burns hot.');
      }
      if (seasonName === 'Autumn' && Math.random() > 0.7) {
        results.newCards.push(CardFactory.create('silver_penny'));
        results.notifications.push('Harvest Moon — the autumn bounty fills your coffers.');
      }
      if (seasonName === 'Winter' && Math.random() > 0.6) {
        results.notifications.push('Midwinter Frost grips the land. Study yields deeper insight in the cold silence.');
      }

      // Grant silver
      results.newCards.push(CardFactory.create('silver_penny'));

      results.notifications.push(`${seasonName} ${state.year}. The world turns.`);

      // Safety net: if player has no text or vis cards, grant a random text
      const hasStudyable = state.tableCards.some(c =>
        c.aspects?.some(a => ['text', 'vis', 'lore'].includes(a))
      );
      if (!hasStudyable && state.totalSeasons > 2) {
        const texts = ['tractatus_creo', 'tractatus_corpus', 'tractatus_vim', 'tractatus_ignem', 'tractatus_mentem'];
        const pick = texts[Math.floor(Math.random() * texts.length)];
        if (CardDB[pick]) {
          results.newCards.push(CardFactory.create(pick));
          results.notifications.push('A parcel arrives — a text from a distant correspondent.');
        }
      }

      // Safety net: if player has no companions, grant one
      const hasCompanion = state.tableCards.some(c => c.category === 'companion');
      if (!hasCompanion && state.totalSeasons > 5) {
        results.newCards.push(CardFactory.create('curious_youth'));
        results.notifications.push('A young traveler appears, curious about your work.');
      }

      // Safety net: if player has explore but no locations, grant one
      const hasLocation = state.tableCards.some(c => c.category === 'location');
      if (!hasLocation && state.totalSeasons > 4 && state.unlockedVerbs.includes('explore')) {
        results.newCards.push(CardFactory.create('crossroads_inn'));
        results.notifications.push('You recall the crossroads inn — perhaps worth another visit.');
      }

      // Early guaranteed threat to teach the mechanic
      if (state.totalSeasons === 2 && typeof ThreatSystem !== 'undefined') {
        ThreatSystem.spawnThreat('suspicious_villagers');
        results.notifications.push('⚠ The villagers are talking. You should address this.');
      }

      // Random companion appearance
      if (state.totalSeasons === 3) {
        results.newCards.push(CardFactory.create('curious_youth'));
        results.notifications.push('A young man appears at your door, seeking to learn.');
      }
      if (state.totalSeasons === 6) {
        results.newCards.push(CardFactory.create('hedge_witch'));
        results.notifications.push('A woman of the old ways seeks you out.');
      }
      // Later companions
      if (state.totalSeasons === 14) {
        results.newCards.push(CardFactory.create('faithful_grog'));
        results.notifications.push('A sturdy soul arrives, offering loyal service.');
      }
      if (state.totalSeasons === 20 && Math.random() > 0.5) {
        results.newCards.push(CardFactory.create('companion_travelling_merchant'));
        results.notifications.push('A merchant of unusual wares arrives at your door.');
      }
    }
  });

  // ---- WORK: Art (Technique) alone → mystery path entry ----
  RecipeEngine.register({
    id: 'work_mystery_entry',
    verb: 'work',
    primaryRequires: ['lore'],
    duration: 20000,
    label: 'Experimenting...',
    startText: 'You work with what you have, pushing at the boundaries of what is known.',
    condition(cards) {
      if (cards.length !== 1) return false;
      const card = cards[0];
      // Only trigger for single Art card with level >= 2
      return (card.level || 0) >= 2;
    },
    execute(cards, results) {
      const card = cards[0];
      results.consumeCards = false;

      const art = card.aspects.find(a => [...TECHNIQUES, ...FORMS].includes(a));

      // Animal → Heartbeast path entry
      if (art === 'animal' && GameState.mysteryProgress.heartbeast === 0) {
        results.newCards.push(CardFactory.create('mystery_heartbeast_1'));
        GameState.mysteryProgress.heartbeast = 1;
        results.notifications.push('Your work with Animal essence stirs something primal within...');
        return;
      }

      // Terram → Artifice path entry
      if (art === 'terram' && GameState.mysteryProgress.artifice === 0) {
        results.newCards.push(CardFactory.create('mystery_artifice_1'));
        GameState.mysteryProgress.artifice = 1;
        results.notifications.push('Your hands ache with the desire to shape and enchant...');
        return;
      }

      // Generic: give vis or a random insight
      const visForms = FORMS.filter(f => f === art);
      if (visForms.length > 0) {
        const visId = `vis_${visForms[0]}`;
        if (CardDB[visId]) {
          results.newCards.push(CardFactory.create(visId));
          results.notifications.push('Your experimentation yields raw vis.');
        }
      } else {
        results.stateChanges.hubris = 1;
        results.notifications.push('Your experiments yield no immediate result, but you sense you are close to something.');
      }
    }
  });

  // ---- EXPLORE: Passion → Bold discovery ----
  RecipeEngine.register({
    id: 'explore_passion',
    verb: 'explore',
    primaryRequires: ['fervor'],
    duration: 12000,
    label: 'Venturing boldly...',
    startText: 'You follow your instincts into the unknown.',
    execute(cards, results) {
      results.consumeCards = false;
      const roll = Math.random();
      if (roll > 0.6) {
        // Great discovery
        const finds = ['vis_vim', 'vis_ignem', 'coded_journal', 'letter_from_stranger', 'standing_stones'];
        const pick = finds[Math.floor(Math.random() * finds.length)];
        if (CardDB[pick]) {
          results.newCards.push(CardFactory.create(pick));
          results.notifications.push('Your boldness is rewarded with a remarkable find!');
        }
      } else if (roll > 0.3) {
        results.newCards.push(CardFactory.create('faithful_grog'));
        results.notifications.push('You encounter a sturdy soul willing to serve.');
      } else {
        results.stateChanges.notoriety = 1;
        results.notifications.push('Your recklessness draws unwanted attention.');
      }
    }
  });

  // ================================================================
  //  EXPANSION: New location discovery recipes
  // ================================================================

  // ---- EXPLORE: Location (high-level) → discover new locations + vis ----
  RecipeEngine.register({
    id: 'explore_high_location',
    verb: 'explore',
    primaryRequires: ['location'],
    duration: 22000,
    label: 'Exploring deeper...',
    startText: 'You push beyond the familiar boundaries of this place of power.',
    condition(cards) {
      return (cards[0].level || 1) >= 3;
    },
    execute(cards, results) {
      const loc = cards[0];
      results.consumeCards = false;

      // Discover new expansion locations based on what the player has
      const newLocations = [
        { id: 'basilica_of_columns', minLevel: 4 },
        { id: 'pompeii_regio', minLevel: 3 },
        { id: 'sunken_library', minLevel: 3 },
        { id: 'sacred_grove_dindymene', minLevel: 3 },
        { id: 'dragons_hoard', minLevel: 5 },
        { id: 'apollos_sanctuary', minLevel: 3 },
        { id: 'tower_of_babel_ruins', minLevel: 4 },
      ];

      const owned = GameState.tableCards.filter(c => c.category === 'location').map(c => c.id);
      const available = newLocations.filter(l => l.minLevel <= (loc.level || 1) && !owned.includes(l.id));

      if (available.length > 0 && Math.random() > 0.4) {
        const pick = available[Math.floor(Math.random() * available.length)];
        results.newCards.push(CardFactory.create(pick.id));
        results.notifications.push(`Your exploration reveals a place of great power: ${CardDB[pick.id].name}.`);
      }

      // Vis from high-level locations
      const formAspects = loc.aspects.filter(a => FORMS.includes(a));
      if (formAspects.length > 0) {
        const visForm = formAspects[Math.floor(Math.random() * formAspects.length)];
        const visId = `vis_${visForm}`;
        if (CardDB[visId]) {
          results.newCards.push(CardFactory.create(visId));
          results.notifications.push(`Rich vis of ${ASPECTS[visForm].name} flows from this place.`);
        }
      }

      // Faerie locations can trigger new mystery paths
      if (CardFactory.hasAspect(loc, 'faerie') && Math.random() > 0.5) {
        if (loc.id === 'garden_of_hesperides') {
          results.stateChanges.corruption = 1;
          results.notifications.push('The golden apples tempt. The serpent watches with knowing eyes.');
        }
      }

      // Infernal locations: necromancy path
      if (CardFactory.hasAspect(loc, 'infernal') && loc.id === 'witch_of_endor_cave') {
        if (GameState.mysteryProgress.necromancy === 0 && GameState.arts.perdo >= 3) {
          results.newCards.push(CardFactory.create('mystery_necromancy_1'));
          GameState.mysteryProgress.necromancy = 1;
          results.notifications.push('The dead stir beneath your feet. A new path opens...');
        }
      }

      // Magic locations: runes and hymns
      if (loc.id === 'tower_of_babel_ruins' && GameState.mysteryProgress.hymns === 0 && GameState.arts.imaginem >= 3) {
        results.newCards.push(CardFactory.create('mystery_hymns_1'));
        GameState.mysteryProgress.hymns = 1;
        results.notifications.push('A whisper echoes among the ruins — a fragment of the first song.');
      }

      if (Math.random() > 0.6) {
        results.stateChanges.notoriety = 1;
        results.notifications.push('Your travels draw the attention of the curious.');
      }
    }
  });

  // ================================================================
  //  EXPANSION: Named spell crafting recipes (specific combos)
  // ================================================================

  // Creo + Corpus high → Purification / Circle of Life
  RecipeEngine.register({
    id: 'work_creo_corpus_spell',
    verb: 'work',
    primaryRequires: [{ aspect: 'creo', minLevel: 2 }],
    secondaryRequires: [{ aspect: 'corpus', minLevel: 2 }],
    duration: 25000,
    label: 'Crafting a healing spell...',
    startText: 'Life essence gathers at your fingertips. The healing arts respond.',
    condition(cards) {
      const hasTech = cards.some(c => CardFactory.hasAspect(c, 'creo'));
      const hasForm = cards.some(c => CardFactory.hasAspect(c, 'corpus'));
      return hasTech && hasForm;
    },
    execute(cards, results) {
      const creoLevel = cards.find(c => CardFactory.hasAspect(c, 'creo'))?.level || 1;
      const corpusLevel = cards.find(c => CardFactory.hasAspect(c, 'corpus'))?.level || 1;
      results.consumeCards = false;

      if (creoLevel >= 5 && corpusLevel >= 4) {
        results.newCards.push(CardFactory.create('spell_circle_of_life_renewed'));
        results.notifications.push('You have created Circle of Life Renewed — the ultimate healing spell!');
      } else if (creoLevel >= 2) {
        results.newCards.push(CardFactory.create('spell_purification_of_wounds'));
        results.notifications.push('You have invented Purification of Wounds.');
      }
      if (Math.random() > 0.6) results.stateChanges.warping = 1;
    }
  });

  // Rego + Vim high → Aegis or Circular Ward
  RecipeEngine.register({
    id: 'work_rego_vim_spell',
    verb: 'work',
    primaryRequires: [{ aspect: 'rego', minLevel: 3 }],
    secondaryRequires: [{ aspect: 'vim', minLevel: 2 }],
    duration: 30000,
    label: 'Weaving wards...',
    startText: 'You trace circles of power. The boundaries of your sanctum harden.',
    condition(cards) {
      return cards.some(c => CardFactory.hasAspect(c, 'rego')) &&
             cards.some(c => CardFactory.hasAspect(c, 'vim'));
    },
    execute(cards, results) {
      const regoLevel = cards.find(c => CardFactory.hasAspect(c, 'rego'))?.level || 1;
      const vimLevel = cards.find(c => CardFactory.hasAspect(c, 'vim'))?.level || 1;
      results.consumeCards = false;

      if (regoLevel >= 4 && vimLevel >= 4) {
        results.newCards.push(CardFactory.create('spell_aegis_of_the_hearth'));
        results.notifications.push('The Aegis of the Hearth takes shape — your sanctum is warded!');
      } else {
        results.newCards.push(CardFactory.create('spell_circular_ward_demons'));
        results.notifications.push('You have inscribed a Circular Ward Against Demons.');
      }
      results.stateChanges.warping = 1;
    }
  });

  // ---- WORK: Named item crafting from spell + vis ----
  RecipeEngine.register({
    id: 'work_named_item',
    verb: 'work',
    primaryRequires: ['spell'],
    secondaryRequires: ['vis'],
    duration: 30000,
    label: 'Enchanting a device...',
    startText: 'You pour vis into the prepared vessel. The enchantment takes shape.',
    condition(cards) {
      if (cards.length < 2) return false;
      return CardFactory.hasAspect(cards[0], 'spell') && CardFactory.hasAspect(cards[1], 'vis');
    },
    execute(cards, results) {
      const spell = cards[0];
      const vis = cards[1];
      const spellLevel = spell.level || 1;

      // Named item creation based on spell type
      if (CardFactory.hasAspect(spell, 'rego') && CardFactory.hasAspect(spell, 'vim')) {
        results.newCards.push(CardFactory.create('item_ring_of_warding'));
        results.notifications.push('You have forged the Ring of Warding — threats will hesitate.');
      } else if (CardFactory.hasAspect(spell, 'intellego') && CardFactory.hasAspect(spell, 'vim')) {
        results.newCards.push(CardFactory.create('item_orb_of_divination'));
        results.notifications.push('The Orb of Divination swirls with glimpses of tomorrow.');
      } else if (CardFactory.hasAspect(spell, 'perdo') && CardFactory.hasAspect(spell, 'imaginem')) {
        results.newCards.push(CardFactory.create('item_cloak_of_invisibility'));
        results.notifications.push('The Cloak of Invisibility drinks in the light. You vanish.');
      } else if (CardFactory.hasAspect(spell, 'creo') && CardFactory.hasAspect(spell, 'corpus')) {
        results.newCards.push(CardFactory.create('item_longevity_elixir'));
        results.notifications.push('The Longevity Elixir glows with captured youth.');
      } else if (CardFactory.hasAspect(spell, 'rego') && CardFactory.hasAspect(spell, 'terram')) {
        if (spellLevel >= 4) {
          results.newCards.push(CardFactory.create('item_automaton_servant'));
          results.notifications.push('Clay stirs. Eyes open. The Automaton awaits your commands.');
        } else {
          results.newCards.push(CardFactory.create('item_traveling_laboratory'));
          results.notifications.push('Your laboratory folds into impossible compactness.');
        }
      } else if (CardFactory.hasAspect(spell, 'creo') && CardFactory.hasAspect(spell, 'terram')) {
        results.newCards.push(CardFactory.create('item_gargoyle_guardian'));
        results.notifications.push('Stone takes wing. The Gargoyle Guardian perches on your roof.');
      } else {
        // Generic enchanted item
        const tech = spell.aspects.find(a => TECHNIQUES.includes(a));
        const form = spell.aspects.find(a => FORMS.includes(a));
        results.newCards.push({
          id: 'enchanted_item_' + Date.now(),
          name: `Enchanted ${ASPECTS[form] ? ASPECTS[form].name : 'Arcane'} Device`,
          category: 'resource', icon: '⚒',
          aspects: ['item', tech, form].filter(Boolean),
          level: spellLevel + 1,
          flavor: `An item humming with bound ${ASPECTS[form] ? ASPECTS[form].name : 'magical'} power.`
        });
        results.notifications.push('The enchantment takes hold. The item awakens.');
      }
      results.stateChanges.warping = 1;
      // Consume vis but return the spell
      results.consumeCards = false;
      if (cards[1]) GameState.removeCard(cards[1].instanceId);
    }
  });

  // ---- DREAM: Mystery card → Advance mystery (handles new paths too) ----
  // (This updates the existing dream_mystery_advance to handle body/strife branching)

  // ---- EXPLORE: Specific location triggers ----
  RecipeEngine.register({
    id: 'explore_rune_discovery',
    verb: 'explore',
    primaryRequires: ['location'],
    duration: 20000,
    label: 'Seeking runes...',
    startText: 'The stones here bear marks older than Latin. You trace them with reverent fingers.',
    condition(cards) {
      const loc = cards[0];
      return CardFactory.hasAspect(loc, 'terram') && CardFactory.hasAspect(loc, 'magic')
        && GameState.mysteryProgress.runes === 0 && GameState.arts.vim >= 3;
    },
    execute(cards, results) {
      results.consumeCards = false;
      results.newCards.push(CardFactory.create('mystery_runes_1'));
      GameState.mysteryProgress.runes = 1;
      results.notifications.push('The First Rune reveals itself. Fehu — wealth, cattle, power. An ancient tradition stirs.');
    }
  });

  // ---- DREAM: Enigma step 2 → Branch to Body or Strife ----
  RecipeEngine.register({
    id: 'dream_enigma_branch',
    verb: 'dream',
    primaryRequires: ['mystery'],
    duration: 25000,
    label: 'The path divides...',
    startText: 'The Enigma offers a choice. Two roads diverge in the Twilight.',
    condition(cards) {
      const card = cards[0];
      return card?.mysteryPath === 'enigma' && card?.mysteryStep === 3
        && GameState.mysteryProgress.enigma >= 2
        && (GameState.mysteryProgress.body === 0 || GameState.mysteryProgress.strife === 0);
    },
    execute(cards, results) {
      results.consumeCards = false;

      // Branch: if corpus >= 3, body path; if perdo >= 3, strife path
      if (GameState.arts.corpus >= 3 && GameState.mysteryProgress.body === 0) {
        results.newCards.push(CardFactory.create('mystery_body_1'));
        GameState.mysteryProgress.body = 1;
        results.notifications.push('The path of the Body opens before you. The flesh is the universe made manifest.');
      } else if (GameState.arts.perdo >= 3 && GameState.mysteryProgress.strife === 0) {
        results.newCards.push(CardFactory.create('mystery_strife_1'));
        GameState.mysteryProgress.strife = 1;
        results.notifications.push('The path of Strife reveals itself. Accept darkness so others need not.');
      }

      // Continue enigma normally too
      const nextStep = 3;
      const nextCardId = `mystery_enigma_${nextStep}`;
      if (CardDB[nextCardId] && GameState.mysteryProgress.enigma < nextStep) {
        results.newCards.push(CardFactory.create(nextCardId));
        GameState.mysteryProgress.enigma = nextStep;
      }
    }
  });

})();
