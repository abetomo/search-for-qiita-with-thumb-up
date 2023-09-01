/* eslint '@typescript-eslint/no-var-requires': 0 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as path from 'path'
import { execFileSync } from 'child_process'
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

const getLikeData = (username: string): any[] => {
  const likeDataPath = path.join(tmpdir(), 'list_user_likes.json')
  const command = path.join(__dirname, 'list_user_likes.ts')
  const cmd = 'ts-node'
  const args = [command, username, likeDataPath]
  execFileSync(cmd, args)

  const likeData = require(likeDataPath)
  unlinkSync(likeDataPath)
  return likeData
}

const usage = (): void => {
  console.log(
    `${path.basename(process.argv[1])} select QUERY | update USERNAME`,
  )
}

const update = async (username: string): Promise<void> => {
  const likeData = getLikeData(username)
  for (const data of likeData) {
    const itemId = data.link.split('/').pop()

    const item = await qiita.Resources.Item.get_item(itemId)
    console.log(item.title)
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
      '  ',
    )
    console.log(json)
  }
}

const action = process.argv[2]

switch (action) {
  case 'update':
    update(process.argv[3]).then(() => {
      process.exit(0)
    })
    break
  case 'select':
    select(process.argv[3])
    process.exit(0)
    break
  default:
    usage()
    process.exit(1)
}
