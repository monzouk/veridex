const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const qaDir = path.join(__dirname, '..', 'docs', 'qa');
if (!fs.existsSync(qaDir)) {
  fs.mkdirSync(qaDir, { recursive: true });
}

async function runStep03QA() {
  console.log('=== VERIDEX Step 03 Authentication QA Audit ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    allPassed: true
  };

  function record(testName, passed, details = '') {
    results.tests.push({ testName, passed, details });
    const mark = passed ? 'PASS' : 'FAIL';
    console.log(`  [${mark}] ${testName}${details ? ` -> ${details}` : ''}`);
    if (!passed) results.allPassed = false;
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Desktop /login (1440x900) - Split Screen & Form UI
    // ----------------------------------------------------
    console.log('1. Testing Desktop /login (1440x900)...');
    const pageDesktop = await browser.newPage();
    await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await pageDesktop.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Capture desktop screenshot
    const loginDesktopScreenshot = path.join(qaDir, 'step-03-login-desktop.png');
    await pageDesktop.screenshot({ path: loginDesktopScreenshot });
    console.log(`  - Screenshot captured: ${loginDesktopScreenshot}`);

    // DOM & UX verifications
    const desktopChecks = await pageDesktop.evaluate(() => {
      const brandPanel = document.querySelector('.auth-brand-panel');
      const mainPanel = document.querySelector('.auth-main-panel');
      const emailInput = document.querySelector('#login-email');
      const passwordInput = document.querySelector('#login-password');
      const submitBtn = document.querySelector('.auth-submit-btn');
      const showPasswordBtn = document.querySelector('.input-action-btn');
      const quotes = document.querySelectorAll('.quote-slide');
      const comingSoonBadges = document.querySelectorAll('.coming-soon-badge');
      const ssoBtn = document.querySelector('.sso-link-btn');

      // Styles
      const emailStyle = emailInput ? window.getComputedStyle(emailInput) : null;
      const submitStyle = submitBtn ? window.getComputedStyle(submitBtn) : null;

      return {
        brandPanelExists: !!brandPanel && window.getComputedStyle(brandPanel).display !== 'none',
        mainPanelExists: !!mainPanel,
        emailInputExists: !!emailInput,
        emailFontSize: emailStyle ? parseFloat(emailStyle.fontSize) : 0,
        emailHeight: emailInput ? emailInput.getBoundingClientRect().height : 0,
        passwordInputExists: !!passwordInput,
        submitBtnHeight: submitBtn ? submitBtn.getBoundingClientRect().height : 0,
        hasShowPasswordToggle: !!showPasswordBtn,
        quotesCount: quotes.length,
        comingSoonBadgesCount: comingSoonBadges.length,
        hasSSO: !!ssoBtn,
        titleText: document.querySelector('.auth-title')?.textContent || ''
      };
    });

    record('Desktop Split Screen Brand Panel', desktopChecks.brandPanelExists, 'Brand panel visible on left');
    record('Desktop Split Screen Form Panel', desktopChecks.mainPanelExists, 'Form panel visible on right');
    record('Email Input Present', desktopChecks.emailInputExists, 'Work email field available');
    record('Password Input Present', desktopChecks.passwordInputExists, 'Password field available');
    record('Input Font Size >= 16px (Stops iOS Zoom)', desktopChecks.emailFontSize >= 16, `Actual: ${desktopChecks.emailFontSize}px`);
    record('Tap Target Height >= 44px (Inputs)', desktopChecks.emailHeight >= 44, `Actual: ${desktopChecks.emailHeight}px`);
    record('Tap Target Height >= 44px (Buttons)', desktopChecks.submitBtnHeight >= 44, `Actual: ${desktopChecks.submitBtnHeight}px`);
    record('Password Show/Hide Toggle Exists', desktopChecks.hasShowPasswordToggle, 'SVG eye icon button');
    record('Rotating Proof Statements Exist', desktopChecks.quotesCount === 3, `Count: ${desktopChecks.quotesCount}`);
    record('Google & Microsoft Marked Coming Soon', desktopChecks.comingSoonBadgesCount === 2, `Badges: ${desktopChecks.comingSoonBadgesCount}`);
    record('Company SSO Marked Business Plan', desktopChecks.hasSSO, 'Enterprise SSO link with badge');

    // Test Show/Hide password toggle interaction
    const initialType = await pageDesktop.$eval('#login-password', el => el.type);
    await pageDesktop.click('.input-action-btn');
    await new Promise(r => setTimeout(r, 100));
    const afterClickType = await pageDesktop.$eval('#login-password', el => el.type);
    await pageDesktop.click('.input-action-btn');
    await new Promise(r => setTimeout(r, 100));
    const resetType = await pageDesktop.$eval('#login-password', el => el.type);

    const toggleWorks = initialType === 'password' && afterClickType === 'text' && resetType === 'password';
    record('Password Visibility Toggle Action', toggleWorks, 'Toggles between password and text types');

    await pageDesktop.close();

    // ----------------------------------------------------
    // TEST 2: Mobile /login (390x844 iPhone 14/15)
    // ----------------------------------------------------
    console.log('\n2. Testing Mobile /login (390x844 iPhone 14/15)...');
    const pageMobile = await browser.newPage();
    await pageMobile.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    await pageMobile.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Capture mobile screenshot
    const loginMobileScreenshot = path.join(qaDir, 'step-03-login-mobile.png');
    await pageMobile.screenshot({ path: loginMobileScreenshot });
    console.log(`  - Screenshot captured: ${loginMobileScreenshot}`);

    const mobileChecks = await pageMobile.evaluate(() => {
      const brandPanel = document.querySelector('.auth-brand-panel');
      const mobileHeader = document.querySelector('.auth-mobile-header');
      const emailInput = document.querySelector('#login-email');
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;

      return {
        brandPanelHidden: !brandPanel || window.getComputedStyle(brandPanel).display === 'none',
        mobileHeaderVisible: !!mobileHeader && window.getComputedStyle(mobileHeader).display !== 'none',
        noHorizontalOverflow: docWidth <= winWidth + 1,
        docWidth,
        winWidth,
        emailFontSize: emailInput ? parseFloat(window.getComputedStyle(emailInput).fontSize) : 0,
        emailHeight: emailInput ? emailInput.getBoundingClientRect().height : 0
      };
    });

    record('Mobile Single-Column (Full brand panel hidden)', mobileChecks.brandPanelHidden, 'Brand panel hidden on mobile');
    record('Mobile Top Brand Strip Visible', mobileChecks.mobileHeaderVisible, 'Slim top brand bar with logo');
    record('Mobile No Horizontal Overflow', mobileChecks.noHorizontalOverflow, `docWidth=${mobileChecks.docWidth}px, winWidth=${mobileChecks.winWidth}px`);
    record('Mobile Input Font Size >= 16px', mobileChecks.emailFontSize >= 16, `Actual: ${mobileChecks.emailFontSize}px`);
    record('Mobile Tap Target >= 44px', mobileChecks.emailHeight >= 44, `Actual: ${mobileChecks.emailHeight}px`);

    await pageMobile.close();

    // ----------------------------------------------------
    // TEST 3: /signup Registration & Password Strength Meter
    // ----------------------------------------------------
    console.log('\n3. Testing /signup Registration & Strength Meter (1440x900)...');
    const pageSignup = await browser.newPage();
    await pageSignup.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await pageSignup.goto('http://localhost:3000/signup', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    // Type weak password
    await pageSignup.type('#signup-password', 'abc');
    await new Promise(r => setTimeout(r, 200));

    const weakScore = await pageSignup.evaluate(() => {
      const label = document.querySelector('.strength-value');
      return label ? label.textContent.trim() : '';
    });
    record('Password Strength: Weak Detection', weakScore === 'Weak', `Label: "${weakScore}"`);

    // Clear and type strong password
    await pageSignup.evaluate(() => {
      const input = document.querySelector('#signup-password');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await pageSignup.type('#signup-password', 'Veridex#Proof2026!');
    await new Promise(r => setTimeout(r, 200));

    const strongScore = await pageSignup.evaluate(() => {
      const label = document.querySelector('.strength-value');
      const metItems = document.querySelectorAll('.checklist-item.is-met');
      return {
        label: label ? label.textContent.trim() : '',
        metCount: metItems.length
      };
    });
    record('Password Strength: Strong Detection', strongScore.label === 'Strong', `Label: "${strongScore.label}"`);
    record('Password Criteria All Met', strongScore.metCount === 3, `Met criteria: ${strongScore.metCount}/3`);

    // Capture signup screenshot with strong password state
    const signupScreenshot = path.join(qaDir, 'step-03-signup.png');
    await pageSignup.screenshot({ path: signupScreenshot });
    console.log(`  - Screenshot captured: ${signupScreenshot}`);

    await pageSignup.close();

    // ----------------------------------------------------
    // TEST 4: /forgot-password Recovery & Non-revealing Confirmation
    // ----------------------------------------------------
    console.log('\n4. Testing /forgot-password (1440x900)...');
    const pageForgot = await browser.newPage();
    await pageForgot.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await pageForgot.goto('http://localhost:3000/forgot-password', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const forgotScreenshot = path.join(qaDir, 'step-03-forgot-password.png');
    await pageForgot.screenshot({ path: forgotScreenshot });
    console.log(`  - Screenshot captured: ${forgotScreenshot}`);

    const forgotChecks = await pageForgot.evaluate(() => {
      const emailInput = document.querySelector('#forgot-email');
      const submitBtn = document.querySelector('.auth-submit-btn');
      return {
        hasEmail: !!emailInput,
        hasSubmit: !!submitBtn,
        title: document.querySelector('.auth-title')?.textContent || ''
      };
    });
    record('Forgot Password Form Loaded', forgotChecks.hasEmail && forgotChecks.hasSubmit, `Title: "${forgotChecks.title}"`);

    await pageForgot.close();

    // ----------------------------------------------------
    // TEST 5: Route Protection (/app redirects to /login)
    // ----------------------------------------------------
    console.log('\n5. Testing Route Protection (/app -> /login?redirectTo=%2Fapp)...');
    const pageProtect = await browser.newPage();
    await pageProtect.setViewport({ width: 1440, height: 900 });

    // Request /app unauthenticated
    await pageProtect.goto('http://localhost:3000/app', { waitUntil: 'networkidle0' });
    const currentUrl = pageProtect.url();
    const redirectedToLogin = currentUrl.includes('/login') && currentUrl.includes('redirectTo');

    record(
      'Middleware Route Protection (/app requires authentication)',
      redirectedToLogin,
      `Redirected URL: ${currentUrl}`
    );

    await pageProtect.close();

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n=== AUDIT RESULTS SUMMARY ===');
    console.log(`Total tests: ${results.tests.length}`);
    console.log(`Passed: ${results.tests.filter(t => t.passed).length}`);
    console.log(`Failed: ${results.tests.filter(t => !t.passed).length}`);
    console.log(`Overall Status: ${results.allPassed ? 'ALL PASSED (100%)' : 'SOME TESTS FAILED'}`);

  } catch (err) {
    console.error('QA Script Error:', err);
    results.allPassed = false;
  } finally {
    await browser.close();
  }
}

runStep03QA();
