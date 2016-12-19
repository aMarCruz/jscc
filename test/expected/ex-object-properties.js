console.log(1);          // outputs 1
console.log({"prop":1,"nested":{"prop2":2}});               // outputs { "prop": 1, "nested": { "prop2": 2 } }
console.log({"prop":1,"nested":{"prop2":2}}.foo);           // outputs undefined ({ "prop": 1, "nested": { "prop2": 2 } }.foo)
console.log({"prop2":2});        // outputs { "prop2": 2 }
console.log(2);  // outputs 2
