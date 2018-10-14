# Changes for jscc

## [Unreleased]

### Changed
- Update devDependencies and minimum node.js version to 6

### v0.3.5 @ 2016-10-23

- Add link to gulp plugin for jscc. Thanks to @gucong3000.
- Add test witj workaround to #3: "not work with eslint rule: comma-spacing" using the `prefixes` option.
- Updated devDependencies.

### v0.3.4 @ 2016-10-23

- Added support for nested object and micro-like abilities (thanks to @bergi9).
- Updated devDependencies.

### v0.3.3 @ 2016-10-23

- Fixes issue with sourceMap generating incorrect output.

### v0.3.2 @ 2016-10-22

- Fixes an issue with losing location in sourceMap after replacing memvars.
- Now JSCC always returns an object, even if there were no changes.
- Updated `devDependencies`.

### v0.3.1 @ 2016-10-14

- Source map includes the source filename (needed by jscc-brunch).
- Removed jscc own source maps from the distribution.
- The CommonJS version is validated by Coverty Scan.

### v0.3.0 @ 2016-10-06

- Initial Release published as v0.3.0 in npm over an old `jscc` tool from Taketoshi Aono.
