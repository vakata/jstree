import jsTree from "../jstree";

jsTree.plugin.checkbox = function (options) {
    const defaults = {
        visible   : false,
        cascade   : { up : true, down : true, indeterminate : true, includeHidden : true, includeDisabled : true },
        selection : true,
        wholeNode : false
    };
    let options = jsTree._extend({}, defaults, options);
    this.on(
        `check uncheck checkAll uncheckAll`,
        () => this.redraw()
    );
    this.addRenderHandler(function (dom, node) {
        // TODO: add icon
    });
    // TODO: all other plugin stuff (cascade, etc)

    // checkboxes (just visual indication - redraw involved nodes or loop and apply minor changes)
    this.check = function(node) {
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
    this.uncheck = function(node) {
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
    this.checkAll = function() {
        for (let node of this.tree) {
            this.setState(node, "checked", true);
            this.setState(node, "indeterminate", false);
        }
        this.trigger("checkAll");
        return this;
    }
    this.uncheckAll = function() {
        for (let node of this.tree) {
            this.setState(node, "checked", false);
            this.setState(node, "indeterminate", false);
        }
        this.trigger("uncheckAll");
        return this;
    }
    this.getChecked = function() {
        return this.tree.find(function (node) {
            return node.data && node.data.state && node.data.state.checked;
        });
    }
    this.getTopChecked = function() {
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
    this.getBottomChecked = function() {
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
    this.getIndeterminate = function() {
        return this.tree.find(function (node) {
            return node.data && node.data.state && node.data.state.indeterminate;
        });
    }
};
