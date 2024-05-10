// Imports
const path = require('path');
const dotenv = require('dotenv').config();
const { chromium } = require('playwright');
const { createWorker } = require('tesseract.js');
var jimp = require('jimp');

// Init
const delay = 500;
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

async function solveCaptcha(page) {
    const captchaImagePath = 'data/captcha/captcha.png';
    const processedCaptchaImagePath = 'data/captcha/captcha-processed.png';

    await page.locator('img.captcha').screenshot({
        path: captchaImagePath
    });

    // await jimp.read(captchaImagePath).then(function (image) {
    //     image
    //         .color([
    //             { apply: 'desaturate', params: [90] }
    //         ])
    //         .contrast(1)
    //         .write(processedCaptchaImagePath);
    // });
    
    // const image = path.resolve(__dirname, processedCaptchaImagePath);

    // const worker = await createWorker('eng');
    // await worker.setParameters({
    //     tessedit_char_whitelist: '0123456789',
    //     preserve_interword_spaces: '0',
    // });

    // const result = await worker.recognize(image, {
    //     oem: 1,
    //     psm: 3
    // });

    // console.log('CAPTCHA RESULT', result.data.text);
    // await worker.terminate();
}

async function login(page, captcha) {
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
    for (let i = 0; i < 50; i++) {
        await solveCaptcha(page);
        await page.reload();
    }
    await login(page);
    await browser.close();
})();