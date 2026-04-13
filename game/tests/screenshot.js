const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const GAME_DIR = path.resolve(__dirname, '..');
const PORT = 9878;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(GAME_DIR, req.url === '/' ? 'index.html' : req.url);
      const ext = path.extname(filePath);
      const mimeTypes = { '.html':'text/html','.css':'text/css','.js':'application/javascript','.png':'image/png' };
      fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

(async () => {
  const server = await startServer();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  // Capture console errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  
  await page.goto('http://localhost:' + PORT, { waitUntil: 'networkidle0' });
  
  // Click New Game
  await page.click('#menu-new');
  await page.waitForSelector('.card', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 1500));
  
  // Screenshot grid layout
  await page.screenshot({ path: path.join(__dirname, 'ss_grid_new.png'), fullPage: false });
  console.log('Grid layout screenshot saved');
  
  // Switch to columns layout
  await page.evaluate(() => {
    document.querySelector('.layout-btn[data-layout="columns"]').click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'ss_cols_new.png'), fullPage: false });
  console.log('Columns layout screenshot saved');
  
  // Switch to compact layout
  await page.evaluate(() => {
    document.querySelector('.layout-btn[data-layout="compact"]').click();
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(__dirname, 'ss_compact.png'), fullPage: false });
  console.log('Compact layout screenshot saved');
  
  // Check for errors
  if (errors.length > 0) {
    console.log('JS errors found:', errors);
  } else {
    console.log('No JS errors!');
  }
  
  console.log('Done');
  await browser.close();
  server.close();
})();
