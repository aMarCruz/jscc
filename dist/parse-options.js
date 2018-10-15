"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const revars_1 = require("./revars");
// These characters have to be escaped.
const R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g;
const defErrorHandler = (message) => {
    throw new Error(message);
};
const getPackageVersion = (version) => {
    if (!version || typeof version != 'string') {
        let path = process.cwd().replace(/\\/g, '/');
        version = '?';
        while (~path.indexOf('/')) {
            const pack = path_1.join(path, 'package.json');
            try {
                version = require(pack).version;
                break;
            }
            catch ( /**/_a) { /**/ }
            path = path.replace(/\/[^/]*$/, '');
        }
    }
    return version;
};
function parseOptions(file, opts) {
    opts = opts || {};
    const errorHandler = typeof opts.errorHandler == 'function'
        ? opts.errorHandler : defErrorHandler;
    const srcValues = opts.values || {};
    const values = {};
    if (typeof srcValues != 'object') {
        throw new Error('jscc values must be a plain object');
    }
    // shallow copy of the values, must be set per file
    Object.keys(srcValues).forEach((v) => {
        if (revars_1.VARNAME.test(v)) {
            values[v] = srcValues[v];
        }
        else {
            throw new Error(`Invalid memvar name: ${v}`);
        }
    });
    // Set _VERSION once, keep any in the options
    values._VERSION = getPackageVersion(srcValues._VERSION),
        // File is readonly and valid only for this instance
        values._FILE = file && path_1.relative(process.cwd(), file).replace(/\\/g, '/') || '';
    // sequence starting a directive
    let prefixes = opts.prefixes || '';
    if (prefixes) {
        const list = Array.isArray(prefixes) ? prefixes : [prefixes];
        prefixes = list.map((prefix) => {
            if (prefix instanceof RegExp) {
                return prefix.source;
            }
            if (typeof prefix == 'string') {
                return prefix.replace(R_ESCAPED, '\\');
            }
            throw new Error('Option `prefixes` must be an array of strings or regexes');
        });
    }
    prefixes = prefixes.length ? prefixes.join('|') : '//|/\\*|<!--';
    return {
        keepLines: !!opts.keepLines,
        mapContent: !!opts.mapContent,
        mapHires: !!opts.mapHires,
        sourceMap: opts.sourceMap !== false,
        errorHandler,
        prefixes,
        values,
    };
}
exports.default = parseOptions;
//# sourceMappingURL=parse-options.js.map