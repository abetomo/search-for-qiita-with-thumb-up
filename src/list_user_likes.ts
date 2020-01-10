/* eslint no-empty: ["error", { "allowEmptyCatch": true }] */

// wip

import * as puppeteer from 'puppeteer'

const userId = process.argv[2]
const limit = Number(process.argv[3]) || 3

type Item = {
  link: string
  title: string
}
;(async (): Promise<void> => {
  let links: Item[] = []

  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 500
  })

  const page = await browser.newPage()
  await page.goto(`https://qiita.com/${userId}/like`)

  for (let i = 0; i < limit; i++) {
    console.log(`page: ${i + 1}`)
    const data = await page.evaluate(() => {
      const elements = Array.from(
        document.getElementsByClassName('u-link-no-underline')
      )
      const links = elements.map((a) => {
        return {
          link: a.getAttribute('href'),
          title: (a as HTMLElement).innerText
        }
      })
      const next = ((): boolean => {
        try {
          const nextLink = document.getElementsByClassName(
            'js-next-page-link'
          )[0]
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

  console.log(JSON.stringify(links))

  browser.close()
})()
