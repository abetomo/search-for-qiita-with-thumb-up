/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

import { launch } from 'puppeteer'
import { writeFileSync } from 'fs'

const userId = process.argv[2]
const outputPath = process.argv[3]
const limit = Number(process.argv[4]) || 3

type Item = {
  link: string
  title: string
}
;(async (): Promise<void> => {
  const browser = await launch({ headless: true })

  const page = await browser.newPage()
  await page.goto(`https://qiita.com/${userId}/lgtms`)

  const links: Item[] = []
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

      const link: string = await href.jsonValue()
      if (!link.match(/\/items\//)) {
        continue
      }
      const title: string = await text.jsonValue()

      links.push({ link, title })
    }
    const nextLink = await page.$('.fa-angle-right')
    if (nextLink == null) {
      break
    }
    nextLink.click()
    await page.waitForTimeout(10000)
  }

  writeFileSync(outputPath, JSON.stringify(links), 'utf8')

  await browser.close()
})()
