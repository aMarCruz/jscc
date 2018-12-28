# jscc

[![jscc on npm][npm-badge]][npm-url]
[![License MIT][license-badge]][license-url]
[![Linux Build][travis-badge]][travis-url]
[![Codacy][codacy-badge]][codacy-url]
[![Coverage][codecov-badge]][codecov-url]

Featuring some of the C preprocessor characteristics through special, configurable comments, jscc can be used in any type of files to build multiple versions of your software from the same code base.

With jscc, you have:

- Conditional inclusion/exclusion of blocks, based on compile-time variables*
- Compile-time variables with all the power of JavaScript expressions
- Replacement of variables in the sources, by its value at compile-time
- Sourcemap support, useful for JavaScript sources.
- TypeScript v3 definitions

\* This feature allows you the conditional declaration of ES6 imports (See the [example](#example)).

jscc is derived on [jspreproc](http://amarcruz.github.io/jspreproc), the tiny source file preprocessor in JavaScript, enhanced with sourcemap support but without the file importer nor the removal of comments ([rollup](https://rollupjs.org/guide/en) with [rollup-plugin-cleanup](https://www.npmjs.com/package/rollup-plugin-cleanup) does it better).

jscc works in NodeJS 6 or later, with minimal dependencies and footprint. It was designed to operate on small to medium pieces of code (like most nowadays) and, since the whole process is done in memory, it is _really fast_.

jscc is **not** a minifier tool, but it does well what it does...

## Install

Use the instructions of the plugin for your toolchain:

- [Rollup](https://www.npmjs.com/package/rollup-plugin-jscc)
- [Brunch](https://www.npmjs.com/package/jscc-brunch)
- [Browserify](https://www.npmjs.com/package/jsccify)
- [Gulp](https://www.npmjs.com/package/gulp-jscc)

or install the jscc package from npm if you need direct access to its API:

```sh
npm i jscc -D
```

### Direct Usage

```js
const jscc = require('jscc');

const result = jscc(sourceCode, options);

// or in async mode:
jscc(sourceCode, options, (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log(result.code);
    console.log(result.map);
  }
})
```

The result is a plain JS object with a property `code`, a string with the processed source, and a property `map`, with a raw sourcemap object, if required by the `sourcemap` option (its default is `true`).

If a callback is provided, jscc will operate asynchronously and call the callback with an error object, if any, or `null` in the first parameter and the result in the second.

Please see the Wiki to know the supported [options](https://github.com/aMarCruz/jscc/wiki/Options).

## Directives

jscc works with _directives_ inserted in the text and prefixed with configurable character sequences, that defaults to `'/*'`, `'//'` and `'<!--'`.

This directives allows you set or get compile-time variables, and exclude code blocks based in its value.

Here, I will refer to the names of the compile-time variables as _varnames_, to distinguish them from the JavaScript run-time variables.

To be valid, a `<varname>` must match the regular expression `/^_[0-9A-Z][_0-9A-Z]*$/`.

> That is, it must start with an underscore, followed by a digit or uppercase letter, and then zero or more underscores, digits or uppercase letters. The character `$` has a special use in jscc and is not allowed for varnames.

### `#set <varname> = <value>`

Defines or redefines a `varname`.

The `value` can be a literal value, another varname, or an expression. If you don't specify a value, it is set to `undefined`.

### `#unset <varname>`

Removes the definition of the given `varname`.

Both the definition or removal of a varname take immediate effect.

### `#if <expression>`

Remove the block of code that follows this `#if` if `expression` is _falsy_.

You can nest multiple `#if` blocks.

### `#ifsef <varname>`

Check the existence of a `varname`.

The returned value is `true` if the variable exists, even if its value is `undefined`. Apart from this, the behavior of `#ifset` is the same as `#if`, so references to the latter will imply both.

### `#ifnsef <varname>`

This is the opposite to `#ifset`, it returns `false` if the `varname` does not exists.

### `#elif <expression>`

The behavior of `#elif` is similar to the JS `else if` statement.

The `expression` will be evaluated if the previous `#if` or `#elif` was _falsy_.

You can have zero or more `#elif` directives following one `#if`.

## `#else`

Includes the block that follows if the previous `#if` or `#elif` expressions were _falsy_.

### `#endif`

Closes the current conditional block.

### `#error <expression>`

Generates an exception at compile time with the result of the given character `expression`.

You can learn more about this in the [Wiki](https://github.com/aMarCruz/jscc/wiki).

## Changes in This Version

- Closes #8 : Removel of trailing jscc comment is breaking the expression.
- Removed Codebeat tests.
- More unity tests.

See details in the [Changelog](CHANGELOG.md).

## Known Issues

- If you are using ESM imports with Typescript, you must enable `esModuleInterop` in your tsconfig.json or use `import jscc = require("jscc")`.
- jscc does not work in a browser, but it must work without issues on the back-end.

### ES6 TL

Remember that jscc is language agnostic, the following block may or may not work as you think:

```js
const template = `
//#if _DEBUG
console.log('debug mode is on.')
//#endif
`
fs.writeFile('code.js', template, 'utf8')
```

Directive searching knows nothing about ES6 TL, so the `#if..#endif` within the template will be evaluated at compile-time, just like any other (code.js is written without directives).

## TODO

- [X] ~~Async mode~~ (v1.0.0)
- [ ] Explanatory error messages, with location of the error
- [ ] Different prefixes for different file types
- [ ] Express middleware
- [ ] WebPack plugin
- [ ] Better documentation
- [ ] Syntax hilighter for some editores? Perhaps you want to contribute.

## Support my Work

I'm a full-stack developer with more than 20 year of experience and I try to share most of my work for free and help others, but this takes a significant amount of time, effort and coffee so, if you like my work, please consider...

[<img src="https://amarcruz.github.io/images/kofi_blue.png" height="36" title="Support Me on Ko-fi" />][kofi-url]

Of course, feedback, PRs, and stars are also welcome 🙃

Thanks for your support!

## License

The [MIT](LICENSE) License.

&copy; 2018, Alberto Martínez

[![Windows Build][appveypr-badge]][appveypr-url]
[![CodeClimate][climate-badge]][climate-url]
[![Vulnerabilities][snyk-badge]][snyk-url]
[![Last commit][commits-badge]][commits-url]

<!-- Badges -->
[npm-badge]:      https://img.shields.io/npm/v/jscc.svg
[npm-url]:        https://www.npmjs.com/package/jscc
[license-badge]:  https://img.shields.io/npm/l/jscc.svg?colorB=blue
[license-url]:    https://github.com/aMarCruz/jscc/blob/master/LICENSE
[appveypr-badge]: https://ci.appveyor.com/api/projects/status/hdsef0p6q0oqr127?svg=true
[appveypr-url]:   https://ci.appveyor.com/project/aMarCruz/jscc
[travis-badge]:   https://img.shields.io/travis/aMarCruz/jscc.svg?label=travis
[travis-url]:     https://travis-ci.org/aMarCruz/jscc
[snyk-badge]:     https://snyk.io/test/github/aMarCruz/jscc/badge.svg?targetFile=package.json
[snyk-url]:       https://snyk.io/test/github/aMarCruz/jscc?targetFile=package.json
[codacy-badge]:   https://img.shields.io/codacy/grade/30e8679fcd614227837ad250dd6c4030.svg
[codacy-url]:     https://www.codacy.com/app/aMarCruz/jscc?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=aMarCruz/jscc&amp;utm_campaign=Badge_Grade
[codecov-badge]:  https://img.shields.io/codecov/c/github/aMarCruz/jscc.svg
[codecov-url]:    https://codecov.io/gh/aMarCruz/jscc
[climate-badge]:  https://codeclimate.com/github/aMarCruz/jscc/badges/gpa.svg
[climate-url]:    https://codeclimate.com/github/aMarCruz/jscc
[commits-badge]:  https://img.shields.io/github/last-commit/aMarCruz/jscc.svg
[commits-url]:    https://github.com/aMarCruz/jscc/commits/master
[kofi-url]:       https://ko-fi.com/C0C7LF7I
