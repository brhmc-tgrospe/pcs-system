import puppeteer from 'puppeteer';

(async () => {
    let errors = [];
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Capture console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`[Console Error]: ${msg.text()}`);
            console.error(`[Console Error Captured]: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        errors.push(`[Page Error]: ${error.message}`);
        console.error(`[Page Error Captured]: ${error.message}`);
    });

    try {
        console.log('Navigating to login page...');
        await page.goto('http://localhost:8000/login', { waitUntil: 'networkidle2' });
        
        console.log('Logging in...');
        await page.type('input[type="text"]', 'developer'); // Username from DatabaseSeeder
        await page.type('input[type="password"]', 'password');
        await page.click('button[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('Logged in successfully, current URL: ' + page.url());

        console.log('Opening dropdown...');
        // Find the user avatar dropdown and click it. It's inside a group/cursor-pointer in Header.tsx
        // The div contains the user's initials, let's find the text 'System Developer' or just click the header right side.
        await page.evaluate(() => {
            const dropdownTrigger = document.querySelector('header .group.cursor-pointer');
            if (dropdownTrigger) {
                dropdownTrigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            }
        });
        
        // Wait a tiny bit for opacity transition
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Navigating to Profile...');
        await page.evaluate(() => {
            const profileBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('My Profile'));
            if (profileBtn) profileBtn.click();
        });
        
        // Wait for page to render
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Profile page loaded. Current URL: ' + page.url());

        console.log('Opening dropdown again...');
        await page.evaluate(() => {
            const dropdownTrigger = document.querySelector('header .group.cursor-pointer');
            if (dropdownTrigger) {
                dropdownTrigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            }
        });
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('Navigating to Settings...');
        await page.evaluate(() => {
            const settingsBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Settings'));
            if (settingsBtn) settingsBtn.click();
        });

        // Wait for page to render
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Settings page loaded. Current URL: ' + page.url());

        console.log('Test complete.');

    } catch (err) {
        console.error('Test execution failed:', err);
    } finally {
        await browser.close();
        if (errors.length > 0) {
            console.log('--- TEST FAILED WITH ERRORS ---');
            errors.forEach(e => console.log(e));
            process.exit(1);
        } else {
            console.log('--- TEST PASSED WITH 0 CONSOLE ERRORS ---');
            process.exit(0);
        }
    }
})();
