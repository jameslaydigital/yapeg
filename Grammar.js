module.exports = class Grammar {

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

                ${
                    Object.entries(this.productions)
                        .map(([name, [rule, action]] ) =>
                            this.synthesize_production(name, rule, action))
                        .join("\n")
                }

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

    synthesize_production(name, rule, action=()=>[]) {
        return `
                parse_${name}() {
                    const output = (${this.synthesize(rule)});
                    return (${action})(output);
                }`;
    }

    synthesize_sequence(node) {
        return `
                    (() => {
                        const output = []; ${node.exprs.map(e => `
                        output.push(${this.synthesize(e)});`).join("\n")}
                        return output;
                    })()`;
    }

    synthesize_branch(node) {
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

    synthesize_many(node) {
        return `
                    (() => {
                        const output = [];
                        while (true) {
                            try {
                                output.push(${this.synthesize(node.expr)});
                            } catch(e) {
                                if (e instanceof ParseError) {
                                    break;
                                } else {
                                    throw e;
                                }
                            }
                        }
                        return output;
                    })()
                `;
    }

    synthesize(node) {
        switch (node.type) {
            case "sequence": return this.synthesize_sequence(node);
            case "branch": return this.synthesize_branch(node);
            case "many": return this.synthesize_many(node);
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
