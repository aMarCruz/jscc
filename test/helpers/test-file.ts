import fs from 'fs'
import expect from 'expect.js'

import { concatFile } from './concat-file'
import { transformFile } from './transform-file'

const getExpected = (file: string) => fs
  .readFileSync(concatFile('expected', file), 'utf8').replace(/\s*$/, '')

export const testFile = (file: string, opts?: JsccOptions, save?: boolean) => {
  const expected = getExpected(file)
  const result   = transformFile(file, opts)

  expect(result).to.be.a('string')
  if (save) {
    throw new Error('If mocha is not watching, comment this to save the file.')
    //fs.writeFileSync(concat(file + '_out.js'), result || '')
  }

  expect(result).to.be(expected)
}
