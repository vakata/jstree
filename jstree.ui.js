/* File: jstree.ui.js 
This plugin enables selecting, deselecting and hovering tree items.
*/
/* Group: jstree UI plugin */
(function ($) {
	$.jstree.plugin("ui", {
		__construct : function () { 
			this.data.ui.selected = $(); 
			this.data.ui.hovered = null;
			this.data.ui.last_selected = false; 

			this.get_container() // TODO: configurable event (click/dblclick/etc)
				.delegate("a", "click.jstree", $.proxy(function (e) {
						e.preventDefault();
						e.currentTarget.blur();
						var s			= this.get_settings(true).ui,
							obj			= this.get_node(e.currentTarget),
							is_selected	= this.is_selected(obj),
							is_multiple	= s.select_multiple_modifier == "on" || (s.select_multiple_modifier !== false && e && e[s.select_multiple_modifier + "Key"]),
							is_range	= s.select_multiple_modifier == "on" || (s.select_range_modifier !== false && e && e[s.select_range_modifier + "Key"] && this.data.ui.last_selected && this.data.ui.last_selected[0] !== obj[0] && this.data.ui.last_selected.parent()[0] === obj.parent()[0]);

						switch(!0) {
							case (is_range && this.data.ui.last_selected !== false):
								this.select_range(obj);
								break;
							case (is_range && this.data.ui.last_selected === false):
								this.select_one(obj);
								break;
							case (is_selected && is_multiple):
								this.deselect_node(obj);
								break;
							default:
								this.select_one(obj, is_multiple);
								break;
						}
					}, this))
				.delegate("a", "mouseenter.jstree", $.proxy(function (e) {
						this.hover_node(e.target);
					}, this))
				.delegate("a", "mouseleave.jstree", $.proxy(function (e) {
						this.dehover_node(e.target);
					}, this))
				.bind("delete_node.jstree", $.proxy(function (event, data) { 
						var o = this.get_node(data.rslt.obj),
							n = (o && o.length) ? o.find("a.jstree-clicked") : $(),
							t = this;
						n.each(function () { t.deselect_node(this); });
					}, this))
				.bind("move_node.jstree", $.proxy(function (event, data) { 
						if(data.rslt.cy) { 
							data.rslt.oc.find("a.jstree-clicked").removeClass("jstree-clicked");
						}
					}, this));
		},
		defaults : {
			select_multiple_modifier : "ctrl", // on, or ctrl, shift, alt, or false
			select_range_modifier : "shift", // on, or ctrl, shift, alt, or false
			disable_nested_selection : true
		},
		_fn : { 
			get_node : function (obj, allow_multiple) {
				if(typeof obj === "undefined" || obj === null) { return allow_multiple ? this.data.ui.selected : this.data.ui.last_selected; }
				return this.__call_old();
			},

			hover_node : function (obj) {
				obj = this.get_node(obj);
				if(!obj || !obj.length || this.is_loading(obj)) { return false; }
				if(!obj.hasClass("jstree-hovered")) { this.dehover_node(); }
				this.data.ui.hovered = obj.children("a").addClass("jstree-hovered").parent();
				this.scroll_to_node(obj);
				this.__callback({ "obj" : obj });
			},
			dehover_node : function () {
				var obj = this.data.ui.hovered, p;
				if(!obj || !obj.length) { return false; }
				p = obj.children("a").removeClass("jstree-hovered").parent();
				if(this.data.ui.hovered[0] === p[0]) { this.data.ui.hovered = null; }
				this.__callback({ "obj" : obj });
			},
			select_node : function (obj) {
				var t = this;
				obj = this.get_node(obj);
				if(obj == -1 || !obj || !obj.length || this.is_loading(obj)) { return false; }
				obj.children("a").addClass("jstree-clicked");
				this.data.ui.last_selected = obj;
				this.data.ui.selected = this.data.ui.selected.add(obj);
				// this.scroll_to_node(obj.eq(0));
				obj.parents(".jstree-closed").each(function () { t.open_node(this, false, 0); });
				this.__callback({ "obj" : obj });
			},
			deselect_node : function (obj) {
				obj = this.get_node(obj);
				if(!obj || !obj.length) { return false; }
				if(this.is_selected(obj)) {
					obj.children("a").removeClass("jstree-clicked");
					this.data.ui.selected = this.data.ui.selected.not(obj);
					if(this.data.ui.last_selected.get(0) === obj.get(0)) { this.data.ui.last_selected = this.data.ui.selected.eq(0); }
					this.__callback({ "obj" : obj });
				}
			},
			deselect_all : function (context) {
				var ret = context ? $(context).find("a.jstree-clicked").parent() : this.get_container().find("a.jstree-clicked").parent();
				ret.children("a.jstree-clicked").removeClass("jstree-clicked");
				this.data.ui.selected = $([]);
				this.data.ui.last_selected = false;
				this.__callback({ "obj" : ret });
			},
			is_selected : function (obj) { return this.data.ui.selected.index(this.get_node(obj)) >= 0; },
			get_selected : function (context) { return context ? $(context).find("a.jstree-clicked").parent() : this.data.ui.selected; },

			select_range : function (obj, start_node, keep_old_selection) {
				var _this = this, i, s;
				obj = this.get_node(obj);
				if(!start_node) { s = true; start_node = this.data.ui.last_selected; }
				start_node = this.get_node(start_node);
				if(obj == -1 || !obj || !obj.length || this.is_loading(obj)) { return false; }
				if(start_node == -1 || !start_node || !start_node.length || this.is_loading(start_node)) { return false; }

				if(!keep_old_selection) { this.deselect_all(); }
				i = (obj.index() < start_node.index());
				start_node.addClass("jstree-last-selected");
				obj = obj[ i ? "nextUntil" : "prevUntil" ](".jstree-last-selected").andSelf().add(".jstree-last-selected");
				start_node.removeClass("jstree-last-selected");
				if(!i) { obj = obj.vakata_reverse(); }
				if(!obj.length) { return false; }
				obj.each(function () { _this.select_node(this); });
				if(s) { this.data.ui.last_selected = start_node; }
				this.__callback({ "obj" : obj });
				return true;
			},
			select_one : function (obj, keep_old_selection) {
				obj = this.get_node(obj);
				if(obj == -1 || !obj || !obj.length || this.is_loading(obj)) { return false; }
				if(!keep_old_selection) { this.deselect_all(); }
				else { 
					if(
						this.get_settings(true).ui.disable_nested_selection && 
						(
							(obj.parentsUntil(".jstree","li").children("a.jstree-clicked:eq(0)").length) ||
							(obj.children("ul").find("a.jstree-clicked:eq(0)").length)
						)
					) {
						return false;
					}
				}
				this.select_node(obj);
				// obj.each(function () { t.select_node(this); });
				this.__callback({ "obj" : obj });
				return true;
			},

			clean_node : function(obj) {
				obj = this.__call_old();
				var _this = this;
				return obj.each(function () {
					var t = $(this),
						d = t.data("jstree");
					t.find('.jstree-clicked').removeClass('jstree-clicked');
					if(d && d.selected) {
						_this.select_node(t);
						delete d.selected;
					}
				});
			},
			get_state : function () {
				var state = this.__call_old();
				state.selected = [];
				this.data.ui.selected.each(function () { state.selected.push(this.id); });
				return state;
			},
			set_state : function (state, callback) {
				if(this.__call_old()) {
					if(state.selected) {
						var _this = this;
						this.deselect_all();
						$.each(state.selected, function (i, v) {
							_this.select_node(document.getElementById(v));
						});
						delete state.selected;
						this.set_state(state, callback);
						return false;
					}
					return true;
				}
				return false;
			},
			get_json : function (obj, is_callback) {
				var r = this.__call_old();
				if(is_callback) {
					if(this.is_selected(obj)) { 
						r.data.jstree.selected = true; 
					}
				}
				return r;
			}
		}
	});
	// include the selection plugin by default
	$.jstree.defaults.plugins.push("ui");
})(jQuery);