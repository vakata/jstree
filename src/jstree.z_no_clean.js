	(function ($) {
		$.jstree.plugin("z_no_clean", {
			_fn : {
				clean_node : function (obj) {
					return false;
				}
			}
		});
		// include the no_clean plugin by default
		$.jstree.defaults.plugins.push("z_no_clean");
	})(jQuery);