import fs from 'fs'
import jscc from '../jscc'
import { concatFile } from './concat-file'

export const transformFile = (file: string, opts?: JsccOptions) => {
  const inFile = concatFile('fixtures', file)
  const code = fs.readFileSync(inFile, 'utf8')

  return jscc(code, inFile, opts).code.replace(/\s*$/, '')
}
