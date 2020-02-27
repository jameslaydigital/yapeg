
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
                    if (c === "\n") {
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
                    return this.parse_sum();
                }

                

                parse_sum() {
                    const output = [];
                    output.push(
                    (() => {
                        const output = []; 
                        output.push(this.parse_mul());

                        output.push(
                    (() => {
                        const output = [];
                        while (true) {
                            try {

                                output.push(
                (() => {

                    this.quicksave();
                    try {

                        const result = this.parse_literal("+")
                        this.popsave();
                        return result;

                    } catch(e) {
                        if (e instanceof ParseError) {

                            this.quickload();
                            return this.parse_literal("-")

                        } else {
                            throw e;
                        }
                    }

                })()
                );

                            } catch(e) {
                                if (e instanceof ParseError) {
                                    break;
                                } else {
                                    throw e;
                                }
                            }
                            output.push(this.parse_mul());
                        }
                        return output;
                    })()
                );
                        return output;
                    })());
                    return output;
                }

                


                parse_mul() {
                    const output = [];
                    output.push(
                    (() => {
                        const output = []; 
                        output.push(this.parse_num());

                        output.push(
                    (() => {
                        const output = [];
                        while (true) {
                            try {

                                output.push(
                (() => {

                    this.quicksave();
                    try {

                        const result = this.parse_literal("*")
                        this.popsave();
                        return result;

                    } catch(e) {
                        if (e instanceof ParseError) {

                            this.quickload();
                            return this.parse_literal("/")

                        } else {
                            throw e;
                        }
                    }

                })()
                );

                            } catch(e) {
                                if (e instanceof ParseError) {
                                    break;
                                } else {
                                    throw e;
                                }
                            }
                            output.push(this.parse_num());
                        }
                        return output;
                    })()
                );
                        return output;
                    })());
                    return output;
                }

                


                parse_num() {
                    const output = [];
                    output.push(this.parse_regex_literal(/^[0-9]+/));
                    return output;
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
                            throw new ParseError(`Expected "${literal}" but found "${this.input.slice(this.offset, len)}"`);
                        }
                    }
                    return literal;
                }
            }
        
const parser = new Parser("3+1-2*4");
console.log(JSON.stringify(parser.parse(), null, 4));
