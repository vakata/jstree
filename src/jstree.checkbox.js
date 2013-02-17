/* File: jstree.checkbox.js
Adds checkboxes to the tree.
*/
(function ($) {
	$.jstree.defaults.checkbox = {
		three_state : true,
		whole_node : false,
		keep_selected_style : true
	};

	$.jstree.plugins.checkbox = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			if(!this.settings.checkbox.keep_selected_style) {
				this.element.addClass('jstree-checkbox-no-clicked');
			}

			if(this.settings.checkbox.three_state) {
				this.element
					.on('changed.jstree', $.proxy(function (e, data) {
							var action = data.action || '',
								node = false,
								change = false;
							switch(action) {
								case 'select_node':
									node = data.node.parent();
									data.node.find('.jstree-anchor:not(.jstree-clicked)').each($.proxy(function (i,v) {
										change = true;
										this.select_node(v, true);
									}, this)).end().find('.jstree-undetermined').removeClass('jstree-undetermined');
									break;
								case 'deselect_node':
									node = data.node.parent();
									data.node.find('.jstree-clicked').each($.proxy(function (i,v) {
										change = true;
										this.deselect_node(v, true);
									}, this)).end().find('.jstree-undetermined').removeClass('jstree-undetermined');
									break;
								case 'deselect_all':
									this.element.find('.jstree-undetermined').removeClass('jstree-undetermined');
									break;
								case 'delete_node':
									node = data.parent;
									break;
								default:
									break;
							}
							if(node && this.check_up(node)) {
								change = true;
							}
							if(change) {
								this.trigger('changed', { 'action' : 'checkbox_three_state', 'selected' : this._data.core.selected });
							}
						}, this))
					.on('move_node.jstree copy_node.jstree', $.proxy(function (e, data) {
							if(data.old_instance && data.old_instance.check_up && data.old_instance.check_up(data.old_parent)) {
								data.old_instance.trigger('changed', { 'action' : 'checkbox_three_state', 'selected' : data.old_instance._data.core.selected });
							}
							if(data.new_instance && data.new_instance.check_up && data.new_instance.check_up(data.parent)) {
								data.new_instance.trigger('changed', { 'action' : 'checkbox_three_state', 'selected' : data.new_instance._data.core.selected });
							}
						}, this));
			}
		};
		this.clean_node = function(obj) {
			obj = parent.clean_node.call(this, obj);
			var t = this;
			obj = obj.each(function () {
				var o = $(this).children('a');
				if(!o.children(".jstree-checkbox").length) {
					o.prepend("<i class='jstree-icon jstree-checkbox'></i>");
				}
			});
			return obj;
		};
		this.activate_node = function (obj, e) {
			if(this.settings.checkbox.whole_node || $(e.target).hasClass('jstree-checkbox')) {
				e.ctrlKey = true;
			}
			parent.activate_node.call(this, obj, e);
		};
		this.check_up = function (obj) {
			if(!this.settings.checkbox.three_state) { return false; }
			obj = this.get_node(obj);
			if(obj === -1 || !obj || !obj.length) { return false; }

			var state = 0,
				has_children = obj.find('> ul > li').length > 0,
				all_checked = has_children && obj.find('> ul > li').not(this._data.core.selected).length === 0,
				none_checked = has_children && obj.find('.jstree-clicked').length === 0;

			if(!state && this.is_selected(obj)) { state = 1; }
			if(!state && obj.find('> a > .jstree-undetermined').length) { state = 2; }

			// if no children
			if(!has_children) {
				if(state === 2) {
					obj.find('.jstree-undetermined').removeClass('jstree-undetermined');
				}
				return false;
			}
			// if all checked children
			if(all_checked) {
				if(state !== 1) {
					obj.find('.jstree-undetermined').removeClass('jstree-undetermined');
					this.select_node(obj, true);
					this.check_up(obj.parent());
				}
				return true;
			}
			// if none children checked
			if(none_checked) {
				if(state === 2) {
					obj.find('.jstree-undetermined').removeClass('jstree-undetermined');
					this.check_up(obj.parent());
					return false;
				}
				if(state === 1) {
					this.deselect_node(obj, true);
					this.check_up(obj.parent());
					return true;
				}
				return false;
			}
			// some children are checked and state is checked
			if(state === 1) {
				obj.find('> a > .jstree-checkbox').addClass('jstree-undetermined');
				this.deselect_node(obj, true);
				this.check_up(obj.parent());
				return true;
			}
			// some children are checked and state is unchecked
			if(state === 0) {
				obj.find('> a > .jstree-checkbox').addClass('jstree-undetermined');
			}
			return false;
		};
	};

	$(function () {
		// add checkbox specific CSS
		var css_string = '' +
				'.jstree-anchor > .jstree-checkbox { height:16px; width:16px; margin-right:1px; } ' +
				'.jstree-rtl .jstree-anchor > .jstree-checkbox { margin-right:0; margin-left:1px; } ';
		// the default stylesheet
		if(!$.jstree.no_css) {
			$('head').append('<style type="text/css">' + css_string + '</style>');
		}

	});

	// include the checkbox plugin by default
	$.jstree.defaults.plugins.push("checkbox");
})(jQuery);
