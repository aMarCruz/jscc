import expect from 'expect.js'
import { preprocStr } from './helpers/preproc-str'
import { testStr } from './helpers/test-str'

describe('Compile-time Variables', function () {

  it('can be defined within the code through `#set`', function () {
    testStr([
      '//#set _TRUE 1',
      '//#if _TRUE',
      'OK',
      '//#endif',
      '//#set _STR "Yes"',
      '$_STR',
    ], 'OK\nYes')
  })

  it('can be defined within the code with JS expressions', function () {
    testStr([
      '//#set _EXPR = 0',
      '//#if _EXPR',
      'false',
      '//#endif',
      '//#set _EXPR = !_EXPR',
      '//#if _EXPR',
      'OK',
      '//#endif',
      '//#set _EXPR = "foobar".slice(0,3)',
      '//#if _EXPR === "foo"',
      'Yes',
      '//#endif',
    ], 'OK\nYes')
  })

  it('must default to `undefined` if no value is given', function () {
    testStr([
      '//#set _UNDEF',
      '//#if _UNDEF === undefined',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('unexisting vars are replaced with `undefined` during the evaluation', function () {
    testStr([
      '//#ifset _FOO',
      'false',
      '//#endif',
      '//#if _BAR === undefined',
      'OK',
      '//#endif',
    ], 'OK')
  })

  it('`#unset` removes defined variables', function () {
    testStr([
      '//#ifnset _TRUE',
      '"_TRUE unset"',
      '//#endif',
      '//#unset _TRUE',
      '//#ifnset _TRUE',
      'OK',
      '//#endif',
    ], 'OK', { values: { _TRUE: true } })
  })

  it('can be changed anywhere in the code', function () {
    testStr([
      '//#set _FOO true',
      '$_FOO',
      '//#set _FOO "OK"',
      '"$_FOO"',
      '//#unset _FOO',
      '$_FOO',
      '//#set _FOO 1',
      '$_FOO',
    ], 'true\n"OK"\n$_FOO\n1')
  })

  it('must recognize varname with no line-ending', function () {
    testStr('$_TRUE', /^true$/, { values: { _TRUE: true } })
  })

  it('non defined vars in directives can take its value from `global`', function () {
    (global as any)._GLOBAL = true
    testStr('//#set _G=_GLOBAL\n$_G', /true$/)
    delete (global as any)._GLOBAL
  })

  it('must recognize nested properties in objects', function () {
    testStr([
      '//#set _P=_O.p1.p2.p3+1',
      '//#if _P === 2',
      'OK',
      '//#endif',
    ], 'OK', { values: {
      _O: { p1: { p2: { p3: 1 } } },
    } })
  })

  describe('Errors in compile-time variables & evaluation', function () {

    it('incorrect memvar names in `#set` throw "Invalid memvar"', function () {
      expect(function () {
        preprocStr('//#set =_FOO')
      }).to.throwError(/Invalid memvar/)
    })

    it('incorrect memvar names in `#unset` throw "Invalid memvar"', function () {
      expect(function () {
        preprocStr('//#unset FOO')
      }).to.throwError(/Invalid memvar/)
    })

    it('non-existing memvars removed with `#unset` does not throw', function () {
      expect(preprocStr('//#unset _FOO')).to.be('')
    })

    it('syntax errors in expressions throws during the evaluation', function () {
      expect(function () {
        preprocStr('//#set _FOO 1+3)')
      }).to.throwError(/ in expression /)
    })

    it('other runtime errors throws (like accesing props of `undefined`)', function () {
      expect(function () {
        preprocStr('//#set _FOO _FOO.foo.bar')
      }).to.throwError(/undefined/)
    })

  })

})
