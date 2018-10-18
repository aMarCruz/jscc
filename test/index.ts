'use strict'

import expect from 'expect.js'
import path from 'path'
import fs from 'fs'
import jscc from './jscc'

process.chdir(__dirname)

//#region Helpers ------------------------------------------------------------

function concat (name: string, subdir?: string) {
  let file = path.join(__dirname, subdir || 'expected', name)

  file = file.replace(/\\/g, '/')
  if (!path.extname(file)) {
    file += '.js'
  }
  return file
}

function getExpected (file: string) {
  return fs.readFileSync(concat(file), 'utf8')
}

function preprocStr (code: string, opts?: JsccOptions) {
  const result = jscc(code, '', opts)

  return result && result.code.replace(/[ \t]*$/gm, '')
}

function preprocFile (file: string, opts?: JsccOptions) {
  const inFile = concat(file, 'fixtures')
  const code   = fs.readFileSync(inFile, 'utf8')
  const result = jscc(code, inFile, opts)

  return result && result.code.replace(/[ \t]*$/gm, '')
}

function testFile (file: string, opts?: JsccOptions, save?: boolean) {
  const expected = getExpected(file)
  const result   = preprocFile(file, opts)

  expect(result).to.be.a('string')
  if (save) {
    throw new Error('If mocha is not watching, comment this to save the file.')
    //fs.writeFileSync(concat(file + '_out.js'), result || '')
  }

  expect(result).to.be(expected)
}

function testFileStr (file: string, expected: string | RegExp, opts?: JsccOptions) {
  const result = preprocFile(file, opts)

  if (expected instanceof RegExp) {
    expect(result).to.match(expected)
  } else {
    expect(result).to.contain(expected)
  }
}

function testStr (str: string, expected?: string | RegExp, opts?: JsccOptions) {
  const result = preprocStr(str, opts)

  if (expected instanceof RegExp) {
    expect(result).to.match(expected)
  } else {
    expect(result).to.contain(expected)
  }
}

//#endregion Helpers

//
//  THE SUITES
//  ==========
//

//#region General ------------------------------------------------------------

describe('jscc', function () {

  it('by default uses JavaScript comments to start directives', function () {
    testFileStr('defaults', 'true')
  })

  it('the predefined varname `_FILE` is the relative path of the current file', function () {
    testFile('def-file-var')
  })

  it('user defined `_FILE` is overwritten by the current filename (even if empty)', function () {
    testFile('def-file-var')
  })

  it('`_VERSION` comes from the package.json in the current or upper path', function () {
    const version = require('../package.json').version as string
    testFileStr('def-version-var', '@version ' + version)
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

  it('support conditional comments with the `#if _VAR` syntax', function () {
    testFileStr('if-cc-directive', 'true\n', {
      values: { _TRUE: true },
    })
  })

  it('directives ends at the end of the line or the first unquoted `//`', function () {
    testFileStr('directive-ending', 'true\n')
  })

  it('can handle Windows line-endings', function () {
    const code = [
      '//#set _A 1',
      '//#if _A',
      'true',
      '//#endif',
      '',
    ].join('\r\n')
    expect(preprocStr(code)).to.be('true\r\n')
  })

  it('can handle Mac line-endings', function () {
    const code = [
      '//#set _A 1',
      '//#if _A',
      'true',
      '//#endif',
      '',
    ].join('\r')
    expect(preprocStr(code)).to.be('true\r')
  })

  it('Does not confuse token-like comments', function () {
    const code = [
      '///#set _A 1',
      'false',
      '#set _A',
      'false',
    ].join('\n')
    expect(preprocStr(code)).to.be(code)
  })

})

//#endregion General
//#region Options ------------------------------------------------------------

describe('Options:', function () {

  it('The `.values` option allows you to define custom variables', function () {
    testFile('custom-vars', {
      values: {
        _ZERO: 0,
        _MYBOOL: false,
        _MYSTRING: 'foo',
        _INFINITY: Infinity,
        _NAN: NaN,
        _NULL: null,
        _UNDEF: undefined,
      },
    })
  })

  it('`keepLines:true` must preserve line-endings (useful w/o sourceMap)', function () {
    const types = require('./fixtures/_types.js')
    testFile('htmlparser', { values: { _T: types }, keepLines: true })
  })

  it('`sourceMap:false` must disable sourceMap creation', function () {
    let result = jscc('//#set _A\n$_A')
    expect(result.map).to.be.an('object')

    result = jscc('//#set _A\n$_A', '', { sourceMap: false })
    expect(result.map).to.be(undefined)
  })

  it('`sourceMap:true` must be ignored if the output has no changes', function () {
    const source = '// set _A\n$_A'
    const result = jscc(source, '', { sourceMap: true })

    expect(result.code).to.be(source)
    expect(result.map).to.be(undefined)
  })

  it('user provided `prefixes` must override the predefined ones', function () {
    const str = [
      '//~#if 1',
      '//#if true',
      '//#endif',
      '//~#endif',
    ].join('\n')

    testStr(str, '//#if true', {
      prefixes: ['//~', '||'],
    })
  })

  it('`prefixes` can include regexes in addition to strings', function () {
    const str = [
      '//#if 1',
      '//-#if 2',
      '//  #if 3',
      'true',
      '//  #endif',
      '//-#endif',
      '//#endif',
    ].join('\n')

    testStr(str, /^true\s*$/, {
      prefixes: [/\/\/ */, '//-'],
    })
  })

  it('`prefixes` strings are sanitized before convert them to regex', function () {
    const str = [
      '[^a]#set _V1 1',
      'b.#set _V2 1',
      '[c]#set _V1 = _V1+_V2',
      'bc#set _V2 = _V1+_V2',
      'b.#set _V1 = _V1 + _V2',
      '@$_V1@',
    ].join('\n')

    testStr(str, '@2@', {
      prefixes: ['[^a]', 'b.'],
    })
  })

  it('`prefixes` must accept one only string', function () {
    const str = [
      '//-#if 0',
      'ups',
      '//-#endif',
    ].join('\n')

    testStr(str, /^\s*$/, {
      prefixes: '//-',
    })
  })

  it('`prefixes` must accept one only regex', function () {
    const str = [
      '//-#if 0',
      'ups',
      '//-#endif',
    ].join('\n')

    testStr(str, /^\s*$/, {
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

//#endregion Options
//#region Compile-time Variables ---------------------------------------------

describe('Compile-time Variables', function () {

  it('can be defined within the code by `#set`', function () {
    testFileStr('var-inline-var', 'true\nfoo\n')
  })

  it('can be defined within the code with JS expressions', function () {
    testFileStr('var-inline-expr', 'true\nfoo\n')
  })

  it('must default to `undefined` if no value is given', function () {
    testFileStr('var-default-value', 'true')
  })

  it('unexisting vars are replaced with `undefined` during the evaluation', function () {
    testFileStr('var-eval-not-defined', 'true')
  })

  it('`#unset` removes defined variables', function () {
    testFileStr('var-unset', 'true\n', { values: { _TRUE: true } })
  })

  it('can be changed anywhere in the code', function () {
    testFileStr('var-changes', /^\s*true\s+false\s+\$_FOO\s*$/)
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
    const input = [
      '//#set _P=_O.p1.p2.p3+1',
      '//#if _P === 2',
      'two',
      '//#endif',
    ].join('\n')

    testStr(input, /^two\s*$/, { values: {
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
      }).to.throwError()
    })

    it('other runtime errors throws (like accesing props of `undefined`)', function () {
      expect(function () {
        preprocStr('//#set _FOO _FOO.foo.bar')
      }).to.throwError(/undefined/)
    })

  })

})

//#endregion Compile-time Variables
//#region Code Replacement ---------------------------------------------------

describe('Code Replacement', function () {
  //
  it('memvars prefixed by "$" can be used for simple code replacement', function () {
    testFileStr('var-code-replace', 'true==1\n"foo"')
  })

  it('the prefix "$" is used to paste jscc varname values', function () {
    testFileStr('var-paste', 'truetrue\n', { values: { _TRUE: true } })
  })

  it('Infinity, -Infinity, and RegExp has custom stringify output', function () {
    testFile('var-custom-stringify')
  })

  it('must replace nested object properties', function () {
    testStr('$_O.p1.p2.p3', /^1$/, { values: {
      _O: { p1: { p2: { p3: 1 } } },
    } })
  })

  it('must replace nested object properties (alt)', function () {
    testStr('$_O.p1.p2', '{"p3":1}', { values: {
      _O: { p1: { p2: { p3: 1 } } },
    } })
  })

  it('must concatenate nested object properties', function () {
    testStr('$_O1.p1.p2$_O2.p1.p2', /^V1$/, { values: {
      _O1: { p1: { p2: 'V' } },
      _O2: { p1: { p2: 1 } },
    } })
  })

  it('must replace nested properties of objects in arrays', function () {
    testStr('$_A.0.p1.p2', /^1$/, { values: {
      _A: [{ p1: { p2: 1 } }],
    } })
  })

  it('must replace nested properties of objects in arrays (alt)', function () {
    testStr('$_A.0', '{"p1":{"p2":1}}', { values: {
      _A: [{ p1: { p2: 1 } }],
    } })
  })

})

//#endregion Code Replacement
//#region Conditional Compilation --------------------------------------------

describe('Conditional Compilation', function () {

  it('has the pair `#if`/`#endif` for basic conditional blocks', function () {
    testStr('//#if 1\nOK\n//#endif', /^OK\s*$/)
  })

  it('supports `#elif expression`', function () {
    const source = [
      '//#set _FOO = 2',
      '//#if !_FOO',
      'error',
      '//#elif _FOO===1+1',
      'OK',
      '//#endif',

    ].join('\n')

    testStr(source, 'OK\n')
  })

  it('has support for `#else`', function () {
    const source = [
      '//#set _FOO = false',
      '//#if _FOO',
      'error',
      '//#else',
      'OK',
      '//#endif',

    ].join('\n')

    testStr(source, 'OK\n')
  })

  it('and the `#elif` directive', function () {
    testFileStr('cc-elif', 'true\n')
  })

  it('have `#ifset` for testing variable existence (even undefined values)', function () {
    testFileStr('cc-ifset', 'true\n')
  })

  it('and `#ifnset` for testing not defined variables', function () {
    testFileStr('cc-ifnset', 'true\n')
  })

  it('blocks can be nested', function () {
    testFileStr('cc-nested', '\ntrue\ntrue\ntrue\n')
  })

  it('`#if` inside falsy `#else` must be ignored', function () {
    testFileStr('cc-if-inside-falsy-else', /^true\s*$/)
  })

  it('can hide all the output', function () {
    testStr('//#if false\nfoo()\n//#endif', /^$/)
  })

  it('you can throw an exception with custom message through `#error`', function () {
    expect(function () {
      preprocStr('//#error "boom!"')
    }).to.throwError(/boom!/)
  })

  it('`#else` and `#endif` ignores anything in their line', function () {
    testFileStr('cc-else-endif-extra', 'true')
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
        preprocFile('cc-unclosed')
      }).to.throwError(/Unexpected end of file/)
    })

    it('unbalanced blocks throws, too', function () {
      expect(function () {
        preprocFile('cc-unbalanced')
      }).to.throwError(/Unexpected #/)
    })

    it('`#elif` without its previous `#if` must throw', function () {
      expect(() => {
        preprocStr('#if 1\n//#elif 1\n//#endif')
      }).to.throwError(/Unexpected #elif/)
    })

    it('`#elif` inside `#else` must throw', function () {
      expect(() => {
        preprocFile('cc-elif-inside-else')
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
//#region Non-JS Processing --------------------------------------------------

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

//#endregion Non-JS Processing
//#region Async Operation ----------------------------------------------------

describe('Async Operation', function () {

  it('must be enabled if a callback is received.', function (done) {
    const source = '$_VERSION'

    jscc(source, '', null, (err, result) => {
      if (!err) {
        expect(result).to.be.an('object')
        expect(result).to.ok()
        expect(result!.code).not.to.be(source)
      }
      done(err)
    })
  })

  it('must return an error instead throw exceptions.', function (done) {
    jscc('//#if', '', null, (err, _) => {
      expect(err).to.be.a(Error)
      expect(err!.message).to.contain('Expression expected')
      done()
    })
  })

  it('data object must be undefined when an error is generated.', function (done) {
    jscc('//#if', '', null, (err, result) => {
      expect(err).to.be.a(Error)
      expect(result).to.be(undefined)
      done()
    })
  })


  it('jscc() must return undefined.', function (done) {
    const ret = jscc('$_VERSION', '', null, done)
    expect(ret).to.be(undefined)
  })

})

//#endregion Async Operation
//#region Examples -----------------------------------------------------------

describe('Examples:', function () {

  it('Simple replacement', function () {
    testFile('ex-simple-replacement')
  })

  it('Object and properties', function () {
    testFile('ex-object-properties')
  })

  it('Using _FILE and dates', function () {
    const result = preprocFile('ex-file-and-date')
    expect(result).to.match(/date\.js\s+Date: 20\d{2}-\d{2}-\d{2}\n/)
  })

  it('Hidden blocks (and process.env.*)', function () {
    testFile('ex-hidden-blocks')
  })

  it('Changing prefixes to work with CoffeScript', function () {
    testFileStr('ex-coffee1.coffee', 'debug mode', {
      prefixes: ['# ', '### '],
    })
  })

  it('Workaround to #3: not work with eslint rule: comma-spacing', function () {
    testFile('eslint-autofix', {
      prefixes: [/\/\/ ?/, /\/\* ?/],
    })
  })

})

//#endregion Examples
