// TODO: callbacks/events - maybe a this.plugin("collect_state", obj) call?
// TODO: revisit errors
// TODO: jQuery 1.3.3 index() instead of index(context)
// TODO: camino icons
// TODO: modifiers - shift/ctrl/command - mac metakey
// TODO: reenable all plugins ($.jstree)
// TODO: checkbox - move all at once, deselect all, select_all, set selected_parent_close to false
// TODO: contextmenu - localization, type based entries?
// TODO: get - not returning XML??? (bug filed)
// TODO: scrolling (jquery ui), drag_start, drag_end, drag events
// TODO: cut, copy, paste
// TODO: check YUI compressor
// TODO: check all icons - reset positioning if custom icon is used
// TODO: check metadata - maybe wrap within { jstree: { } }
// TODO: maybe let some events bubble?
// TODO: form issue - keypress / keyup in rename function
// TODO: remove any events bound for plugins 
// TODO: create does not work if LI node has an empty UL inside
// TODO: context menu option to select the node that was right clicked
// TODO: see which functions should be _ and which __
// TODO: test func by func (using $.each($.jstree._fn ...)

// jsTree core begin
(function($) {
	// private variables 
	var instances = [],			// instance array (used by $.jstree.reference/create/focused)
		focused_instance = -1,	// the index in the instance array of the currently focused instance
		undefined;				// helper variable for quicker access to undefined

	// jQuery plugin wrapper
	$.fn.jstree = function (settings) {
		var isMethodCall = (typeof settings == 'string'), 
			args = Array.prototype.slice.call(arguments, 1), 
			returnValue = this;

			// extend settings and allow for multiple hashes and metadata (thanks jqueryUI)
			if(!isMethodCall && $.meta) args.push($.metadata.get(this).jstree);
			settings = !isMethodCall && args.length ? $.extend.apply(null, [true, settings].concat(args)) : settings;
			// block calls to "private" methods
			if(isMethodCall && settings.substring(0, 1) == '_') return returnValue;

			if(isMethodCall) {
				this.each(function() {
					var instance = instances[$.data(this, "jstree-instance-id")],
						methodValue = (instance && $.isFunction(instance[settings])) ? instance[settings].apply(instance, args) : instance;
						if(methodValue !== undefined) { returnValue = methodValue; return false; }
				});
			}
			else {
				this.each(function() {
					var instance_id = $.data(this, "jstree-instance-id");
					if(instance_id && instances[instance_id]) instances[instance_id]._destroy();
					// push a new empty object to the instances array
					instance_id = parseInt(instances.push({})) - 1;
					// store the jstree instance id to the container element
					$.data(this, "jstree-instance-id", instance_id);
					// push the new object to the instances array (at the same time set the default classes to the container) and init
					instances[instance_id] = new $.jstree._instance(instance_id, $(this).addClass("jstree jstree-" + instance_id), $.extend(true, {}, $.jstree.defaults, settings)); 
					instances[instance_id]._init();
					console.log(instances);
				});
			}

		return returnValue;
	};
	
	// object to store exposed functions and objects
	$.jstree			= {};
	// defaults are exposed, so that the developer can change defaults for all future instances
	$.jstree.defaults	= {};
	// gets the currently focused instance (used internally)
	$.jstree._focused	= function () { return instances[focused_instance] || null; },
	// get an instance by node, dom id, reference id
	$.jstree._reference	= function (needle) { 
			// get by instance id
			if(instances[needle]) return instances[needle];
			// get by DOM (if still no luck - return null
			var o = $(needle); o = o.length ? o : $("#" + obj); if(!o.length) { return null };
			// traverse up the DOM for the tree parent
			o = (o.is(".jstree")) ? o.get(0) : o.parents(".jstree:eq(0)").get(0);
			o = $.data(o, "jstree-instance-id");
			return instances[o] || null; 
		},
	// the actual instance function (used internally)
	$.jstree._instance	= function (index, container, settings) { 
		// for plugins to store data in
		this.data = {};
		this.settings = settings;
		this.get_index = function () { return index; };
		this.get_container = function () { return container; };
	};

	// the prototype to attach functions to (all core functions are listed here)
	$.jstree._fn		= $.jstree._instance.prototype = {
		// initialize and destroy
		_init		: function () { this.set_focus(); },
		_destroy	: function () { 
			var n = this.get_index(), 
				c = this.get_container();

			// set focus to another instance if this one is focused
			if(this.is_focused()) { for(var i in instances) { if(!instances.hasOwnProperty(i) || i == n) continue; instances[i].set_focus(); break; } }
			$.removeData(c, "jstree-instance-id");
			// remove all traces of jstree in the DOM (only the ones set by the core, plugins should clean themselves)
			c.removeClass("jstree jstree-" + index);
			// remove the actual data
			instances[n] = null;
			delete instances[n];
		},

		// deal with focus
		set_focus	: function () { focused_instance = this.get_index(); },
		is_focused	: function () { return focused_instance == this.get_index(); },

		// traverse
		get_node	: function (obj) { var $obj = $(obj); return $obj.is(".jstree") || obj == -1 ? -1 : $obj.closest("li", this.get_container()); },
		get_next	: function (obj, strict) {
			obj = this.get_node(obj);
			if(!obj.length) return false;
			if(strict) return (obj.nextAll("li").size() > 0) ? obj.nextAll("li:eq(0)") : false;

			if(obj.hasClass("jstree-open")) return obj.find("li:eq(0)");
			else if(obj.nextAll("li").size() > 0) return obj.nextAll("li:eq(0)");
			else return obj.parents("li").next("li").eq(0);
		},
		get_prev	: function(obj, strict) {
			obj = this.get_node(obj);
			if(!obj.length) return false;
			if(strict) return (obj.prevAll("li").length > 0) ? obj.prevAll("li:eq(0)") : false;

			if(obj.prev("li").length) {
				var obj = obj.prev("li").eq(0);
				while(obj.hasClass("jstree-open")) obj = obj.children("ul:eq(0)").children("li:last");
				return obj;
			}
			else return obj.parents("li:eq(0)").length ? obj.parents("li:eq(0)") : false;
		},
		get_parent	: function(obj) {
			obj = this.get_node(obj);
			if(obj == -1 || !obj.length) return false;
			return obj.parents("li:eq(0)").length ? obj.parents("li:eq(0)") : -1;
		},
		get_children: function(obj) {
			obj = this.get_node(obj);
			if(obj === -1) return this.get_container().children("ul:eq(0)").children("li");
			if(!obj.length) return false;
			return obj.children("ul:eq(0)").children("li");
		},

		// values (will be overwritten by languages plugin if included)
		get_text : function (obj) {
			obj = this.get_node(obj);
			if(!obj.size()) return false;
			obj = obj.children("a:eq(0)");
			obj = obj.contents().filter(function() { return this.nodeType == 3; })[0];
			return obj.nodeValue;
		},
		set_text : function (obj, val) {
			obj = this.get_node(obj);
			if(!obj.size()) return false;
			obj = obj.children("a:eq(0)");
			obj = obj.contents().filter(function() { return this.nodeType == 3; })[0];
			return obj.nodeValue = val;
		}
	};

	// plugin functionality
	// private list of included plugins
	var plugin_list		= {};
	// a setting to store all active plugins
	$.jstree.defaults.plugin_list = [];
	// function to add plugins by name and values
	$.jstree.plugin		= function (pname, pdata) {
		// the default empty plugin
		pdata = $.extend(true, {}, {
			_fn : { },
			defaults : false,
			callback : function () { }
		}, pdata);
		// push the plugin's name in the loaded plugins array
		plugin_list[pname] = pdata.callback;
		// set the origin on every function
		$.each(pdata._fn, function (i, val) { val.plugin = pname; });
		// extend the _instance functions by those of the plugin
		$.extend($.jstree._fn, pdata._fn);
		// extend the defaults
		$.jstree.defaults[pname] = pdata.defaults;
	};
	// wrap functions 
	// TODO: maybe this shouldn't be at the end, but first core, then plugin by plugin
	$(function () {
		$.each($.jstree._fn, function (i, val) {
			if(!$.isFunction(val)) return true;
			$.jstree._fn[i] = function () {
				// if calling a function from a plugin that is not included
				if(val.plugin && $.inArray(val.plugin, this.settings.plugin_list) == -1) return false;
				var _this = this, args = arguments, returnValue, tmp;
				// if function is final (naming convention __)
				if(i.substring(0,2) == '__') return val.apply(this, arguments);
				// TODO: maybe skip calling if i == j ???
				$.each(this.settings.plugin_list, function (j, plg) {
					tmp = plugin_list[plg].apply(_this, ["before", i, args]);
					if(tmp != undefined) args = tmp; 
					if(args == false) return false;
				});
				if(args) {
					returnValue = val.apply(this, args);
					$.each(this.settings.plugin_list, function (j, plg) {
						tmp = plugin_list[plg].apply(_this, ["after", i, returnValue]);
						if(tmp != undefined) returnValue = tmp; 
					});
					// trigger event only if not internal function
					if(i.substring(0,1) != '_') this.get_container().trigger("jstree-" + i, [returnValue]);
					return returnValue;
				}
			};
		});
	});

	// css functions - used internally
	$.jstree._css = {
		get_css : function(rule_name, delete_flag, sheet) {
			rule_name = rule_name.toLowerCase();
			var css_rules = sheet.cssRules || sheet.rules;
			var j = 0;
			do {
				if(css_rules.length && j > css_rules.length + 5) return false;
				if(css_rules[j].selectorText && css_rules[j].selectorText.toLowerCase() == rule_name) {
					if(delete_flag == true) {
						if(sheet.removeRule) document.styleSheets[i].removeRule(j);
						if(sheet.deleteRule) document.styleSheets[i].deleteRule(j);
						return true;
					}
					else return css_rules[j];
				}
			}
			while (css_rules[++j]);
			return false;
		},
		add_css : function(rule_name, sheet) {
			if($.jstree.css.get_css(rule_name, false, sheet)) return false;
			(sheet.insertRule) ? sheet.insertRule(rule_name + ' { }', 0) : sheet.addRule(rule_name, null, 0);
			return $.jstree.css.get_css(rule_name);
		},
		remove_css : function(rule_name, sheet) { 
			return $.jstree.css.get_css(rule_name, true, sheet); 
		},
		add_sheet : function(opts) {
			if(opts.str) {
				var tmp = document.createElement("style");
				tmp.setAttribute('type',"text/css");
				//if(opts.rel) tmp.setAttribute('title',opts.rel);
				if(tmp.styleSheet) {
					document.getElementsByTagName("head")[0].appendChild(tmp);
					tmp.styleSheet.cssText = opts.str;
				}
				else {
					tmp.appendChild(document.createTextNode(opts.str));
					document.getElementsByTagName("head")[0].appendChild(tmp);
				}
				return tmp.sheet || tmp.styleSheet;
			}
			if(opts.url) {
				if(document.createStyleSheet) {
					try { var t = document.createStyleSheet(opts.url); if(opts.rel) t.title = opts.rel; } catch (e) { };
				}
				else {
					var newSS	= document.createElement('link');
					newSS.rel	= 'stylesheet';
					newSS.type	= 'text/css';
					newSS.media	= "all";
					newSS.href	= opts.url;
					//if(opts.rel) newSS.title = opts.rel;
					// var styles	= "@import url(' " + url + " ');";
					// newSS.href	='data:text/css,'+escape(styles);
					document.getElementsByTagName("head")[0].appendChild(newSS);
					return newSS.styleSheet;
				}
			}
		}
	};
	// load the css when DOM is ready
	$(function() {
		// code is copied form jQuery ($.browser is deprecated)
		var u = navigator.userAgent.toLowerCase(),
			v = (u.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
			css_string = '/* TREE LAYOUT */ .jstree ul { margin:0 0 0 5px; padding:0 0 0 0; list-style-type:none; } .jstree li { display:block; min-height:18px; line-height:18px; padding:0 0 0 15px; margin:0 0 0 0; /* Background fix */ clear:both; } .jstree li ul { display:none; } .jstree li a, .jstree li span { display:inline-block;line-height:16px;height:16px;color:black;white-space:nowrap;text-decoration:none;padding:1px 4px 1px 4px;margin:0; } .jstree li a:focus { outline: none; } .jstree li a input, .jstree li span input { margin:0;padding:0 0;display:inline-block;height:12px !important;border:1px solid white;background:white;font-size:10px;font-family:Verdana; } .jstree li a input:not([class="xxx"]), .jstree li span input:not([class="xxx"]) { padding:1px 0; } /* FOR DOTS */ .jstree .jstree-ltr li.jstree-last { float:left; } .jstree > ul li.jstree-last { overflow:visible; } /* OPEN OR CLOSE */ .jstree li.jstree-open ul { display:block; } .jstree li.jstree-closed ul { display:none !important; } /* FOR DRAGGING */ #jstree-dragged { position:absolute; top:-10px; left:-10px; margin:0; padding:0; z-index:1000; } #jstree-dragged ul ul ul { display:none; } #jstree-marker { cursor:pointer; padding:0; margin:0; line-height:5px; font-size:1px; overflow:hidden; height:5px; position:absolute; left:-45px; top:-30px; z-index:1000; background-color:transparent; background-repeat:no-repeat; display:none; } #jstree-marker.jstree-marker { width:45px; background-position:-32px top; } #jstree-marker.jstree-marker-plus { width:5px; background-position:right top; } /* BACKGROUND DOTS */ .jstree li li { overflow:hidden; } .jstree > .jstree-ltr > li { display:table; } /* ICONS */ .jstree ul ins { display:inline-block; text-decoration:none; width:16px; height:16px; } .jstree .jstree-ltr ins { margin:0 4px 0 0px; } ';
		if(/msie/.test(u) && !/opera/.test(u)) { 
			if(parseInt(v) == 6) css_string += '.jstree li { height:18px; zoom:1; } .jstree li li { overflow:visible; } .jstree .jstree-ltr li.jstree-last { margin-top: expression( (this.previousSibling && /jstree-open/.test(this.previousSibling.className) ) ? "-2px" : "0"); } .jstree-marker { width:45px; background-position:-32px top; } .jstree-marker-plus { width:5px; background-position:right top; }';
			if(parseInt(v) == 7) css_string += '.jstree li li { overflow:visible; } .jstree .jstree-ltr li.jstree-last { margin-top: expression( (this.previousSibling && /jstree-open/.test(this.previousSibling.className) ) ? "-2px" : "0"); }';
		}
		if(/opera/.test(u)) css_string += '.jstree > ul > li.jstree-last:after { content:"."; display: block; height:1px; clear:both; visibility:hidden; }';
		if(/mozilla/.test(u) && !/(compatible|webkit)/.test(u) && v.indexOf("1.8") == 0) css_string += '.jstree .jstree-ltr li a { display:inline; float:left; } .jstree li ul { clear:both; }';
		$.jstree._css.add_sheet({ str : css_string, rel : "jstree" });
		delete u; delete v; delete css_string;
	});
})(jQuery);
// jsTree core end

// jsTree data plugin begin
(function($) {
	$.jstree.datastores = {};
	$.jstree.plugin("data", {
		defaults : { type : "html", async : false, opts : {} },
		_fn : {
			load : function (obj, is_initial, callback) {
				var ret = { 'is_partial' : (obj && this.settings.data.async), 'is_initial' : is_initial }, _this = this, _datastore = false, opts = this.settings.data.opts, str = "";
				obj = ret.obj = (ret.is_partial) ? this.get_node(obj) : this.get_container();

				opts = this.get_data(obj);
				_datastore = new $.jstree.datastores[this.settings.data.type](this, this.settings.data.opts, ret.is_partial);

				obj.children("ul").remove();
				if(ret.is_partial) { obj.children("a").addClass("jstree-loading"); }
				else { obj.html("<ul class='jstree-ltr' style='direction:ltr;'><li class='jstree-last jstree-leaf'><a class='jstree-loading' href='#'><ins>&nbsp;</ins>" + (this.settings.data.loading_text || "Loading ...") + "</a></li></ul>"); }

				_datastore.load(opts, function (data) {
					str = _this._parse_data(data, _datastore);

					if(str.length) { // TODO: check for empty <root /> here and $.trim(data)
						if(obj.children("ul").length == 0) obj.append("ul");
						obj.children("a").removeClass("jstree-loading").end().children("ul").empty().append(str);
					}
					else {
						obj.removeClass("jstree-closed").removeClass("jstree-open").children("ul").remove();
						if(ret.is_partial) obj.addClass("jstree-leaf");
					}
					_this._loaded(ret);
					if(callback) callback.call();
				});
				return ret;
			},
			get_data : function (obj) { return { id : obj.attr("id") || 0 }; },
			_parse_data : function (data, _datastore) {
				return _datastore.parse(data);
			},
			_loaded : function(obj) {
				this._clean_html(obj.obj);
			},
			_clean_html : function(obj) {
				obj = obj ? $(obj) : this.get_container();
				obj = obj.is("li") ? obj.find("li").andSelf() : obj.find("li");

				obj.removeClass("jstree-last")
					.filter("li:last-child").addClass("jstree-last").end()
					.filter(":has(ul)")
						.not(".jstree-open").addClass("jstree-closed");
				obj.not(".jstree-open, .jstree-closed").addClass("jstree-leaf");
			},
			is_loaded : function (obj) { obj = this.get_node(obj); return this.settings.data.async == false || obj.is(".jstree-open, .jstree-leaf") || obj.children("ul").children("li").size() > 0; }
		},
		callback : function (t, f, d) {
			var cb = t + ":" + f;
			if(/^(after:_init)$/.test(cb)) this.load(false, true);
		}
	});

	$.jstree.defaults.plugin_list.push("data");
})(jQuery);
// jsTree data plugin end

// jsTree themes plugin begin
(function ($) {
	var themes_loaded = [];
	$.jstree._themes = false;
	$.jstree.plugin("themes", {
		defaults : { theme : "default", dots : true },
		_fn : {
			set_theme : function (theme_name, theme_url) {
				if(theme_name === undefined) return false;
				if(theme_url === undefined) theme_url = $.jstree._themes + theme_name + '/style.css';
				if($.inArray(theme_url, themes_loaded) == -1) {
					$.jstree._css.add_sheet({ "url" : theme_url, "rel" : "jstree" });
					themes_loaded.push(theme_url);
				}
				if(this.data.theme != theme_name) {
					this.get_container().removeClass('jstree-' + this.data.theme);
					this.data.theme = theme_name;
				}
				this.get_container().addClass('jstree-' + theme_name);
				if(this.settings.themes.dots == false) this.get_container().children("ul").addClass("jstree-no-dots");
			}
		},
		callback : function (t, f, d) {
			var cb = t + ":" + f;
			if(/^(before:_init|after:load)$/.test(cb)) this.set_theme(this.settings.themes.theme);
		}
	});
	$(function () {
		if($.jstree._themes === false) {
			$("script").each(function () { 
				if(this.src.toString().match(/jquery\.jstree[^/]*?\.js(\?.*)?$/)) { 
					$.jstree._themes = this.src.toString().replace(/jquery\.jstree[^/]*?\.js(\?.*)?$/, "") + 'themes/'; 
					return false; 
				}
			});
		}
		if($.jstree._themes === false) $.jstree._themes = "themes/";
	});
	$.jstree.defaults.plugin_list.push("themes");
})(jQuery);
// jsTree themes plugin end

// jsTree languages plugins begin
(function ($) {
	$.jstree.plugin("languages", {
		defaults : [],
		_fn : {
			set_lang : function (i) { 
				var langs = this.settings.languages;
				if(!$.isArray(langs) || langs.length == 0) return false;
				if($.inArray(i,langs) == -1) {
					if(langs[i] != undefined) i = langs[i];
					else return false;
				}
				if(i == this.data.current_language) return true;
				var st = false, selector = ".jstree-" + this.get_index() + ' ul li a';
				st = $.jstree._css.get_css(selector + "." + this.data.current_language, false, this.data.language_css);
				if(st !== false) st.style.display = "none";
				st = $.jstree._css.get_css(selector + "." + i, false, this.data.language_css);
				if(st !== false) st.style.display = "";
				this.data.current_language = i;
				return true;
			},
			get_lang : function () {
				return this.data.current_language;
			},
			get_text : function (obj, lang) {
				obj = this.get_node(obj);
				if(!obj.size()) return false;
				var langs = this.settings.languages;
				if($.isArray(langs) && langs.length) {
					lang = (lang && $.inArray(lang,langs) != -1) ? lang : this.data.current_language;
					obj = obj.children("a." + lang);
				}
				else obj = obj.children("a:eq(0)");
				obj = obj.contents().filter(function() { return this.nodeType == 3; })[0];
				return obj.nodeValue;
			},
			set_text : function (obj, lang, val) {
				obj = this.get_node(obj);
				if(!obj.size()) return false;
				var langs = this.settings.languages;
				if($.isArray(langs) && langs.length) {
					lang = (lang && $.inArray(lang,langs) != -1) ? lang : this.data.current_language;
					obj = obj.children("a." + lang);
				}
				else obj = obj.children("a:eq(0)");
				obj = obj.contents().filter(function() { return this.nodeType == 3; })[0];
				return obj.nodeValue = val;
			},
			
			__load_css : function () {
				var langs = this.settings.languages;
				if($.isArray(langs) && langs.length) {
					this.data.current_language = langs[0];
					var str = "/* languages css */", selector = ".jstree-" + this.get_index() + ' ul li a';
					for(var ln = 0; ln < langs.length; ln++) {
						str += selector + "." + langs[ln] + " {";
						if(langs[ln] != this.data.current_language) str += " display:none; ";
						str += " } ";
					}
					this.data.language_css = $.jstree._css.add_sheet({ 'str' : str });
				}
			}
		},
		callback : function (t, f, d) {
			var cb = t + ":" + f;
			if(/^(before:_init)$/.test(cb)) this.__load_css(false, true);
		}
	});
	$.jstree.defaults.plugin_list.push("languages");
})(jQuery);
// jsTree languages plugin end

// jsTree open_close plugin begin
(function ($) {
	$.jstree.plugin("open", {
		defaults : [],
		_fn : {
			open_node : function (obj, callback, is_async, is_refresh) {
				obj = this.get_node(obj);
				if(!obj.length) return false;
				if(!this.is_loaded(obj)) {
					var _this = this;
					obj.children("a").addClass("jstree-loading");
					this.load_node(obj, function () { _this.open_node(obj, callback, true, is_refresh); });
					return;
				}
				obj.removeClass("jstree-closed").addClass("jstree-open").children("a").removeClass("jstree-loading");
				if(callback) callback.call();
				return { 'obj' : obj, 'is_async' : is_async, 'is_refresh' : is_refresh };
			},
			close_node : function (obj) {
				obj = this.get_node(obj);
				if(!obj.length) return false;
				obj.removeClass("jstree-open").addClass("jstree-closed");
				return { 'obj' : obj };
			},
			toggle_node : function (obj) {
				obj = this.get_node(obj);
				if(obj.hasClass("jstree-closed"))	return this.open_node(obj);
				if(obj.hasClass("jstree-open"))		return this.close_node(obj); 
			},
			open_all : function (obj, original_obj) {
				obj = obj ? this.get_node(obj) : this.get_container();
				if(original_obj) { 
					obj = obj.find("li.jstree-closed");
				}
				else {
					original_obj = obj;
					if(obj.is(".jstree-closed")) obj = obj.find("li.jstree-closed").andSelf();
					else obj = obj.find("li.jstree-closed");
				}
				var _this = this;
				obj.each(function () { 
					var __this = this; 
					_this.open_node(this, function() { 
						_this.open_all(__this, original_obj); 
					});
				});
				if(original_obj && original_obj.find('li.jstree-closed').size() == 0) return { 'obj' : obj };
			},
			close_all : function (obj) {
				var _this = this;
				obj = obj ? this.get_node(obj) : this.get_container();
				obj.find("li.jstree-open").andSelf().each(function () { _this.close_node(this); });
				return { 'obj' : obj };
			},
			__reopen : function () {
				var _this = this;
				if(this.data.opened_ids.length) {
					var remaining = [];
					$.each(this.data.opened_ids, function (i, val) {
						if(val == "#") return true;
						if($(val).size()) { _this.open_node(val, false, false, true); return true; }
						remaining.push(val);
					});
					this.data.opened_ids = remaining;
				}
			}
		},
		callback : function (t, f, d) {
			var cb = t + ":" + f;
			switch(t + ":" + f) {
				case "before:load": 
					if(d[1] == true) this.data.opened_ids = $.map($.makeArray(this.settings.open), function (n) { return "#" + n.toString().replace(/^#/,"").replace('\\/','/').replace('/','\\/'); });
					else data.obj.find(".jstree-open").each(function() { this.data.opened_ids.push("#" + this.id.replace('/','\\/')); });
					break;
				case "after:load":
					this.__reopen();
					break;
				case "after:open_node": 
					if(d.is_refresh && d.is_async) this.__reopen();
					break;
			}
		}
	});
	$.jstree.defaults.plugin_list.push("open");
})(jQuery);
// jsTree open_close plugin end

// jsTree selection plugin begin
(function ($) {
	$.jstree.plugin("select", {
		defaults : { 
			selected : [],
			selected_parent_close : false,
			selected_parent_delete : false,
			// TODO: implement multiple (maybe UI plugin, separate function or here)
			multiple : false, // TODO: on, ctrl, shift, alt
			enhance : {
				"func_name" : 1 // function name, parameter index (0-based)
			}
		},
		_fn : {
			select_node : function (obj) {
				obj = this.get_node(obj);
				if(!obj.length) return false;
				if(!this.is_selected(obj)) {
					obj.children("a").removeClass("jstree-hover").addClass("jstree-clicked");
					this.data.selected = this.data.selected.add(obj);
				}
			},
			deselect_node : function (obj) {
				obj = this.get_node(obj);
				if(!obj.length) return false;
				if(this.is_selected(obj)) {
					obj.children("a").removeClass("jstree-clicked");
					this.data.selected = this.data.selected.not(obj);
				}
			},
			toggle_select : function (obj) {
				obj = this.get_node(obj);
				if(!obj.length) return false;
				if(this.is_selected(obj)) { this.deselect_node(obj); }
				else { this.select_node(obj); }
			},
			is_selected : function (obj) { return this.data.selected.index(this.get_node(obj)) >= 0; },
			get_selected : function (context) { if(context) return $(context).find(".jstree-clicked").parent(); else return this.data.selected; },
			__reselect : function () {
				var _this = this;
				if(this.data.selected_ids.length) {
					var remaining = [];
					$.each(this.data.selected_ids, function (i, val) {
						if(val == "#") return true;
						if($(val).size()) { _this.select_node(val); return true; }
						remaining.push(val);
					});
					this.data.selected_ids = remaining;
				}
			}
		},
		callback : function (t, f, d) {
			switch(t + ":" + f) {
				case "before:_init": 
					this.data.selected = $([]);
					this.data.selected_ids = [];
					break;
				case "before:load":
					this.data.selected_ids = [];
					if(d[1] == true) this.data.selected_ids = $.map($.makeArray(this.settings.select.selected), function (n) { return "#" + n.toString().replace(/^#/,"").replace('\\/','/').replace('/','\\/'); });
					else this.data.selected.each(function() { this.data.selected_ids.push("#" + this.id.replace('/','\\/')); });
					break;
				case "after:load": 
					this.__reselect();
					break;
				case "after:open_node":
					if(d.is_refresh && d.is_async) this.__reselect();
					break;
				case "after:close_node" :
					if(d.obj && this.settings.select.selected_parent_close) {
						var n = this.get_selected(data.object), _this = this;
						if(n.length) {
							n.each(function () { 
								_this.deselect_node(this); 
							});
							if(this.settings.select.selected_parent_close == "select_parent") this.select_node(data.obj);
						}
					}
					break;
				case "before:delete_node": 
					if(this.is_selected(obj) && this.settings.select.selected_delete == "select_previous") this.data.selected_delete = this.get_prev(obj);
					else this.data.selected_delete = false;
					break;
				case "after:delete_node":
					if(this.data.selected_delete) this.select_node(this.data.selected_delete);
					this.data.selected_delete = false;
					break;
			}
			if(t == "before" && typeof this.settings.select.enhance[f] !== "undefined") d[this.settings.enhance[f]] = this.data.selected;
		}
	});
	$.jstree.defaults.plugin_list.push("select");
})(jQuery);
// jsTree selection plugin end



// Datastores begin
(function ($) {
	// html datastore begin
	$.extend($.jstree.datastores, {
		"html" : function (tree, opts, is_partial) {
			var cnt = (!is_partial && !opts.url) ? tree.get_container().children("ul:eq(0)").html() : null;
			return {
				get		: function(obj) { return obj && $(obj).size() ? $('<div>').append(tree.get_node(obj).clone()).html() : tree.get_container().children("ul:eq(0)").html(); },
				parse	: function(data, callback) { return data; },
				load	: function(data, callback) {
					if(opts.url) {
						$.ajax({
							'type'		: opts.method,
							'url'		: opts.url, 
							'data'		: data, 
							'dataType'	: "html",
							'success'	: function (d, textStatus) {
								callback.call(null, d);
							},
							'error'		: function (xhttp, textStatus, errorThrown) { 
								callback.call(null, false);
								tree.error(errorThrown + " " + textStatus); 
							}
						});
					}
					else {
						callback.call(null, opts.staticData || cnt || "");
					}
				}
			};
		}
	});
	// html datastore end
})(jQuery);
// Datastores end


/*
	$.jstree.fn = $.jstree.instance.prototype = {

	};


// Plugins begin
(function($) {

	// jsTree lock plugin begin
	$.jstree.add_plugin("lock", {
		defaults : false,
		fn : {
			lock		: function () { this.settings.locked = true; },
			unlock		: function () { this.settings.locked = false; },
			is_locked	: function () { return this.settings.locked !== undefined && this.settings.locked; }
		},
		callbacks : {
			// "before-all" : 
		}
		// TODO: all other functions - maybe they should be blocked? maybe bind to an event function???
	});
	// jsTree lock plugin end

	// jsTree types plugin begin
	$.jstree.add_plugin("rules", {
		defaults : {
			max_children		: -1,
			max_depth			: -1,
			valid_children		: "all",

			type_attr : "rel",
			types : {
				"default" : {
					"max_children"	: -1,
					"max_depth"		: -1,
					"valid_children": "all",

					// Bound functions - you can bind any other function here (boolean or function)
					"select_node"	: true,
					"open_node"		: true,
					"close_node"	: true,
					"create_node"	: true,
					"delete_node"	: true
				}
			},
			check : ["max_depth", "max_children", "valid_children", "select_node", "open_node", "close_node", "create_node", "delete_node" ]
		},
		fn : {
			enable_rules : function () { this.data.rules = true; },
			disable_rules : function () { this.data.rules = false; },

			get_type : function (obj) {
				obj = this.get_node(obj);
				if(!obj || !obj.length) return false;
				return obj.attr(this.settings.rules.type_attr) || "default";
			},
			set_type : function (str, obj) {
				obj = this.get_node(obj);
				if(!obj.length || !str) return false;
				obj.attr(this.settings.rules.type_attr, str);
			},
			check : function (rule, obj) {
				var v = false, t = this.get_type(obj);
				
				if(obj === -1) { 
					if(typeof this.settings.rules[rule] != "undefined") v = this.settings.rules[rule]; 
					else return;
				}
				else {
					if(t === false) return;
					if(this.settings.rules.types[t] !== undefined && this.settings.rules.types[t][rule] !== undefined) v = this.settings.rules.types[t][rule];
					else if(this.settings.rules.types["default"] !== undefined && this.settings.rules.types["default"][rule] !== undefined) v = this.settings.rules.types["default"][rule];
				}
				if($.isFunction(v)) v = v.call(null, obj, this);
				return v;
			}
		},
		callbacks : {
			"before-all" : function () { 
				if(this.data.rules) {
					var args = $.makeArray(arguments), func = args.shift(), v = false, _this = this;
					if($.inArray(func, this.settings.rules.check) == -1) return;
					$.each(args, function (i, val) { 
						v = _this.check(func, val);
						if(v !== undefined) return false;
					});
					if(v === false) return false;
				}
			},
			"before-init" : function () {
				var types = this.settings.rules.types, attr = this.settings.rules.type_attr, icons_css = "", _this = this;
				$.each(types, function (i, tp) {
					if(!tp.icon) return true;
					if( tp.icon.image || tp.icon.position) {
						if(i == "default")	icons_css += '.jstree-' + _this.get_index() + ' ul li > a ins { ';
						else				icons_css += '.jstree-' + _this.get_index() + ' ul li[' + attr + '=' + i + '] > a ins { ';
						if(tp.icon.image)		icons_css += ' background-image:url(' + tp.icon.image + '); ';
						if(tp.icon.position)	icons_css += ' background-position:' + tp.icon.position + '; ';
						icons_css += '} ';
					}
				});
				if(icons_css != "") $.jstree.css.add_sheet({ 'str' : icons_css });
			},
			"after-init" : function () {
				this.enable_rules();
			}
		}
	});
	// jsTree types plugin begin

	// jsTree debug plugin begin
	$.jstree.add_plugin("debug", {
		callbacks : {
			"before-all"	: function () { var args = $.makeArray(arguments); if(args[0] == "select_node") { console.log("before :: " + args.shift() + " :: Arguments:"); console.log(args); } },
			"after-all"		: function () { var args = $.makeArray(arguments); if(false) { console.log("after :: "  + args.shift() + " :: Result:"); console.log(args[0]); } }
		}
	});
	// jsTree debug plugin end

	// TODO: add create/rename (set_text)/delete

	// jsTree move plugin begin
	$.jstree.add_plugin("move", {
		defaults : {
			copy : "on" // TODO: ctrl, shift, alt
		},
		fn : {
			copy : function (obj) {
				obj = this.get_node(obj);
				if(obj && obj.length) { move.set_node(obj, this); move.data.is_copy = true; }
			},
			cut : function (obj) {
				obj = this.get_node(obj);
				if(obj && obj.length) { move.set_node(obj, this); move.data.is_copy = true; }
			},
			paste : function (obj, position) {
				
			}
		}
	});
	// TODO: get_parent is used? Describe requirement - traverse plugin
	var move = {
		set_node : function (n, t) {
			var is_parse = false;
			if(!(n instanceof jQuery)) {
				is_parse = true;
				var str = t.parse_data(data, new $.jstree.datastores.json(t, this.settings.data.opts));
				n = $(obj_s);
				t.loaded({ 'obj' : n });
			}
			move.data.t = t ? t : $.jstree.reference(n);
			if(move.data.t) {
				move.data.n = move.data.t.get_node(n);
				move.data.nt = move.data.t.get_type(move.data.n)
			}
			move.data.np = is_parse || !move.data.t ? false : move.data.t.get_parent(n);
			move.data.n.addClass("jstree-dragged");
			if(!move.data.nc) move.data.nc = move.data.n.size();
			// TODO: fix possible async problem - when nodes are not all loaded down the chain
			if(!move.data.nd) {
				move.data.nd = 0;
				t = move.data.n;
				while(t.size() > 0) { t = t.children("ul").children("li"); move.data.nd ++; }
			}
		},
		set_ref_node : function (n, t) {
			move.data.rt = t ? t : $.jstree.reference(n);
			move.data.rn = n == -1 ? -1 : move.data.rt.get_node(n);
		},
		set_position : function (p) {
			move.data.p = p;
		},
		prepare_move : function (m_obj) {
			if(!m_obj) m_obj = move.data;
			if(!m_obj.p || !m_obj.rn) return;
			switch(m_obj.p) {
				case "before":
					m_obj.cp = m_obj.rn.parent().children().index(m_obj.rn);
					m_obj.crn = m_obj.rt.get_parent(m_obj.rn);
					break;
				case "after":
					m_obj.cp = m_obj.rn.parent().children().index(m_obj.rn) + 1;
					m_obj.crn = m_obj.rt.get_parent(m_obj.rn);
					break;
				case "inside":
					// TODO: rules setting? maybe this should be in the native plugin options?
					m_obj.cp = (m_obj.rt.settings.rules.createat == "top") ? 0 : m_obj.rt.get_children(m_obj.rn).size();
					m_obj.crn = m_obj.rn;
					break;
				default: 
					m_obj.cp  = m_obj.p;
					m_obj.crn = m_obj.rn;
					break;
			}
		},
		check_move : function (is_create, m_obj) {
			if(!m_obj) m_obj = move.data;

			var tree1 = m_obj.t;
			var tree2 = m_obj.rt;
			// disable non tree drags
			if(!tree1 && !tree2) return false;
			// drop-target is .jstree-drop
			if(!tree2) { return tree1._callback("check_move", [is_create, m_obj]); }
			// receiving tree is locked
			if(tree2.is_locked()) return false;
			// drop is over self
			if(!is_create && m_obj.rn != -1 && m_obj.rn.closest("li.jstree-dragged").size()) return false;
			// different trees and multitree not allowed
			if(tree1 && tree1 != tree2) {
				var m = tree2.settings.rules.multitree;
				if(m == "none" || ($.isArray(m) && $.inArray(tree1.get_container().attr("id"), m) == -1)) return false;
			}

			m_obj.crn = (/^(after|before)$/.test(m_obj.p)) ? tree2.get_parent(m_obj.rn) : m_obj.rn;

			if(move.crn == false) return false;
			var t2md = tree2.settings.rules.use_max_depth;
			var t2mc = tree2.settings.rules.use_max_children;
			var p = m_obj.crn;
			var r = {
				max_depth : t2md ? tree2.check("max_depth", p) : -1,
				max_children : t2mc ? tree2.check("max_children", p) : -1,
				valid_children : tree2.check("valid_children", p)
			};
			if(typeof r.valid_children != "undefined" && (r.valid_children == "none" || (typeof r.valid_children == "object" && $.inArray(m_obj.nt, r.valid_children) == -1))) return false;
			// check max_children
			if(t2mc) {
				if(typeof r.max_children != "undefined" && r.max_children != -1) {
					if(r.max_children == 0) return false;
					if(r.max_children < p.find('> ul > li').not('.jstree-dragged').size() + m_obj.nc) return false;
				}
			}
			// check max_depth
			if(t2md) {
				var md = r.max_depth, t = p;
				if(md !== false && md !== -1 && md - m_obj.nd < 0) return false;
				do {
					t = tree2.get_parent(t);
					md = tree2.check("max_depth",t);
					if(md !== false && md !== -1 && md - m_obj.nd <= 0) return false;
				} while(t !== -1 && t !== false);
			}
			// callback
			if(tree2._callback("check_move", [is_create, m_obj]) == false) return false;
			return true;
		},
		do_move : function (is_create, m_obj) {
			if(!m_obj) m_obj = move.data;
			if(m_obj.n === false || m_obj.rn == false || m_obj.p === false) return false;
			move.prepare_move(m_obj);

			var ref_dom = (m_obj.crn == -1) ? m_obj.rt.get_container() : m_obj.crn;
			var $ul = false;
			// if the insert place has no ul in it
			if(ref_dom.children("ul").size() == 0) {
				if(m_obj.crn != -1 && !m_obj.crn.hasClass("jstree-open jstree-closed")) m_obj.crn.removeClass("jstree-leaf").addClass("jstree-closed");
				$ul = $("<ul>");
				ref_dom.append($ul);
			}
			else { $ul = ref_dom.children("ul:eq(0)"); }

			// TODO: what if multiple???

			if(m_obj.n.children("ul").size()) { if(m_obj.n.is(".jstree-open")) { m_obj.n.addClass("jstree-closed"); } }
			else { m_obj.n.addClass("jstree-leaf"); }
			m_obj.n.removeClass("jstree-dragged");
			m_obj.n.find("li:last-child").addClass("jstree-last").end().find("li:has(ul)").not(".jstree-open").addClass("jstree-closed");
			m_obj.n.find("li").not(".jstree-open").not(".jstree-closed").addClass("jstree-leaf");
			// append data (nth-child is not zero based)
			var $ref_li = $ul.children("li:nth-child(" + (m_obj.cp + 1) + ")");
			if($ref_li.size()) { $ref_li.before(m_obj.n); }
			else { m_obj.cp = $ul.children().size(); $ul.append(m_obj.n); }
			// clean up new parent
			$ul.children(".jstree-last").removeClass("jstree-last").end().children("li:last-child").addClass("jstree-last");
			// clean up old parent
			if(m_obj.np == -1) m_obj.np = m_obj.t.get_container();
			if(m_obj.np) m_obj.np.children("ul").children(".jstree-last").removeClass("jstree-last").end().children("li:last-child").addClass("jstree-last");
			if(m_obj.np && m_obj.np.children("ul").children("li").size() == 0) m_obj.np.removeClass("jstree-open jstree-closed").addClass("jstree-leaf");
			var tmp = $.extend(true, {}, move.data);
			// add appropriate type
			if(m_obj.rt != m_obj.t) {
				m_obj.n.find(".jstree-clicked").removeClass("jstree-clicked");
				if(m_obj.rt) m_obj.rt.set_type(m_obj.nt, m_obj.n);
			}
			move.reset_data();
			return tmp;
		},
		data : {
			n	: false, // node being moved
			t	: false, // origin tree
			rn	: false, // reference node
			rt	: false, // receiving tree
			p	: false, // position
			cp	: false, // calculated position
			crn	: false  // calculated reference node
		},
		reset_data : function () {
			if(move.data.open_time) clearTimeout(move.data.open_time);
			if(move.data.helper_node) move.data.helper_node.remove(); 
			if(move.helper_marker) move.helper_marker.hide();
			if(move.data.n) move.data.n.removeClass("jstree-dragged");
			for(var i in move.data) { if(!move.data.hasOwnProperty(i)) continue; move.data[i] = false; }
		}
	};
	$.jstree.move	= function (obj, ref, p, is_copy, skip_check) { $.jstree[ is_copy ? "copy" : "cut" ](obj); $.jstree.paste(ref, p, skip_check); };
	$.jstree.cut	= function (obj) { move.set_node(obj); };
	$.jstree.copy	= function (obj) { $.jstree.cut(obj); move.data.is_copy = true; }; // TODO: add copy option
	$.jstree.paste	= function (ref, p, skip_check) { move.set_ref_node(ref); move.set_position(p || "inside"); if(skip_check || move.check_move()) move.do_move(); }; // TODO: how about check move
	// jsTree move plugin end
})(jQuery);
// Plugins end
*/