const { test, expect, beforeEach, describe } = require('@playwright/test')
import { loginWith } from './helper'

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'rootUser',
        username: 'root',
        password: 'root'
      }
    })

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByText('Log in to application')).toBeVisible()
    await expect(page.getByTestId('username')).toBeVisible()
    await expect(page.getByTestId('password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'login' })).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'root', 'root')
      await expect(page.getByText('rootUser logged-in')).toBeVisible()
    })

    test('login fails with wrong password', async ({ page }) =>{
      await loginWith(page, 'wrong', 'wrong')
    
      const errorDiv = page.locator('.error')
      await expect(errorDiv).toContainText('Wrong Username or Password')
      await expect(errorDiv).toHaveCSS('border-style', 'solid')
      await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
      await expect(page.getByText('rootUser logged-in')).not.toBeVisible()
    })
  })

  describe('when logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'root', 'root')
    })

    test('a new blog can be created', async ({ page }) => {
      await page.getByRole('button', { name: 'new blog' }).click()
      await page.getByTestId('title').fill('test-blog')
      await page.getByTestId('author').fill('test-author')
      await page.getByTestId('url').fill('www.newblog.com')
      await page.getByRole('button', { name: 'create' }).click()
      await expect(page.getByText('a new blog test-blog by test-author added')).toBeVisible()
      await expect(page.getByText('test-blog test-author')).toBeVisible()
    })
  })
})
