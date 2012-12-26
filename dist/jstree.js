/*global XSLTProcessor: false, ActiveXObject: false, console : false */

/*
File: Helper functions
This file includes some functions that enable CSS manipulations, contextmenus, XSLT transformations and drag'n'drop.
All of those work independently of jstree.
*/

/*
Variable: $.vakata
*object* Holds all helper objects.
*/
(function ($) {
	$.vakata = {};
})(jQuery);

/*
Group: Miscellaneous
Various small snippets.
*/

/*
Function: $().vakata_reverse
Makes it possible to apply the standard array reverse function to a jQuery collection.

Input:
> <div>1</div><div>2</div><div>3</div>
> $("div").vakata_reverse().each(function () { document.write(this.innerHTML); });

Output:
>321
*/
(function ($) {
	$.fn.vakata_reverse = [].reverse;
})(jQuery);

(function ($) {
	jQuery.expr[':'].vakata_icontains = function(a,i,m){
		return (a.textContent || a.innerText || "").toLowerCase().indexOf(m[3].toLowerCase())>=0;
	};
})(jQuery);

/*
Function: $.vakata.array_remove
Makes it possible to remove an item (or a group of items) form an array.
http://ejohn.org/blog/javascript-array-remove/

Input:
> $.vakata.array_remove(['a', 'b', 'c'], 1);

Output:
>['a', 'c']
*/
(function ($) {
	$.vakata.array_remove = function(array, from, to) {
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		array.push.apply(array, rest);
		return array;
	};
})(jQuery);

/*
Function: $.vakata.array_unique
Returns only the unique items from an array.

Input:
> $.vakata.array_unique(['c','a','a','b','c','b']);

Output:
>['a', 'b', 'c']
*/
(function ($) {
	$.vakata.array_unique = function(array) {
		var a = [], i, j, l;
		for(i = 0, l = array.length; i < l; i++) {
			for(j = 0; j <= i; j++) {
				if(array[i] === array[j]) {
					break;
				}
			}
			if(j === i) { a.push(array[i]); }
		}
		return a;
	};
})(jQuery);

/*
Function: $.vakata.attributes
Collects all attributes from a DOM node.
*/
(function ($) {
	$.vakata.attributes = function(node, with_values) {
		node = $(node)[0];
		var attr = with_values ? {} : [];
		$.each(node.attributes, function (i, v) {
			if($.inArray(v.nodeName.toLowerCase(),['style','contenteditable','hasfocus','tabindex']) !== -1) { return; }
			if(v.nodeValue !== null && $.trim(v.nodeValue) !== '') {
				if(with_values) { attr[v.nodeName] = v.nodeValue; }
				else { attr.push(v.nodeName); }
			}
		});
		return attr;
	};
})(jQuery);

/*
Function: $.vakata.get_scrollbar_width
Gets the width of the scrollbar
*/
(function ($) {
	var sb;
	$.vakata.get_scrollbar_width = function () {
		var e1, e2;
		if(!sb) {
			if(/msie/.test(navigator.userAgent.toLowerCase())) {
				e1 = $('<textarea cols="10" rows="2"></textarea>').css({ position: 'absolute', top: -1000, left: 0 }).appendTo('body');
				e2 = $('<textarea cols="10" rows="2" style="overflow: hidden;"></textarea>').css({ position: 'absolute', top: -1000, left: 0 }).appendTo('body');
				sb = e1.width() - e2.width();
				e1.add(e2).remove();
			}
			else {
				e1 = $('<div />').css({ width: 100, height: 100, overflow: 'auto', position: 'absolute', top: -1000, left: 0 })
						.prependTo('body').append('<div />').find('div').css({ width: '100%', height: 200 });
				sb = 100 - e1.width();
				e1.parent().remove();
			}
		}
		return sb;
	};
})(jQuery);

/*
Group: CSS
Functions needed to manipulate stylesheets (add, remove, change)
*/
(function ($) {
	/*
		Variable: $.vakata.css
		*object* holds all CSS related functions
	*/
	$.vakata.css = {
		/*
			Function: $.vakata.css.get_css
			Retrieves or deletes a specific rule.

			Parameters:
				rule_name - *string* the rule to search for (any CSS rule)
				delete_flag - *boolean* whether you want to delete or simply retrieve a reference to the rule
				sheet - the sheet to search in (do not specify this to search in all sheets)

			Returns either:
				a reference to the rule - if it was found and the delete flag was not set
				true - if the delete flag was set and the rule was successfully removed
				false - if the rule could not be found

			See also:
				<$.vakata.css.remove_css>
		*/
		get_css : function(rule_name, delete_flag, sheet) {
			rule_name = rule_name.toLowerCase();
			var css_rules = sheet.cssRules || sheet.rules,
				j = 0;
			do {
				if(css_rules.length && j > css_rules.length + 5) { return false; }
				if(css_rules[j].selectorText && css_rules[j].selectorText.toLowerCase() === rule_name) {
					if(delete_flag === true) {
						if(sheet.removeRule) { sheet.removeRule(j); }
						if(sheet.deleteRule) { sheet.deleteRule(j); }
						return true;
					}
					else { return css_rules[j]; }
				}
			}
			while (css_rules[++j]);
			return false;
		},
		/*
			Function: $.vakata.css.add_css
			Adds a rule.

			Parameters:
				rule_name - *string* the rule to add
				sheet - a reference to the sheet to add to

			Returns either:
				a reference to the rule - if the rule was added
				false - if the rule could not be added, or if such a rule already exists
		*/
		add_css : function(rule_name, sheet) {
			if($.jstree.css.get_css(rule_name, false, sheet)) { return false; }
			if(sheet.insertRule) { sheet.insertRule(rule_name + ' { }', 0); } else { sheet.addRule(rule_name, null, 0); }
			return $.vakata.css.get_css(rule_name);
		},
		/*
			Function: $.vakata.css.remove_css
			Removes a rule, this functions is a shortcut to <$.vakata.css.get_css> with the delete flag set to true.

			Parameters:
				rule_name - *string* the rule to remove
				sheet - the sheet to remove from (you can omit this and all sheets will be searched)

			Returns either:
				true - if rule was removed
				false - if the rule could not be removed

			See also:
				<$.vakata.css.get_css>
		*/
		remove_css : function(rule_name, sheet) {
			return $.vakata.css.get_css(rule_name, true, sheet);
		},
		/*
			Function: $.vakata.css.add_sheet
			Adds a whole stylesheet or appends to an existing stylesheet.

			Parameters:
				options - *object*:
				options.url - location of the stylesheet - when this is supplied _options.str_ and _options.title_ should not be set and a new LINK element is always created
				options.str - text content of the stylesheet - when this is supplied _options.url_ is not used. A STYLE element is used.
				options.title - the ID of the added stylesheet (if you pass `foo` the ID will be `foo-stylesheet`), when the stylesheet exists the content is appended and no new stylesheet is created.

			Returns:
				a reference to the stylesheet
		*/
		add_sheet : function(opts) {
			var tmp = false, is_new = true;
			if(opts.str) {
				if(opts.title) { tmp = $("style[id='" + opts.title + "-stylesheet']")[0]; }
				if(tmp) { is_new = false; }
				else {
					tmp = document.createElement("style");
					tmp.setAttribute('type',"text/css");
					if(opts.title) { tmp.setAttribute("id", opts.title + "-stylesheet"); }
				}
				if(tmp.styleSheet) {
					if(is_new) {
						document.getElementsByTagName("head")[0].appendChild(tmp);
						tmp.styleSheet.cssText = opts.str;
					}
					else {
						tmp.styleSheet.cssText = tmp.styleSheet.cssText + " " + opts.str;
					}
				}
				else {
					tmp.appendChild(document.createTextNode(opts.str));
					document.getElementsByTagName("head")[0].appendChild(tmp);
				}
				return tmp.sheet || tmp.styleSheet;
			}
			if(opts.url) {
				if(document.createStyleSheet) {
					try { tmp = document.createStyleSheet(opts.url); } catch (e) { }
				}
				else {
					tmp			= document.createElement('link');
					tmp.rel		= 'stylesheet';
					tmp.type	= 'text/css';
					tmp.media	= "all";
					tmp.href	= opts.url;
					document.getElementsByTagName("head")[0].appendChild(tmp);
					return tmp.styleSheet;
				}
			}
		}
	};
})(jQuery);

/*
Group: Drag'n'drop
Functions needed to drag'n'drop elements
*/
(function ($) {
	// private variable
	var vakata_dnd = {
		element	: false,
		is_down	: false,
		is_drag	: false,
		helper	: false,
		helper_w: 0,
		data	: false,
		init_x	: 0,
		init_y	: 0,
		scroll_l: 0,
		scroll_t: 0,
		scroll_e: false,
		scroll_i: false
	};
	/*
		Variable: $.vakata.dnd
		*object* holds all DND related functions
	*/
	$.vakata.dnd = {
		/*
			Variable: $.vakata.dnd.settings
			*object* holds the global settings object for DND. You can easily modify any of the settings.
			>// modification example
			>$.vakata.dnd.settings.threshold = 10;
		*/
		settings : {
			/*
				Variable: $.vakata.dnd.settings.scroll_speed
				*integer* how fast (pixel count for each step) should a scrollable parent scroll when dragging near the edge. Default is _10_.
			*/
			scroll_speed		: 10,
			/*
				Variable: $.vakata.dnd.settings.scroll_proximity
				*integer* number of pixels from the edge of a scrollable parent below which the parent will start scrolling. Default is _20_.
			*/
			scroll_proximity	: 20,
			/*
				Variable: $.vakata.dnd.settings.helper_left
				*integer* number of pixels left of the cursor to move the drag-helper to. Default is _5_;
			*/
			helper_left			: 5,
			/*
				Variable: $.vakata.dnd.settings.helper_top
				*integer* number of pixels below the cursor to move the drag-helper to. Default is _10_.
			*/
			helper_top			: 10,
			/*
				Variable: $.vakata.dnd.settings.threshold
				*integer* amount of pixels required to move before the drag is started. Default is _5_.
			*/
			threshold			: 5
		},
		/*
			Function: $.vakata.dnd._trigger
			Used internally to trigger all necessary events.
		*/
		_trigger : function (event_name, e) {
			var data = $.vakata.dnd._get();
			data.event = e;
			$(document).triggerHandler("dnd_" + event_name + ".vakata", data);
		},
		/*
			Function: $.vakata.dnd._get
			Used internally to get all items for the drag event. Can be used by foreign code too.
		*/
		_get : function () {
			return {
				"data"		: vakata_dnd.data,
				"element"	: vakata_dnd.element,
				"helper"	: vakata_dnd.helper
			};
		},
		/*
			Function: $.vakata.dnd._clean
			Used internally to cleanup after a drop, so that all variables are nulled and ready for the next drag.
		*/
		_clean : function () {
			if(vakata_dnd.helper) { vakata_dnd.helper.remove(); }
			if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
			vakata_dnd = {
				element	: false,
				is_down	: false,
				is_drag	: false,
				helper	: false,
				helper_w: 0,
				data	: false,
				init_x	: 0,
				init_y	: 0,
				scroll_l: 0,
				scroll_t: 0,
				scroll_e: false,
				scroll_i: false
			};
			$(document).unbind("mousemove",	$.vakata.dnd.drag);
			$(document).unbind("mouseup",	$.vakata.dnd.stop);
		},
		/*
			Function: $.vakata.dnd._scroll
			Used internally to scroll hovered elements.

			Triggers:
			<dnd_scroll>

			Event: dnd_scroll
			Fires when a container is scrolled due to dragging near its edge. Triggered on the document, the event is fired in the *vakata* namespace.

			Parameters:
				data.event - the scrolled element
				data.data - the data you supplied when calling <$.vakata.dnd.start>
				data.element - the origin element
				data.helper - the jquery extended drag-helper node (or false if it is not used)

			Example:
			>$(document).bind("dnd_start.vakata", function (e, data) {
			>	// do something
			>});
		*/
		_scroll : function (init_only) {
			if(!vakata_dnd.scroll_e || (!vakata_dnd.scroll_l && !vakata_dnd.scroll_t)) {
				if(vakata_dnd.scroll_i) { clearInterval(vakata_dnd.scroll_i); vakata_dnd.scroll_i = false; }
				return false;
			}
			if(!vakata_dnd.scroll_i) {
				vakata_dnd.scroll_i = setInterval($.vakata.dnd._scroll, 100);
				return false;
			}
			if(init_only === true) { return false; }

			var i = vakata_dnd.scroll_e.scrollTop(),
				j = vakata_dnd.scroll_e.scrollLeft();
			vakata_dnd.scroll_e.scrollTop(i + vakata_dnd.scroll_t * $.vakata.dnd.settings.scroll_speed);
			vakata_dnd.scroll_e.scrollLeft(j + vakata_dnd.scroll_l * $.vakata.dnd.settings.scroll_speed);
			if(i !== vakata_dnd.scroll_e.scrollTop() || j !== vakata_dnd.scroll_e.scrollLeft()) {
				$.vakata.dnd._trigger("scroll", vakata_dnd.scroll_e);
			}
		},
		/*
			Function: $.vakata.dnd.start
			Use this function to start a drag (usually with the mousedown event)

			Parameters:
				event - *event* the event which started the drag, when used with the mousedown event text selection is prevented
				data - *mixed* some custom data you want to bind with that particular drag - you will receive this in all events
				html - *mixed* the text for the drag-helper as a *string*, if set to _false_ no helper is shown

			Returns:
				false

			Example:
			>$("span").bind("mousedown", function (e) {
			>	return $.vakata.dnd.start(e, {}, "Dragging");
			>});
		*/
		start : function (e, data, html) {
			if(vakata_dnd.is_drag) { $.vakata.dnd.stop({}); }
			try {
				e.currentTarget.unselectable = "on";
				e.currentTarget.onselectstart = function() { return false; };
				if(e.currentTarget.style) { e.currentTarget.style.MozUserSelect = "none"; }
			} catch(err) { }
			vakata_dnd.init_x	= e.pageX;
			vakata_dnd.init_y	= e.pageY;
			vakata_dnd.data		= data;
			vakata_dnd.is_down	= true;
			vakata_dnd.element	= e.currentTarget;
			if(html !== false) {
				vakata_dnd.helper = $("<div id='vakata-dnd'></div>").html(html).css({
					"display"		: "block",
					"margin"		: "0",
					"padding"		: "0",
					"position"		: "absolute",
					"top"			: "-2000px",
					"lineHeight"	: "16px",
					"zIndex"		: "10000"
				});
			}
			$(document).bind("mousemove", $.vakata.dnd.drag);
			$(document).bind("mouseup", $.vakata.dnd.stop);
			return false;
		},
		/*
			Function: $.vakata.dnd.drag
			Used internally to process the mousemove event after <$.vakata.dnd.start> is called.

			Parameters:
				event - *event* the mousemove event

			Triggers:
			<dnd_start>, <dnd_move>
		*/
		drag : function (e) {
			if(!vakata_dnd.is_down) { return; }
			if(!vakata_dnd.is_drag) {
				if(
					Math.abs(e.pageX - vakata_dnd.init_x) > $.vakata.dnd.settings.threshold ||
					Math.abs(e.pageY - vakata_dnd.init_y) > $.vakata.dnd.settings.threshold
				) {
					if(vakata_dnd.helper) {
						vakata_dnd.helper.appendTo("body");
						vakata_dnd.helper_w = vakata_dnd.helper.outerWidth();
					}
					vakata_dnd.is_drag = true;
					/*
						Event: dnd_start
						Marks the start of the drag. Triggered on the document after a drag is initiated using <$.vakata.dnd.start> and the user has moved more than <$.vakata.dnd.settings.threshold> pixels, the event is fired in the *vakata* namespace.

						Parameters:
							data.event - the mousemove event
							data.data - the data you supplied when calling <$.vakata.dnd.start>
							data.element - the origin element
							data.helper - the jquery extended drag-helper node (or false if it is not used)

						Example:
						>$(document).bind("dnd_start.vakata", function (e, data) {
						>	// do something
						>});
					*/
					$.vakata.dnd._trigger("start", e);
				}
				else { return; }
			}

			var d  = false, w  = false,
				dh = false, wh = false,
				dw = false, ww = false,
				dt = false, dl = false,
				ht = false, hl = false;

			vakata_dnd.scroll_t = 0;
			vakata_dnd.scroll_l = 0;
			vakata_dnd.scroll_e = false;
			var p = $(e.target)
				.parentsUntil("body").andSelf().vakata_reverse()
				.filter(function () {
					return	(/^auto|scroll$/).test($(this).css("overflow")) &&
							(this.scrollHeight > this.offsetHeight || this.scrollWidth > this.offsetWidth);
				})
				.each(function () {
					var t = $(this), o = t.offset();
					if(this.scrollHeight > this.offsetHeight) {
						if(o.top + t.height() - e.pageY < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
						if(e.pageY - o.top < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_t = -1; }
					}
					if(this.scrollWidth > this.offsetWidth) {
						if(o.left + t.width() - e.pageX < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
						if(e.pageX - o.left < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_l = -1; }
					}
					if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
						vakata_dnd.scroll_e = $(this);
						return false;
					}
				});

			if(!vakata_dnd.scroll_e) {
				d  = $(document); w = $(window);
				dh = d.height(); wh = w.height();
				dw = d.width(); ww = w.width();
				dt = d.scrollTop(); dl = d.scrollLeft();
				if(dh > wh && e.pageY - dt < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_t = -1;  }
				if(dh > wh && wh - (e.pageY - dt) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; }
				if(dw > ww && e.pageX - dl < $.vakata.dnd.settings.scroll_proximity)		{ vakata_dnd.scroll_l = -1; }
				if(dw > ww && ww - (e.pageX - dl) < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; }
				if(vakata_dnd.scroll_t || vakata_dnd.scroll_l) {
					vakata_dnd.scroll_e = d;
				}
			}
			if(vakata_dnd.scroll_e) { $.vakata.dnd._scroll(true); }

			if(vakata_dnd.helper) {
				ht = parseInt(e.pageY + $.vakata.dnd.settings.helper_top, 10);
				hl = parseInt(e.pageX + $.vakata.dnd.settings.helper_left, 10);
				if(dh && ht + 25 > dh) { ht = dh - 50; }
				if(dw && hl + vakata_dnd.helper_w > dw) { hl = dw - (vakata_dnd.helper_w + 2); }
				vakata_dnd.helper.css({
					left	: hl + "px",
					top		: ht + "px"
				});
			}
			/*
				Event: dnd_move
				Triggered multiple times while dragging. This event is triggered on the document after the <dnd_start> event when the user moves the mouse, the event is fired in the *vakata* namespace.

				Parameters:
					data.event - the mousemove event
					data.data - the data you supplied when calling <$.vakata.dnd.start>
					data.element - the origin element
					data.helper - the jquery extended drag-helper node (or false if it is not used)

				Example:
				>$(document).bind("dnd_move.vakata", function (e, data) {
				>	// do something
				>});
			*/
			$.vakata.dnd._trigger("move", e);
		},
		/*
			Function: $.vakata.dnd.stop
			Used internally to process the mouseup event (drop) after <$.vakata.dnd.start> is called.

			Parameters:
				event - *event* the mouseup event

			Triggers:
			<dnd_stop>
		*/
		stop : function (e) {
			/*
				Event: dnd_stop
				Marks the end of the drag. This event is triggered on the document after <dnd_start> (and possibly <dnd_move>) when a drop (mouseup) occurs or when the drag is programatically terminated, the event is fired in the *vakata* namespace.

				Parameters:
					data.event - the mouseup event (or _null_ if stopped programatically using <$.vakata.dnd.stop>())
					data.data - the data you supplied when calling <$.vakata.dnd.start>
					data.element - the origin element
					data.helper - the jquery extended drag-helper node (or false if it is not used)

				Example:
				>$(document).bind("dnd_stop.vakata", function (e, data) {
				>	// do something
				>});
			*/
			if(vakata_dnd.is_drag) {
				$.vakata.dnd._trigger("stop", e);
			}
			$.vakata.dnd._clean();
		}
	};
})(jQuery);

/*
Group: XSLT
A function used to do XSLT transformations.
*/
(function ($) {
	/*
		Function: $.vakata.xslt
		This functions transforms a XML string using a XSL string. The result is passed to a callback function.

		Parameters:
			xml - *string* the source xml string
			xsl - *string* the xsl string

		Returns:
			the transformed result (or _false_ on failure)

		Example:
		>// simple
		>$.vakata.xslt("<xml-string-here>", "<xsl-string-here>", function (res) { $("#some-container").append(res); });
		>// with scope
		>$.vakata.xslt("<xml-string-here>", "<xsl-string-here>", $.proxy(function (res) {
		>	this.some_process(res);
		>}, some_object);
	*/
	$.vakata.xslt = function (xml, xsl) {
		var r = false, p, q, s;
		// IE9
		if(r === false && window.ActiveXObject) {
			try {
				r = new ActiveXObject("Msxml2.XSLTemplate");
				q = new ActiveXObject("Msxml2.DOMDocument");
				q.loadXML(xml);
				s = new ActiveXObject("Msxml2.FreeThreadedDOMDocument");
				s.loadXML(xsl);
				r.stylesheet = s;
				p = r.createProcessor();
				p.input = q;
				p.transform();
				r = p.output;
			}
			catch (e) { }
		}
		xml = $.parseXML(xml);
		xsl = $.parseXML(xsl);
		// FF, Chrome
		if(r === false && typeof (XSLTProcessor) !== "undefined") {
			p = new XSLTProcessor();
			p.importStylesheet(xsl);
			r = p.transformToFragment(xml, document);
			r = $('<div />').append(r).html();
		}
		// OLD IE
		if(r === false && typeof (xml.transformNode) !== "undefined") {
			r = xml.transformNode(xsl);
		}
		return r;
	};
})(jQuery);

/*
Group: Hotkeys
Copy of the John Resig's fork of http://github.com/tzuryby/hotkeys for consistency
*/
if(typeof jQuery.hotkeys === "undefined") {
	(function ($) {
			$.vakata_hotkeys = {
				version: "0.8",

				specialKeys: {
					8: "backspace", 9: "tab", 13: "return", 16: "shift", 17: "ctrl", 18: "alt", 19: "pause",
					20: "capslock", 27: "esc", 32: "space", 33: "pageup", 34: "pagedown", 35: "end", 36: "home",
					37: "left", 38: "up", 39: "right", 40: "down", 45: "insert", 46: "del",
					96: "0", 97: "1", 98: "2", 99: "3", 100: "4", 101: "5", 102: "6", 103: "7",
					104: "8", 105: "9", 106: "*", 107: "+", 109: "-", 110: ".", 111 : "/",
					112: "f1", 113: "f2", 114: "f3", 115: "f4", 116: "f5", 117: "f6", 118: "f7", 119: "f8",
					120: "f9", 121: "f10", 122: "f11", 123: "f12", 144: "numlock", 145: "scroll", 191: "/", 224: "meta"
				},

				shiftNums: {
					"`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
					"8": "*", "9": "(", "0": ")", "-": "_", "=": "+", ";": ": ", "'": "\"", ",": "<",
					".": ">",  "/": "?",  "\\": "|"
				}
			};

			function keyHandler( handleObj ) {
				// Only care when a possible input has been specified
				if ( typeof handleObj.data !== "string" ) {
					return;
				}

				var origHandler = handleObj.handler,
					keys = handleObj.data.toLowerCase().split(" ");

				handleObj.handler = function( event ) {
					// Don't fire in text-accepting inputs that we didn't directly bind to
					if ( this !== event.target && (/textarea|select/i.test( event.target.nodeName ) ||
						event.target.type === "text") ) {
						return;
					}

					// Keypress represents characters, not special keys
					var special = event.type !== "keypress" && jQuery.vakata_hotkeys.specialKeys[ event.which ],
						character = String.fromCharCode( event.which ).toLowerCase(),
						key, modif = "", possible = {};

					// check combinations (alt|ctrl|shift+anything)
					if ( event.altKey && special !== "alt" ) {
						modif += "alt+";
					}

					if ( event.ctrlKey && special !== "ctrl" ) {
						modif += "ctrl+";
					}

					// TODO: Need to make sure this works consistently across platforms
					if ( event.metaKey && !event.ctrlKey && special !== "meta" ) {
						modif += "meta+";
					}

					if ( event.shiftKey && special !== "shift" ) {
						modif += "shift+";
					}

					if ( special ) {
						possible[ modif + special ] = true;

					} else {
						possible[ modif + character ] = true;
						possible[ modif + jQuery.vakata_hotkeys.shiftNums[ character ] ] = true;

						// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
						if ( modif === "shift+" ) {
							possible[ jQuery.vakata_hotkeys.shiftNums[ character ] ] = true;
						}
					}

					for ( var i = 0, l = keys.length; i < l; i++ ) {
						if ( possible[ keys[i] ] ) {
							return origHandler.apply( this, arguments );
						}
					}
				};
			}

			jQuery.each([ "keydown", "keyup", "keypress" ], function() {
				jQuery.event.special[ this ] = { add: keyHandler };
			});
	})(jQuery);
}

/*
Group: Context menu
Functions needed to show a custom context menu.
*/
(function ($) {
	var right_to_left = false,
		vakata_context = {
			element		: false,
			reference	: false,
			position_x	: 0,
			position_y	: 0,
			items		: [],
			html		: "",
			is_visible	: false
		};
	/*
		Variable: $.vakata.context
		*object* holds all context menu related functions and variables.
	*/
	$.vakata.context = {
		/*
			Variable: $.vakata.context.settings
			*object* holds the global settings object for context menus. You can easily modify any of the settings.
			>// modification example
			>$.vakata.context.settings.icons = false;
		*/
		settings : {
			/*
				Variable: $.vakata.context.settings.hide_onmouseleave
				*integer* the amount of milliseconds to wait before hiding the menu after mouseleave. If set to _0_ the menu won't hide on mouseleave. Default is _0_.
			*/
			hide_onmouseleave	: 0,
			/*
				Variable: $.vakata.context.settings.icons
				*boolean* whether to show icons or not. Default is _true_.
			*/
			icons				: true
		},
		/*
			Function: $.vakata.context._trigger
			Used internally to trigger all necessary events.
		*/
		_trigger : function (event_name) {
			$(document).triggerHandler("context_" + event_name + ".vakata", {
				"reference"	: vakata_context.reference,
				"element"	: vakata_context.element,
				"position"	: {
					"x" : vakata_context.position_x,
					"y" : vakata_context.position_y
				}
			});
		},
		/*
			Function: $.vakata.context._execute
			Used internally to execute the action (if any) associated with an item.

			Parameters:
				i - the item's internal index
		*/
		_execute : function (i) {
			i = vakata_context.items[i];
			return i && !i._disabled && i.action ? i.action.call(null, {
						"item"		: i,
						"reference"	: vakata_context.reference,
						"element"	: vakata_context.element,
						"position"	: {
							"x" : vakata_context.position_x,
							"y" : vakata_context.position_y
						}
					}) : false;
		},
		/*
			Function: $.vakata.context._parse
			Used internally to parse a contextmenu description object to an HTML string.

			Parameters:
				o - *object* the contextmenu description object
				is_callback - *boolean* used internally to indicate a recursive call

			Triggers:
			<context_parse>
		*/
		_parse : function (o, is_callback) {
			if(!o) { return false; }
			if(!is_callback) {
				vakata_context.html		= "";
				vakata_context.items	= [];
			}
			var str = "",
				sep = false,
				tmp;

			if(is_callback) { str += "<ul>"; }
			$.each(o, function (i, val) {
				if(!val) { return true; }
				vakata_context.items.push(val);
				if(!sep && val.separator_before) {
					str += "<li class='vakata-context-separator'><a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;</a></li>";
				}
				sep = false;
				str += "<li class='" + (val._class || "") + (val._disabled ? " vakata-contextmenu-disabled " : "") + "'>";
				str += "<a href='#' rel='" + (vakata_context.items.length - 1) + "'>";
				if($.vakata.context.settings.icons) {
					str += "<ins ";
					if(val.icon) {
						if(val.icon.indexOf("/") !== -1)	{ str += " style='background:url(\"" + val.icon + "\") center center no-repeat' "; }
						else								{ str += " class='" + val.icon + "' "; }
					}
					str += ">&#160;</ins><span>&#160;</span>";
				}
				str += val.label + "</a>";
				if(val.submenu) {
					tmp = $.vakata.context._parse(val.submenu, true);
					if(tmp) { str += tmp; }
				}
				str += "</li>";
				if(val.separator_after) {
					str += "<li class='vakata-context-separator'><a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;</a></li>";
					sep = true;
				}
			});
			str  = str.replace(/<li class\='vakata-context-separator'\><\/li\>$/,"");
			if(is_callback) { str += "</ul>"; }
			/*
				Event: context_parse
				Triggered when the context menu is parsed but not yet shown. This event is triggered on the document in the *vakata* namespace.

				Parameters:
					reference - the DOM node used when <$.vakata.context.show> was called
					element - the DOM node of the context menu (not yet populated and shown)
					position - an object consisting of _x_ and _y_ keys, represinting the position of the menu (not yet shown)

				Example:
				>$(document).bind("context_parse.vakata", function (e, data) {
				>	// do something
				>});
			*/
			if(!is_callback) { vakata_context.html = str; $.vakata.context._trigger("parse"); }
			return str.length > 10 ? str : false;
		},
		/*
			Function: $.vakata.context._show_submenu
			Used internally to show a submenu
		*/
		_show_submenu : function (o) {
			o = $(o);
			if(!o.length || !o.children("ul").length) { return; }
			var e = o.children("ul"),
				x = o.offset().left + o.outerWidth(),
				y = o.offset().top,
				w = e.width(),
				h = e.height(),
				dw = $(window).width() + $(window).scrollLeft(),
				dh = $(window).height() + $(window).scrollTop();
			// може да се спести е една проверка - дали няма някой от класовете вече нагоре
			if(right_to_left) {
				o[x - (w + 10 + o.outerWidth()) < 0 ? "addClass" : "removeClass"]("vakata-context-left");
			}
			else {
				o[x + w + 10 > dw ? "addClass" : "removeClass"]("vakata-context-right");
			}
			if(y + h + 10 > dh) {
				e.css("bottom","-1px");
			}
			e.show();
		},

		/*
			Function: $.vakata.context.show
			Shows the context menu. Please note that at least one of _reference_ or _position_ should be specified.

			Parameters:
				reference - *jquery* associate the menu with a DOM element (optional)
				position - *object* should contain _x_ and _y_ properties, those are the coordinates to show the menu at (optional
				data - *object* the contextmenu description object. It should consist of keys, each key should be a <context_menu_item>. If not specified the function will search for $(reference).data('vakata_contextmenu') and use that.

			Triggers:
			<context_show>

			Example:
			>$(document).bind("contextmenu", function (e) {
			>	e.preventDefault();
			>	$.vakata.context.show(false, { x: e.pageX, y:e.pageY }, {
			>		"create" : {
			>			// only specify what you need
			>			"separator_after"	: true,
			>			"label"				: "Create",
			>			"action"			: function (data) { alert("Create"); }
			>		},
			>		"rename" : {
			>			"label"		: "Rename",
			>			"icon"		: "./some-icon.png",
			>			"action"	: function (data) { alert("Rename on " + data.reference); }
			>		},
			>		"edit" : {
			>			"label"	: "Edit",
			>			// Clicking this won't hide the menu, the same can be achieved with:
			>			// "action" : function () { return false; }
			>			"submenu" : {
			>				"copy"	: { "label" : "Copy", "action" : function () { } },
			>				"cut"	: { "label" : "Cut", "action" : function () { } },
			>				"paste"	: { "label" : "Paste", "_disabled" : true, "action" : function () { } }
			>			}
			>		},
			>		"delete" : {
			>			"separator_before"	: true,
			>			"label"				: "Delete",
			>			"action"			: function (data) { alert("Delete"); }
			>		}
			>	});
			>});

			Variable: context_menu_item
			*object* Used to construct a context menu entry, this structure will always be a part of an object.

				separator_before - *boolean* should there be a separator before the item. Default is _false_.
				separator_after - *boolean* should there be a separator after the item. Default is _false_.
				icon - *string* if supplied this string is used for an icon, if it contains _/_ it is treated as file, otherwise it is applied as a class on an INS object.
				label - *string* the text for this item
				submenu - *object* if supplied this object is used to build a submenu. It should consist of keys, each of which is a <context_menu_item>.
				_class - *string* if supplied this class is applied to the LI node.
				_disabled - *boolean* is this item disabled.
				action - *functon* if supplied it will be executed when this item is clicked / activated. If not supplied or the function returns _false_ the contextmenu won't be hidden after execution. To force a context use _$.proxy_.
				In the function you will receive a single argument which is an object, consisting of four keys:
				_item_ (the <context_menu_item> object),
				_reference_ (the DOM node used when <$.vakata.context.show> was called),
				_element_ (the DOM node of the context menu),
				_position_ (an object consisting of _x_ and _y_ keys, represinting the current position of the menu)

			See also:
				<$.vakata.context.show>
		*/
		show : function (reference, position, data) {
			if(vakata_context.element && vakata_context.element.length) {
				vakata_context.element.width('');
			}
			switch(!0) {
				case (!position && !reference):
					return false;
				case (!!position && !!reference):
					vakata_context.reference	= reference;
					vakata_context.position_x	= position.x;
					vakata_context.position_y	= position.y;
					break;
				case (!position && !!reference):
					vakata_context.reference	= reference;
					var o = reference.offset();
					vakata_context.position_x	= o.left + reference.outerHeight();
					vakata_context.position_y	= o.top;
					break;
				case (!!position && !reference):
					vakata_context.position_x	= position.x;
					vakata_context.position_y	= position.y;
					break;
			}
			if(!!reference && !data && $(reference).data('vakata_contextmenu')) {
				data = $(reference).data('vakata_contextmenu');
			}
			if($.vakata.context._parse(data)) {
				vakata_context.element.html(vakata_context.html);
			}
			if(vakata_context.items.length) {
				var e = vakata_context.element,
					x = vakata_context.position_x,
					y = vakata_context.position_y,
					w = e.width(),
					h = e.height(),
					dw = $(window).width() + $(window).scrollLeft(),
					dh = $(window).height() + $(window).scrollTop();
				if(right_to_left) {
					x -= e.outerWidth();
					if(x < $(window).scrollLeft() + 20) {
						x = $(window).scrollLeft() + 20;
					}
				}
				if(x + w + 20 > dw) {
					x = dw - (w + 20);
				}
				if(y + h + 20 > dh) {
					y = dh - (h + 20);
				}

				vakata_context.element
					.css({ "left" : x, "top" : y })
					.show()
					.width(vakata_context.element.outerWidth()); // for ie6
				vakata_context.is_visible = true;
				/*
					Event: context_show
					Triggered when the context menu is shown. This event is triggered on the document in the *vakata* namespace.

					Parameters:
						reference - the DOM node used when <$.vakata.context.show> was called
						element - the DOM node of the context menu
						position - an object consisting of _x_ and _y_ keys, represinting the position of the menu

					Example:
					>$(document).bind("context_show.vakata", function (e, data) {
					>	// do something
					>});
				*/
				$.vakata.context._trigger("show");
			}
		},
		/*
			Function: $.vakata.context.hide
			Used internally to hide the contextmenu after a click, or on mouseleave, etc.

			Triggers:
			<context_hide>
		*/
		hide : function () {
			if(vakata_context.is_visible) {
				vakata_context.element.hide().find("ul").hide();
				vakata_context.is_visible = false;
				/*
					Event: context_hide
					Triggered when the context menu is hidden. This event is triggered on the document in the *vakata* namespace.

					Parameters:
						reference - the DOM node used when <$.vakata.context.show> was called
						element - the DOM node of the context menu
						position - an object consisting of _x_ and _y_ keys, represinting the position of the menu

					Example:
					>$(document).bind("context_hide.vakata", function (e, data) {
					>	// do something
					>});
				*/
				$.vakata.context._trigger("hide");
			}
		}
	};
	$(function () {
		right_to_left = $("body").css("direction") === "rtl";
		var to			= false,
			css_string	= '' +
			'.vakata-context { display:none; _width:1px; } ' +
			'.vakata-context, ' +
			'.vakata-context ul { margin:0; padding:2px; position:absolute; background:#f5f5f5; border:1px solid #979797; ' +
			'	-moz-box-shadow:5px 5px 4px -4px #666666; -webkit-box-shadow:2px 2px 2px #999999; box-shadow:2px 2px 2px #999999; }'  +
			'.vakata-context ul { list-style:none; left:100%; margin-top:-2.7em; margin-left:-4px; } ' +
			'.vakata-context li.vakata-context-right ul { left:auto; right:100%; margin-left:auto; margin-right:-4px; } ' +
			'.vakata-context li { list-style:none; display:inline; }' +
			'.vakata-context li a { display:block; padding:0 2em 0 2em; text-decoration:none; width:auto; color:black; white-space:nowrap; line-height:2.4em; ' +
			'	-moz-text-shadow:1px 1px 0px white; -webkit-text-shadow:1px 1px 0px white; text-shadow:1px 1px 0px white; ' +
			'	-moz-border-radius:1px; -webkit-border-radius:1px; border-radius:1px; }' +
			'.vakata-context li a:hover { position:relative; background-color:#e8eff7; ' +
			'	-moz-box-shadow:0px 0px 2px #0a6aa1; -webkit-box-shadow:0px 0px 2px #0a6aa1; box-shadow:0px 0px 2px #0a6aa1; }' +
			'.vakata-context li.vakata-context-hover > a { position:relative; background-color:#e8eff7; ' +
			'	-moz-box-shadow:0px 0px 2px #0a6aa1; -webkit-box-shadow:0px 0px 2px #0a6aa1; box-shadow:0px 0px 2px #0a6aa1; }' +
			'.vakata-context li a.vakata-context-parent { background-image:url("data:image/gif;base64,R0lGODlhCwAHAIAAACgoKP///yH5BAEAAAEALAAAAAALAAcAAAIORI4JlrqN1oMSnmmZDQUAOw=="); background-position:right center; background-repeat:no-repeat; } ' +
			'.vakata-context li.vakata-context-separator a, ' +
			'.vakata-context li.vakata-context-separator a:hover { background:white; border:0; border-top:1px solid #e2e3e3; height:1px; min-height:1px; max-height:1px; padding:0; margin:0 0 0 2.4em; border-left:1px solid #e0e0e0; _overflow:hidden; ' +
			'	-moz-text-shadow:0 0 0 transparent; -webkit-text-shadow:0 0 0 transparent; text-shadow:0 0 0 transparent; ' +
			'	-moz-box-shadow:0 0 0 transparent; -webkit-box-shadow:0 0 0 transparent; box-shadow:0 0 0 transparent; ' +
			'	-moz-border-radius:0; -webkit-border-radius:0; border-radius:0; }' +
			'.vakata-context li.vakata-contextmenu-disabled a, .vakata-context li.vakata-contextmenu-disabled a:hover { color:silver; background-color:transparent; border:0; box-shadow:0 0 0; }' +
			'' +
			'.vakata-context li a ins { text-decoration:none; display:inline-block; width:2.4em; height:2.4em; background:transparent; margin:0 0 0 -2em; } ' +
			'.vakata-context li a span { display:inline-block; width:1px; height:2.4em; background:white; margin:0 0.5em 0 0; border-left:1px solid #e2e3e3; _overflow:hidden; } ' +
			'' +
			'.vakata-context-rtl ul { left:auto; right:100%; margin-left:auto; margin-right:-4px; } ' +
			'.vakata-context-rtl li a.vakata-context-parent { background-image:url("data:image/gif;base64,R0lGODlhCwAHAIAAACgoKP///yH5BAEAAAEALAAAAAALAAcAAAINjI+AC7rWHIsPtmoxLAA7"); background-position:left center; background-repeat:no-repeat; } ' +
			'.vakata-context-rtl li.vakata-context-separator a { margin:0 2.4em 0 0; border-left:0; border-right:1px solid #e2e3e3;} ' +
			'.vakata-context-rtl li.vakata-context-left ul { right:auto; left:100%; margin-left:-4px; margin-right:auto; } ' +
			'.vakata-context-rtl li a ins { margin:0 -2em 0 0; } ' +
			'.vakata-context-rtl li a span { margin:0 0 0 0.5em; border-left-color:white; background:#e2e3e3; } ' +
			'';
		$.vakata.css.add_sheet({ str : css_string, title : "vakata-context" });

		vakata_context.element = $("<ul class='vakata-context'></ul>");
		vakata_context.element
			.delegate("li", "mouseenter", function (e) {
				e.stopImmediatePropagation();

				if($.contains(this, e.relatedTarget)) {
					// премахнато заради delegate mouseleave по-долу
					// $(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
					return;
				}

				if(to) { clearTimeout(to); }
				vakata_context.element.find(".vakata-context-hover").removeClass("vakata-context-hover").end();

				$(this)
					.siblings().find("ul").hide().end().end()
					.parentsUntil(".vakata-context", "li").andSelf().addClass("vakata-context-hover");
				$.vakata.context._show_submenu(this);
			})
			// тестово - дали не натоварва?
			.delegate("li", "mouseleave", function (e) {
				if($.contains(this, e.relatedTarget)) { return; }
				$(this).find(".vakata-context-hover").andSelf().removeClass("vakata-context-hover");
			})
			.bind("mouseleave", function (e) {
				$(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
				if($.vakata.context.settings.hide_onmouseleave) {
					to = setTimeout(
						(function (t) {
							return function () { $.vakata.context.hide(); };
						})(this), $.vakata.context.settings.hide_onmouseleave);
				}
			})
			.delegate("a", "click", function (e) {
				e.preventDefault();
			})
			.delegate("a", "mouseup", function (e) {
				if(!$(this).blur().parent().hasClass("vakata-context-disabled") && $.vakata.context._execute($(this).attr("rel")) !== false) {
					$.vakata.context.hide();
				}
			})
			.appendTo("body");

		$(document)
			.bind("mousedown", function (e) {
				if(vakata_context.is_visible && !$.contains(vakata_context.element[0], e.target)) { $.vakata.context.hide(); }
			})
			.bind("context_show.vakata", function (e, data) {
				vakata_context.element.find("li:has(ul)").children("a").addClass("vakata-context-parent");
				if(right_to_left) {
					vakata_context.element.addClass("vakata-context-rtl").css("direction", "rtl");
				}
				// also apply a RTL class?
				vakata_context.element.find("ul").hide().end();
			});

		if(typeof $.hotkeys !== "undefined" || typeof $.vakata_hotkeys !== "undefined") {
			$(document)
				.bind("keydown", "up", function (e) {
					if(vakata_context.is_visible) {
						var o = vakata_context.element.find("ul:visible").andSelf().last().children(".vakata-context-hover").removeClass("vakata-context-hover").prevAll("li:not(.vakata-context-separator)").first();
						if(!o.length) { o = vakata_context.element.find("ul:visible").andSelf().last().children("li:not(.vakata-context-separator)").last(); }
						o.addClass("vakata-context-hover");
						e.stopImmediatePropagation();
						e.preventDefault();
					}
				})
				.bind("keydown", "down", function (e) {
					if(vakata_context.is_visible) {
						var o = vakata_context.element.find("ul:visible").andSelf().last().children(".vakata-context-hover").removeClass("vakata-context-hover").nextAll("li:not(.vakata-context-separator)").first();
						if(!o.length) { o = vakata_context.element.find("ul:visible").andSelf().last().children("li:not(.vakata-context-separator)").first(); }
						o.addClass("vakata-context-hover");
						e.stopImmediatePropagation();
						e.preventDefault();
					}
				})
				.bind("keydown", "right", function (e) {
					if(vakata_context.is_visible) {
						vakata_context.element.find(".vakata-context-hover").last().children("ul").show().children("li:not(.vakata-context-separator)").removeClass("vakata-context-hover").first().addClass("vakata-context-hover");
						e.stopImmediatePropagation();
						e.preventDefault();
					}
				})
				.bind("keydown", "left", function (e) {
					if(vakata_context.is_visible) {
						vakata_context.element.find(".vakata-context-hover").last().parents("li:eq(0)").find("ul").hide().find(".vakata-context-hover").removeClass("vakata-context-hover");
						e.stopImmediatePropagation();
						e.preventDefault();
					}
				})
				.bind("keydown", "esc", function (e) {
					$.vakata.context.hide();
					e.preventDefault();
				})
				.bind("keydown", "space", function (e) {
					vakata_context.element.find(".vakata-context-hover").last().children("a").click();
					e.preventDefault();
				});
		}
	});
})(jQuery);

/*
Group: JSON
Functions needed to encode/decode JSON. Based on the jQuery JSON Plugin.
*/
(function ($) {
	// private function for quoting strings
	var _quote = function (str) {
		var escapeable	= /["\\\x00-\x1f\x7f-\x9f]/g,
			meta		= { '\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"' :'\\"','\\':'\\\\' };
		if(str.match(escapeable)) {
			return '"' + str.replace(escapeable, function (a) {
					var c = meta[a];
					if(typeof c === 'string') { return c; }
					c = a.charCodeAt();
					return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16);
				}) + '"';
		}
		return '"' + str + '"';
	};
	/*
		Variable: $.vakata.json
		*object* holds all JSON related functions.
	*/
	$.vakata.json = {
		/*
			Function: $.vakata.json.encode
			A function for encoding data in a JSON notated string.

			Parameters:
				o - *mixed* the data to be encoded

			Returns:
				string - the encoded data
		*/
		encode : function (o) {
			if (o === null) { return "null"; }

			var tmp = [], i;
			switch(typeof(o)) {
				case "undefined":
					return undefined;
				case "number":
				case "boolean":
					return o + "";
				case "string":
					return _quote(o);
				case "object":
					if($.isFunction(o.toJSON)) {
						return $.vakata.json.encode(o.toJSON());
					}
					if(o.constructor === Date) {
						return '"' +
							o.getUTCFullYear() + '-' +
							String("0" + (o.getUTCMonth() + 1)).slice(-2) + '-' +
							String("0" + o.getUTCDate()).slice(-2) + 'T' +
							String("0" + o.getUTCHours()).slice(-2) + ':' +
							String("0" + o.getUTCMinutes()).slice(-2) + ':' +
							String("0" + o.getUTCSeconds()).slice(-2) + '.' +
							String("00" + o.getUTCMilliseconds()).slice(-3) + 'Z"';
					}
					if(o.constructor === Array) {
						for(i = 0; i < o.length; i++) {
							tmp.push( $.vakata.json.encode(o[i]) || "null" );
						}
						return "[" + tmp.join(",") + "]";
					}

					$.each(o, function (i, v) {
						if($.isFunction(v)) { return true; }
						i = typeof i === "number" ? '"' + i + '"' : _quote(i);
						v = $.vakata.json.encode(v);
						tmp.push(i + ":" + v);
					});
					return "{" + tmp.join(", ") + "}";
			}
		},
		/*
			Function: $.vakata.json.decode
			Exists for consistency and is a simple wrapper for jQuery.parseJSON.

			Parameters:
				json - the string to be decoded

			Returns:
				Same as jQuery.parseJSON
		*/
		decode : function (json) {
			return $.parseJSON(json);
		}
	};
})(jQuery);

/*
Group: Cookie
A copy of the jQuery cookie plugin.
*/
(function ($, document, undefined) {
	/*
		Function: $.vakata.cookie
		A function for getting and setting cookies.

		Parameters:
			Same as the original plugin

		Returns:
			string - the encoded data
	*/
	var raw		= function (s) { return s; },
		decoded	= function (s) { return decodeURIComponent(s.replace(/\+/g, ' ')); };
	var config = $.vakata.cookie = function (key, value, options) {
		// write
		if (value !== undefined) {
			options = $.extend({}, config.defaults, options);

			if (value === null) {
				options.expires = -1;
			}

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setDate(t.getDate() + days);
			}

			value = config.json ? $.vakata.json.encode(value) : String(value);

			return (document.cookie = [
				encodeURIComponent(key), '=', config.raw ? value : encodeURIComponent(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}
		// read
		var decode = config.raw ? raw : decoded;
		var cookies = document.cookie.split('; ');
		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			if (decode(parts.shift()) === key) {
				var cookie = decode(parts.join('='));
				return config.json ? $.vakata.json.decode(cookie) : cookie;
			}
		}
		return null;
	};
	config.defaults = {};
	$.vakata.removeCookie = function (key, options) {
		if ($.cookie(key) !== null) {
			$.cookie(key, null, options);
			return true;
		}
		return false;
	};
})(jQuery, document);

/*
Group: LocalStorage
Functions for dealing with localStorage with fallback to userData or cookies. A slight modification of jstorage.
*/
(function ($) {
	var _storage = {},
		_storage_service = {jStorage:"{}"},
		_storage_elm = null,
		_storage_size = 0,
		json_encode = $.vakata.json.encode,
		json_decode = $.vakata.json.decode,
		_backend = false,
		_ttl_timeout = false;

	function _init() {
		var localStorageReallyWorks = false;
		if("localStorage" in window){
			try {
				window.localStorage.setItem('_tmptest', 'tmpval');
				localStorageReallyWorks = true;
				window.localStorage.removeItem('_tmptest');
			} catch(BogusQuotaExceededErrorOnIos5) {
				// Thanks be to iOS5 Private Browsing mode which throws
				// QUOTA_EXCEEDED_ERRROR DOM Exception 22.
			}
		}

		if(localStorageReallyWorks){
			try {
				if(window.localStorage) {
					_storage_service = window.localStorage;
					_backend = "localStorage";
				}
			} catch(E3) {/* Firefox fails when touching localStorage and cookies are disabled */}
		}
		else if("globalStorage" in window) {
			try {
				if(window.globalStorage) {
					_storage_service = window.globalStorage[window.location.hostname];
					_backend = "globalStorage";
				}
			} catch(E4) {/* Firefox fails when touching localStorage and cookies are disabled */}
		}
		else {
			_storage_elm = document.createElement('link');
			if(_storage_elm.addBehavior) {
				_storage_elm.style.behavior = 'url(#default#userData)';
				document.getElementsByTagName('head')[0].appendChild(_storage_elm);
				try {
					_storage_elm.load("jStorage");
					var data = "{}";
					data = _storage_elm.getAttribute("jStorage");
					_storage_service.jStorage = data;
					_backend = "userDataBehavior";
				} catch(E5) {}
			}
			if(
				!_backend && (
					!!$.vakata.cookie('__vjstorage') ||
					($.vakata.cookie('__vjstorage', '{}', { 'expires' : 365 }) && $.vakata.cookie('__vjstorage') === '{}')
				)
			) {
				_storage_elm = null;
				_storage_service.jStorage = $.vakata.cookie('__vjstorage');
				_backend = "cookie";
			}

			if(!_backend) {
				_storage_elm = null;
				return;
			}
		}
		_load_storage();
		_handleTTL();
	}

	function _load_storage() {
		if(_storage_service.jStorage) {
			try {
				_storage = json_decode(String(_storage_service.jStorage));
			} catch(E6) { _storage_service.jStorage = "{}"; }
		} else {
			_storage_service.jStorage = "{}";
		}
		_storage_size = _storage_service.jStorage ? String(_storage_service.jStorage).length : 0;
	}

	function _save() {
		try {
			_storage_service.jStorage = json_encode(_storage);
			if(_backend === 'userDataBehavior') {
				_storage_elm.setAttribute("jStorage", _storage_service.jStorage);
				_storage_elm.save("jStorage");
			}
			if(_backend === 'cookie') {
				$.vakata.cookie('__vjstorage', _storage_service.jStorage, { 'expires' : 365 });
			}
			_storage_size = _storage_service.jStorage?String(_storage_service.jStorage).length:0;
		} catch(E7) { /* probably cache is full, nothing is saved this way*/ }
	}

	function _checkKey(key) {
		if(!key || (typeof key !== "string" && typeof key !== "number")){
			throw new TypeError('Key name must be string or numeric');
		}
		if(key === "__jstorage_meta") {
			throw new TypeError('Reserved key name');
		}
		return true;
	}

	function _handleTTL() {
		var curtime = +new Date(),
			i,
			TTL,
			nextExpire = Infinity,
			changed = false;

		if(_ttl_timeout !== false) {
			clearTimeout(_ttl_timeout);
		}
		if(!_storage.__jstorage_meta || typeof _storage.__jstorage_meta.TTL !== "object"){
			return;
		}
		TTL = _storage.__jstorage_meta.TTL;
		for(i in TTL) {
			if(TTL.hasOwnProperty(i)) {
				if(TTL[i] <= curtime) {
					delete TTL[i];
					delete _storage[i];
					changed = true;
				}
				else if(TTL[i] < nextExpire) {
					nextExpire = TTL[i];
				}
			}
		}

		// set next check
		if(nextExpire !== Infinity) {
			_ttl_timeout = setTimeout(_handleTTL, nextExpire - curtime);
		}
		// save changes
		if(changed) {
			_save();
		}
	}

	/*
		Variable: $.vakata.storage
		*object* holds all storage related functions and properties.
	*/
	$.vakata.storage = {
		/*
			Variable: $.vakata.storage.version
			*string* the version of jstorage used HEAVILY MODIFIED
		*/
		version: "0.3.0",
		/*
			Function: $.vakata.storage.set
			Set a key to a value

			Parameters:
				key - the key
				value - the value

			Returns:
				_value_
		*/
		set : function (key, value, ttl) {
			_checkKey(key);
			if(typeof value === "object") {
				value = json_decode(json_encode(value));
			}
			_storage[key] = value;
			_save();
			if(ttl && parseInt(ttl, 10)) {
				$.vakata.storage.setTTL(key, parseInt(ttl, 10));
			}
			return value;
		},
		/*
			Function: $.vakata.storage.get
			Get a value by key.

			Parameters:
				key - the key
				def - the value to return if _key_ is not found

			Returns:
				The found value, _def_ if key not found or _null_ if _def_ is not supplied.
		*/
		get : function (key, def) {
			_checkKey(key);
			if(key in _storage){
				return _storage[key];
			}
			return typeof(def) === 'undefined' ? null : def;
		},
		/*
			Function: $.vakata.storage.del
			Remove a key.

			Parameters:
				key - the key

			Returns:
				*boolean*
		*/
		del : function (key) {
			_checkKey(key);
			if(key in _storage) {
				delete _storage[key];

				if(_storage.__jstorage_meta && typeof _storage.__jstorage_meta.TTL === "object" && key in _storage.__jstorage_meta.TTL) {
					delete _storage.__jstorage_meta.TTL[key];
				}
				_save();
				return true;
			}
			return false;
		},

		setTTL: function(key, ttl){
			var curtime = +new Date();

			_checkKey(key);
			ttl = Number(ttl) || 0;
			if(key in _storage){
				if(!_storage.__jstorage_meta){
					_storage.__jstorage_meta = {};
				}
				if(!_storage.__jstorage_meta.TTL) {
					_storage.__jstorage_meta.TTL = {};
				}
				if(ttl > 0) {
					_storage.__jstorage_meta.TTL[key] = curtime + ttl;
				}
				else {
					delete _storage.__jstorage_meta.TTL[key];
				}
				_save();
				_handleTTL();
				return true;
			}
			return false;
		},
		getTTL: function(key){
			var curtime = +new Date(), ttl;
			_checkKey(key);
			if(key in _storage && _storage.__jstorage_meta.TTL && _storage.__jstorage_meta.TTL[key]) {
				ttl = _storage.__jstorage_meta.TTL[key] - curtime;
				return ttl || 0;
			}
			return 0;
		},

		/*
			Function: $.vakata.storage.flush
			Empty the storage.

			Returns:
				_true_
		*/
		flush : function(){
			_storage = {};
			_save();
			// try{ window.localStorage.clear(); } catch(E8) { }
			return true;
		},
		/*
			Function: $.vakata.storage.storageObj
			Get a read only copy of the whole storage.

			Returns:
				*object*
		*/
		storageObj : function(){
			return $.extend(true, {}, _storage);
		},
		/*
			Function: $.vakata.storage.index
			Get an array of all the set keys in the storage.

			Returns:
				*array*
		*/
		index : function(){
			var index = [], i;
			$.each(_storage, function (i, v) { if(i !== "__jstorage_meta") { index.push(i); } });
			return index;
		},
		/*
			Function: $.vakata.storage.storageSize
			Get the size of all items in the storage in bytes.

			Returns:
				*number*
		*/
		storageSize : function(){
			return _storage_size;
		},
		/*
			Function: $.vakata.storage.currentBackend
			Get the current backend used.

			Returns:
				*string*
		*/
		currentBackend : function(){
			return _backend;
		},
		/*
			Function: $.vakata.storage.storageAvailable
			See if storage functionality is available.

			Returns:
				*boolean*
		*/
		storageAvailable : function(){
			return !!_backend;
		}
	};
	_init();
})(jQuery);

/*
Group: PrettyDate
Modifies time elements to a more human readable value. Taken from: https://github.com/zachleat/Humane-Dates/blob/master/src/humane.js
*/
(function ($) {
	/*
		Variable: $.vakata.pretty_date
		*object* holds all pretty-date related functions and properties.
	*/
	$.vakata.pretty_date = {
		/*
			Variable: $.vakata.pretty_date.lang
			*object* the localization to use.
		*/
		lang : {
			ago: 'Ago',
			from: 'From Now',
			now: 'Just Now',
			minute: 'Minute',
			minutes: 'Minutes',
			hour: 'Hour',
			hours: 'Hours',
			day: 'Day',
			days: 'Days',
			week: 'Week',
			weeks: 'Weeks',
			month: 'Month',
			months: 'Months',
			year: 'Year',
			years: 'Years'
		},
		/*
			Function: $.vakata.pretty_date.parse
			Parses the difference between to dates to a human readable string.

			Parameters:
				date - the date to calculate from (а string in this YYYY-MM-DDTHH:MM:SSZ format - UTC)
				comareTo - the date to compare to (as date), if left empty the current date is used

			Returns:
				*mixed* - the formatted string on success or _null_ on error
		*/
		parse : function (date, compareTo) {
			// remove the timezone (always use gmdate on server side)
			date = new Date(date.replace(/-/g,"/").replace(/[TZ]/g," ").replace(/\+\d\d\:\d\d$/,'').replace(/\+\d\d\d\d$/,''));
			compareTo = compareTo || new Date();
			var lang		= $.vakata.pretty_date.lang,
				formats		= [
					[60, lang.now],
					[3600, lang.minute, lang.minutes, 60], // 60 minutes, 1 minute
					[86400, lang.hour, lang.hours, 3600], // 24 hours, 1 hour
					[604800, lang.day, lang.days, 86400], // 7 days, 1 day
					[2628000, lang.week, lang.weeks, 604800], // ~1 month, 1 week
					[31536000, lang.month, lang.months, 2628000], // 1 year, ~1 month
					[Infinity, lang.year, lang.years, 31536000] // Infinity, 1 year
				],
				seconds		= (compareTo - date + compareTo.getTimezoneOffset() * 60000) / 1000,
				normalize	= function (val, single) {
								var margin = 0.1;
								if(val >= single && val <= single * (1+margin)) {
									return single;
								}
								return val;
							},
				token;

			if(seconds < 0) {
				seconds = Math.abs(seconds);
				token = ' ' + lang.from;
			}
			else {
				token = ' ' + lang.ago;
			}

			for(var i = 0, format = formats[0]; formats[i]; format = formats[++i]) {
				if(seconds < format[0]) {
					if(i === 0) {
						return format[1];
					}
					var val = Math.ceil(normalize(seconds, format[3]) / (format[3]));
					return val +
							' ' +
							(val !== 1 ? format[2] : format[1]) +
							(i > 0 ? token : '');
				}
			}
		},
		/*
			Function: $.vakata.pretty_date.init
			Parses all time elements in the document and keeps reparsing them every few seconds.

			Parameters:
				i - the interval for reparsing (in milliseconds). Default is 60000.
				format - the format to use, example: _Published %{s}._. Default is _%{s}_.
		*/
		init : function (i, format) {
			$("time, [datetime]").vakata_pretty_date(format);
			setInterval(function(){ $("time, [datetime]").vakata_pretty_date(format); }, i || 60000);
		}
	};
	/*
	Function: $().vakata_pretty_date
	Sets the HTML of every element to the parsed difference of its _datetime_ attribute and the compare parameter.

		Parameters:
			format - makes it possible to modify the parsed string, example: _Published %{s}._. Default is _%{s}_.
			compare - the date to compare to. Default is the current date.
	*/
	$.fn.vakata_pretty_date = function (format, compare) {
		if(!format) { format = '%{s}'; }
		return this.each(function() {
			var $t = jQuery(this),
				date = $.vakata.pretty_date.parse($t.attr('datetime'), compare);
			if(date) {
				date = format.replace('%{s}', date);
				if($t.html() !== date) {
					$t.html(date);
				}
			}
		});
	};
})(jQuery);

/*
Group: Selection
Selection related functions
*/
(function ($) {
	/*
		Variable: $.vakata.selection
		*object* holds all selection related functions and properties.
	*/
	$.vakata.selection = {
		/*
			Function: $.vakata.selection.get
			Gets the current selection.

			Parameters:
				as_text - a boolean - if set to _true_ selection is returned as text, otherwise as HTML

			Returns:
				*string* - the current selection
		*/
		get : function (as_text) {
			if(window.getSelection) {
				if(as_text) {
					return window.getSelection().toString();
				}
				var userSelection	= window.getSelection(),
					range			= userSelection.getRangeAt && userSelection.rangeCount ? userSelection.getRangeAt(0) : document.createRange(),
					div				= document.createElement('div');
				if(!userSelection.getRangeAt) {
					range.setStart(userSelection.anchorNode, userSelection.anchorOffset);
					range.setEnd(userSelection.focusNode, userSelection.focusOffset);
				}
				div.appendChild(range.cloneContents());
				return div.innerHTML;
			}
			if(document.selection) {
				return document.selection.createRange()[ as_text ? 'text' : 'htmlText' ];
			}
			return '';
		},
		/*
			Function: $.vakata.selection.elm_get
			Gets the selection inside an input element or textarea.

			Parameters:
				e - the actual DOM element or the ID of the element

			Returns:
				*object* - the current selection (start, end, length, text)
		*/
		elm_get : function (e) {
			e = typeof e === 'string' ? document.getElementById(e) : e;
			if(e.jquery) { e = e.get(0); }
			if('selectionStart' in e) { // Mozilla and DOM 3.0
				return {
					'start'		: e.selectionStart,
					'end'		: e.selectionEnd,
					'length'	: (e.selectionEnd - e.selectionStart),
					'text'		: e.value.substr(e.selectionStart, (e.selectionEnd - e.selectionStart))
				};
			}
			else if(document.selection) { // IE
				e.focus();
				var tr0 = document.selection.createRange(),
					tr1 = false,
					tr2 = false,
					len, text_whole, the_start, the_end;
				if(tr0 && tr0.parentElement() === e) {
					len = e.value.length;
					text_whole = e.value.replace(/\r\n/g, "\n");

					tr1 = e.createTextRange();
					tr1.moveToBookmark(tr0.getBookmark());
					tr2 = e.createTextRange();
					tr2.collapse(false);

					if(tr1.compareEndPoints("StartToEnd", tr2) > -1) {
						the_start = the_end = len;
					}
					else {
						the_start  = -tr1.moveStart("character", -len);
						the_start += text_whole.slice(0, the_start).split("\n").length - 1;
						if (tr1.compareEndPoints("EndToEnd", tr2) > -1) {
							the_end = len;
						} else {
							the_end  = -tr1.moveEnd("character", -len);
							the_end += text_whole.slice(0, the_end).split("\n").length - 1;
						}
					}
					text_whole = e.value.slice(the_start, the_end);
					return {
						'start'		: the_start,
						'end'		: the_end,
						'length'	: text_whole.length,
						'text'		: text_whole
					};
				}
			}
			else { // not supported
				return {
					'start'		: e.value.length,
					'end'		: e.value.length,
					'length'	: 0,
					'text'		: ''
				};
			}
		},
		/*
			Function: $.vakata.selection.elm_set
			Sets the selection inside an input element or textarea.

			Parameters:
				e - the actual DOM element or the ID of the element
				beg - the char to start the selection
				end - the char to end the selection

			Returns:
				*object* - the current selection (start, end, length, text)
		*/
		elm_set : function (e, beg, end) {
			e = typeof e === 'string' ? document.getElementById(e) : e;
			if(e.jquery) { e = e.get(0); }
			if('selectionStart' in e) { // Mozilla and DOM 3.0
				e.focus();
				e.selectionStart	= beg;
				e.selectionEnd		= end;
			}
			else if(document.selection) { // IE
				e.focus();
				var tr	= e.createTextRange(),
					tx	= e.value.replace(/\r\n/g, "\n");

				beg -= tx.slice(0, beg).split("\n").length - 1;
				end -= tx.slice(0, end).split("\n").length - 1;

				tr.collapse(true);
				tr.moveEnd('character', end);
				tr.moveStart('character', beg);
				tr.select();
			}
			return $.vakata.selection.elm_get(e);
		},
		/*
			Function: $.vakata.selection.elm_replace
			Replace the selection inside an input element or textarea.

			Parameters:
				e - the actual DOM element or the ID of the element
				replace - the string to replace the selection with

			Returns:
				*object* - the current selection (start, end, length, text)
		*/
		elm_replace : function (e, replace) {
			e = typeof e === 'string' ? document.getElementById(e) : e;
			if(e.jquery) { e = e.get(0); }
			var sel = $.vakata.selection.elm_get(e),
				beg = sel.start,
				end = beg + replace.length;
			e.value = e.value.substr(0, beg) + replace + e.value.substr(sel.end, e.value.length);
			$.vakata.selection.elm_set(e, beg, end);
			return {
				'start'		: beg,
				'end'		: end,
				'length'	: replace.length,
				'text'		: replace
			};
		},
		/*
			Function: $.vakata.selection.elm_get_caret
			Returns the caret position in the element.

			Parameters:
				e - the actual DOM element or the ID of the element

			Returns:
				*number* - the current caret position
		*/
		elm_get_caret : function (e) {
			return $.vakata.selection.elm_get(e).end;
		},
		/*
			Function: $.vakata.selection.elm_set_caret
			Sets the caret position in the element.

			Parameters:
				e - the actual DOM element or the ID of the element
				pos - the position to move the caret to

			Returns:
				*object* - the current selection
		*/
		elm_set_caret : function (e, pos) {
			return $.vakata.selection.elm_set(e, pos, pos);
		},
		/*
			Function: $.vakata.selection.elm_get_caret_position
			Returns the caret position in pixels relative to the element.

			Parameters:
				e - the actual DOM element or the ID of the element

			Returns:
				*object* - the current position (with _left_ and _top_ values)
		*/
		elm_get_caret_position : function (e) {
			e = typeof e === 'string' ? document.getElementById(e) : e;
			if(e.jquery) { e = e.get(0); }
			var p = $.vakata.selection.elm_get_caret(e),
				s = e.value.substring(0, p).replace(/&/g,'&amp;').replace(/</ig,'&lt;').replace(/>/ig,'&gt;').replace(/\r/g, '').replace(/\t/g,'&#10;').replace(/\n/ig, '<br />'),
				b = $.vakata.get_scrollbar_width(),
				w = $(e).width(),
				h = $(e).height();
			if(e.scrollHeight > h) { w -= b; }
			if(e.scrollWidth > w)  { h -= b; }
			e = $(e);
			e = $('<div />').html(s).css({
						'background': 'red',
						'width'		: w + 'px',
						'height'	: 'auto',
						'position'	: 'absolute',
						'left'		: '0px',
						'top'		: '-10000px',

						'fontSize'		: e.css('fontSize'),
						'fontFamily'	: e.css('fontFamily'),
						'fontWeight'	: e.css('fontWeight'),
						'fontVariant'	: e.css('fontVariant'),
						'fontStyle'		: e.css('fontStyle'),
						'textTransform'	: e.css('textTransform'),
						'lineHeight'	: e.css('lineHeight'),
						'whiteSpace'	: 'pre-wrap'
					});
			e.append('<span class="caret">&nbsp;</span>').appendTo('body');
			s = e.find('span.caret');
			p = s.offset();
			p.top = p.top + 10000 + s.height();
			e.remove();
			return p;
		}
	};
})(jQuery);



(function ($) {
	/*
		Function: $.vakata_highlight
		Hightlight words in the matched elements

		Parameters:
			settings - if a string is passed, it is used to search and highlight, if an array of strings is passed, each string is highlighted, you can also pass an object, containing a _words_ string or array, a _color_ string or array, a _css_class_ string.
	*/
	$.fn.vakata_highlight = function (settings) {
		var _return = this;
		if(typeof settings === 'string') {
			settings = [ settings ];
		}
		if($.isArray(settings)) {
			settings = { 'words' : settings };
		}
		settings = $.extend(true, {}, { 'css_class' : 'vakata-highlight', 'words' : [], 'color' : '#99ccff' }, settings);
		if(settings.words.length) {
			this.each(function () {
				var t = $(this);
				$.each(settings.words, function (i,v) {
					var color = false;
					if(typeof settings.color === 'string') {
						color = settings.color;
					}
					if($.isArray(settings.color) && typeof settings.color[i] === 'string') {
						color = settings.color[i];
					}
					t
						.find(':vakata_icontains("' + v.replace(/\"/ig,'') + '")')
						.filter('strong, span, li, p, h1, h2, h3, h4, h5, h6, div, u, em, i, dt, dd')
						.contents()
						.filter(function() { return this.nodeType === 3; })
						.each(function () {
							if(this.nodeValue.toLowerCase().indexOf(v.toLowerCase()) >= 0) {
								this.nodeValue = this.nodeValue.replace(new RegExp('(' + v.replace(/([\-.*+?\^${}()|\[\]\/\\])/g,"\\$1") + ')', 'ig'), '|{{{$1}}}|');
								var o = $(this).parent();
								o.html(o.html().replace(/\|\{\{\{/g,'<span class="' + settings.css_class + ' ' + settings.css_class + '-' + i + '" ' + ( typeof color === 'string' ? ' style="background:' + color + ';" ' : '' ) + '>').replace(/\}\}\}\|/g,'</span>'));
							}
						});
				});
			});
		}
		return _return;
	};
})(jQuery);
/*
 * jsTree 1.0.0
 * http://jstree.com/
 *
 * Copyright (c) 2011 Ivan Bozhanov (vakata.com)
 *
 * Licensed same as jquery - under the terms of either the MIT License or the GPL Version 2 License
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

/*global jQuery, window, document, setTimeout, setInterval, clearTimeout, clearInterval, console */

/* File: jstree.js
The only required part of jstree it consists of a few functions bound to the $.jstree object, the actual plugin function and a few core functions for manipulating a tree.
*/
(function () {
	"use strict";
	if(!jQuery) { throw "jsTree: jQuery not included."; }
	if(jQuery.jstree) { return; } // prevent another load? maybe there is a better way?

/* Group: $.jstree.
Some static functions and variables, unless you know exactly what you are doing do not use these, but <$().jstree> instead.
*/
(function ($) {
	var instances			= [],
		focused_instance	= -1,
		plugins				= {},
		functions			= {};
	/*
		Variable: $.jstree
		*object* Contains all static functions and variables used by jstree, some plugins also append variables.
	*/
	$.jstree = {
		/*
			Variable: $.jstree.VERSION
				*string* the version of jstree
		*/
		VERSION : '1.0.0',

		/*
			Variable: $.jstree.IS_IE6
				*boolean* indicating if the client is running Internet Explorer 6
		*/
		IS_IE6 : (jQuery.browser.msie && parseInt(jQuery.browser.version,10) === 6),

		/*
			Variable: $.jstree.IS_IE7
				*boolean* indicating if the client is running Internet Explorer 7
		*/
		IS_IE7 : (jQuery.browser.msie && parseInt(jQuery.browser.version,10) === 6),

		/*
			Variable: $.jstree.IS_FF2
				*boolean* indicating if the client is running Firefox 2
		*/
		IS_FF2 : (jQuery.browser.mozilla && parseFloat(jQuery.browser.version,10) < 1.9),

		/*
			Function: $.jstree.__construct
				Creates a new jstree instance, any arguments after the first one are merged and used to configure the tree.

				`.data("jstree")` is also called on the container and is used for configuration (keep in mind you can specify this data using a "data-jstree" attribute)

			Parameters:
				container - *mixed* the container of the tree (this should not be the UL node, but a wrapper) - DOM node, jQuery object or selector
		*/
		__construct	: function (container) {
			var s = {}, // settings
				d = {}, // data
				p = [], // plugins
				t = [], // plugins temp
				i = 0;  // index
			container = $(container);
			if($.jstree._reference(container)) { $.jstree.__destruct(container); }
			$.extend.apply(null, [true, s].concat(Array.prototype.slice.call(arguments, 1), (container.data("jstree") || {}) ));
			p = $.isArray(s.plugins) ? s.plugins : $.jstree.defaults.plugins.slice();
			p = $.vakata.array_unique(p);
			s = $.extend(true, {}, $.jstree.defaults, s);
			$.each(plugins, function (i, val) {
				if(i !== "core" && $.inArray(i, p) === -1) { s[i] = null; delete s[i]; }
				else { t.push(i); d[i] = {}; }
			});
			s.plugins = t;
			i = parseInt(instances.push({}),10) - 1;
			container
				.data("jstree_instance_id", i)
				.addClass("jstree jstree-" + i);

			this.data				= d;
			this.get_index			= function () { return i; };
			this.get_container		= function () { return container; };
			this.get_container_ul	= function () { return container.children("ul:eq(0)"); };
			this.get_settings		= function (writable) { return writable ? s : $.extend(true, {}, s); };
			this.__trigger			= function (ev, data) {
				if(!ev) { return; }
				if(!data) { data = {}; }
				if(typeof ev === "string") { ev = ev.replace(".jstree","") + ".jstree"; }
				data.inst = this;
				return this.get_container().triggerHandler(ev, data);
			};
			instances[i] = this;
			$.each(t, function (j, val) { if(plugins[val]) { plugins[val].__construct.apply(instances[i]); } });
			this.__trigger("__construct");
			$.jstree._focus(i);
			return this;
		},
		/*
			Function: $.jstree.__destruct
				Destroys an instance, and also clears `jstree-` prefixed classes and all events in the `jstree` namespace

			Parameters:
				instance - *mixed* the instance to destroy (this argument is passed to <$.jstree._reference> to get the instance)

			See also:
				<$.jstree._reference>
		*/
		__destruct	: function (instance) {
			instance = $.jstree._reference(instance);
			if(!instance) { return false; }
			var s = instance.get_settings(),
				n = instance.get_index(),
				i = 0;
			if(focused_instance === n) {
				for(i in instances) {
					if(instances.hasOwnProperty(i) && i !== n) {
						$.jstree._focus(i);
						break;
					}
				}
				if(focused_instance === n) { $.jstree._focus(false); }
			}
			$.each(s.plugins, function (i, val) {
				try { plugins[val].__destruct.apply(instance); } catch(err) { }
			});
			instance.__trigger("__destruct");
			instance.get_container()
				.unbind(".jstree")
				.undelegate(".jstree")
				.removeData("jstree_instance_id")
				.find("[class^='jstree']")
					.andSelf()
					.attr("class", function () { return this.className.replace(/jstree[^ ]*|$/ig,''); });
			$(document)
				.unbind(".jstree-" + n)
				.undelegate(".jstree-" + n);
			delete instances[n];
			return true;
		},
		/*
			Function: $.jstree.__call
				Call a function on the instance and return the result

			Parameters:
				instance - *mixed* the instance to destroy (this argument is passed to <$.jstree._reference> to get the instance)
				operation - *string* the operation to execute
				args - *array* the arguments to pass to the function

			See also:
				<$.jstree._reference>
		*/
		__call		: function (instance, operation, args) {
			instance = $.jstree._reference(instance);
			if(!instance || !$.isFunction(instance[operation])) { return; }
			return instance[operation].apply(instance, args);
		},
		/*
			Function: $.jstree._reference
				Returns an instance

			Parameters:
				needle - *mixed* - integer, DOM node contained inside a jstree container, ID string, jQuery object, selector
		*/
		_reference	: function (needle) {
			if(instances[needle]) { return instances[needle]; }
			var o = $(needle);
			if(!o.length && typeof needle === "string") { o = $("#" + needle); }
			if(!o.length) { return null; }
			return instances[o.closest(".jstree").data("jstree_instance_id")] || null;
		},
		/*
			Function: $.jstree._focused
				Returns the currently focused instance (by default once an instance is created it is focused)
		*/
		_focused	: function () {
			return instances[focused_instance] || null;
		},
		/*
			Function: $.jstree._focus
				Make an instance focused (which defocuses the previously focused instance)

			Parameters:
				instance - *mixed* the instance to focus (this argument is passed to <$.jstree._reference> to get the instance)

			See also:
				<$.jstree._reference>
		*/
		_focus		: function (instance) {
			if(instance === false) {
				instances[focused_instance].get_container().removeClass("jstree-focused");
				instances[focused_instance].__trigger("_defocus");
				focused_instance = -1;
				return false;
			}
			instance = $.jstree._reference(instance);
			if(!instance || instance.get_index() === focused_instance) { return false; }
			if(focused_instance !== -1) {
				instances[focused_instance].get_container().removeClass("jstree-focused");
				instances[focused_instance].__trigger("_defocus");
			}
			focused_instance = instance.get_index();
			instance.get_container().addClass("jstree-focused");
			instance.__trigger("_focus");
			return true;
		},
		/*
			Function: $.jstree.plugin
				Register a plugin

			Parameters:
				plugin_name - *string* the name of the new plugin (it will be used as a key in an object - make sure it is valid)
				plugin_data - *object* consists of 4 keys. Default is:
				>{
				>	__construct	: $.noop,	// this function will be executed when a new instance is created
				>	__destuct	: $.noop,	// this function will be executed when an instance is destroyed
				>	_fn			: { },		// each key of this object should be a function that will extend the jstree prototype
				>	defaults	: false		// the default configuration for the plugin (if any)
				>}
		*/
		plugin		: function (plugin_name, plugin_data) {
			plugin_data = $.extend({}, {
					__construct	: $.noop,
					__destuct	: $.noop,
					_fn			: { },
					defaults	: false
				}, plugin_data);
			plugins[plugin_name]			= plugin_data;
			$.jstree.defaults[plugin_name]	= plugin_data.defaults;
			$.each(plugin_data._fn, function (i, val) {
				val.plugin		= plugin_name;
				val.old			= functions[i];
				functions[i]	= function () {
					var rslt,
						func = val,
						args = Array.prototype.slice.call(arguments),
						evnt = new $.Event("before.jstree"),
						plgn = this.get_settings(true).plugins;

					do {
						if(func && func.plugin && $.inArray(func.plugin, plgn) !== -1) { break; }
						func = func.old;
					} while(func);
					if(!func) { return; }

					if(i.indexOf("_") === 0) {
						rslt = func.apply(this, args);
					}
					else {
						rslt = this.__trigger(evnt, { "func" : i, "args" : args, "plugin" : func.plugin });
						if(rslt === false) { return; }
						rslt = func.apply(
							$.extend({}, this, {
								__callback : function (data) {
									this.__trigger( i, { "args" : args, "rslt" : data, "plugin" : func.plugin });
									return data;
								},
								__call_old : function (replace_arguments) {
									return func.old.apply(this, (replace_arguments ? Array.prototype.slice.call(arguments, 1) : args ) );
								}
							}), args);
					}
					return rslt;
				};
				functions[i].old	= val.old;
				functions[i].plugin	= plugin_name;
			});
		},
		/*
			Variable: $.jstree.defaults
				*object* storing all the default configuration options for every plugin and the core.
				If this is modified all instances created after the modification, which do not explicitly specify some other value will use the new default.

			Example:
			>// this instance will use the _default_ theme
			>$("#div0").jstree({ plugins : ["themes"] });
			>$.jstree.defaults.themes.theme = "classic";
			>// this instance will use the _classic_ theme
			>$("#div1").jstree({ plugins : ["themes"] });
			>// this instance will use the _apple_ theme
			>$("#div2").jstree({ themes : { "theme" : "apple" }, plugins : ["themes"] });
		*/
		defaults	: {
			plugins : []
		}
	};
	/* Group: $().jstree()
		The actual plugin wrapper, use this to create instances or execute functions on created instances.

		Function: $().jstree

		Creates an instance using the specified objects for containers, or executes a command on an instance, specified by a container.

		Parameters:
			settings - *mixed*

			- if you pass an *object* a new instance will be created (using <$.jstree.__construct>)
			for each of the objects in the jquery collection,
			if an instance already exists on the container it will be destroyed first

			- if you pass a *string* it will be executed using <$.jstree.__call> on each instance

		Examples:
			> // this creates an instance
			> $("#some-id").jstree({
			>	plugins : [ "html_data", "themes", "ui" ]
			> });
			>
			> // this executes a function on the instance
			> $("#some-id").jstree("select_node", "#the-id-to-select");

		See also:
			<$.jstree.__construct>,
			<$.jstree.__destruct>,
			<$.jstree.__call>
	*/
	$.fn.jstree = function (settings) {
		var _is_method	= (typeof settings === 'string'),
			_arguments	= Array.prototype.slice.call(arguments, 1),
			_return		= this;
		this.each(function () {
			if(_is_method) {
				var val = $.jstree.__call(this, settings, _arguments);
				if(typeof val !== "undefined" && (settings.indexOf("is_" === 0) || (val !== true && val !== false))) {
					_return = val;
					return false;
				}
			}
			else {
				_is_method = new $.jstree.__construct(this, settings);
			}
		});
		return _return;
	};
	functions = $.jstree.__construct.prototype;

	$.expr[':'].jstree = function(a,i,m) {
		return typeof ($(a).data("jstree_instance_id")) !== 'undefined';
	};
})(jQuery);

(function ($) {
	var ccp_node = false,
		ccp_mode = false;

	$(function() { $.jstree.SCROLLBAR_WIDTH = $.vakata.get_scrollbar_width(); });

	$.jstree.plugin("core", {
		__construct : function () {
			this.data.core.rtl = (this.get_container().css("direction") === "rtl");
			if(this.data.core.rtl) { this.get_container().addClass("jstree-rtl"); }
			this.data.core.ready = false;

			if($.support.touch) { this.get_container().addTouch(); }

			this.get_container()
				.bind("__construct.jstree", $.proxy(function () {
						// defer, so that events bound AFTER creating the instance (like __ready) are still handled
						setTimeout($.proxy(function () { if(this) { this.init(); } }, this), 0);
					}, this))
				.bind("before.jstree", $.proxy(function (e, data) {
						if(!/^is_locked|unlock$/.test(data.func) && this.data.core.locked) {
							e.stopImmediatePropagation();
							return false;
						}
					}, this))
				.bind("create_node.jstree", $.proxy(function (e, data) {
						this.clean_node(data.rslt.obj);
					}, this))
				.bind("load_node.jstree", $.proxy(function (e, data) {
						// data.rslt.status
						if(data.rslt.status) {
							if(data.rslt.obj === -1) {
								// only detach for root (checkbox three-state will not work otherwise)
								// also - if you could use async clean_node won't be such an issue
								var ul = this.get_container_ul().detach();
								if(ul.children('li').length) {
									this.clean_node(ul.children('li'));
								}
								this.get_container().prepend(ul);
							}
							else {
								if(data.rslt.obj.find('> ul > li').length) {
									this.clean_node(data.rslt.obj.find('> ul > li'));
								}
							}
							if(!this.data.core.ready && !this.get_container_ul().find('.jstree-loading:eq(0)').length) {
								this.data.core.ready = true;
								this.__trigger("__ready");
							}
						}
					}, this))
				.bind("__loaded.jstree", $.proxy(function (e, data) {
						data.inst.get_container_ul().children('li').each(function () {
							data.inst.correct_node(this);
						});
					}, this))
				.bind("open_node.jstree", $.proxy(function (e, data) {
						data.rslt.obj.find('> ul > li').each(function () {
							data.inst.correct_node(this);
						});
					}, this))
				.bind("mousedown.jstree", $.proxy(function () {
						$.jstree._focus(this.get_index());
					}, this))
				.bind("dblclick.jstree", function () {
						if(document.selection && document.selection.empty) { document.selection.empty(); }
						else { if(window.getSelection) { var sel = window.getSelection(); try { sel.removeAllRanges(); sel.collapse(); } catch (er) { } } }
					})
				.delegate(".jstree-ocl", "click.jstree", $.proxy(function (e) {
						// var trgt = $(e.target);
						// if(trgt.is("ins") && e.pageY - trgt.offset().top < this.data.core.li_height) { this.toggle_node(trgt); }
						this.toggle_node(e.target);
					}, this));
		},
		__destruct : function () {

		},
		/* Class: jstree */
		/*
			Variable: data
			*object* Provides storage for plugins (aside from private variables). Every plugin has an key in this object.
			> this.data.<plugin_name>;
			This is useful for detecting if some plugin is included in the instance (plugins also use this for dependencies and enhancements).

			Function: get_index
			Returns an *integer*, which is the instance's index. Every instance on the page has an unique index, when destroying an intance the index will not be reused.

			Function: get_container
			Returns the jQuery extended container of the tree (the element you used when constructing the tree).

			Function: get_container_ul
			Returns the jQuery extended first UL node inside the container of the tree.

			Function: get_settings
			Returns the settings for the tree.

			Parameters:
				writable - *boolean* whether to return a copy of the settings object or a reference to it.

			Example:
			> $("#div1").jstree("get_settings"); // will return a copy
			> $.jstree._reference("#div1").get_settings(); // same as above
			> $.jstree._focused().get_settings(true); // a reference. BE CAREFUL!

			Function: __trigger
			Used internally to trigger events on the container node.

			Parameters:
				event_name - the name of the event to trigger (the *jstree* namespace will be appended to it)
				data - the additional object to pass along with the event. By default _data.inst_ will be the current instance, so when you bind to the event, you can access the instance easily.
				> $("div").bind("some-event.jstree", function (e, data) { data.inst.some_function(); });
		*/
		/*
			Group: CORE options

			Variable: config.core.strings
			*mixed* used to store all localization strings. Default is _false_.

			Example 1:
			>$("div").jstree({
			>	core : {
			>		strings : function (s) {
			>			if(s === "Loading ...") { s = "Please wait ..."; }
			>			return s;
			>		}
			>	}
			>});

			Example 2:
			>$("div").jstree({
			>	core : {
			>		strings : {
			>			"Loading ..." : "Please wait ..."
			>		}
			>	}
			>});

			See also:
			<_get_string>
		*/
		defaults : {
			strings : false,
			check_callback : true,
			animation : 100
		},
		_fn : {
			/*
				Group: CORE functions

				Function: _get_string
				Used to get the common string in the tree.

				If <config.core.strings> is set to a function, that function is called with a single parameter (the needed string), the response is returned.

				If <config.core.strings> is set to an object, the key named as the needed string is returned.

				If <config.core.strings> is not set, the the needed string is returned.

				Parameters:
					needed_string - *string* the needed string
			*/
			_get_string : function (s) {
				var a = this.get_settings(true).core.strings;
				if($.isFunction(a)) { return a.call(this, s); }
				if(a && a[s]) { return a[s]; }
				return s;
			},
			/*
				Function: init
				Used internally. This function is called once the core plugin is constructed.

				Triggers:
				<__loaded>

				Event: __loaded
				This event is triggered in the *jstree* namespace when data is first rendered in the tree. It won't be triggered after a refresh. Fires only once.

				Parameters:
					data.inst - the instance

				Example:
				> $("div").bind("__loaded.jstree", function (e, data) { data.inst.do_something(); });

				Event: __ready
				This event is triggered in the *jstree* namespace when all initial loading is done. It won't be triggered after a refresh. Fires only once.

				Parameters:
					data.inst - the instance
			*/
			init : function () {
				this.data.core.original_container_html = this.get_container().find(" > ul > li").clone(true);
				this.data.core.original_container_html.find("li").andSelf().contents().filter(function() { return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue)); }).remove();
				this.get_container().html("<ul><li class='jstree-loading'><a href='#'>" + this._get_string("Loading ...") + "</a></li></ul>");
				this.clean_node(-1);
				this.data.core.li_height = this.get_container_ul().children("li:eq(0)").height() || 18;
				this.load_node(-1, function () {
					this.__trigger("__loaded");
				});
			},
			/*
				Function: lock
				Used to lock the tree. When the tree is in a locked state, no functions can be called on the instance (except <is_locked> and <unlock>).
				Additionally a _jstree-locked_ class is applied on the container.

				Triggers:
				<lock>

				Event: lock
				This event is triggered in the *jstree* namespace when the tree is locked.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else).
					data.rslt - _null_

				Example:
				> $("div").bind("lock.jstree", function (e, data) { data.inst.do_something(); });
			*/
			lock : function () {
				this.data.core.locked = true;
				this.get_container().addClass("jstree-locked");
				this.__callback();
			},
			/*
				Function: unlock
				Used to unlock the tree. Instance can be used normally again. The _jstree-locked_ class is removed from the container.

				Triggers:
				<unlock>

				Event: unlock
				This event is triggered in the *jstree* namespace when the tree is unlocked.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else).
					data.rslt - _null_

				Example:
				> $("div").bind("unlock.jstree", function (e, data) { data.inst.do_something(); });
			*/
			unlock : function () {
				this.data.core.locked = false;
				this.get_container().removeClass("jstree-locked");
				this.__callback();
			},
			/*
				Function: is_locked
				Used to get the locked status of the tree.

				Returns:
					locked - *boolean* _true_ if tree is locked, _false_ otherwise
			*/
			is_locked : function () {
				return this.data.core.locked;
			},
			/*
				Function: get_node
				Get a hold of the LI node (which represents the jstree node).

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					jquery collection - node was found, the collection contains the LI node
					-1 - the tree container was referenced
					false - on failure (obj is not part of a tree, or does not exists in the DOM)
			*/
			get_node : function (obj) {
				var $obj = $(obj, this.get_container());
				if($obj.is(".jstree") || obj === -1) { return -1; }
				$obj = $obj.closest("li", this.get_container());
				return $obj.length ? $obj : false;
			},
			/*
				Function: get_next
				Get the next sibling of a node

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
					strict - *boolean* if set to _true_ jstree will only return immediate siblings, otherwise, if _obj_ is the last child of its parent, the parent's next sibling is returned.

				Returns:
					jquery collection - node was found, the collection contains the LI node
					-1 - the tree container was referenced
					false - node was not found, or failure (obj is not part of a tree, or does not exists in the DOM)
			*/
			get_next : function (obj, strict) {
				obj = this.get_node(obj);
				if(obj === -1) { return this.get_container_ul().children("li:eq(0)"); }
				if(!obj || !obj.length) { return false; }
				if(strict) { return (obj.nextAll("li").size() > 0) ? obj.nextAll("li:eq(0)") : false; }
				if(obj.hasClass("jstree-open")) { return obj.find("li:eq(0)"); }
				else if(obj.nextAll("li").size() > 0) { return obj.nextAll("li:eq(0)"); }
				else { return obj.parentsUntil(".jstree","li").next("li").eq(0); }
			},
			/*
				Function: get_prev
				Get the previous sibling of a node

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
					strict - *boolean* if set to _true_ jstree will only return immediate siblings, otherwise, if _obj_ is the first child of its parent, the parent's previous sibling is returned.

				Returns:
					jquery collection - node was found, the collection contains the LI node
					-1 - the tree container was referenced
					false - node was not found, or failure (obj is not part of a tree, or does not exists in the DOM)
			*/
			get_prev : function (obj, strict) {
				obj = this.get_node(obj);
				if(obj === -1) { return this.get_container().find("> ul > li:last-child"); }
				if(!obj || !obj.length) { return false; }
				if(strict) { return (obj.prevAll("li").length > 0) ? obj.prevAll("li:eq(0)") : false; }
				if(obj.prev("li").length) {
					obj = obj.prev("li").eq(0);
					while(obj.hasClass("jstree-open")) { obj = obj.children("ul:eq(0)").children("li:last"); }
					return obj;
				}
				else { var o = obj.parentsUntil(".jstree","li:eq(0)"); return o.length ? o : false; }
			},
			/*
				Function: get_parent
				Get the parent of a node

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					jquery collection - node was found, the collection contains the LI node
					-1 - when _obj_ was a root node
					false - on failure (obj is not part of a tree, or does not exists in the DOM)
			*/
			get_parent : function (obj) {
				obj = this.get_node(obj);
				if(obj === -1 || !obj || !obj.length) { return false; }
				var o = obj.parentsUntil(".jstree", "li:eq(0)");
				return o.length ? o : -1;
			},
			/*
				Function: get_children
				Get all the children of a node

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc. If _-1_ is used all root nodes are returned.

				Returns:
					jquery collection - node was found, the collection contains the LI nodes of all immediate children
					false - on failure (obj is not part of a tree, or does not exists in the DOM)
			*/
			get_children	: function (obj) {
				obj = this.get_node(obj);
				if(obj === -1) { return this.get_container_ul().children("li"); }
				if(!obj || !obj.length) { return false; }
				return obj.find("> ul > li");
			},
			/*
				Function: is_parent
				Check if a node is a parent.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					true - _obj_ has children or is closed (will be loaded)
					false - _obj_ is not a valid node or has no children (leaf node)
			*/
			is_parent	: function (obj) { obj = this.get_node(obj); return obj && obj !== -1 && (obj.find("> ul > li:eq(0)").length || obj.hasClass("jstree-closed")); },
			/*
				Function: is_loaded
				Check if a node is loaded.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					true - _obj_ has children or is leaf
					false - _obj_ is currently loading or is not a leaf, but has no children
			*/
			is_loaded	: function (obj) { obj = this.get_node(obj); return obj && ( (obj === -1 && !this.get_container().find("> ul > li.jstree-loading").length) || ( obj !== -1 && !obj.hasClass('jstree-loading') && (obj.find('> ul > li').length || obj.hasClass('jstree-leaf')) ) ); },
			/*
				Function: is_loading
				Check if a node is currently loading.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					true - _obj_ is currently loading
					false - _obj_ is not currently loading
			*/
			is_loading	: function (obj) { obj = this.get_node(obj); return obj && ( (obj === -1 && this.get_container().find("> ul > li.jstree-loading").length) || (obj !== -1 && obj.hasClass("jstree-loading")) ); },
			/*
				Function: is_open
				Check if a node is currently open.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					true - _obj_ is currently open
					false - _obj_ is not currently open
			*/
			is_open		: function (obj) { obj = this.get_node(obj); return obj && obj !== -1 && obj.hasClass("jstree-open"); },
			/*
				Function: is_closed
				Check if a node is currently closed.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					true - _obj_ is currently closed
					false - _obj_ is not currently closed
			*/
			is_closed	: function (obj) { obj = this.get_node(obj); return obj && obj !== -1 && obj.hasClass("jstree-closed"); },
			/*
				Function: is_leaf
				Check if a node is a leaf node (has no children).

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.

				Returns:
					true - _obj_ is a leaf node
					false - _obj_ is not a leaf node
			*/
			is_leaf		: function (obj) { obj = this.get_node(obj); return obj && obj !== -1 && obj.hasClass("jstree-leaf"); },
			/*
				Function: load_node
				Load the children of a node.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc. Use -1 to load the root nodes.
					callback - a function to be executed in the tree's scope. Receives two arguments: _obj_ (the same node used to call load_node), _status_ (a boolean indicating if the node was loaded successfully.

				Returns:
					true - _obj_ is a valid node and will try loading it
					false - _obj_ is not a valid node

				Triggers:
					<load_node>

				See also:
					<_load_node>

				Event: load_node
				This event is triggered in the *jstree* namespace when a node is loaded (succesfully or not).

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else).
					data.rslt - *object* which contains two keys _obj_ (the loaded node) and _status_ - whether the node was loaded successfully.

				Example:
				> $("div").bind("load_node.jstree", function (e, data) { if(data.rslt.status) { data.inst.open_node(data.rslt.obj); } });
			*/
			load_node	: function (obj, callback) {
				obj = this.get_node(obj);
				if(!obj) { callback.call(this, obj, false); return false; }
				// if(this.is_loading(obj)) { return true; }
				if(obj !== -1) { obj.addClass("jstree-loading"); }
				this._load_node(obj, $.proxy(function (status) {
					if(obj !== -1) { obj.removeClass("jstree-loading"); }
					this.__callback({ "obj" : obj, "status" : status });
					if(callback) { callback.call(this, obj, status); }
				}, this));
				return true;
			},
			/*
				Function: _load_node
				Load the children of a node, but as opposed to <load_node> does not change any visual properties or trigger events. This function is used in <load_node> internally. The idea is for data source plugins to overwrite this function.
				This implementation (from the *core*) only uses markup found in the tree container, and does not load async.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc. Use -1 to load the root nodes.
					callback - a function to be executed in the tree's scope. Receives one argument: _status_ (a boolean indicating if the node was loaded successfully).
			*/
			_load_node	: function (obj, callback) {
				// if using async - empty the node first
				if(obj === -1) {
					this.get_container_ul().empty().append(this.data.core.original_container_html.clone(true));
				}
				callback.call(null, true);
			},
			/*
				Function: open_node
				Open a node so that its children are visible. If the node is not loaded try loading it first.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
					callback - a function to be executed in the tree's scope. Receives two arguments: _obj_ (the node being opened) and _status_ (a boolean indicating if the node was opened successfully).
					animation - the duration in miliseconds of the slideDown animation. If not supplied the jQuery default is used. Please note that on IE6 a _0_ is enforced here due to performance issues.

				Triggers:
					<open_node>, <__after_open>

				Event: open_node
				This event is triggered in the *jstree* namespace when a node is successfully opened (but if animation is used this event is triggered BEFORE the animation completes). See <__after_open>.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else).
					data.rslt - *object* which contains a single key: _obj_ (the opened node).

				Example:
				> $("div").bind("open_node.jstree", function (e, data) {
				>   data.rslt.obj.find('> ul > .jstree-closed').each(function () {
				>     data.inst.open_node(this);
				>   }
				> });

				Event: __after_open
				This event is triggered in the *jstree* namespace when a node is successfully opened AFTER the animation completes). See <open_node>.

				Parameters:
					data.inst - the instance
					data.rslt - *object* which contains a single key: _obj_ (the opened node).

				Example:
				> $("div").bind("__after_open.jstree", function (e, data) {
				>   data.rslt.obj.find('> ul > .jstree-closed').each(function () {
				>     data.inst.open_node(this);
				>   }
				> });
			*/
			open_node : function (obj, callback, animation) {
				obj = this.get_node(obj);
				animation = (typeof animation).toLowerCase() === "undefined" ? this.get_settings().core.animation : animation;
				if(obj === -1 || !obj || !obj.length) { return false; }
				if(!this.is_closed(obj)) { if(callback) { callback.call(this, obj, false); } return false; }
				if(!this.is_loaded(obj)) { // TODO: is_loading?
					this.load_node(obj, function (o, ok) {
						return ok ? this.open_node(o, callback, animation) : callback ? callback.call(this, o, false) : false;
					});
				}
				else {
					var t = this;
					obj
						.children("ul").css("display","none").end()
						.removeClass("jstree-closed").addClass("jstree-open")
						// .children("ins").text("-").end()
						.children("ul").stop(true, true).slideDown( ($.jstree.IS_IE6 ? 0 : animation), function () {
								this.style.display = "";
								t.__trigger("__after_open", { "rslt" : { "obj" : obj } });
							});
					if(callback) { callback.call(this, obj, true); }
					this.__callback({ "obj" : obj });
				}
			},
			/*
				Function: close_node
				Close a node so that its children are not visible.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
					animation - the duration in miliseconds of the slideDown animation. If not supplied the jQuery default is used. Please note that on IE6 a _0_ is enforced here due to performance issues.

				Triggers:
					<close_node>, <__after_close>

				Event: close_node
				This event is triggered in the *jstree* namespace when a node is closed (but if animation is used this event is triggered BEFORE the animation completes). See <__after_close>.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else).
					data.rslt - *object* which contains a single key: _obj_ (the closed node).

				Example:
				> $("div").bind("close_node.jstree", function (e, data) {
				>   data.rslt.obj.children('ul').remove();
				> });

				Event: __after_close
				This event is triggered in the *jstree* namespace when a node is closed AFTER the animation completes). See <close_node>.

				Parameters:
					data.inst - the instance
					data.rslt - *object* which contains a single key: _obj_ (the opened node).

				Example:
				> $("div").bind("__after_close.jstree", function (e, data) {
				>   data.rslt.obj.children('ul').remove();
				> });
			*/
			close_node : function (obj, animation) {
				obj = this.get_node(obj);
				animation = (typeof animation).toLowerCase() === "undefined" ? this.get_settings().core.animation : animation;
				if(!obj || !obj.length || !this.is_open(obj)) { return false; }
				var t = this;
				obj
					.children("ul").attr("style","display:block !important").end()
					.removeClass("jstree-open").addClass("jstree-closed")
					// .children("ins").text("+").end()
					.children("ul").stop(true, true).slideUp( ($.jstree.IS_IE6 ? 0 : animation), function () {
						this.style.display = "";
						t.__trigger("__after_close", { "rslt" : { "obj" : obj } });
					});
				this.__callback({ "obj" : obj });
			},
			/*
				Function: toggle_node
				If a node is closed - open it, if it is open - close it.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
			*/
			toggle_node : function (obj) {
				if(this.is_closed(obj)) { return this.open_node(obj); }
				if(this.is_open(obj)) { return this.close_node(obj); }
			},
			/*
				Function: open_all
				Open all nodes from a certain node down.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc. If _-1_ is used or is omitted all nodes in the tree are opened.
					animation - the duration of the slideDown animation when opening the nodes. If not set _0_ is enforced for performance issues.
					original_obj - used internally to keep track of the recursion - do not set manually!

				Triggers:
					<open_all>

				Event: open_all
				This event is triggered in the *jstree* namespace when an open_all call completes.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else).
					data.rslt - *object* which contains a single key: _obj_ (the node used in the call).

				Example:
				> $("div").bind("open_all.jstree", function (e, data) {
				>   alert('DONE');
				> });
			*/
			open_all : function (obj, animation, original_obj) {
				obj = obj ? this.get_node(obj) : -1;
				obj = !obj || obj === -1 ? this.get_container_ul() : obj;
				original_obj = original_obj || obj;
				var _this = this;
				obj = this.is_closed(obj) ? obj.find('li.jstree-closed').andSelf() : obj.find('li.jstree-closed');
				obj.each(function () {
					_this.open_node(
						this,
						_this.is_loaded(this) ?
							false :
							function(obj) { this.open_all(obj, animation, original_obj); },
						animation || 0
					);
				});
				if(original_obj.find('li.jstree-closed').length === 0) { this.__callback({ "obj" : original_obj }); }
			},
			/*
				Function: close_all
				Close all nodes from a certain node down.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc. If _-1_ is used or is omitted all nodes in the tree are closed.
					animation - the duration of the slideDown animation when closing the nodes. If not set _0_ is enforced for performance issues.

				Triggers:
					<close_all>

				Event: close_all
				This event is triggered in the *jstree* namespace when a close_all call completes.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else).
					data.rslt - *object* which contains a single key: _obj_ (the node used in the call).

				Example:
				> $("div").bind("close_all.jstree", function (e, data) {
				>   alert('DONE');
				> });
			*/
			close_all : function (obj, animation) {
				obj = obj ? this._get_node(obj) : -1;
				var $obj = !obj || obj === -1 ? this.get_container_ul() : obj,
					_this = this;
				$obj = this.is_open($obj) ? $obj.find('li.jstree-open').andSelf() : $obj.find('li.jstree-open');
				$obj.each(function () { _this.close_node(this, animation || 0); });
				this.__callback({ "obj" : obj });
			},
			/*
				Function: clean_node
				This function converts inserted nodes to the required by jsTree format. It takes care of converting a simple unodreder list to the internally used markup.
				The core calls this function automatically when new data arrives (by binding to the <load_node> event).
				Each plugin may override this function to include its own source, but keep in mind to do it like that:
				> clean_node : function(obj) {
				>  obj = this.__call_old();
				>  obj.each(function () {
				>    // do your stuff here
				>  });
				> }

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc. If _-1_ is used or is omitted all nodes in the tree are cleaned.

				Returns:
					jQuery collection - the cleaned children of the original node.
			*/
			clean_node : function (obj) {
				// DETACH maybe inside the "load_node" function? But what about animations, etc?
				obj = this.get_node(obj);
				obj = !obj || obj === -1 ? this.get_container().find("li") : obj.find("li").andSelf();
				var _this = this;
				return obj.each(function () {
					var t = $(this),
						d = t.data("jstree"),
						// is_ajax -> return this.get_settings().core.is_ajax || this.data.ajax;
						s = (d && d.opened) || t.hasClass("jstree-open") ? "open" : (d && d.closed) || t.children("ul").length || (d && d.children) ? "closed" : "leaf"; // replace with t.find('>ul>li').length || (this.is_ajax() && !t.children('ul').length)
					if(d && d.opened) { delete d.opened; }
					if(d && d.closed) { delete d.closed; }
					t.removeClass("jstree-open jstree-closed jstree-leaf jstree-last");
					if(!t.children("a").length) {
						// allow for text and HTML markup inside the nodes
						t.contents().filter(function() { return this.nodeType === 3 || this.tagName !== 'UL'; }).wrapAll('<a href="#"></a>');
						// TODO: make this faster
						t.children('a').html(t.children('a').html().replace(/[\s\t\n]+$/,''));
					}
					else {
						if(!$.trim(t.children('a').attr('href'))) { t.children('a').attr("href","#"); }
					}
					if(!t.children("ins.jstree-ocl").length) {
						t.prepend("<ins class='jstree-icon jstree-ocl'>&#160;</ins>");
					}
					if(t.is(":last-child")) {
						t.addClass("jstree-last");
					}
					switch(s) {
						case 'leaf':
							t.addClass('jstree-leaf');
							break;
						case 'closed':
							t.addClass('jstree-open');
							_this.close_node(t, 0);
							break;
						case 'open':
							t.addClass('jstree-closed');
							_this.open_node(t, false, 0);
							break;
					}
				});
			},
			/*
				Function: correct_node
				This function corrects the open/closed/leaf state as data changes (as the user interacts with the tree).
				The core calls this function automatically when a node is opened, deleted or moved.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc. If _-1_ is used or is omitted the root nodes are processed.

				Returns:
					jQuery collection - the processed children of the original node.
			*/
			/* PROCESS SINGLE NODE (OR USE BOOLEAN single PARAM), CALL FROM CLEAN_NODE, LOSE THE EVENTS ABOVE */
			correct_node : function (obj, deep) {
				obj = this.get_node(obj);
				if(!obj || (obj === -1 && !deep)) { return false; }
				if(obj === -1) { obj = this.get_container().find('li'); }
				else { obj = deep ? obj.find('li').andSelf() : obj; }
				obj.each(function () {
					var obj = $(this);
					switch(!0) {
						case obj.hasClass("jstree-open") && !obj.find("> ul > li").length:
							obj.removeClass("jstree-open").addClass("jstree-leaf").children("ul").remove(); // children("ins").html("&#160;").end()
							break;
						case obj.hasClass("jstree-leaf") && !!obj.find("> ul > li").length:
							obj.removeClass("jstree-leaf").addClass("jstree-closed"); //.children("ins").html("+");
							break;
					}
					obj[obj.is(":last-child") ? 'addClass' : 'removeClass']("jstree-last");
				});
				return obj;
			},
			/*
				Function: scroll_to_node
				This function scrolls the container to the desired node (if needed).

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
			*/
			scroll_to_node : function (obj) {
				var c = this.get_container()[0], t;
				if(c.scrollHeight > c.offsetHeight) {
					obj = this.get_node(obj);
					if(!obj || obj === -1 || !obj.length || !obj.is(":visible")) { return; }
					t = obj.offset().top - this.get_container().offset().top;
					if(t < 0) {
						c.scrollTop = c.scrollTop + t - 1;
					}
					if(t + this.data.core.li_height + (c.scrollWidth > c.offsetWidth ? $.jstree.SCROLLBAR_WIDTH : 0) > c.offsetHeight) {
						c.scrollTop = c.scrollTop + (t - c.offsetHeight + this.data.core.li_height + 1 + (c.scrollWidth > c.offsetWidth ? $.jstree.SCROLLBAR_WIDTH : 0));
					}
				}
			},
			/*
				Function: get_state
				This function returns the current state of the tree (as collected from all active plugins).
				Plugin authors: pay special attention to the way this function is extended for new plugins. In your plugin code write:
				> get_state : function () {
				>   var state = this.__call_old();
				>   state.your-plugin-name = <some-value-you-collect>;
				>   return state;
				> }

				Returns:
					object - the current state of the instance
			*/
			get_state : function () { // TODO: scroll position, theme
				var state	= { 'open' : [], 'scroll' : { 'left' : this.get_container().scrollLeft(), 'top' : this.get_container().scrollTop() } };
				this.get_container_ul().find('.jstree-open').each(function () { if(this.id) { state.open.push(this.id); } });
				return state;
			},
			/*
				Function: set_state
				This function returns sets the state of the tree.
				Plugin authors: pay special attention to the way this function is extended for new plugins. In your plugin code write:
				> set_state : function (state, callback) {
				>   if(this.__call_old()) {
				>     if(state.your-plugin-name) {
				>
				>       // restore using `state.your-plugin-name`
				>       // if you need some async activity so that you return to this bit of code
				>       // do not delete state.your-plugin-name and return false (see core's function for example)
				>
				>       delete state.your-plugin-name;
				>       this.set_state(state, callback);
				>       return false;
				>     }
				>     return true;
				>   }
				>   return false;
				> }

				Parameters:
					state - *object* the state to restore to
					callback - *function* this will be executed in the instance's scope once restoring is done

				Returns:
					boolean - the return value is used to determine the phase of restoration

				Triggers:
					<set_state>

				Event: set_state
				This event is triggered in the *jstree* namespace when a set_state call completes.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else)
			*/
			set_state : function (state, callback) {
				if(state) {
					if($.isArray(state.open)) {
						var res = true,
							t = this;
						//this.close_all();
						$.each(state.open.concat([]), function (i, v) {
							v = document.getElementById(v);
							if(v) {
								if(t.is_loaded(v)) {
									if(t.is_closed(v)) {
										t.open_node(v, false, 0);
									}
									$.vakata.array_remove(state.open, i);
								}
								else {
									if(!t.is_loading(v)) {
										t.open_node(v, $.proxy(function () { this.set_state(state); }, t), 0);
									}
									// there will be some async activity - so wait for it
									res = false;
								}
							}
						});
						if(res) {
							delete state.open;
							this.set_state(state, callback);
						}
						return false;
					}
					if(state.scroll) {
						if(state.scroll && typeof state.scroll.left !== 'undefined') {
							this.get_container().scrollLeft(state.scroll.left);
						}
						if(state.scroll && typeof state.scroll.top !== 'undefined') {
							this.get_container().scrollTop(state.scroll.top);
						}
						delete state.scroll;
						delete state.open;
						this.set_state(state, callback);
						return false;
					}
					if($.isEmptyObject(state)) {
						if(callback) { callback.call(this); }
						this.__callback();
						return false;
					}
					return true;
				}
				return false;
			},
			/*
				Function: refresh
				This function saves the current state, reloads the complete tree and returns it to the saved state.

				Triggers:
					<refresh>

				Event: refresh
				This event is triggered in the *jstree* namespace when a refresh call completes.

				Parameters:
					data.inst - the instance
			*/
			refresh : function () {
				this.data.core.state = this.get_state();
				this.load_node(-1, function (o, s) {
					if(s) {
						this.set_state($.extend(true, {}, this.data.core.state), function () { this.__trigger('refresh'); });
					}
					this.data.core.state = null;
				});
			},
			/*
				Function: get_text
				This function returns the title of the node.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
					remove_html - *boolean* set to _true_ to return plain text instead of HTML

				Returns:
					string - the title of the node, specified by _obj_
			*/
			get_text : function (obj, remove_html) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				obj = obj.children("a:eq(0)").clone();
				obj.children(".jstree-icon").remove();
				obj = obj[ remove_html ? 'text' : 'html' ]();
				obj = $('<div />')[ remove_html ? 'text' : 'html' ](obj);
				return obj.html();
			},
			/*
				Function: set_text
				This function sets the title of the node. This is a low-level function, you'd be better off using <rename>.

				Parameters:
					obj - *mixed* this is used as a jquery selector - can be jQuery object, DOM node, string, etc.
					val - *string* the new title of the node (can be HTMl too)

				Returns:
					boolean - was the rename successfull

				Triggers:
					<set_text>

				Event: set_text
				This event is triggered in the *jstree* namespace when a set_text call completes.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else)
					data.rslt - *object* which contains a two keys: _obj_ (the node) and _val_ (the new title).

				Example:
				> $("div").bind("set_text.jstree", function (e, data) {
				>   alert("Renamed to: " + data.rslt.val);
				> });
			*/
			set_text : function (obj, val) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				obj = obj.children("a:eq(0)");
				var tmp = obj.children("INS").clone();
				obj.html(val).prepend(tmp);
				this.__callback({ "obj" : obj, "text" : val });
				return true;
			},
			/*
				Function: parse_json
				This function returns a jQuery node after parsing a JSON object (a LI node for single elements or an UL node for multiple). This function will use the default title from <jstree.config.core.strings> if none is specified.

				Parameters:
					node - *mixed* the input to parse
					> // can be a string
					> "The title of the parsed node"
					> // array of strings
					> [ "Node 1", "Node 2" ]
					> // an object
					> { "title" : "The title of the parsed node" }
					> // you can manipulate the output
					> { "title" : "The title of the parsed node", "li_attr" : { "id" : "id_for_li" }, "a_attr" : { "href" : "http://jstree.com" } }
					> // you can supply metadata, which you can later access using $(the_li_node).data()
					> { "title" : "The title of the parsed node", "data" : { <some-values-here> } }
					> // you can supply children (they can be objects too)
					> { "title" : "The title of the parsed node", "children" : [ "Node 1", { "title" : "Node 2" } ] }

				Returns:
					jQuery - the LI (or UL) node which was produced from the JSON
			*/
			parse_json : function (node) {
				var li, a, ul, t;
				if(node === null || ($.isArray(node) && node.length === 0)) {
					return false;
				}
				if($.isArray(node)) {
					ul	= $("<ul />");
					t	= this;
					$.each(node, function (i, v) {
						ul.append(t.parse_json(v));
					});
					return ul;
				}
				if(typeof node === "undefined") { node = {}; }
				if(typeof node === "string") { node = { "title" : node }; }
				if(!node.li_attr) { node.li_attr = {}; }
				if(!node.a_attr) { node.a_attr = {}; }
				if(!node.a_attr.href) { node.a_attr.href = '#'; }
				if(!node.title) { node.title = this._get_string("New node"); }

				li	= $("<li />").attr(node.li_attr);
				a	= $("<a />").attr(node.a_attr).html(node.title);
				ul	= $("<ul />");
				if(node.data && !$.isEmptyObject(node.data)) { li.data(node.data); }
				if(
					node.children === true ||
					$.isArray(node.children) ||
					(li.data('jstree') && $.isArray(li.data('jstree').children))
				) {
					if(!li.data('jstree')) {
						li.data('jstree', {});
					}
					li.data('jstree').closed = true;
				}
				li.append(a);
				if($.isArray(node.children)) {
					$.each(node.children, $.proxy(function (i, n) {
						ul.append(this.parse_json(n));
					}, this));
					li.append(ul);
				}
				return li;
			},
			/*
				Function: get_json
				This function returns the whole tree (or a single node) in JSON format.
				Each plugin may override this function to include its own source, but keep in mind to do it like that:
				> get_json : function(obj, is_callback) {
				>  var r = this.__call_old();
				>  if(is_callback) {
				>   if(<some-condition>) { r.data.jstree.<some-key> = <some-value-this-plugin-will-process>; }
				>  }
				>  return r;
				> }

				Parameters:
					obj - *mixed* the input to parse
					is_callback - do not modify this, jstree uses this parameter to keep track of the recursion

				Returns:
					Array - an array consisting of objects (one for each node)
			*/
			get_json : function (obj, is_callback) {
				obj = typeof obj !== 'undefined' ? this.get_node(obj) : false;
				if(!is_callback) {
					if(!obj || obj === -1) { obj = this.get_container_ul().children("li"); }
				}
				var r, t, li_attr = {}, a_attr = {}, tmp = {};
				if(!obj || !obj.length) { return false; }
				if(obj.length > 1 || !is_callback) {
					r = [];
					t = this;
					obj.each(function () {
						r.push(t.get_json($(this), true));
					});
					return r;
				}
				tmp = $.vakata.attributes(obj, true);
				$.each(tmp, function (i, v) {
					if(i === 'id') { li_attr[i] = v; return true; }
					v = $.trim(v.replace(/\bjstree[^ ]*/ig,'').replace(/\s+$/ig," "));
					if(v.length) { li_attr[i] = v; }
				});
				tmp = $.vakata.attributes(obj.children('a'), true);
				$.each(tmp, function (i, v) {
					if(i === 'id') { a_attr[i] = v; return true; }
					v = $.trim(v.replace(/\bjstree[^ ]*/ig,'').replace(/\s+$/ig," "));
					if(v.length) { a_attr[i] = v; }
				});
				r = {
					'title'		: this.get_text(obj),
					'data'		: $.extend(true, {}, obj.data() || {}),
					'children'	: false,
					'li_attr'	: li_attr,
					'a_attr'	: a_attr
				};

				if(!r.data.jstree) { r.data.jstree = {}; }
				if(this.is_open(obj)) { r.data.jstree.opened = true; }
				if(this.is_closed(obj)) { r.data.jstree.closed = true; }

				obj = obj.find('> ul > li');
				if(obj.length) {
					r.children = [];
					t = this;
					obj.each(function () {
						r.children.push(t.get_json($(this), true));
					});
				}
				return r;
			},
			/*
				Function: create_node
				This function creates a new node.

				Parameters:
					parent - *mixed* the parent for the newly created node. This is used as a jquery selector, can be jQuery object, DOM node, string, etc. Use -1 to create a new root node.
					node - *mixed* the input to parse, check <parse_json> for description
					position - *mixed* where to create the new node. Can be one of "before", "after", "first", "last", "inside" or a numerical index.
					callback - optional function to be executed once the node is created
					is_loaded - used internally when a node needs to be loaded - do not pass this

				Returns:
					jQuery - the LI node which was produced from the JSON (may return _undefined_ if the parent node is not yet loaded, but will create the node)

				Triggers:
					<create_node>

				Event: create_node
				This event is triggered in the *jstree* namespace when a new node is created.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else)
					data.rslt - *object* which contains a three keys: _obj_ (the node), _parent_ (the parent) and _position_ which is the numerical index.

				Example:
				> $("div").bind("create_node.jstree", function (e, data) {
				>   alert("Created `" + data.inst.get_text(data.rslt.obj) + "` inside `" + (data.rslt.parent === -1 ? 'the main container' : data.inst.get_text(data.rslt.parent)) + "` at index " + data.rslt.position);
				> });
			*/
			create_node : function (par, node, pos, callback, is_loaded) {
				par = this.get_node(par);
				pos = typeof pos === "undefined" ? "last" : pos;

				if(par !== -1 && !par.length) { return false; }
				if(!pos.match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
					return this.load_node(par, function () { this.create_node(par, node, pos, callback, true); });
				}

				var li = this.parse_json(node),
					tmp = par === -1 ? this.get_container() : par;

				if(par === -1) {
					if(pos === "before") { pos = "first"; }
					if(pos === "after") { pos = "last"; }
				}
				switch(pos) {
					case "before":
						pos = par.index();
						par = this.get_parent(par);
						break;
					case "after" :
						pos = par.index() + 1;
						par = this.get_parent(par);
						break;
					case "inside":
					case "first":
						pos = 0;
						break;
					case "last":
						pos = tmp.children('ul').children('li').length;
						break;
					default:
						if(!pos) { pos = 0; }
						break;
				}
				if(!this.check("create_node", li, par, pos)) { return false; }

				tmp = par === -1 ? this.get_container() : par;
				if(!tmp.children("ul").length) { tmp.append("<ul />"); }
				if(tmp.children("ul").children("li").eq(pos).length) {
					tmp.children("ul").children("li").eq(pos).before(li);
				}
				else {
					tmp.children("ul").append(li);
				}
				this.correct_node(par, true);
				if(callback) { callback.call(this, li); }
				this.__callback({ "obj" : li, "parent" : par, "position" : li.index() });
				return li;
			},
			/*
				Function: rename_node
				This function renames a new node.

				Parameters:
					obj - *mixed* the node to rename. This is used as a jquery selector, can be jQuery object, DOM node, string, etc.
					val - *string* the new title

				Triggers:
					<rename_node>

				Event: rename_node
				This event is triggered in the *jstree* namespace when a node is renamed.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else)
					data.rslt - *object* which contains a three keys: _obj_ (the node), _title_ (the new title), _old_ (the old title)

				Example:
				> $("div").bind("rename_node.jstree", function (e, data) {
				>   alert("Node rename from `" + data.rslt.old + "` to `" + data.rslt.title "`");
				> });
			*/
			rename_node : function (obj, val) {
				obj = this.get_node(obj);
				var old = this.get_text(obj);
				if(!this.check("rename_node", obj, this.get_parent(obj), val)) { return false; }
				if(obj && obj.length) {
					this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
					this.__callback({ "obj" : obj, "title" : val, "old" : old });
				}
			},
			/*
				Function: delete_node
				This function deletes a node.

				Parameters:
					obj - *mixed* the node to remove. This is used as a jquery selector, can be jQuery object, DOM node, string, etc.

				Returns:
					mixed - the removed node on success, _false_ on failure

				Triggers:
					<delete_node>

				Event: delete_node
				This event is triggered in the *jstree* namespace when a node is deleted.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else)
					data.rslt - *object* which contains a three keys: _obj_ (the removed node), _prev_ (the previous sibling of the removed node), _parent_ (the parent of the removed node)

				Example:
				> $("div").bind("delete_node.jstree", function (e, data) {
				>   alert("Node deleted!");
				> });
			*/
			delete_node : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				var par = this.get_parent(obj),
					pre = this.get_prev(obj);
				if(!this.check("delete_node", obj, par, obj.index())) { return false; }
				obj = obj.detach();
				this.correct_node(par);
				this.correct_node(pre);
				this.__callback({ "obj" : obj, "prev" : pre, "parent" : par });
				return obj;
			},
			/*
				Function: check
				This function checks if a structure modification is valid.

				Parameters:
					chk - *string* what are we checking (copy_node, move_node, rename_node, create_node, delete_node)
					obj - *mixed* the node.
					par - *mixed* the parent (if dealing with a move or copy - the new parent).
					pos - *mixed* the index among the parent's children (or the new name if dealing with a rename)
					is_copy - *boolean* is this a copy or a move call

				Returns:
					boolean - _true_ if the modification is valid, _false_ otherwise
			*/
			check : function (chk, obj, par, pos) {
				var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
					chc = this.get_settings().core.check_callback;
				if(chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos) === false)) {
					return false;
				}
				tmp = tmp === -1 ? this.get_container().data('jstree') : tmp.data('jstree');
				if(tmp && tmp.functions && tmp.functions[chk]) {
					tmp = tmp.functions[chk];
					if($.isFunction(tmp)) {
						tmp = tmp.call(this, chk, obj, par, pos);
					}
					if(tmp === false) {
						return false;
					}
				}
				switch(chk) {
					case "create_node":
						break;
					case "rename_node":
						break;
					case "move_node":
						tmp = par === -1 ? this.get_container() : par;
						tmp = tmp.children('ul').children('li');
						if(tmp.length && tmp.index(obj) !== -1 && (pos === obj.index() || pos === obj.index() + 1)) {
							return false;
						}
						if(par !== -1 && par.parentsUntil('.jstree', 'li').andSelf().index(obj) !== -1) {
							return false;
						}
						break;
					case "copy_node":
						break;
					case "delete_node":
						break;
				}
				return true;
			},
			/*
				Function: move_node
				This function moves a node.

				Parameters:
					obj - *mixed* the node to move. This is used as a jquery selector, can be jQuery object, DOM node, string, etc.
					parent - *mixed* the new parent. This is used as a jquery selector, can be jQuery object, DOM node, string, etc. Use -1 to promote to a root node.
					position - *mixed* where to create the new node. Can be one of "before", "after", "first", "last", "inside" or a numerical index.
					callback - optional function to be executed once the node is moved
					is_loaded - used internally when a node needs to be loaded - do not pass this

				Returns:
					boolean - indicating if the move was successfull (may return _undefined_ if the parent node is not yet loaded, but will move the node)


				Triggers:
					<move_node>

				Event: move_node
				This event is triggered in the *jstree* namespace when a node is moved.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else)
					data.rslt - *object* which contains a five keys: _obj_ (the node), _parent_ (the new parent) and _position_ which is the numerical index, _old_parent_ (the old parent) and is_multi (a boolean indicating if the node is coming from another tree instance)

				Example:
				> $("div").bind("move_node.jstree", function (e, data) {
				>   alert("Moved `" + data.inst.get_text(data.rslt.obj) + "` inside `" + (data.rslt.parent === -1 ? 'the main container' : data.inst.get_text(data.rslt.parent)) + "` at index " + data.rslt.position);
				> });
			*/
			move_node : function (obj, par, pos, callback, is_loaded) {
				obj = this.get_node(obj);
				par = this.get_node(par);
				pos = typeof pos === "undefined" ? 0 : pos;

				if(!obj || obj === -1 || !obj.length) { return false; }
				if(par !== -1 && !par.length) { return false; }
				if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
					return this.load_node(par, function () { this.move_node(obj, par, pos, callback, true); });
				}

				var old_par = this.get_parent(obj),
					new_par = (!pos.toString().match(/^(before|after)$/) || par === -1) ? par : this.get_parent(par),
					old_ins = $.jstree._reference(obj),
					new_ins = par === -1 ? this : $.jstree._reference(par),
					is_multi = (old_ins.get_index() !== new_ins.get_index());
				if(new_par === -1) {
					par = new_ins.get_container();
					if(pos === "before") { pos = "first"; }
					if(pos === "after") { pos = "last"; }
				}
				switch(pos) {
					case "before":
						pos = par.index();
						break;
					case "after" :
						pos = par.index() + 1;
						break;
					case "inside":
					case "first":
						pos = 0;
						break;
					case "last":
						pos = par.children('ul').children('li').length;
						break;
					default:
						if(!pos) { pos = 0; }
						break;
				}
				if(!this.check("move_node", obj, new_par, pos)) { return false; }

				if(!par.children("ul").length) { par.append("<ul />"); }
				if(par.children("ul").children("li").eq(pos).length) {
					par.children("ul").children("li").eq(pos).before(obj);
				}
				else {
					par.children("ul").append(obj);
				}

				if(is_multi) { // if multitree - clean the node recursively - remove all icons, and call deep clean_node
					obj.find('.jstree-icon, .jstree-ocl').remove();
					this.clean_node(obj);
				}
				old_ins.correct_node(old_par, true);
				new_ins.correct_node(new_par, true);
				if(callback) { callback.call(this, obj, new_par, obj.index()); }
				this.__callback({ "obj" : obj, "parent" : new_par, "position" : obj.index(), "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : new_ins });
				return true;
			},
			/*
				Function: copy_node
				This function copies a node.

				Parameters:
					obj - *mixed* the node to copy. This is used as a jquery selector, can be jQuery object, DOM node, string, etc.
					parent - *mixed* the new parent. This is used as a jquery selector, can be jQuery object, DOM node, string, etc. Use -1 to promote to a root node.
					position - *mixed* where to create the new node. Can be one of "before", "after", "first", "last", "inside" or a numerical index.
					callback - optional function to be executed once the node is moved
					is_loaded - used internally when a node needs to be loaded - do not pass this

				Returns:
					boolean - indicating if the move was successfull (may return _undefined_ if the parent node is not yet loaded, but will move the node)


				Triggers:
					<copy_node>

				Event: copy_node
				This event is triggered in the *jstree* namespace when a node is copied.

				Parameters:
					data.inst - the instance
					data.args - *array* the arguments passed to the function
					data.plugin - *string* the function's plugin (here it will be _"core"_ but if the function is extended it may be something else)
					data.rslt - *object* which contains a five keys: _obj_ (the node), _parent_ (the new parent) and _position_ which is the numerical index, _original_ (the original object), is_multi (a boolean indicating if the node is coming from another tree instance, _old_instance_ (the source instance) and _new_instance_ (the receiving instance))

				Example:
				> $("div").bind("copy_node.jstree", function (e, data) {
				>   alert("Copied `" + data.inst.get_text(data.rslt.original) + "` inside `" + (data.rslt.parent === -1 ? 'the main container' : data.inst.get_text(data.rslt.parent)) + "` at index " + data.rslt.position);
				> });
			*/
			copy_node : function (obj, par, pos, callback, is_loaded) {
				obj = this.get_node(obj);
				par = this.get_node(par);
				pos = typeof pos === "undefined" ? "last" : pos;

				if(!obj || obj === -1 || !obj.length) { return false; }
				if(par !== -1 && !par.length) { return false; }
				if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
					return this.load_node(par, function () { this.copy_node(obj, par, pos, callback, true); });
				}
				var org_obj = obj,
					old_par = this.get_parent(obj),
					new_par = (!pos.toString().match(/^(before|after)$/) || par === -1) ? par : this.get_parent(par),
					old_ins = $.jstree._reference(obj),
					new_ins = par === -1 ? this : $.jstree._reference(par),
					is_multi = (old_ins.get_index() !== new_ins.get_index());

				obj = obj.clone(true);
				obj.find("*[id]").andSelf().each(function () {
					if(this.id) { this.id = "copy_" + this.id; }
				});
				if(new_par === -1) {
					par = new_ins.get_container();
					if(pos === "before") { pos = "first"; }
					if(pos === "after") { pos = "last"; }
				}
				switch(pos) {
					case "before":
						pos = par.index();
						break;
					case "after" :
						pos = par.index() + 1;
						break;
					case "inside":
					case "first":
						pos = 0;
						break;
					case "last":
						pos = par.children('ul').children('li').length;
						break;
					default:
						if(!pos) { pos = 0; }
						break;
				}

				if(!this.check("copy_node", org_obj, new_par, pos)) { return false; }

				if(!par.children("ul").length) { par.append("<ul />"); }
				if(par.children("ul").children("li").eq(pos).length) {
					par.children("ul").children("li").eq(pos).before(obj);
				}
				else {
					par.children("ul").append(obj);
				}
				if(is_multi) { // if multitree - clean the node recursively - remove all icons, and call deep clean_node
					obj.find('.jstree-icon, .jstree-ocl').remove();
				}
				new_ins.clean_node(obj); // always clean so that selected states, etc. are removed
				new_ins.correct_node(new_par, true); // no need to correct the old parent, as nothing has changed there
				if(callback) { callback.call(this, obj, new_par, obj.index(), org_obj); }
				this.__callback({ "obj" : obj, "parent" : new_par, "old_parent" : old_par, "position" : obj.index(), "original" : org_obj, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : new_ins });
				return true;
			},

			cut : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				ccp_node = obj;
				ccp_mode = 'move_node';
				this.__callback({ "obj" : obj });
			},
			copy : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				ccp_node = obj;
				ccp_mode = 'copy_node';
				this.__callback({ "obj" : obj });
			},
			can_paste : function () {
				return ccp_mode !== false && ccp_node !== false;
			},
			paste : function (obj) {
				obj = this.get_node(obj);
				if(!obj || !ccp_mode || !ccp_mode.match(/^(copy_node|move_node)$/) || !ccp_node) { return false; }
				this[ccp_mode](ccp_node, obj);
				this.__callback({ "obj" : obj, "nodes" : ccp_node, "mode" : ccp_mode });
				ccp_node = false;
				ccp_mode = false;
			},

			edit : function (obj, default_text) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				obj.parentsUntil(".jstree",".jstree-closed").each($.proxy(function (i, v) {
					this.open_node(v, false, 0);
				}, this));
				var rtl = this.data.core.rtl,
					w  = this.get_container().width(),
					a  = obj.children('a:eq(0)'),
					oi = obj.children("ins"),
					ai = a.children("ins"),
					w1 = oi.width() * oi.length,
					w2 = ai.width() * ai.length,
					t  = typeof default_text === 'string' ? default_text : this.get_text(obj),
					h1 = $("<div />", { css : { "position" : "absolute", "top" : "-200px", "left" : (rtl ? "0px" : "-1000px"), "visibility" : "hidden" } }).appendTo("body"),
					h2 = obj.css("position","relative").append(
						$("<input />", {
							"value" : t,
							"class" : "jstree-rename-input",
							// "size" : t.length,
							"css" : {
								"padding" : "0",
								"border" : "1px solid silver",
								"position" : "absolute",
								"left"  : (rtl ? "auto" : (w1 + w2 + 4) + "px"),
								"right" : (rtl ? (w1 + w2 + 4) + "px" : "auto"),
								"top" : "0px",
								"height" : (this.data.core.li_height - 2) + "px",
								"lineHeight" : (this.data.core.li_height - 2) + "px",
								"width" : "150px" // will be set a bit further down
							},
							"blur" : $.proxy(function () {
								var i = obj.children(".jstree-rename-input"),
									v = i.val();
								if(v === "") { v = t; }
								h1.remove();
								i.remove();
								this.rename_node(obj, v);
								obj.css("position", "");
							}, this),
							"keyup" : function (event) {
								var key = event.keyCode || event.which;
								if(key === 27) { this.value = t; this.blur(); return; }
								else if(key === 13) { this.blur(); return; }
								else { h2.width(Math.min(h1.text("pW" + this.value).width(),w)); }
							},
							"keypress" : function(event) {
								var key = event.keyCode || event.which;
								if(key === 13) { return false; }
							}
						})
					).children(".jstree-rename-input"),
					fn = {
							fontFamily		: a.css('fontFamily')		|| '',
							fontSize		: a.css('fontSize')			|| '',
							fontWeight		: a.css('fontWeight')		|| '',
							fontStyle		: a.css('fontStyle')		|| '',
							fontStretch		: a.css('fontStretch')		|| '',
							fontVariant		: a.css('fontVariant')		|| '',
							letterSpacing	: a.css('letterSpacing')	|| '',
							wordSpacing		: a.css('wordSpacing')		|| ''
					};
				this.set_text(obj, "");
				h1.css(fn);
				h2.css(fn).width(Math.min(h1.text("pW" + h2[0].value).width(),w))[0].select();
			}
		}
	});

	// add core CSS
	$(function() {
		var css_string = '' +
				'.jstree * { -webkit-box-sizing:content-box; -moz-box-sizing:content-box; box-sizing:content-box; }' +
				'.jstree ul, .jstree li { display:block; margin:0 0 0 0; padding:0 0 0 0; list-style-type:none; list-style-image:none; } ' +
				'.jstree li { display:block; min-height:18px; line-height:18px; white-space:nowrap; margin-left:18px; min-width:18px; } ' +
				'.jstree-rtl li { margin-left:0; margin-right:18px; } ' +
				'.jstree > ul > li { margin-left:0px; } ' +
				'.jstree-rtl > ul > li { margin-right:0px; } ' +
				'.jstree .jstree-icon { display:inline-block; text-decoration:none; margin:0; padding:0; vertical-align:top; } ' +
				'.jstree .jstree-ocl { width:18px; height:18px; text-align:center; line-height:18px; cursor:pointer; vertical-align:top; } ' +
				'.jstree a { display:inline-block; line-height:16px; height:16px; color:black; white-space:nowrap; padding:1px 2px; margin:0; } ' +
				'.jstree a:focus { outline: none; } ' +
				'li.jstree-open > ul { display:block; } ' +
				'li.jstree-closed > ul { display:none; } ';
		// Correct IE 6 (does not support the > CSS selector)
		if($.jstree.IS_IE6) {
			try { document.execCommand("BackgroundImageCache", false, true); } catch (err) { } // prevents flickers
			css_string += '' +
				'.jstree li { height:18px; margin-left:0; margin-right:0; } ' +
				'.jstree li li { margin-left:18px; } ' +
				'.jstree-rtl li li { margin-left:0px; margin-right:18px; } ' +
				'li.jstree-open ul { display:block; } ' +
				'li.jstree-closed ul { display:none !important; } ' +
				'.jstree li a { display:inline; border-width:0 !important; padding:0px 2px !important; } ';
		}
		// Correct IE 7 (shifts anchor nodes onhover)
		if($.jstree.IS_IE7) {
			css_string += '.jstree li a { border-width:0 !important; padding:0px 2px !important; } ';
		}
		// Correct ff2 lack of display:inline-block
		if($.jstree.IS_FF2) {
			css_string += '' +
				'.jstree .jstree-icon { display:-moz-inline-box; } ' +
				'.jstree li { line-height:12px; } ' + // WHY??
				'.jstree a { display:-moz-inline-box; } ';
				/* за темите
				'.jstree .jstree-no-icons .jstree-checkbox { display:-moz-inline-stack !important; } ';
				*/
		}
		// the default stylesheet
		$.vakata.css.add_sheet({ str : css_string, title : "jstree" });
	});
})(jQuery);

})();
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
			three_state : true,
			name : 'jstree[]'
		},
		_fn : {
			/*
				Group: CHECKBOX functions
			*/
			check_node : function (obj) {
				obj = this.get_node(obj);
				obj.find(' > a > .jstree-checkbox').removeClass('jstree-unchecked jstree-undetermined').addClass('jstree-checked').children(':checkbox').prop('checked', true).prop('indeterminate', false);
				this.checkbox_repair(obj);
				this.__callback({ "obj" : obj });
			},
			uncheck_node : function (obj) {
				obj = this.get_node(obj);
				obj.find(' > a > .jstree-checkbox').removeClass('jstree-checked jstree-undetermined').addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('indeterminate', false);
				this.checkbox_repair(obj);
				this.__callback({ "obj" : obj });
			},
			toggle_check : function (obj) {
				obj = obj.find(' > a > .jstree-checkbox').removeClass('jstree-undetermined').toggleClass('jstree-checked');
				if(!obj.hasClass('jstree-checked')) {
					this.uncheck_node(obj);
				}
				else {
					this.check_node(obj);
				}
			},
			uncheck_all : function (context) {
				var ret = context ? $(context).find(".jstree-checked").closest('li') : this.get_container().find(".jstree-checked").closest('li');
				ret.children(".jstree-checkbox").removeClass("jstree-checked jstree-undetermined").addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('indeterminate', false);
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
					obj.find('.jstree-checkbox').removeClass('jstree-undetermined jstree-unchecked').addClass('jstree-checked').children(':checkbox').prop('checked', true).prop('indeterminate', false);
				}
				if(c.hasClass('jstree-unchecked')) {
					obj.find('.jstree-checkbox').removeClass('jstree-undetermined jstree-checked').addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('indeterminate', false);
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
						c.removeClass('jstree-undetermined jstree-checked').addClass('jstree-unchecked').children(':checkbox').prop('checked', false).prop('indeterminate', false);
						continue;
					}
					if(sc === st) {
						c = obj.find(' > a > .jstree-checkbox');
						if(c.hasClass('jstree-checked')) { return; }
						c.removeClass('jstree-undetermined jstree-unchecked').addClass('jstree-checked').children(':checkbox').prop('checked', true).prop('indeterminate', false);
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
					o.children("a").prepend("<ins class='jstree-icon jstree-checkbox " + (d && d.checkbox && d.checkbox.checked === true ? 'jstree-checked' : '') + ( (d && d.checkbox && d.checkbox.checked === false) || !t.get_settings(true).checkbox.three_state ? 'jstree-unchecked' : '') + " '><input class='jstree-check' type='checkbox' " + (d && d.checkbox && d.checkbox.checked ? ' checked="checked" ' : '') + " name='" + (d && d.checkbox && typeof d.checkbox.name !== 'undefined' ? d.checkbox.name : t.get_settings(true).checkbox.name) + "' value='" + (d && d.checkbox && typeof d.checkbox.value !== 'undefined' ? d.checkbox.value : o.attr('id')) + "' /></ins>");
				});
				t.checkbox_repair(obj);
				return obj;
			},
			get_state : function () {
				var state = this.__call_old();
				state.checkbox = [];
				this.get_container().find('.jstree-checked').closest('li').each(function () { if(this.id) { state.checkbox.push(this.id); } });
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
					if(i.attr('name') !== 'jstree[]') { r.data.jstree.checkbox.name = i.attr('name'); }
					if(i.val() !== obj.attr('id')) { r.data.jstree.checkbox.value = i.val(); }
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
				// TODO: in "_disabled" call this._check()
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
							if(inst.data.ui && inst.is_selected(obj)) {
								obj = inst.get_selected();
							}
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
									if(this.data.ui && inst.is_selected(obj)) {
										obj = inst.get_selected();
									}
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
									if(this.data.ui && inst.is_selected(obj)) {
										obj = inst.get_selected();
									}
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
/* File: jstree.dnd.js
Enables drag'n'drop.
*/
/* Group: jstree drag'n'drop plugin */

(function ($) {
	$.jstree.plugin("dnd", {
		__construct : function () {
			this.get_container()
				.delegate('a', 'mousedown', $.proxy(function (e) {
					var obj = this.get_node(e.target);
					if(obj && obj !== -1 && obj.length && e.which === 1) { // TODO: think about e.which
						this.get_container().trigger('mousedown.jstree');
						return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : obj }, '<div id="jstree-dnd" class="' + (this.data.themes ? 'jstree-' + this.get_theme() : '') + '"><ins class="jstree-icon jstree-er">&#160;</ins>' + this.get_text(e.currentTarget, true) + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
					}
				}, this));
		},
		// TODO: is check_timeout or is it OK as is?
		// TODO: drag foreign items / drop foreign items (pretty easy with dnd events, but need to move marker placement in a function)
		defaults : {
			copy_modifier : 'ctrl',
			open_timeout : 500
		}
	});

	$(function() {
		// bind only once for all instances
		var lastmv = false,
			opento = false,
			marker = $('<div id="jstree-marker">&#160;</div>').hide().appendTo('body');

		$(document)
			.bind('dnd_start.vakata', function (e, data) {
				lastmv = false;
			})
			.bind('dnd_move.vakata', function (e, data) {
				if(opento) { clearTimeout(opento); }
				if(!data.data.jstree) { return; }

				// if we are hovering the marker image do nothing (can happen on "inside" drags)
				if(data.event.target.id && data.event.target.id === 'jstree-marker') {
					return;
				}

				var ins = $.jstree._reference(data.event.target),
					ref = false,
					off = false,
					rel = false,
					l, t, h, p, i, o;
				// if we are over an instance
				if(ins && ins.data && ins.data.dnd) {
					marker.attr('class', (ins.data.themes ? 'jstree-' + ins.get_theme() : ''));
					data.helper
						.children().attr('class', (ins.data.themes ? 'jstree-' + ins.get_theme() : ''))
						.find('.jstree-copy:eq(0)')[ data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'show' : 'hide' ]();


					// if are hovering the container itself add a new root node
					if(data.event.target === ins.get_container()[0] || data.event.target === ins.get_container_ul()[0]) {
						if(ins.check( (data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? "copy_node" : "move_node"), data.data.obj, -1, 'last')) {
							lastmv = { 'ins' : ins, 'par' : -1, 'pos' : 'last' };
							marker.hide();
							data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-er').addClass('jstree-ok');
							return;
						}
					}
					else {
						// if we are hovering a tree node
						ref = $(data.event.target).closest('a');
						if(ref && ref.length && ref.parent().is('.jstree-closed, .jstree-open, .jstree-leaf')) {
							off = ref.offset();
							rel = data.event.pageY - off.top;
							h = ref.height();
							if(rel < h / 3) {
								o = ['b', 'i', 'a'];
							}
							else if(rel > h - h / 3) {
								o = ['a', 'i', 'b'];
							}
							else {
								o = rel > h / 2 ? ['i', 'a', 'b'] : ['i', 'b', 'a'];
							}
							$.each(o, function (j, v) {
								switch(v) {
									case 'b':
										l = off.left - 6;
										t = off.top - 5;
										p = ins.get_parent(ref);
										i = ref.parent().index();
										break;
									case 'i':
										l = off.left - 2;
										t = off.top - 5 + h / 2 + 1;
										p = ref.parent();
										i = 0;
										break;
									case 'a':
										l = off.left - 6;
										t = off.top - 5 + h + 2;
										p = ins.get_parent(ref);
										i = ref.parent().index() + 1;
										break;
								}
								/*
								// TODO: moving inside, but the node is not yet loaded?
								// the check will work anyway, as when moving the node will be loaded first and checked again
								if(v === 'i' && !ins.is_loaded(p)) { }
								*/
								if(ins.check((data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? "copy_node" : "move_node"),data.data.obj, p, i)) {
									if(v === 'i' && ref.parent().is('.jstree-closed') && ins.get_settings(true).dnd.open_timeout) {
										opento = setTimeout((function (x, z) { return function () { x.open_node(z); }; })(ins, ref), ins.get_settings(true).dnd.open_timeout);
									}
									lastmv = { 'ins' : ins, 'par' : p, 'pos' : i };
									marker.css({ 'left' : l + 'px', 'top' : t + 'px' }).show();
									data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-er').addClass('jstree-ok');
									o = true;
									return false;
								}
							});
							if(o === true) { return; }
						}
					}
				}
				lastmv = false;
				data.helper.find('.jstree-icon').removeClass('jstree-ok').addClass('jstree-er');
				marker.hide();
			})
			.bind('dnd_scroll.vakata', function (e, data) {
				if(!data.data.jstree) { return; }
				marker.hide();
				lastmv = false;
				data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-ok').addClass('jstree-er');
			})
			.bind('dnd_stop.vakata', function (e, data) {
				if(opento) { clearTimeout(opento); }
				if(!data.data.jstree) { return; }
				marker.hide();
				if(lastmv) {
					lastmv.ins[ data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'copy_node' : 'move_node' ]
						(data.data.obj, lastmv.par, lastmv.pos);
				}
			})
			.bind('keyup keydown', function (e, data) {
				data = $.vakata.dnd._get();
				if(data.data && data.data.jstree) {
					data.helper.find('.jstree-copy:eq(0)')[ e[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'show' : 'hide' ]();
				}
			});

		// add DND CSS
		var css_string = '' +
				'#jstree-marker { position: absolute; top:0; left:0; margin:0; padding:0; border-right:0; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:5px solid; width:0; height:0; font-size:0; line-height:0; _border-top-color:pink; _border-botton-color:pink; _filter:chroma(color=pink); } ' +
				'#jstree-dnd { line-height:16px; margin:0; padding:4px; } ' +
				'#jstree-dnd .jstree-icon, #jstree-dnd .jstree-copy { display:inline-block; text-decoration:none; margin:0 2px 0 0; padding:0; width:16px; height:16px; } ' +
				'#jstree-dnd .jstree-ok { background:green; } ' +
				'#jstree-dnd .jstree-er { background:red; } ' +
				'#jstree-dnd .jstree-copy { margin:0 2px 0 2px; }';
		$.vakata.css.add_sheet({ str : css_string, title : "jstree" });
	});
	// include the dnd plugin by default
	$.jstree.defaults.plugins.push("dnd");
})(jQuery);
/* File: jstree.hotkeys.js
Enables keyboard shortcuts. Depends on jQuery.hotkeys (included in vakata.js).
*/
/* Group: jstree hotkeys plugin */
(function ($) {
	if(typeof $.hotkeys === "undefined" && typeof $.vakata_hotkeys === "undefined") { throw "jsTree hotkeys: jQuery hotkeys plugin not included."; }

	var bound = [];
	function exec(i, event) {
		var f = $.jstree._focused(), tmp;
		if(f && f.data && f.data.hotkeys && f.data.hotkeys.enabled) {
			tmp = f.get_settings(true).hotkeys[i];
			if(tmp) { return tmp.call(f, event); }
		}
		return true;
	}
	$.jstree.plugin("hotkeys", {
		__construct : function () {
			if(!this.data.ui) { throw "jsTree hotkeys: jsTree UI plugin not included."; }
			$.each(this.get_settings(true).hotkeys, function (i, v) {
				if(v !== false && $.inArray(i, bound) === -1) {
					$(document).bind("keydown", i, function (event) { return exec(i, event); });
					bound.push(i);
				}
			});
			this.get_container()
				.bind("lock.jstree", $.proxy(function () {
						if(this.data.hotkeys.enabled) { this.data.hotkeys.enabled = false; this.data.hotkeys.revert = true; }
					}, this))
				.bind("unlock.jstree", $.proxy(function () {
						if(this.data.hotkeys.revert) { this.data.hotkeys.enabled = true; }
					}, this));
			this.enable_hotkeys();
		},
		defaults : {
			"up" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected || -1;
				this.hover_node(this.get_prev(o));
				return false;
			},
			"ctrl+up" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected || -1;
				this.hover_node(this.get_prev(o));
				return false;
			},
			"shift+up" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected || -1;
				this.hover_node(this.get_prev(o));
				return false;
			},
			"down" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected || -1;
				this.hover_node(this.get_next(o));
				return false;
			},
			"ctrl+down" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected || -1;
				this.hover_node(this.get_next(o));
				return false;
			},
			"shift+down" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected || -1;
				this.hover_node(this.get_next(o));
				return false;
			},
			"left" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected;
				if(o) {
					if(o.hasClass("jstree-open")) { this.close_node(o); }
					else { this.hover_node(this.get_prev(o)); }
				}
				return false;
			},
			"ctrl+left" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected;
				if(o) {
					if(o.hasClass("jstree-open")) { this.close_node(o); }
					else { this.hover_node(this.get_prev(o)); }
				}
				return false;
			},
			"shift+left" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected;
				if(o) {
					if(o.hasClass("jstree-open")) { this.close_node(o); }
					else { this.hover_node(this.get_prev(o)); }
				}
				return false;
			},
			"right" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected;
				if(o && o.length) {
					if(o.hasClass("jstree-closed")) { this.open_node(o); }
					else { this.hover_node(this.get_next(o)); }
				}
				return false;
			},
			"ctrl+right" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected;
				if(o && o.length) {
					if(o.hasClass("jstree-closed")) { this.open_node(o); }
					else { this.hover_node(this.get_next(o)); }
				}
				return false;
			},
			"shift+right" : function () {
				var o = this.data.ui.hovered || this.data.ui.last_selected;
				if(o && o.length) {
					if(o.hasClass("jstree-closed")) { this.open_node(o); }
					else { this.hover_node(this.get_next(o)); }
				}
				return false;
			},
			"space" : function () {
				if(this.data.ui.hovered) { this.data.ui.hovered.children("a:eq(0)").click(); }
				return true;
			},
			"ctrl+space" : function (event) {
				event.type = "click";
				if(this.data.ui.hovered) { this.data.ui.hovered.children("a:eq(0)").trigger(event); }
				return false;
			},
			"shift+space" : function (event) {
				event.type = "click";
				if(this.data.ui.hovered) { this.data.ui.hovered.children("a:eq(0)").trigger(event); }
				return false;
			}
		},
		_fn : {
			enable_hotkeys : function () {
				this.data.hotkeys.enabled = true;
			},
			disable_hotkeys : function () {
				this.data.hotkeys.enabled = false;
			}
		}
	});
	$.jstree.defaults.plugins.push("hotkeys");
})(jQuery);
/* File: jstree.html.js
This plugin makes it possible for jstree to use HTML data sources (other than the container's initial HTML).
*/
/* Group: jstree html plugin */
(function ($) {
	$.jstree.plugin("html", {
		defaults : {
			data	: false,
			ajax	: false
		},
		_fn : {
			_append_html_data : function (dom, data) {
				data = $(data);
				dom = this.get_node(dom);
				if(!data || !data.length || !data.is('ul, li')) {
					if(dom && dom !== -1 && dom.is('li')) {
						dom.removeClass('jstree-closed').addClass('jstree-leaf').children('ul').remove();
					}
					return true;
				}
				if(dom === -1) { dom = this.get_container(); }
				if(!dom.length) { return false; }
				if(!dom.children('ul').length) { dom.append('<ul />'); }
				dom.children('ul').empty().append(data.is('ul') ? data.children('li') : data);
				return true;
			},
			_load_node : function (obj, callback) {
				var d = false,
					s = this.get_settings().html;
				obj = this.get_node(obj);
				if(!obj) { return false; }

				switch(!0) {
					// no settings - user original html
					case (!s.data && !s.ajax):
						if(obj === -1) {
							this._append_html_data(-1, this.data.core.original_container_html.clone(true));
						}
						return callback.call(this, true);
					// data is function
					case ($.isFunction(s.data)):
						return s.data.call(this, obj, $.proxy(function (d) {
							return callback.call(this, this._append_html_data(obj, d));
						}, this));
					// data is set, ajax is not set, or both are set, but we are dealing with root node
					case ((!!s.data && !s.ajax) || (!!s.data && !!s.ajax && obj === -1)):
						return callback.call(this, this._append_html_data(obj, s.data));
					// data is not set, ajax is set, or both are set, but we are dealing with a normal node
					case ((!s.data && !!s.ajax) || (!!s.data && !!s.ajax && obj !== -1)):
						s.ajax.success = $.proxy(function (d, t, x) {
							var s = this.get_settings().html.ajax;
							if($.isFunction(s.success)) {
								d = s.success.call(this, d, t, x) || d;
							}
							callback.call(this, this._append_html_data(obj, d));
						}, this);
						s.ajax.error = $.proxy(function (x, t, e) {
							var s = this.get_settings().html.ajax;
							if($.isFunction(s.error)) {
								s.error.call(this, x, t, e);
							}
							callback.call(this, false);
						}, this);
						if(!s.ajax.dataType) { s.ajax.dataType = "html"; }
						if($.isFunction(s.ajax.url))	{ s.ajax.url	= s.ajax.url.call(this, obj); }
						if($.isFunction(s.ajax.data))	{ s.ajax.data	= s.ajax.data.call(this, obj); }
						return $.ajax(s.ajax);
				}
			}
		}
	});
	// include the html plugin by default
	$.jstree.defaults.plugins.push("html");
})(jQuery);
/* File: jstree.json.js
This plugin makes it possible for jstree to use JSON data sources.
*/
/* Group: jstree json plugin */
(function ($) {
	$.jstree.plugin("json", {
		__construct : function () {
			this.get_container()
				.bind("__after_close.jstree", $.proxy(function (e, data) {
						var t = $(data.rslt.obj);
						if(this.get_settings(true).json.progressive_unload) {
							t.data('jstree').children = this.get_json(t)[0].children;
							t.children("ul").remove();
						}
					}, this));
		},
		defaults : {
			data	: false,
			ajax	: false,
			progressive_render : false, // get_json, data on each node
			progressive_unload : false
		},
		_fn : {
			parse_json : function (node) {
				var s = this.get_settings(true).json;
				if($.isArray(node.children)) {
					if(s.progressive_render) {
						if(!node.data) { node.data = {}; }
						if(!node.data.jstree) { node.data.jstree = {}; }
						node.data.jstree.children = node.children;
						node.children = true;
					}
				}
				return this.__call_old(true, node);
			},
			_append_json_data : function (dom, data) {
				dom = this.get_node(dom);
				if(dom === -1) { dom = this.get_container(); }
				data = this.parse_json(data);
				if(!dom.length) { return false; }
				if(!data) {
					if(dom && dom.is('li')) {
						dom.removeClass('jstree-closed').addClass('jstree-leaf').children('ul').remove();
					}
					return true;
				}
				if(!dom.children('ul').length) { dom.append('<ul />'); }
				dom.children('ul').empty().append(data.is('li') ? data : data.children('li'));
				return true;
			},
			_load_node : function (obj, callback) {
				var d = false,
					s = this.get_settings().json;
				obj = this.get_node(obj);
				if(!obj) { return false; }

				switch(!0) {
					// root node with data
					case (obj === -1 && this.get_container().data('jstree') && $.isArray(this.get_container().data('jstree').children)):
						d = this.get_container().data('jstree').children;
						this.get_container().data('jstree').children = null;
						return callback.call(this, this._append_json_data(obj, d));
					// normal node with data
					case (obj !== -1 && obj.length && obj.data('jstree') && $.isArray(obj.data('jstree').children)):
						d = obj.data('jstree').children;
						obj.data('jstree').children = null;
						return callback.call(this, this._append_json_data(obj, d));
					// no settings
					case (!s.data && !s.ajax):
						throw "Neither data nor ajax settings supplied.";
					// data is function
					case ($.isFunction(s.data)):
						return s.data.call(this, obj, $.proxy(function (d) {
							return callback.call(this, this._append_json_data(obj, d));
						}, this));
					// data is set, ajax is not set, or both are set, but we are dealing with root node
					case ((!!s.data && !s.ajax) || (!!s.data && !!s.ajax && obj === -1)):
						return callback.call(this, this._append_json_data(obj, s.data));
					// data is not set, ajax is set, or both are set, but we are dealing with a normal node
					case ((!s.data && !!s.ajax) || (!!s.data && !!s.ajax && obj !== -1)):
						s.ajax.success = $.proxy(function (d, t, x) {
							var s = this.get_settings().json.ajax;
							if($.isFunction(s.success)) {
								d = s.success.call(this, d, t, x) || d;
							}
							callback.call(this, this._append_json_data(obj, d));
						}, this);
						s.ajax.error = $.proxy(function (x, t, e) {
							var s = this.get_settings().json.ajax;
							if($.isFunction(s.error)) {
								s.error.call(this, x, t, e);
							}
							callback.call(this, false);
						}, this);
						if(!s.ajax.dataType) { s.ajax.dataType = "json"; }
						if($.isFunction(s.ajax.url))	{ s.ajax.url	= s.ajax.url.call(this, obj); }
						if($.isFunction(s.ajax.data))	{ s.ajax.data	= s.ajax.data.call(this, obj); }
						return $.ajax(s.ajax);
				}
			}
		}
	});
	// include the json plugin by default
	// $.jstree.defaults.plugins.push("json");
})(jQuery);
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
/* File: jstree.search.js
Searches the tree using a string. DOES NOT WORK WITH JSON PROGRESSIVE RENDER!
*/
/* Group: jstree search plugin */
/*
(function ($) {
	$.jstree.plugin("search", {
		__construct : function () {
			this.data.search.str = "";
			this.data.search.result = $();
			if(this.get_settings().search.show_only_matches) {
				this.get_container()
					.bind("search.jstree", function (e, data) {
						$(this).children("ul").find("li").hide().removeClass("jstree-last");
						data.rslt.nodes.parentsUntil(".jstree").andSelf().show()
							.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
					})
					.bind("clear_search.jstree", function () {
						$(this).children("ul").find("li").css("display","").end().end().jstree("correct_node", -1, true);
					});
			}
		},
		defaults : {
			ajax : false,
			search_method : "vakata_contains", // for case insensitive - jstree_contains
			show_only_matches : false
		},
		_fn : {
			search : function (str, skip_async) {
				if($.trim(str) === "") { this.clear_search(); return; }
				var s = this.get_settings().search,
					t = this,
					error_func = function () { },
					success_func = function () { };
				this.data.search.str = str;

				if(!skip_async && s.ajax !== false && this.get_container_ul().find("li.jstree-closed:not(:has(ul)):eq(0)").length > 0) {
					this.search.supress_callback = true;
					error_func = function () { };
					success_func = function (d, t, x) {
						var sf = this.get_settings().search.ajax.success;
						if(sf) { d = sf.call(this,d,t,x) || d; }
						this.data.search.to_open = d;
						this._search_open();
					};
					s.ajax.context = this;
					s.ajax.error = error_func;
					s.ajax.success = success_func;
					if($.isFunction(s.ajax.url)) { s.ajax.url = s.ajax.url.call(this, str); }
					if($.isFunction(s.ajax.data)) { s.ajax.data = s.ajax.data.call(this, str); }
					if(!s.ajax.data) { s.ajax.data = { "search_string" : str }; }
					if(!s.ajax.dataType || /^json/.exec(s.ajax.dataType)) { s.ajax.dataType = "json"; }
					$.ajax(s.ajax);
					return;
				}
				if(this.data.search.result.length) { this.clear_search(); }
				this.data.search.result = this.get_container().find("a" + (this.data.languages ? "." + this.get_lang() : "" ) + ":" + (s.search_method) + "(" + this.data.search.str + ")");
				this.data.search.result.addClass("jstree-search").parent().parents(".jstree-closed").each(function () {
					t.open_node(this, false, true);
				});
				this.__callback({ nodes : this.data.search.result, str : str });
			},
			clear_search : function (str) {
				this.data.search.result.removeClass("jstree-search");
				this.__callback(this.data.search.result);
				this.data.search.result = $();
			},
			_search_open : function (is_callback) {
				var _this = this,
					done = true,
					current = [],
					remaining = [];
				if(this.data.search.to_open.length) {
					$.each(this.data.search.to_open, function (i, val) {
						if(val == "#") { return true; }
						if($(val).length && $(val).is(".jstree-closed")) { current.push(val); }
						else { remaining.push(val); }
					});
					if(current.length) {
						this.data.search.to_open = remaining;
						$.each(current, function (i, val) {
							_this.open_node(val, function () { _this._search_open(true); });
						});
						done = false;
					}
				}
				if(done) { this.search(this.data.search.str, true); }
			}
		}
	});
})(jQuery);
*/
/* File: jstree.sort.js
Sorts items alphabetically (or using any other function)
*/
/* Group: jstree sort plugin */
(function ($) {
	$.jstree.plugin("sort", {
		__construct : function () {
			this.get_container()
				.bind("load_node.jstree", $.proxy(function (e, data) {
						var obj = this.get_node(data.rslt.obj);
						obj = obj === -1 ? this.get_container_ul() : obj.children("ul");
						this._sort(obj, true);
					}, this))
				.bind("rename_node.jstree create_node.jstree", $.proxy(function (e, data) {
						this._sort(data.rslt.obj.parent(), false);
					}, this))
				.bind("move_node.jstree copy_node.jstree", $.proxy(function (e, data) {
						var m = data.rslt.parent === -1 ? this.get_container_ul() : data.rslt.parent.children('ul');
						this._sort(m, false);
					}, this));
		},
		defaults : function (a, b) { return this.get_text(a, true) > this.get_text(b, true) ? 1 : -1; },
		_fn : {
			_sort : function (obj, deep) {
				var s = this.get_settings(true).sort,
					t = this;
				obj.append($.makeArray(obj.children("li")).sort($.proxy(s, t)));
				obj.children('li').each(function () { t.correct_node(this, false); });
				if(deep) {
					obj.find("> li > ul").each(function() { t._sort($(this)); });
					t.correct_node(obj.children('li'), true);
				}
			}
		}
	});
	// include the sort plugin by default
	$.jstree.defaults.plugins.push("sort");
})(jQuery);
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
			events	: 'select_node.jstree open_node.jstree close_node.jstree deselect_node.jstree deselect_all.jstree check_node.jstree uncheck_node.jstree uncheck_all.jstree'
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

/* File: jstree.themes.js
Controls the looks of jstree, without this plugin you will get a functional tree, but it will look just like an ordinary UL list
*/
(function ($) {
	var themes_loaded = [];
	/*
		Group: $.jstree.

		Variable: $.jstree.THEMES_DIR
		The location of all themes, this is used when setting a theme without supplying an URL (only by name).
		Default is _false_. If left as _false_ the path will be autodetected when the DOM is ready.
		The location of _jstree.js_ is used for the autodetection.
		Normally you won't need to modify this (provided you leave the _themes_ folder in the same folder as _jquery.jstree.js_ and do not rename the file).
		If you decide to move the folder or rename the file, but still want to load themes by name, simply set this to the new location of the _themes_ folder.
		> <script type="text/javascript" src="jstree.js"></script>
		> <script type="text/javascript">$.jstree.THEMES_DIR = "some/path/with-a-trailing-slash/";</script>
	*/
	$.jstree.THEMES_DIR = false;

	$.jstree.plugin("themes", {
		__construct : function () {
			this.get_container()
				.bind("__construct.jstree", $.proxy(function () {
						var s = this.get_settings(true).themes;
						this.data.themes.dots	= s.dots;
						this.data.themes.icons	= s.icons;

						if(s.url === false && s.theme === false) {
							s.theme = this.data.core.rtl ? 'default-rtl' : 'default';
						}
						this.set_theme(s.theme, s.url, s.no_load);
					}, this))
				.bind('__construct.jstree __ready.jstree __loaded.jstree', $.proxy(function () {
						this[ this.data.themes.dots ? "show_dots" : "hide_dots" ]();
						this[ this.data.themes.icons ? "show_icons" : "hide_icons" ]();
					}, this));
		},
		/* Class: jstree */
		/*
			Group: THEMES options

			Variable: config.themes.theme
			*string* the name of the theme you want to use. Default is _default_.

			Variable: config.themes.url
			*mixed* the URL of the stylesheet of the theme you want to use. Default is _false_. If left as _false_ the location will be autodetected using <$.jstree.THEMES_DIR>.

			Variable: config.themes.no_load
			*boolean* whether to load the theme or just apply the class. Default is _false_. If left as _false_ the theme CSS will be loaded, otherwise only the theme class will be applied, assuming the CSS is already loaded.

			Variable: config.themes.dots
			*boolean* whether to show dots or not. Default is _true_. The chosen theme should support this option.

			Variable: config.themes.icons
			*boolean* whether to show icons or not. Default is _true_.
		*/
		defaults : {
			theme	: false,
			url		: false,
			no_load	: false,
			dots	: true,
			icons	: true
		},
		_fn : {
			/*
				Group: THEMES functions

				Function: set_theme
				Sets the tree theme. This function is automatically called at construction with the settings specified in <config.themes.theme> and <config.themes.theme.url>.

				Parameters:
					theme_name - the name of the theme to apply
					theme_url - the URL of the stylesheet - leave this blank for autodetect

				Example:
				>// Set the theme and autodetect the location
				>$("#div1").jstree("set_theme","classic");
				>// A custom theme. Please note that if you place your own theme in the _themes_ folder ot will be autodetected too.
				>$("#div2").jstree("set_theme","custom-theme","/some/path/theme.css");
			*/
			set_theme : function (theme_name, theme_url, no_load) {
				if(!theme_name) { return false; }
				if(!theme_url) { theme_url = $.jstree.THEMES_DIR + theme_name + '/style.css'; }
				if(!no_load && $.inArray(theme_url, themes_loaded) === -1) {
					$.vakata.css.add_sheet({ "url" : theme_url });
					themes_loaded.push(theme_url);
				}
				if(this.data.themes.theme !== theme_name) {
					this.get_container().removeClass('jstree-' + this.data.themes.theme);
					this.data.themes.theme = theme_name;
				}
				this.get_container().addClass('jstree-' + theme_name);
				this.__callback(theme_name);
			},
			get_theme		: function () { return this.data.themes.theme; },
			show_dots		: function () { this.data.themes.dots = true; this.get_container().children("ul").removeClass("jstree-no-dots"); },
			hide_dots		: function () { this.data.themes.dots = false; this.get_container().children("ul").addClass("jstree-no-dots"); },
			toggle_dots		: function () { if(this.data.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },
			show_icons		: function () { this.data.themes.icons = true; this.get_container().children("ul").removeClass("jstree-no-icons"); },
			hide_icons		: function () { this.data.themes.icons = false; this.get_container().children("ul").addClass("jstree-no-icons"); },
			toggle_icons	: function () { if(this.data.themes.icons) { this.hide_icons(); } else { this.show_icons(); } },

			set_icon : function (obj, icon) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				obj = obj.find("> a > .jstree-themeicon");
				if(icon === false) {
					this.hide_icon(obj);
				}
				else if(icon.indexOf("/") === -1) {
					obj.addClass(icon).attr("rel",icon);
				}
				else {
					obj.css("background", "url('" + icon + "') center center no-repeat").attr("rel",icon);
				}
				return true;
			},
			get_icon : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return null; }
				obj = obj.find("> a > .jstree-themeicon");
				if(obj.hasClass('jstree-themeicon-hidden')) { return false; }
				obj = obj.attr("rel");
				return (obj && obj.length) ? obj : null;
			},
			hide_icon : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				obj.find('> a > .jstree-themeicon').addClass('jstree-themeicon-hidden');
				return true;
			},
			show_icon : function (obj) {
				obj = this.get_node(obj);
				if(!obj || obj === -1 || !obj.length) { return false; }
				obj.find('> a > .jstree-themeicon').removeClass('jstree-themeicon-hidden');
				return true;
			},

			clean_node : function(obj) {
				obj = this.__call_old();
				var t = this;
				return obj.each(function () {
					var o = $(this),
						d = o.data("jstree");
					if(!o.find("> a > ins.jstree-themeicon").length) {
						o.children("a").prepend("<ins class='jstree-icon jstree-themeicon'>&#160;</ins>");
					}
					if(d && typeof d.icon !== 'undefined') {
						t.set_icon(o, d.icon);
						delete d.icon;
					}
				});
			},
			get_state : function () {
				var state = this.__call_old();
				state.themes = { 'theme' : this.get_theme(), 'icons' : this.data.themes.icons, 'dots' : this.data.themes.dots };
				return state;
			},
			set_state : function (state, callback) {
				if(this.__call_old()) {
					if(state.themes) {
						if(state.themes.theme) {
							this.set_theme(state.themes.theme);
						}
						if(typeof state.themes.dots !== 'undefined') {
							this[ state.themes.dots ? "show_dots" : "hide_dots" ]();
						}
						if(typeof state.themes.icons !== 'undefined') {
							this[ state.themes.icons ? "show_icons" : "hide_icons" ]();
						}
						delete state.themes;
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
					i = this.get_icon(obj);
					if(typeof i !== 'undefined' && i !== null) {
						r.data.jstree.icon = i;
					}
				}
				return r;
			}
		}
	});
	$(function () {
		// autodetect themes path
		if($.jstree.THEMES_DIR === false) {
			$("script").each(function () {
				if(this.src.toString().match(/jstree[^\/]*?\.js(\?.*)?$/)) {
					$.jstree.THEMES_DIR = this.src.toString().replace(/jstree[^\/]*?\.js(\?.*)?$/, "") + 'themes/';
					return false;
				}
			});
		}
		if($.jstree.THEMES_DIR === false) { $.jstree.THEMES_DIR = "themes/"; }
		// add themes specific CSS
		var css_string = '' +
				'.jstree a { text-decoration:none; } ' +
				'.jstree a > .jstree-themeicon { height:16px; width:16px; margin-right:3px; } ' +
				'.jstree-rtl a > .jstree-themeicon { margin-left:3px; margin-right:0; } ' +
				'.jstree .jstree-no-icons .jstree-themeicon, .jstree .jstree-themeicon-hidden { display:none; } ';
		// Correct IE 6 (does not support the > CSS selector)
		if($.jstree.IS_IE6) {
			css_string += '' +
				'.jstree li a .jstree-themeicon { height:16px; width:16px; margin-right:3px; } ' +
				'.jstree-rtl li a .jstree-themeicon { margin-right:0px; margin-left:3px; } ';
		}
		// the default stylesheet
		$.vakata.css.add_sheet({ str : css_string, title : "jstree" });
	});
	// include the themes plugin by default
	$.jstree.defaults.plugins.push("themes");
})(jQuery);
//*/
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
				.delegate("a", "click.jstree", $.proxy(function (e, data) {
						e.preventDefault();
						e.currentTarget.blur();
						var s = this.get_settings(true).ui;
						if(data) {
							if(s.select_multiple_modifier !== "on" && s.select_multiple_modifier !== false && data[s.select_multiple_modifier + 'Key']) {
								e[s.select_multiple_modifier + 'Key'] = data[s.select_multiple_modifier + 'Key'];
							}
							if(s.select_range_modifier !== "on" && s.select_range_modifier !== false && data[s.select_range_modifier + 'Key']) {
								e[s.select_range_modifier + 'Key'] = data[s.select_range_modifier + 'Key'];
							}
						}
						var obj			= this.get_node(e.currentTarget),
							is_selected	= this.is_selected(obj),
							is_multiple	= s.select_multiple_modifier === "on" || (s.select_multiple_modifier !== false && e && e[s.select_multiple_modifier + "Key"]),
							is_range	= s.select_range_modifier === "on" || (s.select_range_modifier !== false && e && e[s.select_range_modifier + "Key"] && this.data.ui.last_selected && this.data.ui.last_selected[0] !== obj[0] && this.data.ui.last_selected.parent()[0] === obj.parent()[0]);

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
				if(obj === -1 || !obj || !obj.length || this.is_loading(obj)) { return false; }
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
				this.data.ui.selected = $();
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
				if(obj === -1 || !obj || !obj.length || this.is_loading(obj)) { return false; }
				if(start_node === -1 || !start_node || !start_node.length || this.is_loading(start_node)) { return false; }

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
				if(obj === -1 || !obj || !obj.length || this.is_loading(obj)) { return false; }
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
						setTimeout(function () { _this.select_node(t); }, 0);
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
/* File: jstree.unique.js
Does not allow the same name amongst siblings (still a bit experimental).
*/
/* Group: jstree drag'n'drop plugin */
(function ($) {
	$.jstree.plugin("unique", {
		// TODO: think about an option to work with HTML or not?
		// add callback - to handle errors and for example types
		_fn : {
			check : function (chk, obj, par, pos) {
				if(!this.__call_old()) { return false; }

				par = par === -1 ? this.get_container() : par;
				var n = chk === "rename_node" ? $('<div />').html(pos).text() : this.get_text(obj, true),
					c = [],
					t = this;
				par.children('ul').children('li').each(function () { c.push(t.get_text(this, true)); });
				switch(chk) {
					case "delete_node":
						return true;
					case "rename_node":
					case "copy_node":
						return ($.inArray(n, c) === -1);
					case "move_node":
						return (par.children('ul').children('li').index(obj) !== -1 || $.inArray(n, c) === -1);
				}
				return true;
			}
		}
	});
	// include the unique plugin by default
	$.jstree.defaults.plugins.push("unique");
})(jQuery);
//*/
/*
 * jsTree wholerow plugin
 * Makes select and hover work on the entire width of the node
 */
(function ($) {
	$.jstree.plugin("wholerow", {
		__construct : function () {
			// do not continue if UI plugin is unavailable
			if(!this.data.ui) {
				throw "jsTree wholerow: jsTree UI plugin not included.";
			}
			// remove dots if themes plugin is loaded
			if(this.data.themes) {
				this.get_container().bind('set_state.jstree', $.proxy(function () {
					this.hide_dots();
				}, this));
			}
			this.get_container()
				.bind("__ready.jstree", $.proxy(function () {
						var t = this;
						$(function () {
							t.get_container_ul().addClass('jstree-wholerow-ul');
							$.vakata.css.add_sheet({
								str : '.jstree-' + t.get_index() + ' .jstree-wholerow { height:' + t.data.core.li_height + 'px; }',
								title : "jstree"
							});
						});
					}, this))
				.bind("deselect_all.jstree", $.proxy(function (e, data) {
						this.get_container().find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
					}, this))
				.bind("select_node.jstree deselect_node.jstree ", $.proxy(function (e, data) {
						data.rslt.obj.each(function () {
							$(this).children('.jstree-wholerow')[ e.type === 'select_node' ? 'addClass' : 'removeClass' ]('jstree-wholerow-clicked');
						});
					}, this))
				.bind("hover_node.jstree dehover_node.jstree", $.proxy(function (e, data) {
						this.get_container().find('.jstree-wholerow-hovered').removeClass('jstree-wholerow-hovered');
						if(e.type === "hover_node") {
							data.rslt.obj.each(function () {
								$(this).children('.jstree-wholerow').addClass('jstree-wholerow-hovered');
							});
						}
					}, this))
				.delegate(".jstree-wholerow", "contextmenu.jstree", $.proxy(function (e) {
						if(typeof this.data.contextmenu !== 'undefined') {
							e.preventDefault();
							$(e.currentTarget).closest("li").children("a:eq(0)").trigger('contextmenu',e);
						}
					}, this))
				.delegate(".jstree-wholerow", "click.jstree", function (e) {
						e.stopImmediatePropagation();
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger('click',e);
					})
				.delegate(".jstree-leaf > .jstree-ocl", "click.jstree", $.proxy(function (e) {
						e.stopImmediatePropagation();
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger('click',e);
					}, this))
				.delegate("li", "mouseover.jstree", $.proxy(function (e) {
						e.stopImmediatePropagation();
						if($(e.currentTarget).closest('li').children(".jstree-hovered, .jstree-clicked").length) {
							return false;
						}
						this.hover_node(e.currentTarget);
						return false;
					}, this))
				.delegate("li", "mouseleave.jstree", $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		},
		defaults : {
		},
		__destroy : function () {
			this.get_container().find(".jstree-wholerow").remove();
		},
		_fn : {
			clean_node : function(obj) {
				obj = this.__call_old();
				var t = this;
				return obj.each(function () {
					var o = $(this);
					if(!o.find("> .jstree-wholerow").length) {
						o.prepend("<div class='jstree-wholerow' style='position:absolute;' unselectable='on'>&#160;</div>");
					}
				});
			}
		}
	});
	$(function () {
		$.vakata.css.add_sheet({
			str : '' +
				'.jstree .jstree-wholerow-ul { position:relative; display:inline-block; min-width:100%; }' +
				'.jstree-wholerow-ul li > a, .jstree-wholerow-ul li > ins { position:relative; }' +
				'.jstree-wholerow-ul .jstree-wholerow { width:100%; cursor:pointer; position:absolute; left:0; user-select:none;-webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }',
			title : "jstree"
		});
	});
	// include the wholerow plugin by default
	$.jstree.defaults.plugins.push("wholerow");
})(jQuery);
/*
(function ($) {
	$.jstree.plugin("wholerow", {
		__construct : function () {
			if(!this.data.ui) { throw "jsTree wholerow: jsTree UI plugin not included."; }
			this.data.wholerow.html = false;
			this.data.wholerow.to = false;
			this.get_container()
				.bind("__construct.jstree", $.proxy(function (e, data) {
						this.get_settings(true).core.animation = 0;
					}, this))
				.bind("open_node.jstree create_node.jstree clean_node.jstree __loaded.jstree", $.proxy(function (e, data) {
						this._prepare_wholerow_span( data && data.rslt && data.rslt.obj ? data.rslt.obj : -1 );
					}, this))
				.bind("__loaded.jstree refresh.jstree __after_open.jstree __after_close.jstree create_node.jstree delete_node.jstree clean_node.jstree", $.proxy(function (e, data) {
						if(this.data.to) { clearTimeout(this.data.to); }
						this.data.to = setTimeout( (function (t, o) { return function() { t._prepare_wholerow_ul(o); }; })(this,  data && data.rslt && data.rslt.obj ? data.rslt.obj : -1), 0);
					}, this))
				.bind("deselect_all.jstree", $.proxy(function (e, data) {
						this.get_container().find(" > .jstree-wholerow .jstree-clicked").removeClass("jstree-clicked " + (this.data.themeroller ? this._get_settings().themeroller.item_a : "" ));
					}, this))
				.bind("select_node.jstree deselect_node.jstree ", $.proxy(function (e, data) {
						data.rslt.obj.each(function () {
							var ref = data.inst.get_container().find(" > .jstree-wholerow li:visible:eq(" + ( parseInt((($(this).offset().top - data.inst.get_container().offset().top + data.inst.get_container()[0].scrollTop) / data.inst.data.core.li_height),10)) + ")");
							// ref.children("a")[e.type === "select_node" ? "addClass" : "removeClass"]("jstree-clicked");
							ref.children("a").attr("class",data.rslt.obj.children("a").attr("class"));
						});
					}, this))
				.bind("hover_node.jstree dehover_node.jstree", $.proxy(function (e, data) {
						this.get_container().find(" > .jstree-wholerow .jstree-hovered").removeClass("jstree-hovered " + (this.data.themeroller ? this._get_settings().themeroller.item_h : "" ));
						if(e.type === "hover_node") {
							var ref = this.get_container().find(" > .jstree-wholerow li:visible:eq(" + ( parseInt(((data.rslt.obj.offset().top - this.get_container().offset().top + this.get_container()[0].scrollTop) / this.data.core.li_height),10)) + ")");
							// ref.children("a").addClass("jstree-hovered");
							ref.children("a").attr("class",data.rslt.obj.children(".jstree-hovered").attr("class"));
						}
					}, this))
				.delegate(".jstree-wholerow-span, ins.jstree-icon, li", "click.jstree", function (e) {
						var n = $(e.currentTarget);
						if(e.target.tagName === "A" || (e.target.tagName === "INS" && n.closest("li").is(".jstree-open, .jstree-closed"))) { return; }
						n.closest("li").children("a:visible:eq(0)").click();
						e.stopImmediatePropagation();
					})
				.delegate("li", "mouseover.jstree", $.proxy(function (e) {
						e.stopImmediatePropagation();
						if($(e.currentTarget).children(".jstree-hovered, .jstree-clicked").length) { return false; }
						this.hover_node(e.currentTarget);
						return false;
					}, this))
				.delegate("li", "mouseleave.jstree", $.proxy(function (e) {
						if($(e.currentTarget).children("a").hasClass("jstree-hovered").length) { return; }
						this.dehover_node(e.currentTarget);
					}, this));
			if($.jstree.IS_IE6 || $.jstree.IS_IE7) { // TODO: maybe check for position absolute?
				$.vakata.css.add_sheet({ str : ".jstree-" + this.get_index() + " { position:relative; } ", title : "jstree" });
			}
		},
		defaults : {
		},
		__destroy : function () {
			this.get_container().children(".jstree-wholerow").remove();
			this.get_container().find(".jstree-wholerow-span").remove();
		},
		_fn : {
			_prepare_wholerow_span : function (obj) {
				obj = !obj || obj === -1 ? this.get_container().find("> ul > li") : this.get_node(obj);
				if(obj === false) { return; } // added for removing root nodes
				obj.each(function () {
					$(this).find("li").andSelf().each(function () {
						var $t = $(this);
						if($t.children(".jstree-wholerow-span").length) { return true; }
						$t.prepend("<span class='jstree-wholerow-span' style='width:" + ($t.parentsUntil(".jstree","li").length * 18) + "px;'>&#160;</span>");
					});
				});
			},
			_prepare_wholerow_ul : function () {
				var o = this.get_container().children("ul").eq(0), h = o.html();
				o.addClass("jstree-wholerow-real");
				if(this.data.wholerow.last_html !== h) {
					this.data.wholerow.last_html = h;
					this.get_container().children(".jstree-wholerow").remove();
					this.get_container().append(
						o.clone().removeClass("jstree-wholerow-real")
							.wrapAll("<div class='jstree-wholerow' />").parent()
							.width(o.parent()[0].scrollWidth)
							.css("top", (o.height() + ( $.jstree.IS_IE7 ? 5 : 0)) * -1 )
							.find("li[id]").each(function () { this.removeAttribute("id"); }).end()
					);
				}
			}
		}
	});
	$(function() {
		var css_string = '' +
			'.jstree .jstree-wholerow-real { position:relative; z-index:1; } ' +
			'.jstree .jstree-wholerow-real li { cursor:pointer; } ' +
			'.jstree .jstree-wholerow-real a { border-left-color:transparent !important; border-right-color:transparent !important; } ' +
			'.jstree .jstree-wholerow { position:relative; z-index:0; height:0; } ' +
			'.jstree .jstree-wholerow ul, .jstree .jstree-wholerow li { width:100%; } ' +
			'.jstree .jstree-wholerow, .jstree .jstree-wholerow ul, .jstree .jstree-wholerow li, .jstree .jstree-wholerow a { margin:0 !important; padding:0 !important; } ' +
			'.jstree .jstree-wholerow, .jstree .jstree-wholerow ul, .jstree .jstree-wholerow li { background:transparent !important; }' +
			'.jstree .jstree-wholerow ins, .jstree .jstree-wholerow span, .jstree .jstree-wholerow input { display:none !important; }' +
			'.jstree .jstree-wholerow a, .jstree .jstree-wholerow a:hover { text-indent:-9999px; !important; width:100%; padding:0 !important; border-right-width:0px !important; border-left-width:0px !important; } ' +
			'.jstree .jstree-wholerow-span { position:absolute; left:0; margin:0px; padding:0; height:18px; border-width:0; padding:0; z-index:0; }';
		if($.jstree.IS_FF2) {
			css_string += '' +
				'.jstree .jstree-wholerow a { display:block; height:18px; margin:0; padding:0; border:0; } ' +
				'.jstree .jstree-wholerow-real a { border-color:transparent !important; } ';
		}
		if($.jstree.IS_IE7 || $.jstree.IS_IE6) {
			css_string += '' +
				'.jstree .jstree-wholerow, .jstree .jstree-wholerow li, .jstree .jstree-wholerow ul, .jstree .jstree-wholerow a { margin:0; padding:0; line-height:18px; } ' +
				'.jstree .jstree-wholerow a { display:block; height:18px; line-height:18px; overflow:hidden; } ';
		}
		$.vakata.css.add_sheet({ str : css_string, title : "jstree" });
	});
	// include the selection plugin by default
	$.jstree.defaults.plugins.push("wholerow");
})(jQuery);
*/
/* File: jstree.xml.js
This plugin makes it possible for jstree to use XML data sources.
*/
/* Group: jstree xml plugin */
(function ($) {
	var xsl = {
		'nest' : '' +
			'<' + '?xml version="1.0" encoding="utf-8" ?>' +
			'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' +
			'<xsl:output method="html" encoding="utf-8" omit-xml-declaration="yes" standalone="no" indent="no" media-type="text/html" />' +
			'<xsl:template match="/">' +
			'	<xsl:call-template name="nodes">' +
			'		<xsl:with-param name="node" select="/root" />' +
			'	</xsl:call-template>' +
			'</xsl:template>' +
			'<xsl:template name="nodes">' +
			'	<xsl:param name="node" />' +
			'	<ul>' +
			'	<xsl:for-each select="$node/item">' +
			'		<xsl:variable name="children" select="count(./item) &gt; 0" />' +
			'		<li>' +
			'			<xsl:for-each select="@*"><xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute></xsl:for-each>' +
			'			<a>' +
			'				<xsl:for-each select="./content/@*"><xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute></xsl:for-each>' +
			'				<xsl:copy-of select="./content/child::node()" />' +
			'			</a>' +
			'			<xsl:if test="$children"><xsl:call-template name="nodes"><xsl:with-param name="node" select="current()" /></xsl:call-template></xsl:if>' +
			'		</li>' +
			'	</xsl:for-each>' +
			'	</ul>' +
			'</xsl:template>' +
			'</xsl:stylesheet>',
		'flat' : '' +
			'<' + '?xml version="1.0" encoding="utf-8" ?>' +
			'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' +
			'<xsl:output method="html" encoding="utf-8" omit-xml-declaration="yes" standalone="no" indent="no" media-type="text/xml" />' +
			'<xsl:template match="/">' +
			'	<ul>' +
			'	<xsl:for-each select="//item[not(@parent_id) or @parent_id=0 or not(@parent_id = //item/@id)]">' + /* the last `or` may be removed */
			'		<xsl:call-template name="nodes">' +
			'			<xsl:with-param name="node" select="." />' +
			'		</xsl:call-template>' +
			'	</xsl:for-each>' +
			'	</ul>' +
			'</xsl:template>' +
			'<xsl:template name="nodes">' +
			'	<xsl:param name="node" />' +
			'	<xsl:variable name="children" select="count(//item[@parent_id=$node/attribute::id]) &gt; 0" />' +
			'	<li>' +
			'		<xsl:for-each select="@*">' +
			'			<xsl:if test="name() != \'parent_id\'">' +
			'				<xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute>' +
			'			</xsl:if>' +
			'		</xsl:for-each>' +
			'		<a>' +
			'			<xsl:for-each select="./content/@*"><xsl:attribute name="{name()}"><xsl:value-of select="." /></xsl:attribute></xsl:for-each>' +
			'			<xsl:copy-of select="./content/child::node()" />' +
			'		</a>' +
			'		<xsl:if test="$children">' +
			'		<ul>' +
			'			<xsl:for-each select="//item[@parent_id=$node/attribute::id]">' +
			'				<xsl:call-template name="nodes">' +
			'					<xsl:with-param name="node" select="." />' +
			'				</xsl:call-template>' +
			'			</xsl:for-each>' +
			'		</ul>' +
			'		</xsl:if>' +
			'	</li>' +
			'</xsl:template>' +
			'</xsl:stylesheet>'
	},
	escape_xml = function(string) {
		return string
			.toString()
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	};


	$.jstree.plugin("xml", {
		defaults : {
			xsl		: "flat",
			data	: false,
			ajax	: false
		},
		_fn : {
			_append_xml_data : function (dom, data) {
				data = $.vakata.xslt(data, xsl[this.get_settings().xml.xsl]);
				if(data === false) { return false; }
				data = $(data);
				dom = this.get_node(dom);
				if(!data || !data.length || !data.is('ul, li')) {
					if(dom && dom !== -1 && dom.is('li')) {
						dom.removeClass('jstree-closed').addClass('jstree-leaf').children('ul').remove();
					}
					return true;
				}
				if(dom === -1) { dom = this.get_container(); }
				if(!dom.length) { return false; }
				if(!dom.children('ul').length) { dom.append('<ul />'); }
				dom.children('ul').empty().append(data.is('ul') ? data.children('li') : data);
				return true;
			},
			_load_node : function (obj, callback) {
				var d = false,
					s = this.get_settings().xml;
				obj = this.get_node(obj);
				if(!obj) { return false; }
				switch(!0) {
					// data is function
					case ($.isFunction(s.data)):
						return s.data.call(this, obj, $.proxy(function (d) {
							return callback.call(this, this._append_xml_data(obj, d));
						}, this));
					// data is set, ajax is not set, or both are set, but we are dealing with root node
					case ((!!s.data && !s.ajax) || (!!s.data && !!s.ajax && obj === -1)):
						return callback.call(this, this._append_xml_data(obj, s.data));
					// data is not set, ajax is set, or both are set, but we are dealing with a normal node
					case ((!s.data && !!s.ajax) || (!!s.data && !!s.ajax && obj !== -1)):
						s.ajax.success = $.proxy(function (d, t, x) {
							var s = this.get_settings().xml.ajax;
							if($.isFunction(s.success)) {
								d = s.success.call(this, d, t, x) || d;
							}
							callback.call(this, this._append_xml_data(obj, d));
						}, this);
						s.ajax.error = $.proxy(function (x, t, e) {
							var s = this.get_settings().xml.ajax;
							if($.isFunction(s.error)) {
								s.error.call(this, x, t, e);
							}
							callback.call(this, false);
						}, this);
						if(!s.ajax.dataType) { s.ajax.dataType = "xml"; }
						if($.isFunction(s.ajax.url))	{ s.ajax.url	= s.ajax.url.call(this, obj); }
						if($.isFunction(s.ajax.data))	{ s.ajax.data	= s.ajax.data.call(this, obj); }
						return $.ajax(s.ajax);
				}
			},
			get_xml : function (mode, obj, is_callback) {
				var r = '';
				if(!mode) { mode = 'flat'; }
				if(typeof is_callback === 'undefined') {
					obj = this.get_json(obj);
					$.each(obj, $.proxy(function (i, v) {
						r += this.get_xml(mode, v, true);
					}, this));
					return '' +
						'<' + '?xml version="1.0" encoding="utf-8" ?>' +
						'<root>' + r + '</root>';
				}
				r += '<item';
				if(mode === 'flat' && is_callback !== true) {
					r += ' parent_id="' + escape_xml(is_callback) + '"';
				}
				if(obj.data && !$.isEmptyObject(obj.data)) {
					$.each(obj.data, function (i, v) {
						if(!$.isEmptyObject(v)) {
							r += ' data-' + i + '="' + escape_xml($.vakata.json.encode(v)) + '"';
						}
					});
				}
				$.each(obj.li_attr, function (i, v) {
					r += ' ' + i + '="' + escape_xml(v) + '"';
				});
				r += '>';
				r += '<content';
				$.each(obj.a_attr, function (i, v) {
					r += ' ' + i + '="' + escape_xml(v) + '"';
				});
				r += '><![CDATA[' + obj.title + ']]></content>';

				if(mode === 'flat') { r += '</item>'; }
				if(obj.children) {
					$.each(obj.children, $.proxy(function (i, v) {
						r += this.get_xml(mode, v, obj.li_attr && obj.li_attr.id ? obj.li_attr.id : true);
					}, this));
				}
				if(mode === 'nest') { r += '</item>'; }
				return r;
			}
		}
	});
	// include the html plugin by default
	$.jstree.defaults.plugins.push("xml");
})(jQuery);
//*/
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