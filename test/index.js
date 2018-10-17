'use strict'

const jscc   = require('../').default
const expect = require('expect')
const path   = require('path')
const fs     = require('fs')

process.chdir(__dirname)

// Helpers ================================================

function has (obj, prop) {
  return !!obj && Object.hasOwnProperty.call(obj, prop)
}

function concat (name, subdir) {
  let file = path.join(__dirname, subdir || 'expected', name)

  file = file.replace(/\\/g, '/')
  if (!path.extname(file)) {
    file += '.js'
  }
  return file
}

function getexpect (file) {
  return fs.readFileSync(concat(file), 'utf8')
}

function preprocStr (code, opts) {
  let result = jscc(code, '', opts)

  if (has(result, 'code')) {
    result = result.code
  }
  return result && result.replace(/[ \t]*$/gm, '')
}

function preprocFile (file, opts) {
  const inFile = concat(file, 'fixtures')
  const code   = fs.readFileSync(inFile, 'utf8')
  let result = jscc(code, inFile, opts)

  if (has(result, 'code')) {
    result = result.code
  }
  return result && result.replace(/[ \t]*$/gm, '')
}

function testFile (file, opts, save) {
  const expected = getexpect(file)
  const result   = preprocFile(file, opts)

  expect(result).toBeA('string')
  if (save) {
    fs.writeFileSync(concat(file + '_out.js'), result || '')
  }

  expect(result).toBe(expected)
}

function testFileStr (file, expected, opts) {
  const result = preprocFile(file, opts)

  if (expected instanceof RegExp) {
    expect(result).toMatch(expected)
  } else {
    expect(result).toContain(expected)
  }
}

function testStr (str, expected, opts) {
  const result = preprocStr(str, opts)

  if (expected instanceof RegExp) {
    expect(result).toMatch(expected)
  } else {
    expect(result).toContain(expected)
  }
}

// The suites =============================================

describe('jscc', function () {

  it('by default uses JavaScript comments to start directives', function () {
    testFileStr('defaults', 'true')
  })

  it('predefined variable `_FILE` is the relative path of the current file', function () {
    testFile('def-file-var')
  })

  it('predefined variable `_VERSION` from package.json in the current path', function () {
    const version = require('../package.json').version
    testFileStr('def-version-var', '@version ' + version)
  })

  it('predefined variable `_VERSION` skip package.json without version', function () {
    const version = require('../package.json').version
    const cwdir = process.cwd()

    process.chdir(path.join(cwdir, 'noversion'))
    const result = preprocStr('$_VERSION')
    process.chdir(cwdir)
    expect(result).toBe(version)
  })

  it('user defined `_VERSION` must not be overwritten', function () {
    testStr('$_VERSION', /^WIP$/, { values: { _VERSION: 'WIP' } })
  })

  it('allows to define custom variables with the `values` option', function () {
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
    expect(preprocStr(code)).toBe('true\r\n')
  })

  it('can handle Mac line-endings', function () {
    const code = [
      '//#set _A 1',
      '//#if _A',
      'true',
      '//#endif',
      '',
    ].join('\r')
    expect(preprocStr(code)).toBe('true\r')
  })

  it('Does not confuse token-like comments', function () {
    const code = [
      '///#set _A 1',
      'false',
      '#set _A',
      'false',
    ].join('\n')
    expect(preprocStr(code)).toBe(code)
  })

})


describe('Compile-time variables', function () {

  it('can be defined within the code by `#set`', function () {
    testFileStr('var-inline-var', 'true\nfoo\n')
  })

  it('can be defined within the code with JS expressions', function () {
    testFileStr('var-inline-expr', 'true\nfoo\n')
  })

  it('defaults to `undefined` if no value is given', function () {
    testFileStr('var-default-value', 'true')
  })

  it('`#unset` removes defined variables', function () {
    testFileStr('var-unset', 'true\n', { values: { _TRUE: true } })
  })

  it('can be changed anywhere in the code', function () {
    testFileStr('var-changes', /^\s*true\s+false\s+\$_FOO\s*$/)
  })

  it('must recognize memvar with no line-ending', function () {
    testStr('$_TRUE', /^true$/, { values: { _TRUE: true } })
  })

  it('non defined vars in directives can take its value from `global`', function () {
    global._GLOBAL = true
    testStr('//#set _G=_GLOBAL\n$_G', /true$/)
    delete global._GLOBAL
  })

  it('not defined vars are replaced with `undefined` during the evaluation', function () {
    testFileStr('var-eval-not-defined', 'true')
  })

  it('incorrect memvar names in `#set` raises "Invalid memvar"', function () {
    expect(function () {
      preprocStr('//#set =_FOO')
    }).toThrow(/Invalid memvar/)
  })

  it('incorrect memvar names in `#unset` raises "Invalid memvar"', function () {
    expect(function () {
      preprocStr('//#unset FOO')
    }).toThrow(/Invalid memvar/)
  })

  it('undefined memvars deleted with `#unset` does not throw', function () {
    expect(preprocStr('//#unset _FOO')).toBe('')
  })

  it('incorrect memvar names in `options` raises "Invalid memvar"', function () {
    expect(function () {
      preprocStr('foo()', { values: { FOO: 1 } })
    }).toThrow(/Invalid memvar/)
  })

  it('non object values in `options` raises "values must be a plain object"', function () {
    expect(function () {
      preprocStr('foo()', { values: true })
    }).toThrow(/values must be a plain object/)
  })

  it('can recognize nested properties in objects', function () {
    const input = [
      '//#set _P=_O.p1.p2.p3+1',
      '$_P',
    ].join('\n')

    testStr(input, /^2$/, { values: {
      _O: { p1: { p2: { p3: 1 } } },
    } })
  })

  it('`options.prefixes` must be a string or array', function () {

    expect(preprocStr('@#set _F=1', { prefixes: ['@'] })).toBe('')
    expect(function () {
      preprocStr('foo()', { prefixes: 1 })
    }).toThrow(/must be an array/)
  })

  it('syntax errors in expressions throws during the evaluation', function () {
    expect(function () {
      preprocStr('//#set _FOO 1+3)')
    }).toThrow()
  })

  it('other runtime errors throws (like accesing props of undefined)', function () {
    expect(function () {
      preprocStr('//#set _FOO _FOO.foo.bar')
    }).toThrow(/undefined/)
  })

})


describe('Code replacement', function () {
  //
  it('memvars prefixed by "$" can be used for simple code replacement', function () {
    testFileStr('var-code-replace', 'true==1\n"foo"')
  })

  it('`$` is used to paste jscc variable values', function () {
    testFileStr('var-paste', 'truetrue\n', { values: { _TRUE: true } })
  })

  it('Infinity, -Infinity, and RegExp has custom stringify output', function () {
    testFile('var-custom-stringify', null, true)
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


describe('Conditional compilation', function () {

  it('supports `#else`', function () {
    testFileStr('cc-else', 'true\n')
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

  it('you can throw an exception with custom message through `#error`', function () {
    expect(function () {
      preprocStr('//#error "boom!"')
    }).toThrow(/boom!/)
  })

  it('unclosed conditional blocks throws an exception', function () {
    expect(function () {
      preprocFile('cc-unclosed')
    }).toThrow(/Unexpected end of file/)
  })

  it('unbalanced blocks throws, too', function () {
    expect(function () {
      preprocFile('cc-unbalanced')
    }).toThrow(/Unexpected #/)
  })

  it('`#elif` inside `#else` must throw', function () {
    let err = ''
    expect(function () {
      preprocFile('cc-elif-inside-else')
    }).toThrow(/Unexpected #elif/)
    preprocFile('cc-elif-inside-else', {
      errorHandler (message) {
        err = message
      },
    })
    expect(err).toContain('Unexpected #elif')
  })

  it('`#else` after `#else` must throw', function () {
    const code = '//#if 1\n//#else\n//#else\n'
    let err = ''
    preprocStr(code, {
      errorHandler (message) {
        err = message
      },
    })
    expect(err).toContain('Unexpected #else')
  })

  it('directive without expression raises "Expression expected"', function () {
    expect(function () {
      preprocStr('//#if\n//#endif')
    }).toThrow(/Expression expected/)
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

})


describe('HTML processing', function () {

  it('can be done including ".html" (whatever) in extensions', function () {
    testFile('html-vars-js.html', {
      extensions: ['html'],
      values: { _TITLE: 'My App' },
    })
  })

  it('can handle html comments ("<!--") by default', function () {
    testFile('html-comments.html', {
      extensions: ['html'],
      prefixes: '<!--',
      values: { _TITLE: 'My App' },
    })
  })

  it('can handle short html comments including "<!" in `prefixes`', function () {
    testFile('html-short-cmts.html', {
      extensions: ['html'],
      prefixes: '<!',
      values: { _TITLE: 'My App' },
    })
  })

})


describe('Options:', function () {

  it('`extensions`="*" (as string) must include all the files', function () {
    const result = preprocFile('html-comments.html', {
      extensions: '*',
    })
    expect(result).toBeA('string')
  })

  it('`include` limit the preprocess to certain paths', function () {
    const result = preprocFile('defaults', {
      include: ['**/fixtures/**'],
    })
    expect(result).toBeA('string')
  })

  it('`keepLines` preserve line-endings (keep line count w/o sourceMaps)', function () {
    const types = require('./fixtures/_types.js')
    testFile('htmlparser', { values: { _T: types }, keepLines: true })
  })

  it('source maps can be disabled with `sourceMap: false`', function () {
    let result = jscc('//#set _A\n$_A')
    expect(result.map).toBeAn('object')

    result = jscc('//#set _A\n$_A', '', { sourceMap: false })
    expect(result.map).toBe(undefined)
  })

  it('`errorHandler` method can be customized', function () {
    let error = ''
    const result = preprocStr('//#endif\nfalse\n//#endif', {
      errorHandler (message) {
        error = message
      },
    })
    expect(result).toBeA('string')
    expect(error).toContain('nexpected')
  })

  it('`prefixes` can include regexes in addition to strings', function () {
    const str = [
      '//#if 1',
      '// #if 2',
      '//  #if 3',
      'true',
      '//  #endif',
      '// #endif',
      '//#endif',
    ].join('\n')

    const result = preprocStr(str, {
      prefixes: [/\/\/ */, '/*'],
    })
    expect(result.trim()).toBe('true')
  })

})


describe('Examples:', function () {

  it('Simple replacement', function () {
    testFile('ex-simple-replacement')
  })

  it('Object and properties', function () {
    testFile('ex-object-properties')
  })

  it('Using _FILE and dates', function () {
    const result = preprocFile('ex-file-and-date')
    expect(result).toMatch(/date\.js\s+Date: 20\d{2}-\d{2}-\d{2}\n/)
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
