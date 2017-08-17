/**
 * ### Multiline plugin
 *
 * Shows text in node as div with classname jstree-item-text
 */
/*globals jQuery, define, exports, require */
(function (factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define('jstree.unique', ['jquery','jstree'], factory);
    }
    else if(typeof exports === 'object') {
        factory(require('jquery'), require('jstree'));
    }
    else {
        factory(jQuery, jQuery.jstree);
    }
}(function ($, jstree, undefined) {
    "use strict";

    if($.jstree.plugins.multiline) { return; }

    $.jstree.plugins.multiline = function (options, parent) {
        this.redraw_node = function(obj, deep, callback, force_render) {
            obj = parent.redraw_node.apply(this, arguments);
            if(obj) {
                var div = document.createElement('DIV');
                div.className = 'jstree-item-text';
                div.innerHTML = this.get_text(obj);
                // replace text with div
                var textNode = obj.childNodes[2].childNodes[1];
                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    obj.childNodes[2].replaceChild(div, obj.childNodes[2].childNodes[1]);
                }
            }
            return obj;
        };
    };

    // include the multiline plugin by default
    // $.jstree.defaults.plugins.push("multiline");
}));
