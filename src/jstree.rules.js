/**
 * ### Rules plugin
 */
(function ($) {
	var last_depth_node = false,
		last_depth_value = 0;

	$.jstree.defaults.rules = {
		'check_max_depth'		: true,
		'check_max_children'	: true,
		'check_valid_children'	: true,
		'types'					: { }
	};

	$.jstree.plugins.rules = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element.on('load_node.jstree', $.proxy(function (e, data) {
				if(this.settings.rules.check_max_depth) {
					var o = data.node === -1 ? this.element : data.node,
						t = this,
						f = function () {
							if(t.apply_max_depth(this)) {
								o = o.not(this);
							}
						};
					if(!this.apply_max_depth(o)) {
						while(o.length) {
							o = o.children("ul").children("li");
							o.each(f);
						}
					}
				}
			}, this));
		};
		this.apply_max_depth = function (obj) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			obj = obj === -1 ? this.element : obj;
			var d = obj.data('jstree'),
				t = {},
				f1 = function () {
					t = $(this).data('jstree') || {};
					t.max_depth = 0;
					$(this).data('jstree', t);
				},
				f2 = function () {
					t = $(this).data('jstree') || {};
					t.max_depth = t.max_depth && t.max_depth !== -1 ? Math.min(t.max_depth, d) : d;
					$(this).data('jstree', t);
				};
			if(d && typeof d.max_depth !== 'undefined' && d.max_depth !== -1) {
				d = d.max_depth;
				while(obj.length > 0) {
					obj = obj.children("ul").children("li");
					d = Math.max(d - 1, 0);
					if(d === 0) {
						obj.find('li').addBack().each(f1);
						break;
					}
					obj.each(f2);
				}
				return true;
			}
			return false;
		};
		this.get_rules = function (obj) {
			obj = this.get_node(obj);
			if(obj === -1) {
				obj = this.element;
				obj = obj.data('jstree');
				return {
					'type'				: false,
					'max_depth'			: obj && obj.max_depth ? obj.max_depth : -1,
					'max_children'		: obj && obj.max_children ? obj.max_children : -1,
					'valid_children'	: obj && obj.valid_children ? obj.valid_children  : -1
				};
			}
			if(!obj || !obj.length) { return false; }

			var s = this.settings.rules,
				t = this.get_type(obj),
				r = {
					'type'				: t,
					'max_depth'			: -1,
					'max_children'		: -1,
					'valid_children'	: -1
				};
			obj = obj.data('jstree');
			if(t && s[t]) {
				if(s[t].max_depth)			{ r.max_depth = s[t].max_depth; }
				if(s[t].max_children)		{ r.max_children = s[t].max_children; }
				if(s[t].valid_children)		{ r.valid_children = s[t].valid_children; }
			}
			if(obj && typeof obj.max_children !== 'undefined')		{ r.max_children = obj.max_children; }
			if(obj && typeof obj.valid_children !== 'undefined')	{ r.valid_children = obj.valid_children; }
			if(obj && typeof obj.max_depth !== 'undefined' && (r.max_depth === -1 || (obj.max_depth !== -1 && obj.max_depth < r.max_depth) ) ) {
				r.max_depth = obj.max_depth;
			}

			return r;
		};
		this.get_type = function (obj) {
			obj = this.get_node(obj);
			if(obj === -1) { obj = this.element; }
			if(!obj || !obj.length) { return false; }
			obj = obj.data('jstree');
			return obj && obj.type ? obj.type : false;
		};
		this.set_type = function (obj, type) {
			obj = this.get_node(obj);
			if(obj === -1) { obj = this.element; }
			if(!obj || !obj.length) { return false; }
			var d = obj.data('jstree');
			if(!d) { d = {}; }
			d.type = type;
			obj.data('jstree', d);
			return true;
		};
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			var r = false,
				s = this.settings.rules,
				t = this,
				o = false,
				d = 0;

			switch(chk) {
				case "create_node":
				case "move_node":
				case "copy_node":
					if(s.check_max_children || s.check_valid_children || s.check_max_depth) {
						r = this.get_rules(par);
					}
					else {
						return true;
					}
					if(s.check_max_children) {
						if(typeof r.max_children !== 'undefined' && r.max_children !== -1) {
							if(par.children("ul").children("li").not( chk === 'move_node' ? obj : null ).length + obj.length > r.max_children) {
								return false;
							}
						}
					}
					if(s.check_valid_children) {
						if(typeof r.valid_children !== 'undefined' && r.valid_children !== -1) {
							if(!$.isArray(r.valid_children)) { return false; }
							obj.each(function () {
								if($.inArray(t.get_type(this), r.valid_children) === -1) {
									t = false;
									return false;
								}
							});
							if(t === false) {
								return false;
							}
						}
					}
					if(s.check_max_depth && r.max_depth !== -1) {
						d = 0;
						do {
							d ++;
							obj = obj.children("ul").children("li");
						} while(obj.length && chk !== 'create_node');
						if(r.max_depth - d < 0) { return false; }
					}
					break;
			}
			return true;
		};
	};

	// include the rules plugin by default
	$.jstree.defaults.plugins.push("rules");
})(jQuery);