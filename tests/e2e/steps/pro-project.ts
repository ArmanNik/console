import { test, expect, type Page } from '@playwright/test';
import { getOrganizationIdFromUrl, getProjectIdFromUrl } from '../helpers/url';

type Metadata = {
    id: string;
    organizationId: string;
};

export async function enterCreditCard(page: Page) {
    await page.getByPlaceholder('cardholder').fill('Test User');
    const stripe = page.frameLocator('[title="Secure payment input frame"]');
    await stripe.locator('id=Field-numberInput').fill('4242424242424242');
    await stripe.locator('id=Field-expiryInput').fill('1250');
    await stripe.locator('id=Field-cvcInput').fill('123');
    await stripe.locator('id=Field-countryInput').selectOption('DE');
    await page.getByRole('button', { name: 'Next' }).click();
}

export async function enterAddress(page: Page) {
    await page.locator('id=country').selectOption('US');
    await page.locator('id=address').fill('123 Test St');
    await page.locator('id=city').fill('Test City');
    await page.locator('id=state').fill('Test State');
    await page.getByRole('button', { name: 'Next' }).click();
}

export async function createProProject(page: Page): Promise<Metadata> {
    const organizationId = await test.step('create organization', async () => {
        await page.goto('/console');
        await page.waitForURL('/console/onboarding');
        await page.locator('id=name').fill('test org');
        await page.locator('id=plan').selectOption('tier-1');
        await page.getByRole('button', { name: 'get started' }).click();
        await enterCreditCard(page);
        await enterAddress(page);
        // skip members
        await page.getByRole('button', { name: 'next' }).click();
        // start pro trial
        await page.getByRole('button', { name: 'start trial' }).click();
        await page.waitForURL('/console/organization-**');

        return getOrganizationIdFromUrl(page.url());
    });

    const projectId = await test.step('create project', async () => {
        await page.waitForURL('/console/organization-**');
        await page.getByRole('button', { name: 'create project' }).first().click();
        await page.getByPlaceholder('project name').fill('test project');
        await page.getByRole('button', { name: 'next' }).click();
        await page.locator('label').filter({ hasText: 'frankfurt' }).click();
        await page.getByRole('button', { name: 'create' }).click();
        await page.waitForURL('/console/project-**/overview/platforms');
        expect(page.url()).toContain('/console/project-');

        return getProjectIdFromUrl(page.url());
    });

    return {
        id: projectId,
        organizationId
    };
}
