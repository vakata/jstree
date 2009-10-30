// TODO: callbacks/events - maybe a this.plugin("collect_state", obj) call?
// TODO: revisit errors
// TODO: jQuery 1.3.3 index() instead of index(context)
// TODO: mac shit - drag'n'drop, camino icons
// TODO: modifiers - shift/ctrl/command - mac metakey
// TODO: beforedata - call before URL is set
// TODO: reenable all plugins ($.jstree)
// TODO: checkbox - move all at once, deselect all, select_all, set selected_parent_close to false
// TODO: contextmenu - localization, type based entries?
// TODO: get - not returning XML??? (bug filed)
// TODO: scrolling (jquery ui), drag_start, drag_end, drag events
// TODO: cut, copy, paste
// TODO: check YUI compressor
// TODO: check all icons - reset positioning if custom icon is used

// jsTree core begin
(function($) {
	var instances = [], focused_instance = null, undefined;
	$.fn.jstree = function () {
		var args = arguments;
		return this.each(function() {
			// if first argument is string, call that function on the instance
			if(typeof args[0] == "string") {
				var instance_id = $.data(this, "jstree-instance-id");
				// but only if instance exists
				if(instances[instance_id] && $.isFunction(instances[instance_id][args[0]])) {
					// remove the first argument (the function name string)
					_args = $.makeArray(args); _args.shift();
					instances[instance_id][args[0]].apply(instances[instance_id], _args);
				}
			}
			// otherwise - build the tree
			else {
				// if tree already exists - destroy it first
				var instance_id = $.data(this, "jstree-instance-id");
				if(instance_id && instances[instance_id]) instances[instance_id].destroy();
				$.jstree.create(this, args[0]);
			}
		});
	};
	$.jstree = { 
		create : function (elem, opts) {
			// TODO: read some options off metadata???
			var new_index = parseInt(instances.push({})) - 1;
			$.data(elem, "jstree-instance-id", new_index);
			opts = $.extend(true, {}, $.jstree.defaults, opts);
			instances[new_index] = new $.jstree.instance(new_index, $(elem).addClass("jstree jstree-" + new_index), opts); 
			instances[new_index].init();
			return instances[new_index];
		},
		focused : function () { 
			return instances[focused_instance] || null; 
		},
		reference : function (obj) { 
			var o = $(obj); o = o.length ? o : $("#" + obj); if(!o.length) { return null };
			o = (o.is(".jstree")) ? o.get(0) : o.parents(".jstree:eq(0)").get(0);
			o = jQuery.data(o, "jstree-instance-id");
			return instances[o] || null; 
		},

		instance : function (index, container, settings) {
			this.settings		= settings;
			this.data			= {};
			this.get_index		= function () { return index; };
			this.get_container	= function () { return container; };
		},
		defaults : { }
	};
	$.jstree.fn = $.jstree.instance.prototype = {
		init : function () { this.set_focus(); },
		set_focus : function () { focused_instance = this.get_index(); },
		is_focused : function () { return focused_instance == this.get_index(); },
		get_node : function (obj) { var $obj = $(obj); return $obj.is(".jstree") || obj == -1 ? -1 : $obj.closest("li", this.get_container()); },
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
		},
		destroy : function () {
			var n = this.get_index(), c = this.get_container();
			if(this.is_focused()) {
				for(var i in instances) {
					if(!instances.hasOwnProperty(i) || i == n) continue;
					instances[i].set_focus();
					break;
				}
			}
			$.removeData(c, "jstree-instance-id");
			// remove all traces of jstree in the DOM
			c.removeClass("jstree jstree-" + index)
				.children("ul").removeClass("jstree-no-dots jstree-ltr jstree-locked")
					.find("li").removeClass("jstree-leaf jstree-open jstree-closed jstree-last")

			instances[n] = null;
			delete instances[n];
		}
	};

	// plugin functionality begin
	$.jstree.plugin = {};
	$.jstree.defaults.plugin = [];
	$.jstree.add_plugin = function (plugin_name, plugin_data) {
		if(plugin_data.fn) {
			$.extend($.jstree.fn, plugin_data.fn);
			$.each(plugin_data.fn, function (i, val) {
				$.jstree.fn[i].plugin = plugin_name;
			});
		}
		$.jstree.plugin[plugin_name] = plugin_data.callbacks || {};
		$.jstree.defaults[plugin_name] = plugin_data.defaults || {};
	};
	$(function () {
		$.each($.jstree.fn, function (i, val) {
			if(!$.isFunction(val)) return true;
			$.jstree.fn[i] = function () {
				var _this = this, args = arguments, ret, tmp;
				if(val.plugin && $.inArray(val.plugin,this.settings.plugin) == -1) return false;

				$.each(this.settings.plugin, function (j, cb) { 
					if($.jstree.plugin[cb]["before-all"]) {
						tmp = $.jstree.plugin[cb]["before-all"].apply(_this, $.merge([i],args)); 
						if($.isArray(tmp)) { args = tmp; }
					}
					if($.jstree.plugin[cb]["before-" + i]) {
						tmp = $.jstree.plugin[cb]["before-" + i].apply(_this, args); 
						if($.isArray(tmp)) { args = tmp; }
					}
					if(args === false) return false; 
				});
				if(args === false) return false;
				ret = val.apply(this, args);
				$.each(this.settings.plugin, function (j, cb) { 
					if($.jstree.plugin[cb]["after-" + i]) {
						tmp = $.jstree.plugin[cb]["after-" + i].apply(_this, [ret]); 
						if(tmp !== undefined) ret = tmp;
					}
					if($.jstree.plugin[cb]["after-all"]) {
						tmp = $.jstree.plugin[cb]["after-all"].apply(_this, [i,ret]); 
						if(tmp !== undefined) ret = tmp;
					}
				});
				return ret;
			};
		});
	});
	// plugin functionality end

	// css functions & append begin
	$.jstree.css = {
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
	$(function() {
		var u = navigator.userAgent.toLowerCase(),
			v = (u.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
			css_string = '/* TREE LAYOUT */ .jstree ul { margin:0 0 0 5px; padding:0 0 0 0; list-style-type:none; } .jstree li { display:block; min-height:18px; line-height:18px; padding:0 0 0 15px; margin:0 0 0 0; /* Background fix */ clear:both; } .jstree li ul { display:none; } .jstree li a, .jstree li span { display:inline-block;line-height:16px;height:16px;color:black;white-space:nowrap;text-decoration:none;padding:1px 4px 1px 4px;margin:0; } .jstree li a:focus { outline: none; } .jstree li a input, .jstree li span input { margin:0;padding:0 0;display:inline-block;height:12px !important;border:1px solid white;background:white;font-size:10px;font-family:Verdana; } .jstree li a input:not([class="xxx"]), .jstree li span input:not([class="xxx"]) { padding:1px 0; } /* FOR DOTS */ .jstree .jstree-ltr li.jstree-last { float:left; } .jstree > ul li.jstree-last { overflow:visible; } /* OPEN OR CLOSE */ .jstree li.jstree-open ul { display:block; } .jstree li.jstree-closed ul { display:none !important; } /* FOR DRAGGING */ #jstree-dragged { position:absolute; top:-10px; left:-10px; margin:0; padding:0; z-index:1000; } #jstree-dragged ul ul ul { display:none; } #jstree-marker { cursor:pointer; padding:0; margin:0; line-height:5px; font-size:1px; overflow:hidden; height:5px; position:absolute; left:-45px; top:-30px; z-index:1000; background-color:transparent; background-repeat:no-repeat; display:none; } #jstree-marker.jstree-marker { width:45px; background-position:-32px top; } #jstree-marker.jstree-marker-plus { width:5px; background-position:right top; } /* BACKGROUND DOTS */ .jstree li li { overflow:hidden; } .jstree > .jstree-ltr > li { display:table; } /* ICONS */ .jstree ul ins { display:inline-block; text-decoration:none; width:16px; height:16px; } .jstree .jstree-ltr ins { margin:0 4px 0 0px; } ';
		if(/msie/.test(u) && !/opera/.test(u)) { 
			if(parseInt(v) == 6) css_string += '.jstree li { height:18px; zoom:1; } .jstree li li { overflow:visible; } .jstree .jstree-ltr li.jstree-last { margin-top: expression( (this.previousSibling && /jstree-open/.test(this.previousSibling.className) ) ? "-2px" : "0"); } .jstree-marker { width:45px; background-position:-32px top; } .jstree-marker-plus { width:5px; background-position:right top; }';
			if(parseInt(v) == 7) css_string += '.jstree li li { overflow:visible; } .jstree .jstree-ltr li.jstree-last { margin-top: expression( (this.previousSibling && /jstree-open/.test(this.previousSibling.className) ) ? "-2px" : "0"); }';
		}
		if(/opera/.test(u)) css_string += '.jstree > ul > li.jstree-last:after { content:"."; display: block; height:1px; clear:both; visibility:hidden; }';
		if(/mozilla/.test(u) && !/(compatible|webkit)/.test(u) && v.indexOf("1.8") == 0) css_string += '.jstree .jstree-ltr li a { display:inline; float:left; } .jstree li ul { clear:both; }';
		$.jstree.css.add_sheet({ str : css_string, rel : "jstree" });
		delete u; delete v; delete css_string;
	});
	// css functions & append end
})(jQuery);
// jsTree core end


(function($) {

	// jsTree data plugin (REQUIRED) begin
	$.jstree.datastores = {};
	$.jstree.add_plugin("data", {
		defaults : { type : "html", async : false, opts : {} },
		fn : {
			load : function (obj, is_initial, callback) {
				var ret = { 'is_partial' : (obj && this.settings.data.async), 'is_initial' : is_initial }, _this = this, _datastore = false, opts = this.settings.data.opts, str = "";
				obj = ret.obj = (ret.is_partial) ? this.get_node(obj) : this.get_container();

				opts = this.get_data(obj);
				_datastore = new $.jstree.datastores[this.settings.data.type](this, this.settings.data.opts, ret.is_partial);

				obj.children("ul").remove();
				if(ret.is_partial) { obj.children("a").addClass("jstree-loading"); }
				else { obj.html("<ul class='jstree-ltr' style='direction:ltr;'><li class='jstree-last jstree-leaf'><a class='jstree-loading' href='#'><ins>&nbsp;</ins>" + (this.settings.data.loading_text || "Loading ...") + "</a></li></ul>"); }

				_datastore.load(opts, function (data) {
					str = _this.parse_data(data, _datastore);
					if(str.length) {
						if(obj.children("ul").length == 0) obj.append("ul");
						obj.children("a").removeClass("jstree-loading").end().children("ul").empty().append(str);
					}
					else {
						obj.removeClass("jstree-closed").removeClass("jstree-open").children("ul").remove();
						if(ret.is_partial) obj.addClass("jstree-leaf");
					}
					_this.loaded(ret);
					if(callback) callback.call();
				});
				return ret;
			},
			get_data : function (obj) { return { id : obj.attr("id") || 0 }; },
			parse_data : function (data, _datastore) {
				return _datastore.parse(data);
			},
			loaded : function(obj) {
				this.clean_html(obj.obj);
			},
			clean_html : function(obj) {
				obj = obj ? $(obj) : this.get_container();
				obj = obj.is("li") ? obj.find("li").andSelf() : obj.find("li");

				obj.removeClass("jstree-last").filter("li:last-child").addClass("jstree-last").end().find("li:has(ul)").not(".jstree-open").addClass("jstree-closed");
				obj.not(".jstree-open, .jstree-closed").addClass("jstree-leaf");
			},
			is_loaded : function (obj) { obj = this.get_node(obj); return this.settings.data.async == false || obj.is(".jstree-open, .jstree-leaf") || obj.children("ul").children("li").size() > 0; }
		},
		callbacks : {
			"after-init" : function () { this.load(false,true); }
		}
	});
	// jsTree data plugin end

	// jsTree lock plugin begin
	$.jstree.add_plugin("lock", {
		fn : {
			lock		: function () { this.data.locked = true; },
			unlock		: function () { this.data.locked = false; },
			is_locked	: function () { return this.data.locked !== undefined && this.data.locked; }
		}
		// TODO: before-init - maybe have the option to init the tree as locked
		// TODO: all other functions - maybe they should be blocked?
	});
	// jsTree lock plugin end

	// jsTree traverse plugin begin
	$.jstree.add_plugin("traverse", {
		fn : {
			get_next : function (obj, strict) {
				obj = this.get_node(obj);
				if(!obj.length) return false;
				if(strict) return (obj.nextAll("li").size() > 0) ? obj.nextAll("li:eq(0)") : false;

				if(obj.hasClass("jstree-open")) return obj.find("li:eq(0)");
				else if(obj.nextAll("li").size() > 0) return obj.nextAll("li:eq(0)");
				else return obj.parents("li").next("li").eq(0);
			},
			get_prev : function(obj, strict) {
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
			get_parent : function(obj) {
				obj = this.get_node(obj);
				if(obj == -1 || !obj.length) return false;
				return obj.parents("li:eq(0)").length ? obj.parents("li:eq(0)") : -1;
			},
			get_children : function(obj) {
				obj = this.get_node(obj);
				if(obj === -1) return this.get_container().children("ul:eq(0)").children("li");
				if(!obj.length) return false;
				return obj.children("ul:eq(0)").children("li");
			}
		}
	});
	// jsTree traverse plugin end

	// jsTree themes plugin begin
	var themes_loaded = [];
	$.jstree.themes = false;
	$.jstree.add_plugin("themes", {
		defaults : { theme : "default", dots : true },
		fn : {
			set_theme : function (theme_name, theme_url) {
				if(theme_name === undefined) return false;
				if(theme_url === undefined) theme_url = $.jstree.themes + theme_name + '/style.css';
				if($.inArray(theme_url, themes_loaded) == -1) {
					// TODO: add css functions
					$.jstree.css.add_sheet({ "url" : theme_url, "rel" : "jstree" });
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
		callbacks : {
			"before-init" : function () { this.set_theme(this.settings.themes.theme); },
			"after-load" : function (ret) { if(!ret.is_partial) this.set_theme(this.settings.themes.theme); }
		}
	});
	$(function () {
		if($.jstree.themes === false) {
			$("script").each(function () { 
				if(this.src.toString().match(/jquery\.jstree[^/]*?\.js(\?.*)?$/)) { 
					$.jstree.themes = this.src.toString().replace(/jquery\.jstree[^/]*?\.js(\?.*)?$/, "") + 'themes/'; 
					return false; 
				}
			});
		}
		if($.jstree.themes === false) $.jstree.themes = "themes/";
	});
	// jsTree themes plugin end

	// jsTree languages plugins begin
	$.jstree.add_plugin("languages", {
		defaults : [],
		fn : {
			set_lang : function (i) { 
				var langs = this.setting.languages;
				if(!$.isArray(langs) || langs.length == 0) return false;
				if($.inArray(i,langs) == -1) {
					if(langs[i] != undefined) i = langs[i];
					else return false;
				}
				if(i == this.data.current_language) return true;
				var st = false, selector = ".jstree-" + this.get_index() + ' ul li a';
				st = $.jstree.css.get_css(selector + "." + this.data.current_language, false, this.data.language_css);
				if(st !== false) st.style.display = "none";
				st = $.jstree.css.get_css(selector + "." + i, false, this.data.language_css);
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
			}
		},
		callbacks : {
			"after-init" : function () {
				var langs = this.settings.languages;
				if($.isArray(langs) && langs.length) {
					this.data.current_language = langs[0];
					str = "/* languages css */";
					selector = ".jstree-" + this.get_index() + ' ul li a';
					for(var ln = 0; ln < langs.length; ln++) {
						str += selector + "." + langs[ln] + " {";
						if(langs[ln] != this.data.current_language) str += " display:none; ";
						str += " } ";
					}
					this.data.language_css = $.jstree.css.add_sheet({ 'str' : str });
				}
			}
		}
	});
	// jsTree languages plugins end

	// push all plugins for testing
	$.jstree.defaults.plugin = ["data", "lock", "traverse", "themes", "languages"];

})(jQuery);



// jsTree debug plugin begin
$.jstree.add_plugin("debug", {
	callbacks : {
		"before-all"	: function () { var args = $.makeArray(arguments); console.log("before :: " + args.shift() + " :: Arguments:");	console.log(args); },
		"after-all"		: function () { var args = $.makeArray(arguments); console.log("after :: "  + args.shift() + " :: Result:");	console.log(args[0]); }
	}
});
$.jstree.defaults.plugin.push("debug");
// jsTree debug plugin end

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



(function($) {
return;


// type functions begin
$.extend($.jstree.fn, {
	get_type	: function (obj) {
		obj = this.get_node(obj);
		if(!obj.size()) return false;
		return obj.attr(settings.rules.type_attr) || "default";
	},
	set_type	: function (str, obj) {
		obj = this.get_node(obj);
		if(!obj.size() || !str) return false;
		obj.attr(settings.rules.type_attr, str);
	}
});
$(function () {
	$(".jstree").live("jstree-init", function () {
		var t = $.jstree.reference(this),
			type_icons = "",
			ts = {},
			ta = "";
		if(!t) return;
		ts = t.get_setting("types");
		ta = t.get_setting("rules.type_attr");
		for(var tp in ts) {
			if(!ts.hasOwnProperty(tp)) continue;
			if(!ts[tp].icon) continue;
			if( ts[tp].icon.image || ts[tp].icon.position) {
				if(ts == "default")	type_icons += '.jstree-' + t.get_index() + ' ul li > a ins { ';
				else				type_icons += '.jstree-' + t.get_index() + ' ul li[' + ta + '=' + tp + '] > a ins { ';
				if(ts[tp].icon.image)		type_icons += ' background-image:url(' + ts[tp].icon.image + '); ';
				if(ts[tp].icon.position)	type_icons += ' background-position:' + ts[tp].icon.position + '; ';
				type_icons += '} ';
			}
		}
		if(type_icons != "") $.jstree.css.add_sheet({ str : type_icons });
	});
});
// type functions end

// language functions begin
$.extend($.jstree.fn, {

});
$(function () {
	$(".jstree").live("jstree-init", function () {
		var t = $.jstree.reference(this), langs = [], st = false, selector = "", str = "";
		if(!t) return;
		langs = t.get_setting("languages");
		if($.isArray(langs) && langs.length) {
			t.data.current_lang = langs[0];
			str = "/* languages css */";
			selector = ".jstree-" + t.get_index() + ' ul li a';
			for(var ln = 0; ln < langs.length; ln++) {
				str += selector + "." + langs[ln] + " {";
				if(langs[ln] != t.data.current_lang) str += " display:none; ";
				str += " } ";
			}
			t.data.lang_css = $.jstree.css.add_sheet({ 'str' : str });
		}
	});
});
// language functions end

// open/close functions begin
$.extend($.jstree.fn, {
	open_node : function (obj, callback, is_async, is_refresh) {
		obj = this.get_node(obj);
		if(!obj.size()) return false;
		if(!this.is_loaded(obj)) {
			var _this = this;
			obj.children("a").addClass("jstree-loading");
			this.load_node(obj, function () { _this.open_node(obj, callback, true, is_refresh); });
			return;
		}
		obj.removeClass("jstree-closed").addClass("jstree-open").children("a").removeClass("jstree-loading");
		if(callback) callback.call();
		this.trigger("open", [{ 'obj' : obj, 'is_async' : is_async, 'is_refresh' : is_refresh }]);
	},
	close_node : function (obj) {
		obj = this.get_node(obj);
		if(!obj.size()) return false;
		obj.removeClass("jstree-open").addClass("jstree-closed");
		this.trigger("close", [{ 'obj' : obj }]);
	},
	toggle_node : function (obj) {
		obj = this.get_node(obj);
		if(obj.hasClass("jstree-closed"))	return this.open_node(obj);
		if(obj.hasClass("jstree-open"))		return this.close_node(obj); 
	},
	open_all : function (obj, original_obj) {
		obj = obj ? this.get_node(obj) : container;
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
		if(original_object && original_object.find('li.jstree-closed').size() == 0) this.trigger("open-all", [{ 'obj' : obj }]);
	},
	close_all : function (obj) {
		var _this = this;
		obj = obj ? this.get_node(obj) : container;
		obj.find("li.open").andSelf().each(function () { _this.close_node(this); });
		this.trigger("close-all", [{ 'obj' : obj }]);
	},
	reopen : function () {
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
});
$(function () {
	$(".jstree")
		.live("jstree-before-refresh", function (e, data) {
			var t = $.jstree.reference(this);
			if(!t) return;
			t.data.opened_ids = [];
			if(data.is_initial) t.data.opened_ids = $.map($.makeArray(t.get_setting("opened")), function (n) { return "#" + n.toString().replace(/^#/,"").replace('\\/','/').replace('/','\\/'); });
			else data.obj.find(".jstree-open").each(function() { t.data.opened_ids.push("#" + this.id.replace('/','\\/')); });
		})
		.live("jstree-refresh", function (e, data) {
			var t = $.jstree.reference(this);
			if(!t) return;
			t.reopen();
		})
		.live("jstree-open", function (e, data) {
			var t = $.jstree.reference(this);
			if(!t) return;
			if(data.is_refresh && data.is_async) t.reopen();
		});
});
// open/close functions end

// selection functions begin
$.extend($.jstree.fn, {
	select_node : function (obj) {
		obj = this.get_node(obj);
		if(!obj.size()) return false;
		if(!this.is_selected(obj)) {
			obj.children("a").removeClass("jstree-hover").addClass("jstree-clicked");
			this.data.selected = this.data.selected.add(obj);
		}
		this.trigger("select", [{ 'obj' : obj }]);
	},
	deselect_node : function (obj) {
		obj = this.get_node(obj);
		if(!obj.size()) return false;
		if(this.is_selected(obj)) {
			obj.children("a").removeClass("jstree-clicked");
			this.data.selected = this.data.selected.not(obj);
		}
		this.trigger("deselect", [{ 'obj' : obj }]);
	},
	toggle_select : function (obj) {
		obj = this.get_node(obj);
		if(this.is_selected(obj)) { this.deselect_node(obj); }
		else { this.select_node(obj); }
	},
	is_selected : function (obj) { return this.data.selected.index(this.get_node(obj)) >= 0; },
	get_selected : function () { return this.data.selected; },
	reselect : function () {
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
});
$(function () {
	$(".jstree")
		.live("jstree-init", function () {
			var t = $.jstree.reference(this), sel;
			if(!t) return;
			t.data.selected = $([]);
			t.data.selected_ids = [];
		})
		.live("jstree-before-refresh", function (e, data) {
			var t = $.jstree.reference(this);
			if(!t) return;
			t.data.selected_ids = [];
			if(data.is_initial) t.data.selected_ids = $.map($.makeArray(t.get_setting("selected")), function (n) { return "#" + n.toString().replace(/^#/,"").replace('\\/','/').replace('/','\\/'); });
			else t.data.selected.each(function() { t.data.selected_ids.push("#" + this.id.replace('/','\\/')); });
		})
		.live("jstree-refresh", function (e, data) {
			var t = $.jstree.reference(this);
			if(!t) return;
			t.reselect();
		})
		.live("jstree-open", function (e, data) {
			var t = $.jstree.reference(this);
			if(!t) return;
			if(data.is_refresh && data.is_async) t.reselect();
		});
});
// selection functions end





}) (jQuery);

