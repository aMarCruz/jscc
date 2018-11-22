import expect from 'expect.js'
import jscc from '..'   // with this import, we are also testing ESM interop

// common helpers
import { preprocStr } from './helpers/preproc-str'
import { testStr } from './helpers/test-str'

const rawJscc = (code: string, opts?: jscc.Options) => jscc(code, '', opts).code

describe('Options:', function () {

  it('The `.values` option allows you to define custom variables', function () {
    testStr([
      '$_ZERO',
      '$_MYBOOL',
      '$_MYSTRING',
      '$_NULL',
      '$_UNDEF',
      '$_NOT_DEFINED',
    ], [
      '0',
      'false',
      'foo',
      'null',
      'undefined',
      '$_NOT_DEFINED',
    ].join('\n'), {
      values: {
        _ZERO: 0,
        _MYBOOL: false,
        _MYSTRING: 'foo',
        _NULL: null,
        _UNDEF: undefined,
      },
    })
  })

  it('`.keepLines:true` must preserve line-endings (useful w/o sourceMap)', function () {
    const source = [
      '//#set _V1 1',
      '//#set _V2 2',
      '',
      '//#if _V1',
      'one',
      '//#endif',
      '',
    ].join('\n')
    const expected = [
      '',
      '',
      '',
      '',
      'one',
      '',
      '',
    ].join('\n')

    expect(rawJscc(source, { keepLines: true })).to.be(expected)
  })

  it('`.sourceMap:false` must disable sourceMap creation', function () {
    let result = jscc('//#set _A\n$_A')
    expect(result.map).to.be.an('object')

    result = jscc('//#set _A\n$_A', '', { sourceMap: false })
    expect(result.map).to.be(undefined)
  })

  it('`.sourceMap:true` must be `null` if the output has no changes', function () {
    const source = '// set _A\n$_A'
    const result = jscc(source, '', { sourceMap: true })

    expect(result.code).to.be(source)
    expect(result.map).to.be(null)
  })

  it('user provided `.prefixes` must override the predefined ones', function () {
    testStr([
      '//~#if 1',
      '//#if true',
      '//#endif',
      '//~#endif',
    ], '//#if true\n//#endif', {
      prefixes: ['//~'],
    })
  })

  it('`.prefixes` can include regexes in addition to strings', function () {
    testStr([
      '//#if 1',
      '//-#if 2',
      '//  #if 3',
      'true',
      '//  #endif',
      '//-#endif',
      '//#endif',
    ], 'true', {
      prefixes: [/\/\/ */, '//-'],
    })
  })

  it('`.prefixes` strings are sanitized before convert them to regex', function () {
    testStr([
      '[^a]#set _V1 1',
      'b.#set _V2 1',
      '[c]#set _V1 = _V1+_V2',
      'bc#set _V2 = _V1+_V2',
      'b.#set _V1 = _V1 + _V2',
      '@$_V1@',
    ], /@2@$/, {
      prefixes: ['[^a]', 'b.'],
    })
  })

  it('`.prefixes` must accept one only string', function () {
    testStr([
      '//-#if 0',
      'ups',
      '//-#endif',
    ], '', {
      prefixes: '//-',
    })
  })

  it('`.prefixes` must accept one only regex', function () {
    testStr([
      '//-#if 0',
      'ups',
      '//-#endif',
    ], '', {
      prefixes: /\/\/-/,
    })
  })

  describe('Errors in options', function () {

    it('incorrect memvar names in `.values` must throw "Invalid memvar"', function () {
      expect(function () {
        preprocStr('foo()', { values: { FOO: 1 } })
      }).to.throwError(/Invalid memvar/)
    })

    it('non object `.values` must throw "`values` must be a plain object"', function () {
      expect(function () {
        // @ts-ignore intentional error
        preprocStr('foo()', { values: true })
      }).to.throwError(/values must be a plain object/)
    })

    it('`.prefixes` must be a string, regex, or array', function () {
      expect(function () {
        // @ts-ignore intentional error
        preprocStr('foo()', { prefixes: 1 })
      }).to.throwError(/`prefixes` must be a/)
    })

    it('`.prefixes` as array must contain only string or regexes', function () {
      expect(function () {
        // @ts-ignore intentional error
        preprocStr('foo()', { prefixes: ['', /\s/, 1] })
      }).to.throwError(/`prefixes` must be a/)
    })

  })

})
