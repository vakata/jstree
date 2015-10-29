// gutter icons plugin for jstree
// for codio
/*globals jQuery, define, exports, require, document */
(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define('jstree.guttericons', ['jquery','jstree'], factory);
    }
    else if(typeof exports === 'object') {
        factory(require('jquery'), require('jstree'));
    }
    else {
        factory(jQuery, jQuery.jstree);
    }
}(function ($, jstree, undefined) {
    "use strict";

    if($.jstree.plugins.guttericons) { return; }

    var gutter = document.createElement('I');
    gutter.setAttribute('unselectable', 'on');
    gutter.className = 'jstree-guttericon';
    gutter.innerHTML = '';
    $.jstree.plugins.guttericons = function (options, parent) {
        this.gutters = {};
        this.bind = function () {
            parent.bind.call(this);
            this.element
                .on('click.jstree', '.jstree-guttericon', $.proxy(function (e) {
                    var id = $(e.currentTarget).closest('.jstree-node').attr('id');
                    var node = this.get_node(id);
                    if (this.gutters[node.id]) {
                        this.gutters[node.id].action();
                    }
                }, this) );
        };
        this.set_node_gutter = function (nodeId, gutterClass, action) {
            var node = this.get_node(nodeId);
            if (this.gutters[node.id] === undefined) {
                this.gutters[node.id] = {};
            }
            this.gutters[node.id].class = gutterClass;
            this.gutters[node.id].action = action;
            this.redraw_node(node);
        };
        this.teardown = function () {
            this.gutters = undefined;
            if (this.settings.guttericons) {
                this.element.find('.jstree-guttericon').remove();
            }
            parent.teardown.call(this);
        };
        this.redraw_node = function(obj, deep, callback) {
            obj = parent.redraw_node.call(this, obj, deep, callback);
            if (obj) {
                var tmp = gutter.cloneNode(true);
                var id = $(obj).closest('.jstree-node').attr('id');
                var node = this.get_node(id);
                if (this.gutters[node.id]) {
                    tmp.className += ' icon ' + this.gutters[node.id].class;
                }

                obj.appendChild(tmp);
                var pos = obj.childNodes.length - 1;
                if (pos > 2) {
                    pos = 2;
                }
                obj.insertBefore(tmp, obj.childNodes[pos]);
            }
            return obj;
        };
    };

    // include the guttericons plugin by default
    // $.jstree.defaults.plugins.push("guttericons");
}));