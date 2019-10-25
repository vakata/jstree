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

export default InfiniteScroller;