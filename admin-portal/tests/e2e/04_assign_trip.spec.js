import { test, expect } from '@playwright/test';

const BASE_URL = 'https://admin-portal-191882634358.asia-south1.run.app';

test.describe('Stage 3: Admin Trip Assignment', () => {
    test('Org Admin should see and assign the trip', async ({ page }) => {
        // Login as Org Admin
        await page.goto(BASE_URL);
        await page.fill('input[name="username"]', 'admin@e2e.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // 1. Verify Driver is Online (Dashboard Check)
        await expect(page.getByText('Online Drivers')).toBeVisible();
        // Ideally check the count or map marker to confirm "E2E Driver" is visible

        // 2. Check Pending Trips
        await expect(page.getByText('Pending Trips')).toBeVisible();
        // Wait for the new trip to appear (it might take a socket update or refresh)
        await page.waitForTimeout(2000);
        await page.reload();

        // Find the trip (assuming it's the top one or searching by passenger name)
        const tripRow = page.locator('tr').filter({ hasText: 'commuter_e2e' }).first(); // Filter by commuter name if shown
        await expect(tripRow).toBeVisible();

        // 3. Assign Driver
        await tripRow.getByRole('button', { name: 'Assign' }).click();

        // select driver modal
        await page.getByText('E2E Driver').click();
        await page.getByRole('button', { name: 'Confirm' }).click();

        // Verify trip moved out of pending (or status changed)
        await expect(tripRow).not.toBeVisible();
    });
});
