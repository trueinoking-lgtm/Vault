import { expect, test, type Page } from '@playwright/test'

function monitor(page: Page) {
  const errors: string[] = []
  const failedResources: string[] = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => { if (request.url().includes('/_next/')) failedResources.push(request.url()) })
  return { errors, failedResources }
}

async function expectNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
}

test('overview workflow links are real, page scrolls, and resources remain healthy', async ({ page }, testInfo) => {
  const health = monitor(page)
  await page.goto('/impact')
  await expect(page.getByRole('heading', { name: 'ZimLearnGraph', exact: true })).toBeVisible()
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Seeded multi-school demonstration data. No learner identities. Not verified pilot evidence.')).toBeVisible()
  const workflow = page.locator('#guided-workflow a')
  await expect(workflow).toHaveCount(7)
  for (const link of await workflow.all()) expect(await link.getAttribute('href')).toMatch(/^\/impact/)
  const before = await page.evaluate(() => window.scrollY)
  await page.locator('#guided-workflow').scrollIntoViewIfNeeded()
  const after = await page.evaluate(() => window.scrollY)
  expect(after).toBeGreaterThan(before)
  await expectNoOverflow(page)
  expect(health.errors).toEqual([])
  expect(health.failedResources).toEqual([])
  await page.screenshot({ path: `test-results/overview-${testInfo.project.name}.png`, fullPage: true })
})

test('school to class to learners navigation is complete', async ({ page }) => {
  await page.goto('/impact/schools')
  await page.getByRole('link', { name: /Open school/ }).first().click()
  await expect(page).toHaveURL(/\/impact\/schools\/school-/)
  await page.getByRole('link', { name: /Open a class/ }).click()
  await expect(page).toHaveURL(/\/impact\/classes\/class-/)
  await page.getByRole('link', { name: /Manage learners/ }).click()
  await expect(page).toHaveURL(/\/learners$/)
  await expect(page.getByRole('heading', { name: /learner codes/i })).toBeVisible()
  await expectNoOverflow(page)
})

test('assessment tabs and report navigation work without auto-triggering AI', async ({ page }) => {
  await page.goto('/impact/assessments/assess-math-term1')
  for (const name of ['Overview', 'Questions and topics', 'Marks', 'Results', 'Support', 'Report']) {
    const tab = page.getByRole('tab', { name })
    await expect(tab).toBeVisible()
    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
  }
  await page.getByRole('link', { name: /View and print report/ }).click()
  await expect(page).toHaveURL(/\/report$/)
  await expect(page.getByText(/Not verified pilot evidence/).last()).toBeVisible()
})

test('product navigation has no dead destinations', async ({ page }, testInfo) => {
  await page.goto('/impact')
  if (testInfo.project.name === 'mobile') await page.getByRole('button', { name: 'Open product navigation' }).click()
  const nav = testInfo.project.name === 'mobile'
    ? page.getByRole('dialog', { name: 'Product navigation' }).getByRole('navigation', { name: 'ZimLearnGraph primary navigation' })
    : page.locator('aside').getByRole('navigation', { name: 'ZimLearnGraph primary navigation' })
  await expect(nav.locator('a')).toHaveCount(7)
  const hrefs = await nav.locator('a').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
  expect(hrefs).toEqual(['/impact', '/impact/schools', '/impact/classes', '/impact/assessments', '/impact/interventions', '/impact/reports', '/impact/stakeholder-demo'])
  for (const href of hrefs) {
    const response = await page.request.get(href!, { maxRetries: 2 })
    expect(response.status(), href!).toBeLessThan(400)
  }
})

test('mobile navigation is reachable and content is not clipped', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-only interaction')
  await page.goto('/impact')
  await page.getByRole('button', { name: 'Open product navigation' }).click()
  const dialog = page.getByRole('dialog', { name: 'Product navigation' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('link', { name: /Schools/ }).click()
  await expect(page).toHaveURL(/\/impact\/schools$/)
  await expect(page.getByRole('heading', { name: 'Schools' })).toBeVisible()
  await expectNoOverflow(page)
})
