/**
 * ### Unique plugin
 *
 * Enforces that no nodes with the same name can coexist as siblings.
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

	if($.jstree.plugins.unique) { return; }

	$.jstree.plugins.unique = function (options, parent) {
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			if(!par || !par.children) { return true; }
			var n = chk === "rename_node" ? pos : obj.text,
				c = [],
				m = this._model.data, i, j;
			for(i = 0, j = par.children.length; i < j; i++) {
				c.push(m[par.children[i]].text);
			}
			switch(chk) {
				case "delete_node":
					return true;
				case "rename_node":
				case "copy_node":
					return ($.inArray(n, c) === -1);
				case "move_node":
					return (obj.parent === par.id || $.inArray(n, c) === -1);
			}
			return true;
		};
	};

	// include the unique plugin by default
	// $.jstree.defaults.plugins.push("unique");
}));
