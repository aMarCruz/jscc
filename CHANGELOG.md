# Changes for jscc

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[1.2.0] - 2018-12-28

### Added

- More tests.
- markdownlint config.
- perf-regexes as dependency, for the `JS_STRINGS` regex.
- skip-regex as dependency to help solving #8

### Changed

- Revised .gitignore
- Update dependencies and devDependencies.
- Update Readme.
- Replace node 10 with the 'node' in travis config.

### Fixed

- Regex in remap-vars being copied by reference.
- #8 removal of trailing comment is breaking expressions.
- tslint errors.

### Removed

- .npmignore, now using package.json 'files' property.
- unused ESLint configuration.

## \[1.1.0] - 2018-11-22

### Added

- Option `escapeQuotes` to escape quotes in the output of strings (not wrapped by JSON output).
- TSLint instead of ESLint, for compatibility with CI services.
- [Codacy](https://api.codacy.com) quality and coverage services.

### Changed

- Convert `export.default` to `module.exports` in internal modules. Since it is a node.js library, it looks right and produces a cleaner code.
- The output of chained properties stops with a primitive value, to avoid some compile-time errors.
- Updated Readme, add "vulnerabilities" badge from [snyk.io](https://snyk.io).
- Regression of the replacement of `NaN` with `null` since the later alters the behavior of the Date ctor.
- Simplify the `parseChunk` function, logic moved to the `parseHelper` class.

### Removed

- ESLint configuration.
- Coverity badge, get the right results with this service is a nightmare.

### Fixed

- Minor issues with linters.

## \[1.0.0] - 2018-10-23

Major refactorization after two years, using TypeScript v3.

### Added

- Support for BOM mark in the source (it is preserved and does not affects the parsing).
- Badges of the different services used to take care of the quality of the code.
- Buy me a Coffee link.
- Support for replacement with instances of `Number`.
- Share .vscode setup for launch, settings, and tasks in CVS.
- .npmignore files, for distribution with minimal stuff.
- Sync test for async operation.
- Async operation.
- ~~Add prefix for `<!` (alt html comment) to the predefined prefixes.~~
- Support for replacement with more than one object property.

### Changed

- Revised Readme (WIP)
- Make readonly the predefined variables `_FILE` and `_VERSION`.
- Integrate Coverity (static analysis), CodeClimate (quality), Codebeat (quiality/analysis) and Codecov (coverage).
- More strict ESLint rules.
- Test modularizated and ready, 100% coverage.
- Rewrite test in TypeScript
- Package "expect", now part of jest, is replaced with [expect.js](https://github.com/Automattic/expect.js).
- Replacement in code accepts more than one object properties, Date and RegExp outputs strings, NaN outputs `null`.
- Rewrite revars, evalExpr and remapVars, remove macro support, new logic for replacements.
- Rewrite parseOptions, modularize some functions.
- Internal modules now have named exports, main module (jscc) has default export
- Configure ESLint to use the TypeScript parser.
- First unoptimized conversion to Typescript.
- Use .eslintrc.js instead .eslintrc.yaml, the JS format is easier to maintain.
- Keep package manager locks as local.
- Use "Keep a Changelog" recommendations for the changelog.
- Update the LICENSE file to MIT (it was incorrect).
- Update devDependencies and minimum node.js version to 6.

### Removed

- The undocumented option `errorHandler` was removed, which makes the logic more simpler and secure.
- The "dist" folder holding the transpilled code is excluded from CVS (slim PRs, simpler CI config)
- (Internal) Remove babel, as the plugin now runs on node.js v6 or later.

## \[0.3.5] - 2016-10-23

- Add link to gulp plugin for jscc. Thanks to [@gucong3000](https://github.com/gucong3000).
- Add test witj workaround to #3: "not work with eslint rule: comma-spacing" using the `prefixes` option.
- Updated devDependencies.

## \[0.3.4] - 2016-10-23

- Added support for nested object and micro-like abilities (thanks to [@bergi9](https://github.com/bergi9)).
- Updated devDependencies.

## \[0.3.3] - 2016-10-23

- Fixes issue with sourceMap generating incorrect output.

## \[0.3.2] - 2016-10-22

- Fixes an issue with losing location in sourceMap after replacing memvars.
- Now JSCC always returns an object, even if there were no changes.
- Updated `devDependencies`.

## \[0.3.1] - 2016-10-14

- Source map includes the source filename (needed by [jscc-brunch](https://www.npmjs.com/package/jscc-brunch)).
- Removed jscc own source maps from the distribution.
- The CommonJS version is validated by [Coverty Scan](https://scan.coverity.com/projects/amarcruz-jscc).

## \[0.3.0] - 2016-10-06

- Initial Release published as v0.3.0 in npm over an old `jscc` tool from Taketoshi Aono.
