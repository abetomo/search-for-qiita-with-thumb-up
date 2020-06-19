// wip

import { Database } from 'nroonga'

export default class Db {
  private db: Database

  private tableName = 'qiita_items'

  constructor() {
    this.db = new Database('/tmp/qiita_list_user_likes')
  }

  close(): void {
    this.db.close()
  }

  isTableExists(): boolean {
    return (
      this.db.commandSync('table_list').filter((row: any) => {
        return row[1] === this.tableName
      }).length > 0
    )
  }

  init(): void {
    if (this.isTableExists()) return

    this.db.commandSync('table_create', {
      name: this.tableName,
      flags: 'TABLE_HASH_KEY',
      key_type: 'ShortText',
    })

    this.db.commandSync('column_create', {
      table: this.tableName,
      name: 'title',
      flags: 'COLUMN_SCALAR',
      type: 'ShortText',
    })
    this.db.commandSync('column_create', {
      table: this.tableName,
      name: 'url',
      flags: 'COLUMN_SCALAR',
      type: 'ShortText',
    })
    this.db.commandSync('column_create', {
      table: this.tableName,
      name: 'body',
      flags: 'COLUMN_SCALAR',
      type: 'LongText',
    })
    this.db.commandSync('column_create', {
      table: this.tableName,
      name: 'updated_at',
      flags: 'COLUMN_SCALAR',
      type: 'Time',
    })

    this.db.commandSync('table_create', {
      name: 'Terms',
      flags: 'TABLE_PAT_KEY|KEY_NORMALIZE',
      key_type: 'ShortText',
      normalizer: 'NormalizerAuto',
      default_tokenizer: 'TokenBigramSplitSymbolAlpha',
    })
    this.db.commandSync('column_create', {
      table: 'Terms',
      name: 'entry_title',
      flags: 'COLUMN_INDEX|WITH_POSITION',
      type: this.tableName,
      source: 'title',
    })
    this.db.commandSync('column_create', {
      table: 'Terms',
      name: 'entry_body',
      flags: 'COLUMN_INDEX|WITH_POSITION',
      type: this.tableName,
      source: 'body',
    })
  }

  load({
    id,
    title,
    url,
    body,
    updated_at,
  }: {
    id: string
    title: string
    url: string
    body: string
    updated_at: string
  }): boolean {
    return this.db.commandSync('load', {
      table: this.tableName,
      values: JSON.stringify({
        _key: id,
        updated_at: new Date(updated_at).getTime() * 1000,
        title,
        url,
        body,
      }),
    })
  }

  select(query: string): any {
    return this.db.commandSync('select', {
      table: this.tableName,
      match_columns: 'title,body',
      query: query,
      limit: 100, // TODO: More than 100 cases
    })
  }
}
