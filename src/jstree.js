import TreeNode from "./model/TreeNode";
import Tree from "./model/Tree";
import InfiniteScroller from "./render/InfiniteScroller";
import Flat from "./render/Flat";

class jsTree
{
    static _extend (out) {
        out = out || {};
        for (let i = 1; i < arguments.length; i++) {
            let obj = arguments[i];
            if (!obj) {
                continue;
            }
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === "object" && obj[key] !== null) {
                        out[key] = jsTree._extend(out[key], obj[key]);
                    } else {
                        out[key] = obj[key];
                    }
                }
            }
        }
        return out;
    }
    constructor(options = {}, dom = null) {
        this.options = jsTree._extend({}, jsTree.defaults, options);
        this.tree = new Tree();
        this.events = {};
        this.handlers = {
            create : [],
            render : []
        };

        // TODO: aria
        // TODO: incomplete ("more" link as last child if incomplete)

        this._nodeList = [];
        this._renderer = null;
        // redraw with no change to visible structure
        this.on(
            `select deselect selectAll deselectAll
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
        Object.entries(this.options.plugins).forEach(v => jsTree.plugin[v[0]].call(this, v[1] || {}));

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
    load(node, done, fail) {
        if (Array.isArray(node)) {
            node.forEach(x => this.load(x, done, fail));
            return this;
        }
        node = this.node(node);
        if (!this.getState(node, 'loading') &&
            !this.getState(node, 'loaded', true) &&
            this.options.data instanceof Function
        ) {
            let tree = this;
            tree.setState(node, 'loading', true);
            this.options.data(
                node,
                function (data) {
                    tree.setState(node, 'loading', false);
                    tree.setState(node, 'loaded', true);
                    tree.create(data, node);
                    if (done) {
                        done.call(tree);
                    }
                },
                function () {
                    tree.setState(node, 'loading', false);
                    if (fail) {
                        fail.call(tree);
                    }
                }
            );
        }
        return this;
    }
    open(node) {
        if (Array.isArray(node)) {
            node.forEach(x => this.open(x));
            return this;
        }
        node = this.node(node);
        if (!this.getState(node, 'loaded', true)) {
            this.load(node, () => this.open(node));
            return this;
        }
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

        this._nodeList = Array.from(this.visible());
        switch (this.options.renderer) {
            case 'scroller':
                this._renderer = new InfiniteScroller(
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
                break;
            default:
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
                break;
        }
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
}

jsTree.defaults = {
    data : (node, done) => done([]), // include fail option in docs
    renderer : 'flat', // 'scroller'
    plugins : {},
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
    strings : {
        loading : "Loading ...",
        newNode : "New node"
    },
    selection : {
        multiple : true,
        reveal   : true,
    },
    check : () => true,
    error : err => err
};

export default jsTree;
