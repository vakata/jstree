/* File: jstree.sort.js 
Sorts items alphabetically (or using any other function)
*/
/* Group: jstree sort plugin */
(function ($) {
	$.jstree.plugin("sort", {
		__construct : function () {
			this.get_container()
				.bind("load_node.jstree", $.proxy(function (e, data) {
						var obj = this.get_node(data.rslt.obj);
						obj = obj === -1 ? this.get_container_ul() : obj.children("ul");
						this._sort(obj, true);
					}, this))
				.bind("rename_node.jstree create_node.jstree", $.proxy(function (e, data) {
						this._sort(data.rslt.obj.parent(), false);
					}, this))
				.bind("move_node.jstree copy_node.jstree", $.proxy(function (e, data) {
						var m = data.rslt.parent === -1 ? this.get_container_ul() : data.rslt.parent.children('ul');
						this._sort(m, false);
					}, this));
		},
		defaults : function (a, b) { return this.get_text(a, true) > this.get_text(b, true) ? 1 : -1; },
		_fn : { 
			_sort : function (obj, deep) {
				var s = this.get_settings(true).sort,
					t = this;
				obj.append($.makeArray(obj.children("li")).sort($.proxy(s, t)));
				obj.children('li').each(function () { t.correct_node(this, false); });
				if(deep) {
					obj.find("> li > ul").each(function() { t._sort($(this)); });
					t.correct_node(obj.children('li'), true);
				}
			}
		}
	});
	// include the sort plugin by default
	$.jstree.defaults.plugins.push("sort");
})(jQuery);