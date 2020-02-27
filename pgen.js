class Grammar {
    constructor(productions) {
        this.productions = productions;
        this.first = Object.keys(productions)[0];
    }

    generate_parser_class() {
        return (new Function(this.generate()))();
    }

    generate() {
        return `
            class ParseError extends Error {}
            class Parser {
                constructor(input) {
                    this.input = input;
                    this.offset = 0;
                    this.lineno = 0;
                    this.charno = 1;
                    this.saves = [];
                }

                curr() {
                    if (this.offset < this.input.length) {
                        return this.input[this.offset]
                    } else {
                        return "";
                    }
                }

                next() {
                    const c = this.curr();
                    this.offset++;
                    if (c === "\\n") {
                        this.lineno++;
                        this.charno = 0;
                    }
                    this.charno++;
                    return c;
                }

                quicksave() {
                    this.saves.push({
                        offset: this.offset,
                        lineno: this.lineno,
                        charno: this.charno,
                    });
                }

                popsave() {
                    return this.saves.pop();
                }

                quickload() {
                    const load = this.saves.pop();
                    if (load) {
                        this.offset = load.offset;
                        this.lineno = load.lineno;
                        this.charno = load.charno;
                    } else {
                        throw new Error("Parser could not backtrack: no saves to be loaded.");
                    }
                }

                parse() {
                    return this.parse_${this.first}();
                }

                ${Object.entries(this.productions).map(([prd_name, prd_node]) => `

                parse_${prd_name}() {
                    const output = [];
                    output.push(${this.synthesize(prd_node)});
                    return output;
                }

                `).join("\n")}

                parse_regex_literal(regex) {
                    const result = regex.exec(this.input.slice(this.offset));
                    if (result === null) {
                        throw new Error("Unexpected token");
                    }
                    const output = result.join("");
                    for (let i = 0; i < output.length; i++) {
                        this.next();
                    }
                    return output;
                }

                parse_literal(literal) {
                    const len = literal.length;
                    for (let i = 0; i < literal.length; i++) {
                        if (literal[i] === this.curr(i)) {
                            this.next();
                        } else {
                            throw new ParseError(\`Expected "\${literal}" but found "\${this.input.slice(this.offset, len)}"\`);
                        }
                    }
                    return literal;
                }
            }
        `;
    }

    synthesize(node) {
        switch (node.type) {
            case "sequence": {
                return `
                    (() => {
                        const output = []; ${node.exprs.map(e => `
                        output.push(${this.synthesize(e)});`).join("\n")}
                        return output;
                    })()`;
            }
            case "branch": {
                return `
                (() => {

                    this.quicksave();
                    try {

                        const result = ${this.synthesize(node.left)}
                        this.popsave();
                        return result;

                    } catch(e) {
                        if (e instanceof ParseError) {

                            this.quickload();
                            return ${this.synthesize(node.right)}

                        } else {
                            throw e;
                        }
                    }

                })()
                `;

            }
            case "many": {
                const [first, ...rest] = node.exprs;
                return `
                    (() => {
                        const output = [];
                        while (true) {
                            try {

                                output.push(${this.synthesize(first)});

                            } catch(e) {
                                if (e instanceof ParseError) {
                                    break;
                                } else {
                                    throw e;
                                }
                            }
                            ${rest.map(e => `output.push(${this.synthesize(e)});`).join("\n")}
                        }
                        return output;
                    })()
                `;
            }
            case "literal": {
                return `this.parse_literal(${node.value})`;
            }
            case "regx": {
                return `this.parse_regex_literal(${node.regx})`;
            }
            case "rule": {
                return `this.parse_${node.name}()`;
            }
            default: {
                throw new Error(`No such generator called "${node.type}"`);
            }
        }
    }
}


// grammar builders
function seq(...exprs) {
    return {
        type: "sequence",
        exprs: exprs,
    };
}
function many(...exprs) {
    return {
        type: "many",
        exprs,
    };
}

function branch(first, ...rest) {
    const node = {
        type: "branch",
        left: first,
        right: null,
    };
    if (rest.length > 1) {
        node.right = branch(...rest);
    } else {
        node.right = rest[0];
    }
    return node;
}

function literal(value) {
    return {
        type: "literal",
        value: JSON.stringify(value),
    };
}
function regx(regx) {
    return {
        type: "regx",
        regx: regx.toString().replace(/^[\/]/, "/^"),
    };
}
function rule(name) {
    return {
        type: "rule",
        name,
    };
}


// sum -> mul [ "+" mul ]* ;
// mul -> num [ "*" num ]* ;
// num -> [0-9]+ ;
const grammar = new Grammar({
    sum: seq(rule("mul"), many(branch(literal("+"), literal("-")), rule("mul"))),
    mul: seq(rule("num"), many(branch(literal("*"), literal("/")), rule("num"))),
    num: regx(/[0-9]+/),
});

//console.log(JSON.stringify(grammar.productions, null, 4));
console.log(grammar.generate());
console.log(`const parser = new Parser("3+1-2*4");`);
console.log(`console.log(JSON.stringify(parser.parse(), null, 4));`);
//MathParser = grammar.generate_parser_class();
//const parser = new MathParser("3+2*2*1");
//console.log(JSON.stringify(parser.parse(), null, 4));
