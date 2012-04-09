/* File: jstree.state.js 
This plugin enables state saving between reloads.
*/
/* Group: jstree state plugin */
(function ($) {
	$.jstree.plugin("state", {
		__construct : function () { 
			if(typeof $.vakata.storage === "undefined") { throw "jsTree state plugin: vakata storage helper not included."; }

			this.get_container() 
				.bind("__loaded.jstree", $.proxy(function (e, data) {
						this.restore_state();
					}, this))
				.bind("__ready.jstree", $.proxy(function (e, data) {
						this.get_container()
							.bind(this.get_settings(true).state.events, $.proxy(function () {
								this.save_state();
							}, this));
					}, this));
		},
		defaults : {
			key		: 'jstree', // pass unique name to work with many trees
			events	: 'select_node.jstree open_node.jstree close_node.jstree deselect_node.jstree deselect_all.jstree'
		},
		_fn : { 
			save_state : function () {
				var s = this.get_settings(true).state;
				$.vakata.storage.set(s.key, this.get_state());
			},
			restore_state : function () {
				var s = this.get_settings(true).state,
					k = $.vakata.storage.get(s.key);
				if(!!k) { this.set_state(k); }
			}
		}
	});
	// include the state plugin by default
	// $.jstree.defaults.plugins.push("state");
})(jQuery);
