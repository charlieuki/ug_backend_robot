// Imports
const dotenv = require('dotenv').config();
const { chromium } = require('playwright');

// Init
const delay = 2000;
const url = process.env.ADMIN_PANEL_URL || 'https://www.google.com';
const username = process.env.ADMIN_PANEL_USERNAME || 'username';
const password = process.env.ADMIN_PANEL_PASSWORD || 'password';

const browserOptions = {
    headless: false,
    ignoreHTTPSErrors: true,
    args: [
        '--disable-blink-features=AutomationControlled',
    ],
    ignoreDefaultArgs: [
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-component-extensions-with-background-pages',
    ]
};

async function login(page) {
    // Fill username
    await page.getByPlaceholder('Username').fill(username);
    await page.waitForTimeout(delay);
    // Fill password
    await page.getByPlaceholder('Password').fill(password);
    await page.waitForTimeout(delay);
    // Submit login form
    //await page.locator('input[type=submit]').hover();
    //await page.locator('#txt_pswd').press('Enter');
}

(async () => {
    const browser = await chromium.launch(browserOptions);
    const page = await browser.newPage();
    await page.goto(url);
    await login(page);
    await browser.close();
})();