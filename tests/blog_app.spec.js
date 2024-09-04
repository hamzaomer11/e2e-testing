const { test, expect, beforeEach, describe } = require('@playwright/test')
import { loginWith } from './helper'
import { createBlog } from './helper'

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

    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'testUser',
        username: 'test',
        password: 'test'
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
      await createBlog(page, 'test-blog', 'test-author', 'www.newblog.com')
      await expect(page.getByText('a new blog test-blog by test-author added')).toBeVisible()
      await expect(page.getByText('test-blog test-author')).toBeVisible()
    })
  })

  describe('a blog can', () => {
    beforeEach(async ({page}) => {
      await loginWith(page, 'root', 'root')
      await createBlog(page, 'test-blog', 'test-author', 'www.newblog.com')
    })

    test('have likes increased', async ({ page }) => {
      await expect(page.getByText('test-blog test-author')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('0')).toBeVisible()
      await page.getByRole('button', { name: 'like' }).click()
      await expect(page.getByText('1')).toBeVisible()
    })

    test('be deleted', async ({page}) => {
      await expect(page.getByText('test-blog test-author')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'remove' }).click()
      page.on('dialog', async dialog => {
        console.log(dialog.message('Remove blog test-blog by test-author?'));
        await dialog.accept();
      });

      await expect(page.getByText('test-blog test-author')).not.toBeVisible()
    })
    
  })

  describe('only blog creator', async () => {
    beforeEach(async ({page}) => {
      await loginWith(page, 'test', 'test')
      await createBlog(page, 'test-blog-2', 'test-author-2', 'www.newblog2.com')
      await page.getByRole('button', { name: 'logout' }).click()
    })

    test('can see remove button', async ({ page }) => {
      await loginWith(page, 'root', 'root')
      await expect(page.getByText('test-blog-2 test-author-2')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByRole('button', { name: 'remove'})).not.toBeVisible()
    })
  })

  describe('blogs are arranged in the order', async () => {
    beforeEach(async ({page}) => {
      await loginWith(page, 'root', 'root')
      await createBlog(page, 'most-liked', '1st-author', 'www.bloglikes.com')
      await createBlog(page, '2nd-most-liked', '2nd-author', 'www.bloglikes2.com')
      await createBlog(page, '3rd-most-liked', '3rd-author', 'www.bloglikes3.com')
      await page.getByText('3rd-most-liked 3rd-author').waitFor()
    })

    test('according to the likes', async ({page}) => {
      await page.getByText('most-liked 1st-author').getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'like' }).nth(0).click()
      await page.getByRole('button', { name: 'like' }).nth(0).click()
      await page.getByRole('button', { name: 'like' }).nth(0).click()
      await page.getByText('2nd-most-liked 2nd-author').getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'like' }).nth(1).click()
      await page.getByRole('button', { name: 'like' }).nth(1).click()
      await page.getByText('3rd-most-liked 3rd-author').getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'like' }).nth(2).click()
      
      await expect(page.locator('.blog').nth(0).getByText('most-liked 1st-author')).toBeVisible()
      await expect(page.locator('.blog').nth(1).getByText('2nd-most-liked 2nd-author')).toBeVisible()
      await expect(page.locator('.blog').nth(2).getByText('3rd-most-liked 3rd-author')).toBeVisible()
    })
  })
})

