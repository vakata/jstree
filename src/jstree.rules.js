/* File: jstree.rules.js
Limits the children count, valid children and depth of nodes by using types or embedded data.
*/
/* Group: jstree rules plugin */
(function ($) {
	var last_depth_node = false,
		last_depth_value = 0;
	$.jstree.plugin("rules", {
		__construct : function () {
		},
		defaults : {
			'check_max_depth'		: true,
			'check_max_children'	: true,
			'check_valid_children'	: true,
			'types'					: { }
		},
		_fn : {
			get_rules : function (obj) {
				obj = this.get_node(obj);
				if(obj === -1) {
					obj = this.get_container();
					obj = obj.data('jstree');
					return {
						'type'				: false,
						'max_depth'			: obj && obj.max_depth ? obj.max_depth : -1,
						'max_children'		: obj && obj.max_children ? obj.max_children : -1,
						'valid_children'	: obj && obj.valid_children ? obj.valid_children  : -1
					};
				}
				if(!obj || !obj.length) { return false; }
				obj = obj.data('jstree');
				var s = this.get_settings().rules,
					t = this.get_type(obj),
					r = {
						'type'				: t,
						'max_depth'			: -1,
						'max_children'		: -1,
						'valid_children'	: -1
					};
				if(t && s[t]) {
					if(s[t].max_depth)			{ r.max_depth = s[t].max_depth; }
					if(s[t].max_children)		{ r.max_children = s[t].max_children; }
					if(s[t].valid_children)		{ r.valid_children = s[t].valid_children; }
				}
				if(obj && obj.max_depth)		{ r.max_depth = obj.max_depth; }
				if(obj && obj.max_children)		{ r.max_children = obj.max_children; }
				if(obj && obj.valid_children)	{ r.valid_children = obj.valid_children; }
				return r;
			},
			get_type : function (obj) {
				obj = this.get_node(obj);
				if(obj === -1) { obj = this.get_container(); }
				if(!obj || !obj.length) { return false; }
				obj = obj.data('jstree');
				return obj && obj.type ? obj.type : false;
			},
			set_type : function (obj, type) {
				obj = this.get_node(obj);
				if(obj === -1) { obj = this.get_container(); }
				if(!obj || !obj.length) { return false; }
				var d = obj.data('jstree');
				if(!d) { d = {}; }
				d.type = type;
				obj.data('jstree', d);
				return true;
			},
			check : function (chk, obj, par, pos) {
				if(this.__call_old() === false) { return false; }
				var r = false,
					s = this.get_settings().rules,
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
						if(s.check_max_children) {
							if(typeof r.max_children !== 'undefined' && r.max_children !== -1) {
								if(par.find('> ul >  li').not( chk === 'move_node' ? obj : null ).length + obj.length > r.max_children) {
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
						if(s.check_max_depth) {
							if(typeof r.max_depth !== 'undefined' && r.max_depth !== -1) {
								if(r.max_depth === 0) { return false; }
								d = 0;
								if(last_depth_node !== obj) {
									o = obj;
									while(o.length > 0) {
										o = o.find("> ul > li");
										d ++;
									}
									last_depth_value = d;
									last_depth_node = obj;
								}
								else {
									d = last_depth_value;
								}
								o = 0;
								par.children("a:eq(0)").parentsUntil(".jstree","li").each(function (i) {
									var d = t.get_rules(this);
									if(typeof d.max_depth !== 'undefined' && d.max_depth >= 0 && d + i > d.max_depth) {
										t = false;
										return false;
									}
									o = i;
								});
								if(t === false) {
									return false;
								}
								t = this.get_rules(-1);
								if(typeof t.max_depth !== 'undefined' && t.max_depth >= 0 && d + o > t.max_depth) {
									return false;
								}
							}
						}
						break;
				}
				return true;
			}
		}
	});
	// include the rules plugin by default
	$.jstree.defaults.plugins.push("rules");
})(jQuery);