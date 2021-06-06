import jsTree from "../jstree";

if (!jsTree.plugin)
    jsTree.plugin = {}

jsTree.plugin.checkbox = function (options) {
    const defaults = {
        visible   : false,
        cascade   : { up : true, down : true, indeterminate : true, includeHidden : true, includeDisabled : true },
        selection : true,
        wholeNode : false
    };
    options = jsTree._extend({}, defaults, options);
    this.on(
        `check uncheck checkAll uncheckAll`,
        () => this.redraw()
    );
    this.addRenderHandler(function (dom, node) {
        // text (node content including icon)
        const a = document.evaluate("a[contains(@class,'jstree-node-text')]",dom,null,XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue
        // checkbox should/will be in front...
        let checkBoxDomElement = a.previousSibling;
        if (!checkBoxDomElement.classList.contains("jstree-icon-checkbox")) {
            // checkbox element needs to be created...
            checkBoxDomElement = document.createElement("i")

            if (this.getState(node, "checked", false)) 
                checkBoxDomElement.className = "jstree-icon-checkbox jstree-icon-checkbox-checked"
            else if (this.getState(node, "indeterminate", false)) 
                checkBoxDomElement.className = "jstree-icon-checkbox jstree-icon-checkbox-indeterminate"
            else       
                checkBoxDomElement.className = "jstree-icon-checkbox jstree-icon-checkbox-unchecked"

            // ... and added first.
            a.parentElement.insertBefore(checkBoxDomElement,a);            
            
            // register event listner to trigger check change ...
            checkBoxDomElement.addEventListener('click', (e) => {
                if (this.getState(node,"checked",false))
                    this.uncheck(node);
                else
                    this.check(node);
            });
        } else {
            // checkbox state will be set/updated
            if (this.getState(node, "checked", false)) 
                checkBoxDomElement.classList.replace(/jstree-icon-checkbox-.+/,"jstree-icon-checkbox-checked")
            else if (this.getState(node, "indeterminate", false)) 
                checkBoxDomElement.classList.replace(/jstree-icon-checkbox-.+/,"jstree-icon-checkbox-indeterminate")
            else       
                checkBoxDomElement.classList.replace(/jstree-icon-checkbox-.+/,"jstree-icon-checkbox-unchecked")
        }
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
            this.trigger("check", { node : node });
            if (options.cascade.down) {
                if (!this.getState(node, 'loaded', true)) {
                    this.load(node, () => this.check(node));
                } else {
                    this.check(node.children);
                }
            }
            if (options.cascade.up) {
                const traverseUpIndeterminate = (node)=>{                    
                    const parent = node.getParent();
                    if (parent) {
                        const nodeAndSiblings = parent.getChildren();
                        if (nodeAndSiblings.every(s=>this.getState(s,"checked"))) // if 'checked'===true we know that indetermiante must be false
                        {
                            if (!this.getState(parent,"checked"))
                                this.check(parent) // this will tirgger update at parent as well (if required)
                        } else if (
                            options.cascade.indeterminate &&
                            nodeAndSiblings.some(s=>this.getState(s,"checked") || this.getState(s,"indeterminate",false))
                        ) {      
                            if (!this.getState(parent,"indeterminate"))
                            {                           
                                this.setState(parent,"indeterminate",true);
                                // since we don't have a 'undeterminate' setter, we need to traverse this up 'manually'
                                traverseUpIndeterminate(parent);
                            }
                        }
                    }
                }
                traverseUpIndeterminate(node);
            }
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
            if (options.cascade.down) {
                if (!this.getState(node, 'loaded', true)) {
                    this.load(node, () => this.uncheck(node));
                } else {
                    this.uncheck(node.children);
                }
            }
            if (options.cascade.up) {
                const traverseUpIndeterminate = (node)=>{                    
                    const parent = node.getParent();
                    if (parent) {
                        const nodeAndSiblings = parent.getChildren();
                        if (nodeAndSiblings.every(s=>!this.getState(s,"checked") && !this.getState(s,"indeterminate")))
                        {
                            if (this.getState(parent,"checked") || this.getState(parent,"indeterminate"))
                            {
                                this.uncheck(parent) // this will tirgger update at parent as well (if required)
                            }
                        } else if (
                            options.cascade.indeterminate &&
                            nodeAndSiblings.some(s=>this.getState(s,"checked",false) || this.getState(s,"indeterminate",false))
                        ) {
                            if (this.getState(parent,"checked",false))
                            {                                
                                this.setState(parent,"checked",false);
                                this.setState(parent,"indeterminate",true);
                                // since we don't have a 'undeterminate' setter, we need to traverse this up 'manually'
                                // also to avoid infitive update loop...
                                traverseUpIndeterminate(parent);
                            }
                        }
                    }
                }
                traverseUpIndeterminate(node);
            }
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
        // how about 'not yet loaded' nodes in case of 'cascade down'?
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
        // how about 'not yet loaded' nodes in case of 'cascade down'?
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
        // how about 'not yet loaded' nodes in case of 'cascade down'?
        return this.tree.find(function (node) {
            return node.data && node.data.state && node.data.state.indeterminate;
        });
    }
};
