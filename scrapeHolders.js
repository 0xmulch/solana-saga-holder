/**
 * This script should hit solscan.io and collect all 
 * Saga Wallets addresses, and export them to the CSV.
 * WIP. Need to iron out a few kinks.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeHolders(baseUrl) {
    const browser = await puppeteer.launch({ headless: true }); // Ensure headless is set to true for a non-interactive session
    const page = await browser.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle2' });

    console.log("Base page loaded.");

    let currentPage = 1;
    const totalPages = 3; // Adjust as necessary

    const collection_url = "https://solscan.io/collection/4a2d96b22ab0c8f01cb5ce5bc960b627c2a8271529ae5132d5352b7c86b3b54d#holders"
    const nextButtonBaseSelector = '#rc-tabs-0-panel-holders > div.ant-space.ant-space-horizontal.ant-space-align-center > div:nth-child(5) > button';
    const rowSelector = '#rc-tabs-0-panel-holders > div.ant-space.ant-space-vertical.sc-lllmON.glAEPq > div > div > div > div > div > div > div > table > tbody > tr:nth-child(2)';

    let results = [];

    while (currentPage <= totalPages) {

        page.setDefaultTimeout(0); // may or may not be needed. Doesn't hurt for now.

        await page.waitForSelector(rowSelector, { visible: true });
        console.log("Page " + currentPage + " loaded.");

        const data = await page.evaluate((selector) => {
            const rows = Array.from(document.querySelectorAll(selector));
            return rows.map(row => {
                const columns = row.querySelectorAll('td');
                return {
                    address: columns[0]?.innerText,
                    amount: columns[1]?.innerText
                };
            });
        }, rowSelector);
        console.log("Done scraping addresses.");

        results.push(...data.filter(item => item && item.amount && parseInt(item.amount.replace(',', '')) === 1));
        console.log("Pushed addresses to array.");

        const nextButtonExists = await page.$(nextButtonBaseSelector) !== null;
        console.log("Next button: ", nextButtonExists);

        const isNextButtonDisabled = nextButtonExists && await page.evaluate((nextButtonBaseSelector) => {
            const nextButton = document.querySelector(nextButtonBaseSelector);
            return !nextButton || nextButton.disabled || nextButton.classList.contains('disabled-class') || getComputedStyle(nextButton).display === 'none';
        }, nextButtonBaseSelector);

        if (isNextButtonDisabled || !nextButtonExists || currentPage === totalPages) {
            console.log('Reached the last page or no more pages left.');
            break;
        }

        // Click the "Next" button and wait for the next set of data to load
        if (nextButtonExists) {
            await Promise.all([
                console.log("Clicking next."),
                page.click(nextButtonBaseSelector),
                page.waitForSelector(rowSelector)
            ]);
        }

        currentPage++;
    }

    await browser.close();

    // Convert filtered data to CSV
    const csvContent = results.reduce((acc, item) => acc + `${item.address},\n`, 'Address\n');

    // Write CSV to file
    fs.writeFileSync('filteredHolders.csv', csvContent);
    console.log('CSV file has been created.');
}

scrapeHolders(collection_url);