import { test, expect } from '@playwright/test';

// Target the Staging Environment
const BASE_URL = 'https://admin-portal-191882634358.asia-south1.run.app';

test.describe('Admin Portal E2E', () => {

    test('should load the dashboard and show login page or dashboard', async ({ page }) => {
        console.log(`Navigating to ${BASE_URL}`);
        await page.goto(BASE_URL);

        // Initial load might redirect to login because we are not authenticated
        // Check if we are on Login page OR Dashboard (if session persisted, unlikely in incognito)

        // Check title
        await expect(page).toHaveTitle(/Admin/i);

        // If redirected to login, verify login form presence
        if (page.url().includes('login')) {
            console.log('App redirected to Login page correctly.');
            await expect(page.locator('input[type="email"]')).toBeVisible();
            await expect(page.locator('button[type="submit"]')).toBeVisible();
        } else {
            console.log('App loaded Dashboard directly.');
            // Verify something unique to dashboard
            // Verify something unique to dashboard (Live Status or Sign Out)
            await expect(page.getByText('Live Status')).toBeVisible();
        }
    });

});
