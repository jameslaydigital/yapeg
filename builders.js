// grammar builders

class BuilderNode {
    constructor(op) {
        this.label = null;
        for (const [k, v] of Object.entries(op)) {
            this[k] = v;
        }
    }

    label(newlabel) {
        this.label = newlabel;
        return this;
    }
}

module.exports = {

    seq(...exprs) {
        return new BuilderNode({
            type: "sequence",
            exprs: exprs,
        });
    },

    many(expr) {
        return new BuilderNode({
            type: "many",
            expr,
        });
    },

    branch(first, ...rest) {
        const node = new BuilderNode({
            type: "branch",
            left: first,
            right: null,
        });
        if (rest.length > 1) {
            node.right = branch(...rest);
        } else {
            node.right = rest[0];
        }
        return node;
    },

    literal(value) {
        return new BuilderNode({
            type: "literal",
            value: JSON.stringify(value),
        });
    },

    regx(regx) {
        return new BuilderNode({
            type: "regx",
            regx: regx.toString().replace(/^[\/]/, "/^"),
        });
    },

    rule(name) {
        return new BuilderNode({
            type: "rule",
            name,
            label: null,
        });
    },

};
