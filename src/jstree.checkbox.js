/* File: jstree.checkbox.js
Adds checkboxes to the tree.
*/
(function ($) {
	$.jstree.plugin("checkbox", {
		__construct : function () {
			this.get_container()
				.bind("__construct.jstree", $.proxy(function () {
						// TODO: on move/copy - clean new location and parents
					}, this))
				.bind("move_node.jstree, copy_node.jstree", function (e, data) {
						if(data.rslt.old_instance && data.rslt.old_parent && $.isFunction(data.rslt.old_instance.checkbox_repair)) {
							data.rslt.old_instance.checkbox_repair(data.rslt.old_parent);
						}
						if(data.rslt.new_instance && $.isFunction(data.rslt.new_instance.checkbox_repair)) {
							data.rslt.new_instance.checkbox_repair(data.rslt.parent);
						}
					})
				.bind("delete_node.jstree", function (e, data) {
						this.checkbox_repair(data.rslt.parent);
					})
				.delegate("a", "click.jstree", $.proxy(function (e) {
						e.preventDefault();
						e.currentTarget.blur();
						var obj = this.get_node(e.currentTarget);
						this.toggle_check(obj);
					}, this));
		},
		defaults : { 
			three_state : true
		},
		_fn : {
			/*
				Group: CHECKBOX functions
			*/
			check_node : function (obj) {
				obj = this.get_node(obj);
				obj.find(' > a > .jstree-checkbox').removeClass('jstree-unchecked jstree-undetermined').addClass('jstree-checked').children(':checkbox').prop('checked', true).prop('undermined', false);
				this.checkbox_repair(obj);
			},
			uncheck_node : function (obj) {
				obj = this.get_node(obj);
				obj.find(' > a > .jstree-checkbox').removeClass('jstree-checked jstree-undetermined').addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('undermined', false);
				this.checkbox_repair(obj);
			},
			toggle_check : function (obj) {
				obj = obj.find(' > a > .jstree-checkbox').removeClass('jstree-undetermined').toggleClass('jstree-checked');
				if(!obj.hasClass('jstree-checked')) { 
					obj.addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('undermined', false); 
				}
				else { 
					obj.children(':checkbox').prop('checked', true).prop('undermined', false); 
				}
				this.checkbox_repair(this.get_node(obj));
			},
			uncheck_all : function (context) {
				var ret = context ? $(context).find(".jstree-checked").closest('li') : this.get_container().find(".jstree-checked").closest('li');
				ret.children(".jstree-checkbox").removeClass("jstree-checked jstree-undetermined").addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('undermined', false);
				this.__callback({ "obj" : ret });
			},

			checkbox_repair : function (obj) {
				if(!this.get_settings(true).checkbox.three_state) { return false; }

				if(!obj || obj === -1) {
					obj = this.get_container_ul().children('li');
				}
				if(obj.length > 1) {
					obj.each($.proxy(function (i, d) { 
						this.checkbox_repair($(d));
					}, this));
					
					return;
				}

				var c = obj.find(' > a > .jstree-checkbox'),
					fix_up = true,
					p, st, sc, su, si;

				if(!c.hasClass('jstree-checked') && !c.hasClass('jstree-unchecked')) {
					p = this.get_parent(obj);
					if(p && p !== -1 && p.length && p.find('> a > .jstree-checked').length) { c.addClass('jstree-checked'); }
					else { c.addClass('jstree-unchecked'); }
					fix_up = false;
				}

				if(c.hasClass('jstree-checked')) {
					obj.find('.jstree-checkbox').removeClass('jstree-undetermined jstree-unchecked').addClass('jstree-checked').children(':checkbox').prop('checked', true).prop('undermined', false);
				}
				if(c.hasClass('jstree-unchecked')) {
					obj.find('.jstree-checkbox').removeClass('jstree-undetermined jstree-checked').addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('undermined', false);
				}

				while(fix_up) {
					obj = this.get_parent(obj);
					if(!obj || obj === -1 || !obj.length) { return; }

					st = obj.find(' > ul > li');
					sc = st.find(' > a > .jstree-checked').length;
					su = st.find(' > a > .jstree-unchecked').length;
					si = st.find(' > a > .jstree-undetermined').length;
					st = st.length;

					if(sc + su + si < st) { return; }

					if(su === st) {
						c = obj.find(' > a > .jstree-checkbox');
						if(c.hasClass('jstree-unchecked')) { return; }
						c.removeClass('jstree-undetermined jstree-checked').addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('undermined', false);
						continue;
					}
					if(sc === st) {
						c = obj.find(' > a > .jstree-checkbox');
						if(c.hasClass('jstree-checked')) { return; }
						c.removeClass('jstree-undetermined jstree-unchecked').addClass('jstree-checked').children(':checkbox').prop('checked', true).prop('undermined', false);
						continue;
					}
					obj.parentsUntil(".jstree", "li").andSelf().find(' > a > .jstree-checkbox').removeClass('jstree-checked jstree-unchecked').addClass('jstree-undetermined').children(':checkbox').prop('checked', false).prop('undetermined', true);
					return;
				}
			},

			clean_node : function(obj) {
				obj = this.__call_old();
				var t = this;
				obj = obj.each(function () {
					var o = $(this),
						d = o.data("jstree");
					o.find(" > a > .jstree-checkbox").remove();
					o.children("a").prepend("<ins class='jstree-icon jstree-checkbox " + (d && d.checkbox && d.checkbox.checked === true ? 'jstree-checked' : '') + ( (d && d.checkbox && d.checkbox.checked === false) || !t.get_settings(true).checkbox.three_state ? 'jstree-unchecked' : '') + " '><input class='jstree-check' type='checkbox' " + (d && d.checkbox && d.checkbox.checked ? ' checked="checked" ' : '') + " name='" + (d && d.checkbox && typeof d.checkbox.name !== 'undefined' ? d.checkbox.name : 'jstree[]') + "' value='" + (d && d.checkbox && typeof d.checkbox.value !== 'undefined' ? d.checkbox.value : o.attr('id')) + "' /></ins>");
				});
				t.checkbox_repair(obj);
				return obj;
			},
			get_state : function () {
				var state = this.__call_old();
				state.checked = [];
				this.get_container().find('.jstree-checked').closest('li').each(function () { if(this.id) { state.checked.push(this.id); } });
				return state;
			},
			set_state : function (state, callback) {
				if(this.__call_old()) {
					if(state.checkbox) {
						var _this = this;
						this.uncheck_all();
						$.each(state.checkbox, function (i, v) {
							_this.check_node(document.getElementById(v));
						});
						this.checkbox_repair();
						delete state.checkbox;
						this.set_state(state, callback);
						return false;
					}
					return true;
				}
				return false;
			},
			get_json : function (obj, is_callback) {
				var r = this.__call_old(), i;
				if(is_callback) {
					i = obj.find('> a > ins > :checkbox');
					r.data.jstree.checkbox = {};
					r.data.jstree.checkbox.checked = i.parent().hasClass('jstree-checked');
					if(i.attr('name') !== 'jstree[]') { r.data.checkbox.name = i.attr('name'); }
					if(i.val() !== obj.attr('id')) { r.data.checkbox.value = i.val(); }
				}
				return r;
			}
		}
	});
	$(function () {
		// add checkbox specific CSS
		var css_string = '' + 
				'.jstree a > .jstree-checkbox { height:16px; width:16px; margin-right:1px; } ' + 
				'.jstree-rtl a > .jstree-checkbox { margin-right:0; margin-left:1px; } ' + 
				'.jstree .jstree-check { margin:0; padding:0; border:0; display:inline; vertical-align:text-bottom; } ';
		// Correct IE 6 (does not support the > CSS selector)
		if($.jstree.IS_IE6) { 
			css_string += '' + 
				'.jstree li a .jstree-checkbox { height:16px; width:16px; background:transparent; margin-right:1px; } ' + 
				'.jstree-rtl li a .jstree-checkbox { margin-right:0; margin-left:1px; } ';
		}
		// the default stylesheet
		$.vakata.css.add_sheet({ str : css_string, title : "jstree" });
	});
	// include the checkbox plugin by default
	$.jstree.defaults.plugins.push("checkbox");
})(jQuery);
//*/