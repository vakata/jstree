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
				if(css_rules[j].selectorText && css_rules[j].selectorText.toLowerCase() == rule_name) {
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
						if(o.top + t.height() - e.pageY < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_t = 1; scr = true; }
						if(e.pageY - o.top < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_t = -1; scr = true; }
					}
					if(this.scrollWidth > this.offsetWidth) {
						if(o.left + t.width() - e.pageX < $.vakata.dnd.settings.scroll_proximity)	{ vakata_dnd.scroll_l = 1; scr = true; }
						if(e.pageX - o.left < $.vakata.dnd.settings.scroll_proximity)				{ vakata_dnd.scroll_l = -1; scr = true; }
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
		if(r === false && typeof (XSLTProcessor) != "undefined") {
			p = new XSLTProcessor();
			p.importStylesheet(xsl);
			r = p.transformToFragment(xml, document);
			r = $('<div />').append(r).html();
		}
		// OLD IE
		if(r === false && typeof (xml.transformNode) != "undefined") {
			r = xml.transformNode(xsl);
		}
		return r;
	};
})(jQuery);

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
			return i && i.action ? i.action.call(null, {
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
				sep = false;

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
				dw = $(document).width(),
				dh = $(document).height();
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
					dw = $(document).width(),
					dh = $(document).height();

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

		if(typeof $.hotkeys !== "undefined") {
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
					var c = _meta[a];
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
(function ($) {
	/*
		Function: $.vakata.cookie
		A function for getting and setting cookies.

		Parameters:
			Same as the original plugin

		Returns:
			string - the encoded data
	*/
	$.vakata.cookie = function (key, value, options) {
		var days, t, result, decode;
		if (arguments.length > 1 && String(value) !== "[object Object]") {
			options = $.extend({}, options);
			if(value === null || value === undefined) { options.expires = -1; }
			if(typeof options.expires === 'number') { days = options.expires; t = options.expires = new Date(); t.setDate(t.getDate() + days); }
			value = String(value);
			return (document.cookie = [
				encodeURIComponent(key), '=',
				options.raw ? value : encodeURIComponent(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', 
				options.path ? '; path=' + options.path : '',
				options.domain ? '; domain=' + options.domain : '',
				options.secure ? '; secure' : ''
			].join(''));
		}
		options = value || {};
		decode = options.raw ? function (s) { return s; } : decodeURIComponent;
		return (result = new RegExp('(?:^|; )' + encodeURIComponent(key) + '=([^;]*)').exec(document.cookie)) ? decode(result[1]) : null;
	};
})(jQuery);

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
		_backend = false;

	function _init() {
		if("localStorage" in window) {
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
				alert(_storage_elm.load);
				_storage_elm.load("jStorage");
				var data = "{}";
				try {
					data = _storage_elm.getAttribute("jStorage");
				} catch(E5) {}
				_storage_service.jStorage = data;
				_backend = "userDataBehavior";
			}
			else if(
				!!$.vakata.cookie('vjstorage') || 
				($.vakata.cookie('vjstorage', '{}', { 'expires' : 365 }) && $.vakata.cookie('vjstorage') === '{}')
			) { 
				_storage_elm = null;
				_storage_service.jStorage = $.vakata.cookie('vjstorage');
				_backend = "cookie";
			}
			else {
				_storage_elm = null;
				return;
			}
		}
		_load_storage();
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
				$.vakata.cookie('vjstorage', _storage_service.jStorage, { 'expires' : 365 });
			}
			_storage_size = _storage_service.jStorage?String(_storage_service.jStorage).length:0;
		} catch(E7) { /* probably cache is full, nothing is saved this way*/ }
	}

	function _checkKey(key) {
		if(!key || (typeof key != "string" && typeof key != "number")){
			throw new TypeError('Key name must be string or numeric');
		}
		return true;
	}
	/* 
		Variable: $.vakata.storage
		*object* holds all storage related functions and properties.
	*/
	$.vakata.storage = {
		/* 
			Variable: $.vakata.storage.version
			*string* the version of jstorage used
		*/
		version: "0.1.5.2",
		/* 
			Function: $.vakata.storage.set
			Set a key to a value

			Parameters:
				key - the key
				value - the value

			Returns:
				_value_
		*/
		set : function (key, value) {
			_checkKey(key);
			_storage[key] = value;
			_save();
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
			return typeof(def) == 'undefined' ? null : def;
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
				_save();
				return true;
			}
			return false;
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
			function F() {}
			F.prototype = _storage;
			return new F();
		},
		/* 
			Function: $.vakata.storage.index
			Get an array of all the set keys in the storage.

			Returns:
				*array* 
		*/
		index : function(){
			var index = [], i;
			$.each(_storage, function (i, v) { index.push(i); });
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
			Function: $.vakata.storage.currentBackend
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
			date = new Date(date.replace(/-/g,"/").replace(/[TZ]/g," ").replace(/\+\d\d\:\d\d$/,''));
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
							(val != 1 ? format[2] : format[1]) +
							(i > 0 ? token : '');
				}
			}
		},
		/* 
			Function: $.vakata.pretty_date.init
			Parses all time elements in the document and keeps reparsing them every few seconds.

			Parameters:
				i - the interval for reparsing (in seconds)
				format - the format to use, example: _Published %{s}._. Default is _%{s}_.
		*/
		init : function (i, format) {
			$("time").vakata_pretty_date(format);
			setInterval(function(){ $("time").vakata_pretty_date(format); }, i || 5000);
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
				if($t.html() != date) {
					$t.html(date);
				}
			}
		});
	};
})(jQuery);