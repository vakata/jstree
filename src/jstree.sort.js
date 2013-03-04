/**
 * ### Sort plugin
 */
(function ($) {
	$.jstree.defaults.sort = function (a, b) {
		return this.get_text(a, true) > this.get_text(b, true) ? 1 : -1;
	};
	$.jstree.plugins.sort = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on("load_node.jstree", $.proxy(function (e, data) {
						var obj = this.get_node(data.node);
						obj = obj === -1 ? this.get_container_ul() : obj.children("ul");
						this.sort(obj, true);
					}, this))
				.on("rename_node.jstree create_node.jstree", $.proxy(function (e, data) {
						this.sort(data.node.parent(), false);
					}, this))
				.on("move_node.jstree copy_node.jstree", $.proxy(function (e, data) {
						var m = data.parent === -1 ? this.get_container_ul() : data.parent.children('ul');
						this.sort(m, false);
					}, this));
		};
		this.sort = function (obj, deep) {
			var s = this.settings.sort,
				t = this;
			obj.append($.makeArray(obj.children("li")).sort($.proxy(s, t)));
			obj.children('li').each(function () { t.correct_node(this, false); });
			if(deep) {
				obj.children("li").children("ul").each(function() { t.sort($(this)); });
				t.correct_node(obj.children('li'), true);
			}
		};
	};

	// include the sort plugin by default
	$.jstree.defaults.plugins.push("sort");
})(jQuery);