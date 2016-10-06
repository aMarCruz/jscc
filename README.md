[![Build Status][build-image]][build-url]
[![Issues Count][issues-image]][issues-url]
[![Coverage][coverage-image]][coverage-url]
[![npm][npm-image]][npm-url]
[![License][license-image]][license-url]

# jscc

Featuring some of the C preprocessor characteristics through special, configurable comments, jscc can be used in any type of files to build multiple versions of your software from the same code base.

With jscc, you have:

* Conditional inclusion/exclusion of code, based on compile-time variables*
* Compile-time variables with all the power of JavaScript expressions
* Replacement of variables inside the source (by value at compile-time)
* Source Map support

\* This feature allows you the conditional declaration of ES6 imports (See the [example](#example)).

jscc is **not** a minifier tool, it only does well that it does...

jscc is derived on [jspreproc](http://amarcruz.github.io/jspreproc), the tiny source file preprocessor in JavaScript, enhanced with Source Map support but without the file importer (rollup and others does this better).

## Install

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

\* jscc has the predefined `_VERSION` varname, in addition to `_FILE`.


## Documentation

You can read in the Wiki about:

- [Options](https://github.com/aMarCruz/jscc/wiki/Options)
- [Basic Syntax](https://github.com/aMarCruz/jscc/wiki/Syntax)
- [Keywords](https://github.com/aMarCruz/jscc/wiki/Keywords)
- [Examples & Tricks](https://github.com/aMarCruz/jscc/wiki/Examples)


## TODO

This is work in progress, so please update jscc constantly, I hope the first stable version does not take too long.

Expected:

- [ ] Explanatory error messages, with location of the error
- [ ] async mode
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
[coverage-image]: https://codeclimate.com/github/aMarCruz/jscc/badges/coverage.svg
[coverage-url]:   https://codeclimate.com/github/aMarCruz/jscc/coverage
[npm-image]:      https://img.shields.io/npm/v/jscc.svg
[npm-url]:        https://www.npmjs.com/package/jscc
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/jscc/blob/master/LICENSE
