/**
 * OCCULTA MAGICAE — Headless Puppeteer Tests
 * Tests game loading, card rendering, drag-drop, recipes, and win/loss conditions.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

const GAME_DIR = path.resolve(__dirname, '..');
const PORT = 9877;
let server;
let browser;
let page;

// Simple static file server
function startServer() {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let filePath = path.join(GAME_DIR, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'
      };
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
      });
    });
    server.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
      resolve();
    });
  });
}

// ---- TEST RUNNER ----
let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    results.push(`  ✅ ${message}`);
  } else {
    failed++;
    results.push(`  ❌ ${message}`);
  }
}

async function run() {
  try {
    await startServer();
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    // Capture console errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    console.log('\n🏰 OCCULTA MAGICAE — Test Suite\n');

    // ================================================================
    // TEST 1: Page loads without errors
    // ================================================================
    console.log('Test Group: Page Loading');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#menu-overlay');
    assert(errors.length === 0, `Page loads without JS errors (${errors.length} errors)`);
    if (errors.length > 0) {
      console.log('    Errors:', errors.slice(0, 3).join('; '));
    }

    // ================================================================
    // TEST 2: Menu overlay displays
    // ================================================================
    console.log('Test Group: Menu Screen');
    const menuVisible = await page.$eval('#menu-overlay', el => !el.classList.contains('hidden'));
    assert(menuVisible, 'Menu overlay is visible on load');

    const titleText = await page.$eval('#menu-content h1', el => el.textContent);
    assert(titleText === 'Occulta Magicae', `Title displays correctly: "${titleText}"`);

    const startBtn = await page.$('#menu-new');
    assert(startBtn !== null, 'New Game button exists');

    // ================================================================
    // TEST 3: Game starts when clicking threshold button
    // ================================================================
    console.log('Test Group: Game Start');
    await page.click('#menu-new');
    await new Promise(r => setTimeout(r, 500));

    const menuHidden = await page.$eval('#menu-overlay', el => el.classList.contains('hidden'));
    assert(menuHidden, 'Menu overlay hides after clicking start');

    // ================================================================
    // TEST 4: Cards render on the table
    // ================================================================
    console.log('Test Group: Card Rendering');
    const cardCount = await page.$$eval('#card-area .card', cards => cards.length);
    assert(cardCount > 0, `Cards render on table (${cardCount} cards found)`);
    assert(cardCount >= 8, `Starting hand has at least 8 cards (found ${cardCount})`);

    // ================================================================
    // TEST 5: Verify starting cards include specific ones
    // ================================================================
    const cardNames = await page.$$eval('#card-area .card .card-title', els => els.map(e => e.textContent));
    assert(cardNames.includes('The Gift'), 'Starting cards include "The Gift"');
    assert(cardNames.includes('A Tattered Folio'), 'Starting cards include "A Tattered Folio"');
    assert(cardNames.some(n => n.includes('Silver')), 'Starting cards include silver pennies');
    assert(cardNames.includes('Your Vigor'), 'Starting cards include "Your Vigor"');
    assert(cardNames.includes('Your Acumen'), 'Starting cards include "Your Acumen"');

    // ================================================================
    // TEST 6: Verb stations render
    // ================================================================
    console.log('Test Group: Verb Stations');
    const verbCount = await page.$$eval('.verb-station', vs => vs.length);
    assert(verbCount >= 2, `At least 2 verb stations render (found ${verbCount})`);

    const verbNames = await page.$$eval('.verb-name', els => els.map(e => e.textContent.trim()));
    assert(verbNames.some(n => n.includes('Study')), 'Study verb station exists');
    assert(verbNames.some(n => n.includes('Time')), 'Time Passes verb station exists');

    // ================================================================
    // TEST 7: Status bar renders
    // ================================================================
    console.log('Test Group: Status Bar');
    const warpingValue = await page.$eval('#warping-value', el => el.textContent);
    assert(warpingValue === '0', `Warping starts at 0 (got "${warpingValue}")`);

    const seasonLabel = await page.$eval('#season-label', el => el.textContent);
    assert(seasonLabel === 'Spring', `Season starts as Spring (got "${seasonLabel}")`);

    const yearLabel = await page.$eval('#year-label', el => el.textContent);
    assert(yearLabel.includes('1220'), `Year starts at 1220 (got "${yearLabel}")`);

    // ================================================================
    // TEST 8: Card detail overlay works (single click)
    // ================================================================
    console.log('Test Group: Card Interactions');
    const detailTestResult = await page.evaluate(() => {
      // Simulate single click (pointerdown + pointerup without movement)
      const cards = document.querySelectorAll('#card-area .card');
      if (cards.length === 0) return { error: 'no cards' };
      const card = cards[0];
      const rect = card.getBoundingClientRect();
      const x = rect.left + 10, y = rect.top + 10;
      card.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, button: 0, bubbles: true, pointerId: 1 }));
      document.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, button: 0, bubbles: true, pointerId: 1 }));

      const visible = !document.getElementById('card-detail-overlay').classList.contains('hidden');
      const title = document.getElementById('card-detail-title').textContent;
      return { visible, title };
    });
    assert(detailTestResult.visible, 'Single click opens card detail overlay');
    assert(detailTestResult.title?.length > 0, `Card detail shows title: "${detailTestResult.title}"`);

    await page.click('#card-detail-close');
    await new Promise(r => setTimeout(r, 200));
    const detailHidden = await page.$eval('#card-detail-overlay', el => el.classList.contains('hidden'));
    assert(detailHidden, 'Close button hides card detail overlay');

    // ================================================================
    // TEST 9: Game state internals
    // ================================================================
    console.log('Test Group: Game State');
    const stateCheck = await page.evaluate(() => {
      return {
        initialized: GameState.initialized,
        tableCardCount: GameState.tableCards.length,
        season: GameState.season,
        year: GameState.year,
        warping: GameState.warping,
        unlockedVerbs: GameState.unlockedVerbs,
        artsInitialized: Object.keys(GameState.arts).length === 15
      };
    });
    assert(stateCheck.initialized, 'GameState is initialized');
    assert(stateCheck.tableCardCount >= 8, `GameState has ${stateCheck.tableCardCount} table cards`);
    assert(stateCheck.season === 0, 'Season is 0 (Spring)');
    assert(stateCheck.year === 1220, 'Year is 1220');
    assert(stateCheck.warping === 0, 'Warping starts at 0');
    assert(stateCheck.unlockedVerbs.includes('study'), 'Study verb is unlocked');
    assert(stateCheck.artsInitialized, 'All 15 arts are tracked');

    // ================================================================
    // TEST 10: CardDB populated
    // ================================================================
    console.log('Test Group: Content Database');
    const dbCheck = await page.evaluate(() => {
      const keys = Object.keys(CardDB);
      return {
        totalCards: keys.length,
        hasTechniques: keys.filter(k => k.startsWith('creo_')).length >= 5,
        hasForms: keys.filter(k => k.startsWith('ignem_')).length >= 5,
        hasVis: keys.filter(k => k.startsWith('vis_')).length >= 5,
        hasMysteries: keys.filter(k => k.startsWith('mystery_')).length >= 10,
        hasSpells: keys.filter(k => k.startsWith('spell_')).length >= 5,
        hasThreats: keys.filter(k => k.startsWith('threat_')).length >= 3,
      };
    });
    assert(dbCheck.totalCards > 50, `CardDB has ${dbCheck.totalCards} card definitions`);
    assert(dbCheck.hasTechniques, 'All 5 Creo technique levels exist');
    assert(dbCheck.hasForms, 'All 5 Ignem form levels exist');
    assert(dbCheck.hasVis, 'At least 5 vis card types exist');
    assert(dbCheck.hasMysteries, 'At least 10 mystery cards exist');
    assert(dbCheck.hasSpells, 'At least 5 spell cards exist');
    assert(dbCheck.hasThreats, 'At least 3 threat cards exist');

    // ================================================================
    // TEST 11: Recipe engine finds matches
    // ================================================================
    console.log('Test Group: Recipe Engine');
    const recipeCheck = await page.evaluate(() => {
      // Test: studying a text should match
      const textCard = CardFactory.create('tattered_folio');
      const match1 = RecipeEngine.findMatch('study', [textCard]);

      // Test: studying vis should match
      const visCard = CardFactory.create('vis_vim');
      const match2 = RecipeEngine.findMatch('study', [visCard]);

      // Test: work with two lore cards (technique + form)
      const creoCard = CardFactory.create('creo_2');
      const ignemCard = CardFactory.create('ignem_2');
      const match3 = RecipeEngine.findMatch('work', [creoCard, ignemCard]);

      return {
        studyText: match1?.id || null,
        studyVis: match2?.id || null,
        workSpell: match3?.id || null
      };
    });
    assert(recipeCheck.studyText === 'study_text_to_art', `Study + Text matches recipe (got ${recipeCheck.studyText})`);
    assert(recipeCheck.studyVis === 'study_vis_to_art', `Study + Vis matches recipe (got ${recipeCheck.studyVis})`);
    assert(recipeCheck.workSpell === 'work_invent_spell', `Work + Technique + Form matches spell recipe (got ${recipeCheck.workSpell})`);

    // ================================================================
    // TEST 12: Recipe execution produces cards
    // ================================================================
    console.log('Test Group: Recipe Execution');
    const execCheck = await page.evaluate(() => {
      // Simulate studying a text
      const textCard = CardFactory.create('tattered_folio');
      const recipe = RecipeEngine.findMatch('study', [textCard]);
      const results = RecipeEngine.execute(recipe, [textCard]);

      return {
        hasNewCards: results.newCards.length > 0,
        hasNotifications: results.notifications.length > 0,
        firstCardName: results.newCards[0]?.name || 'none'
      };
    });
    assert(execCheck.hasNewCards, 'Studying a text produces new cards');
    assert(execCheck.hasNotifications, 'Studying a text produces notifications');

    // ================================================================
    // TEST 13: Mystery system tracks progress
    // ================================================================
    console.log('Test Group: Mystery System');
    const mysteryCheck = await page.evaluate(() => {
      return {
        pathsExist: Object.keys(MysterySystem.paths).length >= 4,
        enigmaComplete: MysterySystem.isComplete('enigma'),
        initialProgress: MysterySystem.getProgress('enigma')
      };
    });
    const pathCount = await page.evaluate(() => Object.keys(MysterySystem.paths).length);
    assert(mysteryCheck.pathsExist, `${pathCount} mystery paths defined`);
    assert(!mysteryCheck.enigmaComplete, 'Enigma starts incomplete');
    assert(mysteryCheck.initialProgress === 0 || mysteryCheck.initialProgress === 1,
      'Enigma progress starts at 0 or 1');

    // ================================================================
    // TEST 14: Win/loss conditions check properly
    // ================================================================
    console.log('Test Group: Win/Loss Conditions');
    const winLossCheck = await page.evaluate(() => {
      // No win at start
      const noWin = MysterySystem.checkWinConditions();
      const noLoss = MysterySystem.checkLossConditions();

      // Simulate loss condition
      GameState.notoriety = 10;
      const lossResult = MysterySystem.checkLossConditions();
      GameState.notoriety = 0; // Reset

      return {
        noWinAtStart: noWin === null,
        noLossAtStart: noLoss === null,
        lossAtMax: lossResult?.type || null
      };
    });
    assert(winLossCheck.noWinAtStart, 'No win condition at start');
    assert(winLossCheck.noLossAtStart, 'No loss condition at start');
    assert(winLossCheck.lossAtMax === 'inquisition', 'Notoriety 10 triggers Inquisition loss');

    // ================================================================
    // TEST 14b: Stat enums and modifyStat validation
    // ================================================================
    console.log('Test Group: Stat Enums');
    const enumCheck = await page.evaluate(() => {
      const errors = [];
      // STATS enum exists and has all four stats
      if (!STATS || !STATS.WARPING || !STATS.NOTORIETY || !STATS.CORRUPTION || !STATS.HUBRIS) {
        errors.push('STATS enum missing or incomplete');
      }
      // modifyStat works with valid names
      const before = { w: GameState.warping, n: GameState.notoriety, c: GameState.corruption, h: GameState.hubris };
      GameState.modifyStat(STATS.NOTORIETY, 2);
      GameState.modifyStat(STATS.CORRUPTION, 3);
      GameState.modifyStat(STATS.HUBRIS, 1);
      const after = { n: GameState.notoriety, c: GameState.corruption, h: GameState.hubris };
      if (after.n !== before.n + 2) errors.push('notoriety did not change');
      if (after.c !== before.c + 3) errors.push('corruption did not change');
      if (after.h !== before.h + 1) errors.push('hubris did not change');
      // Reset
      GameState.notoriety = 0; GameState.corruption = 0; GameState.hubris = 0;
      // modifyStat rejects invalid names (should log error but not crash)
      const origError = console.error;
      let errorLogged = false;
      console.error = () => { errorLogged = true; };
      GameState.modifyStat('suspicion', 1); // old name should fail
      GameState.modifyStat('dread', 1); // old name should fail
      console.error = origError;
      if (!errorLogged) errors.push('modifyStat did not reject invalid stat name');
      return { errors, statsEnum: Object.values(STATS) };
    });
    assert(enumCheck.errors.length === 0, `Stat enums work correctly${enumCheck.errors.length > 0 ? ': ' + enumCheck.errors.join('; ') : ''}`);
    assert(enumCheck.statsEnum.length === 4, 'STATS enum has 4 values');

    // ================================================================
    // TEST 15: Timer system works
    // ================================================================
    console.log('Test Group: Timer System');
    const timerCheck = await page.evaluate(() => {
      let completed = false;
      TimerSystem.create('test_timer', 100, () => { completed = true; });
      TimerSystem.update(50);
      const halfway = TimerSystem.getProgress('test_timer');
      TimerSystem.update(60);
      TimerSystem.remove('test_timer');

      return {
        halfwayProgress: halfway,
        completed: completed
      };
    });
    assert(Math.abs(timerCheck.halfwayProgress - 0.5) < 0.01, `Timer at 50/100ms shows ~50% progress (got ${timerCheck.halfwayProgress})`);
    assert(timerCheck.completed, 'Timer fires completion callback');

    // ================================================================
    // TEST 16: Card aspects and matching work
    // ================================================================
    console.log('Test Group: Card Aspects');
    const aspectCheck = await page.evaluate(() => {
      const card = CardFactory.create('vis_ignem');
      return {
        hasVis: CardFactory.hasAspect(card, 'vis'),
        hasIgnem: CardFactory.hasAspect(card, 'ignem'),
        noCorpus: !CardFactory.hasAspect(card, 'corpus'),
        matchesVis: CardFactory.matchesSlot(card, 'vis'),
        matchesArray: CardFactory.matchesSlot(card, ['vis', 'lore']),
        noMatchMentem: !CardFactory.matchesSlot(card, 'mentem')
      };
    });
    assert(aspectCheck.hasVis, 'Ignem vis card has vis aspect');
    assert(aspectCheck.hasIgnem, 'Ignem vis card has ignem aspect');
    assert(aspectCheck.noCorpus, 'Ignem vis card does not have corpus aspect');
    assert(aspectCheck.matchesVis, 'Card matches vis slot requirement');
    assert(aspectCheck.matchesArray, 'Card matches array slot requirement');
    assert(aspectCheck.noMatchMentem, 'Card does not match mentem slot');

    // ================================================================
    // TEST 17: Flavor text quality check
    // ================================================================
    console.log('Test Group: Content Quality');
    const flavorCheck = await page.evaluate(() => {
      const cards = Object.values(CardDB);
      const withFlavor = cards.filter(c => c.flavor && c.flavor.length > 20);
      const avgLength = withFlavor.reduce((sum, c) => sum + c.flavor.length, 0) / withFlavor.length;

      // Check for placeholder or generic text
      const genericPatterns = ['placeholder', 'TODO', 'FIXME', 'lorem ipsum'];
      const hasGeneric = cards.some(c => c.flavor && genericPatterns.some(p => c.flavor.toLowerCase().includes(p)));

      return {
        totalCards: cards.length,
        withFlavor: withFlavor.length,
        avgFlavorLength: Math.round(avgLength),
        hasGenericText: hasGeneric,
        sampleFlavor: withFlavor.slice(0, 3).map(c => ({ name: c.name, flavor: c.flavor }))
      };
    });
    assert(flavorCheck.withFlavor > 50, `${flavorCheck.withFlavor} cards have meaningful flavor text`);
    assert(flavorCheck.avgFlavorLength > 40, `Average flavor text length: ${flavorCheck.avgFlavorLength} chars`);
    assert(!flavorCheck.hasGenericText, 'No placeholder or generic text found');

    // ================================================================
    // TEST 18: Season advancement works
    // ================================================================
    console.log('Test Group: Season Mechanics');
    const seasonCheck = await page.evaluate(() => {
      const before = { season: GameState.season, year: GameState.year };
      GameState.advanceSeason();
      const after1 = { season: GameState.season, year: GameState.year };
      GameState.advanceSeason();
      GameState.advanceSeason();
      GameState.advanceSeason(); // Should wrap to next year
      const after4 = { season: GameState.season, year: GameState.year };

      // Reset
      GameState.season = 0;
      GameState.year = 1220;

      return { before, after1, after4 };
    });
    assert(seasonCheck.after1.season === 1, 'Season advances from 0 to 1');
    assert(seasonCheck.after4.year === seasonCheck.before.year + 1, 'Year advances after 4 seasons');

    // ================================================================
    // TEST 19: Game over screen can display
    // ================================================================
    console.log('Test Group: Game Over');
    const gameOverCheck = await page.evaluate(() => {
      const overlay = document.getElementById('game-over-overlay');
      overlay.classList.remove('hidden');
      document.getElementById('game-over-title').textContent = 'Test Victory';
      document.getElementById('game-over-text').textContent = 'You have won the test.';
      const visible = !overlay.classList.contains('hidden');
      overlay.classList.add('hidden');
      return { visible };
    });
    assert(gameOverCheck.visible, 'Game over overlay can be shown');

    // ================================================================
    // TEST 20: Pointer-based drag system works
    // ================================================================
    console.log('Test Group: Drag & Drop');
    const dndCheck = await page.evaluate(() => {
      const cards = document.querySelectorAll('#card-area .card');
      const stacks = document.querySelectorAll('#card-area .card-stack');
      const slots = document.querySelectorAll('.verb-slot');

      // Individual cards should have touch-action:none; stacks handle it at stack level
      const directCards = document.querySelectorAll('#card-area > .card');
      const hasPointerSetup = Array.from(directCards).every(c => c.style.touchAction === 'none')
        && Array.from(stacks).every(s => s.style.touchAction === 'none');

      // Simulate a full pointer-drag: pick up the folio card and drop on study slot
      const folioCard = GameState.tableCards.find(c => c.id === 'tattered_folio');
      const studySlot = document.querySelector('.verb-slot[data-verb-id="study"][data-slot-index="0"]');

      let dragWorked = false;
      if (folioCard && studySlot) {
        const cardEl = document.querySelector(`[data-instance-id="${folioCard.instanceId}"]`);
        if (cardEl) {
          const cardRect = cardEl.getBoundingClientRect();
          const slotRect = studySlot.getBoundingClientRect();

          // Simulate pointerdown on card
          const downEvt = new PointerEvent('pointerdown', {
            clientX: cardRect.left + 10, clientY: cardRect.top + 10,
            button: 0, bubbles: true, pointerId: 1
          });
          cardEl.dispatchEvent(downEvt);

          // Simulate pointermove (past threshold)
          const moveEvt1 = new PointerEvent('pointermove', {
            clientX: cardRect.left + 20, clientY: cardRect.top + 20,
            button: 0, bubbles: true, pointerId: 1
          });
          document.dispatchEvent(moveEvt1);

          // Simulate pointermove to slot
          const moveEvt2 = new PointerEvent('pointermove', {
            clientX: slotRect.left + slotRect.width / 2,
            clientY: slotRect.top + slotRect.height / 2,
            button: 0, bubbles: true, pointerId: 1
          });
          document.dispatchEvent(moveEvt2);

          // Simulate pointerup on slot
          const upEvt = new PointerEvent('pointerup', {
            clientX: slotRect.left + slotRect.width / 2,
            clientY: slotRect.top + slotRect.height / 2,
            button: 0, bubbles: true, pointerId: 1
          });
          document.dispatchEvent(upEvt);

          // Check if card was placed in slot
          const verbCards = GameState.verbCards.study || {};
          dragWorked = verbCards[0] && verbCards[0].id === 'tattered_folio';
        }
      }

      return {
        cardCount: cards.length,
        hasPointerSetup: hasPointerSetup,
        verbSlots: slots.length,
        dragWorked: dragWorked
      };
    });
    assert(dndCheck.hasPointerSetup, 'Cards have touch-action:none for pointer events');
    assert(dndCheck.verbSlots >= 1, `${dndCheck.verbSlots} verb slots exist for dropping`);
    assert(dndCheck.dragWorked, 'Pointer drag-and-drop successfully places card in slot');

    // ================================================================
    // RESULTS
    // ================================================================
    console.log('\n' + results.join('\n'));
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log(`${'═'.repeat(50)}\n`);

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    if (browser) await browser.close();
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
