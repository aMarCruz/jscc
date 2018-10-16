//#set _OBJ { prop: 1, nested: { prop2: 2 } }
console.log($_OBJ.prop);          // outputs 1
console.log($_OBJ);               // outputs { "prop": 1, "nested": { "prop2": 2 } }
console.log($_OBJ.foo);           // outputs undefined
console.log($_OBJ.nested);        // outputs { "prop2": 2 }
console.log($_OBJ.nested.prop2);  // outputs 2
