// ============================================================
// EXPANSION_TEST.JS — Tests for the expansion content
// ============================================================
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9882;
let server, browser, page;
let passed = 0, failed = 0, total = 0;

function assert(condition, message) {
  total++;
  if (condition) { passed++; console.log(`  ✓ ${message}`); }
  else { failed++; console.log(`  ✗ FAIL: ${message}`); }
}

async function run() {
  // Start server
  const root = path.join(__dirname, '..');
  server = http.createServer((req, res) => {
    let filePath = path.join(root, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  await new Promise(r => server.listen(PORT, r));

  browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));

  // Start a new game
  await page.evaluate(() => {
    document.getElementById('menu-new').click();
  });
  await new Promise(r => setTimeout(r, 500));

  // ================================================================
  // TEST 1: New card definitions exist
  // ================================================================
  console.log('Test Group: Expansion Cards');
  const cardCounts = await page.evaluate(() => {
    const allCards = Object.keys(CardDB);
    const spells = allCards.filter(id => id.startsWith('spell_'));
    const items = allCards.filter(id => id.startsWith('item_'));
    const locations = allCards.filter(id => CardDB[id].category === 'location');
    const companions = allCards.filter(id => CardDB[id].category === 'companion');
    const mysteries = allCards.filter(id => id.startsWith('mystery_'));
    return {
      total: allCards.length,
      spells: spells.length,
      items: items.length,
      locations: locations.length,
      companions: companions.length,
      mysteries: mysteries.length,
    };
  });
  assert(cardCounts.total > 200, `Total cards: ${cardCounts.total} (>200)`);
  assert(cardCounts.spells >= 30, `Spells: ${cardCounts.spells} (>=30)`);
  assert(cardCounts.items >= 10, `Items: ${cardCounts.items} (>=10)`);
  assert(cardCounts.locations >= 16, `Locations: ${cardCounts.locations} (>=16)`);
  assert(cardCounts.companions >= 10, `Companions: ${cardCounts.companions} (>=10)`);
  assert(cardCounts.mysteries >= 30, `Mysteries: ${cardCounts.mysteries} (>=30)`);

  // ================================================================
  // TEST 2: Expansion spell cards are well-formed
  // ================================================================
  console.log('Test Group: Expansion Spell Quality');
  const spellCheck = await page.evaluate(() => {
    const expansionSpells = [
      'spell_purification_of_wounds', 'spell_conjure_mystic_tower',
      'spell_incantation_of_lightning', 'spell_sight_beyond_sight',
      'spell_gift_of_bears_fortitude', 'spell_touch_of_winter',
      'spell_wind_of_mundane_silence', 'spell_dominion_absolute',
    ];
    const results = {};
    for (const id of expansionSpells) {
      const card = CardDB[id];
      results[id] = {
        exists: !!card,
        hasAspects: card?.aspects?.length >= 3,
        hasSpellAspect: card?.aspects?.includes('spell'),
        hasFlavor: card?.flavor?.length > 20,
        hasLevel: (card?.level || 0) >= 1,
      };
    }
    return results;
  });
  for (const [id, r] of Object.entries(spellCheck)) {
    assert(r.exists, `${id} exists`);
    assert(r.hasSpellAspect, `${id} has spell aspect`);
    assert(r.hasFlavor, `${id} has flavor text`);
  }

  // ================================================================
  // TEST 3: Threat system exists and is functional
  // ================================================================
  console.log('Test Group: Threat System');
  const threatCheck = await page.evaluate(() => {
    const hasThreatSystem = typeof ThreatSystem !== 'undefined';
    const hasThreatDefs = typeof THREAT_DEFS !== 'undefined';
    const threatCount = hasThreatDefs ? Object.keys(THREAT_DEFS).length : 0;

    // Test spawning
    if (hasThreatSystem) {
      ThreatSystem.reset();
      ThreatSystem.spawnThreat('suspicious_villagers');
      const spawned = ThreatSystem.activeThreats.length === 1;
      const timer = ThreatSystem.activeThreats[0]?.remainingSeasons === 3;

      // Test tick
      ThreatSystem.activeThreats[0].remainingSeasons = 1;
      const tickResult = ThreatSystem.tickTimers();
      const expired = ThreatSystem.activeThreats.length === 0;

      ThreatSystem.reset();
      return { hasThreatSystem, hasThreatDefs, threatCount, spawned, timer, expired };
    }
    return { hasThreatSystem, hasThreatDefs, threatCount };
  });
  assert(threatCheck.hasThreatSystem, 'ThreatSystem exists');
  assert(threatCheck.hasThreatDefs, 'THREAT_DEFS exists');
  assert(threatCheck.threatCount >= 15, `${threatCheck.threatCount} threat definitions (>=15)`);
  assert(threatCheck.spawned, 'Threat spawns correctly');
  assert(threatCheck.timer, 'Threat timer set correctly');
  assert(threatCheck.expired, 'Threat expires on timer=0');

  // ================================================================
  // TEST 4: New mystery paths
  // ================================================================
  console.log('Test Group: Expansion Mystery Paths');
  const mysteryPaths = await page.evaluate(() => {
    const paths = Object.keys(MysterySystem.paths);
    const newPaths = ['necromancy', 'runes', 'hymns', 'body', 'strife'];
    return {
      totalPaths: paths.length,
      newPathsExist: newPaths.every(p => paths.includes(p)),
      allHaveSteps: paths.every(p => MysterySystem.paths[p].steps === 4),
      allHaveRewards: paths.every(p => MysterySystem.paths[p].rewards.length === 4),
      allHaveDescription: paths.every(p => MysterySystem.paths[p].description?.length > 10),
    };
  });
  assert(mysteryPaths.totalPaths >= 9, `${mysteryPaths.totalPaths} mystery paths (>=9)`);
  assert(mysteryPaths.newPathsExist, 'All 5 new mystery paths exist');
  assert(mysteryPaths.allHaveSteps, 'All paths have 4 steps');
  assert(mysteryPaths.allHaveRewards, 'All paths have 4 rewards');

  // ================================================================
  // TEST 5: New win conditions
  // ================================================================
  console.log('Test Group: Expansion Win Conditions');
  const winConditions = await page.evaluate(() => {
    // Test Covenant Primus
    GameState.reset();
    GameState.initialized = true;
    GameState.addCard(CardFactory.create('spell_aegis_of_the_hearth'));
    GameState.addCard(CardFactory.create('wandering_magus'));
    GameState.addCard(CardFactory.create('hedge_witch'));
    GameState.addCard(CardFactory.create('faithful_grog'));
    GameState.addCard(CardFactory.create('standing_stones'));
    GameState.addCard(CardFactory.create('hidden_cave'));
    GameState.addCard(CardFactory.create('tattered_folio'));
    GameState.addCard(CardFactory.create('summa_vim'));
    GameState.addCard(CardFactory.create('coded_journal'));
    const covenantWin = MysterySystem.checkWinConditions();

    // Test that no false win at start
    GameState.reset();
    const noWin = MysterySystem.checkWinConditions();

    // Test Hymn Primordial
    GameState.reset();
    GameState.mysteryProgress.hymns = 4;
    GameState.warping = 5;
    const hymnWin = MysterySystem.checkWinConditions();

    GameState.reset();

    return {
      covenantWin: covenantWin?.type === 'covenant_primus',
      noFalseWin: noWin === null,
      hymnWin: hymnWin?.type === 'hymn_primordial',
    };
  });
  assert(winConditions.covenantWin, 'Covenant Primus win triggers correctly');
  assert(winConditions.noFalseWin, 'No false win at start');
  assert(winConditions.hymnWin, 'Hymn Primordial win triggers correctly');

  // ================================================================
  // TEST 6: New locations have proper data
  // ================================================================
  console.log('Test Group: Expansion Locations');
  const locCheck = await page.evaluate(() => {
    const newLocs = [
      'basilica_of_columns', 'pompeii_regio', 'garden_of_hesperides',
      'witch_of_endor_cave', 'sacred_grove_dindymene', 'sunken_library',
      'dragons_hoard', 'apollos_sanctuary', 'purgatory_pass', 'tower_of_babel_ruins'
    ];
    return newLocs.map(id => ({
      id,
      exists: !!CardDB[id],
      hasLocation: CardDB[id]?.aspects?.includes('location'),
      hasFlavor: CardDB[id]?.flavor?.length > 15,
      hasLevel: (CardDB[id]?.level || 0) >= 1,
    }));
  });
  for (const loc of locCheck) {
    assert(loc.exists && loc.hasLocation && loc.hasFlavor, `Location ${loc.id} properly defined`);
  }

  // ================================================================
  // TEST 7: New companions have proper data
  // ================================================================
  console.log('Test Group: Expansion Companions');
  const companionCheck = await page.evaluate(() => {
    const newCompanions = [
      'companion_crusader_knight', 'companion_faerie_changeling',
      'companion_ghostly_scholar', 'companion_repentant_diabolist',
      'companion_runecaster', 'companion_travelling_merchant',
      'companion_hungry_familiar'
    ];
    return newCompanions.map(id => ({
      id,
      exists: !!CardDB[id],
      hasCompanion: CardDB[id]?.aspects?.includes('companion'),
      hasPassive: !!CardDB[id]?.passive,
      hasFlavor: CardDB[id]?.flavor?.length > 15,
    }));
  });
  for (const comp of companionCheck) {
    assert(comp.exists && comp.hasCompanion, `Companion ${comp.id} properly defined`);
    assert(comp.hasPassive, `Companion ${comp.id} has passive effect`);
  }

  // ================================================================
  // TEST 8: Items have passive effects
  // ================================================================
  console.log('Test Group: Expansion Items');
  const itemCheck = await page.evaluate(() => {
    const items = Object.entries(CardDB).filter(([id, c]) => id.startsWith('item_'));
    return {
      count: items.length,
      allHavePassive: items.every(([_, c]) => !!c.passive),
      allHaveFlavor: items.every(([_, c]) => c.flavor?.length > 15),
      allHaveItem: items.every(([_, c]) => c.aspects?.includes('item')),
    };
  });
  assert(itemCheck.count >= 10, `${itemCheck.count} named items exist (>=10)`);
  assert(itemCheck.allHavePassive, 'All items have passive effects');
  assert(itemCheck.allHaveItem, 'All items have item aspect');

  // ================================================================
  // TEST 9: Threat UI renders
  // ================================================================
  console.log('Test Group: Threat UI');
  const threatUI = await page.evaluate(() => {
    // Spawn a threat and trigger render
    ThreatSystem.reset();
    ThreatSystem.spawnThreat('suspicious_villagers');
    UI.renderThreats();
    const stations = document.querySelectorAll('.threat-station');
    const result = {
      stationCount: stations.length,
      hasName: stations[0]?.querySelector('.threat-station-name')?.textContent?.length > 0,
      hasTimer: stations[0]?.querySelector('.threat-timer-label')?.textContent?.includes('season'),
      hasSlot: stations[0]?.querySelector('.threat-slot') !== null,
    };
    ThreatSystem.reset();
    UI.renderThreats();
    return result;
  });
  assert(threatUI.stationCount === 1, 'Threat station renders');
  assert(threatUI.hasName, 'Threat station has name');
  assert(threatUI.hasTimer, 'Threat station has timer');
  assert(threatUI.hasSlot, 'Threat station has resolution slot');

  // ================================================================
  // TEST 10: Save/load preserves threats
  // ================================================================
  console.log('Test Group: Save/Load Threats');
  const saveLoadCheck = await page.evaluate(() => {
    ThreatSystem.reset();
    ThreatSystem.spawnThreat('curious_priest');
    const json = GameState.toJSON();
    const hasThreats = json.threats?.activeThreats?.length === 1;

    // Load into fresh state
    ThreatSystem.reset();
    GameState.fromJSON(json);
    const loaded = ThreatSystem.activeThreats.length === 1;
    const correctThreat = ThreatSystem.activeThreats[0]?.defId === 'curious_priest';

    ThreatSystem.reset();
    return { hasThreats, loaded, correctThreat };
  });
  assert(saveLoadCheck.hasThreats, 'Threats included in save data');
  assert(saveLoadCheck.loaded, 'Threats loaded from save');
  assert(saveLoadCheck.correctThreat, 'Correct threat restored');

  // ================================================================
  // TEST 11: Threat resolution works
  // ================================================================
  console.log('Test Group: Threat Resolution');
  const resolveCheck = await page.evaluate(() => {
    ThreatSystem.reset();
    ThreatSystem.spawnThreat('suspicious_villagers');

    // Try resolving with wrong requirements (no matching aspect)
    const wrongResult = ThreatSystem.resolveThreat('suspicious_villagers', [
      { aspects: ['companion'] }
    ]);

    // Try resolving with correct requirements
    const rightResult = ThreatSystem.resolveThreat('suspicious_villagers', [
      { aspects: ['coin'] }
    ]);

    ThreatSystem.reset();
    return {
      wrongFails: wrongResult === null,
      rightSucceeds: rightResult?.resolved === true,
      rightHasText: rightResult?.text?.length > 0,
    };
  });
  assert(resolveCheck.wrongFails, 'Wrong requirements do not resolve threat');
  assert(resolveCheck.rightSucceeds, 'Correct requirements resolve threat');
  assert(resolveCheck.rightHasText, 'Resolution has descriptive text');

  // ================================================================
  // TEST 12: Flavor text quality for expansion cards
  // ================================================================
  console.log('Test Group: Expansion Writing Quality');
  const writingCheck = await page.evaluate(() => {
    const expansionCards = Object.entries(CardDB).filter(([id]) =>
      id.startsWith('spell_') || id.startsWith('item_') ||
      id.startsWith('companion_') || id.startsWith('mystery_necromancy') ||
      id.startsWith('mystery_runes') || id.startsWith('mystery_hymns')
    );

    const results = {
      totalChecked: expansionCards.length,
      allHaveFlavor: expansionCards.every(([_, c]) => c.flavor && c.flavor.length > 15),
      avgLength: 0,
      noGenericText: expansionCards.every(([_, c]) =>
        !c.flavor?.includes('placeholder') && !c.flavor?.includes('TODO')
      ),
    };

    const lengths = expansionCards.map(([_, c]) => c.flavor?.length || 0);
    results.avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    return results;
  });
  assert(writingCheck.allHaveFlavor, 'All expansion cards have flavor text');
  assert(writingCheck.avgLength >= 40, `Avg flavor text: ${writingCheck.avgLength} chars (>=40)`);
  assert(writingCheck.noGenericText, 'No placeholder/TODO text found');

  // ================================================================
  // Print results
  // ================================================================
  console.log('\n' + '═'.repeat(50));
  console.log(`  Results: ${passed} passed, ${failed} failed, ${total} total`);
  console.log('═'.repeat(50));

  // Cleanup
  await browser.close();
  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test suite error:', err);
  if (browser) browser.close();
  if (server) server.close();
  process.exit(1);
});
