# jscc

[![Build Status][build-image]][build-url]
[![Coverity Scan Build Status][coverity-image]][coverity-url]
[![Coverage][coverage-image]][coverage-url]
[![npm][npm-image]][npm-url]
[![License][license-image]][license-url]

Featuring some of the C preprocessor characteristics through special, configurable comments, jscc can be used in any type of files to build multiple versions of your software from the same code base.

With jscc, you have:

* Conditional inclusion/exclusion of code, based on compile-time variables*
* Compile-time variables with all the power of JavaScript expressions
* Replacement of variables in the source code (by value at compile-time)
* Plugins for
* Source Map support

\* This feature allows you the conditional declaration of ES6 imports (See the [example](#example)).

jscc is derived on [jspreproc](http://amarcruz.github.io/jspreproc), the tiny source file preprocessor in JavaScript, enhanced with Source Map support but without the file importer nor the removal of comments ([rollup](https://rollupjs.org/guide/en) with [rollup-plugin-cleanup](https://www.npmjs.com/package/rollup-plugin-cleanup) does this better).

jscc works in NodeJS 6 or later, with a minimal footprint and without external dependencies. It was designed to operate on small to medium pieces of code (like most nowadays) and, since the whole process is done in memory, it is _really fast_.

jscc is **not** a minifier tool, it only does what it does well...

## IMPORTANT

jscc v1.0 has breaking changes, if you are using a previous version, please read this document before migrating your app.

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

## Usage

```js
import jscc from 'jscc';
import { fs } from 'fs';

const source = fs.readFileSync('myfile.js', 'utf8')
const result = jscc(source)
```

## Example

```js
//#set _DEBUG 1

/*#if _DEBUG
import mylib from 'mylib-debug';
//#else */
import mylib from 'mylib';
//#endif

mylib.log('Starting v$_VERSION...');
```

output:

```js
import mylib from 'mylib-debug';

mylib.log('Starting v1.0.0...');
```

That's it.

\* jscc has a predefined variable `_VERSION`, in addition to `_FILE`.


## API

In this document I will refer to the names of the compile-time variables of jscc as __varnames__, to distinguish them from the JavaScript run-time variables.

To be valid, a `<varname>` must match the regular expression `/^_[0-9A-Z][_0-9A-Z]*$/`.

> That is, it must start with an underscore, followed by a digit or uppercase letter, and then zero or more underscores, digits or uppercase letters. The character `$` has a special use in jscc and is not allowed for varnames.

### __`#set <varname> [=] <value>`__

Defines or redefines a `varname`.

The `value` can be a literal value, another varname, or an expression. If you don't specify a value, it is set to `undefined`.

You can omit the equal sign.

### __`#unset <varname>`__

Removes the given `varname`.

Both the definition or removal of a varname take immediate effect.

### __`#if <expression>`__

Remove the block of code that follows this `#if` if `expression` is _falsy_.

You can nest multiple `#if` blocks.

### __`#ifsef <varname>`__

Check the existence of a `varname`.

The returned value is `true` if the variable exists, even if its value is `undefined`. Out of this the behavior of `#ifset` is the same as `#if` so references to the latter will imply both.

### __`#ifnsef <varname>`__

This is the opposite to `#ifset`, it returns `false` if the `varname` does not exists.

### __`#elif <expression>`__

The behavior of `#elif` is similar to the JS `else if` construction.

The `expression` will be evaluated if the previous `#if` or `#elif` was falsy.

You can have zero or more `#elif` directives following one `#if`.

### __`#endif`__

Closes the previous conditional block.

### __`#error <expression>`__

It evaluates the `expression` of characters and with its result generates an exception at compile time.

You can read in the Wiki about:

- [Options](https://github.com/aMarCruz/jscc/wiki/Options)
- [Basic Syntax](https://github.com/aMarCruz/jscc/wiki/Syntax)
- [Examples & Tricks](https://github.com/aMarCruz/jscc/wiki/Examples)


## TODO

This is work in progress, so please update jscc constantly, I hope the first stable version does not take too long.

Expected:

- [ ] Explanatory error messages, with location of the error
- [ ] Async mode
- [ ] Better documentation*
- [ ] Syntax hilighter for some editores
- [ ] You tell me...

---

\* _For me, write in english is 10x harder than coding JS, so contributions are welcome..._


Don't forget to give me your star!


[build-image]:    https://img.shields.io/travis/aMarCruz/jscc.svg
[build-url]:      https://travis-ci.org/aMarCruz/jscc
[wbuild-image]:   https://img.shields.io/appveyor/ci/aMarCruz/jscc/master.svg?style=flat-square
[wbuild-url]:     https://ci.appveyor.com/project/aMarCruz/jscc/branch/master
[climate-image]:  https://codeclimate.com/github/aMarCruz/jscc/badges/gpa.svg
[climate-url]:    https://codeclimate.com/github/aMarCruz/jscc
[issues-image]:   https://codeclimate.com/github/aMarCruz/jscc/badges/issue_count.svg
[issues-url]:     https://codeclimate.com/github/aMarCruz/jscc
[coverity-image]: https://scan.coverity.com/projects/10389/badge.svg
[coverity-url]:   https://scan.coverity.com/projects/amarcruz-jscc
[coverage-image]: https://codeclimate.com/github/aMarCruz/jscc/badges/coverage.svg
[coverage-url]:   https://codeclimate.com/github/aMarCruz/jscc/coverage
[npm-image]:      https://img.shields.io/npm/v/jscc.svg
[npm-url]:        https://www.npmjs.com/package/jscc
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/jscc/blob/master/LICENSE
