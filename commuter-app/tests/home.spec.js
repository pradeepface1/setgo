const { test, expect } = require('@playwright/test');

// Default to local dev server or update to Staging URL
const BASE_URL = process.env.BASE_URL || 'http://localhost:5174';

test.describe('Commuter App E2E', () => {

    test('should load the home/login page', async ({ page }) => {
        console.log(`Navigating to ${BASE_URL}`);
        await page.goto(BASE_URL);

        // Verify title roughly matches
        await expect(page).toHaveTitle(/SetGo|Commuter/i);

        // Verify critical elements (Login button or Request Ride form)
        // Adjust selectors based on actual UI
        const loginButton = page.locator('button:has-text("Login")');
        if (await loginButton.isVisible()) {
            console.log('Login button visible');
            await expect(loginButton).toBeEnabled();
        } else {
            console.log('Login button not found, checking for booking form');
            await expect(page.locator('input[placeholder*="Pickup"]')).toBeVisible();
        }
    });

});
