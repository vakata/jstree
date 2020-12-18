/**
 * jstree - javascript tree manipulation and visualization
 * @version v4.0.0
 * @link https://www.jstree.com
 * @license MIT
 */
class Flat
{
    _empty(dom) {
        while (dom.firstChild) {
            dom.removeChild(dom.firstChild);
        }
        return dom;
    }
    constructor(container, dataSource) {
        // store and normalize data object
        this.dataSource = dataSource;
        if (!this.dataSource.count) {
            this.dataSource.count = () => 0;
        }
        if (!this.dataSource.create) {
            this.dataSource.create = () => document.createElement("div");
        }
        if (!this.dataSource.wrapper) {
            this.dataSource.wrapper = () => document.createElement("div");
        }

        // store and empty container
        this.container = this._empty(container);

        // add wrapper
        this.wrapper = this.dataSource.wrapper();
        this.wrapper.className += " vakata-scroller-wrapper";
        this.container.appendChild(this.wrapper);

        this.count = 0;

        // render the visible items
        this.render();
    }
    render() {
        this.updateAll(true);
    }

    updateItem(index, dom, onlyDirty = true) {
        this.dataSource.update(index, dom, onlyDirty);
    }
    updateAll(updateNodeList = true) {
        if (updateNodeList) {
            this.count = this.dataSource.count();
            let fragment = document.createDocumentFragment();
            for (let i = 0; i < this.count; i++) {
                let node = this.dataSource.create();
                node.className += " vakata-scroller-item";
                fragment.appendChild(node);
            }
            this._empty(this.wrapper).appendChild(fragment);
        }

        let node = this.wrapper.firstChild;
        for (let i = 0; i < this.count; i++) {
            this.updateItem(i, node, !updateNodeList);
            node = node.nextSibling || this.wrapper.firstChild;
        }
    }
}


class InfiniteScroller
{
    _empty(dom) {
        while (dom.firstChild) {
            dom.removeChild(dom.firstChild);
        }
        return dom;
    }
    _offset(dom) {
        return dom.getBoundingClientRect().top + dom.ownerDocument.defaultView.pageYOffset;
    }
    _scrollParent(dom) {
        while (dom && (dom.tagName || "body").toLowerCase() !== "body") {
            if (dom.className.indexOf("vakata-scroller-parent") !== -1) {
                return dom;
            }
            let styles = getComputedStyle(dom, null);
            if (styles.getPropertyValue("overflow")   === "auto"   ||
                styles.getPropertyValue("overflow")   === "scroll" ||
                styles.getPropertyValue("overflow-y") === "auto"   ||
                styles.getPropertyValue("overflow-y") === "scroll"
            ) {
                return dom;
            }
            dom = dom.parentNode;
        }
        return document.documentElement;
    }
    _debounce(callback, wait) {
        let timeout;
        return () => {
            let args = arguments;
            let func = () => callback.apply(this, args);
            clearTimeout(timeout);
            timeout = setTimeout(func, wait);
        };
    }
    _processScroll() {
        // TODO: optimize for big shifts - move whole block?
        let currScrollPosition  = this.scrollParent.scrollTop - this._state.scroll;
        let currTopNodePosition = this._state.topPosition; //parseInt(this._state.top.style.transform.split("translateY(")[1], 10);
        let topDifference       = currScrollPosition - currTopNodePosition;
        let quater              = (this._state.render * this._state.height) / 4;
        let diff                = Math.floor(Math.abs(topDifference - quater) / this._state.height);
        let moveNodeDown        = () => {
            let cur = this._state.topPosition; // parseInt(this._state.top.style.transform.split("translateY(")[1], 10);
            cur += this._state.render * this._state.height;
            if (cur < this._state.count * this._state.height) {
                this._state.index ++;
                this._state.top.pos = cur;
                //this._state.top.style.transform = "translateY(" + (cur) + "px)";
                this._state.bottom = this._state.top;
                this._state.top = this._state.top.nextSibling || this.wrapper.firstChild;
                this._state.topPosition = this._state.index * this._state.height;
                this._state.bottomPosition = this._state.topPosition + (this._state.render - 1) * this._state.height;
            }
        };
        let moveNodeUp          = () => {
            let cur = this._state.bottomPosition; //parseInt(this._state.bottom.style.transform.split("translateY(")[1], 10);
            cur -= this._state.render * this._state.height;
            if (cur >= 0) {
                this._state.index --;
                this._state.bottom.pos = cur;
                //this._state.bottom.style.transform = "translateY(" + (cur) + "px)";
                this._state.top = this._state.bottom;
                this._state.bottom = this._state.bottom.previousSibling || this.wrapper.lastChild;
                this._state.topPosition = this._state.index * this._state.height;
                this._state.bottomPosition = this._state.topPosition + (this._state.render - 1) * this._state.height;
            }
        };

        if (topDifference > quater) {
            for (let i = 0; i < diff; i++) {
                moveNodeDown();
            }
        }
        if (topDifference < quater) {
            for (let i = 0; i < diff; i++) {
                moveNodeUp();
            }
        }
        let node = this._state.top;
        for (let i = 0; i < this._state.render; i++) {
            node.style.transform = "translateY(" + (node.pos) + "px)";
            node = node.nextSibling || this.wrapper.firstChild;
        }

        // TODO: optimize? maybe update only needed nodes when scroll distance is low?
        this.updateAll();
    }
    _wrapperWidth(reset = false) {
        let max  = 0;
        let node = this.wrapper.firstChild;
        let curr = this.wrapper.width || this.wrapper.offsetWidth;
        if (reset) {
            this.wrapper.style.minWidth = "none";
        }
        do {
            if (node.width && node.width > max) {
                max = node.width;
            }
        } while ((node = node.nextSibling));
        if (reset || curr !== max) {
            this.wrapper.width = max;
            this.wrapper.style.minWidth = max + "px";
        }
    }

    constructor(container, dataSource) {
        // store and normalize data object
        this.dataSource = dataSource;
        if (!this.dataSource.count) {
            this.dataSource.count = () => 0;
        }
        if (!this.dataSource.create) {
            this.dataSource.create = () => document.createElement("div");
        }
        if (!this.dataSource.wrapper) {
            this.dataSource.wrapper = () => document.createElement("div");
        }

        this._state = {
            height  : 0,
            count   : this.dataSource.count(),
            scroll  : 0,
            render  : 0,
            visible : 0,
            index   : 0,
            top     : null,
            bottom  : null
        };

        // store and empty container
        this.container = this._empty(container);

        // add wrapper
        this.wrapper = this.dataSource.wrapper();
        this.wrapper.className += " vakata-scroller-wrapper";
        this.wrapper.style.position = "relative";
        //this.wrapper.style.minHeight = "100%";
        //this.wrapper.style.overflowY = "hidden";
        this.container.appendChild(this.wrapper);

        // get the scroll parent
        this.scrollParent = this._scrollParent(this.wrapper);
        let scrollEventHost = this.scrollParent === document.documentElement ? window : this.scrollParent;

        // render the visible items
        this.render();

        // bind events
        window.addEventListener("resize", this._debounce(this.render, 50));
        scrollEventHost.addEventListener("scroll", () => {
            if (this.scrollID) {
                window.cancelAnimationFrame(this.scrollID);
            }
            this.scrollID = window.requestAnimationFrame(() => this._processScroll());
        });
    }
    render() {
        // calculate node height and adjust wrapper height
        let node = this.dataSource.create();
        node.className += " vakata-scroller-item";
        node.innerHTML  = "&nbsp;";
        this.wrapper.appendChild(node);
        this._state.height = node.offsetHeight;
        this._state.count  = this.dataSource.count();
        this.wrapper.removeChild(node);
        this.wrapper.style.height = (this._state.count * this._state.height) + "px";

        // get the scroll difference between the container and the scroll parent
        this._state.scroll = 0;
        if (this.scrollParent !== this.container) {
            this._state.scroll = this.scrollParent === document.documentElement ?
                this._offset(this.container) :
                this._offset(this.container) - this._offset(this.scrollParent);
        }

        // calculate visible and rendered counts
        this._state.visible = Math.min(window.innerHeight, this.scrollParent.offsetHeight);
        this._state.render  = Math.max(1, Math.ceil(this._state.visible / this._state.height)) * 2; // even number!

        // fill wrapper
        let fragment = document.createDocumentFragment();
        for (let i = 0; i < this._state.render; i++) {
            let node = this.dataSource.create();
            node.className += " vakata-scroller-item";
            node.style.willChange = "transform";
            node.style.position = "absolute";
            node.style.minWidth = "100%";
            node.style.height = this._state.height + "px";
            node.style.transform = "translateY(" + (this._state.height * i) + "px)";
            fragment.appendChild(node);
        }
        this._empty(this.wrapper).appendChild(fragment);

        // save references to the top and bottom nodes
        this._state.top    = this.wrapper.firstChild;
        this._state.topPosition = 0;
        this._state.index  = 0;
        this._state.bottom = this.wrapper.lastChild;
        this._state.bottomPosition = this._state.height * (this._state.render - 1);

        this._processScroll();
        this.updateAll(true);
    }

    updateItem(index, dom, onlyDirty = true) {
        this.dataSource.update(index, dom, onlyDirty);
        // store the width for easy access
        // dom.width = dom.offsetWidth;
    }
    updateAll(updateNodeList = true) {
        let count = this.dataSource.count();
        if (count !== this._state.count) {
            this._state.count = count;
            this.wrapper.style.height = (this._state.count * this._state.height) + "px";
        }
        let node = this._state.top;
        for (let i = this._state.index; i < this._state.index + this._state.render; i++) {
            this.updateItem(i, node, !updateNodeList);
            node = node.nextSibling || this.wrapper.firstChild;
        }
        //this._wrapperWidth(true);
    }
}


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
            for (let key of Object.keys(criteria)) {
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







class jsTree
{
    _extend(out) {
        out = out || {};
        for (let i = 1; i < arguments.length; i++) {
            let obj = arguments[i];
            if (!obj) {
                continue;
            }
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === "object" && obj[key] !== null) {
                        out[key] = this._extend(out[key], obj[key]);
                    } else {
                        out[key] = obj[key];
                    }
                }
            }
        }
        return out;
    }
    constructor(options = {}, dom = null) {
        this.options = this._extend({}, jsTree.defaults, options);
        this.tree = new Tree();
        this.events = {};
        this.handlers = {
            create : [],
            render : []
        };

        // TODO: not loaded & incomplete ("more" link as last child if incomplete)
        // TODO: massload
        // TODO: async loading

        this._nodeList = [];
        this._renderer = null;
        // redraw with no change to visible structure
        this.on(
            `select deselect selectAll deselectAll
             check uncheck checkAll uncheckAll
             enable disable enableAll disableAll
             rename`,
            () => this.redraw()
        );
        // redraw WITH change to visible structure
        this.on(
            `open close openAll closeAll
             hide show hideAll showAll
             empty create delete move copy`,
            () => this.redraw(true)
        );

        if (dom) {
            this.render(dom);
        }
        // TODO: render (or indicate) loading
        if (this.options.data instanceof Function) {
            let tree = this;
            this.options.data(
                null,
                function (data) {
                    tree
                        .empty()
                        .create(data, null);
                },
                function () {}
            );
        } else {
            this
                .empty()
                .create(options.data, null);
        }
    }
    addCreateHandler(func) {
        this.handlers.create.push(func);
    }
    addRenderHandler(func) {
        this.handlers.render.push(func);
    }

    node(node) {
        if (node instanceof TreeNode) {
            return node;
        }
        if (node instanceof HTMLElement) {
            while (!node.classList.contains('jstree-node')) {
                if (!node.parentNode || node.parentNode === window.document) {
                    return null;
                }
                node = node.parentNode;
            }
            return this._nodeList[parseInt(node.getAttribute('data-index'), 10)] || null;
        }
        if (typeof node !== "object" && typeof node !== "function") {
            node = { [this.options.idProperty] : node };
        }
        return this.tree.findFirst(node);
    }
    find(criteria) {
        if (typeof criteria !== "object" && typeof criteria !== "function") {
            criteria = { [this.options.idProperty] : criteria };
        }
        return this.tree.find(criteria);
    }
    * filter(criteria) {
        if (typeof criteria !== "object" && typeof criteria !== "function") {
            criteria = { [this.options.idProperty] : criteria };
        }
        yield * this.tree.filter(criteria);
    }
    * [Symbol.iterator]() {
        yield * this.tree[Symbol.iterator]();
    }

    getState(node, key, defaultValue = null) {
        return !this.node(node).data.state ?
            defaultValue :
            (this.node(node).data.state[key] !== undefined ? this.node(node).data.state[key] : defaultValue);
    }
    setState(node, key, value) {
        node = this.node(node);
        if (!node.data.state) {
            node.data.state = {};
        }
        if (node.data.state[key] !== value) {
            node.data.state[key] = value;
            node._dirty = true;
        }
        return this;
    }

    trigger(event, data = {}) {
        data.event = event;
        data.instance = this;
        if (this.events[event]) {
            this.events[event].forEach(x => x(data));
        }
        if (this.events["*"]) {
            this.events["*"].forEach(x => x(data));
        }
        return this;
    }
    on(event, callback) {
        let events = event.split(" ");
        if (events.length > 1) {
            events.forEach(x => this.on(x, callback));
            return this;
        }
        event = events[0];
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
        return this;
    }
    off(event, callback = null) {
        let events = event.split(" ");
        if (events.length > 1) {
            events.forEach(x => this.off(x, callback));
            return this;
        }
        event = events[0];
        if (this.events[event]) {
            if (callback === null) {
                this.events[event] = [];
            }
            let i = this.events[event].indexOf(callback);
            if (i !== -1) {
                this.events[event].splice(this.events[event].indexOf(callback), 1);
            }
        }
        return this;
    }

    // open / close (changes visible node count (container height))
    open(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.open(x));
            return this;
        }
        node = this.node(node);
        // TODO: if not loaded - load the node and then open again
        // TODO: maybe add a load() method with a callback
        if (node) {
            this.setState(node, "opened", true);
            this.trigger('open', { node : node });
        }
        return this;
    }
    close(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.close(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "opened", false);
            this.trigger('close', { node : node });
        }
        return this;
    }
    openAll() {
        for (let node of this.tree) {
            this.setState(node, "opened", true);
        }
        this.trigger('openAll');
        return this;
    }
    closeAll() {
        for (let node of this.tree) {
            this.setState(node, "opened", false);
        }
        this.trigger('closeAll');
        return this;
    }

    // hide / show (changes visible node count (container height))
    hide(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.hide(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "hidden", true);
            this.trigger('hide', { node : node });
        }
        return this;
    }
    show(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.show(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "hidden", false);
            this.trigger('show', { node : node });
        }
        return this;
    }
    hideAll() {
        for (let node of this.tree) {
            this.setState(node, "hidden", true);
        }
        this.trigger('hideAll');
        return this;
    }
    showAll() {
        for (let node of this.tree) {
            this.setState(node, "hidden", false);
        }
        this.trigger('showAll');
        return this;
    }

    // selection (just visual indication - redraw involved nodes or loop and apply minor changes)
    select(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.select(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "selected", true);
            this.trigger("select", { node : node });
        }
        return this;
    }
    deselect(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.deselect(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "selected", false);
            this.trigger("deselect", { node : node });
        }
        return this;
    }
    selectAll() {
        for (let node of this.tree) {
            this.setState(node, "selected", true);
        }
        this.trigger("selectAll");
        return this;
    }
    deselectAll() {
        for (let node of this.tree) {
            this.setState(node, "selected", false);
        }
        this.trigger("deselectAll");
        return this;
    }
    getSelected() {
        return this.tree.find(function (node) {
            return node.data && node.data.state && node.data.state.selected;
        });
    }

    // checkboxes (just visual indication - redraw involved nodes or loop and apply minor changes)
    check(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.check(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "checked", true);
            this.setState(node, "indeterminate", false);
            // TODO: three state! disabled! hidden!
            this.trigger("check", { node : node });
        }
        return this;
    }
    uncheck(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.uncheck(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "checked", false);
            this.setState(node, "indeterminate", false);
            this.trigger("uncheck", { node : node });
        }
        return this;
    }
    checkAll() {
        for (let node of this.tree) {
            this.setState(node, "checked", true);
            this.setState(node, "indeterminate", false);
        }
        this.trigger("checkAll");
        return this;
    }
    uncheckAll() {
        for (let node of this.tree) {
            this.setState(node, "checked", false);
            this.setState(node, "indeterminate", false);
        }
        this.trigger("uncheckAll");
        return this;
    }
    getChecked() {
        return this.tree.find(function (node) {
            return node.data && node.data.state && node.data.state.checked;
        });
    }
    getTopChecked() {
        let recurse = function * (node) {
            for (let child of node.children) {
                if (node.data.state && node.data.state.checked) {
                    yield child;
                }
                yield * recurse(child);
            }
        };
        return Array.from(recurse(this.root));
    }
    getBottomChecked() {
        let recurse = function * (node) {
            for (let child of node.children) {
                if (node.data.state && node.data.state.checked && !child.children.length) {
                    yield child;
                }
                yield * recurse(child);
            }
        };
        return Array.from(recurse(this.root));
    }
    getIndeterminate() {
        return this.tree.find(function (node) {
            return node.data && node.data.state && node.data.state.indeterminate;
        });
    }

    // enable / disable
    enable(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.enable(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "disabled", false);
            this.trigger("enable", { node : node });
        }
        return this;
    }
    disable(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.disable(x));
            return this;
        }
        node = this.node(node);
        if (node) {
            this.setState(node, "disabled", true);
            this.trigger("disable", { node : node });
        }
        return this;
    }
    enableAll() {
        for (let node of this.tree) {
            this.setState(node, "disabled", false);
        }
        this.trigger("enableAll");
        return this;
    }
    disableAll() {
        for (let node of this.tree) {
            this.setState(node, "disabled", true);
        }
        this.trigger("disableAll");
        return this;
    }

    // TODO: edit (just visual indication - redraw involved nodes or loop and apply minor changes)
    edit(node) {
        // also handle array!
        // a config option? which is the text property of the node? maybe the same for ID? and for children?
        throw new Error("Not defined", node);
    }
    empty() {
        this.tree.empty();
        this.trigger("empty");
        return this;
    }
    parseNode(node, format = null) {
        if (node instanceof TreeNode) {
            return node;
        }
        if (!format) {
            format = this.options.format;
        }
        if (typeof node === "string") {
            let temp = {};
            if (format.data) {
                temp[format.data][format.title] = node;
            } else {
                temp[format.title] = node;
            }
            node = temp;
        }
        if (format.flat) {
            return TreeNode.fromFlatJSON(
                node,
                format.id,
                format.parent,
                format.position,
                format.data
            );
        }
        return TreeNode.fromJSON(
            node,
            format.children,
            format.data
        );
    }
    create(node, parent = null, index = null, format = null) {
        node = this.parseNode(node, format);
        if (parent === null) {
            this.tree.addRoot(node, index);
        } else {
            parent = this.node(parent);
            if (!parent) {
                throw new Error("Invalid parent");
            }
            parent.addChild(node, index);
        }
        node._dirty = true;
        this.trigger('create', { node : node, parent : parent, index : index });
        return this;
    }
    move(node, parent, index = null) {
        throw new Error("Not defined", node, parent, index);
    }
    copy(node, parent, index = null) {
        throw new Error("Not defined", node, parent, index);
    }
    delete(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.enable(x));
            return this;
        }
        node = this.node(node);
        node.remove();
        this.trigger('delete', { node : node });
        return this;
    }

    * visible() {
        let recurse = function * (node) {
            // TODO: sort should be here
            for (let child of node.children) {
                if (!child.data.state || !child.data.state.hidden) {
                    yield child;
                    if (child.data.state && child.data.state.opened) {
                        yield * recurse(child);
                    }
                }
            }
        };
        yield * recurse(this.tree.root);
    }
    redraw(updateNodeList = false) {
        if (this.redrawID) {
            window.cancelAnimationFrame(this.redrawID);
        }
        this.redrawID = window.requestAnimationFrame(() => {
            if (!this._nodeList) {
                updateNodeList = true;
            }
            if (updateNodeList) {
                this._nodeList = Array.from(this.visible());
            }
            if (this._renderer) {
                this._renderer.updateAll(updateNodeList);
            }
        });
    }

    render(target) {
        // events
        let tree = this;
        target.jsTree = tree;
        target.classList.add('jstree');
        target.addEventListener('click', function (e) {
            let target = e.target;
            if (target && target.classList.contains("jstree-closed")) {
                tree.open(target);
            }
            if (target && target.classList.contains("jstree-opened")) {
                tree.close(target);
            }
            if (target && target.classList.contains("jstree-node-icon")) {
                target = target.parentNode;
            }
            if (target && target.classList.contains("jstree-node-text")) {
                e.preventDefault();
                tree.deselectAll();
                tree.select(target);
            }
        });

        // renderer
        this._nodeList = Array.from(this.visible());
        this._renderer = new Flat(
            target,
            {
                create : (function () {
                    let node = document.createElement("div");
                    node.classList.add("jstree-node");
                    this.handlers.create.forEach(v => v.call(this, node));
                    return node;
                }).bind(this),
                update : (function (index, dom, onlyDirty = true) {
                    let node = this._nodeList[index];
                    if (!node) {
                        dom.style.display = 'none';
                        return;
                    }
                    if (onlyDirty && !node._dirty) {
                        return;
                    }
                    dom.style.display = 'block';
                    let html = "";
                    node.getAncestors().reverse().forEach(function (parent) {
                        if (parent.isLast()) {
                            html += `<i class="jstree-icon">&nbsp;</i>`;
                        } else {
                            html += `<i class="jstree-icon jstree-icon-v">&nbsp;</i>`;
                        }
                    });
                    let clss = 'leaf';
                    if (!this.getState(node, "loaded", true)) {
                        clss = 'closed';
                    } else {
                        if (node.hasChildren()) {
                            clss = this.getState(node, "opened") ? "opened" : "closed";
                        }
                    }
                    if (node.isLast()) {
                        html += `<i class="jstree-icon jstree-icon-v2 jstree-icon-h"><span class="jstree-${clss}">&nbsp;</span></i>`;
                    } else {
                        html += `<i class="jstree-icon jstree-icon-v jstree-icon-h"><span class="jstree-${clss}">&nbsp;</span></i>`;
                    }
                    clss = this.getState(node, "selected", false) ? 'jstree-selected' : '';
                    html += `<a class="jstree-node-text ${clss}" href="#"><i class="jstree-icon jstree-node-icon">&nbsp;</i> ${node.data.text}</a>`;

                    // TODO: do not redraw the whole DIV! update classes and texts
                    // TODO: add "dots" DIVs, prepare a style to render them "invisible" (opacity: 0)
                    dom.setAttribute('data-index', index);
                    dom.innerHTML = html;
                    this.handlers.render.forEach(v => v.call(this, dom, node));
                    node._dirty = false;
                }).bind(this),
                count : () => this._nodeList.length
            }
        );
    }

    static instance (node) {
        if (node instanceof HTMLElement) {
            while (node.jsTree === undefined) {
                if (!node.parentNode || node.parentNode === window.document) {
                    return null;
                }
                node = node.parentNode;
            }
            return node.jsTree;
        }
        return null;
    }
    
    // TODO: types - bind with create node / supply defaults - maybe inside TreeNode?
    // check API

    /*
        OK selected : [],
        OK checked : [],
        indeterminate : [],
        OK opened : [],
        editing : [],
        OK disabled : [],
        OK hidden : []
    */
}
jsTree.defaults = {
    data : (node, done) => done([]), // include fail option in docs
    idProperty : "id",
    massload : false,
    format   : {
        flat       : false,
        id         : "id",
        children   : "children",
        parent     : null,
        position   : null,
        data       : null,
        title      : "text",
        html       : false
    },
    theme : {
        dots     : true,
        icons    : true,
        stripes  : true
    },
    strings : {
        loading : "Loading ...",
        newNode : "New node"
    },
    selection : {
        multiple : true,
        reveal   : true,
    },
    check : () => true,
    error : err => err,
    checkbox : {
        visible   : false,
        cascade   : { up : true, down : true, indeterminate : true, includeHidden : true, includeDisabled : true },
        selection : true,
        wholeNode : false
    },
    dragndrop : {
        isDraggable         : () => false,
        dragSelection       : true,
        forceCopy           : false,
        mobileSelectionOnly : true
    },
    search : {
        beforeSearch    : (q, callback) => callback(),
        match           : (q, node) => node.data.text.indexOf(q) !== -1,
        showOnlyMatches : true,
        closeOnClear    : true
    },
    sort : null, // (a, b) => 1/-1/0
    state : {
        key    : "jstree",
        ttl    : 0,
        filter : (state) => state
    },
    types : {
        "*" : { }
    }
};


