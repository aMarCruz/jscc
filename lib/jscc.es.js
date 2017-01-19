import MagicString from 'magic-string';
import { join, relative } from 'path';

/**
 * @module regexlist
 */

// name=value in directives - $1:name, $2:function, $3:value (including any comment)
var VARPAIR = /^\s*(_[0-9A-Z][_0-9A-Z]*)\s*(?:\(\s*([^)]+?)\s*\))?\s*=?(.*)/;

// to verify valid varnames and for #unset
var VARNAME = /^_[0-9A-Z][_0-9A-Z]*$/;

// prefixing varnames inside expression with `this.` or `global.`
var EVLVARS = /(^|[^$\w\.])(_[0-9A-Z][_0-9A-Z]*)\b(?=[^$\w]|$)/g;

// replace varnames inside the code from $_VAR.prop to value
var REPVARS = /(?:(\$_[0-9A-Z][_0-9A-Z]*)(?:\(\s*([^)]+?)\s*\))?([\.\w]+)?)(?=[\W]|$)/g;

// for nested objects inside REPVARS
var PROPVARS = /\.(\w+)/g;

// matches single and double quoted strings, take care about embedded eols
var STRINGS = /"[^"\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^"\n\r\\]*)*"|'[^'\n\r\\]*(?:\\(?:\r\n?|[\S\s])[^'\n\r\\]*)*'/g;

// For replacing of jspreproc variables ($1 = prefix, $2 = varname)
var _REPVARS = RegExp(((STRINGS.source) + "|" + (EVLVARS.source)), 'g');

// For split arguments of macros
var _SPLITARGS = /\s*,\s*/g;

/**
 * Method to perform the evaluation of the received string using
 * a function instantiated dynamically.
 *
 * @param   {object} ctx - Object with the current set of variables
 * @param   {string} str - String to evaluate, can include other defined vars
 * @param   {string} [macro] - Optional as macro
 * @returns {any}          The result.
 */
function evalExpr (ctx, str, macro) {
  var values = ctx.options.values;

  var result;

  if (macro) {

    var args = macro.split(_SPLITARGS);
    // eslint-disable-next-line no-new-func
    result = function (argsToReplace) {
      if (args.length !== argsToReplace.length) {
        throw new Error('Argumentlength mismatch')
      }
      var regex, expr = str;
      for (var i = 0; i < args.length; i++) {
        regex = RegExp(args[i], 'g');
        expr = expr.replace(regex, argsToReplace[i]);
      }
      return expr
    };

  } else {

    // var replacement
    var _repVars = function (m, p, v) {
      return v
        ? p + (v in values ? ("this." + v) : v in global ? ("global." + v) : 'undefined')
        : m
    };

    var expr = str
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(_REPVARS, _repVars);

    try {
      // eslint-disable-next-line no-new-func
      var fn = new Function('', ("return (" + expr + ");"));
      result = fn.call(values);
    } catch (e) {
      result = false;
      ctx._emitError(((e.message) + " in expression \"" + expr + "\""));
    }

  }

  return result
}

/*
    Parser for conditional comments
 */
// branch type
var NONE = 0;
var IF   = 1;
var ELSE = 2;

// status
var WORKING = 0;
var TESTING = 1;
var ENDING  = 2;
var ERROR   = 3;

// These characters have to be escaped.
var R_ESCAPED = /(?=[-[{()*+?.^$|\\])/g;

// Matches a line with a directive, not including line-ending
var S_RE_BASE = /^[ \t\f\v]*(?:@)\s*#(if|ifn?set|el(?:if|se)|endif|set|unset|error)(?:(?=[ \t])(.*)|\/\/.*)?$/.source;

// Match a substring that includes the first unquoted `//`
var R_LASTCMT = new RegExp(((STRINGS.source) + "|(//)"), 'g');


/**
 * Conditional comments parser
 *
 * @param {object} options - The global options
 * @class
 */
function Parser (options) {
  this.options = options;
  this.cc = [{
    state: WORKING,
    block: NONE
  }];
}


Parser.prototype = {
  /**
   * Parses conditional comments to determinate if we need disable the output.
   *
   * @param   {Array} match - Object with the key/value of the directive
   * @returns {boolean}       Output state, `false` to hide the output.
   */
  parse: function parse (match) {         //eslint-disable-line complexity
    var self = this;
    var cc   = self.cc;
    var ccInfo = cc[cc.length - 1];
    var state  = ccInfo.state;

    if (state === ERROR) {
      return false
    }

    var key  = match[1];
    var expr = self._normalize(key, match[2]);

    switch (key) {
      // Conditional blocks -- `#if-ifset-ifnset` pushes the state and `#endif` pop it
      case 'if':
      case 'ifset':
      case 'ifnset':
        if (state !== ENDING) {
          state = self._getValue(key, expr) ? WORKING : TESTING;
        }
        ccInfo = { state: state, block: IF };
        cc.push(ccInfo);
        break

      case 'elif':
        if (_checkBlock(IF)) {
          if (state === TESTING && self._getValue('if', expr)) {
            ccInfo.state = WORKING;
          } else if (state === WORKING) {
            ccInfo.state = ENDING;
          }
        }
        break

      case 'else':
        if (_checkBlock(IF)) {
          ccInfo.block = ELSE;
          ccInfo.state = state === TESTING ? WORKING : ENDING;
        }
        break

      case 'endif':
        if (_checkBlock(IF | ELSE)) {
          cc.pop();
          ccInfo = cc[cc.length - 1];
        }
        break

      default:
        // set-unset-error is processed only for working blocks
        if (state === WORKING) {
          switch (key) {
            case 'set':
              self._set(expr);
              break
            case 'unset':
              self._unset(expr);
              break
            case 'error':
              self._error(expr);
              //_error throws
          }
        }
        break
    }

    return ccInfo.state === WORKING

    // Inner helper - throws if the current block is not of the expected type
    function _checkBlock (mask) {
      var block = ccInfo.block;

      if (block !== NONE && block === (block & mask)) {
        return true
      }
      self._emitError(("Unexpected #" + key));
      return false
    }
  },

  /**
   * Check unclosed blocks before vanish.
   *
   * @returns {boolean} `true` if no error.
   */
  close: function close () {
    var cc  = this.cc;
    var len = cc.length;
    var err = len !== 1 || cc[0].state !== WORKING;

    if (err && cc[0].state !== ERROR) {
      this._emitError('Unexpected end of file');
    }
    this.options = false;
    return !err
  },

  /**
   * Returns the regex to match directives through all the code.
   *
   * @returns {RegExp} Global-multiline regex
   */
  getRegex: function getRegex () {
    var list = this.options.prefixes
                .map(function (s) { return s.replace(R_ESCAPED, '\\'); })
                .join('|');

    return RegExp(S_RE_BASE.replace('@', list), 'gm')
  },

  /**
   * Internal error handler. Set the state to ERROR and calls the
   * method `options.errorHandler`, if any, or throws an error.
   *
   * @param {string} message - Error description
   */
  _emitError: function _emitError (message) {
    var errFn = this.options.errorHandler;

    //message = `jspp [${this.cc.fname || 'input'}] : ${message}`
    this.cc[this.cc.length - 1].state = this.cc[0].state = ERROR;

    if (typeof errFn == 'function') {
      errFn(message);
    } else {
      throw new Error(message)
    }
  },

  /**
   * Retrieve the required expression with the jscc comment removed.
   * It is necessary to skip quoted strings and avoid truncation
   * of expressions like "file:///path"
   *
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Normalized expression.
   */
  _normalize: function _normalize (ckey, expr) {
    // anything after `#else/#endif` is ignored
    if (ckey === 'else' || ckey === 'endif') {
      return ''
    }
    // ...other keywords must have an expression
    if (!expr) {
      this._emitError(("Expression expected for #" + ckey));
    }
    var match;
    R_LASTCMT.lastIndex = 0;
    while ((match = R_LASTCMT.exec(expr))) {
      if (match[1]) {
        expr = expr.slice(0, match.index);
        break
      }
    }
    return expr.trim()
  },

  /**
   * Expression evaluation for `#if-#ifset-#ifnset`.
   * Intercepts the `#ifset-#ifnset` shorthands, call `evalExpr` for `#if` statements.
   * @param   {string} ckey - The key name
   * @param   {string} expr - The extracted expression
   * @returns {string}      Evaluated expression as string.
   */
  _getValue: function _getValue (ckey, expr) {
    if (ckey !== 'if') {
      var yes = expr in this.options.values ? 1 : 0;

      return ckey === 'ifnset' ? yes ^ 1 : yes
    }
    // returns the raw value of the expression
    return evalExpr(this, expr)
  },

  _set: function _set (s) {
    var m = s.match(VARPAIR);
    if (m) {
      var k = m[1];
      var f = m[2] || '';
      var v = m[3] || '';

      this.options.values[k] = v ? evalExpr(this, v.trim(), f.trim()) : undefined;
    } else {
      this._emitError(("Invalid memvar assignment \"" + s + "\""));
    }
  },

  _unset: function _unset (s) {
    var def = s.match(VARNAME);
    if (def) {
      delete this.options.values[s];
    } else {
      this._emitError(("Invalid memvar name \"" + s + "\""));
    }
  },

  _error: function _error (s) {
    s = evalExpr(this, s);
    throw new Error(s)
  }
};

function checkOptions (opts) {
  if (!opts) { opts = {}; }

  var values = opts.values || (opts.values = {});

  if (typeof opts.values != 'object') {
    throw new Error('jscc values must be a plain object')
  }

  // set _VERSION once in the options
  if (values._VERSION == null) {
    var path$$1 = process.cwd().replace(/\\/g, '/');
    var pack, version = '?';

    while (~path$$1.indexOf('/')) {
      pack = join(path$$1, 'package.json');
      try {
        version = require(pack).version;
        break
      } catch (_) {/**/}
      path$$1 = path$$1.replace(/\/[^/]*$/, '');
    }
    values._VERSION = version;
  }

  Object.keys(opts.values).forEach(function (v) {
    if (!VARNAME.test(v)) {
      throw new Error(("Invalid memvar name: " + v))
    }
  });

  // sequence starting a directive
  var prefixes = opts.prefixes;
  if (!prefixes) {
    opts.prefixes = ['//', '/*', '<!--'];
  } else if (typeof prefixes == 'string') {
    opts.prefixes = [prefixes];
  } else if (!Array.isArray(prefixes)) {
    throw new Error('`prefixes` must be an array')
  }

  return opts
}

function parseOptions (file, opts) {

  opts = checkOptions(opts);

  // shallow copy of the values, must be set per file
  var values = {};
  var source = opts.values;

  Object.keys(source).forEach(function (v) { values[v] = source[v]; });

  // file is readonly and valid only for this instance
  Object.defineProperty(values, '_FILE', {
    value: file && relative(process.cwd(), file).replace(/\\/g, '/') || '',
    enumerable: true
  });

  return {
    sourceMap:    opts.sourceMap !== false,
    mapContent:   opts.mapContent,
    mapHires:     opts.mapHires,
    keepLines:    opts.keepLines,
    errorHandler: opts.errorHandler,
    prefixes:     opts.prefixes,
    values: values
  }
}

var _SPLITARGS$1 = /\s*,\s*/g;
var _REPARGS = /\$(_[0-9A-Z][_0-9A-Z]*)/g;

// for matching all vars inside code
function remapVars (magicStr, values, str, start) {
  var re = REPVARS;
  var prop = PROPVARS;
  var mm;
  var mm2;
  var changes = false;

  re.lastIndex = 0;  // `re` is global, so reset

  // $1 = varname including the prefix '$'
  // $2 = arguments
  // $3 = optional point + property name

  while ((mm = re.exec(str))) {
    var v = mm[1].slice(1);
    var length = mm[1].length;
    prop.lastIndex = 0;
    if (v in values) {
      var a   = mm[2];
      var p   = mm[3];
      var idx = start + mm.index;

      v = values[v];

      if (a && typeof v == 'function') {
        var _repArgs = function (m, va) {
          return va in values ? values[va] : m
        };
        var args = a.split(_SPLITARGS$1).map(function (arg) {
          return arg.replace(_REPARGS, _repArgs)
        });

        length += a.length + 2;

        v = v(args);
      }

      while ((mm2 = prop.exec(p))) {
        var p2 = mm2[1];
        if (typeof v == 'object' && p2 && p2 in v) {
          v = v[p2];
          length += p2.length + 1;
        }
      }

      if (typeof v == 'object') {
        v = JSON.stringify(v);
      }

      magicStr.overwrite(idx, idx + length, String(v));
      changes = true;
    }
  }

  return changes
}

/**
 * rollup-plugin-jspp entry point
 * @module
 */
function preproc (code, filename, options) {

  options = parseOptions(filename, options);

  var magicStr  = new MagicString(code);
  var parser    = new Parser(options);

  var re = parser.getRegex();  // $1:keyword, $2:expression

  var changes   = false;
  var output    = true;
  var hideStart = 0;
  var lastIndex = 0;
  var match, index;

  re.lastIndex = 0;

  while ((match = re.exec(code))) {

    index = match.index;

    if (output && lastIndex < index &&
        pushCache(code.slice(lastIndex, index), lastIndex)) {
      changes = true;
    }

    lastIndex = re.lastIndex;

    if (output === parser.parse(match)) {
      if (output) {
        lastIndex = removeBlock(index, lastIndex);
        changes = true;
      }
    } else if (output) {
      // output ends, for now, all we do is to save
      // the pos where the hidden block begins
      hideStart = index;
      output = false;
    } else {
      // output begins, remove the hidden block now
      lastIndex = removeBlock(hideStart, lastIndex);
      output = changes = true;
    }

  }

  if (!parser.close()) {  // let parser to detect unbalanced blocks
    output = false;
  }

  if (output && code.length > lastIndex &&
      pushCache(code.slice(lastIndex), lastIndex)) {
    changes = true;
  }

  // always returns an object
  var result = {
    code: changes ? magicStr.toString() : code
  };

  if (changes && options.sourceMap) {
    result.map = magicStr.generateMap({
      source: filename || null,
      includeContent: options.mapContent !== false,
      hires: options.mapHires !== false
    });
  }

  return result

  // helpers ==============================================

  function pushCache (str, start) {
    var change = str && ~str.indexOf('$_');

    if (change) {
      change = remapVars(magicStr, options.values, str, start);
    }

    return change
  }

  function removeBlock (start, end) {
    var block = '';

    if (options.keepLines) {
      block = code.slice(start, end).replace(/[^\r\n]+/g, '');

    } else if (end < code.length) {
      ++end;
      if (code[end] === '\n' && code[end - 1] === '\r') {
        ++end;
      }
    }

    magicStr.overwrite(start, end, block);
    return end
  }
}

export default preproc;
