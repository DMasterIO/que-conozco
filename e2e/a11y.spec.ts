import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => localStorage.setItem('que-conozco-lang', 'es'))
      await page.goto('/')
      await page.waitForSelector('path[data-cca2="BR"]')
    })

    const audit = async (page: import('@playwright/test').Page) => {
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
      expect(violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target})`)).toEqual([])
    }

    test('home page', async ({ page }) => {
      await audit(page)
    })

    test('country card and country detail', async ({ page }) => {
      await page.locator('path[data-cca2="BR"]').click()
      await audit(page)
      await page.getByRole('button', { name: /Ciudades/ }).first().click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await audit(page)
    })

    test('stats, colors, share and about modals', async ({ page }) => {
      const menu = page.getByRole('button', { name: 'Menú' })
      for (const name of [/Estadísticas/, /Colores/, /Compartir/]) {
        if (await menu.isVisible()) await menu.click()
        await page.getByRole('button', { name }).first().click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await audit(page)
        await page.keyboard.press('Escape')
      }
      await page.getByRole('button', { name: 'Créditos y privacidad' }).click()
      await audit(page)
    })
  })
}
