import expect from 'expect.js'

import { testFile } from './helpers/test-file'
import { testFileStr } from './helpers/test-file-str'
import { preprocStr } from './helpers/preproc-str'
import { testStr } from './helpers/test-str'

describe('Conditional Compilation', function () {

  it('has the pair `#if`/`#endif` for basic conditional blocks', function () {
    testStr([
      '//#if 1',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('does not confuse token-like comments', function () {
    const source = [
      '///#set _A 1',
      'false',
      '//*#set _A',
      'false',
    ].join('\n')
    testStr(source, source)
  })

  it('supports `#elif expression`', function () {
    testStr([
      '//#set _FOO = 2',
      '//#if !_FOO',
      'error',
      '//#elif _FOO===1+1',
      'OK',
      '//#elif _FOO===2',
      'error',
      '//#endif',
    ], 'OK')
  })

  it('has support for `#else`', function () {
    testStr([
      '//#set _FOO = false',
      '//#if _FOO',
      'error',
      '//#else',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('and the `#elif` directive', function () {
    testStr([
      '//#set _FOO 2',
      '//#if _FOO === 0',
      'false',
      '//#elif _FOO === 1',
      'false',
      '//#elif _FOO === 2',
      'OK',
      '//#else',
      'false',
      '//#endif',
    ], 'OK')
  })

  it('have `#ifset` for testing variable existence (even undefined values)', function () {
    testStr([
      '//#ifset _UNDEF',
      'false',
      '//#endif',
      '//#set _UNDEF',
      '//#ifset _UNDEF',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('and `#ifnset` for testing not existing variables', function () {
    testStr([
      '//#ifnset _THIS_IS_UNSET',
      'OK',
      '//#endif',
      '//#set _THIS_IS_SET',
      '//#ifnset _THIS_IS_SET',
      'No',
      '//#endif',
    ], 'OK')
  })

  it('blocks can be nested', function () {
    testStr([
      '//#set _FOO 2',
      '//#set _BAR 2',
      '//#set _BAZ 2',
      '',
      '//#if _FOO == 1      // false',
      '//#elif _FOO == 2    // true',
      'OK1',
      '  //#if _BAR == 2    // true',
      'OK2',
      '    //#if _BAZ == 1  // false',
      'NO',
      '    //#else',
      'OK3',
      '    //#endif',
      '  //#endif',
      '//#endif',
    ], '\nOK1\nOK2\nOK3')
  })

  it('`#if` inside falsy `#else` must be ignored', function () {
    testStr([
      '//#if 1',
      'OK',
      '//#else',
      '  //#if 1',
      'NO',
      '  //#endif',
      '//#endif',
    ], 'OK')
  })

  it('can hide all the output', function () {
    testStr('//#if false\nfoo()\n//#endif', '')
  })

  it('you can throw an exception with custom message through `#error`', function () {
    expect(function () {
      preprocStr('//#error "boom" + "!"')
    }).to.throwError(/boom!/)
  })

  it('`#else` and `#endif` ignores anything in their line', function () {
    testStr([
      '//#if 0',
      'false',
      '//#else this is ignored',
      'OK',
      '//#endif and this',
    ], 'OK')
  })

  it('can use multiline comments by closing the comment after `//`', function () {
    testFile('cc-hide-ml-cmts')
  })

  it('using multiline comments `/**/` allows hide content', function () {
    testFile('cc-hide-content')
  })

  it('can comment output lines (usefull to hide console.* and params)', function () {
    testFileStr('var-hide-output', "//('DEBUG')")
  })

  it('...or can reveal lines if the condition is trueish', function () {
    testFileStr('var-hide-output', /import [\S\s]+\$_DEBUGOUT\('DEBUG'\)/, { values: { _DEBUG: 1 } })
  })

  describe('Errors in Conditional Compilation', function () {

    it('unclosed conditional blocks throws an exception', function () {
      expect(function () {
        testStr([
          '//#set _FOO',
          '//#if _FOO',
          'true',
        ], '')
      }).to.throwError(/Unexpected end of file/)
    })

    it('unbalanced blocks throws, too', function () {
      expect(function () {
        testStr([
          '//#if true',
          'true',
          '//#endif',
          '//#endif',
        ], '')
      }).to.throwError(/Unexpected #/)
    })

    it('`#elif` without its previous `#if` must throw', function () {
      expect(() => {
        preprocStr('#if 1\n//#elif 1\n//#endif')
      }).to.throwError(/Unexpected #elif/)
    })

    it('`#elif` inside `#else` must throw', function () {
      expect(() => {
        testStr([
          '//#if 1',
          '//#else',
          '//#elif 1',
          '//#endif',
        ], '')
      }).to.throwError(/Unexpected #elif/)
    })

    it('`#else` after `#else` must throw', function () {
      expect(() => {
        const code = '//#if 1\n//#else\n//#else\n'
        preprocStr(code)
      }).to.throwError(/Unexpected #else/)
    })

    it('directive without expression raises "Expression expected"', function () {
      expect(function () {
        preprocStr('//#if\n//#endif')
      }).to.throwError(/Expression expected/)
    })

  })

})

//#endregion Conditional Compilation
