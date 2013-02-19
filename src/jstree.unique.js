/**
 * ### Unique plugin
 */
(function ($) {
	$.jstree.plugins.unique = function (options, parent) {
		// TODO: think about an option to work with HTML or not?
		// TODO: add callback - to handle errors and for example types
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }

			par = par === -1 ? this.element : par;
			var n = chk === "rename_node" ? $('<div />').html(pos).text() : this.get_text(obj, true),
				c = [],
				t = this;
			par.children('ul').children('li').each(function () { c.push(t.get_text(this, true)); });
			switch(chk) {
				case "delete_node":
					return true;
				case "rename_node":
				case "copy_node":
					return ($.inArray(n, c) === -1);
				case "move_node":
					return (par.children('ul').children('li').index(obj) !== -1 || $.inArray(n, c) === -1);
			}
			return true;
		};
	};

	// include the unique plugin by default
	$.jstree.defaults.plugins.push("unique");
})(jQuery);
