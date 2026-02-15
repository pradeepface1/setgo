import { test, expect } from '@playwright/test';

const BASE_URL = 'https://admin-portal-191882634358.asia-south1.run.app';

test.describe('Stage 6: Verify Reports', () => {
    test('Org Admin should see the completed trip in reports', async ({ page }) => {
        // Login as Org Admin
        await page.goto(BASE_URL);
        await page.fill('input[name="username"]', 'admin@e2e.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Navigate to Reports
        await page.getByRole('link', { name: 'Reports' }).click();

        // Check for Completed Trips count or table entry
        // Assuming we have a "Completed" tab or filter, or it shows in the main list

        // Strategy: Look for the trip row with "COMPLETED" status
        // We know the commuter name is 'commuter_e2e'
        const tripRow = page.locator('tr').filter({ hasText: 'commuter_e2e' }).first();
        await expect(tripRow).toBeVisible();
        await expect(tripRow).toContainText('COMPLETED');

        // Optional: specific stats check
        // await expect(page.getByText('Total Revenue')).toBeVisible();
    });
});
