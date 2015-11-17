/**
 * ### Node Customize plugin
 *
 * Allows to customize nodes when they are drawn.
 */
/*globals jQuery, define, exports, require */
(function (factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define('jstree.node_customize', ['jquery','jstree'], factory);
	}
	else if(typeof exports === 'object') {
		factory(require('jquery'), require('jstree'));
	}
	else {
		factory(jQuery, jQuery.jstree);
	}
}(function ($, jstree, undefined) {
	"use strict";

	if($.jstree.plugins.node_customize) { return; }

	/**
	 * the settings object.
	 * key is the attribute name to select the customizer function from map.
	 * switch is a key => function(el, node) map.
	 * default: function(el, node) will be called if the type could not be mapped
	 * @name $.jstree.defaults.node_customize
	 * @plugin node_customize
	 */
	$.jstree.defaults.node_customize = {
		"key": "type",
		"switch": {},
		"default": null
	};

	$.jstree.plugins.node_customize = function (options, parent) {
		this.redraw_node = function (obj, deep, callback, force_draw) {
			var node_id = obj;
			var el = parent.redraw_node.apply(this, arguments);
			if (el) {
				var node = this._model.data[node_id];
				var cfg = this.settings.node_customize;
				var key = cfg.key;
				var type =  (node && node.original && node.original[key]);
				var customizer = (type && cfg.map[type]) || cfg.default;
				if(customizer)
					customizer(el, node);
			}
			return el;
		};
	}
}));
