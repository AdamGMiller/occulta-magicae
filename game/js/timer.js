// ============================================================
// TIMER.JS — Clock/timer system for verbs and card decay
// ============================================================

const TimerSystem = {
  timers: {},
  lastUpdate: 0,
  speedMultiplier: 1,

  create(id, duration, onComplete, onTick) {
    this.timers[id] = {
      id,
      startTime: Date.now(),
      duration, // in ms
      elapsed: 0,
      onComplete,
      onTick,
      paused: false,
      completed: false
    };
    return this.timers[id];
  },

  remove(id) {
    delete this.timers[id];
  },

  pause(id) {
    if (this.timers[id]) this.timers[id].paused = true;
  },

  resume(id) {
    if (this.timers[id]) this.timers[id].paused = false;
  },

  pauseAll() {
    for (const t of Object.values(this.timers)) t.paused = true;
  },

  resumeAll() {
    for (const t of Object.values(this.timers)) t.paused = false;
  },

  getProgress(id) {
    const t = this.timers[id];
    if (!t) return 0;
    return Math.min(1, t.elapsed / t.duration);
  },

  getRemainingSeconds(id) {
    const t = this.timers[id];
    if (!t) return 0;
    return Math.max(0, (t.duration - t.elapsed) / 1000);
  },

  update(deltaMs) {
    const adjusted = deltaMs * this.speedMultiplier;
    for (const t of Object.values(this.timers)) {
      if (t.paused || t.completed) continue;
      t.elapsed += adjusted;
      if (t.onTick) t.onTick(t);
      if (t.elapsed >= t.duration) {
        t.completed = true;
        if (t.onComplete) t.onComplete(t);
      }
    }
  },

  tick(now) {
    if (this.lastUpdate === 0) {
      this.lastUpdate = now;
      return;
    }
    const delta = now - this.lastUpdate;
    this.lastUpdate = now;
    if (!GameState.paused) {
      this.update(delta);
    }
  }
};

// Season timer constants
const SEASON_DURATION = 60000; // 60 seconds per season
