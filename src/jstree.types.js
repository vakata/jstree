/**
 * ### Types plugin
 */
(function ($) {
	$.jstree.defaults.types = {
		'#' : {},
		'default' : {}
	};

	$.jstree.plugins.types = function (options, parent) {
		this.init = function (el, options) {
			parent.init.call(this, el, options);
			this._model.data['#'].type = '#';
		};
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on('model.jstree', $.proxy(function (e, data) {
						var m = this._model.data,
							dpc = data.nodes,
							t = this.settings.types,
							i, j, c = 'default';
						for(i = 0, j = dpc.length; i < j; i++) {
							c = 'default';
							if(m[dpc[i]].original && m[dpc[i]].original.type && t[m[dpc[i]].original.type]) {
								c = m[dpc[i]].original.type;
							}
							if(m[dpc[i]].data && m[dpc[i]].data.jstree && m[dpc[i]].data.jstree.type && t[m[dpc[i]].data.jstree.type]) {
								c = m[dpc[i]].data.jstree.type;
							}
							m[dpc[i]].type = c;
							if(m[dpc[i]].icon === true && t[c].icon) {
								m[dpc[i]].icon = t[c].icon;
							}
						}
					}, this));
		};
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var m = this._model.data, tmp, d;
			switch(chk) {
				case "create_node":
				case "move_node":
				case "copy_node":
					if(chk !== 'move_node' || $.inArray(obj.id, par.children) === -1) {
						tmp = this.get_rules(par);
						if(typeof tmp.max_children !== 'undefined' && tmp.max_children !== -1 && tmp.max_children === par.children.length) {
							return false;
						}
						if(typeof tmp.valid_children !== 'undefined' && tmp.valid_children !== -1 && $.inArray(obj.type, tmp.valid_children) === -1) {
							return false;
						}
						if(obj.children_d && obj.parents) {
							d = 0;
							for(var i = 0, j = obj.children_d.length; i < j; i++) {
								d = Math.max(d, m[obj.children_d[i]].parents.length);
							}
							d = d - obj.parents.length + 1;
						}
						if(d <= 0) { d = 1; }
						do {
							if(typeof tmp.max_depth !== 'undefined' && tmp.max_depth !== -1 && tmp.max_depth < d) {
								return false;
							}
							par = this.get_node(par.parent);
							tmp = this.get_rules(par);
							d++;
						} while(par);
					}
					break;
			}
			return true;
		};
		this.get_rules = function (obj) {
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var tmp = this.get_type(obj, true);
			if(typeof tmp.max_depth === 'undefined') { tmp.max_depth = -1; }
			if(typeof tmp.max_children === 'undefined') { tmp.max_children = -1; }
			if(typeof tmp.valid_children === 'undefined') { tmp.valid_children = -1; }
			return tmp;
		};
		this.get_type = function (obj, rules) {
			obj = this.get_node(obj);
			return (!obj) ? false : ( rules ? $.extend({ 'type' : obj.type }, this.settings.types[obj.type]) : obj.type);
		};
		this.set_type = function (obj, type) {
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_type(obj[t1], type);
				}
				return true;
			}
			var t = this.settings.types;
			obj = this.get_node(obj);
			if(!t[type] || !obj) { return false; }
			obj.type = type;
			if(t[type].icon && this.get_icon(obj) === true) {
				this.set_icon(obj, t[type].icon);
			}
			return true;
		};
	};
	// include the types plugin by default
	$.jstree.defaults.plugins.push("types");
})(jQuery);