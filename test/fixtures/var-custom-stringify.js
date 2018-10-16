//#set _DATE new Date('2018-10-17T00:00:00Z')
//#set _X = {INFINITY: Infinity, NEGINFINITY: -Infinity, REGEX: /\S+/, DATE: _DATE, NAN: NaN}
x = $_X
x = $_X.INFINITY
x = $_X.NEGINFINITY
x = /$_X.REGEX/ig
x = new Date('$_X.DATE')
x = $_X.NAN
