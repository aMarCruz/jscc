# Changes for jscc

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Major refactorization after two years, using TypeScript v3.

### Added
- Sync test for async operation.
- Async operation.
- Add prefix for `<!` (alt html comment) to the predefined prefixes.
- Support for replacement with more than one object property.

### Changed
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
- The "dist" folder holding the transpilled code is removed from CVS (gitignore)
- (Internal) Remove babel, as the plugin now runs on node.js v6 or later.

## [0.3.5] - 2016-10-23

- Add link to gulp plugin for jscc. Thanks to [@gucong3000](https://github.com/gucong3000).
- Add test witj workaround to #3: "not work with eslint rule: comma-spacing" using the `prefixes` option.
- Updated devDependencies.

## [0.3.4] - 2016-10-23

- Added support for nested object and micro-like abilities (thanks to [@bergi9](https://github.com/bergi9)).
- Updated devDependencies.

## [0.3.3] - 2016-10-23

- Fixes issue with sourceMap generating incorrect output.

## [0.3.2] - 2016-10-22

- Fixes an issue with losing location in sourceMap after replacing memvars.
- Now JSCC always returns an object, even if there were no changes.
- Updated `devDependencies`.

## [0.3.1] - 2016-10-14

- Source map includes the source filename (needed by [jscc-brunch](https://www.npmjs.com/package/jscc-brunch)).
- Removed jscc own source maps from the distribution.
- The CommonJS version is validated by [Coverty Scan](https://scan.coverity.com/projects/amarcruz-jscc).

## [0.3.0] - 2016-10-06

- Initial Release published as v0.3.0 in npm over an old `jscc` tool from Taketoshi Aono.
