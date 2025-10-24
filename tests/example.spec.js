// @ts-check
import { test, expect } from '@playwright/test';

test('test basic address', async ({ page }) => {
  await page.goto('https://atlas-dev.phila.gov/');
  await expect(page.getByRole('link', { name: 'Atlas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Atlas is your front door to' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).click();
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).fill('1234 mkt');
  await page.getByRole('button', { name: 'Address Search Button' }).click();
  await expect(page.getByRole('cell', { name: '883309050' })).toBeVisible();
  await expect(page.getByRole('rowgroup')).toContainText('883309050');
  await expect(page.getByRole('rowgroup')).toContainText('1234 MARKET ST');
  await page.getByRole('button', { name: 'Deeds' }).click();
  await expect(page.locator('#dorTable')).toContainText('001S070144');
  await page.getByRole('button', { name: 'Zoning' }).click();
  await expect(page.locator('#parcel-div')).toContainText('CMX-5');
});

test('test condominium', async ({ page }) => {
  await page.goto('https://atlas-dev.phila.gov/');
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).click();
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).fill('220 W WASHINGTON SQ');
  await page.getByRole('button', { name: 'Address Search Button' }).click();
  await expect(page.getByRole('button', { name: 'Condominiums' })).toBeVisible();
  await page.getByRole('button', { name: 'Condominiums' }).click();
  await page.getByRole('link', { name: 'W WASHINGTON SQ APT 100' }).click();
  await expect(page.getByRole('rowgroup')).toContainText('888057400');
  await expect(page.getByRole('rowgroup')).toContainText('220 W WASHINGTON SQ APT 100');
  await page.getByRole('button', { name: 'Deeds' }).click();
  await expect(page.locator('#dorTable')).toContainText('002S100096');
  await page.getByRole('button', { name: 'Zoning' }).click();
  await expect(page.locator('#parcel-div')).toContainText('RM-4');
});

test('test pwd address', async ({ page }) => {
  await page.goto('https://atlas-dev.phila.gov/');
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).click();
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).fill('5036 HAWTHORNE ST');
  await page.getByRole('button', { name: 'Address Search Button' }).click();
  await expect(page.getByRole('rowgroup')).toContainText('622250305');
  await expect(page.getByRole('rowgroup')).toContainText('5032-36 HAWTHORNE ST');
  await page.getByRole('button', { name: 'Deeds' }).click();
  await expect(page.locator('#dorTable')).toContainText('089N040106');
  await page.getByRole('button', { name: 'Zoning' }).click();
  await expect(page.locator('#parcel-div')).toContainText('RSA-5');
});

test('test dor address', async ({ page }) => {
  await page.goto('https://atlas-dev.phila.gov/');
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).click();
  await page.getByRole('textbox', { name: 'Search for an address, OPA' }).fill('5669 CHESTNUT ST');
  await page.getByRole('button', { name: 'Address Search Button' }).click();
  await expect(page.getByText('There is no property assessment record for this address.')).toBeVisible({ timeout: 10_000 });
  // await expect(page.getByRole('div', { class: 'summary' })).toBeVisible({ timeout: 10_000 });
  // await expect(page.getByRole('paragraph')).toContainText('There is no property assessment record for this address.', { timeout: 10_000 });
  await page.getByRole('button', { name: 'Deeds' }).click();
  await expect(page.locator('#dorTable')).toContainText('018S030074');
  await expect(page.locator('#dorTable')).toContainText('5627-99 CHESTNUT ST');
  await page.getByRole('button', { name: 'Zoning' }).click();
  await expect(page.locator('#parcel-div')).toContainText('CA-2');
});

