import expect from 'expect.js'
import { transformFile } from './transform-file'

export const testFileStr = (file: string, expected: string | RegExp, opts?: JsccOptions) => {
  const result = transformFile(file, opts)

  if (expected instanceof RegExp) {
    expect(result).to.match(expected)
  } else {
    expect(result).to.be(expected)
  }
}
