import fs from 'fs'
import jscc from '../jscc'
import { concatPath } from './concat-path'

export const transformFile = (file: string, opts?: JsccOptions) => {
  const inFile = concatPath('fixtures', file)
  const code = fs.readFileSync(inFile, 'utf8')

  return jscc(code, inFile, opts).code.replace(/\s*$/, '')
}
