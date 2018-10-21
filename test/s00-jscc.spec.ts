import expect from 'expect.js'
import path from 'path'

// common helpers
import { testFile } from './helpers/test-file'
import { testFileStr } from './helpers/test-file-str'
import { preprocStr } from './helpers/preproc-str'
import { testStr } from './helpers/test-str'

process.chdir(__dirname)

describe('jscc', function () {

  it('by default uses JavaScript comments to start directives', function () {
    testStr([
      '//#unset _FOO',
      '/*#set _FOO 1',
      '$_FOO',
    ], '1')
  })

  it('the predefined varname `_FILE` is the relative path of the current file', function () {
    testFile('def-file-var')
  })

  it('any user-defined `_FILE` is overwritten by the current filename (even if empty)', function () {
    testFile('def-file-var', {
      values: { _FILE: 'my-code.js' },
    })
  })

  it('`_VERSION` comes from the package.json in the current or upper path', function () {
    const version = require('../package.json').version as string
    testStr('/* @version $_VERSION */', `/* @version ${version} */`)
  })

  it('`_VERSION` ignores package.json without a `version` property', function () {
    const version = require('../package.json').version as string
    const cwdir = process.cwd()

    process.chdir(path.join(cwdir, 'noversion'))
    const result = preprocStr('$_VERSION')
    process.chdir(cwdir)
    expect(result).to.be(version)
  })

  it('non-empty user defined `_VERSION` must be preserved', function () {
    testStr('$_VERSION', /^@$/, { values: { _VERSION: '@' } })
  })

  it('empty user defined `_VERSION` must be overwritten', function () {
    const version = require('../package.json').version as string
    testStr('$_VERSION', version, { values: { _VERSION: '' } })
  })

  it('support conditional comments with the `#if expression` syntax', function () {
    testStr([
      '//#if _FALSE',
      'false',
      '//#endif',
      '//#if _TRUE',
      'OK',
      '//#endif',
    ], 'OK', {
      values: { _TRUE: true },
    })
  })

  it('directives ends at the end of the line or the first unquoted `//`', function () {
    testFileStr('directive-ending', 'true')
  })

  it('must preserve Windows line-endings', function () {
    const code = [
      '//#set _A 1',
      '//#if _A',
      'Win',
      '//#endif',
      'OK',
      '',
    ].join('\r\n')
    expect(preprocStr(code)).to.be('Win\r\nOK\r\n')
  })

  it('must preserve Windows line-endings (2)', function () {
    const code = [
      '//#if 1',
      'Win',
      'OK',
      '//#endif',
      '',
    ].join('\r\n')
    expect(preprocStr(code)).to.be('Win\r\nOK\r\n')
  })

  it('must preserve Mac line-endings', function () {
    const code = [
      '//#set _A 1',
      '//#if _A',
      'Mac',
      '//#endif',
      'OK',
      '',
    ].join('\r')
    expect(preprocStr(code)).to.be('Mac\rOK\r')
  })

  it('must preserve Mac line-endings (2)', function () {
    const code = [
      '//#if 1',
      'Mac',
      'OK',
      '//#endif',
      '',
    ].join('\r')
    expect(preprocStr(code)).to.be('Mac\rOK\r')
  })

  it('must preserve tuf8 BOM in the source', function () {
    // Seems nodeJS uses \uFEFF to mark any enconding
    testFileStr('utf8-bom.txt', /^\ufeffOK$/)
  })

})
