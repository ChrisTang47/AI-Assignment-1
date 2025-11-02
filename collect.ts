import { chromium } from 'playwright'

async function main() {
  let browser = await chromium.launch({ headless: false })
  let page = await browser.newPage()
  let url = 'https://www.google.com'
  await page.goto(url)
  let title = await page.evaluate(() => {
    return document.title
  })
  console.log({ url, title })
  await page.close()
  await browser.close()
}
main().catch(e => console.error(e))