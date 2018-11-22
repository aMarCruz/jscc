import expect from 'expect.js'
import jscc from '../jscc'

export const testStr = (
  source: string | string[],
  expected: string | RegExp,
  opts?: jscc.Options
) => {

  if (Array.isArray(source)) {
    source = source.join('\n')
  }

  const code = jscc(source, '', opts).code.replace(/\s+$/, '') // trimRight

  if (expected instanceof RegExp) {
    expect(code).to.match(expected)
  } else {
    expect(code).to.be(expected)
  }

}
