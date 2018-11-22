import expect from 'expect.js'
import jscc from '../jscc'
import { transformFile } from './transform-file'

export const testFileStr = (file: string, expected: string | RegExp, opts?: jscc.Options) => {
  const result = transformFile(file, opts)

  if (expected instanceof RegExp) {
    expect(result).to.match(expected)
  } else {
    expect(result).to.be(expected)
  }
}
