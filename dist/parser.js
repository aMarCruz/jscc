"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
  Parser for conditional comments
*/
const revars_1 = require("./revars");
const evalexpr_1 = require("./evalexpr");
// Matches a line with a directive, not including line-ending
const S_RE_BASE = /^[ \t\f\v]*(?:@)#(if|ifn?set|elif|else|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source;
// Matches a substring that includes the first unquoted `//`
const R_LASTCMT = new RegExp(`${revars_1.STRINGS.source}|(//)`, 'g');
/**
 * Conditional comments parser
 *
 * @param {object} props - The global options
 * @class
 */
class Parser {
    constructor(options) {
        this.options = options;
        this.cc = [{
                state: 0 /* WORKING */,
                block: 0 /* NONE */,
            }];
    }
    /**
     * Parses conditional comments to determinate if we need disable the output.
     *
     * @param   {Array} match - Object with the key/value of the directive
     * @returns {boolean}       Output state, `false` to hide the output.
     */
    parse(match) {
        const cc = this.cc;
        let ccInfo = cc[cc.length - 1];
        let state = ccInfo.state;
        if (state === 3 /* ERROR */) {
            return false;
        }
        const key = match[1];
        const expr = this._normalize(key, match[2]);
        switch (key) {
            // Conditional blocks -- `#if-ifset-ifnset` pushes the state and `#endif` pop it
            case 'if':
            case 'ifset':
            case 'ifnset':
                if (state !== 2 /* ENDING */) {
                    state = this._getValue(key, expr) ? 0 /* WORKING */ : 1 /* TESTING */;
                }
                ccInfo = { state, block: 1 /* IF */ };
                cc.push(ccInfo);
                break;
            case 'elif':
                if (this._checkBlock(ccInfo, 1 /* IF */, key)) {
                    if (state === 1 /* TESTING */ && this._getValue('if', expr)) {
                        ccInfo.state = 0 /* WORKING */;
                    }
                    else if (state === 0 /* WORKING */) {
                        ccInfo.state = 2 /* ENDING */;
                    }
                }
                break;
            case 'else':
                if (this._checkBlock(ccInfo, 1 /* IF */, key)) {
                    ccInfo.block = 2 /* ELSE */;
                    ccInfo.state = state === 1 /* TESTING */ ? 0 /* WORKING */ : 2 /* ENDING */;
                }
                break;
            case 'endif':
                if (this._checkBlock(ccInfo, 1 /* IF */ | 2 /* ELSE */, key)) {
                    cc.pop();
                    ccInfo = cc[cc.length - 1];
                }
                break;
            default:
                // set-unset-error is processed only for working blocks
                if (state === 0 /* WORKING */) {
                    switch (key) {
                        case 'set':
                            this._set(expr);
                            break;
                        case 'unset':
                            this._unset(expr);
                            break;
                        case 'error':
                            this._error(expr);
                    }
                }
                break;
        }
        return ccInfo.state === 0 /* WORKING */;
    }
    // Inner helper - throws if the current block is not of the expected type
    _checkBlock(ccInfo, mask, key) {
        const block = ccInfo.block;
        if (block !== 0 /* NONE */ && block === (block & mask)) {
            return true;
        }
        this._emitError(`Unexpected #${key}`);
        return false;
    }
    /**
     * Check unclosed blocks before vanish.
     *
     * @returns {boolean} `true` if no error.
     */
    close() {
        const cc = this.cc;
        const len = cc.length;
        const err = len !== 1 || cc[0].state !== 0 /* WORKING */;
        if (err && cc[0].state !== 3 /* ERROR */) {
            this._emitError('Unexpected end of file');
        }
        //this.options = undefined
        return !err;
    }
    /**
     * Returns a regex that matches directives through all the code.
     *
     * @returns {RegExp} Global-multiline regex
     */
    getRegex() {
        return RegExp(S_RE_BASE.replace('@', this.options.prefixes), 'gm');
    }
    /**
     * Internal error handler. Set the state to ERROR and calls the
     * method `options.errorHandler`, if any, or throws an error.
     *
     * @param {string} message - Error description
     */
    _emitError(message) {
        //message = `jspp [${this.cc.fname || 'input'}] : ${message}`
        this.cc[this.cc.length - 1].state = this.cc[0].state = 3 /* ERROR */;
        this.options.errorHandler(message);
    }
    /**
     * Retrieve the required expression with the jscc comment removed.
     * It is necessary to skip quoted strings and avoid truncation
     * of expressions like "file:///path"
     *
     * @param   {string} ckey - The key name
     * @param   {string} expr - The extracted expression
     * @returns {string}      Normalized expression.
     */
    _normalize(ckey, expr) {
        // anything after `#else/#endif` is ignored
        if (ckey === 'else' || ckey === 'endif') {
            return '';
        }
        // ...other keywords must have an expression
        if (!expr) {
            this._emitError(`Expression expected for #${ckey}`);
        }
        let match;
        R_LASTCMT.lastIndex = 0;
        while ((match = R_LASTCMT.exec(expr))) {
            if (match[1]) {
                expr = expr.slice(0, match.index);
                break;
            }
        }
        return expr.trim();
    }
    /**
     * Expression evaluation for `#if-#ifset-#ifnset`.
     * Intercepts the `#ifset-#ifnset` shorthands, call `evalExpr` for `#if` statements.
     * @param   {string} ckey - The key name
     * @param   {string} expr - The extracted expression
     * @returns {string}      Evaluated expression as string.
     */
    _getValue(ckey, expr) {
        if (ckey !== 'if') {
            const yes = expr in this.options.values ? 1 : 0;
            return ckey === 'ifnset' ? yes ^ 1 : yes;
        }
        // returns the raw value of the expression
        return evalexpr_1.default(this, expr);
    }
    _set(s) {
        const m = s.match(revars_1.VARPAIR);
        if (m) {
            const k = m[1];
            const f = m[2] || '';
            const v = m[3] || '';
            this.options.values[k] = v ? evalexpr_1.default(this, v.trim(), f.trim()) : undefined;
        }
        else {
            this._emitError(`Invalid memvar assignment "${s}"`);
        }
    }
    _unset(s) {
        const def = s.match(revars_1.VARNAME);
        if (def) {
            delete this.options.values[s];
        }
        else {
            this._emitError(`Invalid memvar name "${s}"`);
        }
    }
    _error(s) {
        s = evalexpr_1.default(this, s);
        throw new Error(s);
    }
}
exports.default = Parser;
//# sourceMappingURL=parser.js.map