const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const GAME_DIR = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  let fp = path.join(GAME_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(fp);
  const mt = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png'};
  fs.readFile(fp, (err, c) => { if(err){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':mt[ext]||'application/octet-stream'});res.end(c); });
});

server.listen(9912, async () => {
  try {
    const browser = await puppeteer.launch({headless:'new', args:['--no-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({width:1400, height:900});
    await page.goto('http://localhost:9912/', {waitUntil:'networkidle0'});
    await page.click('#menu-new');
    await new Promise(r => setTimeout(r, 2000));

    // Add some cards
    await page.evaluate(() => {
      const folio = GameState.tableCards.find(c => c.id === 'tattered_folio');
      Game.placeCardInSlot('study', 0, folio);
      Game.tryStartVerb('study');
      TimerSystem.update(20000);
      if (GameState.activeVerbs.study?.completed) Game.collectVerbResult('study');
      const creo = GameState.tableCards.find(c => c.id === 'tractatus_creo');
      Game.placeCardInSlot('study', 0, creo);
      Game.tryStartVerb('study');
      TimerSystem.update(20000);
      if (GameState.activeVerbs.study?.completed) Game.collectVerbResult('study');
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({path: path.join(__dirname, 'ss_grid.png')});

    // Switch to columns
    await page.evaluate(() => {
      document.querySelector('.layout-btn[data-layout="columns"]').click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({path: path.join(__dirname, 'ss_columns.png')});

    const check = await page.evaluate(() => ({
      layout: UI.cardLayout,
      columns: document.querySelectorAll('.card-column').length,
      hasClass: document.getElementById('card-area').classList.contains('layout-columns'),
    }));
    console.log('Layout check:', JSON.stringify(check));

    // Hints page
    const hintsResp = await page.goto('http://localhost:9912/hints.html', {waitUntil:'domcontentloaded'});
    console.log('Hints page:', hintsResp.status());

    await browser.close(); server.close();
  } catch(e) { console.error(e); server.close(); process.exit(1); }
});
