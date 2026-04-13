/**
 * OCCULTA MAGICAE — Playtest Suite
 * Puppeteer-based tests that exercise win/loss conditions,
 * the threat capture system, and balance mechanics.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

const GAME_DIR = path.resolve(__dirname, '..');
const PORT = 9905;
let server, browser, page;

// ---- Static file server ----
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
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
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

// ---- Test runner ----
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

// Helper: reset game state in the browser and return to a clean slate
async function resetGame() {
  await page.evaluate(() => {
    GameState.reset();
    GameState.initialized = true;
    GameState.gameOver = false;
    ThreatSystem.reset();
  });
}

// ================================================================
//  WIN CONDITION TESTS
// ================================================================

async function testAscension() {
  console.log('\nTest Group: Win — Ascension Through Twilight');
  await resetGame();

  // Set up state NEAR the win: enigma at 3 (needs 4), warping 8, vim 5
  const result = await page.evaluate(() => {
    GameState.mysteryProgress.enigma = 3;
    GameState.warping = 8;
    GameState.arts.vim = 5;
    // Not yet complete — should NOT win
    const premature = MysterySystem.checkWinConditions();

    // Now advance to step 4 (complete)
    GameState.mysteryProgress.enigma = 4;
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win when enigma incomplete (step 3/4)');
  assert(result.win !== null, 'Win triggers when enigma complete');
  assert(result.win?.type === 'ascension', 'Win type is "ascension"');
  assert(result.win?.title === 'Ascension Through Twilight', 'Title matches');

  // Edge case: complete enigma but insufficient warping
  const edge = await page.evaluate(() => {
    GameState.mysteryProgress.enigma = 4;
    GameState.warping = 7; // needs 8
    GameState.arts.vim = 5;
    return MysterySystem.checkWinConditions();
  });
  assert(edge === null, 'No win with warping 7 (needs 8)');

  // Edge case: complete enigma but insufficient vim
  const edge2 = await page.evaluate(() => {
    GameState.warping = 8;
    GameState.arts.vim = 4; // needs 5
    return MysterySystem.checkWinConditions();
  });
  assert(edge2 === null, 'No win with vim 4 (needs 5)');
}

async function testArchmagus() {
  console.log('\nTest Group: Win — Archmagus');
  await resetGame();

  const result = await page.evaluate(() => {
    // Set 1 technique and 2 forms >= 4 — not enough techniques
    GameState.arts.creo = 4;
    GameState.arts.animal = 4;
    GameState.arts.corpus = 4;
    const premature = MysterySystem.checkWinConditions();

    // Add second technique
    GameState.arts.intellego = 4;
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win with only 1 technique >= 4');
  assert(result.win !== null, 'Win triggers with 2 techniques + 2 forms >= 4');
  assert(result.win?.type === 'archmagus', 'Win type is "archmagus"');
  assert(result.win?.title === 'Archmagus', 'Title matches');
}

async function testHierophant() {
  console.log('\nTest Group: Win — Hierophant');
  await resetGame();

  const result = await page.evaluate(() => {
    // Complete 2 paths — not enough
    GameState.mysteryProgress.heartbeast = 4;
    GameState.mysteryProgress.arcadia = 4;
    const premature = MysterySystem.checkWinConditions();

    // Complete 3rd path
    GameState.mysteryProgress.runes = 4;
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win with only 2 complete paths');
  assert(result.win !== null, 'Win triggers with 3 complete paths');
  assert(result.win?.type === 'hierophant', 'Win type is "hierophant"');
  assert(result.win?.title === 'Hierophant of the Mysteries', 'Title matches');
}

async function testCovenantPrimus() {
  console.log('\nTest Group: Win — Covenant Primus');
  await resetGame();

  const result = await page.evaluate(() => {
    // Add aegis spell
    GameState.addCard(CardFactory.create('spell_aegis_of_the_hearth'));
    // Add 3 companions
    GameState.addCard(CardFactory.create('wandering_magus'));
    GameState.addCard(CardFactory.create('faithful_grog'));
    GameState.addCard(CardFactory.create('hedge_witch'));
    // Add 2 locations
    GameState.addCard(CardFactory.create('standing_stones'));
    GameState.addCard(CardFactory.create('hidden_cave'));
    // Only 2 texts — not enough
    GameState.addCard(CardFactory.create('tattered_folio'));
    GameState.addCard(CardFactory.create('summa_vim'));

    const premature = MysterySystem.checkWinConditions();

    // Add 3rd text
    GameState.addCard(CardFactory.create('coded_journal'));
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win with only 2 texts (needs 3)');
  assert(result.win !== null, 'Win triggers with aegis + 3 companions + 2 locations + 3 texts');
  assert(result.win?.type === 'covenant_primus', 'Win type is "covenant_primus"');
  assert(result.win?.title === 'Covenant Primus', 'Title matches');
}

async function testGreatWorking() {
  console.log('\nTest Group: Win — The Great Working');
  await resetGame();

  const result = await page.evaluate(() => {
    // Complete artifice path
    GameState.mysteryProgress.artifice = 4;
    // Add 4 unique items — not enough (needs 5)
    GameState.addCard(CardFactory.create('enchanted_ring'));
    GameState.addCard(CardFactory.create('wand_of_fire'));
    GameState.addCard(CardFactory.create('talisman_unfinished'));
    GameState.addCard(CardFactory.create('item_ring_of_warding'));

    const premature = MysterySystem.checkWinConditions();

    // Add 5th unique item
    GameState.addCard(CardFactory.create('item_orb_of_divination'));
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win with only 4 unique items');
  assert(result.win !== null, 'Win triggers with 5 unique items + artifice complete');
  assert(result.win?.type === 'great_working', 'Win type is "great_working"');
  assert(result.win?.title === 'The Great Working', 'Title matches');

  // Edge: 5 items but artifice incomplete
  await resetGame();
  const edge = await page.evaluate(() => {
    GameState.mysteryProgress.artifice = 3; // not complete
    GameState.addCard(CardFactory.create('enchanted_ring'));
    GameState.addCard(CardFactory.create('wand_of_fire'));
    GameState.addCard(CardFactory.create('talisman_unfinished'));
    GameState.addCard(CardFactory.create('item_ring_of_warding'));
    GameState.addCard(CardFactory.create('item_orb_of_divination'));
    return MysterySystem.checkWinConditions();
  });
  assert(edge === null, 'No win with 5 items but artifice incomplete');
}

async function testHymnPrimordial() {
  console.log('\nTest Group: Win — Hymn Primordial');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.mysteryProgress.hymns = 3; // not complete
    GameState.warping = 5;
    const premature = MysterySystem.checkWinConditions();

    GameState.mysteryProgress.hymns = 4;
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win with hymns incomplete');
  assert(result.win !== null, 'Win triggers with hymns complete + warping >= 5');
  assert(result.win?.type === 'hymn_primordial', 'Win type is "hymn_primordial"');
  assert(result.win?.title === 'The Hymn Primordial', 'Title matches');

  // Edge: hymns complete but warping < 5
  const edge = await page.evaluate(() => {
    GameState.warping = 4;
    return MysterySystem.checkWinConditions();
  });
  assert(edge === null, 'No win with warping 4 (needs 5)');
}

async function testPeacemaker() {
  console.log('\nTest Group: Win — Peacemaker');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.flags.threatsResolved = 7; // not enough
    GameState.notoriety = 2;
    GameState.addCard(CardFactory.create('wandering_magus'));
    GameState.addCard(CardFactory.create('faithful_grog'));
    GameState.addCard(CardFactory.create('hedge_witch'));
    const premature = MysterySystem.checkWinConditions();

    GameState.flags.threatsResolved = 8;
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win with only 7 threats resolved');
  assert(result.win !== null, 'Win triggers with 8 threats + 3 companions + notoriety <= 2');
  assert(result.win?.type === 'peacemaker', 'Win type is "peacemaker"');
  assert(result.win?.title === 'Peacemaker of the Order', 'Title matches');

  // Edge: notoriety too high
  const edge = await page.evaluate(() => {
    GameState.notoriety = 3;
    return MysterySystem.checkWinConditions();
  });
  assert(edge === null, 'No win with notoriety 3 (needs <= 2)');
}

async function testForbiddenSynthesis() {
  console.log('\nTest Group: Win — Forbidden Synthesis');
  await resetGame();

  const result = await page.evaluate(() => {
    // Complete 1 mystery path
    GameState.mysteryProgress.heartbeast = 4;
    // Add cards from all 4 realms
    // Magic (non-condition): standing_stones has ['location','magic','vis']
    GameState.addCard(CardFactory.create('standing_stones'));
    // Divine: apollos_sanctuary has ['location','divine']
    GameState.addCard(CardFactory.create('apollos_sanctuary'));
    // Faerie: silver_wood has ['location','faerie','herbam']
    GameState.addCard(CardFactory.create('silver_wood'));
    // Missing infernal — should not win yet
    const premature = MysterySystem.checkWinConditions();

    // Add infernal: ruined_chapel has ['location','infernal']
    GameState.addCard(CardFactory.create('ruined_chapel'));
    const win = MysterySystem.checkWinConditions();
    return { premature, win };
  });

  assert(result.premature === null, 'No win missing infernal realm');
  assert(result.win !== null, 'Win triggers with all 4 realms + 1 complete path');
  assert(result.win?.type === 'forbidden_synthesis', 'Win type is "forbidden_synthesis"');
  assert(result.win?.title === 'The Forbidden Synthesis', 'Title matches');

  // Edge: has all 4 realms but no complete path
  await resetGame();
  const edge = await page.evaluate(() => {
    GameState.addCard(CardFactory.create('standing_stones'));
    GameState.addCard(CardFactory.create('apollos_sanctuary'));
    GameState.addCard(CardFactory.create('silver_wood'));
    GameState.addCard(CardFactory.create('ruined_chapel'));
    // No mystery path completed
    return MysterySystem.checkWinConditions();
  });
  assert(edge === null, 'No win without a completed mystery path');

  // Edge: the_gift has magic+condition — should NOT count as magic for this win
  await resetGame();
  const edgeMagicCondition = await page.evaluate(() => {
    GameState.mysteryProgress.heartbeast = 4;
    // the_gift has aspects ['magic','condition'] — excluded by the check
    GameState.addCard(CardFactory.create('the_gift'));
    GameState.addCard(CardFactory.create('apollos_sanctuary'));
    GameState.addCard(CardFactory.create('silver_wood'));
    GameState.addCard(CardFactory.create('ruined_chapel'));
    return MysterySystem.checkWinConditions();
  });
  assert(edgeMagicCondition === null, 'the_gift (magic+condition) does not count as magic realm card');
}

// ================================================================
//  LOSS CONDITION TESTS
// ================================================================

async function testLossWarping() {
  console.log('\nTest Group: Loss — Consumed by Twilight');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.warping = 9;
    const safe = MysterySystem.checkLossConditions();

    GameState.warping = 10;
    const loss = MysterySystem.checkLossConditions();

    // With enigma complete, warping 10 does NOT trigger loss
    GameState.mysteryProgress.enigma = 4;
    const saved = MysterySystem.checkLossConditions();

    return { safe, loss, saved };
  });

  assert(result.safe === null, 'No loss at warping 9');
  assert(result.loss !== null, 'Loss triggers at warping 10');
  assert(result.loss?.type === 'twilight_consumed', 'Loss type is "twilight_consumed"');
  assert(result.saved === null, 'No loss at warping 10 with enigma complete');
}

async function testLossNotoriety() {
  console.log('\nTest Group: Loss — The Inquisition');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.notoriety = 9;
    const safe = MysterySystem.checkLossConditions();

    GameState.notoriety = 10;
    const loss = MysterySystem.checkLossConditions();
    return { safe, loss };
  });

  assert(result.safe === null, 'No loss at notoriety 9');
  assert(result.loss !== null, 'Loss triggers at notoriety 10');
  assert(result.loss?.type === 'inquisition', 'Loss type is "inquisition"');
}

async function testLossCorruption() {
  console.log('\nTest Group: Loss — Corruption/Damnation');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.corruption = 9;
    const safe = MysterySystem.checkLossConditions();

    GameState.corruption = 10;
    const loss = MysterySystem.checkLossConditions();
    return { safe, loss };
  });

  assert(result.safe === null, 'No loss at corruption 9');
  assert(result.loss !== null, 'Loss triggers at corruption 10');
  assert(result.loss?.type === 'damnation', 'Loss type is "damnation"');
}

async function testLossHubris() {
  console.log('\nTest Group: Loss — Consumed by Hubris');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.hubris = 9;
    const safe = MysterySystem.checkLossConditions();

    GameState.hubris = 10;
    const loss = MysterySystem.checkLossConditions();
    return { safe, loss };
  });

  assert(result.safe === null, 'No loss at hubris 9');
  assert(result.loss !== null, 'Loss triggers at hubris 10');
  assert(result.loss?.type === 'obsession', 'Loss type is "obsession"');
}

// ================================================================
//  THREAT SYSTEM TESTS
// ================================================================

async function testThreatCapture() {
  console.log('\nTest Group: Threat — Card Capture & Return');
  await resetGame();

  const result = await page.evaluate(() => {
    // Add a coin card to the table
    const penny = GameState.addCard(CardFactory.create('silver_penny'));
    const pennyId = penny.instanceId;
    const countBefore = GameState.tableCards.length;

    // Spawn suspicious_villagers which captures 'coin'
    ThreatSystem.spawnThreat('suspicious_villagers');

    const countAfterSpawn = GameState.tableCards.length;
    const coinGone = !GameState.tableCards.some(c => c.instanceId === pennyId);
    const threatActive = ThreatSystem.activeThreats.some(t => t.defId === 'suspicious_villagers');
    const capturedCard = ThreatSystem.activeThreats.find(t => t.defId === 'suspicious_villagers')?.capturedCard;

    // Resolve the threat with a coin card
    const resolveCoin = GameState.addCard(CardFactory.create('silver_penny'));
    const resolveResult = ThreatSystem.resolveThreat('suspicious_villagers', [resolveCoin]);

    const threatGone = !ThreatSystem.activeThreats.some(t => t.defId === 'suspicious_villagers');
    // The captured card should be returned to the table (with a new instanceId from addCard)
    const coinCountAfterResolve = GameState.tableCards.filter(c => c.id === 'silver_penny').length;
    const returnedBack = coinCountAfterResolve >= 2; // resolve coin + returned captured coin

    return {
      countBefore, countAfterSpawn, coinGone, threatActive,
      hasCaptured: capturedCard !== null && capturedCard !== undefined,
      resolveResult: resolveResult !== null,
      resolved: resolveResult?.resolved,
      returnedCard: resolveResult?.returnedCard != null,
      threatGone, returnedBack,
    };
  });

  assert(result.coinGone, 'Coin card removed from table when threat spawns');
  assert(result.countAfterSpawn === result.countBefore - 1, 'Table card count decreased by 1');
  assert(result.threatActive, 'Threat is in activeThreats');
  assert(result.hasCaptured, 'Threat holds a captured card');
  assert(result.resolveResult, 'resolveThreat returns a result');
  assert(result.resolved, 'Threat resolves successfully');
  assert(result.returnedCard, 'Resolve result includes returnedCard');
  assert(result.threatGone, 'Threat removed from activeThreats after resolve');
  assert(result.returnedBack, 'Captured card returned to table after resolve');
}

async function testThreatResolveFail() {
  console.log('\nTest Group: Threat — Resolve with Wrong Card');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.addCard(CardFactory.create('silver_penny'));
    ThreatSystem.spawnThreat('suspicious_villagers');

    // Try to resolve with a text card (needs coin)
    const textCard = CardFactory.create('tattered_folio');
    const resolveResult = ThreatSystem.resolveThreat('suspicious_villagers', [textCard]);
    const stillActive = ThreatSystem.activeThreats.some(t => t.defId === 'suspicious_villagers');

    return { resolveResult, stillActive };
  });

  assert(result.resolveResult === null, 'Resolve returns null with wrong card type');
  assert(result.stillActive, 'Threat remains active after failed resolve');
}

// ================================================================
//  BALANCE MECHANICS TESTS
// ================================================================

async function testDreamVigorCorruption() {
  console.log('\nTest Group: Balance — Dream+Vigor reduces corruption by 1');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.corruption = 5;
    const vigorCard = CardFactory.create('vigor');

    // Find the recipe
    const recipe = RecipeEngine.findMatch('dream', [vigorCard]);
    if (!recipe) return { found: false };

    // Execute the recipe
    const results = {
      consumeCards: true,
      stateChanges: {},
      notifications: [],
      newCards: [],
    };
    recipe.execute([vigorCard], results);

    return {
      found: true,
      recipeId: recipe.id,
      corruptionDelta: results.stateChanges.corruption,
      consumeCards: results.consumeCards,
    };
  });

  assert(result.found, 'Dream+Vigor recipe found');
  assert(result.corruptionDelta === -1, `Corruption reduced by exactly 1 (got ${result.corruptionDelta})`);
  assert(result.consumeCards === false, 'Vigor card is NOT consumed');
}

async function testStudyAcumenHubris() {
  console.log('\nTest Group: Balance — Study+Acumen reduces hubris by 1');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.hubris = 5;
    const acumenCard = CardFactory.create('acumen');

    const recipe = RecipeEngine.findMatch('study', [acumenCard]);
    if (!recipe) return { found: false };

    const results = {
      consumeCards: true,
      stateChanges: {},
      notifications: [],
      newCards: [],
    };
    recipe.execute([acumenCard], results);

    return {
      found: true,
      recipeId: recipe.id,
      hubrisDelta: results.stateChanges.hubris,
      consumeCards: results.consumeCards,
    };
  });

  assert(result.found, 'Study+Acumen recipe found');
  assert(result.hubrisDelta === -1, `Hubris reduced by exactly 1 (got ${result.hubrisDelta})`);
  assert(result.consumeCards === false, 'Acumen card is NOT consumed');
}

async function testWorkUnlockRequiresArt3() {
  console.log('\nTest Group: Balance — Work requires art level 3');
  await resetGame();

  const result = await page.evaluate(() => {
    // Reset unlocked verbs to baseline
    GameState.unlockedVerbs = ['study', 'time'];

    // Set max art to 2 — should NOT unlock work
    GameState.arts.creo = 2;
    const unlocks1 = GameState.checkUnlocks();
    const hasWork1 = GameState.unlockedVerbs.includes('work');

    // Set art to 3 — should unlock work
    GameState.arts.creo = 3;
    const unlocks2 = GameState.checkUnlocks();
    const hasWork2 = GameState.unlockedVerbs.includes('work');

    return { hasWork1, hasWork2, unlockMsg: unlocks2[0]?.message };
  });

  assert(!result.hasWork1, 'Work NOT unlocked at art level 2');
  assert(result.hasWork2, 'Work unlocked at art level 3');
}

async function testDreamUnlockRequiresWarping2() {
  console.log('\nTest Group: Balance — Dream requires warping 2');
  await resetGame();

  const result = await page.evaluate(() => {
    GameState.unlockedVerbs = ['study', 'time'];

    // warping 1 — should NOT unlock dream
    GameState.warping = 1;
    GameState.checkUnlocks();
    const hasDream1 = GameState.unlockedVerbs.includes('dream');

    // warping 2 — should unlock dream
    GameState.warping = 2;
    GameState.checkUnlocks();
    const hasDream2 = GameState.unlockedVerbs.includes('dream');

    return { hasDream1, hasDream2 };
  });

  assert(!result.hasDream1, 'Dream NOT unlocked at warping 1');
  assert(result.hasDream2, 'Dream unlocked at warping 2');
}

// ================================================================
//  MAIN RUNNER
// ================================================================

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

    console.log('\n🏰 OCCULTA MAGICAE — Playtest Suite\n');

    // Load game and start
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#menu-new');
    await page.click('#menu-new');
    await new Promise(r => setTimeout(r, 500));

    // Verify game started
    const started = await page.evaluate(() => GameState.initialized);
    assert(started, 'Game initialized after clicking New Game');
    assert(errors.length === 0, `No JS errors on load (found ${errors.length})`);

    // --- Win conditions ---
    await testAscension();
    await testArchmagus();
    await testHierophant();
    await testCovenantPrimus();
    await testGreatWorking();
    await testHymnPrimordial();
    await testPeacemaker();
    await testForbiddenSynthesis();

    // --- Loss conditions ---
    await testLossWarping();
    await testLossNotoriety();
    await testLossCorruption();
    await testLossHubris();

    // --- Threat system ---
    await testThreatCapture();
    await testThreatResolveFail();

    // --- Balance mechanics ---
    await testDreamVigorCorruption();
    await testStudyAcumenHubris();
    await testWorkUnlockRequiresArt3();
    await testDreamUnlockRequiresWarping2();

  } catch (err) {
    console.error('Fatal error:', err);
    failed++;
    results.push(`  ❌ FATAL: ${err.message}`);
  } finally {
    // Print results
    console.log('\n' + '═'.repeat(50));
    console.log('RESULTS');
    console.log('═'.repeat(50));
    for (const r of results) console.log(r);
    console.log('═'.repeat(50));
    console.log(`  PASSED: ${passed}`);
    console.log(`  FAILED: ${failed}`);
    console.log(`  TOTAL:  ${passed + failed}`);
    console.log('═'.repeat(50));

    if (browser) await browser.close();
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
