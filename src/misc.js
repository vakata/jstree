/* global jQuery */

// disable all events
(function ($, undefined) {
	"use strict";
	$.jstree.plugins.trigger = function (options, parent) {
		this.init = function (el, options) {
			// do not forget parent
			parent.init.call(this, el, options);
			this._data.trigger.disabled = false;
		};
		this.trigger = function (ev, data) {
			if(!this._data.trigger.disabled) {
				parent.trigger.call(this, ev, data);
			}
		};
		this.disable_events = function () { this._data.trigger.disabled = true; };
		this.enable_events = function () { this._data.trigger.disabled = false; };
	};
})(jQuery);

// no hover
(function ($, undefined) {
	"use strict";
	$.jstree.plugins.nohover = function () {
		this.hover_node = $.noop;
	};
})(jQuery);

// conditional select
(function ($, undefined) {
	"use strict";
	$.jstree.defaults.conditionalselect = function () { return true; };

	$.jstree.plugins.conditionalselect = function (options, parent) {
		// own function
		this.select_node = function (obj, supress_event, prevent_open) {
			if(this.settings.conditionalselect.call(this, this.get_node(obj))) {
				parent.select_node.call(this, obj, supress_event, prevent_open);
			}
		};
	};
})(jQuery);

// no state
(function ($, undefined) {
	"use strict";
	$.jstree.plugins.nostate = function () {
		this.set_state = function (state, callback) {
			if(callback) { callback.call(this); }
			this.trigger('set_state');
		};
	};
})(jQuery);

// no selected in state
(function ($, undefined) {
	"use strict";
	$.jstree.plugins.noselectedstate = function (options, parent) {
		this.get_state = function () {
			var state = parent.get_state.call(this);
			delete state.core.selected;
			return state;
		};
	};
})(jQuery);