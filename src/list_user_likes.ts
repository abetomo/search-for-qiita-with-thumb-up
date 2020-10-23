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
  let links: Item[] = []

  const browser = await launch({
    headless: true,
    slowMo: 500,
  })

  const page = await browser.newPage()
  await page.goto(`https://qiita.com/${userId}/lgtms`)

  for (let i = 0; i < limit; i++) {
    console.log(`page: ${i + 1}`)
    const data = await page.evaluate(() => {
      const elements = Array.from(document.getElementsByTagName('a'))
      const links = elements
        .filter((a) => {
          const href = a.getAttribute('href')
          return href != null && href.match(/\/items\//)
        })
        .map((a) => {
          return {
            link: a.getAttribute('href'),
            title: (a as HTMLElement).innerText,
          }
        })
      const next = ((): boolean => {
        try {
          const nextLink = document.getElementsByClassName('st-Pager_link')[0]
          if (nextLink == null) {
            return false
          }
          ;(nextLink as HTMLElement).click()
          return true
        } catch (e) {}
        return false
      })()
      return { links, next }
    })
    links = links.concat(data.links as Item[])

    if (!data.next) {
      break
    }
    await page.waitFor(10000)
  }

  writeFileSync(outputPath, JSON.stringify(links), 'utf8')

  browser.close()
})()
