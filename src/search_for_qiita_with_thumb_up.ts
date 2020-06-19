/* eslint '@typescript-eslint/no-var-requires': 0 */

import * as path from 'path'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { unlinkSync } from 'fs'

const WAIT_MILLISECOND = 500

const qiita = require('qiita-js')
global.Promise = require('bluebird')
require('isomorphic-fetch')

qiita.setToken(process.env.QIITA_TOKEN)
qiita.setEndpoint('https://qiita.com')

import Db from './db'
const db = new Db()
db.init()

const getLikeData = (): any[] => {
  const likeDataPath = path.join(tmpdir(), 'list_user_likes.json')
  const command = path.join(__dirname, 'list_user_likes.ts')
  execSync(`ts-node ${command} abetomo ${likeDataPath}`)

  const likeData = require(likeDataPath)
  unlinkSync(likeDataPath)
  return likeData
}

const usage = (): void => {
  console.log(`${path.basename(process.argv[1])} select|update [query]`)
}

const update = async (): Promise<void> => {
  const likeData = getLikeData()
  for (const data of likeData) {
    const itemId = data.link.split('/').pop()

    const item = await qiita.Resources.Item.get_item(itemId)
    console.log(item)
    db.load(item)

    await new Promise((resolve) => setTimeout(resolve, WAIT_MILLISECOND))
  }
}

const select = (query: string): void => {
  for (const row of db.select(query)[0].slice(2)) {
    const json = JSON.stringify(
      {
        title: row[3],
        url: row[5],
      },
      null,
      '  '
    )
    console.log(json)
  }
}

const action = process.argv[2]
const query = process.argv[3]

switch (action) {
  case 'update':
    update().then(() => {
      process.exit(0)
    })
    break
  case 'select':
    select(query)
    process.exit(0)
    break
  default:
    usage()
    process.exit(1)
}
