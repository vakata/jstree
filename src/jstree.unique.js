/**
 * ### Unique plugin
 */
(function ($) {
	$.jstree.plugins.unique = function (options, parent) {
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			if(!par || !par.children) { return true; }
			var n = chk === "rename_node" ? pos : obj.text,
				c = [],
				m = this._model.data;
			for(var i = 0, j = par.children.length; i < j; i++) {
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
})(jQuery);
