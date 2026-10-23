import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('que-conozco-lang', 'es'))
  await page.goto('/')
  await expect(page.getByRole('status').filter({ hasText: 'Cargando datos' })).toHaveCount(0)
})

const country = (page: import('@playwright/test').Page, cca2: string) =>
  page.locator(`path[data-cca2="${cca2}"]`)

test('picking a country opens its card; marking it is explicit and undoable', async ({ page }) => {
  await country(page, 'BR').click()
  const card = page.getByRole('region', { name: 'Brasil' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('0/')

  await card.getByRole('button', { name: 'Marcar todo el país' }).click()
  await expect(card).not.toContainText('0/')
  await expect(page.getByText('100%').first()).toBeVisible()

  await page.getByRole('button', { name: /Deshacer/ }).click()
  await expect(card).toContainText('0/')
})

test('tapping the map alone never changes the marks', async ({ page }) => {
  await country(page, 'BR').click()
  await country(page, 'DE').click()
  const stored = await page.evaluate(() => localStorage.getItem('que-conozco-v1'))
  expect(JSON.parse(stored ?? '{"state":{"visited":[]}}').state.visited).toEqual([])
})

test('tiny countries are reachable through map dots', async ({ page }) => {
  await page.locator('circle[data-cca2="SG"]').last().click({ force: true })
  await expect(page.getByRole('region', { name: 'Singapur' })).toBeVisible()
})

test('language switch updates the document language', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  const menu = page.getByRole('button', { name: 'Menú' })
  if (await menu.isVisible()) {
    await menu.click()
    await page.getByRole('button', { name: /English/ }).click()
  } else {
    await page.getByRole('button', { name: /EN/ }).click()
  }
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle(/Travel map/)
})

test('export then import restores marks, and bad files are rejected', async ({ page }, info) => {
  await country(page, 'BR').click()
  await page.getByRole('region', { name: 'Brasil' }).getByRole('button', { name: 'Marcar todo el país' }).click()

  const menu = page.getByRole('button', { name: 'Menú' })
  const open = async () => {
    if (await menu.isVisible()) await menu.click()
  }
  await open()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Exportar/ }).click(),
  ])
  const file = info.outputPath('backup.json')
  await download.saveAs(file)
  const saved = JSON.parse(readFileSync(file, 'utf8'))
  expect(saved.visited.length).toBeGreaterThan(0)

  await page.getByRole('button', { name: /Deshacer/ }).click()
  await open()
  await page.locator('input[type=file]').setInputFiles(file)
  await expect(page.getByText('Datos importados')).toBeVisible()
  const stored = JSON.parse((await page.evaluate(() => localStorage.getItem('que-conozco-v1')))!)
  expect(stored.state.visited).toEqual(saved.visited)

  await page.locator('input[type=file]').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"visited":["<script>"]}'),
  })
  await expect(page.getByText(/no es una copia válida/)).toBeVisible()
})

test('credits and privacy are reachable from the footer', async ({ page }) => {
  await page.getByRole('button', { name: 'Créditos y privacidad' }).click()
  await expect(page.getByRole('dialog')).toContainText('GeoNames')
  await expect(page.getByRole('dialog')).toContainText('CC BY 4.0')
  await expect(page.getByRole('link', { name: /Política de privacidad/ })).toHaveAttribute('href', /legal\.html#es$/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('the app renders and recovers when country data fails to load', async ({ page }) => {
  await page.route('**/data/country-index.json*', (route) => route.abort())
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('No se pudieron cargar')
  await page.unroute('**/data/country-index.json*')
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await country(page, 'BR').click()
  await expect(page.getByRole('region', { name: 'Brasil' })).toContainText('/')
})

test('dragging the map pans without selecting a country', async ({ page }) => {
  const box = (await page.locator('svg[role=img]').boundingBox())!
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await page.mouse.wheel(0, -300)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45, { steps: 5 })
  await page.mouse.up()
  await expect(page.getByRole('region')).toHaveCount(0)
})

test('the legal page and license files are served', async ({ page, request }) => {
  await page.goto('/legal.html')
  await expect(page.getByRole('heading', { name: 'Política de privacidad' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Privacy policy' })).toBeVisible()
  const licenses = await request.get('/third-party-licenses.txt')
  expect(await licenses.text()).toContain('react@')
  expect((await request.get('/data/LICENSE.txt')).ok()).toBe(true)
})
