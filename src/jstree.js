import TreeNode from "model/TreeNode";
import Tree from "model/Tree";
import InfiniteScroller from "render/InfiniteScroller";
import Flat from "render/Flat";

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
        //this._renderer = new InfiniteScroller(
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

export default jsTree;
