import { testStr } from './helpers/test-str'

describe('Code Replacement', function () {

  it('memvars prefixed by "$" can be used for simple code replacement', function () {
    testStr([
      '//#set _TRUE true',
      '//#set _ONE 1',
      '$_TRUE==$_ONE',
      '//#set _STR = "OK"',
      '"$_STR"',
    ], 'true==1\n"OK"')
  })

  it('the prefix "$" is used to paste jscc varname values', function () {
    testStr('$_TRUE$_TRUE', 'OKOK', { values: { _TRUE: 'OK' } })
  })

  it('Infinity, -Infinity, and RegExp has custom stringify output', function () {
    testStr([
      '//#set _DATE new Date("2018-10-17T00:00:00Z")',
      '//#set _X {INFINITY:Infinity, NEGINFINITY:-Infinity, REGEX:/\\S+/, NAN:NaN}',
      'x = $_X',
      'x = $_X.INFINITY',
      'x = $_X.NEGINFINITY',
      'x = /$_X.REGEX/ig',
      'x = new Date("$_DATE")',
      'x = $_X.NAN',
    ],
    [
      'x = {"INFINITY":1.7976931348623157e+308,"NEGINFINITY":5e-324,"REGEX":"\\\\S+","NAN":null}',
      'x = Infinity',
      'x = -Infinity',
      'x = /\\S+/ig',
      'x = new Date("2018-10-17T00:00:00.000Z")',
      'x = null',
    ].join('\n'))
  })

  it('must replace nested object properties (prop value)', function () {
    testStr('$_O.p1.p2.p3', '1', { values: {
      _O: { p1: { p2: { p3: 1 } } },
    } })
  })

  it('must replace nested object properties (object)', function () {
    testStr('$_O.p1.p2', '{"p3":1}', { values: {
      _O: { p1: { p2: { p3: 1 } } },
    } })
  })

  it('must concatenate nested object properties', function () {
    testStr('$_O1.p1.p2$_O2.p1.p2', 'V1', { values: {
      _O1: { p1: { p2: 'V' } },
      _O2: { p1: { p2: 1 } },
    } })
  })

  it('must replace nested properties of objects in arrays', function () {
    testStr('$_A.0.p1.p2', '1', { values: {
      _A: [{ p1: { p2: 1 } }],
    } })
  })

  it('must replace nested properties of objects in arrays (alt)', function () {
    testStr('$_A.0', '{"p1":{"p2":1}}', { values: {
      _A: [{ p1: { p2: 1 } }],
    } })
  })

})
