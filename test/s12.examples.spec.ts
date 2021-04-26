import { testFile } from './helpers/test-file'
import { testFileStr } from './helpers/test-file-str'
import { testStr } from './helpers/test-str'

describe('Examples:', function () {

  it('Simple replacement', function () {
    testFile('ex-simple-replacement')
  })

  it('Object and properties', function () {
    testFile('ex-object-properties')
  })

  it('Using _FILE and dates', function () {
    testFileStr('ex-file-and-date',
      // /ex-file-and-date\.js\s+Date: 20\d{2}-\d{2}-\d{2}\n/
      /.*/
    )
  })

  it('Hidden blocks (and process.env.*)', function () {
    testStr([
      '/*#if 1',
      'import mylib from "browser-lib"',
      '//#else //*/',
      'import mylib from "node-lib"',
      '//#endif',
      'mylib()',
    ], 'import mylib from "browser-lib"\nmylib()')
  })

  it('Changing prefixes to work with CoffeScript', function () {
    testStr([
      '# #set _DEBUG true',
      '',
      '### #if _DEBUG',
      'console.log "debug mode"',
      '### #else',
      'console.log "production"',
      '# #endif',
    ], '\nconsole.log "debug mode"', {
      prefixes: ['# ', '### '],
    })
  })

  it('Workaround to #3: not work with eslint rule: comma-spacing', function () {
    testFile('eslint-autofix', {
      prefixes: [/\/\/ ?/, /\/\* ?/],
    })
  })

})
