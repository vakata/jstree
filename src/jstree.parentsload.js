/**
 * ### Parentsload plugin
 *
 * Change load_node() functionality in jsTree, to possible load not yes downloaded node with all it parent in a single request (only useful with lazy loading).
 * 
 * version 1.0.0 (Alexey Shildyakov - ashl1future@gmail.com)
 * 2015: Compatible with jsTree-3.2.1
 */
/*globals jQuery, define, exports, require, document */
(function (factory) {
        "use strict";
        if (typeof define === 'function' && define.amd) {
                define('jstree.parentsload', ['jquery','jstree'], factory);
        }
        else if(typeof exports === 'object') {
                factory(require('jquery'), require('jstree'));
        }
        else {
                factory(jQuery, jQuery.jstree);
        }
}(function ($, jstree, undefined) {
        "use strict";

        if($.jstree.plugins.parentsload) { return; }

        /**
         * parentsload configuration
         *
         * The configuration syntax is almost the same as for core.data option. You must set parenstload.data the following:
         * 
         * parentsload: {
         *      data: function(){} // this function overwrites core data.data options
         * }
         * 
         * OR
         * 
         * parentsload: {
         *      data: {
         *              url: function(node){} OR string,
         *              data: function(node){} OR associative array as json{data} jQuery parameter
         *      }
         * }
         * 
         * In last case at least on of 'url' or 'data' must be presented.
         * 
         * At first, the plugin load_node() detects if the node already downloaded. If is - uses the core.data settings, if not - uses parentsload.data settings
         * to fetch in one query the specified node and all its parent. The data must be in the first mentioned JSON format with set nested children[].
         * Each node level should consist of all nodes on the level to properly work with the tree in the future. Otherwise, you must manually call load_node 
         * on every parent node to fetch all children nodes on that level.
         * 
         * @name $.jstree.defaults.parentsload
         * @plugin parentsload
         */
        $.jstree.defaults.parentsload = null;
        $.jstree.plugins.parentsload = function (options, parent) {
                this.init = function (el, options) {
                        parent.init.call(this, el, options);
                        this.patch_data()
                };
                this.patch_data = function(){
                        var parentsloadSettings = this.settings.parentsload;
                        var jsTreeDataSettings = this.settings.core.data;
                        var self = this;

                        var callError = function(number, message) {
                                self._data.core.last_error = { 'error' : 'configuration', 'plugin' : 'parentsload', 'id' : 'parentsload_' + number, 'reason' : message, 'data' : JSON.stringify({config: parentsloadSettings}) };
                                self.settings.core.error.call(self, self._data.core.last_error);
                        }

                        if(!parentsloadSettings) {
                                callError('01', 'The configuration must be presented')
                                return
                        }
                        parentsloadSettings = parentsloadSettings.data;

                        var patchSettingsProperty = function (propertyName) {
                                var property = parentsloadSettings[propertyName],
                                    coreProperty = jsTreeDataSettings[propertyName];
                                if (property) {
                                        jsTreeDataSettings[propertyName] = function(node) {
                                                if (this.get_node(node).parentsload_required) {
                                                        if ($.isFunction(property)) {
                                                                return property.call(this, node)
                                                        } else {// (typeof property === 'string')
                                                                return property
                                                        }
                                                } else {
                                                        if ($.isFunction(coreProperty)) {
                                                                return coreProperty.call(this, node)
                                                        } else { // (typeof coreProperty === 'string')
                                                                return coreProperty
                                                        }
                                                }
                                        }
                                } /* else {
                                        use jstree the same data[propertyName] settings
                                }*/
                        }

                        if($.isFunction(parentsloadSettings)) {
                                this.settings.data = parentsloadSettings
                        } else if (typeof parentsloadSettings === 'object') {
                                if (! (parentsloadSettings.url || parentsloadSettings.data)) {
                                        callError('02', 'The "data.url" or "data.data" must be presented in configuration')
                                        return
                                }
                                patchSettingsProperty('url')
                                patchSettingsProperty('data')

                        } else {
                                callError('03', 'The appropriate "data.url" or "data.data" must be presented in configuration')
                        }
                }

                this.load_node = function (obj, callback) {
                        if($.isArray(obj)) {
                                // FIXME: _load_nodes will not load nodes not presented in the tree
                                this._load_nodes(obj.slice(), callback);
                                return true;
                        }
                        var foundObj = this.get_node(obj);
                        if (foundObj) {
                                return parent.load_node.apply(this, arguments)
                        } else {
                                // node hasn't been loaded
                                var id = obj.id? obj.id: obj;
                                this._model.data[id] = {
                                        id : id,
                                        parent : '#',
                                        parents : [],
                                        children : [],
                                        children_d : [],
                                        state : { loaded : false },
                                        li_attr : {},
                                        a_attr : {},
                                        parentsload_required : true,
                                };
                                return parent.load_node.call(this, obj, function(obj, status){
                                        obj.parentsload_required = !status
                                        callback.call(this, obj, status)
                                })
                        }
                }
        };
}));