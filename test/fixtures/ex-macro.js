//#set _JOIN(foo) foo.join('\n')
let arr = ['foo', 'bar'];
console.log($_JOIN(arr));

//#set _INSERT(str) console.log(str);
$_INSERT('inserted by macro')

//#set _FOO 'inserted by macro'
$_INSERT('$_FOO')

// non exist variable
$_INSERT('$_BAR')
