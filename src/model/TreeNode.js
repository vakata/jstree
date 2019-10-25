class TreeNode
{
    constructor(data = {}) {
        this.data = data;
        this.parent = null;
        this.children = [];
    }
    getParent() {
        return this.isRoot() ? null : this.parent;
    }
    hasParent() {
        return !this.isRoot();
    }
    isRoot() {
        return this.parent === null || this.parent.data === TreeNode.getRootSymbol();
    }
    hasChildren() {
        return this.children.length > 0;
    }
    isEmpty() {
        return this.children.length === 0;
    }
    getAncestors() {
        var parents = [];
        var parent = this.getParent();
        while (parent && parent.data !== TreeNode.getRootSymbol()) {
            parents.push(parent);
            parent = parent.getParent();
        }
        return parents;
    }
    getIndex() {
        return this.parent === null ? 0 : this.parent.children.indexOf(this);
    }
    isLast() {
        if (this.parent === null) {
            return true;
        }
        var siblings = this.parent.children;
        return siblings[siblings.length - 1] === this;
    }
    getChildren() {
        return this.children;
    }
    getDescendants() {
        var children = [];
        let recurse = function (node) {
            for (let child of node.children) {
                children.push(child);
                recurse(child);
            }
        };
        recurse(this);
        return children;
    }
    addChild(node, index) {
        if (Array.isArray(node)) {
            node.forEach((x, i) => this.addChild(x, index === undefined ? index : index + i));
            return this;
        }
        if (node.parent) {
            node.parent.children.splice(node.parent.children.indexOf(node), 1);
        }
        node.parent = this;
        if (index === undefined) {
            this.children.push(node);
        }
        else {
            this.children.splice(index, 0, node);
        }
        return this;
    }
    delete() {
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.parent = null;
        return this;
    }
    empty() {
        this.children = [];
    }
    move(parent, index) {
        parent.addChild(this, index);
    }
    copy(parent, index) {
        parent.addChild(TreeNode.fromJSON(this.toJSON("children", "data"), "children", "data"), index);
    }
    // only if data is an object
    get(prop, defaultValue = null) {
        return this.data[prop] || defaultValue;
    }
    // only if data is an object
    set(prop, value) {
        this.data[prop] = value;
        return this;
    }
    data(data) {
        if (data !== undefined) {
            this.data = data;
        }
        return this.data;
    }
    toJSON(childrenProperty = "children", dataProperty = "") {
        if (dataProperty) {
            return {
                [dataProperty] : this.data,
                [childrenProperty] : this.children.map(x => x.toJSON(childrenProperty, dataProperty))
            };
        }
        let nodeData = this.data;
        nodeData[childrenProperty] = this.children.map(x => x.toJSON(childrenProperty, dataProperty));
        return nodeData;
    }
    toFlatJSON(id = "id", idProperty = "id", parentProperty = "parent", positionProperty = "position", dataProperty = "") {
        let result = [];
        let recurse = node => {
            if (dataProperty) {
                result.push({
                    [idProperty] : node.data[id],
                    [parentProperty] : node.parent ? node.parent.data[id] : null,
                    [positionProperty] : node.getIndex(),
                    [dataProperty] : node.data,
                });
            } else {
                let nodeData = node.data;
                nodeData[idProperty] = node.data[id];
                nodeData[parentProperty] = node.parent ? node.parent.data[id] : null;
                nodeData[positionProperty] = node.getIndex();
                result.push(nodeData);
            }
            node.children.forEach(recurse);
        };
        recurse(this);
        return result;
    }
    static fromJSON(data, childrenProperty = "children", dataProperty = "") {
        if (Array.isArray(data)) {
            return data.map(x => TreeNode.fromJSON(x, childrenProperty));
        }
        if (!dataProperty) {
            let nodeData = {};
            let children = [];
            for (let key of Object.keys(data)) {
                if (key !== childrenProperty) {
                    nodeData[key] = data[key];
                } else {
                    children = data[key];
                }
            }
            //let { [childrenProperty] : children, ...nodeData } = data;
            let node = new TreeNode(nodeData);
            if (children) {
                children.forEach(x => node.addChild(TreeNode.fromJSON(x, childrenProperty, dataProperty)));
            }
            return node;
        }
        let node = new TreeNode(data[dataProperty]);
        if (data[childrenProperty]) {
            data[childrenProperty].forEach(x => node.addChild(TreeNode.fromJSON(x, childrenProperty, dataProperty)));
        }
        return node;
    }
    static fromFlatJSON(data, idProperty = "id", parentProperty = "parent", positionProperty = "position", dataProperty = "") {
        var nodes = new Map();
        // build the flat list
        data.forEach(x => {
            nodes[x[idProperty]] = {
                data : dataProperty ? x[dataProperty] : x,
                children : []
            };
        });
        // assign children
        nodes.forEach((k, v) => {
            if (nodes.has(v[parentProperty])) {
                nodes.get(v[parentProperty]).children.push(v);
            }
        });
        // sort children
        if (positionProperty) {
            nodes.forEach((k, v) => {
                v.children.sort(function (a, b) {
                    a = a[positionProperty];
                    b = b[positionProperty];
                    return a === b ? 0 : (a < b ? -1 : 1);
                });
            });
        }
        // leave only roots
        nodes.forEach((k, v) => {
            if (nodes.has(v[parentProperty])) {
                nodes.delete(k);
            }
        });
        return TreeNode.fromJSON(Array.from(nodes.values()), "children", "data");
    }
    static getRootSymbol() {
        if (!TreeNode.root) {
            TreeNode.root = Symbol("Root symbol");
        }
        return TreeNode.root;
    }
    static getRoot() {
        return new TreeNode(TreeNode.getRootSymbol());
    }
}

export default TreeNode;