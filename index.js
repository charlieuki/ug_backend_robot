// Imports
const path = require('path');
const dotenv = require('dotenv').config();
const { chromium } = require('playwright');
const cronjob = require('cron').CronJob;

// Init
const delay = (process.env.TIMEOUT_SECONDS || 10) * 1000;
const url = 'https://' + (process.env.ADMIN_PANEL_URL || 'www.google.com') + '/';
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
}

async function logout(page) {
    
}

async function waitForLogin(page) {
    console.log('waiting for login ...');
    await page.goto(url);
    await page.waitForURL('**/dashboard', { timeout: delay, waitUntil: 'domcontentloaded' });
    console.log('login successful');
}

async function checkLoggedIn(page) {
    console.log('checking login state ...');
    await page.goto(url + 'dashboard', { timeout: delay });
    if (page.url().includes('dashboard')) {
        console.log('still logged in');
        return true;
    }
    return false;
}

async function goToDepositPage(page) {
    const isLoggedIn = await checkLoggedIn(page);
    if (!isLoggedIn) {
        await waitForLogin(page);   
    }
    await page.goto(url + 'transactions/instant_transaction/deposit_only', { timeout: 5000 });
    if (page.url().includes('deposit_only')) {
        console.log('inside deposit page');
    }
}

async function getDepositTransactions(page) {
    console.log('getting deposit transactions ...');
    await page.waitForTimeout(3000);
    const table = await page.locator("#DataTables_Table_0");
    // console.log("table count: " + await table.count());
    const rows = await table.locator("tbody tr");
    // console.log("rows count: " + await rows.count());
    const cols = await rows.first().locator("td");
    // console.log("cols count: " + await cols.count());
    let tableData = [];

    for (let i = 0; i < await rows.count(); i++) {
        const row = rows.nth(i);
        const tds = await row.locator("td");

        const txID = await tds.nth(2).textContent().trim();
        const txAccount = await tds.nth(3).textContent().trim();
        const txUsername = await tds.nth(4).textContent().trim().replace(/\s+/g, "").replace("FirstTime", "");
        const txMethod = await tds.nth(6).textContent().trim();
        const txStatus = await tds.nth(8).textContent().trim();
        const txAmount = await tds.nth(11).textContent().trim().replace(",", "").replace(".00", "");

        if (txStatus.includes("In Progress") && (txMethod.includes('E-wallet') || txMethod.includes('Bank'))) {
            const rowData = {
                'id': txID,
                'account': txAccount,
                'username': txUsername,
                'method': txMethod,
                'status': txStatus,
                'amount': txAmount,
            };
            tableData.push(rowData);
        }
    }
    console.log("tableData:", tableData);
}

(async () => {
    const browser = await chromium.launch(browserOptions);
    const page = await browser.newPage();

    await waitForLogin(page);

    if (page.url().includes('dashboard')) {
        console.log('setting up cronjob');
        let job = new cronjob('*/30 * * * * *', async function() {
            console.log('going to deposit page')
            await goToDepositPage(page);
            await getDepositTransactions(page);
        }, null, true, 'Asia/Jakarta');
        
        job.start();
    }
    //await browser.close();
})();