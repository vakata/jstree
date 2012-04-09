/* File: jstree.contextmenu.js 
Enables a rightclick contextmenu.
*/
/* Group: jstree sort plugin */
(function ($) {
	$.jstree.plugin("contextmenu", {
		__construct : function () {
			this.get_container()
				.delegate("a", "contextmenu.jstree", $.proxy(function (e) {
						e.preventDefault();
						if(!this.is_loading(e.currentTarget)) {
							this.show_contextmenu(e.currentTarget, e.pageX, e.pageY);
						}
					}, this))
				.delegate("a", "click.jstree", $.proxy(function (e) {
						if(this.data.contextmenu.visible) {
							this._hide_contextmenu();
						}
					}, this));
			$(document).bind("context_hide.vakata", $.proxy(function () { this.data.contextmenu = false; }, this));
		},
		__destruct : function () {
			if(this.data.contextmenu) {
				this._hide_contextmenu();
			}
		},
		defaults : { 
			select_node : true, 
			show_at_node : true,
			items : function (o) { // Could be an object directly
				return { 
					"create" : {
						"separator_before"	: false,
						"separator_after"	: true,
						"label"				: "Create",
						"action"			: function (data) { 
							var inst = $.jstree._reference(data.reference),
								obj = inst.get_node(data.reference);
							inst.create_node(obj, {}, "last", function (new_node) {
								setTimeout(function () { inst.edit(new_node); },0);
							});
						}
					},
					"rename" : {
						"separator_before"	: false,
						"separator_after"	: false,
						"label"				: "Rename",
						"action"			: function (data) { 
							var inst = $.jstree._reference(data.reference),
								obj = inst.get_node(data.reference);
							inst.edit(obj);
						}
					},
					"remove" : {
						"separator_before"	: false,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Delete",
						"action"			: function (data) {
							var inst = $.jstree._reference(data.reference),
								obj = inst.get_node(data.reference);
							inst.delete_node(obj);
						}
					},
					"ccp" : {
						"separator_before"	: true,
						"icon"				: false,
						"separator_after"	: false,
						"label"				: "Edit",
						"action"			: false,
						"submenu" : { 
							"cut" : {
								"separator_before"	: false,
								"separator_after"	: false,
								"label"				: "Cut",
								"action"			: function (data) { 
									var inst = $.jstree._reference(data.reference),
										obj = inst.get_node(data.reference);
									inst.cut(obj);
								}
							},
							"copy" : {
								"separator_before"	: false,
								"icon"				: false,
								"separator_after"	: false,
								"label"				: "Copy",
								"action"			: function (data) { 
									var inst = $.jstree._reference(data.reference),
										obj = inst.get_node(data.reference);
									inst.copy(obj);
								}
							},
							"paste" : {
								"separator_before"	: false,
								"icon"				: false,
								"_disabled"			: !(this.can_paste()),
								"separator_after"	: false,
								"label"				: "Paste",
								"action"			: function (data) { 
									var inst = $.jstree._reference(data.reference),
										obj = inst.get_node(data.reference);
									inst.paste(obj);
								}
							}
						}
					}
				};
			}
		},
		_fn : {
			show_contextmenu : function (obj, x, y) {
				obj = this.get_node(obj);
				var s = this.get_settings().contextmenu,
					a = obj.children("a:visible:eq(0)"),
					o = false,
					i = false;
				if(s.show_at_node || typeof x === "undefined" || typeof y === "undefined") {
					o = a.offset();
					x = o.left;
					y = o.top + this.data.core.li_height;
				}
				if(s.select_node && this.data.ui && !this.is_selected(obj)) {
					this.deselect_all();
					this.select_node(obj);
				}

				i = obj.data("jstree") && obj.data("jstree").contextmenu ? obj.data("jstree").contextmenu : s.items;
				if($.isFunction(i)) { i = i.call(this, obj); }

				$(document).one("context_show.vakata", $.proxy(function (e, data) { 
					var cls = 'jstree-contextmenu';
					if(this.data.themes.theme) {
						cls += ' jstree-' + this.data.themes.theme + '-contextmenu';
					}
					$(data.element).addClass(cls);
				}, this));
				this.data.contextmenu.visible = true;
				$.vakata.context.show(a, { 'x' : x, 'y' : y }, i);
				this.__callback({ "obj" : obj, "x" : x, "y" : y });
			}
		}
	});
	$.jstree.defaults.plugins.push("contextmenu");
})(jQuery);