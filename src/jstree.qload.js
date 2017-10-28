/**
 * ### Qload plugin
 *
 * A plugin to prevent slowing down opening a node, which has large amount of children 
 */
/*globals jQuery, define, exports, require, document */
(function (factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define('jstree.qload', ['jquery','jstree'], factory);
	}
	else if(typeof exports === 'object') {
		factory(require('jquery'), require('jstree'));
	}
	else {
		factory(jQuery, jQuery.jstree);
	}
}(function ($, jstree, undefined) {
	"use strict";

	if($.jstree.plugins.qload) { return; }

	/**
	 * qload configuration
	 * @name $.jstree.defaults.qload
	 * @plugin qload
	 */
	$.jstree.defaults.qload = {
		/**
		 * the number of children will display in the list after opening a node
		 * @type {Number}
		 */
		prevLimit: 50,
		/**
		 * the number of children will display after the list when load more nodes
		 * @type {Number}
		 */
		nextLimit: 50,
		/**
		 * the text of the "More..." button
		 * @type {String}
		 */
		moreText: 'More...'
	};
	$.jstree.plugins.qload = function (options, parent) {

		/**
		 * rewrite draw_children, append 'More...' button
		 */
		this.draw_children = function(node) {
			var limit = this.settings.qload.prevLimit;
			var parentEl = parent.draw_children.call(this, node, limit);

			if (parentEl && limit < node.children.length) {
				parentEl.appendChild(this.draw_load_more_node(node.id, limit));
			}
		};
		/**
		 * draw a 'More...' button node in the tree
		 * @param  {String} id        the parent id
		 * @param  {Number} lastIndex the last index of the shown node
		 * @return {Element}          an element of the 'More...' button
		 */
		this.draw_load_more_node = function(id, lastIndex) {
			var self = this;
			var more_node = $([
				'<li class="jstree-node jstree-leaf jstree-last" data-id="', id, '" data-lastindex="', lastIndex, '">',
					'<i class="jstree-icon jstree-ocl" role="presentation"></i>',
					'<a class="jstree-anchor" href="javascript:;">',
						// '<i class="jstree-icon jstree-themeicon" role="presentation"></i>',
					'</a >',
				'</li>'
			].join(''));

			$('a', more_node)
				.append(this.settings.qload.moreText)
				.data('id', id)
				.data('lastindex', lastIndex);

			more_node.on('click', function(e) {
				self.load_more(e);

			});
			return more_node[0];
		};
		/**
		 * click handler of the 'More...' button
		 * @param  {Event} e click event object
		 */
		this.load_more = function(e) {
			var $target = $(e.currentTarget);
			var listItem = $target.closest('li');
			var id = $target.data('id');
			var lastIndex = $target.data('lastindex');
			var obj = this.get_node(id);
			var children = obj.children;

			for (var i = lastIndex, j = children.length; i < lastIndex + options.nextLimit && i < j; ++i) {
				$(this.redraw_node(children[i], true, true)).insertBefore(listItem);
			}

			if (lastIndex + options.nextLimit < children.length) {
				$target.data('lastindex', lastIndex + options.nextLimit);
			} else {
				$target.remove();
			}

			this.trigger('qload_more', { 'node' : obj });
		};
	};
}));