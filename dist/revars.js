"use strict";
/*
  regex list
*/
Object.defineProperty(exports, "__esModule", { value: true });
// name=value in directives - $1:name, $2:function, $3:value (including any comment)
exports.VARPAIR = /^\s*(_[0-9A-Z][_0-9A-Z]*)\s*(?:\(\s*([^)]+?)\s*\))?\s*=?(.*)/;
// to verify valid varnames and for #unset
exports.VARNAME = /^_[0-9A-Z][_0-9A-Z]*$/;
// prefixing varnames inside expression with `this.` or `global.`
exports.EVLVARS = /(^|[^$\w.])(_[0-9A-Z][_0-9A-Z]*)\b(?=[^$\w]|$)/g;
// replace varnames inside the code from $_VAR.prop to value
exports.REPVARS = /(?:(\$_[0-9A-Z][_0-9A-Z]*)(?:\(\s*([^)]+?)\s*\))?([.\w]+)?)(?=[\W]|$)/g;
// for nested objects inside REPVARS
exports.PROPVARS = /\.(\w+)/g;
// matches single and double quoted strings, take care about embedded eols
exports.STRINGS = /"[^"\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^"\n\r\\]*)*"|'[^'\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^'\n\r\\]*)*'/g;
//# sourceMappingURL=revars.js.map