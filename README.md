# jscc

[![Build Status][build-image]][build-url]
[![CodeClimate][climate-image]][climate-url]
[![Coverage][coverage-image]][coverage-url]
[![npm][npm-image]][npm-url]
[![License][license-image]][license-url]
[![codecov](https://codecov.io/gh/aMarCruz/jscc/branch/dev/graph/badge.svg)](https://codecov.io/gh/aMarCruz/jscc)

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

jscc v1.0 is a complete rewrite and may have breaking changes for you.

Please see [Changes in This Version](#changes-in-this-version) for more info, the Wiki will be updated in a few days.

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
import jscc from 'jscc';

const result = jscc(sourceCode, options)
```

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


## Changes in This Version

The code base and test of v1.0 was completely rewritten in [TypeScript](typescriptlang.org) 3 with ES6 output, so it has undergone numerous internal and external changes. However, I believe that the public API has been kept stable and will not prevent migration to this version, mainly because its main use is through plugins, which will make it relatively transparent.

These are the main changes, the detail you can see in the [CHANGELOG](CHANGELOG.md):

- The minimum supported version is node 6. Since node 5 may work, it was not tested and there's no plans for a downgrade.

- The transpiled code is now in the "dist" folder and has been excluded from all branches, except "master". This code is used to serve both, the CommonJS and ES6 versions. The CommonJS export is index.js, in the root folder, and the ES6 modules in "dist", addressed (in accordance to common practices) by the "main" and "module" properties of package.json.

- The function exported by jscc supports a fourth parameter of type "function" (a _callback_). If you use it, jscc will return `undefined` and it will change to an asynchronous behavior of type NodeJS: In case of success, the callback will receive `null` in the first parameter and the results in the second. If there is an error, it will receive a single parameter with the corresponding `Error` object.

- The short sequence for opening HTML comments (`<!`) has been added to the predefined prefixes.

- Now the output of `NaN` is `null`, for consistency with the output from `JSON.stringify`. This is applied to raw or boxed values like those of the invalid dates.

- `JSON.stringify` does not support infinite numbers and convert them to `null`, so (in an attempt) to preserve a more accurate output of this values on stringified objects, `Infinity` is replaced by `Number.MAX_VALUE` and `-Infinity` by `Number.MIN_VALUE`. However, the output of the replaced values in the code does is the correct.

- For the above reason, `RegExp` instances are converted to strings using its `source` property (note that the flags are lost in the process). The output of replaced values is the same as for the strings so, if you want regenerate a regex, must enclose it in slashes and add the flags by yourself.

- The replacement of values admits more than one object property (example: `$_OBJ.p.p2.p3`). The restriction to the dot notation is still valid.

- The undocumented option `errorHandler` was removed, which makes error control more simpler and secure.


## TODO

This is work in progress, so please update jscc constantly.

Expected:

- [X] ~~Async mode~~ (v1.0.0)
- [ ] Explanatory error messages, with location of the error
- [ ] WebPack plugin
- [ ] Better documentation*
- [ ] Syntax hilighter for some editores? Perhaps you want contribute.

---

\* _For me, write in english is 10x harder than coding JS, so contributions are welcome..._

Don't forget to give me your star!

[![codebeat][codebeat-image]][codebeat-url]
[![Coverity][coverity-image]][coverity-url]
[![DeepScan grade][deepscan-image]][deepscan-url]

[build-image]:    https://img.shields.io/travis/aMarCruz/jscc.svg
[build-url]:      https://travis-ci.org/aMarCruz/jscc
[wbuild-image]:   https://img.shields.io/appveyor/ci/aMarCruz/jscc/master.svg?style=flat-square
[wbuild-url]:     https://ci.appveyor.com/project/aMarCruz/jscc/branch/master
[climate-image]:  https://codeclimate.com/github/aMarCruz/jscc/badges/gpa.svg
[climate-url]:    https://codeclimate.com/github/aMarCruz/jscc
[issues-image]:   https://codeclimate.com/github/aMarCruz/jscc/badges/issue_count.svg
[issues-url]:     https://codeclimate.com/github/aMarCruz/jscc
[deepscan-image]: https://deepscan.io/api/teams/2412/projects/3458/branches/31081/badge/grade.svg
[deepscan-url]:   https://deepscan.io/dashboard#view=project&tid=2412&pid=3458&bid=31081
[codebeat-image]: https://codebeat.co/badges/7e15dc9d-42a8-4ea2-8bae-a21c09490fbe
[codebeat-url]:   https://codebeat.co/projects/github-com-amarcruz-jscc-dev
[coverity-image]: https://scan.coverity.com/projects/10389/badge.svg
[coverity-url]:   https://scan.coverity.com/projects/amarcruz-jscc
[coverage-image]: https://codeclimate.com/github/aMarCruz/jscc/badges/coverage.svg
[coverage-url]:   https://codeclimate.com/github/aMarCruz/jscc/coverage
[npm-image]:      https://img.shields.io/npm/v/jscc.svg
[npm-url]:        https://www.npmjs.com/package/jscc
[license-image]:  https://img.shields.io/npm/l/express.svg
[license-url]:    https://github.com/aMarCruz/jscc/blob/master/LICENSE
