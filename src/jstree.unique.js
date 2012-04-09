/* File: jstree.unique.js 
Does not allow the same name amongst siblings (still a bit experimental).
*/
/* Group: jstree drag'n'drop plugin */
(function ($) {
	$.jstree.plugin("unique", {
		// TODO: think about an option to work with HTML or not?
		_fn : { 
			check : function (chk, obj, par, pos) {
				if(!this.__call_old()) { return false; }

				par = par === -1 ? this.get_container() : par;
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
			}
		}
	});
	// include the unique plugin by default
	$.jstree.defaults.plugins.push("unique");
})(jQuery);
//*/