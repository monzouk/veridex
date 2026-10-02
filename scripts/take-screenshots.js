const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function captureScreenshots(prefix = 'before', viewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 }
]) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const qaDir = path.join(__dirname, '..', 'docs', 'qa');
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir, { recursive: true });
  }

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    // Allow any CSS transitions to settle
    await new Promise(r => setTimeout(r, 600));
    const filename = `${prefix}-${vp.width}.png`;
    const filepath = path.join(qaDir, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    console.log(`Saved screenshot: ${filepath}`);
    await page.close();
  }

  await browser.close();
}

const args = process.argv.slice(2);
const prefix = args[0] || 'before';
captureScreenshots(prefix).catch(err => {
  console.error(err);
  process.exit(1);
});
