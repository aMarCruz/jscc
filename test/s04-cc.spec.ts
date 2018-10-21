import expect from 'expect.js'

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

  it('supports `#elif` expression with `#ifset` and `#ifnset`', function () {
    testStr([
      '//#set _FOO = 2',
      '//#ifnset _FOO',
      'error',
      '//#elif _FOO===2',
      'OK',
      '//#endif',
      '//#ifset _FOO_2',
      'error',
      '//#elif 1',
      'OK',
      '//#endif',
    ], 'OK\nOK')
  })

  it('support the `#else` directive', function () {
    testStr([
      '//#if 0',
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

  it('have `#ifset` for testing if variable exists (even undefined values)', function () {
    testStr([
      '//#ifset _UNDEF',
      'false',
      '//#endif',
      '//#set _UNDEF undefined',
      '//#ifset _UNDEF',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('and `#ifnset` for testing if variable NOT exists', function () {
    testStr([
      '//#ifnset _THIS_IS_UNSET',
      'OK',
      '//#endif',
      '//#set _THIS_IS_SET',
      '//#ifnset _THIS_IS_SET',
      'error',
      '//#endif',
    ], 'OK')
  })

  it('`#error` throws an exception with a custom message', function () {
    expect(function () {
      preprocStr('//#error "boom" + "!"')
    }).to.throwError(/boom!/)
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

  it('must ignore directives inside removed blocks', function () {
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

  it('`#else` and `#endif` ignores anything in their line', function () {
    testStr([
      '//#if 0',
      'false',
      '//#else this is ignored',
      'OK',
      '//#endif and this',
    ], 'OK')
  })

  it('for other directives, supports a comment after the expression', function () {
    testStr([
      '//#set _V 1 // works',
      '//#if 0 // ok',
      'Error',
      '//#elif _V===1// no need space',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('can open a multiline comment with one directive and close it with other', function () {
    testStr([
      '/*#if 0 // This one opens the multiline comment',
      'Error',
      '//#else This other closes the multiline comment */',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('anything inside multiline comment is revealed if the expr is trueish', function () {
    testStr([
      '/*#if 1 // open the multiline comment, it will be true',
      'OK',
      '//#else closes the comment, but "OK" will be visible */',
      'Error',
      '//#endif',
    ], 'OK')
  })

  it('can hide all the output enclosing it in a falsy block', function () {
    testStr('//#if false\nfoo()\n//#endif', '')
  })

  it('can comment output lines (usefull to hide console.* and params)', function () {
    testFileStr('var-hide-output', "//('DEBUG')")
  })

  it('...or can reveal lines if the condition is trueish', function () {
    testFileStr('var-hide-output', /import [\S\s]+\$_DEBUGOUT\('DEBUG'\)/, { values: { _DEBUG: 1 } })
  })

  it('does not confuse comments that seems like directives', function () {
    const source = [
      '///#set _A 1',
      'false',
      '//*#set _A',
      'false',
    ].join('\n')
    testStr(source, source)
  })

  it('does not confuse comments that seems like directives (2)', function () {
    testStr([
      '//#if 1//#else',
      'OK',
      '//#elif 1//#endif',
      'OK',
      '//#endif \t//#endif',
    ], 'OK')
  })

  describe('Conditional Compilation must throw on...', function () {

    it('unclosed conditional blocks', function () {
      expect(function () {
        preprocStr('//#if _FOO\n#endif')
      }).to.throwError(/Unexpected end of file/)
    })

    it('unbalanced block', function () {
      expect(function () {
        preprocStr('//#if true\n//#elif 1')
      }).to.throwError(/Unexpected end of file/)
    })

    it('unbalanced blocks even inside removed blocks', function () {
      expect(() => {
        preprocStr([
          '//#if 1',
          'OK',
          '//#else',
          '  //#if 1',
          '//#endif',
        ].join('\n'))
      }).to.throwError(/Unexpected end of file/)
    })

    it('`#elif` without its previous `#if`', function () {
      expect(() => {
        preprocStr('#if 1\n//#elif 1\n//#endif')
      }).to.throwError(/Unexpected #elif/)
    })

    it('`#elif` inside `#else`', function () {
      expect(() => {
        preprocStr('//#if 1\n//#else\n//#elif 1\n//#endif')
      }).to.throwError(/Unexpected #elif/)
    })

    it('`#else` after `#else`', function () {
      expect(() => {
        preprocStr('//#if 1\n//#else\n//#else\n')
      }).to.throwError(/Unexpected #else/)
    })

    it('`#endif` without a previous block', function () {
      expect(() => {
        preprocStr('#if 1\n//#endif\n')
      }).to.throwError(/Unexpected #endif/)
    })

    it('`#endif` widthout a previous block (duplicated #endif)', function () {
      expect(function () {
        preprocStr('//#if 1\n//#endif\n//#endif')
      }).to.throwError(/Unexpected #endif/)
    })

    it('directive without expression throws "Expression expected"', function () {
      expect(function () {
        preprocStr('//#if\n//#endif')
      }).to.throwError(/Expression expected/)
    })

    it('directive without expression inside removed blocks', function () {
      expect(function () {
        preprocStr([
          '//#if 1',
          'OK',
          '//#else',
          '  //#if',
          '  //#endif',
          '//#endif',
        ].join('\n'))
      }).to.throwError(/Expression expected/)
    })

  })

})

//#endregion Conditional Compilation
