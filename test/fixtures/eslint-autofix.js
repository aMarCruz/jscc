// #set _DEBUG = 1           // this is a jscc comment

/* #if _DEBUG                // closing this multiline comment */
    // #if process.env.devmode === 'production'
    // #set _DEBUG 0         // the `=` is optional
    // #else                 anything after `#else` or `#endif` is ignored
/* eslint-disable no-console */
console.log('Debug mode on.');
    // #endif
// #endif _DEBUG             '_DEBUG' is ignored
