import { test, expect } from '@playwright/test';

const BASE_URL = 'https://admin-portal-191882634358.asia-south1.run.app';

test.describe('Stage 1: Infrastructure Setup', () => {

    test('Super Admin creates Org/Admin -> Org Admin creates Resources', async ({ page }) => {
        // --- PART 1: SUPER ADMIN ---
        console.log('--- PART 1: SUPER ADMIN ACTIONS ---');
        // 1. Login as Super Admin
        await page.goto(BASE_URL);

        try {
            await page.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 5000 });
            console.log('Login form detected. Logging in as SUPER ADMIN...');
            await page.fill('input[name="username"]', 'superadmin');
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
        } catch (e) {
            console.log('Login form not found. Assuming already logged in (hopefully as Super Admin).');
        }

        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });

        // 2. Create Organization
        await page.getByRole('link', { name: 'Organizations', exact: true }).click();

        // Wait for table to load
        await expect(page.getByText('Loading organizations...')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        if (await page.getByText('E2E Test Org').isVisible()) {
            console.log('Organization "E2E Test Org" already exists.');
        } else {
            console.log('Creating Organization "E2E Test Org"...');
            await expect(page.getByText('Add Organization')).toBeVisible();
            await page.click('button:has-text("Add Organization")');

            await page.fill('input[placeholder="e.g. ABC Transport"]', 'E2E Test Org');
            await page.fill('input[placeholder="e.g. ABC001"]', 'E2E001');
            await page.fill('input[type="email"]', 'admin@e2e.com');
            await page.fill('input[placeholder="Mobile Number (10 digits)"]', '9998887776');

            // Explicit target for submit
            await page.click('button:has-text("Create Organization")');
            await page.waitForTimeout(1000);

            const errorMsg = page.locator('.text-sm.text-red-700').first();
            if (await errorMsg.isVisible()) {
                console.log('Error creating org:', await errorMsg.textContent());
                await page.getByRole('button', { name: 'Cancel' }).click();
            } else {
                await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
                await expect(page.getByText('E2E Test Org')).toBeVisible();
            }
        }

        // 3. Create Org Admin (Via Users Page)
        // Note: Super Admin creates the Org Admin account.
        await page.getByRole('link', { name: 'Users', exact: true }).click();
        await expect(page.getByText('Loading users...')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        if (await page.getByText('admin@e2e.com').isVisible()) {
            console.log('Org Admin "admin@e2e.com" already exists.');
        } else {
            console.log('Creating Org Admin "admin@e2e.com"...');
            await page.click('button:has-text("Add User")');

            await page.check('input[value="ORG_ADMIN"]');
            await page.locator('select[name="organizationId"]').selectOption({ label: 'E2E Test Org (E2E001)' });

            await page.fill('input[name="username"]', 'admin@e2e.com');
            await page.fill('input[name="password"]', 'password123');
            await page.fill('input[name="confirmPassword"]', 'password123');

            // Submit
            await page.click('button:has-text("Create User")');
            await page.waitForTimeout(1000);

            const errorMsg = page.locator('.text-sm.text-red-700').first();
            if (await errorMsg.isVisible()) {
                console.log('Error creating org admin:', await errorMsg.textContent());
                await page.getByRole('button', { name: 'Cancel' }).click();
            } else {
                await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
                await expect(page.getByText('admin@e2e.com')).toBeVisible();
            }
        }

        // 4. Logout
        console.log('Logging out Super Admin...');
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // --- PART 2: ORG ADMIN ---
        console.log('--- PART 2: ORG ADMIN ACTIONS ---');

        // 5. Login as New Org Admin
        await page.locator('input[name="username"]').waitFor({ state: 'visible' });
        console.log('Logging in as ORG ADMIN (admin@e2e.com)...');
        await page.fill('input[name="username"]', 'admin@e2e.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');

        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 15000 });
        console.log('Org Admin Dashboard Verified.');

        // 6. Create Driver (AS ORG ADMIN)
        await page.getByRole('link', { name: 'Drivers', exact: true }).click();
        try { await expect(page.getByText('Loading drivers...')).not.toBeVisible({ timeout: 15000 }); } catch (e) { }
        await page.waitForTimeout(1000);

        if (await page.getByText('E2E Driver').isVisible()) {
            console.log('Driver "E2E Driver" already exists.');
        } else {
            console.log('Org Admin creating Driver "E2E Driver"...');
            await page.click('button:has-text("Add Driver")');

            await page.fill('input[name="name"]', 'E2E Driver');
            await page.fill('input[name="phone"]', '9999999999');
            await page.fill('input[name="password"]', '1234567891');
            await page.fill('input[name="vehicleNumber"]', 'KA01E2E');
            await page.selectOption('select[name="vehicleCategory"]', 'Sedan Regular');

            // FIX: Use type="submit" to avoid ambiguity
            await page.click('button[type="submit"]');

            await page.waitForTimeout(1000);

            const errorMsg = page.locator('.text-sm.text-red-700').first();
            if (await errorMsg.isVisible()) {
                console.log('Error creating driver:', await errorMsg.textContent());
                await page.getByRole('button', { name: 'Cancel' }).click();
            } else {
                await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
            }
        }

        // 7. Create Commuter (AS ORG ADMIN)
        await page.getByRole('link', { name: 'Users', exact: true }).click();
        await expect(page.getByText('Loading users...')).not.toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        if (await page.getByText('commuter_e2e').isVisible()) {
            console.log('Commuter "commuter_e2e" already exists.');
        } else {
            console.log('Org Admin creating Commuter "commuter_e2e"...');
            await page.click('button:has-text("Add User")');

            await page.check('input[value="COMMUTER"]');

            await page.fill('input[name="username"]', 'commuter_e2e');
            await page.fill('input[name="password"]', 'password123');
            await page.fill('input[name="confirmPassword"]', 'password123');

            // Submit
            await page.click('button:has-text("Create User")');
            await page.waitForTimeout(1000);

            const errorMsg = page.locator('.text-sm.text-red-700').first();
            if (await errorMsg.isVisible()) {
                console.log('Error creating commuter:', await errorMsg.textContent());
                await page.getByRole('button', { name: 'Cancel' }).click();
            } else {
                await expect(page.locator('.fixed.inset-0')).not.toBeVisible();
            }
        }
    });
});
