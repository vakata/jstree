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

export default Flat;