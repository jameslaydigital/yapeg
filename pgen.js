const Grammar = require("./Grammar.js");
const {seq, many, branch, literal, regx, rule} = require("./builders.js");

//const grammar = new Grammar({
//
//    sum: [seq(rule("mul"), many(branch(literal("+"), literal("-")), rule("mul"))),
//
//        (seq) => {
//            return {
//                type: "sum",
//                exprs: [seq[0], ...seq[1]],
//            };
//        }],
//
//    mul: [seq(rule("num"), many(branch(literal("*"), literal("/")), rule("num"))), 
//
//        (seq) => {
//            return {
//                type: "mul",
//                exprs: [seq[0], ...seq[1]],
//            };
//        }],
//
//
//    num: [regx(/[0-9]+/),
//
//        (output) => {
//            return {
//                type: "number",
//                value: +output,
//            };
//        }],
//
//});

const grammar = new Grammar({

    doc: [
        seq(rule("row"), many(seq(literal("\n"), rule("row")))),
        (output) => {
            return {
                type: "doc",
                output,
            };
        }
    ],

    row: [
        seq(rule("col"), many(seq(literal(","), rule("col")))), 
        (output) => {
            return {
                type: "row",
                output,
            };
        }
    ],

    col: [
        branch(rule("string"), rule("number")), 
        (output) => {
            return {
                type: "col",
                output,
            };
        }
    ],

    string: [
        regx(/"[^"]*"/),
        (output) => {
            return {
                type: "string",
                value: output,
            };
        }
    ],

    number: [
        regx(/[0-9]+/),
        (output) => {
            return {
                type: "number",
                value: +output,
            };
        }
    ],

});

const csv = `itemname,qty,price
"John's big slide",45,"$250.00"`

console.log(grammar.generate());
console.log(`const parser = new Parser(\`${csv}\`);`);
console.log(`console.log(JSON.stringify(parser.parse(), null, 4));`);

// csv parser
//
// "itemname","qty","price"
// "John Baum's favorite Green Salad, no onions",54,"$10.43"

// doc     -> row ["\n", row]* ""
// row     -> col ["," col]*
// col     -> string | number ;
// string  -> '"' [^'"']* '"' ;
// number  -> [0-9]+

// sum -> mul [ "+" mul ]*  -> {type: 'sum', exprs: [output[0], ...output[1]]} ;
// mul -> num [ "*" num ]*  -> {type: 'mul', exprs: [output[0], ...output[1]]} ;
// num -> [0-9]+            -> {type: 'num', value: output} ;
//MathParser = grammar.generate_parser_class();
//const parser = new MathParser("3+2*2*1");
//console.log(JSON.stringify(parser.parse(), null, 4));
