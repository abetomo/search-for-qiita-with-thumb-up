/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'

const userId = process.argv[2]
const outputPath = process.argv[3]
const limit = Number(process.argv[4]) || 3

type Item = {
  link: string
  title: string
}
;(async (): Promise<void> => {
  const browser = await puppeteer.launch({ headless: true })

  const page = await browser.newPage()
  await page.goto(`https://qiita.com/${userId}/lgtms`)
  await page.waitForTimeout(3000)

  const links: Item[] = []
  const myPostRegExp = new RegExp(`${userId}/items/`)
  for (let i = 0; i < limit; i++) {
    console.log(`page: ${i + 1}`)
    const elements = await page.$$('article a')
    for (const elem of elements) {
      const href = await elem.getProperty('href')
      if (href == null) {
        continue
      }
      const text = await elem.getProperty('textContent')
      if (text == null) {
        continue
      }
      const title: string = await text.jsonValue() ?? ''
      if (title === '') {
        continue
      }

      const link: string = await href.jsonValue() as string
      if (!link.match(/\/items\//)) {
        continue
      }
      if (myPostRegExp.test(link)) {
        continue
      }

      links.push({ link, title })
    }
    const nextLink = await page.$('button[aria-label="Next Page"]')
    if (nextLink == null) {
      break
    }
    nextLink.click()
    await page.waitForTimeout(10000)
  }

  writeFileSync(outputPath, JSON.stringify(links), 'utf8')

  await browser.close()
})()
