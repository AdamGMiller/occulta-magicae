// ============================================================
// UI.JS — Pannable/zoomable table, pointer drag, card stacking
// ============================================================

const UI = {
  dragState: null,
  panState: null,
  zoomLevel: 1.0,
  panX: 0,
  panY: 0,
  zoomMin: 0.4,
  zoomMax: 2.0,
  zoomStep: 0.1,
  expandedStack: null,
  cardLayout: 'grid', // 'grid' or 'columns'

  init() {
    this.verbArea = document.getElementById('verb-area');
    this.cardArea = document.getElementById('card-area');
    this.notificationArea = document.getElementById('notification-area');
    this.menuOverlay = document.getElementById('menu-overlay');
    this.gameOverOverlay = document.getElementById('game-over-overlay');
    this.cardDetailOverlay = document.getElementById('card-detail-overlay');
    this.viewport = document.getElementById('table-viewport');
    this.gameTable = document.getElementById('game-table');
    this.logPanel = document.getElementById('log-panel');
    this.logEntries = document.getElementById('log-entries');
    this.logBadge = document.getElementById('log-badge');
    this.logOpen = false;
    this.logMessages = [];
    this.unreadCount = 0;

    document.getElementById('game-over-restart').addEventListener('click', () => {
      this.gameOverOverlay.classList.add('hidden');
      Game.restart();
    });
    document.getElementById('game-over-menu').addEventListener('click', () => {
      this.gameOverOverlay.classList.add('hidden');
      this.showMenu();
    });

    // Verb preview overlay
    this.verbPreviewOverlay = document.getElementById('verb-preview-overlay');
    document.getElementById('verb-preview-close').addEventListener('click', () => this.closeVerbPreview());
    document.getElementById('verb-preview-cancel').addEventListener('click', () => {
      if (this._previewVerbId != null) {
        const slotIdx = this._previewSlotIdx ?? 0;
        Game.removeCardFromSlot(this._previewVerbId, slotIdx);
      }
      this.closeVerbPreview();
    });
    document.getElementById('verb-preview-start').addEventListener('click', () => {
      this.closeVerbPreview();
      // The verb auto-starts when all slots are filled, so nothing extra needed
    });
    this.verbPreviewOverlay.addEventListener('click', (e) => {
      if (e.target === this.verbPreviewOverlay) this.closeVerbPreview();
    });
    document.getElementById('card-detail-close').addEventListener('click', () => {
      this.cardDetailOverlay.classList.add('hidden');
    });
    this.cardDetailOverlay.addEventListener('click', (e) => {
      if (e.target === this.cardDetailOverlay) this.cardDetailOverlay.classList.add('hidden');
    });
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (!this.cardDetailOverlay.classList.contains('hidden')) {
          this.cardDetailOverlay.classList.add('hidden');
        } else if (!document.getElementById('stat-tooltip').classList.contains('hidden')) {
          document.getElementById('stat-tooltip').classList.add('hidden');
        } else if (this.logOpen) {
          this.toggleLog();
        } else if (!this.menuOverlay.classList.contains('hidden')) {
          // Menu already open — do nothing
        } else {
          this.returnToMenu();
        }
      }
      // L key toggles log
      if (e.code === 'KeyL' && e.target.tagName !== 'INPUT') this.toggleLog();
    });

    // Menu button in header
    document.getElementById('menu-btn').addEventListener('click', () => this.returnToMenu());

    // Log panel toggle
    document.getElementById('log-toggle').addEventListener('click', () => this.toggleLog());
    document.getElementById('log-close').addEventListener('click', () => this.toggleLog());

    // Global pointer handlers for card drag
    document.addEventListener('pointermove', (e) => this.onPointerMove(e));
    document.addEventListener('pointerup', (e) => this.onPointerUp(e));
    document.addEventListener('pointercancel', (e) => this.onPointerUp(e));

    this.setupZoom();
    this.setupPan();
    this.setupStatTooltips();
    this.setupAspectTooltip();
    this.setupLayoutToggle();
  },

  // ================================================================
  //  CARD LAYOUT TOGGLE
  // ================================================================

  setupLayoutToggle() {
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.cardLayout = btn.dataset.layout;
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderCards();
      });
    });
  },

  // ================================================================
  //  ASPECT BADGE TOOLTIP — floating tooltip that escapes card overflow
  // ================================================================

  setupAspectTooltip() {
    const tip = document.getElementById('aspect-tooltip');
    let hideTimer = null;

    document.addEventListener('pointerover', (e) => {
      const badge = e.target.closest('.aspect-badge[data-tip]');
      if (!badge) return;
      clearTimeout(hideTimer);

      const text = badge.dataset.tip;
      if (!text) return;

      tip.textContent = text;
      tip.classList.remove('hidden');

      const rect = badge.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - 110;
      let top = rect.top - 8;
      left = Math.max(8, Math.min(left, window.innerWidth - 228));
      if (top < tip.offsetHeight + 8) {
        top = rect.bottom + 8;
      } else {
        top -= tip.offsetHeight;
      }
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    });

    document.addEventListener('pointerout', (e) => {
      const badge = e.target.closest('.aspect-badge');
      if (!badge) return;
      hideTimer = setTimeout(() => tip.classList.add('hidden'), 100);
    });
  },

  // ================================================================
  //  STAT TOOLTIPS — click status bar items for details
  // ================================================================

  statInfo: {
    warping: {
      icon: '◈',
      title: 'Warping',
      desc: 'The toll of raw magical power upon your body and soul. Every magus who wields great power accumulates Warping. At 10, the Final Twilight claims you — your body dissolves into pure magic, never to return.',
      increases: [
        'Studying raw vis',
        'Crafting spells and enchanting items',
        'Entering the Twilight through Dream',
        'Exposure to powerful magical auras',
      ],
      decreases: [
        'Mastering the Enigma of Criamon (provides resistance)',
        'Warping reduces very slowly on its own',
      ],
    },
    notoriety: {
      icon: '👁',
      title: 'Notoriety',
      desc: 'How much the mundane world has noticed your activities. Priests record your name, villagers whisper, and the Inquisition gathers testimony. At 10, they come for you with torches and blessed iron.',
      increases: [
        'Casting spells visibly',
        'Exploring conspicuously',
        'Seasonal random events (curious priests, suspicious villagers)',
        'Failed attempts to resolve threats',
      ],
      decreases: [
        'Spending Silver (Speak + Coin) to bribe and smooth things over',
        'Casting the Veil of Invisibility (Work + spell)',
        'Casting the Aegis of the Hearth (Work + spell)',
        'Natural decay over time if Notoriety is low',
      ],
    },
    corruption: {
      icon: '☽',
      title: 'Corruption',
      desc: 'Infernal taint seeping into your soul. Contact with dark places, failed Twilight experiences, and the whispered bargains of demons erode your spiritual defenses. At 10, the darkness claims you utterly.',
      increases: [
        'Exploring infernal locations (Ruined Chapel)',
        'Failed Twilight experiences in Dream',
        'Infernal Whisper threat cards appearing',
      ],
      decreases: [
        'Resting (Dream + Vigor card)',
        'Casting Demon\'s Eternal Oblivion (Work + spell)',
        'Resolving threat cards through Speak',
      ],
    },
    hubris: {
      icon: '✧',
      title: 'Hubris',
      desc: 'The pride and obsession of a magus who pushes too far, too fast into the mysteries. The deeper you study, the harder it becomes to look away. At 10, you are lost — consumed by the infinite recursion of magical theory.',
      increases: [
        'Deepening Arts to level 3+ (Study combining fragments)',
        'Pursuing mystery paths (Dream + Mystery cards)',
        'Studying with Fervor (bold but reckless)',
        'Encountering Faerie locations',
      ],
      decreases: [
        'Applying Acumen (Study + Acumen card) to think clearly',
        'Taking time away from intense study',
      ],
    },
  },

  setupStatTooltips() {
    const tooltip = document.getElementById('stat-tooltip');

    document.querySelectorAll('.status-item.clickable').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const stat = item.dataset.stat;
        const info = this.statInfo[stat];
        if (!info) return;

        // Toggle: if already showing this stat, hide it
        if (!tooltip.classList.contains('hidden') && tooltip.dataset.stat === stat) {
          tooltip.classList.add('hidden');
          return;
        }

        document.getElementById('stat-tooltip-title').textContent = `${info.icon} ${info.title} — ${GameState[stat]}/10`;
        document.getElementById('stat-tooltip-desc').textContent = info.desc;

        let hintsHtml = '<div class="hint-row" style="font-weight:600;color:var(--gold);margin-bottom:4px;">What changes it:</div>';
        info.increases.forEach(h => {
          hintsHtml += `<div class="hint-row hint-up">▲ ${h}</div>`;
        });
        info.decreases.forEach(h => {
          hintsHtml += `<div class="hint-row hint-down">▼ ${h}</div>`;
        });
        document.getElementById('stat-tooltip-hints').innerHTML = hintsHtml;

        tooltip.dataset.stat = stat;
        tooltip.classList.remove('hidden');
      });
    });

    // Close tooltip when clicking elsewhere
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.status-item') && !e.target.closest('#stat-tooltip')) {
        tooltip.classList.add('hidden');
      }
    });
  },

  // ================================================================
  //  MESSAGE LOG
  // ================================================================

  toggleLog() {
    this.logOpen = !this.logOpen;
    this.logPanel.classList.toggle('hidden', !this.logOpen);
    if (this.logOpen) {
      this.unreadCount = 0;
      this.logBadge.classList.add('hidden');
      // Scroll to bottom
      this.logEntries.scrollTop = this.logEntries.scrollHeight;
    }
  },

  addLogEntry(message) {
    GameState.messageCount++;
    this.logMessages.push({ message, num: GameState.messageCount, timestamp: Date.now() });
    if (this.logMessages.length > 200) this.logMessages.shift();

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = message;
    this.logEntries.appendChild(entry);

    const atBottom = this.logEntries.scrollHeight - this.logEntries.scrollTop - this.logEntries.clientHeight < 60;
    if (atBottom) this.logEntries.scrollTop = this.logEntries.scrollHeight;

    while (this.logEntries.children.length > 200) {
      this.logEntries.removeChild(this.logEntries.firstChild);
    }

    if (!this.logOpen) {
      this.unreadCount++;
      this.logBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      this.logBadge.classList.remove('hidden');
    }
  },

  // ================================================================
  //  ZOOM — mouse wheel (no Ctrl needed) + buttons + keys
  // ================================================================

  setupZoom() {
    document.getElementById('zoom-in').addEventListener('click', () => this.zoom(this.zoomStep));
    document.getElementById('zoom-out').addEventListener('click', () => this.zoom(-this.zoomStep));
    document.getElementById('zoom-reset').addEventListener('click', () => { this.setZoom(1.0); this.panX = 0; this.panY = 0; this.applyTransform(); });

    // Scroll wheel zooms at cursor position
    this.gameTable.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? this.zoomStep : -this.zoomStep;
      this.zoomAtPoint(delta, e.clientX, e.clientY);
    }, { passive: false });

    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Equal' || e.code === 'NumpadAdd') { e.preventDefault(); this.zoom(this.zoomStep); }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') { e.preventDefault(); this.zoom(-this.zoomStep); }
      if (e.code === 'Digit0' && !e.shiftKey) { e.preventDefault(); this.setZoom(1.0); this.panX = 0; this.panY = 0; this.applyTransform(); }
    });
  },

  zoom(delta) { this.setZoom(this.zoomLevel + delta); },

  zoomAtPoint(delta, clientX, clientY) {
    const oldZoom = this.zoomLevel;
    const newZoom = Math.max(this.zoomMin, Math.min(this.zoomMax, Math.round((oldZoom + delta) * 10) / 10));
    if (newZoom === oldZoom) return;

    // Get cursor position relative to the game table container
    const rect = this.gameTable.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    // Point in content space under cursor: (mx - panX) / oldZoom
    // After zoom, we want the same content point under cursor:
    // mx = newPanX + contentX * newZoom  =>  newPanX = mx - contentX * newZoom
    const contentX = (mx - this.panX) / oldZoom;
    const contentY = (my - this.panY) / oldZoom;
    this.panX = mx - contentX * newZoom;
    this.panY = my - contentY * newZoom;

    this.zoomLevel = newZoom;
    this.applyTransform();
    document.getElementById('zoom-level').textContent = Math.round(this.zoomLevel * 100) + '%';
  },

  setZoom(level) {
    this.zoomLevel = Math.max(this.zoomMin, Math.min(this.zoomMax, Math.round(level * 10) / 10));
    this.applyTransform();
    document.getElementById('zoom-level').textContent = Math.round(this.zoomLevel * 100) + '%';
  },

  applyTransform() {
    this.viewport.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
  },

  // ================================================================
  //  PAN — drag empty space to scroll the table
  // ================================================================

  setupPan() {
    this.gameTable.addEventListener('pointerdown', (e) => {
      // Only pan if clicking empty space (not a card, not a verb, not a button)
      if (e.target.closest('.card') || e.target.closest('.card-stack') || e.target.closest('.verb-station') || e.target.closest('button') || e.target.closest('.zoom-btn')) return;
      if (e.button !== 0) return;
      this.panState = { startX: e.clientX, startY: e.clientY, startPanX: this.panX, startPanY: this.panY };
      this.gameTable.style.cursor = 'grabbing';
    });

    document.addEventListener('pointermove', (e) => {
      if (!this.panState) return;
      this.panX = this.panState.startPanX + (e.clientX - this.panState.startX);
      this.panY = this.panState.startPanY + (e.clientY - this.panState.startY);
      this.applyTransform();
    });

    document.addEventListener('pointerup', () => {
      if (this.panState) {
        this.panState = null;
        this.gameTable.style.cursor = '';
      }
    });
  },

  // ================================================================
  //  CARD DRAG — pointer-based, single click = inspect
  // ================================================================

  onPointerDown(e, card, cardEl, isStack, stackKey) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = cardEl.getBoundingClientRect();
    this.dragState = {
      card, sourceEl: cardEl, ghost: null,
      startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
      dragging: false, pointerId: e.pointerId,
      isStack: !!isStack, stackKey: stackKey || null
    };
  },

  onPointerMove(e) {
    if (!this.dragState) return;
    const dx = e.clientX - this.dragState.startX;
    const dy = e.clientY - this.dragState.startY;

    if (!this.dragState.dragging) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      this.dragState.dragging = true;
      this.beginDrag(e);
    }

    if (this.dragState.ghost) {
      this.dragState.ghost.style.left = (e.clientX - this.dragState.offsetX) + 'px';
      this.dragState.ghost.style.top = (e.clientY - this.dragState.offsetY) + 'px';
    }
    this.highlightDropTargets(e.clientX, e.clientY);
  },

  onPointerUp(e) {
    if (!this.dragState) return;

    if (this.dragState.dragging) {
      const dropX = e.clientX, dropY = e.clientY;
      const cardToDrop = this.dragState.card;
      const fromSlot = this.dragState.fromSlot;
      this.endDrag();
      this.dragState = null;
      if (fromSlot) {
        // Dragged out of a slot — remove from slot, then try to place elsewhere
        Game.removeCardFromSlot(fromSlot.verbId, fromSlot.slotIndex);
        this.attemptDropCard(dropX, dropY, cardToDrop);
      } else {
        this.attemptDropCard(dropX, dropY, cardToDrop);
      }
    } else if (this.dragState.fromSlot) {
      // Single click on a slotted card — remove it
      const { verbId, slotIndex } = this.dragState.fromSlot;
      this.dragState = null;
      Game.removeCardFromSlot(verbId, slotIndex);
    } else if (this.dragState.isStack) {
      // Single click on a stack — expand/collapse it, don't show detail
      const key = this.dragState.stackKey;
      this.dragState = null;
      if (this.expandedStack === key) {
        this.expandedStack = null;
      } else {
        this.expandedStack = key;
      }
      this.renderCards();
    } else {
      // Single click on a card — show detail
      const card = this.dragState.card;
      this.dragState = null;
      this.showCardDetail(card);
    }
  },

  beginDrag(e) {
    const { card, sourceEl } = this.dragState;
    const ghost = sourceEl.cloneNode(true);
    ghost.className = 'card drag-ghost';
    ghost.style.cssText = `
      position:fixed; width:${sourceEl.offsetWidth}px; height:${sourceEl.offsetHeight}px;
      left:${e.clientX - this.dragState.offsetX}px; top:${e.clientY - this.dragState.offsetY}px;
      z-index:10000; pointer-events:none; opacity:0.9;
      transform:rotate(3deg) scale(1.08); box-shadow:5px 8px 25px rgba(44,24,16,0.6);
      transition:none; touch-action:none;
    `;
    document.body.appendChild(ghost);
    this.dragState.ghost = ghost;
    sourceEl.style.opacity = '0.25';

    const remaining = GameState.tableCards.filter(c => c.instanceId !== card.instanceId);

    for (const verbId of GameState.unlockedVerbs) {
      const def = VerbDefinitions[verbId];
      if (!def?.slots?.length || GameState.activeVerbs[verbId]) continue;

      const verbEl = document.getElementById(`verb-${verbId}`);
      if (!verbEl) continue;
      const slotEls = verbEl.querySelectorAll('.verb-slot');

      const compatibleIndices = [];
      slotEls.forEach((slot, idx) => {
        const accepts = (slot.dataset.accepts || '').split(',');
        if (card.aspects && card.aspects.some(a => accepts.includes(a))) {
          compatibleIndices.push(idx);
        }
      });

      if (compatibleIndices.length > 0) {
        const slotsContainer = slotEls[0]?.closest('.verb-slots');
        if (slotsContainer) slotsContainer.classList.add('slots-dragging');

        // For each compatible slot, check if placing this card would lead to a valid recipe
        for (const idx of compatibleIndices) {
          const slot = slotEls[idx];
          const wouldMatch = this.checkRecipeViability(verbId, def, card, idx, remaining);
          if (wouldMatch) {
            slot.classList.add('compatible');
          } else {
            slot.classList.add('compatible', 'no-recipe');
          }
        }

        // Mark unfillable sibling slots
        slotEls.forEach((slot, idx) => {
          if (compatibleIndices.includes(idx)) return;
          const alreadyFilled = !!GameState.verbCards[verbId]?.[idx];
          if (alreadyFilled) return;
          const sibAccepts = (slot.dataset.accepts || '').split(',');
          const canFill = remaining.some(c => c.aspects?.some(a => sibAccepts.includes(a)));
          if (!canFill) slot.classList.add('no-match');
        });
      }
    }

    // Threat slots
    document.querySelectorAll('.threat-slot').forEach(slot => {
      const accepts = (slot.dataset.accepts || '').split(',');
      if (card.aspects && card.aspects.some(a => accepts.includes(a))) {
        slot.classList.add('compatible');
        const station = slot.closest('.threat-station');
        if (station) station.classList.add('drag-target');
      }
    });
  },

  // Check if placing card in slotIdx would lead to any valid recipe
  checkRecipeViability(verbId, def, dragCard, slotIdx, remaining) {
    // Build the card array as it would be after placing
    const testCards = {};
    // Copy existing slotted cards
    if (GameState.verbCards[verbId]) {
      for (const [k, v] of Object.entries(GameState.verbCards[verbId])) {
        testCards[parseInt(k)] = v;
      }
    }
    testCards[slotIdx] = dragCard;

    // For single-slot verbs, just test directly
    if (def.slots.length === 1) {
      const cards = [dragCard];
      return !!RecipeEngine.findMatch(verbId, cards);
    }

    // For multi-slot verbs, check if current + drag fills all required slots
    const requiredSlots = def.slots.map((s, i) => ({ ...s, idx: i })).filter(s => !s.optional);
    const filledRequired = requiredSlots.every(s => !!testCards[s.idx]);

    if (filledRequired) {
      // All required slots filled — test the recipe
      const cards = [];
      for (let i = 0; i < def.slots.length; i++) {
        if (testCards[i]) cards.push(testCards[i]);
      }
      return !!RecipeEngine.findMatch(verbId, cards);
    }

    // Not all required slots filled yet — check if ANY combination of remaining cards
    // could fill the empty required slots and produce a valid recipe
    const emptyRequired = requiredSlots.filter(s => !testCards[s.idx]);
    if (emptyRequired.length === 1) {
      // One empty required slot — try each remaining card
      const emptySlot = emptyRequired[0];
      const emptyAccepts = new Set(emptySlot.accepts || []);
      for (const candidate of remaining) {
        if (!candidate.aspects?.some(a => emptyAccepts.has(a))) continue;
        const tryCards = [];
        for (let i = 0; i < def.slots.length; i++) {
          if (i === emptySlot.idx) tryCards.push(candidate);
          else if (testCards[i]) tryCards.push(testCards[i]);
        }
        if (tryCards.length >= requiredSlots.length && RecipeEngine.findMatch(verbId, tryCards)) {
          return true;
        }
      }
      return false;
    }

    // Multiple empty slots — too complex to check exhaustively, assume viable
    return true;
  },

  endDrag() {
    if (!this.dragState) return;
    if (this.dragState.ghost?.parentNode) this.dragState.ghost.remove();
    if (this.dragState.sourceEl) this.dragState.sourceEl.style.opacity = '';
    document.querySelectorAll('.verb-slot').forEach(s => s.classList.remove('compatible', 'drag-hover', 'no-match', 'no-recipe'));
    document.querySelectorAll('.verb-slots').forEach(s => s.classList.remove('slots-dragging'));
    document.querySelectorAll('.threat-slot').forEach(s => s.classList.remove('compatible', 'drag-hover'));
    document.querySelectorAll('.threat-station').forEach(s => s.classList.remove('drag-target'));
  },

  highlightDropTargets(x, y) {
    document.querySelectorAll('.verb-slot, .threat-slot').forEach(slot => {
      const r = slot.getBoundingClientRect();
      slot.classList.toggle('drag-hover', x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && slot.classList.contains('compatible'));
    });
  },

  attemptDropCard(x, y, card) {
    if (!card) return;

    // Check threat slots first
    const threatSlots = document.querySelectorAll('.threat-slot');
    for (const slot of threatSlots) {
      const r = slot.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const threatId = slot.dataset.threatId;
        const accepts = (slot.dataset.accepts || '').split(',');
        if (!card.aspects || !card.aspects.some(a => accepts.includes(a))) {
          this.notify('This card does not help against this threat.');
          return;
        }
        // Check if already resolving
        const threat = ThreatSystem.activeThreats.find(t => t.defId === threatId);
        if (threat?.resolving) {
          this.notify('This threat is already being resolved.');
          return;
        }
        Game.placeCardInThreatSlot(threatId, card);
        return;
      }
    }

    // Check verb slots
    const slots = document.querySelectorAll('.verb-slot:not(.threat-slot)');
    for (const slot of slots) {
      const r = slot.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        const verbId = slot.dataset.verbId;
        const slotIndex = parseInt(slot.dataset.slotIndex);
        const accepts = (slot.dataset.accepts || '').split(',');
        if (!card.aspects || !card.aspects.some(a => accepts.includes(a))) { this.notify('This card does not fit here.'); return; }
        if (GameState.activeVerbs[verbId]) { this.notify('This station is currently active.'); return; }
        Game.placeCardInSlot(verbId, slotIndex, card);
        return;
      }
    }
  },

  // ================================================================
  //  VERB RENDERING
  // ================================================================

  verbArt: {
    study:   'images/verb-study.png',
    work:    'images/verb-work.png',
    explore: 'images/verb-explore.png',
    speak:   'images/verb-speak.png',
    time:    'images/verb-time.png',
    dream:   'images/verb-dream.png',
  },

  renderVerbs() {
    if (this.dragState?.dragging) return;
    this.verbArea.innerHTML = '';
    for (const verbId of GameState.unlockedVerbs) {
      const def = VerbDefinitions[verbId];
      if (!def) continue;
      this.verbArea.appendChild(this.createVerbElement(def));
    }
    // Re-expand if a verb was expanded
    if (this._expandedVerb) {
      const hasCards = Object.keys(GameState.verbCards[this._expandedVerb] || {}).length > 0;
      const isActive = !!GameState.activeVerbs[this._expandedVerb];
      if (hasCards || isActive) {
        this.expandVerbStation(this._expandedVerb);
      } else {
        this._expandedVerb = null;
      }
    }
  },

  // Called after renderVerbs + renderThreats to fit everything
  fitVerbArea() {
    const stations = this.verbArea.querySelectorAll('.verb-station, .threat-station');
    const count = stations.length;
    if (count === 0) return;

    // Reset to natural sizes — verbs extend to the right, zoom to see all
    this.verbArea.style.gap = '';
    stations.forEach(s => { s.style.width = ''; s.style.height = ''; });
  },

  createVerbElement(def) {
    const el = document.createElement('div');
    el.className = 'verb-station';
    el.dataset.verbId = def.id;
    el.id = `verb-${def.id}`;

    // Apply verb station background art (use full shorthand to override CSS)
    const artUrl = this.verbArt[def.id];
    if (artUrl) {
      el.style.background = `url('${artUrl}') center/cover no-repeat`;
      el.classList.add('has-art');
    }

    const isActive = !!GameState.activeVerbs[def.id];
    if (isActive) el.classList.add('processing');

    let slotsHtml = '';
    if (def.slots?.length > 0) {
      const hasSlottedCard = def.slots.some((_, idx) => GameState.verbCards[def.id]?.[idx]);
      slotsHtml = `<div class="verb-slots${hasSlottedCard ? ' slots-active' : ''}">`;
      def.slots.forEach((slot, idx) => {
        const sc = GameState.verbCards[def.id]?.[idx];

        // Hide optional slots unless there are compatible cards on the table
        // or a card is already in the slot
        if (slot.optional && !sc) {
          const accepts = new Set(slot.accepts || []);
          const hasCompatible = GameState.tableCards.some(c => c.aspects?.some(a => accepts.has(a)));
          if (!hasCompatible) return; // hide this slot entirely
        }

        let content = `<span>${slot.label}</span>`;
        if (sc) {
          const artImg = getCardArtImage(sc.id);
          const bgStyle = artImg
            ? `background-image:url('${artImg}');`
            : `background:${this.getCategoryColor(sc.category)};`;
          content = `<div class="slot-card" data-card-id="${sc.id}" style="${bgStyle}color:white;">
            <span class="slot-card-name">${sc.name}</span></div>`;
        }
        slotsHtml += `<div class="verb-slot" data-verb-id="${def.id}" data-slot-index="${idx}" data-accepts="${(slot.accepts||[]).join(',')}">${content}</div>`;
      });
      slotsHtml += '</div>';
    }

    let timerHtml = '';
    if (isActive) {
      const p = TimerSystem.getProgress(`verb_${def.id}`);
      timerHtml = `<div class="verb-timer"><div class="verb-timer-fill" style="width:${p*100}%"></div></div>`;
    }

    const vs = GameState.activeVerbs[def.id];
    let resultHtml = (vs?.completed) ? `<button class="verb-result-btn" data-verb-id="${def.id}">Collect</button>` : '';

    el.innerHTML = `<div class="verb-name">${def.name}</div>
      <div class="verb-art-space"></div>
      ${slotsHtml}<div class="verb-description">${def.description}</div>${timerHtml}${resultHtml}`;

    el.querySelector('.verb-result-btn')?.addEventListener('click', (e) => { e.stopPropagation(); Game.collectVerbResult(def.id); });

    // Slotted cards: pointerdown for drag-out or click-to-remove
    el.querySelectorAll('.slot-card').forEach(sc => {
      const slotEl = sc.closest('.verb-slot');
      const slotIdx = parseInt(slotEl.dataset.slotIndex);
      sc.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (GameState.activeVerbs[def.id]) return;
        e.preventDefault();
        e.stopPropagation();
        const slottedCard = GameState.verbCards[def.id]?.[slotIdx];
        if (!slottedCard) return;
        const rect = sc.getBoundingClientRect();
        this.dragState = {
          card: slottedCard, sourceEl: sc, ghost: null,
          startX: e.clientX, startY: e.clientY,
          offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
          dragging: false, pointerId: e.pointerId,
          isStack: false, stackKey: null,
          fromSlot: { verbId: def.id, slotIndex: slotIdx }
        };
      });
    });

    // Click an EMPTY slot to highlight cards that can fill it (context-aware)
    el.querySelectorAll('.verb-slot').forEach(slotEl => {
      slotEl.addEventListener('click', (e) => {
        e.stopPropagation();
        if (GameState.activeVerbs[def.id]) return;
        const idx = parseInt(slotEl.dataset.slotIndex);
        const slottedCard = GameState.verbCards[def.id]?.[idx];
        if (!slottedCard) {
          // Empty slot clicked — highlight compatible cards for THIS slot
          this.highlightForSlot(def, idx);
        }
      });
    });

    // Click the verb station body — expand if active/has cards, else highlight compatible
    el.addEventListener('click', (e) => {
      if (e.target.closest('.verb-result-btn') || e.target.closest('.slot-card') || e.target.closest('.verb-slot') || e.target.closest('.expand-collapse-btn')) return;
      const hasCards = Object.keys(GameState.verbCards[def.id] || {}).length > 0;
      const isActive = !!GameState.activeVerbs[def.id];
      if (hasCards || isActive) {
        if (el.classList.contains('expanded')) {
          this.collapseVerbStation(def.id);
        } else {
          this.expandVerbStation(def.id);
        }
      } else {
        this.highlightCompatibleCards(def);
      }
    });
    return el;
  },

  /** Clear any existing highlights */
  clearHighlights() {
    document.querySelectorAll('.hint-glow').forEach(el => el.classList.remove('hint-glow'));
  },

  /** Highlight cards that fit a specific slot, considering what's already in other slots */
  highlightForSlot(verbDef, slotIndex) {
    this.clearHighlights();
    const slot = verbDef.slots[slotIndex];
    if (!slot) return;
    const accepts = new Set(slot.accepts || []);

    // Get cards already placed in other slots (for smarter hints)
    const otherCards = [];
    const verbCards = GameState.verbCards[verbDef.id] || {};
    for (const [idx, card] of Object.entries(verbCards)) {
      if (parseInt(idx) !== slotIndex) otherCards.push(card);
    }

    let n = 0;
    const allEls = document.querySelectorAll('#card-area .card, #card-area .card-stack, #card-area .compact-card');
    allEls.forEach(el => {
      const instanceId = el.dataset.instanceId || el.querySelector('.card')?.dataset.instanceId;
      const card = GameState.tableCards.find(c => c.instanceId === instanceId);
      if (!card) return;

      if (!card.aspects?.some(a => accepts.has(a))) return;

      if (otherCards.length > 0) {
        const testCards = slotIndex === 0 ? [card, ...otherCards] : [...otherCards, card];
        const recipe = RecipeEngine.findMatch(verbDef.id, testCards);
        if (!recipe) return;
      }

      el.classList.add('hint-glow');
      n++;
    });

    if (n === 0) {
      this.notify('No cards on the table fit this slot right now.');
    } else {
      // Also describe what kind of cards are needed
      const slotLabel = slot.label || 'card';
      if (otherCards.length > 0) {
        this.notify(`Highlighted ${n} card${n>1?'s':''} that combine with what's already slotted.`);
      } else {
        this.notify(`Highlighted ${n} card${n>1?'s':''} that fit: ${slotLabel}.`);
      }
    }
  },

  /** Highlight all cards compatible with any EMPTY slot in this verb */
  highlightCompatibleCards(verbDef) {
    this.clearHighlights();
    if (GameState.activeVerbs[verbDef.id]) return; // verb is busy

    // Only consider empty slots
    const emptySlotAccepts = new Set();
    verbDef.slots.forEach((slot, idx) => {
      const occupied = GameState.verbCards[verbDef.id]?.[idx];
      if (!occupied) {
        for (const a of (slot.accepts || [])) emptySlotAccepts.add(a);
      }
    });
    if (emptySlotAccepts.size === 0) {
      this.notify('All slots are filled.');
      return;
    }

    let n = 0;
    document.querySelectorAll('#card-area .card, #card-area .card-stack, #card-area .compact-card').forEach(el => {
      const instanceId = el.dataset.instanceId || el.querySelector('.card')?.dataset.instanceId;
      const card = GameState.tableCards.find(c => c.instanceId === instanceId);
      if (card?.aspects?.some(a => emptySlotAccepts.has(a))) {
        el.classList.add('hint-glow');
        n++;
      }
    });
    if (n === 0) this.notify('No cards on the table fit this station right now.');
  },

  // ================================================================
  //  CARD RENDERING — auto-stack same-category cards
  // ================================================================

  // Set of instanceIds that were on the table before the last render
  _previousCardIds: new Set(),
  // Set of instanceIds that are newly added (for highlight animation)
  _newCardIds: new Set(),

  renderCards() {
    if (this.dragState?.dragging) return;

    const currentIds = new Set(GameState.tableCards.map(c => c.instanceId));
    this._newCardIds = new Set();
    for (const id of currentIds) {
      if (!this._previousCardIds.has(id)) this._newCardIds.add(id);
    }
    this._previousCardIds = currentIds;

    this.cardArea.innerHTML = '';
    this.cardArea.style.minHeight = '';
    this.cardArea.style.minWidth = '';
    this.cardArea.style.gap = '';
    this.cardArea.classList.remove('layout-columns', 'layout-compact');
    if (this.cardLayout === 'columns') this.cardArea.classList.add('layout-columns');
    if (this.cardLayout === 'compact') this.cardArea.classList.add('layout-compact');

    if (this.cardLayout === 'columns') {
      this.renderColumnsLayout();
    } else if (this.cardLayout === 'compact') {
      this.renderCompactLayout();
    } else {
      this.renderGridLayout();
    }
  },

  renderGridLayout() {
    // Group cards by stack key
    const groups = new Map();
    for (const card of GameState.tableCards) {
      const key = this.getStackKey(card);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(card);
    }

    const sortedKeys = [...groups.keys()].sort((a, b) => {
      const ga = groups.get(a), gb = groups.get(b);
      if (ga[0].category !== gb[0].category) return (ga[0].category || '').localeCompare(gb[0].category || '');
      return gb.length - ga.length;
    });

    for (const key of sortedKeys) {
      const cards = groups.get(key);
      if (cards.length === 1 || this.expandedStack === key) {
        for (const card of cards) this.cardArea.appendChild(this.createCardElement(card));
      } else {
        this.cardArea.appendChild(this.createStackElement(key, cards));
      }
    }
  },

  renderColumnsLayout() {
    const categoryNames = {
      technique: 'Techniques', form: 'Forms', vis: 'Vis',
      text: 'Texts', spell: 'Spells', mystery: 'Mysteries',
      companion: 'Companions', location: 'Locations', threat: 'Threats',
      condition: 'Conditions', resource: 'Resources'
    };
    const categoryOrder = ['technique','form','vis','spell','mystery','text','companion','location','threat','condition','resource'];

    const columns = new Map();
    for (const card of GameState.tableCards) {
      const cat = card.category || 'resource';
      if (!columns.has(cat)) columns.set(cat, []);
      columns.get(cat).push(card);
    }

    // Count active columns to calculate dynamic width
    const activeColumns = categoryOrder.filter(cat => columns.has(cat) && columns.get(cat).length > 0);
    const numCols = activeColumns.length;
    const viewportW = this.cardArea.parentElement?.offsetWidth || window.innerWidth;
    const cardW = 140; // --card-width
    // Shrink gap and padding as columns increase; minimum column width is card width + 10
    const maxColW = cardW + 80;
    const minColW = cardW + 10;
    const idealGap = Math.max(4, Math.min(12, Math.floor((viewportW - numCols * minColW) / (numCols + 1))));
    const colW = Math.max(minColW, Math.min(maxColW, Math.floor((viewportW - idealGap * (numCols + 1)) / numCols)));

    // Set gap dynamically
    this.cardArea.style.gap = idealGap + 'px';

    const cardH = 280;

    for (const cat of activeColumns) {
      const cards = columns.get(cat);

      const col = document.createElement('div');
      col.className = 'card-column';
      col.style.width = colW + 'px';
      col.style.minWidth = colW + 'px';
      col.style.maxWidth = colW + 'px';

      const header = document.createElement('div');
      header.className = 'card-column-header';
      header.textContent = `${categoryNames[cat] || cat} (${cards.length})`;
      col.appendChild(header);

      cards.sort((a, b) => (b.level || 0) - (a.level || 0) || (a.name || '').localeCompare(b.name || ''));

      const isOverlapped = cards.length > 1;
      const showPerCard = isOverlapped
        ? Math.max(24, Math.min(70, 300 / cards.length))
        : cardH;

      for (let i = 0; i < cards.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'card-column-slot' + (isOverlapped ? ' overlapped' : '');
        slot.style.height = (i === cards.length - 1 ? cardH : showPerCard) + 'px';
        slot.style.setProperty('--slot-z', i + 1);

        const el = this.createCardElement(cards[i]);
        slot.appendChild(el);
        col.appendChild(slot);
      }

      this.cardArea.appendChild(col);
    }

    // Let the area expand to fit all columns — no scrollbars
    const totalW = numCols * colW + (numCols + 1) * idealGap;
    const tallestCol = Math.max(...activeColumns.map(cat => {
      const n = columns.get(cat).length;
      const overlap = n > 1 ? Math.max(24, Math.min(70, 300 / n)) : cardH;
      return 30 + (n > 1 ? (n - 1) * overlap + cardH : cardH);
    }), 300);
    this.cardArea.style.minWidth = totalW + 'px';
    this.cardArea.style.minHeight = (tallestCol + 30) + 'px';

    // Mark the last column to slide cards left on hover (avoid off-screen)
    const allCols = this.cardArea.querySelectorAll('.card-column');
    if (allCols.length > 0) {
      allCols[allCols.length - 1].classList.add('slide-left');
    }
  },

  renderCompactLayout() {
    const categoryNames = {
      technique: 'Techniques', form: 'Forms', vis: 'Vis',
      text: 'Texts', spell: 'Spells', mystery: 'Mysteries',
      companion: 'Companions', location: 'Locations', threat: 'Threats',
      condition: 'Conditions', resource: 'Resources'
    };
    const categoryOrder = ['technique','form','vis','spell','mystery','text','companion','location','threat','condition','resource'];

    const groups = new Map();
    for (const card of GameState.tableCards) {
      const cat = card.category || 'resource';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(card);
    }

    for (const cat of categoryOrder) {
      const cards = groups.get(cat);
      if (!cards || cards.length === 0) continue;

      // Category header
      const header = document.createElement('div');
      header.className = 'card-column-header';
      header.style.cssText = 'width:100%;margin:6px 0 2px;';
      header.textContent = `${categoryNames[cat] || cat} (${cards.length})`;
      this.cardArea.appendChild(header);

      cards.sort((a, b) => (b.level || 0) - (a.level || 0) || (a.name || '').localeCompare(b.name || ''));

      for (const card of cards) {
        const el = document.createElement('div');
        el.className = 'compact-card';
        el.dataset.instanceId = card.instanceId;
        el.dataset.category = card.category || 'resource';
        el.style.touchAction = 'none';

        const artImg = getCardArtImage(card.id);
        const artStyle = artImg ? `background:url('${artImg}') center/cover no-repeat;` : `background:${this.getCategoryColor(card.category)};`;

        const topBadges = (card.aspects || []).slice(0, 3).map(a =>
          `<span class="aspect-badge ${a}">${ASPECTS[a]?.name || a}</span>`
        ).join('');

        el.innerHTML = `
          <div class="compact-art" style="${artStyle}"></div>
          <span class="compact-name">${card.name || 'Unknown'}</span>
          ${card.level > 1 ? `<span class="compact-level">Lv.${card.level}</span>` : ''}
          <div class="compact-badges">${topBadges}</div>
        `;

        // Click = inspect, drag = move
        el.addEventListener('pointerdown', (e) => this.onPointerDown(e, card, el));
        el.addEventListener('contextmenu', (e) => { e.preventDefault(); this.showCardDetail(card); });
        el.addEventListener('dragstart', (e) => e.preventDefault());

        this.cardArea.appendChild(el);
      }
    }
  },

  /** Determine the stacking key for a card */
  getStackKey(card) {
    // Lore cards stack by their specific art (e.g. "lore:creo")
    if (card.aspects?.includes('lore')) {
      const art = card.aspects.find(a => TECHNIQUES.includes(a) || FORMS.includes(a));
      if (art) return `lore:${art}`;
    }
    // Vis stacks by form
    if (card.category === 'vis') {
      const form = card.aspects?.find(a => FORMS.includes(a));
      return `vis:${form || 'generic'}`;
    }
    // Coins stack together
    if (card.aspects?.includes('coin')) return 'coin';
    // Threats stack together
    if (card.category === 'threat') return 'threat';
    // Spells stack together
    if (card.category === 'spell') return 'spell';
    // Same-id resource/condition cards stack (e.g. multiple Vigor)
    if (card.category === 'resource' || card.category === 'condition') {
      return `res:${card.id}`;
    }
    // Everything else: unique (don't stack)
    return `single:${card.instanceId}`;
  },

  createStackElement(key, cards) {
    const topCard = cards[cards.length - 1]; // show most recent
    const el = document.createElement('div');
    el.className = 'card-stack';
    el.dataset.stackKey = key;
    el.style.touchAction = 'none';

    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.dataset.instanceId = topCard.instanceId;
    cardEl.dataset.category = topCard.category || 'resource';

    let aspectsHtml = (topCard.aspects || []).map(a =>
      `<span class="aspect-badge ${a}" data-tip="${ASPECTS[a]?.tip || ''}">${ASPECTS[a]?.name || a}</span>`
    ).join('');

    let levelIndicator = '';
    if (topCard.level && topCard.level > 1) {
      levelIndicator = `<span style="position:absolute;top:3px;right:5px;font-size:0.6rem;color:var(--gold);font-family:var(--font-display);">${topCard.level}</span>`;
    }

    const artImg = getCardArtImage(topCard.id);
    const artStyle = artImg ? `background:url('${artImg}') center/cover no-repeat;` : '';
    const artClass = artImg ? 'card-art has-image' : 'card-art';
    const iconHtml = artImg ? '' : `<span class="card-art-icon">${topCard.icon || '?'}</span>`;

    cardEl.innerHTML = `
      <div class="${artClass}" style="${artStyle}">${iconHtml}${levelIndicator}</div>
      <div class="card-title">${topCard.name || 'Unknown'}</div>
      <div class="card-flavor">${this.truncateFlavor(topCard.flavor || '', 100)}</div>
      <div class="card-aspects">${aspectsHtml}</div>
    `;

    // Stack count badge
    const badge = document.createElement('div');
    badge.className = 'stack-badge';
    badge.textContent = `×${cards.length}`;
    el.appendChild(badge);

    // Shadow cards behind to indicate stack depth
    if (cards.length >= 2) {
      const shadow1 = document.createElement('div');
      shadow1.className = 'stack-shadow stack-shadow-1';
      el.appendChild(shadow1);
    }
    if (cards.length >= 3) {
      const shadow2 = document.createElement('div');
      shadow2.className = 'stack-shadow stack-shadow-2';
      el.appendChild(shadow2);
    }

    el.appendChild(cardEl);

    // Pointer handler — single click expands/collapses; drag pulls top card
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      this.onPointerDown(e, topCard, cardEl, true, key);
    });

    // Remove the click handler — expansion is now handled by onPointerUp
    return el;
  },

  createCardElement(card) {
    const el = document.createElement('div');
    const isNew = this._newCardIds.has(card.instanceId);
    el.className = 'card' + (isNew ? ' card-new' : '');
    el.dataset.instanceId = card.instanceId;
    el.dataset.category = card.category || 'resource';
    el.style.touchAction = 'none';

    let aspectsHtml = (card.aspects || []).map(a =>
      `<span class="aspect-badge ${a}" data-tip="${ASPECTS[a]?.tip || ''}">${ASPECTS[a]?.name || a}</span>`
    ).join('');

    let levelIndicator = '';
    if (card.level && card.level > 1) {
      levelIndicator = `<span style="position:absolute;top:3px;right:5px;font-size:0.6rem;color:var(--gold);font-family:var(--font-display);">${card.level}</span>`;
    }

    const artImg = getCardArtImage(card.id);
    const artStyle = artImg ? `background:url('${artImg}') center/cover no-repeat;` : '';
    const artClass = artImg ? 'card-art has-image' : 'card-art';
    const iconHtml = artImg ? '' : `<span class="card-art-icon">${card.icon || '?'}</span>`;

    el.innerHTML = `
      <div class="${artClass}" style="${artStyle}">${iconHtml}${levelIndicator}</div>
      <div class="card-title">${card.name || 'Unknown'}</div>
      <div class="card-flavor">${this.truncateFlavor(card.flavor || '', 140)}</div>
      <div class="card-aspects">${aspectsHtml}</div>
    `;

    el.addEventListener('pointerdown', (e) => this.onPointerDown(e, card, el));
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); this.showCardDetail(card); });
    el.addEventListener('dragstart', (e) => e.preventDefault());
    return el;
  },

  truncateFlavor(text, maxLen) {
    return text.length <= maxLen ? text : text.substring(0, maxLen - 1) + '…';
  },

  getCategoryColor(cat) {
    return { technique:'#2a4a2a', form:'#2a3a5a', vis:'#4a2a5a', text:'#4a3a2a', spell:'#1a3a6a',
      mystery:'#3a1a4a', companion:'#2a4a2a', location:'#2a5a3a', threat:'#5a1a1a',
      condition:'#4a2a1a', resource:'#5a4a2a' }[cat] || '#3a3a3a';
  },

  // ================================================================
  //  CARD DETAIL OVERLAY — rich inspection (single click)
  // ================================================================

  showCardDetail(card) {
    const artEl = document.getElementById('card-detail-art');
    const artImg = getCardArtImage(card.id);
    if (artImg) {
      artEl.innerHTML = '';
      artEl.style.background = `url('${artImg}') center/cover`;
    } else {
      artEl.innerHTML = `<span style="font-size:4rem;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.5))">${card.icon || '?'}</span>`;
      artEl.style.background = `linear-gradient(135deg, ${this.getCategoryColor(card.category)}, #0a0a0a)`;
    }
    artEl.style.color = 'var(--gold)';

    document.getElementById('card-detail-title').textContent = card.name || 'Unknown';

    const catNames = { technique:'Hermetic Technique', form:'Hermetic Form', vis:'Raw Vis',
      text:'Written Text', spell:'Formulaic Spell', mystery:'Mystery', companion:'Companion',
      location:'Location', threat:'Threat', condition:'Condition', resource:'Resource' };
    let sub = catNames[card.category] || '';
    if (card.level && card.level > 1) sub += ` · Level ${card.level}`;
    if (card.artName) sub = `${card.artName} · ${sub}`;
    document.getElementById('card-detail-subtitle').textContent = sub;

    document.getElementById('card-detail-description').textContent = card.flavor || '';

    document.getElementById('card-detail-aspects').innerHTML =
      (card.aspects || []).map(a => {
        const d = ASPECTS[a];
        return `<span class="aspect-badge ${a}" style="font-size:0.65rem;padding:3px 8px;" data-tip="${d?.tip || ''}">${d?.icon||''} ${d?.name||a}</span>`;
      }).join('');

    const hints = this.getCardHints(card);
    document.getElementById('card-detail-lore').innerHTML = hints.length > 0
      ? hints.map(h => `<div style="margin-top:6px;padding:4px 0;border-top:1px solid rgba(196,155,48,0.15)">💡 ${h}</div>`).join('')
      : '';

    this.cardDetailOverlay.classList.remove('hidden');
  },

  getCardHints(card) {
    const hints = [], a = card.aspects || [];
    if (a.includes('text')) hints.push('Drag to <strong>Study</strong> to learn the Art within.');
    if (a.includes('vis')) hints.push('Drag to <strong>Study</strong> to absorb its essence, or to <strong>Work</strong> with a spell to enchant an item.');
    if (a.includes('lore') && (a.some(x => TECHNIQUES.includes(x)) || a.some(x => FORMS.includes(x)))) {
      hints.push('Drag to <strong>Study</strong> with a matching fragment to deepen your Art.');
      hints.push('Drag to <strong>Work</strong> with another Art to craft a spell.');
    }
    if (a.includes('companion')) hints.push('Drag to <strong>Speak</strong> to converse, trade, or learn.');
    if (a.includes('threat')) hints.push('Drag to <strong>Speak</strong> to attempt to resolve this threat.');
    if (a.includes('coin')) hints.push('Drag to <strong>Speak</strong> to reduce Notoriety with a well-placed bribe.');
    if (a.includes('location')) hints.push('Drag to <strong>Explore</strong> to search for vis, texts, and secrets.');
    if (a.includes('mystery')) hints.push('Drag to <strong>Dream</strong> to pursue this mystery deeper.');
    if (a.includes('spell')) hints.push('Drag to <strong>Work</strong> to cast, or combine with Vis to enchant.');
    if (a.includes('vigor')) hints.push('Drag to <strong>Dream</strong> to rest and reduce Corruption.');
    if (a.includes('acumen')) hints.push('Drag to <strong>Study</strong> to clear your mind and reduce Hubris.');
    if (a.includes('fervor')) hints.push('Drag to <strong>Study</strong> or <strong>Explore</strong> for a bold but risky result.');
    if (a.includes('intellego')) hints.push('Drag to <strong>Explore</strong> to discover new locations.');
    if (card.permanent) hints.push('This is permanent and cannot be removed.');
    return hints;
  },

  // ================================================================
  //  VERB INLINE EXPANSION — shows recipe lore beside verb station
  // ================================================================

  expandVerbStation(verbId) {
    // Collapse any other expanded station
    if (this._expandedVerb && this._expandedVerb !== verbId) {
      this.collapseVerbStation(this._expandedVerb);
    }
    this._expandedVerb = verbId;

    const el = document.getElementById(`verb-${verbId}`);
    if (!el) return;

    // Remove existing panel if any
    el.querySelector('.verb-expand-panel')?.remove();

    const def = VerbDefinitions[verbId];
    if (!def) return;

    // Gather slotted cards
    const cards = [];
    (def.slots || []).forEach((_, idx) => {
      const sc = GameState.verbCards[verbId]?.[idx];
      if (sc) cards.push(sc);
    });

    const recipe = cards.length > 0 ? RecipeEngine.findMatch(verbId, cards) : null;
    const lore = this.getRecipeLore(verbId, recipe, cards);

    // Build lore HTML with mysterious, atmospheric text
    let loreHtml = '';
    const activeVerb = GameState.activeVerbs[verbId];
    if (activeVerb && activeVerb.recipe) {
      // Verb is actively processing
      const r = activeVerb.recipe;
      loreHtml = `<div class="expand-recipe-name">${r.label || 'Working...'}</div>`;
      if (r.startText) {
        loreHtml += `<div class="expand-recipe-text">${r.startText}</div>`;
      }
      if (activeVerb.completed) {
        loreHtml += `<div class="expand-lore-line preview-lore-good">The work is complete. Collect the results.</div>`;
      } else {
        loreHtml += `<div class="expand-lore-line preview-lore-good">The work continues...</div>`;
      }
      if (lore.length > 0) {
        loreHtml += lore.map(l => `<div class="expand-lore-line ${l.type}">${l.text}</div>`).join('');
      }
    } else if (recipe) {
      loreHtml = `<div class="expand-recipe-name">${recipe.label || 'Processing...'}</div>`;
      if (recipe.startText) {
        loreHtml += `<div class="expand-recipe-text">${recipe.startText}</div>`;
      }
      if (lore.length > 0) {
        loreHtml += lore.map(l => `<div class="expand-lore-line ${l.type}">${l.text}</div>`).join('');
      }
    } else if (cards.length > 0) {
      loreHtml = `<div class="expand-recipe-text">These elements resist combination. Perhaps a different pairing is needed.</div>`;
    }

    const panel = document.createElement('div');
    panel.className = 'verb-expand-panel';
    panel.innerHTML = `
      <button class="expand-collapse-btn" title="Collapse">◂</button>
      <div class="expand-panel-content">${loreHtml}</div>
    `;
    panel.querySelector('.expand-collapse-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.collapseVerbStation(verbId);
    });

    el.classList.add('expanded');
    el.appendChild(panel);
  },

  collapseVerbStation(verbId) {
    const el = document.getElementById(`verb-${verbId}`);
    if (el) {
      el.classList.remove('expanded');
      el.querySelector('.verb-expand-panel')?.remove();
    }
    if (this._expandedVerb === verbId) this._expandedVerb = null;
  },

  // Old modal methods kept as no-ops for compatibility
  showVerbPreview() {},
  closeVerbPreview() { this.verbPreviewOverlay?.classList.add('hidden'); },

  getRecipeLore(verbId, recipe, cards) {
    const lore = [];
    const card = cards[0];
    if (!card) return lore;
    const pick = (...opts) => opts[Math.floor(Math.random() * opts.length)];

    if (verbId === 'study') {
      if (card.aspects?.includes('text')) {
        const art = card.aspects.find(a => TECHNIQUES.includes(a) || FORMS.includes(a));
        if (art) {
          if (card.level >= 2 && (GameState.arts[art] || 0) < 1) {
            lore.push({ type: 'preview-lore-warn', text: pick(
              'The Latin is dense, the diagrams stranger. You lack the foundation to parse what Bonisagus took decades to codify.',
              'The text assumes knowledge you do not yet possess. The symbols blur and reform, refusing to yield their meaning.'
            )});
          } else {
            const bookLore = {
              'tattered_folio': 'Water-stained annotations crowd the margins. Someone before you wrestled with these same passages, and the echoes of their understanding seep through.',
              'tractatus_ignem': 'Elaine of Flambeau wrote with a quill that burned at the tip. Her words carry heat — you can feel the Art of Ignem stirring.',
              'tractatus_mentem': 'The text describes the architecture of thought — how minds connect, how memories form. Reading it reshapes the way you think about thinking.',
              'tractatus_corpus': 'Diagrams of the human form are annotated with sigils that glow faintly. The author understood the body as a vessel for the Art.',
              'tractatus_herbam': 'Pressed between pages are specimens that should not exist. One flower unfolds as you read, releasing the scent of deep forest.',
              'summa_vim': 'Bonisagus himself may have held this volume. The binding is silver, the clasp is bone. Within lies the theory that united twelve traditions into one.',
              'summa_creo': 'Each page smells of fresh rain. The Art of Creation is described not as making, but as remembering — calling forth the Platonic ideal.',
              'coded_journal': 'The cipher resists casual reading. Diagrams suggest initiation rites. Some pages are stained with something that is not quite ink.',
              'letter_from_stranger': 'The letter speaks of recognition — someone has noticed your Gift. The handwriting carries authority.',
            };
            lore.push({ type: 'preview-lore-good', text: bookLore[card.id] || `The text whispers of ${ASPECTS[art]?.name}. The more you read, the more the Art reveals itself between the lines.` });
          }
        }
        if (cards[1]) {
          const helperArt = cards[1].aspects?.find(a => TECHNIQUES.includes(a) || FORMS.includes(a));
          const textArt = card.aspects?.find(a => TECHNIQUES.includes(a) || FORMS.includes(a));
          if (helperArt === textArt) {
            lore.push({ type: 'preview-lore-good', text: 'Your existing understanding resonates with the text. Connections form between what you know and what the author intended.' });
          } else if (helperArt) {
            lore.push({ type: 'preview-lore-warn', text: 'This knowledge does not align with the text\'s subject. Like oil and water, the Arts resist mingling.' });
          }
        }
      }
      if (card.aspects?.includes('vis')) {
        const visLore = {
          'vis_vim': 'Raw Vim — the essence of magic itself. It hums against your skin, eager to be shaped.',
          'vis_ignem': 'The vis of fire flickers between your fingers, warm and hungry. Its essence will teach you Ignem.',
          'vis_corpus': 'Flesh-vis pulses with a slow heartbeat. To absorb it is to understand the body as the Art understands it.',
          'vis_mentem': 'Thought-vis presses against your mind like a half-remembered dream.',
          'vis_herbam': 'The vis smells of deep earth and growing things. It contains the memory of ancient forests.',
          'vis_terram': 'Stone-vis weighs more than it should. It carries the patience of mountains.',
          'vis_aquam': 'The vis flows and shifts in your hands, never quite the same shape twice.',
          'vis_auram': 'Wind-vis trembles without cause. Hold it near a window and the weather changes.',
          'vis_animal': 'The claw twitches in your grasp. Something primal stirs within it.',
          'vis_imaginem': 'The mirror shard reflects things that are not there. To study it is to question what you see.',
        };
        lore.push({ type: 'preview-lore-good', text: visLore[card.id] || 'Raw vis trembles in your grasp. Its essence will reveal the Form within.' });
        lore.push({ type: 'preview-lore-warn', text: pick(
          'Prolonged exposure to active magic causes changes that cannot be undone.',
          'Vis is volatile. Handle it carelessly, and it may leave marks upon your pattern.',
          'Magic remains an art, not a science. Vis sometimes warps the pattern of the caster.'
        )});
      }
      if (card.aspects?.includes('acumen')) {
        lore.push({ type: 'preview-lore-good', text: GameState.hubris > 0
          ? pick('You force yourself to think clearly, to apply cold reason against the whispering ambition.', 'Logic is the antidote to obsession. You sit with your thoughts, sorting truth from fascination.')
          : 'Your mind is already clear. There is nothing to dispel — only the quiet pleasure of ordered thought.'
        });
      }
      if (card.aspects?.includes('fervor')) {
        lore.push({ type: 'preview-lore-good', text: pick(
          'Passion is a rough teacher, but it may reveal what patience never would.',
          'The fire in your blood drives you past prudence. Sometimes the Art answers raw desire.',
          'Fervor opens doors that reason keeps locked.'
        )});
        lore.push({ type: 'preview-lore-warn', text: 'The deeper you go without discipline, the harder it becomes to look away.' });
      }
    }

    if (verbId === 'work') {
      if (recipe?.id === 'work_invent_spell') {
        const tech = cards.find(c => c.aspects?.some(a => TECHNIQUES.includes(a)));
        const form = cards.find(c => c.aspects?.some(a => FORMS.includes(a)));
        if (tech && form) {
          const t = tech.aspects.find(a => TECHNIQUES.includes(a));
          const f = form.aspects.find(a => FORMS.includes(a));
          lore.push({ type: 'preview-lore-good', text: pick(
            `${ASPECTS[t]?.name} meets ${ASPECTS[f]?.name}. The laboratory crackles as a new working takes shape — chalk circles, muttered Latin, the smell of ozone.`,
            `You weave ${ASPECTS[t]?.name} through ${ASPECTS[f]?.name}. Despite the Order's attempts to make magic a science, it remains an art. Your art.`
          )});
        }
      }
      if (recipe?.id === 'work_cast_spell') {
        lore.push({ type: 'preview-lore-good', text: pick(
          'You speak the words of power. The laboratory hums with potential.',
          'The spell awaits your voice. Magic is will made manifest — your will, shaped by years of study.',
          'No matter how skilled a practitioner, magic sometimes escapes control. You prepare carefully.'
        )});
      }
      if (recipe?.id?.includes('enchant') || recipe?.id?.includes('named_item')) {
        lore.push({ type: 'preview-lore-good', text: pick(
          'You pour vis into the prepared vessel. Verditius himself taught the secrets of binding magic into items.',
          'Spell and substance fuse into something greater than either alone. The item stirs with bound power.'
        )});
        lore.push({ type: 'preview-lore-warn', text: 'Enchantment exacts its toll. The warping of your pattern is the price of permanence.' });
      }
    }

    if (verbId === 'dream') {
      if (card.aspects?.includes('vigor')) {
        lore.push({ type: 'preview-lore-good', text: GameState.corruption > 0
          ? pick('You sleep deeply. The darkness recedes — slowly, reluctantly, like a tide that will return.', 'Rest is the oldest magic. The nightmares lose their grip, one finger at a time.')
          : pick('Undisturbed rest. In such moments, vis sometimes crystallizes from the dreamer\'s thoughts.', 'You sleep peacefully. A rare luxury for one who has seen what you have seen.')
        });
      }
      if (card.aspects?.includes('vim')) {
        lore.push({ type: 'preview-lore-good', text: pick(
          'You close your eyes and reach for the boundary. The Twilight — where the Enigma waits for those who dare to look.',
          'Magi of Criamon seek the Enigma — a mystical experience tied to the true nature of Wizards\' Twilight and of magic itself.'
        )});
        lore.push({ type: 'preview-lore-warn', text: pick(
          'Not all who enter return as they were. The Twilight marks those who cannot comprehend its nature.',
          'You feel your magic working from the inside. You are fully aware of every step of the process.'
        )});
      }
      if (card.aspects?.includes('mystery')) {
        const pathLore = {
          'enigma': 'The Enigma of Criamon — followers seek the true nature of Twilight. Each step reveals another layer of meaning in the patterns of existence.',
          'heartbeast': 'The ancestor-spirits reside within, granting the power to change shape. Birna called it "the beast of the heart."',
          'artifice': 'Verditius taught the secrets of binding. Your hands ache with the desire to shape — the Maker\'s path calls.',
          'arcadia': 'Faeries are drawn to mutable lives and passionate emotions. You step closer to their world of glamour and stolen vitality.',
          'necromancy': 'The dead have much to teach, if you dare listen. The boundary is thinner than the living suspect.',
          'runes': 'Ancient Scandinavian magic flows through channels Bonisagus never imagined. The Order of Odin remembers.',
          'hymns': 'Songs that shook the pillars of heaven. The Hyperborean tradition predates the Order by millennia.',
          'body': 'The body contains the universe. All places are within you.',
          'strife': 'Accept darkness so others need not. The path of the sin-eater.',
        };
        lore.push({ type: 'preview-lore-good', text: pathLore[card.mysteryPath] || 'The mystery deepens. Each step reveals another veil to part.' });
        lore.push({ type: 'preview-lore-warn', text: 'Fascination is the price of illumination.' });
      }
    }

    if (verbId === 'explore') {
      if (card.aspects?.includes('location')) {
        const locLore = {
          'standing_stones': 'The stones hum at dawn. Vis pools in the dew between them. This place was sacred before even the druids. What sleeps beneath?',
          'ruined_chapel': 'Once holy ground. Something dark has seeped into the foundations. Prayers echo wrong here — twisted, reversed, hungry.',
          'silver_wood': 'Trees with bark like polished metal. The grass blackens in hoofprints left by shining crimson horses. Faeries do not forget debts.',
          'hidden_cave': 'The walls glitter with crystallized vis. A regio may lie deeper — a place folded into the mundane world, waiting to be found.',
          'crossroads_inn': 'Travelers pass through bearing rumors. The innkeeper asks no questions. The wine is terrible but the information is priceless.',
          'covenant_ruins': 'The Aegis has long faded. Books may remain in the collapsed library — so might whatever destroyed this place.',
        };
        lore.push({ type: 'preview-lore-good', text: locLore[card.id] || `${card.name} — magical locations often contain regiones, boundaries between levels of reality that only the Gifted perceive.` });
        lore.push({ type: 'preview-lore-warn', text: pick(
          'Your absence will be noted. The mundane world watches those who wander where they should not.',
          'Exploration carries risk. Not all who venture into places of power return unscathed.'
        )});
      }
      if (card.aspects?.includes('intellego')) {
        lore.push({ type: 'preview-lore-good', text: pick(
          'You extend your senses beyond the mundane, seeking places where the world is thin — where vis collects like morning dew.',
          'Intellego reveals what is hidden. You can sense the boundaries between regio levels, feel the pulse of magical auras.'
        )});
      }
    }

    if (verbId === 'speak') {
      if (card.aspects?.includes('companion')) {
        const compLore = {
          'wandering_magus': 'A Magus of the Order — one of perhaps twelve hundred in all of Mythic Europe. He carries knowledge freely given, but nothing from the Order comes without expectation.',
          'hedge_witch': 'She follows traditions older than the Order, older than Rome. Her herb-lore comes from a time when the druids still held power.',
          'curious_youth': 'Young and eager. Grogs are minor characters in the Order\'s great story, but their loyalty can mean the difference between life and the pyre.',
          'faithful_grog': 'A sturdy soul who asks no questions. Warrior grogs defend the magi with their lives.',
        };
        lore.push({ type: 'preview-lore-good', text: compLore[card.id] || `${card.name} — even wizards need allies. The Gift makes people uneasy, and trust is hard-won.` });
      }
      if (card.aspects?.includes('coin')) {
        lore.push({ type: 'preview-lore-good', text: GameState.notoriety > 0
          ? pick('Silver has a way of making people forget. The Quaesitors themselves accept vis as gifts for their services — coin is the universal language.', 'The practice of wizardry breeds suspicion. Three things work against magical societies — mistrust, envy, and the effects of The Gift. Silver soothes them.')
          : 'There is nothing to smooth over. Your reputation among the mundanes is clean — a rare and valuable state.'
        });
      }
    }

    return lore;
  },

  // ================================================================
  //  STATUS BAR, TIMERS, NOTIFICATIONS, GAME OVER
  // ================================================================

  updateStatusBar() {
    for (const stat of ['warping', 'notoriety', 'corruption', 'hubris']) {
      const fill = document.getElementById(`${stat}-fill`);
      const value = document.getElementById(`${stat}-value`);
      const item = fill?.closest('.status-item');
      const v = GameState[stat];
      if (fill) {
        fill.style.width = `${(v / 10) * 100}%`;
        if (v >= 7) fill.style.background = '#e44';
      }
      if (value) value.textContent = v;
      if (item) {
        item.classList.remove('danger-high', 'danger-critical');
        if (v >= 8) item.classList.add('danger-critical');
        else if (v >= 6) item.classList.add('danger-high');
      }
    }
    document.getElementById('season-label').textContent = GameState.getSeasonName();
    document.getElementById('year-label').textContent = `Anno Domini ${GameState.year}`;
  },

  updateVerbTimers() {
    for (const verbId of GameState.unlockedVerbs) {
      const tf = document.querySelector(`#verb-${verbId} .verb-timer-fill`);
      if (tf) tf.style.width = `${TimerSystem.getProgress(`verb_${verbId}`)*100}%`;
    }
    // Update threat resolve timers
    if (typeof ThreatSystem !== 'undefined') {
      for (const threat of ThreatSystem.activeThreats) {
        if (!threat.resolving) continue;
        const fill = document.querySelector(`[data-threat-id="${threat.defId}"] .resolve-fill`);
        if (fill) fill.style.width = `${TimerSystem.getProgress(`threat_resolve_${threat.defId}`)*100}%`;
        const label = document.querySelector(`[data-threat-id="${threat.defId}"] .threat-resolve-label`);
        if (label) {
          const remainSec = Math.ceil(TimerSystem.getRemainingSeconds(`threat_resolve_${threat.defId}`));
          label.textContent = `Resolving... ${remainSec}s`;
        }
      }
    }
  },

  notify(message) {
    // Toast notification (fades after 4s)
    const el = document.createElement('div');
    el.className = 'notification';
    el.textContent = message;
    this.notificationArea.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 4000);

    // Also add to persistent log
    this.addLogEntry(message);
  },

  showGameOver(result) {
    document.getElementById('game-over-title').textContent = result.title;
    document.getElementById('game-over-text').textContent = result.text;
    this.gameOverOverlay.classList.remove('hidden');
  },

  showMenu() {
    this.menuOverlay.classList.remove('hidden');
    if (GameState.hasSavedGame()) document.getElementById('menu-continue').classList.remove('hidden');
  },

  returnToMenu() {
    if (GameState.initialized && !GameState.gameOver) {
      if (!GameState.paused) Game.togglePause();
      GameState.saveToStorage();
    }
    this.showMenu();
  },

  refresh() {
    this.renderVerbs();
    this.renderThreats();
    this.fitVerbArea();
    this.renderCards();
    this.updateStatusBar();
  },

  // ================================================================
  //  THREAT ZONE RENDERING
  // ================================================================

  renderThreats() {
    if (typeof ThreatSystem === 'undefined') return;

    // Remove old threat zone (we now render in verb area)
    const oldZone = document.getElementById('threat-zone');
    if (oldZone) oldZone.remove();

    // Remove old threat stations from verb area
    document.querySelectorAll('.threat-station').forEach(el => el.remove());

    const threats = ThreatSystem.activeThreats;
    if (threats.length === 0) return;

    for (const threat of threats) {
      const def = THREAT_DEFS[threat.defId];
      if (!def) continue;

      const urgency = threat.remainingSeasons <= 1 ? 'critical' :
                      threat.remainingSeasons <= 2 ? 'warning' : 'normal';
      const progress = 1 - (threat.remainingSeasons / threat.maxSeasons);

      const el = document.createElement('div');
      el.className = `threat-station threat-${urgency}`;
      el.dataset.threatId = def.id;

      // Build slot HTML — accepts the resolution card types
      const allAccepts = [...(def.resolveRequires || [])];
      if (def.resolveAlt?.requires) allAccepts.push(...def.resolveAlt.requires);
      const uniqueAccepts = [...new Set(allAccepts)];
      const acceptLabels = uniqueAccepts.map(r => ASPECTS[r]?.name || r).join(', ');

      // Check if a card is already placed in this threat's slot
      const slottedCard = GameState.verbCards[`threat_${def.id}`]?.[0];
      let slotContent = `<span>${acceptLabels}</span>`;
      if (slottedCard) {
        const artImg = getCardArtImage(slottedCard.id);
        const bgStyle = artImg
          ? `background-image:url('${artImg}');`
          : `background:${this.getCategoryColor(slottedCard.category)};`;
        const lockOverlay = threat.resolving ? '<div class="slot-card-lock">🔒</div>' : '';
        slotContent = `<div class="slot-card${threat.resolving ? ' resolving' : ''}" data-card-id="${slottedCard.id}" style="${bgStyle}color:white;">
          ${lockOverlay}<span class="slot-card-name">${slottedCard.name}</span></div>`;
      }

      // Show captured card info
      let capturedHtml = '';
      if (threat.capturedCard) {
        const cc = threat.capturedCard;
        const ccArt = getCardArtImage(cc.id);
        const ccBg = ccArt ? `background-image:url('${ccArt}');background-size:cover;background-position:center;` : `background:${this.getCategoryColor(cc.category)};`;
        capturedHtml = `<div class="threat-captured-slot">
          <div class="threat-captured-lock">🔒</div>
          <div class="threat-captured-card" style="${ccBg}"><span class="slot-card-name">${cc.name}</span></div>
        </div>`;
      }

      const timerText = `${threat.remainingSeasons} season${threat.remainingSeasons !== 1 ? 's' : ''}`;

      // Show resolve timer if resolving
      let resolveTimerHtml = '';
      if (threat.resolving) {
        const resolveProgress = TimerSystem.getProgress(`threat_resolve_${def.id}`);
        const remainSec = Math.ceil(TimerSystem.getRemainingSeconds(`threat_resolve_${def.id}`));
        resolveTimerHtml = `<div class="threat-resolve-timer">
          <span class="threat-resolve-label">Resolving... ${remainSec}s</span>
          <div class="threat-timer-bar"><div class="threat-timer-fill resolve-fill" style="width:${resolveProgress*100}%"></div></div>
        </div>`;
      }

      el.innerHTML = `
        <div class="threat-station-name">${def.name}</div>
        <div class="threat-station-body">
          <div class="threat-station-flavor">${def.flavor}</div>
          <div class="threat-station-consequence">If ignored: ${def.effectText.substring(0, 80)}${def.effectText.length > 80 ? '…' : ''}</div>
        </div>
        <div class="threat-station-slots">
          <div class="verb-slot threat-slot" data-threat-id="${def.id}" data-slot-index="0"
               data-accepts="${uniqueAccepts.join(',')}">${slotContent}</div>
          ${capturedHtml}
        </div>
        ${resolveTimerHtml}
        <div class="threat-station-timer">
          <span class="threat-timer-label">⏳ ${timerText}</span>
          <div class="threat-timer-bar"><div class="threat-timer-fill" style="width:${progress*100}%"></div></div>
        </div>
      `;

      // Click on slotted card to remove (only if not resolving)
      const slotCardEl = el.querySelector('.slot-card');
      if (slotCardEl && !threat.resolving) {
        slotCardEl.addEventListener('pointerdown', (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          if (!slottedCard) return;
          const rect = slotCardEl.getBoundingClientRect();
          this.dragState = {
            card: slottedCard, sourceEl: slotCardEl, ghost: null,
            startX: e.clientX, startY: e.clientY,
            offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
            dragging: false, pointerId: e.pointerId,
            isStack: false, stackKey: null,
            fromSlot: { verbId: `threat_${def.id}`, slotIndex: 0 }
          };
        });
      }

      // Click empty slot to highlight compatible cards
      el.querySelector('.threat-slot')?.addEventListener('click', (e) => {
        if (slottedCard) return;
        e.stopPropagation();
        this.clearHighlights();
        const accepts = new Set(uniqueAccepts);
        let n = 0;
        document.querySelectorAll('#card-area .card, #card-area .card-stack, #card-area .compact-card').forEach(cardEl => {
          const instanceId = cardEl.dataset.instanceId || cardEl.querySelector('.card')?.dataset.instanceId;
          const card = GameState.tableCards.find(c => c.instanceId === instanceId);
          if (card?.aspects?.some(a => accepts.has(a))) {
            cardEl.classList.add('hint-glow');
            n++;
          }
        });
        if (n === 0) {
          this.notify('No cards on the table can resolve this threat right now.');
        } else {
          const labels = uniqueAccepts.map(r => ASPECTS[r]?.name || r).join(', ');
          this.notify(`Highlighted ${n} card${n>1?'s':''} that can help: ${labels}.`);
        }
      });

      this.verbArea.appendChild(el);
    }
  }
};
