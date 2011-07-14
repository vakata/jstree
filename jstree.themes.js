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
		The location of _jquery.jstree.js_ is used for the autodetection.
		Normally you won't need to modify this (provided you leave the _themes_ folder in the same folder as _jquery.jstree.js_ and do not rename the file).
		If you decide to move the folder or rename the file, but still want to load themes by name, simply set this to the new location of the _themes_ folder.
		> <script type="text/javascript" src="jquery.jstree.js"></script>
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
						this.set_theme(s.theme, s.url);

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

			Variable: config.themes.dots
			*boolean* whether to show dots or not. Default is _true_. The chosen theme should support this option.

			Variable: config.themes.icons
			*boolean* whether to show icons or not. Default is _true_.
		*/
		defaults : { 
			theme	: false, 
			url		: false,
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
			set_theme : function (theme_name, theme_url) {
				if(!theme_name) { return false; }
				if(!theme_url) { theme_url = $.jstree.THEMES_DIR + theme_name + '/style.css'; }
				if($.inArray(theme_url, themes_loaded) === -1) {
					$.vakata.css.add_sheet({ "url" : theme_url });
					themes_loaded.push(theme_url);
				}
				if(this.data.themes.theme != theme_name) {
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
				if(this.src.toString().match(/jquery\.jstree[^\/]*?\.js(\?.*)?$/)) { 
					$.jstree.THEMES_DIR = this.src.toString().replace(/jquery\.jstree[^\/]*?\.js(\?.*)?$/, "") + 'themes/'; 
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