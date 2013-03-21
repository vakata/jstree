/**
 * ## jsTree 2.0.0-alpha ##
 * http://jstree.com/
 *
 * Copyright (c) 2013 Ivan Bozhanov (http://vakata.com)
 *
 * Licensed same as jquery - under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */
(function ($) {
	"use strict";

	// prevent another load? maybe there is a better way?
	if($.jstree) {
		return;
	}

	// internal variables
	var instance_counter = 0,
		ccp_node = false,
		ccp_mode = false,
		themes_loaded = [];

	/**
	 * ### Static $.jstree object
	 *
	 * `$.jstree` holds all jstree related functions and variables
	 *
	 * * `version` the jstree version in use
	 * * `plugins` stores all loaded jstree plugins
	 * * `defaults` holds the core & plugin's defaults
	 *
	 */
	$.jstree = {
		version : '2.0.0-alpha',
		defaults : {
			plugins : []
		},
		plugins : {}
	};
	/**
	 * `$.jstree.create()` creates a jstree instance
	 *
	 * __Parameters__
	 *
	 * * `el` - the element to create the instance in
	 * * `options` - options for the instance, extends `$.jstree.defaults`
	 *
	 * __Returns__
	 * the new jstree instance
	 */
	$.jstree.create = function (el, options) {
		var tmp = new $.jstree.core(++instance_counter),
			opt = options;
		options = $.extend(true, {}, $.jstree.defaults, options);
		if(opt && opt.plugins) {
			options.plugins = opt.plugins;
		}
		$.each(options.plugins, function (i, k) {
			if(i !== 'core') {
				tmp = tmp.plugin(k, options[k]);
			}
		});
		tmp.init(el, options);
		return tmp;
	};
	/**
	 * `$.jstree.core()` the actual empty class.
	 *
	 * Used internally -  to create an instance use either:
	 *
	 * * `$.jstree.create(element, options)` or
	 * * `$(selector).jstree(options)`
	 *
	 * __Parameters__
	 *
	 * * `id` - the instance index - passed internally
	 */
	$.jstree.core = function (id) {
		this._id = id;
		this._data = {
			'core' : {
				'themes' : {}
			}
		};
	};
	/**
	 * `$.jstree.reference()` get an instance by some selector.
	 *
	 * __Parameters__
	 *
	 * * `needle` - a DOM element / jQuery object to search by.
	 */
	$.jstree.reference = function (needle) {
		return $(needle).closest('.jstree').data('jstree');
	};
	/**
	 * ### jQuery $().jstree method
	 *
	 * `$(selector).jstree()` is used to create an instance on the selector or to invoke a command on a instance. `Uses $.jstree.create()` internally.
	 *
	 * __Examples__
	 *
	 *	$('#container').jstree();
	 *	$('#container').jstree({ option : value });
	 *	$('#container').jstree('open_node', '#branch_1');
	 *
	 */
	$.fn.jstree = function (arg) {
		// check for string argument
		var is_method = (typeof arg === 'string'),
			args = Array.prototype.slice.call(arguments, 1),
			result = null;
		this.each(function () {
			// get the instance (if there is one) and method (if it exists)
			var instance = $(this).data('jstree'),
				method = is_method && instance ? instance[arg] : null;
			// if calling a method, and method is available - execute on the instance
			result = is_method && method ?
				method.apply(instance, args) :
				null;
			// if there is no instance - create one
			if(!instance) {
				$(this).data('jstree', new $.jstree.create(this, arg));
			}
			// if there was a method call which returned a result - break and return the value
			if(result !== null && typeof result !== 'undefined') {
				return false;
			}
		});
		// if there was a method call with a valid return value - return that, otherwise continue the chain
		return result !== null && typeof result !== 'undefined' ?
			result : this;
	};
	/**
	 * ### jQuery :jstree pseudo selector
	 *
	 * `$(':jstree')` is used to find elements containing an instance
	 *
	 * __Examples__
	 *
	 *	$('div:jstree').each(function () {
	 *		$(this).jstree('destroy');
	 *	});
	 *
	 */
	$.expr[':'].jstree = $.expr.createPseudo(function(search) {
		return function(a) {
			return $(a).hasClass('jstree') &&
				typeof ($(a).data('jstree')) !== 'undefined';
		};
	});

	/**
	 * ### jsTree core settings
	 *
	 * `$.jstree.defaults.core` stores all defaults for the core.
	 *
	 * * `string` should be an object or a function:
	 *
	 *		// object
	 *		{
	 *			'Loading ...' : 'Зареждане ...'
	 *			...
	 *		}
	 *
	 *		// function
	 *		function (key) {
	 *			switch(key) {
	 *				case 'Loading ...':
	 *					return 'Зареждане ...';
	 *			...
	 *		}
	 *
	 *	This setting is handled in the `get_string()` function, if no match is found, the key itself is used.
	 *
	 * * `check_callback` should either be a boolean or a function:
	 */
	$.jstree.defaults.core = {
		strings			: false,
		check_callback	: true,
		animation		: 100,
		aria_roles		: false,
		multiple		: true,
		themes			: {
			name			: false,
			url				: true,
			dots			: true,
			icons			: true,
			dir				: false
		},
		base_height		: false,
		clean_loaded	: true,
		correct_loaded	: true,
		expand_selected_onload : true
	};

	/**
	 * ### jsTree core methods
	 */
	$.jstree.core.prototype = {
		/**
		 * `plugin()` is used to decorate an instance with a plugin. Used internally in `$.jstree.create()`.
		 *
		 * __Parameters__
		 *
		 * * `deco` - the plugin to activate on the instance
		 * * `options` - options for the plugin
		 *
		 * __Returns__
		 * the decorated jstree instance
		 *
		 * _Plugin authors are better off reading the options from `this.settings.{plugin_name}` in the `.bind()` or `init()` function of their plugins._
		 */
		plugin : function (deco, opts) {
			var Child = $.jstree.plugins[deco];
			if(Child) {
				this._data[deco] = {};
				Child.prototype = this;
				return new Child(opts, this);
			}
			return this;
		},
		/**
		 * `init()`
		 *
		 * __Parameters__
		 *
		 * * `par`
		 *
		 * __Returns__
		 *
		 */
		init : function (el, options) {
			this.element = $(el).addClass('jstree jstree-' + this._id);
			this.settings = options;
			this.element.bind("destroyed", $.proxy(this.teardown, this));

			this._data.core.ready = false;
			this._data.core.loaded = false;
			this._data.core.rtl = (this.element.css("direction") === "rtl");
			this.element[this._data.core.rtl ? 'addClass' : 'removeClass']("jstree-rtl");
			if(this.settings.core.aria_roles) {
				this.element.attr('role','tree');
			}
			this._data.core.selected = $();

			this.bind();
			this.trigger("init");

			this._data.core.original_container_html = this.element.find(" > ul > li").clone(true);
			this._data.core.original_container_html
				.find("li").addBack()
				.contents().filter(function() {
					return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue));
				})
				.remove();
			this.element.html("<"+"ul><"+"li class='jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'>" + this.get_string("Loading ...") + "</a></li></ul>");
			this._data.core.li_height = this.settings.base_height || this.get_container_ul().children("li:eq(0)").height() || 18;
			this.load_node(-1);
		},
		/**
		 * `destroy()`
		 */
		destroy : function () {
			this.element.unbind("destroyed", this.teardown);
			this.teardown();
		},
		/**
		 * `teardown()`
		 */
		teardown : function () {
			this.unbind();
			this.element
				.removeClass('jstree')
				.removeData('jstree')
				.find("[class^='jstree']")
					.addBack()
					.attr("class", function () { return this.className.replace(/jstree[^ ]*|$/ig,''); });
			this.element = null;
		},
		/**
		 * `bind()`
		 */
		bind : function () {
			if($.support.touch) {
				this.element.addTouch();
			}
			this.element
				.on("dblclick.jstree", function () {
						if(document.selection && document.selection.empty) {
							document.selection.empty();
						}
						else {
							if(window.getSelection) {
								var sel = window.getSelection();
								try {
									sel.removeAllRanges();
									sel.collapse();
								} catch (er) { }
							}
						}
					})
				.on("click.jstree", ".jstree-ocl", $.proxy(function (e) {
						this.toggle_node(e.target);
					}, this))
				.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
						e.preventDefault();
						this.activate_node(e.currentTarget, e);
					}, this))
				.on('keydown.jstree', '.jstree-anchor', $.proxy(function (e) {
						var o = null;
						switch(e.which) {
							case 13:
							case 32:
								e.type = "click";
								$(e.currentTarget).trigger(e);
								break;
							case 37:
								e.preventDefault();
								if(this.is_open(e.currentTarget)) {
									this.close_node(e.currentTarget);
								}
								else {
									o = this.get_prev(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 38:
								e.preventDefault();
								o = this.get_prev(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							case 39:
								e.preventDefault();
								if(this.is_closed(e.currentTarget)) {
									this.open_node(e.currentTarget);
								}
								else {
									o = this.get_next(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 40:
								e.preventDefault();
								o = this.get_next(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							default:
								//console.log(e.which);
								break;
						}
					}, this))
				.on("create_node.jstree", $.proxy(function (e, data) {
						this.clean_node(data.node);
					}, this))
				.on("load_node.jstree", $.proxy(function (e, data) {
						if(data.status) {
							if(this.settings.core.clean_loaded) {
								if(data.node === -1) {
									// only detach for root (checkbox three-state will not work otherwise)
									// also - if you could use async clean_node won't be such an issue
									var ul = this.get_container_ul().detach();
									if(ul.children('li').length) {
										this.clean_node(ul.children('li'));
									}
									this.element.prepend(ul);
								}
								else {
									var s = this._data.core.selected.length;
									if(data.node.children("ul").children("li").length) {
										this.clean_node(data.node.children("ul").children("li"));
									}
									if(this._data.core.ready && s !== this._data.core.selected.length) {
										this.trigger('changed', { 'action' : 'clean_node', 'selected' : this._data.core.selected });
									}
								}
							}
							if(data.node === -1 && !this._data.core.loaded) {
								this._data.core.loaded = true;
								this.trigger("loaded");
							}
							if(!this._data.core.ready && !this.get_container_ul().find('.jstree-loading:eq(0)').length) {
								this._data.core.ready = true;
								if(this._data.core.selected.length) {
									if(this.settings.core.expand_selected_onload) {
										this._data.core.selected.parents(".jstree-closed").each($.proxy(function (i, v) { this.open_node(v, false, 0); }, this));
									}
									this.trigger('changed', { 'action' : 'ready', 'selected' : this._data.core.selected });
								}
								this.trigger("ready");
							}
						}
					}, this))
				.on("loaded.jstree", $.proxy(function (e, data) {
						if(this.settings.core.correct_loaded) {
							data.instance.get_container_ul().children('li').each(function () {
								data.instance.correct_node(this);
							});
						}
					}, this))
				.on("open_node.jstree", $.proxy(function (e, data) {
						if(this.settings.core.correct_loaded) {
							data.node.children('li').each(function () {
								data.instance.correct_node(this);
							});
						}
					}, this))
				// THEME RELATED
				.on("init.jstree", $.proxy(function () {
						var s = this.settings.core.themes;
						this._data.core.themes.dots		= s.dots;
						this._data.core.themes.icons	= s.icons;

						if(s.name === false) {
							s.name = 'default';
						}
						this.set_theme(s.name, s.url);
					}, this))
				.on('loaded.jstree', $.proxy(function () {
						this[ this._data.core.themes.dots ? "show_dots" : "hide_dots" ]();
						this[ this._data.core.themes.icons ? "show_icons" : "hide_icons" ]();
					}, this))
				.on('focus.jstree', '.jstree-anchor', $.proxy(function (e) {
						$(e.currentTarget).mouseenter();
					}, this))
				.on('blur.jstree', '.jstree-anchor', $.proxy(function (e) {
						$(e.currentTarget).mouseleave();
					}, this))
				.on('mouseenter.jstree', '.jstree-anchor', $.proxy(function (e) {
						var o = this.element.find('.jstree-anchor:focus').not('.jstree-clicked');
						if(o && o.length && o[0] !== e.currentTarget) {
							o.blur();
						}
						this.hover_node(e.currentTarget);
					}, this))
				.on('mouseleave.jstree', '.jstree-anchor', $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		},
		/**
		 * `unbind()`
		 */
		unbind : function () {
			this.element.off('.jstree');
			$(document).off('.jstree-' + this._id);
		},
		/**
		 * `trigger()`
		 *
		 * __Parameters__
		 *
		 * * `ev`
		 * * `data`
		 */
		trigger : function (ev, data, wait) {
			if(!data) {
				data = {};
			}
			data.instance = this;
			if((typeof wait).toLowerCase() === 'number') {
				setTimeout($.proxy(function () {
					this.element.triggerHandler(ev.replace('.jstree','') + '.jstree', data);
				}, this), wait);
			}
			else {
				this.element.triggerHandler(ev.replace('.jstree','') + '.jstree', data);
			}
		},
		/**
		 * `get_container()`
		 *
		 * __Returns__
		 *
		 */
		get_container : function () {
			return this.element;
		},
		/**
		 * `get_container_ul()`
		 *
		 * __Returns__
		 *
		 */
		get_container_ul : function () {
			return this.element.children("ul:eq(0)");
		},
		/**
		 * `get_string()`
		 *
		 * __Parameters__
		 *
		 * * `key`
		 *
		 * __Returns__
		 *
		 */
		get_string : function (key) {
			var a = this.settings.core.strings;
			if($.isFunction(a)) { return a.call(this, key); }
			if(a && a[key]) { return a[key]; }
			return key;
		},

		_firstChild : function (dom) {
			dom = dom ? dom.firstChild : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		_nextSibling : function (dom) {
			dom = dom ? dom.nextSibling : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		_previousSibling : function (dom) {
			dom = dom ? dom.previousSibling : null;
			while(dom !== null && dom.nodeType !== 1) {
				dom = dom.previousSibling;
			}
			return dom;
		},
		/**
		 * `get_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		get_node : function (obj) {
			if(obj === -1) {
				return -1;
			}
			obj = $(obj, this.element);
			if(obj.hasClass(".jstree")) {
				return -1;
			}
			obj = obj.closest("li", this.element);
			return obj.length ? obj : false;
		},
		/**
		 * `get_next()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `strict`
		 *
		 * __Returns__
		 *
		 */
		get_next : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj);
			if(obj === -1) {
				tmp = this._firstChild(this.get_container_ul()[0]);
				return tmp ? $(tmp) : false;
			}
			if(!obj || !obj.length) {
				return false;
			}
			if(strict) {
				tmp = this._nextSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if(obj.hasClass("jstree-open")) {
				tmp = this._firstChild(obj.children('ul')[0]);
				return tmp ? $(tmp) : false;
			}
			else if((tmp = this._nextSibling(obj[0]))) {
				return $(tmp);
			}
			else {
				return obj.parentsUntil(".jstree","li").next("li").eq(0);
			}
		},
		/**
		 * `get_prev()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `strict`
		 *
		 * __Returns__
		 *
		 */
		get_prev : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj);
			if(obj === -1) {
				tmp = this.get_container_ul()[0].lastChild;
				return tmp ? $(tmp) : false;
			}
			if(!obj || !obj.length) {
				return false;
			}
			if(strict) {
				tmp = this._previousSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if((tmp = this._previousSibling(obj[0]))) {
				obj = $(tmp);
				while(obj.hasClass("jstree-open")) {
					obj = obj.children("ul:eq(0)").children("li:last");
				}
				return obj;
			}
			else {
				tmp = obj[0].parentNode.parentNode;
				return tmp && tmp.tagName === 'LI' ? $(tmp) : false;
			}
		},
		/**
		 * `get_parent()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		get_parent : function (obj) {
			obj = this.get_node(obj);
			if(obj === -1 || !obj || !obj.length) {
				return false;
			}
			var o = obj[0].parentNode.parentNode;

			return o.tagName === 'LI' ? $(o) : -1;
		},
		/**
		 * `get_children()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		get_children : function (obj) {
			obj = this.get_node(obj);
			if(obj === -1) {
				return this.get_container_ul().children("li");
			}
			if(!obj || !obj.length) {
				return false;
			}
			return obj.children("ul").children("li");
		},
		/**
		 * `is_parent()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_parent : function (obj) {
			obj = this.get_node(obj);
			return obj && obj !== -1 && ( this._firstChild(obj.children("ul")[0]) || obj.hasClass("jstree-closed") );
		},
		/**
		 * `is_loaded()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_loaded : function (obj) {
			obj = this.get_node(obj);
			return obj && ( (obj === -1 && !this.element.children("ul").children("li.jstree-loading").length) || ( obj !== -1 && !obj.hasClass('jstree-loading') && ( this._firstChild(obj.children("ul")[0]) || obj.hasClass('jstree-leaf')) ) );
		},
		/**
		 * `is_loading()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_loading : function (obj) {
			obj = this.get_node(obj);
			return obj && ( (obj === -1 && this.element.children("ul").children("li.jstree-loading").length) || (obj !== -1 && obj.hasClass("jstree-loading")) );
		},
		/**
		 * `is_open()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_open : function (obj) {
			obj = this.get_node(obj);
			return obj && obj !== -1 && obj.hasClass("jstree-open");
		},
		/**
		 * `is_closed()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_closed : function (obj) {
			obj = this.get_node(obj);
			return obj && obj !== -1 && obj.hasClass("jstree-closed");
		},
		/**
		 * `is_leaf()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_leaf : function (obj) {
			obj = this.get_node(obj);
			return obj && obj !== -1 && obj.hasClass("jstree-leaf");
		},
		/**
		 * `load_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `callback`
		 *
		 * __Returns__
		 *
		 */
		load_node : function (obj, callback) {
			obj = this.get_node(obj);
			if(!obj) {
				callback.call(this, obj, false);
				return false;
			}
			// if(this.is_loading(obj)) { return true; }
			if(obj !== -1) {
				obj.addClass("jstree-loading");
			}
			this._load_node(obj, $.proxy(function (status) {
				if(obj !== -1) {
					obj.removeClass("jstree-loading");
				}
				this.trigger('load_node', { "node" : obj, "status" : status });
				if(callback) {
					callback.call(this, obj, status);
				}
			}, this));
			return true;
		},
		/**
		 * `_load_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `callback`
		 *
		 * __Returns__
		 *
		 */
		_load_node : function (obj, callback) {
			if(obj === -1) {
				this.get_container_ul().empty().append(this._data.core.original_container_html.clone(true));
				callback.call(this, true);
			}
			else {
				callback.call(this, false);
			}
		},
		/**
		 * `open_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `callback`
		 * * `animation`
		 *
		 * __Returns__
		 *
		 */
		open_node : function (obj, callback, animation) {
			obj = this.get_node(obj);
			if(obj === -1 || !obj || !obj.length) {
				return false;
			}
			animation = (typeof animation).toLowerCase() === "undefined" ? this.settings.core.animation : animation;
			if(!this.is_closed(obj)) {
				if(callback) {
					callback.call(this, obj, false);
				}
				return false;
			}
			if(!this.is_loaded(obj)) { // TODO: is_loading?
				this.load_node(obj, function (o, ok) {
					return ok ? this.open_node(o, callback, animation) : (callback ? callback.call(this, o, false) : false);
				});
			}
			else {
				var t = this;
				if(!animation) {
					obj[0].className = obj[0].className.replace('jstree-closed', 'jstree-open');
				}
				else {
					obj
						.children("ul").css("display","none").end()
						.removeClass("jstree-closed").addClass("jstree-open")
						.children("ul").stop(true, true)
							.slideDown(animation, function () {
								this.style.display = "";
								t.trigger("after_open", { "node" : obj });
							});
				}
				if(callback) {
					callback.call(this, obj, true);
				}
				this.trigger('open_node', { "node" : obj });
				if(!animation) {
					this.trigger("after_open", { "node" : obj });
				}
			}
		},
		/**
		 * `close_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `animation`
		 *
		 * __Returns__
		 *
		 */
		close_node : function (obj, animation) {
			obj = this.get_node(obj);
			if(!obj || !obj.length || !this.is_open(obj)) {
				return false;
			}
			animation = (typeof animation).toLowerCase() === "undefined" ? this.settings.core.animation : animation;
			var t = this;
			if(!animation) {
				obj[0].className = obj[0].className.replace('jstree-open', 'jstree-closed');
			}
			else {
				obj
					.children("ul").attr("style","display:block !important").end()
					.removeClass("jstree-open").addClass("jstree-closed")
					.children("ul").stop(true, true).slideUp(animation, function () {
						this.style.display = "";
						t.trigger("after_close", { "node" : obj });
					});
			}
			this.trigger('close_node',{ "node" : obj });
			if(!animation) {
				this.trigger("after_close", { "node" : obj });
			}
		},
		/**
		 * `toggle_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		toggle_node : function (obj) {
			if(this.is_closed(obj)) {
				return this.open_node(obj);
			}
			if(this.is_open(obj)) {
				return this.close_node(obj);
			}
		},
		/**
		 * `open_all()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `animation`
		 * * `original_obj`
		 *
		 * __Returns__
		 *
		 */
		open_all : function (obj, animation, original_obj) {
			obj = obj ? this.get_node(obj) : -1;
			obj = !obj || obj === -1 ? this.get_container_ul() : obj;
			original_obj = original_obj || obj;
			var _this = this;
			obj = this.is_closed(obj) ? obj.find('li.jstree-closed').addBack() : obj.find('li.jstree-closed');
			obj.each(function () {
				_this.open_node(
					this,
					_this.is_loaded(this) ?
						false :
						function(obj) { this.open_all(obj, animation, original_obj); },
					animation || 0
				);
			});
			if(original_obj.find('li.jstree-closed').length === 0) {
				this.trigger('open_all', { "node" : original_obj });
			}
		},
		/**
		 * `close_all()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `animation`
		 *
		 * __Returns__
		 *
		 */
		close_all : function (obj, animation) {
			obj = obj ? this.get_node(obj) : -1;
			var $obj = !obj || obj === -1 ? this.get_container_ul() : obj,
				_this = this;
			$obj = this.is_open($obj) ? $obj.find('li.jstree-open').addBack() : $obj.find('li.jstree-open');
			$obj.each(function () { _this.close_node(this, animation || 0); });
			this.trigger('close_all', { "node" : obj });
		},
		/**
		 * `is_disabled()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_disabled : function (obj) {
			obj = this.get_node(obj);
			return obj && obj !== -1 && obj.children('.jstree-anchor').hasClass("jstree-disabled");
		},
		/**
		 * `enable_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		enable_node : function (obj) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			obj.children('.jstree-anchor').removeClass('jstree-disabled');
			this.trigger('enable_node', { 'node' : obj });
		},
		/**
		 * `disable_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		disable_node : function (obj) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			obj.children('.jstree-anchor').addClass('jstree-disabled');
			this.trigger('disable_node', { 'node' : obj });
		},
		/**
		 * `activate_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `e`
		 *
		 * __Returns__
		 *
		 */
		activate_node : function (obj, e) {
			if(this.is_disabled(obj)) {
				return false;
			}
			if(!this.settings.core.multiple || (!e.metaKey && !e.ctrlKey)) {
				this.deselect_all(true);
				this.select_node(obj);
			}
			else {
				if(!this.is_selected(obj)) {
					this.select_node(obj);
				}
				else {
					this.deselect_node(obj);
				}
			}
			this.trigger('activate_node', { 'node' : obj });
		},
		/**
		 * `hover_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		hover_node : function (obj) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			obj.children('.jstree-anchor').addClass('jstree-hovered');
			this.trigger('hover_node', { 'node' : obj });
		},
		/**
		 * `dehover_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		dehover_node : function (obj) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			obj.children('.jstree-anchor').removeClass('jstree-hovered');
			this.trigger('dehover_node', { 'node' : obj });
		},
		/**
		 * `select_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `supress_event`
		 *
		 * __Returns__
		 *
		 */
		select_node : function (obj, supress_event, prevent_open) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			this._data.core.selected = this._data.core.selected.add(obj);
			this.element.find('.jstree-clicked').removeClass('jstree-clicked');
			this._data.core.selected.children('.jstree-anchor').addClass('jstree-clicked');

			if(!prevent_open) {
				var t = this;
				obj.parents(".jstree-closed").each(function () { t.open_node(this, false, 0); });
			}

			this.trigger('select_node', { 'node' : obj, 'selected' : this._data.core.selected });

			if(!supress_event) {
				this.trigger('changed', { 'action' : 'select_node', 'node' : obj, 'selected' : this._data.core.selected });
			}
		},
		/**
		 * `deselect_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `supress_event`
		 *
		 * __Returns__
		 *
		 */
		deselect_node : function (obj, supress_event) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			this._data.core.selected = this._data.core.selected.not(obj);

			this.element.find('.jstree-clicked').removeClass('jstree-clicked');
			this._data.core.selected.children('.jstree-anchor').addClass('jstree-clicked');

			this.trigger('deselect_node', { 'node' : obj, 'selected' : this._data.core.selected });

			if(!supress_event) {
				this.trigger('changed', { 'action' : 'deselect_node', 'node' : obj, 'selected' : this._data.core.selected });
			}
		},
		/**
		 * `deselect_all()`
		 *
		 * __Parameters__
		 *
		 * * `supress_event`
		 *
		 */
		deselect_all : function (supress_event) {
			this._data.core.selected = $();

			var obj = this.element.find('.jstree-clicked').removeClass('jstree-clicked');

			this.trigger('deselect_all', { 'selected' : this._data.core.selected, 'node' : obj });
			if(!supress_event) {
				this.trigger('changed', { 'action' : 'deselect_all', 'selected' : this._data.core.selected, 'node' : obj });
			}
		},
		/**
		 * `is_selected()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		is_selected : function (obj) {
			obj = this.get_node(obj);
			if(!obj || !obj.length) {
				return false;
			}
			return this._data.core.selected.index(obj) >= 0;
		},
		/**
		 * `get_selected()`
		 *
		 * __Returns__
		 *
		 */
		get_selected : function () {
			return this._data.core.selected;
		},
		/**
		 * `clean_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 */
		clean_node : function (obj) {
			// DETACH maybe inside the "load_node" function? But what about animations, etc?
			obj = this.get_node(obj);
			obj = !obj || obj === -1 ? this.element.find("li") : obj.find("li").addBack();
			// test placing this here
			obj.find('li.jstree-clicked').removeClass('jstree-clicked');
			if(this.settings.core.aria_roles) {
				obj.attr('role','treeitem').parent().attr('role','group');
			}
			var _this = this;
			return obj.each(function () {
				var t = $(this),
					a = t.children('a'),
					d = t.data("jstree"),
					// is_ajax -> return this.settings.core.is_ajax || this._data.ajax;
					s = (d && d.opened) || t.hasClass("jstree-open") ? "open" : (d && (d.closed || d.children)) || t.children("ul").length ? "closed" : "leaf"; // replace with t.children("ul").children("li").length || (this.is_ajax() && !t.children('ul').length)
				if(d && d.opened) { delete d.opened; }
				if(d && d.closed) { delete d.closed; }
				t.removeClass("jstree-open jstree-closed jstree-leaf jstree-last");
				if(!a.length) {
					// allow for text and HTML markup inside the nodes
					t.contents().filter(function() { return this.nodeType === 3 || this.tagName !== 'UL'; }).wrapAll('<a href="#"></a>');
					// TODO: make this faster
					a = t.children('a');
					a.html(t.children('a').html().replace(/[\s\t\n]+$/,''));
				}
				else {
					if(!$.trim(a.attr('href'))) { a.attr("href","#"); }
				}
				a.addClass('jstree-anchor');
				if(!t.children("i.jstree-ocl").length) {
					t.prepend("<i class='jstree-icon jstree-ocl'>&#160;</i>");
				}
				if(!t.next().length) {
					t.addClass("jstree-last");
				}
				switch(s) {
					case 'leaf':
						t.addClass('jstree-leaf');
						break;
					case 'closed':
						t.addClass('jstree-closed');
						_this.close_node(t, 0);
						break;
					case 'open':
						t.addClass('jstree-closed');
						_this.open_node(t, false, 0);
						break;
				}
				// theme part
				if(!a.children("i.jstree-themeicon").length) {
					a.prepend("<i class='jstree-icon jstree-themeicon'>&#160;</i>");
				}
				if(d && typeof d.icon !== 'undefined') {
					_this.set_icon(t, d.icon);
					delete d.icon;
				}
				if(d && d.selected) {
					_this.select_node(t, true, true);
					delete d.selected;
				}
				if(d && d.disabled) {
					_this.disable_node(t);
					delete d.disabled;
				}
			});
		},
		/**
		 * `correct_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `deep`
		 *
		 * __Returns__
		 *
		 */
		correct_node : function (obj, deep) {
			obj = this.get_node(obj);
			if(!obj || (obj === -1 && !deep)) { return false; }
			if(obj === -1) { obj = this.element.find('li'); }
			else { obj = deep ? obj.find('li').addBack() : obj; }
			obj.each(function () {
				var obj = $(this);
				switch(!0) {
					case obj.hasClass("jstree-open") && !obj.children("ul").children("li").length:
						obj.removeClass("jstree-open").addClass("jstree-leaf").children("ul").remove(); // children("ins").html("&#160;").end()
						break;
					case obj.hasClass("jstree-leaf") && !!obj.children("ul").children("li").length:
						obj.removeClass("jstree-leaf").addClass("jstree-closed"); //.children("ins").html("+");
						break;
				}
				obj[obj.next().length === 0 ? 'addClass' : 'removeClass']("jstree-last");
			});
			return obj;
		},
		/**
		 * `get_state()`
		 *
		 * __Returns__
		 *
		 */
		get_state : function () {
			var state	= {
				'core' : {
					'open' : [],
					'scroll' : {
						'left' : this.element.scrollLeft(),
						'top' : this.element.scrollTop()
					},
					'themes' : {
						'name' : this.get_theme(),
						'icons' : this._data.core.themes.icons,
						'dots' : this._data.core.themes.dots
					},
					'selected' : []
				}
			};
			this.get_container_ul().find('.jstree-open').each(function () { if(this.id) { state.core.open.push(this.id); } });
			this._data.core.selected.each(function () { if(this.id) { state.core.selected.push(this.id); } });
			return state;
		},
		/**
		 * `set_state()`
		 *
		 * __Parameters__
		 *
		 * * `state`
		 * * `callback`
		 *
		 * __Returns__
		 *
		 */
		set_state : function (state, callback) {
			if(state) {
				if(state.core) {
					if($.isArray(state.core.open)) {
						var res = true,
							t = this;
						//this.close_all();
						$.each(state.core.open.concat([]), function (i, v) {
							v = document.getElementById(v);
							if(v) {
								if(t.is_loaded(v)) {
									if(t.is_closed(v)) {
										t.open_node(v, false, 0);
									}
									$.vakata.array_remove(state.core.open, i);
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
							delete state.core.open;
							this.set_state(state, callback);
						}
						return false;
					}
					if(state.core.scroll) {
						if(state.core.scroll && typeof state.core.scroll.left !== 'undefined') {
							this.element.scrollLeft(state.core.scroll.left);
						}
						if(state.core.scroll && typeof state.core.scroll.top !== 'undefined') {
							this.element.scrollTop(state.core.scroll.top);
						}
						delete state.core.scroll;
						delete state.core.open;
						this.set_state(state, callback);
						return false;
					}
					if(state.core.themes) {
						if(state.core.themes.name) {
							this.set_theme(state.core.themes.name);
						}
						if(typeof state.core.themes.dots !== 'undefined') {
							this[ state.core.themes.dots ? "show_dots" : "hide_dots" ]();
						}
						if(typeof state.core.themes.icons !== 'undefined') {
							this[ state.core.themes.icons ? "show_icons" : "hide_icons" ]();
						}
						delete state.core.themes;
						delete state.core.open;
						this.set_state(state, callback);
						return false;
					}
					if(state.core.selected) {
						var _this = this;
						this.deselect_all();
						$.each(state.core.selected, function (i, v) {
							_this.select_node(document.getElementById(v));
						});
						delete state.core.selected;
						this.set_state(state, callback);
						return false;
					}
					if($.isEmptyObject(state)) {
						if(callback) { callback.call(this); }
						this.trigger('set_state');
						return false;
					}
					return true;
				}
				return true;
			}
			return false;
		},
		/**
		 * `refresh()`
		 */
		refresh : function () {
			this._data.core.state = this.get_state();
			this.load_node(-1, function (o, s) {
				if(s) {
					this.set_state($.extend(true, {}, this._data.core.state), function () {
						this.trigger('refresh');
					});
				}
				this._data.core.state = null;
			});
		},
		/**
		 * `get_text()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `remove_html`
		 *
		 * __Returns__
		 *
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
		/**
		 * `set_text()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `val`
		 *
		 * __Returns__
		 *
		 */
		set_text : function (obj, val) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return false; }
			obj = obj.children("a:eq(0)");
			var tmp = obj.children("I").clone();
			obj.html(val).prepend(tmp);
			this.trigger('set_text',{ "obj" : obj, "text" : val });
			return true;
		},
		/**
		 * `parse_json()`
		 *
		 * __Parameters__
		 *
		 * * `node`
		 *
		 * __Returns__
		 *
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
			if(!node.title) { node.title = this.get_string("New node"); }

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
		/**
		 * `get_json()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `is_callback`
		 *
		 * __Returns__
		 *
		 */
		get_json : function (obj, is_callback) {
			obj = typeof obj !== 'undefined' ? this.get_node(obj) : false;
			if(!is_callback) {
				if(!obj || obj === -1) { obj = this.get_container_ul().children("li"); }
			}
			var r, t, li_attr = {}, a_attr = {}, tmp = {}, i;
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
			tmp = $.vakata.attributes(obj.children('.jstree-anchor'), true);
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
			i = this.get_icon(obj);
			if(typeof i !== 'undefined' && i !== null) { r.data.jstree.icon = i; }
			if(this.is_selected(obj)) { r.data.jstree.selected = true; }

			obj = obj.children("ul").children("li");
			if(obj.length) {
				r.children = [];
				t = this;
				obj.each(function () {
					r.children.push(t.get_json($(this), true));
				});
			}
			return r;
		},
		/**
		 * `create_node()`
		 *
		 * __Parameters__
		 *
		 * * `par`
		 * * `node`
		 * * `pos`
		 * * `callback`
		 * * `is_loaded`
		 *
		 * __Returns__
		 *
		 */
		create_node : function (par, node, pos, callback, is_loaded) {
			par = this.get_node(par);
			pos = typeof pos === "undefined" ? "last" : pos;

			if(par !== -1 && !par.length) { return false; }
			if(!pos.match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.create_node(par, node, pos, callback, true); });
			}

			var li = this.parse_json(node),
				tmp = par === -1 ? this.element : par;

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

			tmp = par === -1 ? this.element : par;
			if(!tmp.children("ul").length) { tmp.append("<ul />"); }
			if(tmp.children("ul").children("li").eq(pos).length) {
				tmp.children("ul").children("li").eq(pos).before(li);
			}
			else {
				tmp.children("ul").append(li);
			}
			this.correct_node(par, true);
			if(callback) { callback.call(this, li); }
			this.trigger('create_node', { "node" : li, "parent" : par, "position" : li.index() });
			return li;
		},
		/**
		 * `rename_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `val`
		 *
		 * __Returns__
		 *
		 */
		rename_node : function (obj, val) {
			obj = this.get_node(obj);
			var old = this.get_text(obj);
			if(!this.check("rename_node", obj, this.get_parent(obj), val)) { return false; }
			if(obj && obj.length) {
				this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
				this.trigger('rename_node', { "node" : obj, "title" : val, "old" : old });
			}
		},
		/**
		 * `delete_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
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
			this.trigger('delete_node', { "node" : obj, "prev" : pre, "parent" : par });

			var n = obj.find(".jstree-clicked"),
				t = this;
			if(n.length) {
				n.each(function () { t.deselect_node(this, true); });
				this.trigger('changed', { 'action' : 'delete_node', 'node' : obj, 'selected' : this._data.core.selected, 'parent' : par });
			}
			return obj;
		},
		/**
		 * `check()`
		 *
		 * __Parameters__
		 *
		 * * `chk`
		 * * `obj`
		 * * `par`
		 * * `pos`
		 *
		 * __Returns__
		 *
		 */
		check : function (chk, obj, par, pos) {
			var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
				chc = this.settings.core.check_callback;
			if(chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos) === false)) {
				return false;
			}
			tmp = tmp === -1 ? this.element.data('jstree') : tmp.data('jstree');
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
					tmp = par === -1 ? this.element : par;
					tmp = tmp.children('ul').children('li');
					if(tmp.length && tmp.index(obj) !== -1 && (pos === obj.index() || pos === obj.index() + 1)) {
						return false;
					}
					if(par !== -1 && par.parentsUntil('.jstree', 'li').addBack().index(obj) !== -1) {
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
		/**
		 * `move_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `par`
		 * * `pos`
		 * * `callback`
		 * * `is_loaded`
		 *
		 * __Returns__
		 *
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
				old_ins = $.jstree.reference(obj),
				new_ins = par === -1 ? this : $.jstree.reference(par),
				is_multi = (old_ins._id !== new_ins._id);
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
			this.trigger('move_node', { "node" : obj, "parent" : new_par, "position" : obj.index(), "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : new_ins });
			return true;
		},
		/**
		 * `copy_node()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `par`
		 * * `pos`
		 * * `callback`
		 * * `is_loaded`
		 *
		 * __Returns__
		 *
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
				old_ins = $.jstree.reference(obj),
				new_ins = par === -1 ? this : $.jstree.reference(par),
				is_multi = (old_ins._id !== new_ins._id);

			obj = obj.clone(true);
			obj.find("*[id]").addBack().each(function () {
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
			this.trigger('copy_node', { "node" : obj, "parent" : new_par, "old_parent" : old_par, "position" : obj.index(), "original" : org_obj, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : new_ins });
			return true;
		},
		/**
		 * `cut()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		cut : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return false; }
			ccp_node = obj;
			ccp_mode = 'move_node';
			this.trigger('cut', { "node" : obj });
		},
		/**
		 * `copy()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		copy : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return false; }
			ccp_node = obj;
			ccp_mode = 'copy_node';
			this.trigger('copy', { "node" : obj });
		},
		/**
		 * `get_buffer()`
		 *
		 * __Returns__
		 *
		 */
		get_buffer : function () {
			return { 'mode' : ccp_mode, 'node' : ccp_node };
		},
		/**
		 * `can_paste()`
		 *
		 * __Returns__
		 *
		 */
		can_paste : function () {
			return ccp_mode !== false && ccp_node !== false;
		},
		/**
		 * `paste()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		paste : function (obj) {
			obj = this.get_node(obj);
			if(!obj || !ccp_mode || !ccp_mode.match(/^(copy_node|move_node)$/) || !ccp_node) { return false; }
			this[ccp_mode](ccp_node, obj);
			this.trigger('paste', { "obj" : obj, "nodes" : ccp_node, "mode" : ccp_mode });
			ccp_node = false;
			ccp_mode = false;
		},
		/**
		 * `edit()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `default_text`
		 *
		 * __Returns__
		 *
		 */
		edit : function (obj, default_text) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return false; }
			obj.parentsUntil(".jstree",".jstree-closed").each($.proxy(function (i, v) {
				this.open_node(v, false, 0);
			}, this));
			var rtl = this._data.core.rtl,
				w  = this.element.width(),
				a  = obj.children('a:eq(0)'),
				oi = obj.children("i"),
				ai = a.children("i"),
				w1 = oi.width() * oi.length,
				w2 = ai.width() * ai.length,
				t  = typeof default_text === 'string' ? default_text : this.get_text(obj),
				h1 = $("<"+"div />", { css : { "position" : "absolute", "top" : "-200px", "left" : (rtl ? "0px" : "-1000px"), "visibility" : "hidden" } }).appendTo("body"),
				h2 = obj.css("position","relative").append(
					$("<"+"input />", {
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
							"height" : (this._data.core.li_height - 2) + "px",
							"lineHeight" : (this._data.core.li_height - 2) + "px",
							"width" : "150px" // will be set a bit further down
						},
						"blur" : $.proxy(function () {
							var i = obj.children(".jstree-rename-input"),
								v = i.val();
							if(v === "") { v = t; }
							h1.remove();
							i.remove();
							if(this.rename_node(obj, v) === false) {
								this.rename_node(obj, t);
							}
							obj.css("position", "");
						}, this),
						"keydown" : function (event) {
							var key = event.keyCode || event.which;
							if(key === 27) {
								this.value = t;
							}
							if(key === 27 || key === 13 || key === 37 || key === 38 || key === 39 || key === 40) {
								event.stopImmediatePropagation();
							}
							if(key === 27 || key === 13) {
								event.preventDefault();
								this.blur();
							}
						},
						"keyup" : function (event) {
							var key = event.keyCode || event.which;
							h2.width(Math.min(h1.text("pW" + this.value).width(),w));
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
		},
		/**
		 * `set_theme()`
		 *
		 * __Parameters__
		 *
		 * * `theme_name`
		 * * `theme_url`
		 *
		 * __Returns__
		 *
		 */
		set_theme : function (theme_name, theme_url) {
			if(!theme_name) { return false; }
			if(theme_url === true) {
				var dir = this.settings.core.themes.dir;
				if(!dir) { dir = $.jstree.path + '/themes'; }
				theme_url = dir + '/' + theme_name + '/style.css';
			}
			if(theme_url && $.inArray(theme_url, themes_loaded) === -1) {
				$('head').append('<'+'link rel="stylesheet" href="' + theme_url + '" type="text/css" />');
				themes_loaded.push(theme_url);
			}
			if(this._data.core.themes.name) {
				this.element.removeClass('jstree-' + this._data.core.themes.name);
			}
			this._data.core.themes.name = theme_name;
			this.element.addClass('jstree-' + theme_name);
			this.trigger('set_theme', { 'theme' : theme_name });
		},
		/**
		 * `get_theme()`
		 *
		 * __Returns__
		 *
		 */
		get_theme : function () { return this._data.core.themes.name; },
		/**
		 * `show_dots()`
		 */
		show_dots : function () { this._data.core.themes.dots = true; this.element.children("ul").removeClass("jstree-no-dots"); },
		/**
		 * `hide_dots()`
		 */
		hide_dots : function () { this._data.core.themes.dots = false; this.element.children("ul").addClass("jstree-no-dots"); },
		/**
		 * `toggle_dots()`
		 */
		toggle_dots : function () { if(this._data.core.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },
		/**
		 * `show_icons()`
		 */
		show_icons : function () { this._data.core.themes.icons = true; this.element.children("ul").removeClass("jstree-no-icons"); },
		/**
		 * `hide_icons()`
		 */
		hide_icons : function () { this._data.core.themes.icons = false; this.element.children("ul").addClass("jstree-no-icons"); },
		/**
		 * `toggle_icons()`
		 */
		toggle_icons : function () { if(this._data.core.themes.icons) { this.hide_icons(); } else { this.show_icons(); } },
		/**
		 * `set_icon()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `icon`
		 *
		 * __Returns__
		 *
		 */
		set_icon : function (obj, icon) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return false; }
			obj = obj.children("a").children(".jstree-themeicon");
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
		/**
		 * `get_icon()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		get_icon : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return null; }
			obj = obj.children("a").children(".jstree-themeicon");
			if(obj.hasClass('jstree-themeicon-hidden')) { return false; }
			obj = obj.attr("rel");
			return (obj && obj.length) ? obj : null;
		},
		/**
		 * `hide_icon()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		hide_icon : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return false; }
			obj.children("a").children(".jstree-themeicon").addClass('jstree-themeicon-hidden');
			return true;
		},
		/**
		 * `show_icon()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		show_icon : function (obj) {
			obj = this.get_node(obj);
			if(!obj || obj === -1 || !obj.length) { return false; }
			obj.children("a").children(".jstree-themeicon").removeClass('jstree-themeicon-hidden');
			return true;
		}
	};

	var src = $('script:last').attr('src');
	$.jstree.path = src ? src.replace(/\/[^\/]+$/,'') : '';
	$.jstree.no_css = src && src.indexOf('?no_css') !== -1;

	if($.jstree.no_css) {
		$.jstree.defaults.core.themes.url = false;
	}

	// base CSS
	$(function() {
		var css_string = '' +
				//'.jstree * { -webkit-box-sizing:content-box; -moz-box-sizing:content-box; box-sizing:content-box; }' +
				'.jstree ul, .jstree li { display:block; margin:0 0 0 0; padding:0 0 0 0; list-style-type:none; list-style-image:none; } ' +
				'.jstree li { display:block; min-height:18px; line-height:18px; white-space:nowrap; margin-left:18px; min-width:18px; } ' +
				'.jstree-rtl li { margin-left:0; margin-right:18px; } ' +
				'.jstree > ul > li { margin-left:0px; } ' +
				'.jstree-rtl > ul > li { margin-right:0px; } ' +
				'.jstree .jstree-icon { display:inline-block; text-decoration:none; margin:0; padding:0; vertical-align:top; } ' +
				'.jstree .jstree-ocl { width:18px; height:18px; text-align:center; line-height:18px; cursor:pointer; vertical-align:top; } ' +
				'.jstree li.jstree-open > ul { display:block; } ' +
				'.jstree li.jstree-closed > ul { display:none; } ' +
				'.jstree-anchor { display:inline-block; line-height:16px; height:16px; color:black; white-space:nowrap; padding:1px 4px 1px 2px; margin:0; text-decoration:none; outline:0; } ' +
				'.jstree-anchor > .jstree-themeicon { height:16px; width:16px; margin-right:3px; } ' +
				'.jstree-rtl .jstree-anchor { padding:1px 2px 1px 4px; } ' +
				'.jstree-rtl .jstree-anchor > .jstree-themeicon { margin-left:3px; margin-right:0; } ' +
				'.jstree-no-icons .jstree-themeicon, .jstree-anchor > .jstree-themeicon-hidden { display:none; } ';
		if(!$.jstree.no_css) {
			$('head').append('<'+'style type="text/css">' + css_string + '<'+'/style>');
		}
	});

	// helpers
	$.vakata = {};
	// collect attributes
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
	// remove item from array
	$.vakata.array_remove = function(array, from, to) {
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		array.push.apply(array, rest);
		return array;
	};
	// private function for json quoting strings
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
	$.vakata.json = {
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
		decode : function (json) {
			return $.parseJSON(json);
		}
	};

})(jQuery);


/*!
 * jstree sample plugin

// wrap in IIFE and pass jQuery as $
(function ($) {
	// some private plugin stuff if needed
	var private_var = null;

	// extending the defaults
	$.jstree.defaults.sample = {
		sample_option : 'sample_val'
	};

	// the actual plugin code
	$.jstree.plugins.sample = function (options, parent) {
		// own function
		this.sample_function = function (arg) {
			// you can chain this method if needed and available
			if(parent.sample_function) { parent.sample_function.call(this, arg); }
		};

		// *SPECIAL* FUNCTIONS
		this.init = function () {
			// do not forget parent
			parent.init.call(this);
		};
		// bind events if needed
		this.bind = function () {
			// call parent function first
			parent.bind.call(this);
			// do(stuff);
		};
		// unbind events if needed (all in jquery namespace are taken care of by the core)
		this.unbind = function () {
			// do(stuff);
			// call parent function last
			parent.unbind.call(this);
		};
		this.teardown = function () {
			// do not forget parent
			parent.teardown.call(this);
		};
		// very heavy - use only if needed and be careful
		this.clean_node = function(obj) {
			// always get the cleaned node from the parent
			obj = parent.clean_node.call(this, obj);
			return obj.each(function () {
				// process nodes
			});
		};
		// state management - get and restore
		this.get_state = function () {
			// always get state from parent first
			var state = parent.get_state.call(this);
			// add own stuff to state
			state.sample = { 'var' : 'val' };
			return state;
		};
		this.set_state = function (state, callback) {
			// only process your part if parent returns true
			// there will be multiple times with false
			if(parent.set_state.call(state, callback)) {
				// check the key you set above
				if(state.sample) {
					// do(stuff); // like calling this.sample_function(state.sample.var);
					// remove your part of the state and RETURN FALSE, the next cycle will be TRUE
					delete state.sample;
					return false;
				}
				// return true if your state is gone (cleared in the previous step)
				return true;
			}
			// parent was false - return false too
			return false;
		};
		// node transportation
		this.get_json = function (obj, is_callback) {
			// get the node from the parent
			var r = parent.get_json.call(this, obj, is_callback);
			// only modify the node if is_callback is true
			if(is_callback) {
				r.data.sample = 'value';
			}
			// return the original / modified node
			return r;
		};
	};

	// attach to document ready if needed
	$(function () {
		// do(stuff);
	});

	// you can include the sample plugin in all instances by default
	$.jstree.defaults.plugins.push("sample");
})(jQuery);
//*/
