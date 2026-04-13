const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'};
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {'Content-Type': types[ext]||'text/plain'});
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});

server.listen(9879, async () => {
  const browser = await puppeteer.launch({headless:'new', args:['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width:1400, height:900});
  await page.goto('http://localhost:9879');

  // Start game
  await page.click('#menu-new');
  await new Promise(r => setTimeout(r, 500));

  // Switch to columns layout
  await page.click('[data-layout="columns"]');
  await new Promise(r => setTimeout(r, 500));

  // Screenshot
  await page.screenshot({path: path.join(__dirname, 'ss_columns_slots.png'), fullPage: false});

  const slotCount = await page.$$eval('.card-column-slot', els => els.length);
  console.log('Card column slots found:', slotCount);

  const overlappedCount = await page.$$eval('.card-column-slot.overlapped', els => els.length);
  console.log('Overlapped slots:', overlappedCount);

  const singleCount = slotCount - overlappedCount;
  console.log('Non-overlapped (single) slots:', singleCount);

  // Hover test: hover the first overlapped slot
  const slot = await page.$('.card-column-slot.overlapped');
  if (slot) {
    await slot.hover();
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({path: path.join(__dirname, 'ss_columns_hovered.png'), fullPage: false});
    console.log('Hover screenshot taken');

    // Stability: rapidly re-hover and check transform stays constant
    const positions = [];
    for (let i = 0; i < 5; i++) {
      await slot.hover();
      await new Promise(r => setTimeout(r, 100));
      const transform = await slot.$eval('.card', el => getComputedStyle(el).transform);
      positions.push(transform);
    }
    const allSame = positions.every(p => p === positions[0]);
    console.log('Hover stable (all transforms identical):', allSame);
    console.log('Transform value:', positions[0]);
  } else {
    console.log('No overlapped slots found — fewer than 2 cards in any category');
  }

  // Also check that single-card columns don't slide
  const singleSlot = await page.$('.card-column-slot:not(.overlapped)');
  if (singleSlot) {
    await singleSlot.hover();
    await new Promise(r => setTimeout(r, 400));
    const transform = await singleSlot.$eval('.card', el => getComputedStyle(el).transform);
    console.log('Single-card slot hover transform:', transform);
    // Should NOT have translateX(70px)
    const hasTranslateX70 = transform.includes('70');
    console.log('Single-card avoids slide:', !hasTranslateX70);
  }

  await browser.close();
  server.close();
  console.log('All hover tests done');
});
