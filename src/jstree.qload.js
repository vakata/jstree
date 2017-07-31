/**
 * ### Qload plugin
 *
 * A plugin to prevent slowing down opening a node, which has large amount of children 
 */
/*globals jQuery, define, exports, require, document */
(function (factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define('jstree.massload', ['jquery','jstree'], factory);
	}
	else if(typeof exports === 'object') {
		factory(require('jquery'), require('jstree'));
	}
	else {
		factory(jQuery, jQuery.jstree);
	}
}(function ($, jstree, undefined) {
	"use strict";

	if($.jstree.plugins.massload) { return; }

	/**
	 * massload configuration
	 *
	 * It is possible to set this to a standard jQuery-like AJAX config.
	 * In addition to the standard jQuery ajax options here you can supply functions for `data` and `url`, the functions will be run in the current instance's scope and a param will be passed indicating which node IDs need to be loaded, the return value of those functions will be used.
	 *
	 * You can also set this to a function, that function will receive the node IDs being loaded as argument and a second param which is a function (callback) which should be called with the result.
	 *
	 * Both the AJAX and the function approach rely on the same return value - an object where the keys are the node IDs, and the value is the children of that node as an array.
	 *
	 *	{
	 *		"id1" : [{ "text" : "Child of ID1", "id" : "c1" }, { "text" : "Another child of ID1", "id" : "c2" }],
	 *		"id2" : [{ "text" : "Child of ID2", "id" : "c3" }]
	 *	}
	 * 
	 * @name $.jstree.defaults.qload
	 * @plugin qload
	 */
	$.jstree.defaults.qload = {
		limit: 50,
		loadText: 'Load More...'
	};
	$.jstree.plugins.qload = function (options, parent) {

		this.draw_children = function(node) {
			parent.draw_children(node, 0, this.settings.qload.limit);
		}
		this.draw_load_more_node = function(id, lastIndex) {
			var self = this;
			var more_node = $('<li><a href="javascript:;" data-id="' + id + '" data-lastindex="' + lastIndex + '"></a ></li>');

			$('a', more_node)
				.text(this.settings.qload.loadText)
				.data('id', id)
				.data('lastindex', lastIndex);
				
			more_node.on('click', 'a', function(e) {
				self.load_more(e);
			})
			return more_node[0];
		},
		this.load_more = function(e) {
			var $target = $(e.currentTarget);
			var listItem = $target.closest('li');
			var id = $target.data('id');
			var lastIndex = $target.data('lastindex');
			var obj = this.get_node(id);
			var children = obj.children;

			for (var i = lastIndex, j = children.length; i < lastIndex + options.limit && i < j; ++i) {
				$(this.redraw_node(children[i], true, true)).insertBefore(listItem);
			}

			if (lastIndex + options.limit < children.length) {
				$target.data('lastindex', lastIndex + options.limit);
			} else {
				$target.remove();
			}

		}
	}
}));