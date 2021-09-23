import TreeNode from "./TreeNode";

class Tree
{
    constructor() {
        this.root = TreeNode.getRoot();
    }
    addRoot(node, index) {
        return this.root.addChild(node, index);
    }
    getRoots() {
        return this.root.getChildren();
    }
    isEmpty() {
        return this.root.isEmpty();
    }
    empty() {
        return this.root.empty();
    }
    toJSON(childrenProperty = "children", dataProperty = "") {
        return this.root.toJSON(childrenProperty, dataProperty).children;
    }
    toFlatJSON(id = "id", idProperty = "id", parentProperty = "parent", positionProperty = "position", dataProperty = "") {
        let nodes = this.root.toFlatJSON(id, idProperty, parentProperty, positionProperty, dataProperty);
        delete nodes[0];
        return nodes;
    }
    _normalizeCriteria(criteria) {
        if (typeof criteria === "function") {
            return criteria;
        }
        if (typeof criteria !== "object") {
            criteria = { id : criteria };
        }
        return function (node) {
            for (let key of criteria.keys()) {
                if (node.data[key] !== criteria[key]) {
                    return false;
                }
            }
            return true;
        };
    }
    find(criteria) {
        criteria = this._normalizeCriteria(criteria);
        let matches = [];
        for (let node of this) {
            if (criteria(node)) {
                matches.push(node);
            }
        }
        return matches;
    }
    findFirst(criteria) {
        criteria = this._normalizeCriteria(criteria);
        for (let node of this) {
            if (criteria(node)) {
                return node;
            }
        }
        return null;
    }
    * filter(criteria) {
        criteria = this._normalizeCriteria(criteria);
        for (let node of this) {
            if (criteria(node)) {
                yield node;
            }
        }
    }
    * [Symbol.iterator]() {
        let recurse = function * (node) {
            for (let child of node.children) {
                yield child;
                yield * recurse(child);
            }
        };
        yield * recurse(this.root);
    }
}

export default Tree;