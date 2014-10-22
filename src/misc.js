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
		this.activate_node = function (obj, e) {
			if(this.settings.conditionalselect.call(this, this.get_node(obj))) {
				parent.activate_node.call(this, obj, e);
			}
		};
	};
})(jQuery);

// real checkboxes
(function ($, undefined) {
	"use strict";

	var inp = document.createElement("INPUT");
	inp.type = "checkbox";
	inp.className = "jstree-realcheckbox";

	$.jstree.defaults.realcheckboxes = {};

	$.jstree.plugins.realcheckboxes = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this._data.realcheckboxes.uto = false;
			this.element
				.on('changed.jstree uncheck_node.jstree check_node.jstree uncheck_all.jstree check_all.jstree move_node.jstree copy_node.jstree redraw.jstree open_node.jstree ready.jstree loaded.jstree', $.proxy(function () {
						// only if undetermined is in setting
						if(this._data.realcheckboxes.uto) { clearTimeout(this._data.realcheckboxes.uto); }
						this._data.realcheckboxes.uto = setTimeout($.proxy(this._realcheckboxes, this), 50);
					}, this));
		};
		this.redraw_node = function(obj, deep, callback, force_draw) {
			obj = parent.redraw_node.call(this, obj, deep, callback, force_draw);
			if(obj) {
				var i, j, tmp = null, chk = inp.cloneNode(true);
				for(i = 0, j = obj.childNodes.length; i < j; i++) {
					if(obj.childNodes[i] && obj.childNodes[i].className && obj.childNodes[i].className.indexOf("jstree-anchor") !== -1) {
						tmp = obj.childNodes[i];
						break;
					}
				}
				if(tmp) {
					for(i = 0, j = tmp.childNodes.length; i < j; i++) {
						if(tmp.childNodes[i] && tmp.childNodes[i].className && tmp.childNodes[i].className.indexOf("jstree-checkbox") !== -1) {
							tmp = tmp.childNodes[i];
							break;
						}
					}
				}
				if(tmp && tmp.tagName === "I") {
					tmp.style.backgroundColor = "transparent";
					tmp.style.backgroundImage = "none";
					tmp.appendChild(chk);
				}
			}
			return obj;
		};
		this._realcheckboxes = function () {
			var ts = this.settings.checkbox.tie_selection;
			$('.jstree-realcheckbox').each(function () {
				this.checked = (!ts && this.parentNode.className.indexOf("jstree-checked") !== -1) || (ts && this.parentNode.parentNode.className.indexOf('jstree-clicked') !== -1);
				this.indeterminate = this.parentNode.className.indexOf("jstree-undetermined") !== -1;
				this.disabled = this.parentNode.parentNode.className.indexOf("disabled") !== -1;
			});
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

// allow search results expanding
(function ($, undefined) {
	"use strict";
	$.jstree.plugins.show_matches_children = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on('search.jstree before_open.jstree', function (e, data) {
					if(data.instance.settings.search && data.instance.settings.search.show_only_matches) {
						data.instance._data.search.dom.find('.jstree-node')
							.show().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last')
							.end().end().end().find(".jstree-children").each(function () { $(this).children(".jstree-node:visible").eq(-1).addClass("jstree-last"); });
					}
				});
		};
	};
})(jQuery);

// additional icon on node (outside of anchor)
(function ($, undefined) {
	"use strict";
	var img = document.createElement('IMG');
	//img.src = "http://www.dpcd.vic.gov.au/__data/assets/image/0004/30667/help.gif";
	img.className = "jstree-questionmark";

	$.jstree.defaults.questionmark = $.noop;
	$.jstree.plugins.questionmark = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on("click.jstree", ".jstree-questionmark", $.proxy(function (e) {
						e.stopImmediatePropagation();
						this.settings.questionmark.call(this, this.get_node(e.target));
					}, this));
		};
		this.teardown = function () {
			if(this.settings.questionmark) {
				this.element.find(".jstree-questionmark").remove();
			}
			parent.teardown.call(this);
		};
		this.redraw_node = function(obj, deep, callback, force_draw) {
			obj = parent.redraw_node.call(this, obj, deep, callback, force_draw);
			if(obj) {
				var tmp = img.cloneNode(true);
				obj.insertBefore(tmp, obj.childNodes[2]);
			}
			return obj;
		};
	};
})(jQuery);

// auto numbering
(function ($, undefined) {
	"use strict";
	var span = document.createElement('SPAN');
	span.className = "jstree-numbering";

	$.jstree.defaults.numbering = {};
	$.jstree.plugins.numbering = function (options, parent) {
		this.teardown = function () {
			if(this.settings.questionmark) {
				this.element.find(".jstree-numbering").remove();
			}
			parent.teardown.call(this);
		};
		this.get_number = function (obj) {
			obj = this.get_node(obj);
			var ind = $.inArray(obj.id, this.get_node(obj.parent).children) + 1;
			return obj.parent === '#' ? ind : this.get_number(obj.parent) + '.' + ind;
		};
		this.redraw_node = function(obj, deep, callback, force_draw) {
			var i, j, tmp = null, elm = null, org = this.get_number(obj);
			obj = parent.redraw_node.call(this, obj, deep, callback, force_draw);
			if(obj) {
				for(i = 0, j = obj.childNodes.length; i < j; i++) {
					if(obj.childNodes[i] && obj.childNodes[i].className && obj.childNodes[i].className.indexOf("jstree-anchor") !== -1) {
						tmp = obj.childNodes[i];
						break;
					}
				}
				if(tmp) {
					elm = span.cloneNode(true);
					elm.innerHTML = org + '. ';
					tmp.insertBefore(elm, tmp.childNodes[tmp.childNodes.length - 1]);
				}
			}
			return obj;
		};
	};
})(jQuery);

// selecting a node opens it
(function ($, undefined) {
	"use strict";
	$.jstree.plugins.selectopens = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this.element.on('select_node.jstree', function (e, data) { data.instance.open_node(data.node); });
		};
	};
})(jQuery);

// paste override
(function ($, undefined) {
	"use strict";
	$.jstree.plugins.nohover = function () {
		this.paste = function (obj, pos) {
			obj = this.get_node(obj);
			if(!obj || !ccp_mode || !ccp_mode.match(/^(copy_node|move_node)$/) || !ccp_node) { return false; }
			if(this[ccp_mode](ccp_node, obj, pos)) {
				this.trigger('paste', { "parent" : obj.id, "node" : ccp_node, "mode" : ccp_mode });
			}
			ccp_node = false;
			ccp_mode = false;
			ccp_inst = false;
		};
	};
})(jQuery);