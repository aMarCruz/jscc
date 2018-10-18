import { testFile } from './helpers/test-file'

describe('HTML Processing', function () {

  it('must work since jscc is language agnostic', function () {
    testFile('html-vars-js.html', {
      values: { _TITLE: 'My App' },
    })
  })

  it('must handle html comments ("<!--") by default', function () {
    testFile('html-comments.html', {
      prefixes: '<!--',
      values: { _TITLE: 'My App' },
    })
  })

  it('must handle short html comments "<!" from v1.0', function () {
    testFile('html-short-cmts.html', {
      values: { _TITLE: 'My App' },
    })
  })

})
