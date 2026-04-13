// ============================================================
// CONTENT.JS — All card definitions and flavor text
// ============================================================

// Card art image mapping — card ID (or prefix) → image filename
// Images live in game/images/
const CARD_ART_IMAGES = {
  // Identity
  'the_gift': 'card-the-gift.png',
  // Techniques
  'creo_': 'card-creo.png',
  'perdo_': 'card-perdo.png',
  'intellego_': 'card-intellego.png',
  'muto_': 'card-muto.png',
  'rego_': 'card-rego.png',
  // Forms
  'ignem_': 'card-ignem.png',
  'vim_': 'card-vim.png',
  'animal_': 'card-animal.png',
  'corpus_': 'card-corpus.png',
  'mentem_': 'card-mentem.png',
  'herbam_': 'card-herbam.png',
  'aquam_': 'card-aquam.png',
  'terram_': 'card-terram.png',
  'auram_': 'card-auram.png',
  'imaginem_': 'card-imaginem.png',
  // Vis (shares form art)
  'vis_vim': 'card-vim.png',
  'vis_ignem': 'card-ignem.png',
  'vis_animal': 'card-animal.png',
  'vis_corpus': 'card-corpus.png',
  'vis_mentem': 'card-mentem.png',
  'vis_herbam': 'card-herbam.png',
  'vis_aquam': 'card-aquam.png',
  'vis_terram': 'card-terram.png',
  'vis_auram': 'card-auram.png',
  'vis_imaginem': 'card-imaginem.png',
  // Texts
  'tattered_folio': 'card-tattered-folio.png',
  // Mysteries
  'mystery_enigma_': 'card-enigma.png',
  'mystery_heartbeast_': 'card-heartbeast.png',
  'mystery_artifice_': 'card-artifice.png',
  'mystery_arcadia_': 'card-arcadia.png',
  // Locations
  'standing_stones': 'card-standing-stones.png',
  'ruined_chapel': 'card-ruined-chapel.png',
  'silver_wood': 'card-silver-wood.png',
  'hidden_cave': 'card-hidden-cave.png',
  'crossroads_inn': 'card-crossroads-inn.png',
  'covenant_ruins': 'card-covenant-ruins.png',
  // Companions
  'wandering_magus': 'card-wandering-magus.png',
  'hedge_witch': 'card-hedge-witch.png',
  'faithful_grog': 'card-faithful-grog.png',
  'curious_youth': 'card-curious-youth.png',
  // Threats
  'threat_curious_priest': 'card-curious-priest.png',
  'threat_infernal_whisper': 'card-infernal-whisper.png',
  'threat_quaesitor': 'card-quaesitor.png',
  'threat_twilight_beckons': 'card-twilight-beckons.png',
  // Spells
  'spell_pilum_of_fire': 'card-pilum-of-fire.png',
  'spell_aegis_of_the_hearth': 'card-aegis-of-the-hearth.png',
  'spell_veil_of_invisibility': 'card-veil-of-invisibility.png',
  'spell_': 'card-generic-spell.png',
  // Conditions
  'parma_magica': 'card-parma-magica.png',
  'twilight_scar_': 'card-twilight-scar.png',
  // Resources
  'silver_penny': 'card-silver-penny.png',
  'vigor': 'card-vigor.png',
  'acumen': 'card-acumen.png',
  'fervor': 'card-fervor.png',
  'season_token': 'card-season-token.png',
  'enchanted_ring': 'card-enchanted-ring.png',
  'wand_of_fire': 'card-enchanted-ring.png',
  'talisman_unfinished': 'card-enchanted-ring.png',
  // Texts (generic fallback)
  'tractatus_': 'card-generic-text.png',
  'summa_': 'card-generic-text.png',
  'lab_text_': 'card-generic-text.png',
  'coded_journal': 'card-generic-text.png',
  'letter_from_stranger': 'card-generic-text.png',
  // Remaining threats
  'threat_warping_tremor': 'card-warping-tremor.png',
  'threat_suspicious_villagers': 'card-suspicious-villagers.png',
  'threat_rival_magus': 'card-rival-magus.png',
  // Remaining conditions
  'longevity_ritual': 'card-longevity-ritual.png',
  // Dynamic cards (generated at runtime)
  'enchanted_item_': 'card-enchanted-ring.png',
  'mastery_': 'card-enigma.png',
  'spell_gen_': 'card-generic-spell.png',
  // Expansion spells — technique-themed art
  'spell_purification_of_wounds': 'card-creo-spell.png',
  'spell_conjure_mystic_tower': 'card-creo-spell.png',
  'spell_incantation_of_lightning': 'card-creo-spell.png',
  'spell_bountiful_feast': 'card-creo-spell.png',
  'spell_circle_of_life_renewed': 'card-creo-spell.png',
  'spell_sight_beyond_sight': 'card-intellego-spell.png',
  'spell_whispers_of_the_land': 'card-intellego-spell.png',
  'spell_ear_of_the_inquisitor': 'card-intellego-spell.png',
  'spell_piercing_the_faerie_veil': 'card-intellego-spell.png',
  'spell_eyes_of_the_omniscient': 'card-intellego-spell.png',
  'spell_gift_of_bears_fortitude': 'card-muto-spell.png',
  'spell_cloak_of_many_forms': 'card-muto-spell.png',
  'spell_transformation_ravenous_beast': 'card-muto-spell.png',
  'spell_protean_crucible': 'card-muto-spell.png',
  'spell_touch_of_winter': 'card-perdo-spell.png',
  'spell_curse_of_rotted_wood': 'card-perdo-spell.png',
  'spell_wind_of_mundane_silence': 'card-perdo-spell.png',
  'spell_the_unmaking_word': 'card-perdo-spell.png',
  'spell_ward_against_beasts': 'card-rego-spell.png',
  'spell_circular_ward_demons': 'card-rego-spell.png',
  'spell_lifting_the_dangling_puppet': 'card-rego-spell.png',
  'spell_dominion_absolute': 'card-rego-spell.png',
  // Expansion items — unique art
  'item_ring_of_warding': 'card-ring-warding.png',
  'item_orb_of_divination': 'card-orb-divination.png',
  'item_cloak_of_invisibility': 'card-cloak-invisibility.png',
  'item_staff_of_elements': 'card-staff-elements.png',
  'item_longevity_elixir': 'card-longevity-elixir.png',
  'item_talisman_of_bonding': 'card-talisman-bonding.png',
  'item_automaton_servant': 'card-automaton-servant.png',
  'item_necromancers_grimoire': 'card-necromancers-grimoire.png',
  'item_travelling_lab': 'card-travelling-lab.png',
  'item_gargoyle_guardian': 'card-gargoyle-guardian.png',
  'item_': 'card-enchanted-ring.png',
  // Expansion locations — unique art
  'basilica_of_columns': 'card-basilica-columns.png',
  'pompeii_regio': 'card-pompeii-regio.png',
  'garden_of_hesperides': 'card-garden-hesperides.png',
  'witch_of_endor_cave': 'card-witch-endor.png',
  'sacred_grove_dindymene': 'card-sacred-grove.png',
  'sunken_library': 'card-sunken-library.png',
  'dragons_hoard': 'card-dragons-hoard.png',
  'apollos_sanctuary': 'card-apollos-sanctuary.png',
  'purgatory_pass': 'card-purgatory-pass.png',
  'tower_of_babel_ruins': 'card-tower-babel.png',
  // Expansion companions — unique art
  'companion_crusader_knight': 'card-crusader-knight.png',
  'companion_faerie_changeling': 'card-faerie-changeling.png',
  'companion_ghostly_scholar': 'card-ghostly-scholar.png',
  'companion_repentant_diabolist': 'card-repentant-diabolist.png',
  'companion_runecaster': 'card-runecaster.png',
  'companion_travelling_merchant': 'card-travelling-merchant.png',
  'companion_hungry_familiar': 'card-hungry-familiar.png',
  'companion_': 'card-wandering-magus.png',
  // Expansion mysteries — unique path art
  'mystery_necromancy_': 'card-necromancy.png',
  'mystery_runes_': 'card-runes.png',
  'mystery_hymns_': 'card-hymns.png',
  'mystery_body_': 'card-body-mystery.png',
  'mystery_strife_': 'card-strife.png',
};

/** Look up the art image for a card ID. Returns path or null. */
function getCardArtImage(cardId) {
  // Exact match first
  if (CARD_ART_IMAGES[cardId]) return 'images/' + CARD_ART_IMAGES[cardId];
  // Prefix match (e.g. "creo_1" matches "creo_")
  for (const [prefix, file] of Object.entries(CARD_ART_IMAGES)) {
    if (prefix.endsWith('_') && cardId.startsWith(prefix)) return 'images/' + file;
  }
  return null;
}

(function defineCards() {

  // ---- HELPER ----
  function def(id, data) { CardDB[id] = { id, ...data }; }

  // ================================================================
  //  ART FRAGMENT CARDS — Techniques (levels 1-5)
  // ================================================================

  const techniqueData = {
    creo: {
      name: 'Creo', icon: '✦',
      flavors: [
        'The first impulse of power: to bring forth what was not.',
        'Light gathers at your fingertips. You begin to understand creation.',
        'You speak, and substance answers. The world bends toward perfection.',
        'From nothing, you draw the Platonic ideal. All creation is remembrance.',
        'The Flame Primordial, which kindled the first light, burns in your voice.'
      ]
    },
    intellego: {
      name: 'Intellego', icon: '◈',
      flavors: [
        'A flicker of perception beyond sight. Something watches through your eyes.',
        'The hidden patterns of the world resolve. You read what was never written.',
        'Truth is not discovered but uncovered. You peel away the veils of seeming.',
        'Nothing escapes your scrutiny. The world is a book, and you have learned its alphabet.',
        'The All-Seeing Eye that pierces every veil. Even secrets have secrets, and you know them.'
      ]
    },
    muto: {
      name: 'Muto', icon: '↻',
      flavors: [
        'The trembling of form. Edges blur when you concentrate.',
        'Shape is a suggestion, not a law. You have learned to make suggestions of your own.',
        'Between one breath and the next, the world shifts. You are the hinge.',
        'The Protean Art dissolves boundaries. What is a wolf but a man who has forgotten?',
        'All nature is unbound. Form is merely habit, and you have broken every habit there is.'
      ]
    },
    perdo: {
      name: 'Perdo', icon: '✕',
      flavors: [
        'The whisper of entropy. Things near you wear a little faster.',
        'Decay is not destruction — it is liberation. You free things from the burden of existence.',
        'Your touch unmakes. The world remembers what it was before you, and shudders.',
        'Even memory can be devoured. You speak the syllables of un-being.',
        'The Unmaking Word. What you destroy cannot be recalled, even by God.'
      ]
    },
    rego: {
      name: 'Rego', icon: '⊕',
      flavors: [
        'A thread of will, pulling at the edge of things.',
        'Objects slide toward you. Flames bend. Water parts. The world defers.',
        'Command is not force — it is certainty. The universe obeys because you do not doubt.',
        'Dominion extends to the horizon. Every stone knows your name.',
        'Dominion Absolute. Matter and spirit bow. The sovereign command admits no exception.'
      ]
    }
  };

  for (const [tech, data] of Object.entries(techniqueData)) {
    for (let level = 1; level <= 5; level++) {
      def(`${tech}_${level}`, {
        name: `${data.name} ${level > 1 ? '•'.repeat(level) : ''}`,
        title: `Fragmentum ${data.name}`,
        category: 'technique',
        icon: data.icon,
        level: level,
        aspects: [tech, 'lore'],
        flavor: data.flavors[level - 1],
        artName: `${data.name}`,
      });
    }
  }

  // ================================================================
  //  ART FRAGMENT CARDS — Forms (levels 1-5)
  // ================================================================

  const formData = {
    animal: {
      name: 'Animal', icon: '🐺',
      flavors: [
        'You hear the fox in the hedgerow. It hears you too, and is afraid.',
        'The language of beasts is not words but intention. You are learning to intend.',
        'Fur, feather, scale — all are masks. You see the creature beneath.',
        'The wild recognizes you now. Hawks circle lower. Wolves do not flee.',
        'You are kin to every beast. The boundary between human and animal is a fiction you have discarded.'
      ]
    },
    aquam: {
      name: 'Aquam', icon: '💧',
      flavors: [
        'Water whispers where it has been. You are learning to listen.',
        'Rivers carry memory. Rain tastes of places you have never visited.',
        'The tides answer your mood. Puddles freeze or boil at your passing.',
        'You speak the language of the deep places where light has never reached.',
        'Every drop of water in the world is yours. The ocean is a single, obedient servant.'
      ]
    },
    auram: {
      name: 'Auram', icon: '🌬',
      flavors: [
        'The wind changes direction when you breathe out.',
        'You taste lightning in still air. Storms are conversations you are beginning to understand.',
        'The sky opens its counsel to you. Weather is will, and yours is growing.',
        'Tempests coil at your command. The air itself vibrates with your authority.',
        'You are the storm and the calm. The atmosphere is an extension of your thought.'
      ]
    },
    corpus: {
      name: 'Corpus', icon: '♱',
      flavors: [
        'You feel the architecture of your own body — every bone, every sinew.',
        'Flesh is clay. You sense the sculptor\'s marks left by nature.',
        'Wounds close at your attention. You are learning what the body wants to be.',
        'The human form holds no mysteries. You see the soul\'s blueprint in every face.',
        'Mastery of the human form, its perfection and corruption. You could rebuild a man from dust.'
      ]
    },
    herbam: {
      name: 'Herbam', icon: '🌿',
      flavors: [
        'Green things lean toward you. Seeds sprout in your footprints.',
        'The oak speaks in rings. The vine whispers in tendrils. You are learning their grammar.',
        'Wood obeys you. Thorns part. Roses bloom in winter at your word.',
        'The forest is your library. Every leaf is a page, every root a sentence.',
        'All growing things are your domain. You could raise a forest from flagstone.'
      ]
    },
    ignem: {
      name: 'Ignem', icon: '🔥',
      flavors: [
        'A candle\'s secrets — how it eats, how it breathes, how it dies.',
        'Flame dances at your command. Shadows flee or deepen as you wish.',
        'You hold fire without burning. Heat is a conversation between you and the primal element.',
        'The sun is your distant cousin. Every hearth acknowledges your sovereignty.',
        'Command of the Primal Fire. What you ignite cannot be quenched; what you cool will never warm again.'
      ]
    },
    imaginem: {
      name: 'Imaginem', icon: '👁',
      flavors: [
        'Reflections linger a moment longer than they should. Colors seem brighter.',
        'You see the species — the images that flow from all things. Reality is a performance.',
        'Illusion and truth are not opposites. Both are merely different kinds of image.',
        'You can make a stone appear to be gold, or gold appear to be a stone. Soon there will be no difference.',
        'The Architecture of Appearance. What is seen is what is real, and you are the architect.'
      ]
    },
    mentem: {
      name: 'Mentem', icon: '🧠',
      flavors: [
        'Thoughts leave traces. You can almost see them, like footprints in snow.',
        'Emotions have texture. Fear is sharp; love is heavy; curiosity itches.',
        'You hear the echo of recent thoughts in empty rooms. Minds leave stains.',
        'Memory is a mansion with many rooms. You have obtained the key to the servants\' entrance.',
        'The Architecture of Mind. Every thought is a room to enter, and you have the master key.'
      ]
    },
    terram: {
      name: 'Terram', icon: '⛰',
      flavors: [
        'Stone hums at a frequency only you can hear. The earth remembers.',
        'Metal whispers its name to you — iron, copper, tin. Each has a distinct voice.',
        'The bones of the earth shift at your request. Foundations are suggestions.',
        'Mountains acknowledge you. Gems sing in the dark, and you know every song.',
        'Earth, stone, and metal bow. You could reshape the foundations of the world.'
      ]
    },
    vim: {
      name: 'Vim', icon: '⚡',
      flavors: [
        'Raw power crackles at the edge of your perception. Magic has a taste.',
        'You feel the aura of this place — the invisible tides of supernatural force.',
        'Vis glimmers in unexpected places. You see the veins of magic beneath reality\'s skin.',
        'The essence of magic itself is your study. Other Arts are rivers; Vim is the sea.',
        'The root of all power. You draw magic from the world as a tree draws water from stone.'
      ]
    }
  };

  for (const [form, data] of Object.entries(formData)) {
    for (let level = 1; level <= 5; level++) {
      def(`${form}_${level}`, {
        name: `${data.name} ${level > 1 ? '•'.repeat(level) : ''}`,
        title: `Fragmentum ${data.name}`,
        category: 'form',
        icon: data.icon,
        level: level,
        aspects: [form, 'lore'],
        flavor: data.flavors[level - 1],
        artName: `${data.name}`,
      });
    }
  }

  // ================================================================
  //  VIS CARDS
  // ================================================================

  const visCards = {
    vis_vim: { name: 'Vim Vis', flavor: 'A crystal vial thrumming with contained lightning. The glass is warm to the touch.', icon: '◆', aspects: ['vis', 'vim'] },
    vis_ignem: { name: 'Ignem Vis', flavor: 'An ember that never cools, wrapped in asbestos cloth. It smells of distant volcanoes.', icon: '◆', aspects: ['vis', 'ignem'] },
    vis_corpus: { name: 'Corpus Vis', flavor: 'A knucklebone, heavier than it should be. It pulses with a faint heartbeat.', icon: '◆', aspects: ['vis', 'corpus'] },
    vis_mentem: { name: 'Mentem Vis', flavor: 'A glass bead containing a trapped thought. Hold it to your temple and hear whispering.', icon: '◆', aspects: ['vis', 'mentem'] },
    vis_herbam: { name: 'Herbam Vis', flavor: 'A seed that glows faintly green. It wants to grow into something impossible.', icon: '◆', aspects: ['vis', 'herbam'] },
    vis_terram: { name: 'Terram Vis', flavor: 'A pebble of crystallized earth. It sinks through wood but floats on water.', icon: '◆', aspects: ['vis', 'terram'] },
    vis_aquam: { name: 'Aquam Vis', flavor: 'A vial of water that is always cold. It sometimes flows upward.', icon: '◆', aspects: ['vis', 'aquam'] },
    vis_auram: { name: 'Auram Vis', flavor: 'A feather that trembles without wind. Hold it near a window and storms approach.', icon: '◆', aspects: ['vis', 'auram'] },
    vis_animal: { name: 'Animal Vis', flavor: 'A claw from no known beast. It twitches when prey is near.', icon: '◆', aspects: ['vis', 'animal'] },
    vis_imaginem: { name: 'Imaginem Vis', flavor: 'A mirror shard that reflects things that are not there. Sometimes the reflections move.', icon: '◆', aspects: ['vis', 'imaginem'] },
  };
  for (const [id, data] of Object.entries(visCards)) {
    def(id, { ...data, category: 'vis', level: 1 });
  }

  // ================================================================
  //  TEXT CARDS
  // ================================================================

  def('tattered_folio', {
    name: 'A Tattered Folio',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'vim'],
    level: 1,
    flavor: 'Water-stained pages in cramped Latin. Someone has annotated the margins with symbols you almost recognize.'
  });

  def('tractatus_ignem', {
    name: 'De Natura Ignis',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'ignem'],
    level: 1,
    flavor: 'A treatise on the nature of fire, written by one Elaine of Flambeau. The pages are warm.'
  });

  def('tractatus_mentem', {
    name: 'Commentarii Mentis',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'mentem'],
    level: 1,
    flavor: 'Notes on the architecture of thought. Reading them gives you a headache that is almost pleasant.'
  });

  def('tractatus_corpus', {
    name: 'Anatomia Arcana',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'corpus'],
    level: 1,
    flavor: 'Illustrations of the human form annotated with sigils. Some diagrams show organs that do not exist.'
  });

  def('tractatus_herbam', {
    name: 'Herbarium Secretum',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'herbam'],
    level: 1,
    flavor: 'Pressed flowers that should not exist. One specimen unfolds when moonlight touches it.'
  });

  def('summa_vim', {
    name: 'Principia Magica',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'vim', 'lore'],
    level: 2,
    flavor: 'A foundational text on the nature of magical power. The binding is silver, the clasp is bone. Bonisagus himself may have held this volume.'
  });

  def('summa_creo', {
    name: 'De Creatione',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'creo', 'lore'],
    level: 2,
    flavor: 'A Summa on the Art of Creation. Each page smells of fresh rain and newborn things.'
  });

  def('lab_text_spell', {
    name: 'Laboratory Notes',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'spell'],
    level: 1,
    flavor: 'Meticulous notes in a practiced hand. Someone else\'s spell, waiting to be learned.'
  });

  def('coded_journal', {
    name: 'A Coded Journal',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'lore'],
    level: 1,
    flavor: 'Written in a cipher you do not yet know. The diagrams suggest initiation rites. Some pages are stained with blood.'
  });

  def('letter_from_stranger', {
    name: 'A Letter from a Stranger',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'companion'],
    level: 1,
    flavor: '"I have observed your progress with interest. Meet me at the crossroads when the moon is dark. Bring the folio. — M."'
  });

  // ================================================================
  //  RESOURCE CARDS
  // ================================================================

  def('silver_penny', {
    name: 'Silver Penny',
    category: 'resource',
    icon: '●',
    aspects: ['coin'],
    level: 1,
    flavor: 'The currency of the mundane world. It buys bread, silence, and occasionally, secrets.'
  });

  def('vigor', {
    name: 'Your Vigor',
    category: 'condition',
    icon: '♥',
    aspects: ['vigor'],
    level: 1,
    permanent: true,
    flavor: 'The strength of your body — hale and whole. The Art demands much of the flesh. Guard this well.'
  });

  def('acumen', {
    name: 'Your Acumen',
    category: 'condition',
    icon: '⚙',
    aspects: ['acumen'],
    level: 1,
    permanent: true,
    flavor: 'The sharpness of your mind, the clarity that separates the scholar from the madman. Do not let it dull.'
  });

  def('fervor', {
    name: 'Your Fervor',
    category: 'condition',
    icon: '♦',
    aspects: ['fervor'],
    level: 1,
    permanent: true,
    flavor: 'The fire in your blood that drives you past prudence into the unknown. Useful, and dangerous.'
  });

  def('season_token', {
    name: 'A Season\'s Labor',
    category: 'resource',
    icon: '☀',
    aspects: ['season', 'fervor'],
    level: 1,
    flavor: 'Three months of dedicated effort. Use it in Study to push past your limits, or let the season pass.',
    decayTime: 90000
  });

  // ================================================================
  //  IDENTITY CARD
  // ================================================================

  def('the_gift', {
    name: 'The Gift',
    category: 'condition',
    icon: '✧',
    aspects: ['magic', 'condition'],
    level: 1,
    flavor: 'You have always seen what others cannot. The world shimmers at its edges. This is your blessing and your curse.',
    permanent: true
  });

  // ================================================================
  //  COMPANION CARDS
  // ================================================================

  def('curious_youth', {
    name: 'A Curious Youth',
    category: 'companion',
    icon: '👤',
    aspects: ['companion', 'reason'],
    level: 1,
    flavor: 'Sharp-eyed and quick-witted. He asks too many questions, but some of them are the right ones.'
  });

  def('faithful_grog', {
    name: 'A Faithful Grog',
    category: 'companion',
    icon: '👤',
    aspects: ['companion', 'vigor'],
    level: 1,
    flavor: 'A sturdy soul who does not ask what you do behind closed doors. Loyalty is its own kind of magic.'
  });

  def('hedge_witch', {
    name: 'A Hedge Witch',
    category: 'companion',
    icon: '👤',
    aspects: ['companion', 'herbam', 'lore'],
    level: 1,
    flavor: 'She knows the old ways — herb-craft and moon-signs. The Order would call her a hedge wizard. She would call them fools.'
  });

  def('wandering_magus', {
    name: 'A Wandering Magus',
    category: 'companion',
    icon: '👤',
    aspects: ['companion', 'magic', 'lore'],
    level: 2,
    flavor: 'A member of the Order, traveling incognito. His eyes hold the weight of centuries. He may teach you — if you prove worthy.'
  });

  // ================================================================
  //  LOCATION CARDS
  // ================================================================

  def('standing_stones', {
    name: 'A Clearing of Standing Stones',
    category: 'location',
    icon: '⌂',
    aspects: ['location', 'magic', 'vis'],
    level: 2,
    flavor: 'The stones hum at dawn. Vis pools in the dew between them. This place has been sacred since before the Romans.'
  });

  def('ruined_chapel', {
    name: 'A Ruined Chapel',
    category: 'location',
    icon: '⌂',
    aspects: ['location', 'infernal'],
    level: 1,
    flavor: 'Once holy ground. The altar is cracked and something dark has seeped into the foundations. Prayers echo wrong here.'
  });

  def('silver_wood', {
    name: 'The Silver Wood',
    category: 'location',
    icon: '⌂',
    aspects: ['location', 'faerie', 'herbam'],
    level: 2,
    flavor: 'Trees with bark like polished metal. Time runs strangely here — a day in the wood may cost you a month outside.'
  });

  def('hidden_cave', {
    name: 'A Hidden Cave',
    category: 'location',
    icon: '⌂',
    aspects: ['location', 'magic', 'terram'],
    level: 3,
    flavor: 'Deep and dry, the walls glitter with crystallized vis. The air tastes of old power. A good place for a laboratory.'
  });

  def('crossroads_inn', {
    name: 'The Crossroads Inn',
    category: 'location',
    icon: '⌂',
    aspects: ['location', 'coin'],
    level: 1,
    flavor: 'Travelers pass through bearing rumors. The innkeeper asks no questions. The wine is terrible but the information is good.'
  });

  def('covenant_ruins', {
    name: 'Ruins of a Covenant',
    category: 'location',
    icon: '⌂',
    aspects: ['location', 'magic', 'lore'],
    level: 3,
    flavor: 'Once a sanctum of the Order. The Aegis has long faded. Books may remain in the collapsed library. So might whatever destroyed it.'
  });

  // ================================================================
  //  SPELL CARDS
  // ================================================================

  def('spell_palm_of_flame', {
    name: 'Palm of Flame',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'creo', 'ignem'],
    level: 1,
    flavor: 'A small fire dances on your palm. It does not burn you. It will burn others.'
  });

  def('spell_eyes_of_the_cat', {
    name: 'Eyes of the Cat',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'muto', 'corpus', 'animal'],
    level: 1,
    flavor: 'Your pupils slit vertically. You see in darkness as clearly as day. Cats regard you with new respect.'
  });

  def('spell_whispers_through_walls', {
    name: 'Whispers Through Walls',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'intellego', 'imaginem'],
    level: 1,
    flavor: 'Stone becomes transparent to sound. Every secret spoken behind closed doors reaches your ears.'
  });

  def('spell_physicians_eye', {
    name: 'Physician\'s Eye',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'intellego', 'corpus'],
    level: 1,
    flavor: 'With a glance, you diagnose every ailment. The body reveals its complaints to you in vivid detail.'
  });

  def('spell_ward_against_rain', {
    name: 'Ward Against Rain',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'rego', 'auram'],
    level: 1,
    flavor: 'Raindrops curve around you. You arrive dry everywhere. A small magic, but a satisfying one.'
  });

  def('spell_pilum_of_fire', {
    name: 'Pilum of Fire',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'creo', 'ignem'],
    level: 3,
    flavor: 'A lance of white-hot flame hurls from your outstretched hand. The Flambeau call this the "journeyman\'s greeting."'
  });

  def('spell_aegis_of_the_hearth', {
    name: 'Aegis of the Hearth',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'rego', 'vim'],
    level: 4,
    flavor: 'A ritual that wards an entire covenant against magical intrusion. It requires vis, an entire season, and iron will.'
  });

  def('spell_the_chirurgeons_healing_touch', {
    name: 'The Chirurgeon\'s Touch',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'creo', 'corpus'],
    level: 2,
    flavor: 'Your hands glow with soft light. Wounds close, bones knit. The patient gasps — then breathes easy.'
  });

  def('spell_veil_of_invisibility', {
    name: 'Veil of Invisibility',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'perdo', 'imaginem'],
    level: 3,
    flavor: 'You step sideways out of sight. Light refuses to acknowledge you. Even shadows forget your shape.'
  });

  def('spell_command_the_harnessed_beast', {
    name: 'Command the Harnessed Beast',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'rego', 'animal'],
    level: 2,
    flavor: 'Horses that would throw a Gifted rider now stand docile. The beast obeys not from love, but from absolute compulsion.'
  });

  // ================================================================
  //  MYSTERY CARDS
  // ================================================================

  def('mystery_enigma_1', {
    name: 'The First Mark',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'vim', 'condition'],
    level: 1,
    mysteryPath: 'enigma',
    mysteryStep: 1,
    flavor: 'Strange symbols appear on your skin as you sleep. They do not wash away. In certain light, they seem to move.'
  });

  def('mystery_enigma_2', {
    name: 'The Twisted Shadow',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'vim', 'mentem'],
    level: 2,
    mysteryPath: 'enigma',
    mysteryStep: 2,
    flavor: 'In caves, your shadow moves independently. It beckons you deeper. You are beginning to understand what Criamon sought.'
  });

  def('mystery_enigma_3', {
    name: 'The Paradox of Empedocles',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'vim', 'mentem', 'lore'],
    level: 3,
    mysteryPath: 'enigma',
    mysteryStep: 3,
    flavor: 'Love and Strife are not opposites but faces of the same coin. Time is the wound; the Enigma is the scar that heals it.'
  });

  def('mystery_enigma_4', {
    name: 'The Enigma Revealed',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'vim', 'mentem', 'magic'],
    level: 4,
    mysteryPath: 'enigma',
    mysteryStep: 4,
    flavor: 'Time is a wound. You have learned to walk between its edges. The Twilight is not an ending — it is a door, and you hold the key.'
  });

  def('mystery_heartbeast_1', {
    name: 'The Beast Within',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'animal', 'corpus'],
    level: 1,
    mysteryPath: 'heartbeast',
    mysteryStep: 1,
    flavor: 'You dream of running on four legs through an ancient forest. The dream bleeds into waking. Fur sprouts on your knuckles at dawn.'
  });

  def('mystery_heartbeast_2', {
    name: 'The Call of Crintera',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'animal', 'companion'],
    level: 2,
    mysteryPath: 'heartbeast',
    mysteryStep: 2,
    flavor: 'A woman with hawk\'s eyes appears at your door. She asks what animal you most fear. "That," she says, "is what you truly are."'
  });

  def('mystery_heartbeast_3', {
    name: 'The Clan Choosing',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'animal', 'mentem'],
    level: 3,
    mysteryPath: 'heartbeast',
    mysteryStep: 3,
    flavor: 'Six paths diverge before you. Arelie, Ilfetu, Maruhs, Midusulf, Sirnas, Wilkis. Each demands a different sacrifice. Each offers a different beast.'
  });

  def('mystery_heartbeast_4', {
    name: 'Heartbeast Awakened',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'animal', 'corpus', 'magic'],
    level: 4,
    mysteryPath: 'heartbeast',
    mysteryStep: 4,
    flavor: 'You are no longer one thing. You are two, and they are the same. The transformation is not a spell — it is a truth you have finally accepted.'
  });

  def('mystery_artifice_1', {
    name: 'The Casting Tools',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'terram', 'item'],
    level: 1,
    mysteryPath: 'artifice',
    mysteryStep: 1,
    flavor: 'Your hands ache to shape something. Raw materials whisper their potential. Iron wants to become a blade. Wood wants to become a wand.'
  });

  def('mystery_artifice_2', {
    name: 'The Contest of Forms',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'terram', 'ignem'],
    level: 2,
    mysteryPath: 'artifice',
    mysteryStep: 2,
    flavor: 'A letter arrives sealed with a bronze sigil. An invitation to prove your craft. The other entrants are centuries old.'
  });

  def('mystery_artifice_3', {
    name: 'The Inner Mystery',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'terram', 'vim'],
    level: 3,
    mysteryPath: 'artifice',
    mysteryStep: 3,
    flavor: 'The item you create is more than an object. It has preferences. It has moods. You begin to suspect it has a soul.'
  });

  def('mystery_artifice_4', {
    name: 'Hubris of the Maker',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'terram', 'vim', 'magic'],
    level: 4,
    mysteryPath: 'artifice',
    mysteryStep: 4,
    flavor: 'You understand now: everything is an item waiting to be enchanted. The world itself is raw material. Even the stars.'
  });

  def('mystery_arcadia_1', {
    name: 'The Faerie Road',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'faerie', 'herbam'],
    level: 1,
    mysteryPath: 'arcadia',
    mysteryStep: 1,
    flavor: 'Mushrooms grow in a perfect circle in your laboratory. They were not there yesterday. They smell of elsewhere.'
  });

  def('mystery_arcadia_2', {
    name: 'The Bargain',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'faerie', 'mentem'],
    level: 2,
    mysteryPath: 'arcadia',
    mysteryStep: 2,
    flavor: 'A voice from behind an oak offers something precious. Its price seems reasonable. Seems. The fae never lie, but truth is not their native tongue.'
  });

  def('mystery_arcadia_3', {
    name: 'The Glamour',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'faerie', 'imaginem'],
    level: 3,
    mysteryPath: 'arcadia',
    mysteryStep: 3,
    flavor: 'You begin to see the stories woven into everything. Some stories see you back. Reality is a narrative, and you are learning to edit.'
  });

  def('mystery_arcadia_4', {
    name: 'The Arcadian Gate',
    category: 'mystery',
    icon: '❋',
    aspects: ['mystery', 'faerie', 'imaginem', 'magic'],
    level: 4,
    mysteryPath: 'arcadia',
    mysteryStep: 4,
    flavor: 'You step through and your blood becomes starlight. Was that the right door? It doesn\'t matter. There are no wrong doors in Arcadia — only unexpected ones.'
  });

  // ================================================================
  //  THREAT CARDS
  // ================================================================

  def('threat_curious_priest', {
    name: 'A Curious Priest',
    category: 'threat',
    icon: '⚠',
    aspects: ['threat', 'divine'],
    level: 1,
    flavor: 'He asks too many questions about your experiments. His smile does not reach his eyes. He writes letters to the Bishop.',
    threatType: 'notoriety',
    threatAmount: 1
  });

  def('threat_infernal_whisper', {
    name: 'Whispers of the Infernal',
    category: 'threat',
    icon: '⚠',
    aspects: ['threat', 'infernal'],
    level: 2,
    flavor: 'A beautiful stranger offers shortcuts to power. The cost is not mentioned. The contract is written in a language older than Latin.',
    threatType: 'corruption',
    threatAmount: 2
  });

  def('threat_quaesitor', {
    name: 'The Quaesitor\'s Gaze',
    category: 'threat',
    icon: '⚠',
    aspects: ['threat', 'magic'],
    level: 2,
    flavor: 'The Order is watching. Your recent activities have drawn attention from House Guernicus. An investigator has been dispatched.',
    threatType: 'notoriety',
    threatAmount: 2
  });

  def('threat_warping_tremor', {
    name: 'A Warping Tremor',
    category: 'threat',
    icon: '⚠',
    aspects: ['threat', 'condition', 'vim'],
    level: 1,
    flavor: 'Reality shivers around you. Your reflection moves a heartbeat after you do. The world is beginning to reject you.',
    threatType: 'warping',
    threatAmount: 1
  });

  def('threat_twilight_beckons', {
    name: 'Twilight Beckons',
    category: 'threat',
    icon: '⚠',
    aspects: ['threat', 'condition', 'magic'],
    level: 3,
    flavor: 'The boundary between worlds thins to gossamer. Something vast and luminous reaches for you. It knows your name.',
    threatType: 'warping',
    threatAmount: 2
  });

  def('threat_suspicious_villagers', {
    name: 'Suspicious Villagers',
    category: 'threat',
    icon: '⚠',
    aspects: ['threat'],
    level: 1,
    flavor: 'They mutter when you pass. Children are kept indoors. The blacksmith makes the sign of the cross. This cannot end well.',
    threatType: 'notoriety',
    threatAmount: 1
  });

  def('threat_rival_magus', {
    name: 'A Rival Magus',
    category: 'threat',
    icon: '⚠',
    aspects: ['threat', 'magic', 'companion'],
    level: 2,
    flavor: 'Another wizard has claimed this territory. He challenges you to Certamen — or worse. House Tytalus breeds them ambitious.',
    threatType: 'notoriety',
    threatAmount: 1
  });

  // ================================================================
  //  CONDITION CARDS
  // ================================================================

  def('twilight_scar_minor', {
    name: 'Twilight Scar',
    category: 'condition',
    icon: '◉',
    aspects: ['condition', 'magic'],
    level: 1,
    permanent: true,
    flavor: 'A mark from brushing with infinity. Your eyes shimmer faintly in darkness. It is beautiful, and it is wrong.'
  });

  def('twilight_scar_knowledge', {
    name: 'Twilight Insight',
    category: 'condition',
    icon: '◉',
    aspects: ['condition', 'magic', 'lore'],
    level: 2,
    permanent: true,
    flavor: 'You returned from the Twilight with knowledge you did not seek. It sits in your mind like a foreign object, slowly becoming familiar.'
  });

  def('longevity_ritual', {
    name: 'Longevity Ritual',
    category: 'condition',
    icon: '◉',
    aspects: ['condition', 'corpus', 'vim'],
    level: 2,
    permanent: true,
    flavor: 'You will not age as mortals do. The ritual demands vis each year, and children are now beyond you. A fair trade, most days.'
  });

  def('parma_magica', {
    name: 'Parma Magica',
    category: 'condition',
    icon: '◉',
    aspects: ['condition', 'vim', 'magic'],
    level: 2,
    permanent: true,
    flavor: 'The shield of the mind, Bonisagus\'s gift to the Order. Foreign magic slides off you like rain. Other magi\'s Gifts no longer unsettle you.'
  });

  // ================================================================
  //  ITEM CARDS
  // ================================================================

  def('enchanted_ring', {
    name: 'A Ring of Warming',
    category: 'resource',
    icon: '⚒',
    aspects: ['item', 'ignem'],
    level: 1,
    flavor: 'A copper ring set with a garnet. It keeps the wearer comfortable in any cold. A small enchantment, but a proud first creation.'
  });

  def('wand_of_fire', {
    name: 'Wand of Abrupt Flame',
    category: 'resource',
    icon: '⚒',
    aspects: ['item', 'creo', 'ignem'],
    level: 2,
    flavor: 'Ash wood, carved with sigils of Ignem. Point and speak the word. Fire obeys. Three charges remain.'
  });

  def('talisman_unfinished', {
    name: 'An Unfinished Talisman',
    category: 'resource',
    icon: '⚒',
    aspects: ['item', 'vim'],
    level: 1,
    flavor: 'A personal magical focus, half-complete. It yearns for enchantment the way a blank page yearns for ink.'
  });

  // ================================================================
  //  ADDITIONAL TEXT CARDS — For discovery variety
  // ================================================================

  def('tractatus_intellego', {
    name: 'Liber Perspicaciae',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'intellego'],
    level: 1,
    flavor: 'A treatise on the sharpening of magical perception. The margins contain detailed sketches of eyes within eyes.'
  });

  def('tractatus_creo', {
    name: 'Ars Creationis',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'creo'],
    level: 1,
    flavor: 'A primer on the Art of Creation. The ink seems fresher than the parchment suggests. The words appear to rewrite themselves.'
  });

  def('tractatus_rego', {
    name: 'De Dominatu',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'rego'],
    level: 1,
    flavor: 'A stern text on the Art of Control. Reading it fills you with an unusual sense of certainty. Objects near the book align themselves.'
  });

  def('tractatus_muto', {
    name: 'Metamorphoses Hermeticae',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'muto'],
    level: 1,
    flavor: 'The text shifts between Latin and Greek between readings. The author may have been two people, or one person in two shapes.'
  });

  def('tractatus_perdo', {
    name: 'Ars Oblivionis',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'perdo'],
    level: 1,
    flavor: 'Some pages are blank — not unwritten, but erased. The remaining text teaches the Art of Unmaking with terrible clarity.'
  });

  def('tractatus_animal', {
    name: 'Bestiarum Arcanum',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'animal'],
    level: 1,
    flavor: 'Illuminated with beasts both real and impossible. The wolf illustration growls softly when the page is turned.'
  });

  def('tractatus_auram', {
    name: 'Libellus Tempestatum',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'auram'],
    level: 1,
    flavor: 'A monograph on the nature of winds and storms. Reading it outdoors is inadvisable, as the weather tends to respond.'
  });

  def('tractatus_aquam', {
    name: 'De Fluviis et Maribus',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'aquam'],
    level: 1,
    flavor: 'Written on waterproof vellum by a magus of Aquam. The pages are perpetually damp. The binding smells of salt.'
  });

  def('tractatus_terram', {
    name: 'Fundamenta Mundi',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'terram'],
    level: 1,
    flavor: 'A study of earth, stone, and metal by a Verditius smith. Each chapter ends with a recipe for something impossible.'
  });

  def('tractatus_imaginem', {
    name: 'Speculum Veritatis',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'imaginem'],
    level: 1,
    flavor: 'A philosophical inquiry into the nature of perception. The cover illustration is a mirror that shows a face that is not yours.'
  });

  def('tractatus_vim_advanced', {
    name: 'Principia Arcana Superiora',
    category: 'text',
    icon: '📖',
    aspects: ['text', 'vim', 'lore'],
    level: 3,
    flavor: 'An advanced Summa on Vim, written by a Bonisagus theorist who vanished into Final Twilight. Her last annotations glow faintly blue.'
  });

  // ================================================================
  //  ADDITIONAL SPELL CARDS
  // ================================================================

  def('spell_lamp_without_flame', {
    name: 'Lamp Without Flame',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'creo', 'ignem'],
    level: 1,
    flavor: 'Light without heat, illumination without fuel. A humble spell, but the first proof that you are a wizard.'
  });

  def('spell_rise_of_the_feathery_body', {
    name: 'Rise of the Feathery Body',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'rego', 'corpus'],
    level: 2,
    flavor: 'You float upward like thistledown. The ground recedes. For a breathless moment, you understand why birds sing.'
  });

  def('spell_demon_eternal_oblivion', {
    name: 'Demon\'s Eternal Oblivion',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'perdo', 'vim'],
    level: 3,
    flavor: 'A banishing word that unravels infernal essence. Demons fear this spell more than prayer. It leaves nothing behind — not even a scream.'
  });

  def('spell_wizards_communion', {
    name: 'Wizard\'s Communion',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'muto', 'vim'],
    level: 2,
    flavor: 'Multiple magi join their power. What one cannot accomplish alone, many may achieve together. The ritual is ancient — older than the Order itself.'
  });

  def('spell_panic_of_the_trembling_heart', {
    name: 'Panic of the Trembling Heart',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'creo', 'mentem'],
    level: 2,
    flavor: 'You project pure terror into a mind. The target flees. Some never fully recover their courage.'
  });

  def('spell_aura_of_ennobled_presence', {
    name: 'Aura of Ennobled Presence',
    category: 'spell',
    icon: '★',
    aspects: ['spell', 'muto', 'imaginem'],
    level: 2,
    flavor: 'You appear noble, commanding, worthy of respect. Even those who suspect sorcery find it hard not to defer.'
  });

  // ================================================================
  //  EXPANSION: NEW SPELL CARDS (25 named spells)
  // ================================================================

  // -- Creo Spells --
  def('spell_purification_of_wounds', {
    name: 'Purification of Wounds',
    category: 'spell', icon: '★',
    aspects: ['spell', 'creo', 'corpus'],
    level: 2,
    flavor: 'The flesh remembers what it should be. Under your hands, it returns.'
  });
  def('spell_conjure_mystic_tower', {
    name: 'Conjure the Mystic Tower',
    category: 'spell', icon: '★',
    aspects: ['spell', 'creo', 'terram'],
    level: 4,
    flavor: 'Stone rises from nothing, obeying the Art alone. A tower for the ages, conjured in a day.'
  });
  def('spell_incantation_of_lightning', {
    name: 'Incantation of Lightning',
    category: 'spell', icon: '★',
    aspects: ['spell', 'creo', 'auram'],
    level: 3,
    flavor: 'The sky splits. Your enemies do not rise.'
  });
  def('spell_bountiful_feast', {
    name: 'The Bountiful Feast',
    category: 'spell', icon: '★',
    aspects: ['spell', 'creo', 'herbam'],
    level: 2,
    flavor: 'Where there was famine, now abundance. Even the mice grow fat.'
  });
  def('spell_circle_of_life_renewed', {
    name: 'Circle of Life Renewed',
    category: 'spell', icon: '★',
    aspects: ['spell', 'creo', 'corpus'],
    level: 5,
    flavor: 'Death itself hesitates at your door. You have spoken, and life answers.'
  });

  // -- Intellego Spells --
  def('spell_sight_beyond_sight', {
    name: 'Sight Beyond Sight',
    category: 'spell', icon: '★',
    aspects: ['spell', 'intellego', 'vim'],
    level: 2,
    flavor: 'You see what the world has chosen to conceal. It is not always grateful.'
  });
  def('spell_whispers_of_the_land', {
    name: 'Whispers of the Land',
    category: 'spell', icon: '★',
    aspects: ['spell', 'intellego', 'terram'],
    level: 2,
    flavor: 'Every stone has a story. You learn to listen.'
  });
  def('spell_ear_of_the_inquisitor', {
    name: 'The Ear of the Inquisitor',
    category: 'spell', icon: '★',
    aspects: ['spell', 'intellego', 'mentem'],
    level: 3,
    flavor: 'Their thoughts betray their plans. You hear what they dare not speak.'
  });
  def('spell_piercing_the_faerie_veil', {
    name: 'Piercing the Faerie Veil',
    category: 'spell', icon: '★',
    aspects: ['spell', 'intellego', 'vim'],
    level: 3,
    flavor: 'The veil thins. Colors grow strange. Between one blink and the next, Arcadia.'
  });
  def('spell_eyes_of_the_omniscient', {
    name: 'Eyes of the Omniscient',
    category: 'spell', icon: '★',
    aspects: ['spell', 'intellego', 'vim'],
    level: 5,
    flavor: 'For an instant, you see every thread of fate. It is beautiful. It is terrible.'
  });

  // -- Muto Spells --
  def('spell_gift_of_bears_fortitude', {
    name: 'Gift of the Bear\'s Fortitude',
    category: 'spell', icon: '★',
    aspects: ['spell', 'muto', 'corpus'],
    level: 3,
    flavor: 'Your skin hardens. Pain becomes memory. You endure what would break a lesser body.'
  });
  def('spell_cloak_of_many_forms', {
    name: 'Cloak of Many Forms',
    category: 'spell', icon: '★',
    aspects: ['spell', 'muto', 'animal'],
    level: 3,
    flavor: 'Fur or feather or scale — you are all of these. The boundary between shapes dissolves.'
  });
  def('spell_transformation_ravenous_beast', {
    name: 'Transformation of the Ravenous Beast',
    category: 'spell', icon: '★',
    aspects: ['spell', 'muto', 'animal'],
    level: 4,
    flavor: 'The beast that hunted you now guards your door. Enemies become allies — willing or not.'
  });
  def('spell_protean_crucible', {
    name: 'The Protean Crucible',
    category: 'spell', icon: '★',
    aspects: ['spell', 'muto', 'vim'],
    level: 5,
    flavor: 'Matter bows to the Art. Lead dreams of gold. You grant its wish.'
  });

  // -- Perdo Spells --
  def('spell_touch_of_winter', {
    name: 'Touch of Winter',
    category: 'spell', icon: '★',
    aspects: ['spell', 'perdo', 'ignem'],
    level: 2,
    flavor: 'Warmth flees. Motion ceases. Time itself seems to slow near your fingers.'
  });
  def('spell_curse_of_rotted_wood', {
    name: 'Curse of the Rotted Wood',
    category: 'spell', icon: '★',
    aspects: ['spell', 'perdo', 'herbam'],
    level: 2,
    flavor: 'What was built crumbles. What was grown withers. Entropy is your instrument.'
  });
  def('spell_wind_of_mundane_silence', {
    name: 'Wind of Mundane Silence',
    category: 'spell', icon: '★',
    aspects: ['spell', 'perdo', 'vim'],
    level: 3,
    flavor: 'Magic unravels. The air tastes of nothing. A silence that devours enchantment.'
  });
  def('spell_the_unmaking_word', {
    name: 'The Unmaking Word',
    category: 'spell', icon: '★',
    aspects: ['spell', 'perdo', 'vim'],
    level: 4,
    flavor: 'A word that should not be spoken. You speak it anyway. Something ceases to exist.'
  });

  // -- Rego Spells --
  def('spell_ward_against_beasts', {
    name: 'Ward Against Beasts',
    category: 'spell', icon: '★',
    aspects: ['spell', 'rego', 'animal'],
    level: 2,
    flavor: 'They circle but cannot approach. The ward holds, and the wild respects it.'
  });
  def('spell_circular_ward_demons', {
    name: 'Circular Ward Against Demons',
    category: 'spell', icon: '★',
    aspects: ['spell', 'rego', 'vim'],
    level: 3,
    flavor: 'The circle holds. The darkness snarls. As long as the line is unbroken, you are safe.'
  });
  def('spell_lifting_the_dangling_puppet', {
    name: 'Lifting the Dangling Puppet',
    category: 'spell', icon: '★',
    aspects: ['spell', 'rego', 'corpus'],
    level: 3,
    flavor: 'Their limbs are yours. A kindness, really — you know better than they do.'
  });
  def('spell_dominion_absolute', {
    name: 'Dominion Absolute',
    category: 'spell', icon: '★',
    aspects: ['spell', 'rego', 'mentem'],
    level: 5,
    flavor: 'All kneel. Not from fear — from inevitability. Your will is the only will that matters.'
  });

  // ================================================================
  //  EXPANSION: NEW ENCHANTED ITEMS (10)
  // ================================================================

  def('item_ring_of_warding', {
    name: 'Ring of Warding',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'rego', 'vim'],
    level: 3,
    passive: 'threat_timer_reduction',
    flavor: 'Cold iron, etched with signs older than speech. Threats seem to hesitate around you.'
  });
  def('item_orb_of_divination', {
    name: 'Orb of Divination',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'intellego', 'vim'],
    level: 3,
    passive: 'reveal_next_threat',
    flavor: 'Clouds swirl within. Futures condense. You see what is coming.'
  });
  def('item_cloak_of_invisibility', {
    name: 'Cloak of Invisibility',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'perdo', 'imaginem'],
    level: 3,
    passive: 'notoriety_reduction',
    flavor: 'You are there. You are not. Both are true.'
  });
  def('item_staff_of_elements', {
    name: 'Staff of the Elements',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'creo', 'vim'],
    level: 4,
    passive: 'work_bonus',
    flavor: 'Five woods, bound with silver. It hums with potential.'
  });
  def('item_longevity_elixir', {
    name: 'The Longevity Elixir',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'creo', 'corpus'],
    level: 4,
    passive: 'vigor_protection',
    flavor: 'Youth preserved in a crystal vial. Drink sparingly.'
  });
  def('item_talisman_of_art', {
    name: 'Talisman of the Art',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'vim', 'magic'],
    level: 4,
    passive: 'art_boost',
    flavor: 'An extension of your will, wrought in silver and bone.'
  });
  def('item_automaton_servant', {
    name: 'Automaton Servant',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'rego', 'terram'],
    level: 5,
    passive: 'extra_action',
    flavor: 'Clay given purpose. It serves without complaint.'
  });
  def('item_necromancers_grimoire', {
    name: 'Necromancer\'s Grimoire',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'perdo', 'corpus'],
    level: 4,
    passive: 'study_threats',
    flavor: 'The dead have much to teach, if you dare listen.'
  });
  def('item_traveling_laboratory', {
    name: 'The Traveling Laboratory',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'rego', 'terram'],
    level: 4,
    passive: 'mobile_work',
    flavor: 'Your laboratory folds into a satchel. Convenient.'
  });
  def('item_gargoyle_guardian', {
    name: 'Gargoyle Guardian',
    category: 'resource', icon: '⚒',
    aspects: ['item', 'creo', 'terram'],
    level: 4,
    passive: 'auto_threat_defense',
    flavor: 'Stone wings unfurl at midnight. Something screams.'
  });

  // ================================================================
  //  EXPANSION: NEW LOCATIONS (10)
  // ================================================================

  def('basilica_of_columns', {
    name: 'Basilica of Ten Thousand Columns',
    category: 'location', icon: '⌂',
    aspects: ['location', 'magic', 'lore'],
    level: 5, aura: 6,
    flavor: 'Columns beyond counting. Each one inscribed with a different name of power.'
  });
  def('pompeii_regio', {
    name: 'Pompeii Regio',
    category: 'location', icon: '⌂',
    aspects: ['location', 'magic', 'ignem', 'terram'],
    level: 4, aura: 5,
    flavor: 'Frozen in ash, yet alive in the regio. The dead still argue in the forum.'
  });
  def('garden_of_hesperides', {
    name: 'The Garden of Hesperides',
    category: 'location', icon: '⌂',
    aspects: ['location', 'faerie', 'herbam'],
    level: 5, aura: 7,
    flavor: 'Golden apples hang heavy. The serpent watches.'
  });
  def('witch_of_endor_cave', {
    name: 'The Witch of En-Dor\'s Cave',
    category: 'location', icon: '⌂',
    aspects: ['location', 'infernal', 'corpus'],
    level: 3, aura: 3,
    flavor: 'She asks what name to call. You wonder if you should answer.'
  });
  def('sacred_grove_dindymene', {
    name: 'Dindyméné — The Sacred Grove',
    category: 'location', icon: '⌂',
    aspects: ['location', 'magic', 'herbam', 'animal'],
    level: 4, aura: 4,
    flavor: 'The Daktyls still dance here. Small, fierce, and ancient.'
  });
  def('sunken_library', {
    name: 'The Sunken Library',
    category: 'location', icon: '⌂',
    aspects: ['location', 'magic', 'aquam'],
    level: 4, aura: 5,
    flavor: 'Salt-crusted shelves. The ink still legible. How?'
  });
  def('dragons_hoard', {
    name: 'The Dragon\'s Hoard',
    category: 'location', icon: '⌂',
    aspects: ['location', 'magic', 'ignem', 'animal'],
    level: 5, aura: 7,
    flavor: 'Gold beyond measure. Its guardian merely sleeps.'
  });
  def('apollos_sanctuary', {
    name: 'Apollo\'s Sanctuary',
    category: 'location', icon: '⌂',
    aspects: ['location', 'divine'],
    level: 3, aura: 3,
    flavor: 'Sunlight that should not exist underground. It heals.'
  });
  def('purgatory_pass', {
    name: 'Purgatory Pass',
    category: 'location', icon: '⌂',
    aspects: ['location', 'divine', 'infernal'],
    level: 4, aura: 4,
    flavor: 'The mountain tests your soul. You will not be the same after.'
  });
  def('tower_of_babel_ruins', {
    name: 'Tower of Babel Ruins',
    category: 'location', icon: '⌂',
    aspects: ['location', 'magic', 'mentem', 'vim'],
    level: 5, aura: 5,
    flavor: 'Words that predate language. Words that built the world.'
  });

  // ================================================================
  //  EXPANSION: NEW COMPANIONS (8)
  // ================================================================

  def('companion_crusader_knight', {
    name: 'The Crusader Knight',
    category: 'companion', icon: '👤',
    aspects: ['companion', 'divine', 'vigor'],
    level: 2,
    passive: 'block_mundane_threat',
    flavor: 'His sword has seen Jerusalem. He asks no questions.'
  });
  def('companion_faerie_changeling', {
    name: 'The Faerie Changeling',
    category: 'companion', icon: '👤',
    aspects: ['companion', 'faerie', 'imaginem'],
    level: 2,
    passive: 'faerie_explore_bonus',
    flavor: 'They left this one behind. Or was it sent?'
  });
  def('companion_ghostly_scholar', {
    name: 'The Ghostly Scholar',
    category: 'companion', icon: '👤',
    aspects: ['companion', 'magic', 'lore', 'mentem'],
    level: 3,
    passive: 'study_without_consume',
    flavor: 'He died mid-sentence. He would like to finish.'
  });
  def('companion_repentant_diabolist', {
    name: 'The Repentant Diabolist',
    category: 'companion', icon: '👤',
    aspects: ['companion', 'infernal', 'lore'],
    level: 2,
    passive: 'corruption_reduction',
    flavor: 'She knows the names of seven demons. She prays they forget hers.'
  });
  def('companion_runecaster', {
    name: 'The Runecaster',
    category: 'companion', icon: '👤',
    aspects: ['companion', 'magic', 'lore', 'vim'],
    level: 2,
    passive: 'item_creation_bonus',
    flavor: 'His tattoos move when he speaks.'
  });
  def('companion_travelling_merchant', {
    name: 'The Travelling Merchant',
    category: 'companion', icon: '👤',
    aspects: ['companion', 'coin'],
    level: 1,
    passive: 'coin_per_season',
    flavor: 'He sells everything. Everything. Ask carefully.'
  });
  def('companion_hungry_familiar', {
    name: 'A Hungry Familiar',
    category: 'companion', icon: '👤',
    aspects: ['companion', 'animal', 'vim', 'magic'],
    level: 3,
    passive: 'dream_bonus',
    flavor: 'It eats vis like candy and purrs like an earthquake.'
  });

  // ================================================================
  //  EXPANSION: NEW MYSTERY PATH CARDS
  // ================================================================

  // -- Path of Necromancy --
  def('mystery_necromancy_1', {
    name: 'Voice Beyond the Veil',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'perdo', 'corpus'],
    level: 1, mysteryPath: 'necromancy', mysteryStep: 1,
    flavor: 'They answer, but grudgingly. The dead resent being disturbed.'
  });
  def('mystery_necromancy_2', {
    name: 'The Sho\'elim\'s Art',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'perdo', 'mentem'],
    level: 2, mysteryPath: 'necromancy', mysteryStep: 2,
    flavor: 'Names hold power over death. You speak them, and the graves listen.'
  });
  def('mystery_necromancy_3', {
    name: 'Anat\'s Search in the Abyss',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'perdo', 'vim'],
    level: 3, mysteryPath: 'necromancy', mysteryStep: 3,
    flavor: 'You walk where Anat walked. The underworld is cold, and very quiet.'
  });
  def('mystery_necromancy_4', {
    name: 'Mastery Over Death',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'perdo', 'corpus', 'magic'],
    level: 4, mysteryPath: 'necromancy', mysteryStep: 4,
    flavor: 'Death is a door. You hold the key. What you do with it will define you.'
  });

  // -- Path of the Runes --
  def('mystery_runes_1', {
    name: 'Fehu — First Rune',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'vim', 'terram'],
    level: 1, mysteryPath: 'runes', mysteryStep: 1,
    flavor: 'Wealth. But whose? The rune burns itself into your memory.'
  });
  def('mystery_runes_2', {
    name: 'Thurisaz — Thorn',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'vim', 'rego'],
    level: 2, mysteryPath: 'runes', mysteryStep: 2,
    flavor: 'A boundary against chaos. The rune cuts your palm as you draw it.'
  });
  def('mystery_runes_3', {
    name: 'Ansuz — Odin\'s Breath',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'vim', 'mentem'],
    level: 3, mysteryPath: 'runes', mysteryStep: 3,
    flavor: 'Wisdom bought with sacrifice. What will you give for what you seek?'
  });
  def('mystery_runes_4', {
    name: 'Algiz — Divine Shield',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'vim', 'magic'],
    level: 4, mysteryPath: 'runes', mysteryStep: 4,
    flavor: 'Protected by forces older than the Order. The runes remember what men forget.'
  });

  // -- Path of the Hyperborean Hymns --
  def('mystery_hymns_1', {
    name: 'First Hymn — The Whisper',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'imaginem', 'vim'],
    level: 1, mysteryPath: 'hymns', mysteryStep: 1,
    flavor: 'A note that makes stone weep. You hear it in your dreams.'
  });
  def('mystery_hymns_2', {
    name: 'Second Hymn — The Chorus',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'imaginem', 'mentem'],
    level: 2, mysteryPath: 'hymns', mysteryStep: 2,
    flavor: 'Voices join yours from across centuries. You are not singing alone.'
  });
  def('mystery_hymns_3', {
    name: 'Third Hymn — The Thundersong',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'imaginem', 'auram'],
    level: 3, mysteryPath: 'hymns', mysteryStep: 3,
    flavor: 'Mountains move. Seas part. The world trembles at your voice.'
  });
  def('mystery_hymns_4', {
    name: 'The Hymn Primordial',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'imaginem', 'vim', 'magic'],
    level: 4, mysteryPath: 'hymns', mysteryStep: 4,
    flavor: 'You sing the song that began the world. Reality reshapes itself around your voice.'
  });

  // -- Path of the Body (Criamon branch) --
  def('mystery_body_1', {
    name: 'The Perfect Tool',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'corpus', 'creo'],
    level: 1, mysteryPath: 'body', mysteryStep: 1,
    flavor: 'Your hands know before your mind. Flesh becomes instrument.'
  });
  def('mystery_body_2', {
    name: 'Spiritual Nourishment',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'corpus', 'vim'],
    level: 2, mysteryPath: 'body', mysteryStep: 2,
    flavor: 'You eat starlight now. The body transcends its animal needs.'
  });
  def('mystery_body_3', {
    name: 'Economy of Movement',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'corpus', 'rego'],
    level: 3, mysteryPath: 'body', mysteryStep: 3,
    flavor: 'One gesture where ten sufficed. Perfection of motion.'
  });
  def('mystery_body_4', {
    name: 'The Microcosm',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'corpus', 'magic'],
    level: 4, mysteryPath: 'body', mysteryStep: 4,
    flavor: 'Your body contains the world. All places are within you.'
  });

  // -- Path of Strife (Criamon dark branch) --
  def('mystery_strife_1', {
    name: 'Eater of Sin',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'perdo', 'mentem'],
    level: 1, mysteryPath: 'strife', mysteryStep: 1,
    flavor: 'Transgression is your sacrament. You consume darkness so others need not.'
  });
  def('mystery_strife_2', {
    name: 'Blood and Bronze',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'perdo', 'terram'],
    level: 2, mysteryPath: 'strife', mysteryStep: 2,
    flavor: 'Your strikes find every flaw. Destruction is its own art.'
  });
  def('mystery_strife_3', {
    name: 'Repel the Elements',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'rego', 'vim'],
    level: 3, mysteryPath: 'strife', mysteryStep: 3,
    flavor: 'The ground flees. You float. The elements acknowledge your dominion.'
  });
  def('mystery_strife_4', {
    name: 'Golden Cider',
    category: 'mystery', icon: '❋',
    aspects: ['mystery', 'muto', 'vim', 'magic'],
    level: 4, mysteryPath: 'strife', mysteryStep: 4,
    flavor: 'The supernatural becomes mundane. Power distilled to its essence.'
  });

})();
