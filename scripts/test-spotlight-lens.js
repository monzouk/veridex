const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const qaDir = path.join(__dirname, '..', 'docs', 'qa');

async function captureSpotlightProof() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Find exact position of the 'backups-tested' claim
  const claimCoords = await page.evaluate(() => {
    const el = document.querySelector('.dim-layer .claim-item:nth-child(2)');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  console.log('Claim coordinates:', claimCoords);
  if (claimCoords) {
    // Move mouse directly to this claim
    await page.mouse.move(claimCoords.x, claimCoords.y);
    // Allow easing lerp to catch up
    await new Promise(r => setTimeout(r, 800));
    const screenshotPath = path.join(qaDir, 'step-02-truth-lens-resolved-proof.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot: ${screenshotPath}`);
  }

  await browser.close();
}

captureSpotlightProof();
