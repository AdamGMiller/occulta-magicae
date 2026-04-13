// ============================================================
// EVENTS.JS — Random event system and threat management
// ============================================================

const EventSystem = {
  eventQueue: [],

  checkSeasonalEvents() {
    const events = [];

    // Threat escalation — only at HIGH levels, low probability
    if (GameState.notoriety >= 7 && Math.random() > 0.7) {
      events.push({
        type: 'threat_escalation',
        message: 'The Inquisition draws closer. Your name has been mentioned.',
        card: 'threat_quaesitor',
        statChange: {}
      });
    }

    if (GameState.warping >= 7 && Math.random() > 0.7) {
      events.push({
        type: 'warping_event',
        message: 'The world ripples around you. Twilight is near.',
        card: 'threat_twilight_beckons',
        statChange: {}
      });
    }

    if (GameState.corruption >= 5 && Math.random() > 0.8) {
      events.push({
        type: 'infernal_temptation',
        message: 'Something stirs in the dark, whispering promises...',
        card: 'threat_infernal_whisper',
        statChange: {}
      });
    }

    // Positive events
    if (GameState.totalSeasons > 0 && GameState.totalSeasons % 5 === 0) {
      events.push({
        type: 'vis_surge',
        message: 'A surge of magical energy ripples through the land.',
        card: 'vis_vim',
        statChange: {}
      });
    }

    // Companion events
    if (GameState.totalSeasons === 10 && !GameState.flags.metMagus) {
      events.push({
        type: 'magus_encounter',
        message: 'A figure in worn robes approaches. His eyes hold ancient knowledge.',
        card: 'wandering_magus',
        statChange: {}
      });
      GameState.flags.metMagus = true;
    }

    return events;
  },

  processEvent(event) {
    const results = { notifications: [], newCards: [] };

    if (event.message) {
      results.notifications.push(event.message);
    }

    if (event.card && CardDB[event.card]) {
      const card = GameState.addCard(CardFactory.create(event.card));
      results.newCards.push(card);
    }

    if (event.statChange) {
      for (const [stat, delta] of Object.entries(event.statChange)) {
        GameState.modifyStat(stat, delta);
      }
    }

    return results;
  },

  // Natural decay of threats over time
  processNaturalDecay() {
    // Small chance each season for suspicion to decrease if low
    if (GameState.notoriety > 0 && GameState.notoriety < 5 && Math.random() > 0.7) {
      GameState.modifyStat('notoriety', -1);
      return 'Memories are short. The notoriety fades a little.';
    }
    return null;
  }
};
