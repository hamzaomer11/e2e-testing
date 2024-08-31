const { test, expect, beforeEach, describe } = require('@playwright/test')

describe('Blog app', () => {
  beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('Log in to application')).toBeVisible()
    await page.getByTestId('username').fill('wally')
    await page.getByTestId('password').fill('wally')
    await page.getByRole('button', { name: 'login' }).click()
  })
})