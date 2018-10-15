"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * rollup-plugin-jspp entry point
 * @module
 */
const magic_string_1 = require("magic-string");
const parser_1 = require("./parser");
const parse_options_1 = require("./parse-options");
const remap_vars_1 = require("./remap-vars");
function preproc(code, filename, options) {
    const props = parse_options_1.default(filename, options);
    const magicStr = new magic_string_1.default(code);
    const parser = new parser_1.default(props);
    const re = parser.getRegex(); // $1:keyword, $2:expression
    let changes = false;
    let output = true;
    let hideStart = 0;
    let lastIndex = 0;
    let match, index;
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
        }
        else if (output) {
            // output ends, for now, all we do is to save
            // the pos where the hidden block begins
            hideStart = index;
            output = false;
        }
        else {
            // output begins, remove the hidden block now
            lastIndex = removeBlock(hideStart, lastIndex);
            output = changes = true;
        }
    }
    if (!parser.close()) { // let parser to detect unbalanced blocks
        output = false;
    }
    if (output && code.length > lastIndex &&
        pushCache(code.slice(lastIndex), lastIndex)) {
        changes = true;
    }
    // always returns an object
    const result = {
        code: changes ? magicStr.toString() : code,
    };
    if (changes && props.sourceMap) {
        result.map = magicStr.generateMap({
            source: filename || undefined,
            includeContent: props.mapContent !== false,
            hires: props.mapHires !== false,
        });
    }
    return result;
    // helpers ==============================================
    function pushCache(str, start) {
        let change = Boolean(str && ~str.indexOf('$_'));
        if (change) {
            change = remap_vars_1.default(magicStr, props.values, str, start);
        }
        return change;
    }
    function removeBlock(start, end) {
        let block = '';
        if (props.keepLines) {
            block = code.slice(start, end).replace(/[^\r\n]+/g, '');
        }
        else if (end < code.length) {
            ++end;
            if (code[end] === '\n' && code[end - 1] === '\r') {
                ++end;
            }
        }
        magicStr.overwrite(start, end, block);
        return end;
    }
}
exports.default = preproc;
//# sourceMappingURL=preproc.js.map