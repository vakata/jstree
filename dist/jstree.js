/**
 * ## jsTree 3.0.0-alpha ##
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
		total_nodes = 0,
		ccp_node = false,
		ccp_mode = false,
		ccp_inst = false,
		themes_loaded = [],
		_d = document, _node = _d.createElement('LI'), _temp1, _temp2;

	_node.setAttribute('role', 'treeitem');
	_temp1 = _d.createElement('I');
	_temp1.className = 'jstree-icon jstree-ocl';
	_node.appendChild(_temp1);
	_temp1 = _d.createElement('A');
	_temp1.className = 'jstree-anchor';
	_temp1.setAttribute('href','#');
	_temp2 = _d.createElement('I');
	_temp2.className = 'jstree-icon jstree-themeicon';
	_temp1.appendChild(_temp2);
	_node.appendChild(_temp1);
	_temp1 = _temp2 = null;


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
		version : '3.0.0-alpha',
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
	 * 
	 * @param {String} asdf malko prase
	 * @triggers {String} select_node.jstree malko prase
	 *
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
			core : {
				themes : {
					name : false,
					dots : false,
					icons : false
				},
				selected : []
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
		if(needle && !$(needle).length) {
			if(needle.id) {
				needle = needle.id;
			}
			var tmp = null;
			$('.jstree').each(function () {
				var inst = $(this).data('jstree');
				if(inst && inst._model.data[needle]) {
					tmp = inst;
					return false;
				}
			});
			return tmp;
		}
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
		var is_method	= (typeof arg === 'string'),
			args		= Array.prototype.slice.call(arguments, 1),
			result		= null;
		this.each(function () {
			// get the instance (if there is one) and method (if it exists)
			var instance = $.jstree.reference(this),
				method = is_method && instance ? instance[arg] : null;
			// if calling a method, and method is available - execute on the instance
			result = is_method && method ?
				method.apply(instance, args) :
				null;
			// if there is no instance and no method is being called - create one
			if(!instance && !is_method) {
				$(this).data('jstree', new $.jstree.create(this, arg));
			}
			// if there is an instance and the first argument is boolean true - return the instance
			if(instance && arg === true) {
				result = instance;
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
		data			: false,
		strings			: false,
		check_callback	: false,
		animation		: 200,
		multiple		: true,
		themes			: {
			name			: false,
			url				: false,
			dir				: false,
			dots			: true,
			icons			: true,
			stripes			: true
		},
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
			this._model = {
				data : {
					'#' : {
						id : '#',
						parent : null,
						parents : [],
						children : [],
						children_d : [],
						state : { loaded : false }
					}
				},
				changed : [],
				force_full_redraw : false,
				redraw_timeout : false,
				default_state : {
					loaded : true,
					opened : false,
					selected : false,
					disabled : false
				}
			};

			this.element = $(el).addClass('jstree jstree-' + this._id);
			this.settings = options;
			this.element.bind("destroyed", $.proxy(this.teardown, this));

			this._data.core.ready = false;
			this._data.core.loaded = false;
			this._data.core.rtl = (this.element.css("direction") === "rtl");
			this.element[this._data.core.rtl ? 'addClass' : 'removeClass']("jstree-rtl");
			this.element.attr('role','tree');

			this.bind();
			this.trigger("init");

			this._data.core.original_container_html = this.element.find(" > ul > li").clone(true);
			this._data.core.original_container_html
				.find("li").addBack()
				.contents().filter(function() {
					return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue));
				})
				.remove();
			this.element.html("<"+"ul class='jstree-container-ul'><"+"li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><"+"a class='jstree-anchor' href='#'><i class='jstree-icon jstree-loading-icon'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
			this._data.core.li_height = this.get_container_ul().children("li:eq(0)").height() || 18;
			this.trigger("loading");
			this.load_node('#');
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
						$(e.currentTarget).focus();
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
									o = this.get_prev_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 38:
								e.preventDefault();
								o = this.get_prev_dom(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							case 39:
								e.preventDefault();
								if(this.is_closed(e.currentTarget)) {
									this.open_node(e.currentTarget, function (o) { this.get_node(o, true).children('.jstree-anchor').focus(); });
								}
								else {
									o = this.get_next_dom(e.currentTarget);
									if(o && o.length) { o.children('.jstree-anchor').focus(); }
								}
								break;
							case 40:
								e.preventDefault();
								o = this.get_next_dom(e.currentTarget);
								if(o && o.length) { o.children('.jstree-anchor').focus(); }
								break;
							// delete
							case 46:
								e.preventDefault();
								o = this.get_node(e.currentTarget);
								if(o && o.id && o.id !== '#') {
									o = this.is_selected(o) ? this.get_selected() : o;
									// this.delete_node(o);
								}
								break;
							// f2
							case 113:
								e.preventDefault();
								o = this.get_node(e.currentTarget);
								if(o && o.id && o.id !== '#') {
									// this.edit(o);
								}
								break;
							default:
								// console.log(e.which);
								break;
						}
					}, this))
				.on("load_node.jstree", $.proxy(function (e, data) {
						if(data.status) {
							if(data.node.id === '#' && !this._data.core.loaded) {
								this._data.core.loaded = true;
								this.trigger("loaded");
							}
							if(!this._data.core.ready && !this.get_container_ul().find('.jstree-loading:eq(0)').length) {
								this._data.core.ready = true;
								if(this._data.core.selected.length) {
									if(this.settings.core.expand_selected_onload) {
										var tmp = [];
										for(var i = 0, j = this._data.core.selected.length; i < j; i++) {
											tmp = tmp.concat(this._model.data[this._data.core.selected[i]].parents);
										}
										tmp = $.vakata.array_unique(tmp);
										for(i = 0, j = tmp.length; i < j; i++) {
											this.open_node(tmp[i], false, 0);
										}
									}
									this.trigger('changed', { 'action' : 'ready', 'selected' : this._data.core.selected });
								}
								this.trigger("ready");
							}
						}
					}, this))
				// THEME RELATED
				.on("init.jstree", $.proxy(function () {
						var s = this.settings.core.themes;
						this._data.core.themes.dots			= s.dots;
						this._data.core.themes.stripes		= s.stripes;
						this._data.core.themes.icons		= s.icons;
						this.set_theme(s.name || "default", s.url);
					}, this))
				.on("loading.jstree", $.proxy(function () {
						this[ this._data.core.themes.dots ? "show_dots" : "hide_dots" ]();
						this[ this._data.core.themes.icons ? "show_icons" : "hide_icons" ]();
						this[ this._data.core.themes.stripes ? "show_stripes" : "hide_stripes" ]();
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
		trigger : function (ev, data) {
			if(!data) {
				data = {};
			}
			data.instance = this;
			this.element.triggerHandler(ev.replace('.jstree','') + '.jstree', data);
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
		get_node : function (obj, as_dom) {
			if(obj && obj.id) {
				obj = obj.id;
			}
			var dom;
			if(this._model.data[obj]) {
				obj = this._model.data[obj];
			}
			else if(((dom = $(obj, this.element)).length || (dom = $('#' + obj, this.element)).length) && this._model.data[dom.closest('li').attr('id')]) {
				obj = this._model.data[dom.closest('li').attr('id')];
			}
			else if((dom = $(obj, this.element)).length && dom.hasClass('jstree')) {
				obj = this._model.data['#'];
			}
			else {
				return false;
			}

			if(as_dom) {
				obj = obj.id === '#' ? this.element : $(document.getElementById(obj.id));
			}
			return obj;
		},
		/**
		 * `get_next_dom()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `strict`
		 *
		 * __Returns__
		 *
		 */
		get_next_dom : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
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
		 * `get_prev_dom()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 * * `strict`
		 *
		 * __Returns__
		 *
		 */
		get_prev_dom : function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
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
			if(!obj || obj.id === '#') {
				return false;
			}
			return obj.parent;
		},
		/**
		 * `get_children_dom()`
		 *
		 * __Parameters__
		 *
		 * * `obj`
		 *
		 * __Returns__
		 *
		 */
		get_children_dom : function (obj) {
			obj = this.get_node(obj, true);
			if(obj[0] === this.element[0]) {
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
			return obj && (obj.state.loaded === false || obj.children.length);
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
			return obj && obj.state.loaded;
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
			obj = this.get_node(obj, true);
			return obj && obj.hasClass("jstree-loading");
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
			return obj && obj.state.opened;
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
			return obj && this.is_parent(obj) && !obj.state.opened;
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
			return !this.is_parent(obj);
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.load_node(obj[t1], callback);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj) {
				callback.call(this, obj, false);
				return false;
			}
			this.get_node(obj, true).addClass("jstree-loading");
			this._load_node(obj, $.proxy(function (status) {
				obj.state.loaded = status;
				this.get_node(obj, true).removeClass("jstree-loading");
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
			var s = this.settings.core.data;
			// use original HTML
			if(!s) {
				return callback.call(this, obj.id === '#' ? this._append_html_data(obj, this._data.core.original_container_html.clone(true)) : false);
			}
			if($.isFunction(s)) {
				return s.call(this, obj, $.proxy(function (d) {
					return callback.call(this, this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $(d) : d));
				}, this));
			}
			if(typeof s === 'object') {
				if(s.url) {
					s = $.extend(true, {}, s);
					if($.isFunction(s.url)) {
						s.url = s.url.call(this, obj);
					}
					if($.isFunction(s.data)) {
						s.data = s.data.call(this, obj);
					}
					return $.ajax(s)
						.done($.proxy(function (d,t,x) {
								var type = x.getResponseHeader('Content-Type');
								if(type.indexOf('json') !== -1) {
									return callback.call(this, this._append_json_data(obj, d));
								}
								if(type.indexOf('html') !== -1) {
									return callback.call(this, this._append_html_data(obj, $(d)));
								}
							}, this))
						.fail($.proxy(function () {
								callback.call(this, false);
							}, this));
				}
				return callback.call(this, this._append_json_data(obj, s));
			}
			if(typeof s === 'string') {
				return callback.call(this, this._append_html_data(obj, s));
			}
			return callback.call(this, false);
		},

		_node_changed : function (obj) {
			if((obj = this.get_node(obj))) {
				this._model.changed.push(obj.id);
			}
		},
		_append_html_data : function (dom, data) {
			dom = this.get_node(dom);
			var dat = data.is('ul') ? data.children() : data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j, c;
			dat.each($.proxy(function (i, v) {
				tmp = this._parse_model_from_html($(v), par, p.parents.concat());
				if(tmp) {
					chd.push(tmp);
					dpc.push(tmp);
					if(m[tmp].children_d.length) {
						dpc = dpc.concat(m[tmp].children_d);
					}
				}
			}, this));
			p.children = chd;
			p.children_d = dpc;
			for(i = 0, j = p.parents.length; i < j; i++) {
				m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
			}
			this.trigger('model', { "nodes" : dpc, 'parent' : par });
			if(par !== '#') {
				this._node_changed(par);
				this.redraw();
			}
			else {
				this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if(this._data.core.selected.length !== s) {
				this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
			}
			return true;
		},
		_append_json_data : function (dom, data) {
			dom = this.get_node(dom);
			var dat = data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j, c, k, l;
			if(!$.isArray(dat)) { dat = [dat]; }
			if(dat.length && typeof dat[0].id !== 'undefined' && typeof dat[0].parent !== 'undefined') {
				// Flat JSON support (for easy import from DB):
				// 1) convert to object (foreach)
				for(i = 0, j = dat.length; i < j; i++) {
					if(!dat[i].children) {
						dat[i].children = [];
					}
					m[dat[i].id] = dat[i];
				}
				// 2) populate children (foreach)
				for(i = 0, j = dat.length; i < j; i++) {
					m[dat[i].parent].children.push(dat[i].id);
					// populate parent.children_d
					p.children_d.push(dat[i].id);
				}
				// 3) normalize && populate parents and children_d with recursion
				for(i = 0, j = p.children.length; i < j; i++) {
					this._parse_model_from_flat_json(m[p.children[i]], par, p.parents.concat());
				}
				// ?) three_state selection - p.state.selected && t - (if three_state foreach(dat => ch) -> foreach(parents) if(parent.selected) child.selected = true;
			}
			else {
				for(i = 0, j = dat.length; i < j; i++) {
					tmp = this._parse_model_from_json(dat[i], par, p.parents.concat());
					if(tmp) {
						chd.push(tmp);
						dpc.push(tmp);
						if(m[tmp].children_d.length) {
							dpc = dpc.concat(m[tmp].children_d);
						}
					}
				}
				p.children = chd;
				p.children_d = dpc;
				for(i = 0, j = p.parents.length; i < j; i++) {
					m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
				}
			}
			this.trigger('model', { "nodes" : dpc, 'parent' : par });

			if(par !== '#') {
				this._node_changed(par);
				this.redraw();
			}
			else {
				// this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if(this._data.core.selected.length !== s) {
				this.trigger('changed', { 'action' : 'model', 'selected' : this._data.core.selected });
			}
			return true;
		},
		_parse_model_from_html : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = [].concat(ps); }
			if(p) { ps.unshift(p); }
			var c, e, m = this._model.data;
			var data = {
					id			: false,
					text		: false,
					icon		: true,
					parent		: p,
					parents		: ps,
					children	: [],
					children_d	: [],
					data		: null,
					state		: { },
					li_attr		: { id : false },
					a_attr		: { href : '#' },
					original	: false
				}, i, tmp, tid;
			for(i in this._model.default_state) {
				if(this._model.default_state.hasOwnProperty(i)) {
					data.state[i] = this._model.default_state[i];
				}
			}
			tmp = $.vakata.attributes(d, true);
			$.each(tmp, function (i, v) {
				v = $.trim(v);
				if(!v.length) { return true; }
				data.li_attr[i] = v;
				if(i === 'id') {
					data.id = v;
				}
			});
			tmp = d.children('a').eq(0);
			if(tmp.length) {
				tmp = $.vakata.attributes(tmp, true);
				$.each(tmp, function (i, v) {
					v = $.trim(v);
					if(v.length) {
						data.a_attr[i] = v;
					}
				});
			}
			tmp = d.children("a:eq(0)").length ? d.children("a:eq(0)").clone() : d.clone();
			tmp.children("ins, i, ul").remove();
			tmp = tmp.html();
			tmp = $('<div />').html(tmp);
			data.text = tmp.html();
			tmp = d.data();
			data.data = tmp ? $.extend(true, {}, tmp) : null;
			data.state.opened = d.hasClass('jstree-open');
			data.state.selected = d.children('a').hasClass('jstree-clicked');
			data.state.disabled = d.children('a').hasClass('jstree-disabled');
			if(data.data && data.data.jstree) {
				for(i in data.data.jstree) {
					if(data.data.jstree.hasOwnProperty(i)) {
						data.state[i] = data.data.jstree[i];
					}
				}
			}
			tmp = d.children("a").children(".jstree-themeicon");
			if(tmp.length) {
				data.icon = tmp.hasClass('jstree-themeicon-hidden') ? false : tmp.attr('rel');
			}
			tmp = d.children("ul").children("li");
			if(tmp.length) {
				tmp.each($.proxy(function (i, v) {
					c = this._parse_model_from_html($(v), data.id, ps);
					e = this._model.data[c];
					data.children.push(c);
					if(e.children_d.length) {
						data.children_d = data.children_d.concat(e.children_d);
					}
				}, this));
				data.children_d = data.children_d.concat(data.children);
			}
			else {
				if(d.hasClass('jstree-closed')) {
					data.state.loaded = false;
				}
			}
			do {
				tid = 'j' + this._id + '_' + (++total_nodes);
			} while(m[tid]);
			data.id = data.li_attr.id || tid;
			m[data.id] = data;
			if(data.state.selected) {
				this._data.core.selected.push(data.id);
			}
			return data.id;
		},
		_parse_model_from_flat_json : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = ps.concat(); }
			if(p) { ps.unshift(p); }
			var tid = d.id,
				m = this._model.data,
				df = this._model.default_state,
				i, j, c, e;
			var tmp = {
				id			: tid,
				text		: d.text || '',
				icon		: typeof d.icon !== 'undefined' ? d.icon : true,
				parent		: p,
				parents		: ps,
				children	: d.children || [],
				children_d	: d.children_d || [],
				data		: d.data,
				state		: { },
				li_attr		: { id : false },
				a_attr		: { href : '#' },
				original	: false
			};
			for(i in df) {
				if(df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if(d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if(d && d.data) {
				tmp.data = d.data;
				if(d.data.jstree) {
					for(i in d.data.jstree) {
						if(d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if(d && typeof d.state === 'object') {
				for (i in d.state) {
					if(d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if(d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if(d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if(!tmp.li_attr.id) {
				tmp.li_attr.id = tid;
			}
			if(d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if(d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if(d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			m[tmp.id] = tmp;
			for(i = 0, j = tmp.children.length; i < j; i++) {
				c = this._parse_model_from_flat_json(m[tmp.children[i]], tmp.id, ps);
				e = m[c];
				tmp.children_d.push(c);
				if(e.children_d.length) {
					tmp.children_d = tmp.children_d.concat(e.children_d);
				}
			}
			delete d.data;
			delete d.children;
			m[tmp.id].original = d;
			if(tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
		_parse_model_from_json : function (d, p, ps) {
			if(!ps) { ps = []; }
			else { ps = ps.concat(); }
			if(p) { ps.unshift(p); }
			var tid = false, i, j, c, e, m = this._model.data, df = this._model.default_state;
			do {
				tid = 'j' + this._id + '_' + (++total_nodes);
			} while(m[tid]);

			var tmp = {
				id			: false,
				text		: typeof d === 'string' ? d : '',
				icon		: typeof d === 'object' && typeof d.icon !== 'undefined' ? d.icon : true,
				parent		: p,
				parents		: ps,
				children	: [],
				children_d	: [],
				data		: null,
				state		: { },
				li_attr		: { id : false },
				a_attr		: { href : '#' },
				original	: false
			};
			for(i in df) {
				if(df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if(d && d.id) { tmp.id = d.id; }
			if(d && d.text) { tmp.text = d.text; }
			if(d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if(d && d.data) {
				tmp.data = d.data;
				if(d.data.jstree) {
					for(i in d.data.jstree) {
						if(d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if(d && typeof d.state === 'object') {
				for (i in d.state) {
					if(d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if(d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if(d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if(tmp.li_attr.id && !tmp.id) {
				tmp.id = tmp.li_attr.id;
			}
			if(!tmp.id) {
				tmp.id = tid;
			}
			if(!tmp.li_attr.id) {
				tmp.li_attr.id = tmp.id;
			}
			if(d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if(d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if(d && d.children && d.children.length) {
				for(i = 0, j = d.children.length; i < j; i++) {
					c = this._parse_model_from_json(d.children[i], tmp.id, ps);
					e = m[c];
					tmp.children.push(c);
					if(e.children_d.length) {
						tmp.children_d = tmp.children_d.concat(e.children_d);
					}
				}
				tmp.children_d = tmp.children_d.concat(tmp.children);
			}
			if(d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			delete d.data;
			delete d.children;
			tmp.original = d;
			m[tmp.id] = tmp;
			if(tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
		_redraw : function () {
			var nodes = this._model.force_full_redraw ? this._model.data['#'].children.concat([]) : this._model.changed.concat([]);
			var f = document.createElement('UL'), tmp;
			for(var i = 0, j = nodes.length; i < j; i++) {
				tmp = this.redraw_node(nodes[i], true, this._model.force_full_redraw);
				if(tmp && this._model.force_full_redraw) {
					f.appendChild(tmp);
				}
			}
			if(this._model.force_full_redraw) {
				f.className = this.get_container_ul()[0].className;
				this.element.empty().append(f);
				//this.get_container_ul()[0].appendChild(f);
			}
			this._model.force_full_redraw = false;
			this._model.changed = [];
			this.trigger('redraw', { "nodes" : nodes });
		},
		redraw : function (full) {
			if(full) {
				this._model.force_full_redraw = true;
			}
			//if(this._model.redraw_timeout) {
			//	clearTimeout(this._model.redraw_timeout);
			//}
			//this._model.redraw_timeout = setTimeout($.proxy(this._redraw, this),0);
			this._redraw();
		},

		redraw_node : function (node, deep, is_callback) {
			var obj = this.get_node(node),
				par = false,
				ind = false,
				old = false,
				i = false,
				j = false,
				k = false,
				f = false,
				c = '',
				d = document,
				m = this._model.data;
			if(!obj) { return false; }
			if(obj.id === '#') {  return this.redraw(true); }
			deep = deep || obj.children.length === 0;
			node = d.getElementById(obj.id); //, this.element);
			if(!node) {
				deep = true;
				//node = d.createElement('LI');
				if(!is_callback) {
					par = obj.parent !== '#' ? $('#' + obj.parent, this.element)[0] : null;
					if(par !== null && (!par || !m[obj.parent].state.opened)) {
						return false;
					}
					ind = $.inArray(obj.id, par === null ? m['#'].children : m[obj.parent].children);
				}
			}
			else {
				node = $(node);
				if(!is_callback) {
					par = node.parent().parent()[0];
					if(par === this.element[0]) {
						par = null;
					}
					ind = node.index();
				}
				m[obj.id].data = node.data();
				if(!deep && obj.children.length && !node.children('ul').length) {
					deep = true;
				}
				if(!deep) {
					old = node.children('UL')[0];
				}
				node.remove();
				//node = d.createElement('LI');
				//node = node[0];
			}
			node = _node.cloneNode(true);
			// node is DOM, deep is boolean

			c = 'jstree-node ';
			for(i in obj.li_attr) {
				if(obj.li_attr.hasOwnProperty(i)) {
					if(i === 'id') { continue; }
					if(i !== 'class') {
						_node.setAttribute(i, obj.li_attr[i]);
					}
					else {
						c += obj.li_attr[i];
					}
				}
			}
			if(!obj.children.length && obj.state.loaded) {
				c += ' jstree-leaf';
			}
			else {
				c += obj.state.opened ? ' jstree-open' : ' jstree-closed';
			}
			if(obj.parent !== null && m[obj.parent].children[m[obj.parent].children.length - 1] === obj.id) {
				c += ' jstree-last';
			}
			node.id = obj.id;
			node.className = c;
			c = '' + ( obj.state.selected ? ' jstree-clicked' : '') + ( obj.state.disabled ? ' jstree-disabled' : '');
			for(j in obj.a_attr) {
				if(obj.a_attr.hasOwnProperty(j)) {
					if(j === 'href' && obj.a_attr[j] === '#') { continue; }
					if(j !== 'class') {
						node.childNodes[1].setAttribute(j, obj.a_attr[j]);
					}
					else {
						c += ' ' + obj.a_attr[j];
					}
				}
			}
			if(c.length) {
				node.childNodes[1].className = 'jstree-anchor ' + c;
			}
			if(obj.icon && obj.icon !== true) {
				if(obj.icon === false) {
					node.childNodes[1].childNodes[0].className += ' jstree-themeicon-hidden';
				}
				else if(obj.icon.indexOf('/') === -1) {
					node.childNodes[1].childNodes[0].className += ' ' + obj.icon;
				}
				else {
					node.childNodes[1].childNodes[0].style.backgroundImage = 'url('+obj.icon+')';
					node.childNodes[1].childNodes[0].style.backgroundPosition = 'center center';
					node.childNodes[1].childNodes[0].style.backgroundSize = 'auto';
				}
			}
			node.childNodes[1].appendChild(d.createTextNode(obj.text));
			if(obj.data) { $.data(node, obj.data); }

			if(deep && obj.children.length && obj.state.opened) {
				k = d.createElement('UL');
				k.setAttribute('role', 'group');
				k.className = 'jstree-children';
				for(i = 0, j = obj.children.length; i < j; i++) {
					k.appendChild(this.redraw_node(obj.children[i], deep, true));
				}
				node.appendChild(k);
			}
			if(old) {
				node.appendChild(old);
			}
			if(!is_callback) {
				// append back using par / ind
				if(!par) {
					par = this.element[0];
				}
				if(!par.getElementsByTagName('UL').length) {
					i = d.createElement('UL');
					i.setAttribute('role', 'group');
					i.className = 'jstree-children';
					par.appendChild(i);
					par = i;
				}
				else {
					par = par.getElementsByTagName('UL')[0];
				}

				if(ind < par.childNodes.length) {
					par.insertBefore(node, par.childNodes[ind]);
				}
				else {
					par.appendChild(node);
				}
			}
			return node;
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.open_node(obj[t1], callback, animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			animation = (typeof animation).toLowerCase() === "undefined" ? this.settings.core.animation : animation;
			if(!this.is_closed(obj)) {
				if(callback) {
					callback.call(this, obj, false);
				}
				return false;
			}
			if(!this.is_loaded(obj)) {
				if(this.is_loading(obj)) {
					return setTimeout($.proxy(function () {
						this.open_node(obj, callback, animation);
					}, this), 500);
				}
				this.load_node(obj, function (o, ok) {
					return ok ? this.open_node(o, callback, animation) : (callback ? callback.call(this, o, false) : false);
				});
			}
			else {
				var d = this.get_node(obj, true),
					t = this, i, j;
				if(d.length) {
					if(obj.children.length && !this._firstChild(d.children('ul')[0])) {
						obj.state.opened = true;
						this.redraw_node(obj, true);
						d = this.get_node(obj, true);
					}
					if(!animation) {
						d[0].className = d[0].className.replace('jstree-closed', 'jstree-open');
					}
					else {
						d
							.children("ul").css("display","none").end()
							.removeClass("jstree-closed").addClass("jstree-open")
							.children("ul").stop(true, true)
								.slideDown(animation, function () {
									this.style.display = "";
									t.trigger("after_open", { "node" : obj });
								});
					}
				}
				obj.state.opened = true;
				if(callback) {
					callback.call(this, obj, true);
				}
				this.trigger('open_node', { "node" : obj });
				if(!animation || !d.length) {
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.close_node(obj[t1], animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			animation = (typeof animation).toLowerCase() === "undefined" ? this.settings.core.animation : animation;
			var t = this,
				d = this.get_node(obj, true);
			if(d.length) {
				if(!animation) {
					d[0].className = d[0].className.replace('jstree-open', 'jstree-closed');
					//d.children('ul').remove();
				}
				else {
					d
						.children("ul").attr("style","display:block !important").end()
						.removeClass("jstree-open").addClass("jstree-closed")
						.children("ul").stop(true, true).slideUp(animation, function () {
							this.style.display = "";
							d.children('ul').remove();
							t.trigger("after_close", { "node" : obj });
						});
				}
			}
			obj.state.opened = false;
			this.trigger('close_node',{ "node" : obj });
			if(!animation || !d.length) {
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.toggle_node(obj[t1]);
				}
				return true;
			}
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
			if(!obj) { obj = '#'; }
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true);
			if(!dom.length) {
				for(var i = 0, j = obj.children_d.length; i < j; i++) {
					if(this.is_closed(this._mode.data[obj.children_d[i]])) {
						this._mode.data[obj.children_d[i]].state.opened = true;
					}
				}
				return this.trigger('open_all', { "node" : obj });
			}
			original_obj = original_obj || dom;
			var _this = this;
			dom = this.is_closed(obj) ? dom.find('li.jstree-closed').addBack() : dom.find('li.jstree-closed');
			dom.each(function () {
				_this.open_node(
					this,
					_this.is_loaded(this) ?
						false :
						function(dom) { this.open_all(dom, animation, original_obj); },
					animation || 0
				);
			});
			if(original_obj.find('li.jstree-closed').length === 0) {
				this.trigger('open_all', { "node" : this.get_node(original_obj) });
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
			if(!obj) { obj = '#'; }
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true),
				_this = this;
			if(!dom.length) {
				for(var i = 0, j = obj.children_d.length; i < j; i++) {
					this._mode.data[obj.children_d[i]].state.opened = false;
				}
				return this.trigger('close_all', { "node" : obj });
			}
			dom = this.is_open(obj) ? dom.find('li.jstree-open').addBack() : dom.find('li.jstree-open');
			dom.vakata_reverse().each(function () { _this.close_node(this, animation || 0); });
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
			return obj && obj.state && obj.state.disabled;
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.enable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = false;
			this.get_node(obj,true).children('.jstree-anchor').removeClass('jstree-disabled');
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.disable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = true;
			this.get_node(obj,true).children('.jstree-anchor').addClass('jstree-disabled');
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
			this.trigger('activate_node', { 'node' : this.get_node(obj) });
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
			obj = this.get_node(obj, true);
			if(!obj || !obj.length) {
				return false;
			}
			obj.children('.jstree-anchor').addClass('jstree-hovered');
			this.trigger('hover_node', { 'node' : this.get_node(obj) });
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
			obj = this.get_node(obj, true);
			if(!obj || !obj.length) {
				return false;
			}
			obj.children('.jstree-anchor').removeClass('jstree-hovered');
			this.trigger('dehover_node', { 'node' : this.get_node(obj) });
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.select_node(obj[t1], supress_event, prevent_open);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			var dom = this.get_node(obj, true);
			if(!obj.state.selected) {
				obj.state.selected = true;
				this._data.core.selected.push(obj.id);

				if(dom.length) {
					dom.children('.jstree-anchor').addClass('jstree-clicked');
					if(!prevent_open) {
						var th = this;
						dom.parents(".jstree-closed").each(function () { th.open_node(this, false, 0); });
					}
				}
				this.trigger('select_node', { 'node' : obj, 'selected' : this._data.core.selected });
				if(!supress_event) {
					this.trigger('changed', { 'action' : 'select_node', 'node' : obj, 'selected' : this._data.core.selected });
				}
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.deselect_node(obj[t1], supress_event);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') {
				return false;
			}
			var dom = this.get_node(obj, true);
			if(obj.state.selected) {
				obj.state.selected = false;
				this._data.core.selected = $.vakata.array_remove(this._data.core.selected, $.inArray(obj.id, this._data.core.selected));
				if(dom.length) {
					dom.children('.jstree-anchor').removeClass('jstree-clicked');
				}
				this.trigger('deselect_node', { 'node' : obj, 'selected' : this._data.core.selected });
				if(!supress_event) {
					this.trigger('changed', { 'action' : 'deselect_node', 'node' : obj, 'selected' : this._data.core.selected });
				}
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
		select_all : function (supress_event) {
			var tmp = this._data.core.selected.concat([]);
			this._data.core.selected = this._model.data['#'].children_d.concat();
			for(var i = 0, j = this._data.core.selected.length; i < j; i++) {
				if(this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = true;
				}
			}
			this.redraw(true);
			this.trigger('select_all', { 'selected' : this._data.core.selected });
			if(!supress_event) {
				this.trigger('changed', { 'action' : 'select_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
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
			var tmp = this._data.core.selected.concat([]);
			for(var i = 0, j = this._data.core.selected.length; i < j; i++) {
				if(this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = false;
				}
			}
			this._data.core.selected = [];
			this.element.find('.jstree-clicked').removeClass('jstree-clicked');
			this.trigger('deselect_all', { 'selected' : this._data.core.selected, 'node' : tmp });
			if(!supress_event) {
				this.trigger('changed', { 'action' : 'deselect_all', 'selected' : this._data.core.selected, 'old_selection' : tmp });
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
			if(!obj || obj.id === '#') {
				return false;
			}
			return obj.state.selected;
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
					/*
					'themes' : {
						'name' : this.get_theme(),
						'icons' : this._data.core.themes.icons,
						'dots' : this._data.core.themes.dots
					},
					*/
					'selected' : []
				}
			};
			for(var i in this._model.data) {
				if(i !== '#' && this._model.data.hasOwnProperty(i)) {
					if(this._model.data[i].state.opened) {
						state.core.open.push(i);
					}
					if(this._model.data[i].state.selected) {
						state.core.selected.push(i);
					}
				}
			}
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
							n = false,
							t = this;
						$.each(state.core.open.concat([]), function (i, v) {
							n = document.getElementById(v);
							if(n) {
								if(t.is_loaded(v)) {
									if(t.is_closed(v)) {
										t.open_node(v, false, 0);
									}
									$.vakata.array_remove(state.core.open, $.inArray(v,state.core.open));
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
					/*
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
					*/
					if(state.core.selected) {
						var _this = this;
						this.deselect_all();
						$.each(state.core.selected, function (i, v) {
							_this.select_node(v);
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
			this.load_node('#', function (o, s) {
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
			return (!obj || obj.id === '#') ? false : obj.text;
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_text(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			obj.text = val;
			var dom = this.get_node(obj, true);
			if(dom.length) {
				dom = dom.children(".jstree-anchor:eq(0)");
				var tmp = dom.children("I").clone();
				dom.html(val).prepend(tmp);
				this.trigger('set_text',{ "obj" : obj, "text" : val });
			}
			return true;
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
		get_json : function (obj, options) {
			obj = this.get_node(obj || '#');
			if(!obj) { return false; }
			var tmp = {
				'text' : obj.text,
				'icon' : this.get_icon(obj),
				'li_attr' : obj.li_attr,
				'a_attr' : obj.a_attr,
				'state' : {},
				'data' : options && options.no_data ? false : ( this.get_node(obj, true).length ? this.get_node(obj, true).data() : obj.data ),
				'children' : []
			}, i, j;
			if(!options || !options.no_state) {
				for(i in obj.state) {
					if(obj.state.hasOwnProperty(i)) {
						tmp.state[i] = obj.state[i];
					}
				}
			}
			if(options && options.no_id && tmp.li_attr && tmp.li_attr.id) {
				delete tmp.li_attr.id;
			}
			if(!options || !options.no_children) {
				for(i = 0, j = obj.children.length; i < j; i++) {
					tmp.children.push(this.get_json(obj.children[i], options, true));
				}
			}
			return obj.id === '#' ? tmp.children : tmp;
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
			if(!par) { return false; }
			pos = typeof pos === "undefined" ? "last" : pos;
			if(!pos.match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.create_node(par, node, pos, callback, true); });
			}
			if(!node) { node = this.get_string('New node'); }
			var tmp, dpc, i, j;

			if(par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					tmp = this.get_node(par.parent);
					pos = $.inArray(par, tmp.children);
					par = tmp;
					break;
				case "after" :
					tmp = this.get_node(par.parent);
					pos = $.inArray(par, tmp.children);
					par = tmp;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > par.children.length) { pos = par.children.length; }
			if(!this.check("create_node", node, par, pos)) { return false; }
			node = this._parse_model_from_json(node, par.id, par.parents.concat());
			if(!node) { return false; }
			tmp = this.get_node(node);
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', { "nodes" : dpc, "parent" : par.id });

			par.children_d = par.children_d.concat(dpc);
			for(i = 0, j = par.parents.length; i < j; i++) {
				this._model.data[par.parents[i]].children_d = this._model.data[par.parents[i]].children_d.concat(dpc);
			}
			node = tmp;
			tmp = [];
			for(i = 0, j = par.children.length; i < j; i++) {
				tmp[i >= pos ? i+1 : i] = par.children[i];
			}
			tmp[pos] = node.id;
			par.children = tmp;

			this.redraw_node(par);
			if(callback) { callback.call(this, this.get_node(node)); }
			this.trigger('create_node', { "node" : this.get_node(node), "parent" : par.id, "position" : pos });
			return node.id;
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.rename_node(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var old = obj.text;
			if(!this.check("rename_node", obj, this.get_parent(obj), val)) { return false; }
			this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
			this.trigger('rename_node', { "node" : obj, "text" : val, "old" : old });
			return true;
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.delete_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var par = this.get_node(obj.parent),
				pos = $.inArray(obj.id, par.children), tmp, i, j, k, l, c = false;
			if(!this.check("delete_node", obj, par, pos)) { return false; }
			par.children = $.vakata.array_remove(par.children, pos);
			tmp = obj.children_d.concat([]);
			tmp.push(obj.id);
			for(k = 0, l = tmp.length; k < l; k++) {
				for(i = 0, j = obj.parents.length; i < j; i++) {
					this._model.data[obj.parents[i]].children_d = $.vakata.array_remove(this._model.data[obj.parents[i]].children_d, $.inArray(tmp[k], this._model.data[obj.parents[i]].children_d));
				}
				if(this._model.data[tmp[k]].state.selected) {
					c = true;
					this._data.core.selected = $.vakata.array_remove(this._data.core.selected, $.inArray(tmp[k], this._data.core.selected));
				}
			}
			this.trigger('delete_node', { "node" : obj, "parent" : par.id });
			if(c) {
				this.trigger('changed', { 'action' : 'delete_node', 'node' : obj, 'selected' : this._data.core.selected, 'parent' : par.id });
			}
			delete this._model.data[obj.id];
			this.redraw_node(par, true);
			return true;
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
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
				chc = this.settings.core.check_callback,
				m = this._model.data,
				d = 0;
			if(chk === "move_node") {
				if(obj.id === par.id || $.inArray(obj.id, par.children) === pos || $.inArray(par.id, obj.children_d) !== -1) {
					return false;
				}
			}
			tmp = this.get_node(tmp, true);
			if(tmp.length) { tmp = tmp.data('jstree'); }
			if(tmp && tmp.functions && (tmp.functions[chk] === false || tmp.functions[chk] === true)) {
				return tmp.functions[chk];
			}
			if(chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos) === false) || (chc && chc[chk] === false)) {
				return false;
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
			if($.isArray(obj)) {
				obj.reverse();
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.move_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = typeof pos === "undefined" ? 0 : pos;

			if(!par || !obj || obj.id === '#') { return false; }
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.move_node(obj, par, pos, callback, true); });
			}

			var old_par = '' + obj.parent,
				new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent),
				old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id),
				is_multi = (this._id !== old_ins._id),
				dpc, tmp, i, j, k, l, p, c, m = this._model.data;
			if(new_par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					pos = $.inArray(par.id, new_par.children);
					break;
				case "after" :
					pos = $.inArray(par.id, new_par.children) + 1;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = new_par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > new_par.children.length) { pos = new_par.children.length; }
			if(!this.check("move_node", obj, new_par, pos)) { return false; }

			if(!is_multi && obj.parent === new_par.id) {
				dpc = new_par.children.concat();
				tmp = $.inArray(obj.id, dpc);
				if(tmp !== -1) {
					dpc = $.vakata.array_remove(dpc, tmp);
					if(pos > tmp) { pos--; }
				}
				tmp = [];
				for(i = 0, j = dpc.length; i < j; i++) {
					tmp[i >= pos ? i+1 : i] = dpc[i];
				}
				tmp[pos] = obj.id;
				new_par.children = tmp;
				this._node_changed(new_par.id);
				this.redraw(new_par.id === '#');
			}
			else {
				// clean old parent and up
				tmp = obj.children_d.concat();
				tmp.push(obj.id);
				for(i = 0, j = obj.parents.length; i < j; i++) {
					dpc = [];
					p = old_ins._model.data[obj.parents[i]].children_d;
					for(k = 0, l = p.length; k < l; k++) {
						if($.inArray(p[k], tmp) === -1) {
							dpc.push(p[k]);
						}
					}
					old_ins._model.data[obj.parents[i]].children_d = dpc;
				}
				old_ins._model.data[old_par].children = $.vakata.array_remove(old_ins._model.data[old_par].children, $.inArray(obj.id, old_ins._model.data[old_par].children));

				// insert into new parent and up
				for(i = 0, j = new_par.parents.length; i < j; i++) {
					this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(tmp);
				}
				dpc = [];
				for(i = 0, j = new_par.children.length; i < j; i++) {
					dpc[i >= pos ? i+1 : i] = new_par.children[i];
				}
				dpc[pos] = obj.id;
				new_par.children = dpc;
				new_par.children_d.push(obj.id);
				new_par.children_d = new_par.children_d.concat(obj.children_d);

				// update object
				obj.parent = new_par.id;
				tmp = new_par.parents.concat();
				tmp.push(new_par.id);
				obj.parents = tmp;

				if(is_multi) {
					old_ins.delete_node(obj.id);
					this._node_changed(new_par.id);
					this.redraw(new_par.id === '#');
				}
				else {
					this._node_changed(old_par);
					this._node_changed(new_par.id);
					this.redraw(old_par === '#' || new_par.id === '#');
				}
			}
			if(callback) { callback.call(this, obj, new_par, pos); }
			this.trigger('move_node', { "node" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : this });
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
			if($.isArray(obj)) {
				obj.reverse();
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.copy_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = typeof pos === "undefined" ? 0 : pos;

			if(!par || !obj || obj.id === '#') { return false; }
			if(!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () { this.copy_node(obj, par, pos, callback, true); });
			}

			var old_par = '' + obj.parent,
				new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent),
				old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id),
				is_multi = (this._id !== old_ins._id),
				dpc, tmp, i, j, k, l, p, node;
			if(new_par.id === '#') {
				if(pos === "before") { pos = "first"; }
				if(pos === "after") { pos = "last"; }
			}
			switch(pos) {
				case "before":
					pos = $.inArray(par.id, new_par.children);
					break;
				case "after" :
					pos = $.inArray(par.id, new_par.children) + 1;
					break;
				case "inside":
				case "first":
					pos = 0;
					break;
				case "last":
					pos = new_par.children.length;
					break;
				default:
					if(!pos) { pos = 0; }
					break;
			}
			if(pos > new_par.children.length) { pos = new_par.children.length; }
			if(!this.check("copy_node", obj, new_par, pos)) { return false; }

			node = old_ins.get_json(obj, { no_id : true, no_data : true, no_state : true });
			if(!node) { return false; }
			node = this._parse_model_from_json(node, new_par.id, new_par.parents.concat());
			if(!node) { return false; }
			tmp = this.get_node(node);
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', { "nodes" : dpc, "parent" : new_par.id });

			// insert into new parent and up
			for(i = 0, j = new_par.parents.length; i < j; i++) {
				this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(dpc);
			}
			dpc = [];
			for(i = 0, j = new_par.children.length; i < j; i++) {
				dpc[i >= pos ? i+1 : i] = new_par.children[i];
			}
			dpc[pos] = tmp.id;
			new_par.children = dpc;
			new_par.children_d.push(tmp.id);
			new_par.children_d = new_par.children_d.concat(tmp.children_d);

			this._node_changed(new_par.id);
			this.redraw(new_par.id === '#');
			if(callback) { callback.call(this, tmp, new_par, pos); }
			this.trigger('copy_node', { "node" : tmp, "original" : obj, "parent" : new_par.id, "position" : pos, "old_parent" : old_par, "is_multi" : is_multi, 'old_instance' : old_ins, 'new_instance' : this });
			return tmp.id;
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
			if(!obj) { obj = this._data.core.selected.concat(); }
			if(!$.isArray(obj)) { obj = [obj]; }
			if(!obj.length) { return false; }
			var tmp = [], o;
			for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if(o && o.id && o.id !== '#') { tmp.push(o); }
			}
			if(!tmp.length) { return false; }
			ccp_node = tmp;
			ccp_inst = this;
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
			if(!obj) { obj = this._data.core.selected.concat(); }
			if(!$.isArray(obj)) { obj = [obj]; }
			if(!obj.length) { return false; }
			var tmp = [], o;
			for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if(o && o.id && o.id !== '#') { tmp.push(o); }
			}
			if(!tmp.length) { return false; }
			ccp_node = tmp;
			ccp_inst = this;
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
			return { 'mode' : ccp_mode, 'node' : ccp_node, 'inst' : ccp_inst };
		},
		/**
		 * `can_paste()`
		 *
		 * __Returns__
		 *
		 */
		can_paste : function () {
			return ccp_mode !== false && ccp_node !== false; // && ccp_inst._model.data[ccp_node];
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
			if(this[ccp_mode](ccp_node, obj)) {
				this.trigger('paste', { "parent" : obj.id, "node" : ccp_node, "mode" : ccp_mode });
			}
			ccp_node = false;
			ccp_mode = false;
			ccp_inst = false;
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
			obj = this.get_node(obj, true);
			if(!obj || !obj.length) { return false; }
			obj.parentsUntil(".jstree",".jstree-closed").each($.proxy(function (i, v) {
				this.open_node(v, false, 0);
			}, this));
			var rtl = this._data.core.rtl,
				w  = this.element.width(),
				a  = obj.children('.jstree-anchor'),
				oi = obj.children("i:visible"),
				ai = a.children("i:visible"),
				w1 = oi.width() * oi.length,
				w2 = ai.width() * ai.length,
				t  = typeof default_text === 'string' ? default_text : this.get_text(obj),
				h1 = $("<"+"div />", { css : { "position" : "absolute", "top" : "-200px", "left" : (rtl ? "0px" : "-1000px"), "visibility" : "hidden" } }).appendTo("body"),
				h2 = $("<"+"input />", {
						"value" : t,
						"class" : "jstree-rename-input",
						// "size" : t.length,
						"css" : {
							"padding" : "0",
							"border" : "1px solid silver",
							"box-sizing" : "border-box",
							"display" : "inline-block",
							"height" : (this._data.core.li_height) + "px",
							"lineHeight" : (this._data.core.li_height) + "px",
							"width" : "150px" // will be set a bit further down
						},
						"blur" : $.proxy(function () {
							var i = a.children(".jstree-rename-input"),
								v = i.val();
							if(v === "") { v = t; }
							h1.remove();
							i.remove();
							if(this.rename_node(obj, v) === false) {
								this.rename_node(obj, t);
							}
						}, this),
						"keydown" : function (event) {
							var key = event.which;
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
							h2.width(Math.min(h1.text("pW" + this.value).width(),w));
						},
						"keypress" : function(event) {
							if(event.which === 13) { return false; }
						}
					}),
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
			a.append(h2);
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
		 * `show_stripes()`
		 */
		show_stripes : function () { this._data.core.themes.stripes = true; this.get_container_ul().addClass("jstree-striped"); },
		/**
		 * `hide_stripes()`
		 */
		hide_stripes : function () { this._data.core.themes.stripes = false; this.get_container_ul().removeClass("jstree-striped"); },
		/**
		 * `toggle_stripes()`
		 */
		toggle_stripes : function () { if(this._data.core.themes.stripes) { this.hide_stripes(); } else { this.show_stripes(); } },
		/**
		 * `show_dots()`
		 */
		show_dots : function () { this._data.core.themes.dots = true; this.get_container_ul().removeClass("jstree-no-dots"); },
		/**
		 * `hide_dots()`
		 */
		hide_dots : function () { this._data.core.themes.dots = false; this.get_container_ul().addClass("jstree-no-dots"); },
		/**
		 * `toggle_dots()`
		 */
		toggle_dots : function () { if(this._data.core.themes.dots) { this.hide_dots(); } else { this.show_dots(); } },
		/**
		 * `show_icons()`
		 */
		show_icons : function () { this._data.core.themes.icons = true; this.get_container_ul().removeClass("jstree-no-icons"); },
		/**
		 * `hide_icons()`
		 */
		hide_icons : function () { this._data.core.themes.icons = false; this.get_container_ul().addClass("jstree-no-icons"); },
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_icon(obj[t1], icon);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			obj.icon = icon;
			var dom = this.get_node(obj, true).children("jstree-anchor").children(".jstree-themeicon");
			if(icon === false) {
				this.hide_icon(obj);
			}
			else if(icon.indexOf("/") === -1) {
				dom.addClass(icon).attr("rel",icon);
			}
			else {
				dom.css("background", "url('" + icon + "') center center no-repeat").attr("rel",icon);
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
			return (!obj || obj.id === '#') ? false : obj.icon;
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.hide_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj === '#') { return false; }
			obj.icon = false;
			this.get_node(obj, true).children("a").children(".jstree-themeicon").addClass('jstree-themeicon-hidden');
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
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.show_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if(!obj || obj === '#') { return false; }
			var dom = this.get_node(obj, true);
			obj.icon = dom.length ? dom.children("a").children(".jstree-themeicon").attr('rel') : true;
			if(!obj.icon) { obj.icon = true; }
			dom.children("a").children(".jstree-themeicon").removeClass('jstree-themeicon-hidden');
			return true;
		}
	};

	var src = $('script:last').attr('src');
	$.jstree.path = src && src.indexOf('/') !== -1 ? src.replace(/\/[^\/]+$/,'') : '';

	// helpers
	$.vakata = {};
	// reverse
	$.fn.vakata_reverse = [].reverse;
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
	// remove item from array
	$.vakata.array_remove = function(array, from, to) {
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		array.push.apply(array, rest);
		return array;
	};
	// browser sniffing
	(function () {
		var browser = {},
			b_match = function(ua) {
			ua = ua.toLowerCase();

			var match =	/(chrome)[ \/]([\w.]+)/.exec( ua ) ||
						/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
						/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
						/(msie) ([\w.]+)/.exec( ua ) ||
						ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
						[];
				return {
					browser: match[1] || "",
					version: match[2] || "0"
				};
			},
			matched = b_match(navigator.userAgent);
		if(matched.browser) {
			browser[ matched.browser ] = true;
			browser.version = matched.version;
		}
		if(browser.chrome) {
			browser.webkit = true;
		}
		else if(browser.webkit) {
			browser.safari = true;
		}
		$.vakata.browser = browser;
	})();
	if($.vakata.browser.msie && $.vakata.browser.version < 8) {
		$.jstree.defaults.core.animation = 0;
	}
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
			this.init = function (el, options) {
				// do not forget parent
				parent.init.call(this, el, options);
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
			// very heavy - use only if needed and be careful (will be replaced bt redraw_node!!!)
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

/**
 * ### Checkbox plugin
 */
(function ($) {
	var _i = document.createElement('I');
	_i.className = 'jstree-icon jstree-checkbox';
	$.jstree.defaults.checkbox = {
		visible				: true,
		three_state			: true,
		whole_node			: true,
		keep_selected_style	: true
	};
	$.jstree.plugins.checkbox = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this._data.checkbox.uto = false;
			this.element
				.on("init.jstree", $.proxy(function () {
						this._data.checkbox.visible = this.settings.checkbox.visible;
						if(!this.settings.checkbox.keep_selected_style) {
							this.element.addClass('jstree-checkbox-no-clicked');
						}
					}, this))
				.on("loading.jstree", $.proxy(function () {
						this[ this._data.checkbox.visible ? 'show_checkboxes' : 'hide_checkboxes' ]();
					}, this));
			if(this.settings.checkbox.three_state) {
				this.element
					.on('changed.jstree move_node.jstree copy_node.jstree redraw.jstree open_node.jstree', $.proxy(function () {
							if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
							this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
						}, this))
					.on('model.jstree', $.proxy(function (e, data) {
							var m = this._model.data,
								p = m[data.parent],
								par = data.parent,
								dpc = data.nodes,
								chd = [],
								c, i, j, k, l, tmp;

							// apply down
							if(p.state.selected) {
								for(i = 0, j = dpc.length; i < j; i++) {
									m[dpc[i]].state.selected = true;
								}
								this._data.core.selected = this._data.core.selected.concat(dpc);
							}
							else {
								for(i = 0, j = dpc.length; i < j; i++) {
									if(m[dpc[i]].state.selected) {
										for(k = 0, l = m[dpc[i]].children_d.length; k < l; k++) {
											m[m[dpc[i]].children_d[k]].state.selected = true;
										}
										this._data.core.selected = this._data.core.selected.concat(m[dpc[i]].children_d);
									}
								}
							}

							// apply up
							for(i = 0, j = p.children_d.length; i < j; i++) {
								if(!m[p.children_d[i]].children.length) {
									chd.push(m[p.children_d[i]].parent);
								}
							}
							chd = $.vakata.array_unique(chd);
							for(k = 0, l = chd.length; k < l; k++) {
								p = m[chd[k]];
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state.selected;
									}
									if(c === j) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
									else {
										break;
									}
									p = this.get_node(p.parent);
								}
							}
							this._data.core.selected = $.vakata.array_unique(this._data.core.selected);
						}, this))
					.on('select_node.jstree', $.proxy(function (e, data) {
							var obj = data.node,
								m = this._model.data,
								par = this.get_node(obj.parent),
								dom = this.get_node(obj, true),
								i, j, c, tmp;
							this._data.core.selected = $.vakata.array_unique(this._data.core.selected.concat(obj.children_d));
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								m[obj.children_d[i]].state.selected = true;
							}
							while(par && par.id !== '#') {
								c = 0;
								for(i = 0, j = par.children.length; i < j; i++) {
									c += m[par.children[i]].state.selected;
								}
								if(c === j) {
									par.state.selected = true;
									this._data.core.selected.push(par.id);
									tmp = this.get_node(par, true);
									if(tmp && tmp.length) {
										tmp.children('.jstree-anchor').addClass('jstree-clicked');
									}
								}
								else {
									break;
								}
								par = this.get_node(par.parent);
							}
							if(dom.length) {
								dom.find('.jstree-anchor').addClass('jstree-clicked');
							}
						}, this))
					.on('deselect_node.jstree', $.proxy(function (e, data) {
							var obj = data.node,
								m = this._model.data,
								dom = this.get_node(obj, true),
								i, j, tmp;
							for(i = 0, j = obj.children_d.length; i < j; i++) {
								this._model.data[obj.children_d[i]].state.selected = false;
							}
							for(i = 0, j = obj.parents.length; i < j; i++) {
								this._model.data[obj.parents[i]].state.selected = false;
								tmp = this.get_node(obj.parents[i], true);
								if(tmp && tmp.length) {
									tmp.children('.jstree-anchor').removeClass('jstree-clicked');
								}
							}
							tmp = [];
							for(i = 0, j = this._data.core.selected.length; i < j; i++) {
								if($.inArray(this._data.core.selected[i], obj.children_d) === -1 && $.inArray(this._data.core.selected[i], obj.parents) === -1) {
									tmp.push(this._data.core.selected[i]);
								}
							}
							this._data.core.selected = $.vakata.array_unique(tmp);
							if(dom.length) {
								dom.find('.jstree-anchor').removeClass('jstree-clicked');
							}
						}, this))
					.on('delete_node.jstree', $.proxy(function (e, data) {
							var p = this.get_node(data.parent),
								m = this._model.data,
								i, j, c, tmp;
							while(p && p.id !== '#') {
								c = 0;
								for(i = 0, j = p.children.length; i < j; i++) {
									c += m[p.children[i]].state.selected;
								}
								if(c === j) {
									p.state.selected = true;
									this._data.core.selected.push(p.id);
									tmp = this.get_node(p, true);
									if(tmp && tmp.length) {
										tmp.children('.jstree-anchor').addClass('jstree-clicked');
									}
								}
								else {
									break;
								}
								p = this.get_node(p.parent);
							}
						}, this))
					.on('move_node.jstree', $.proxy(function (e, data) {
							var is_multi = data.is_multi,
								old_par = data.old_parent,
								new_par = this.get_node(data.parent),
								m = this._model.data,
								p, c, i, j, tmp;
							if(!is_multi) {
								p = this.get_node(old_par);
								while(p && p.id !== '#') {
									c = 0;
									for(i = 0, j = p.children.length; i < j; i++) {
										c += m[p.children[i]].state.selected;
									}
									if(c === j) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
									else {
										break;
									}
									p = this.get_node(p.parent);
								}
							}
							p = new_par;
							while(p && p.id !== '#') {
								c = 0;
								for(i = 0, j = p.children.length; i < j; i++) {
									c += m[p.children[i]].state.selected;
								}
								if(c === j) {
									if(!p.state.selected) {
										p.state.selected = true;
										this._data.core.selected.push(p.id);
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').addClass('jstree-clicked');
										}
									}
								}
								else {
									if(p.state.selected) {
										p.state.selected = false;
										this._data.core.selected = $.vakata.array_remove(this._data.core.selected, $.inArray(p.id, this._data.core.selected));
										tmp = this.get_node(p, true);
										if(tmp && tmp.length) {
											tmp.children('.jstree-anchor').removeClass('jstree-clicked');
										}
									}
									else {
										break;
									}
								}
								p = this.get_node(p.parent);
							}
						}, this));
			}
		};
		this._undetermined = function () {
			var i, j, m = this._model.data, s = this._data.core.selected, p = [];
			for(i = 0, j = s.length; i < j; i++) {
				p = p.concat(m[s[i]].parents);
			}
			p = $.vakata.array_unique(p);
			i = $.inArray('#', p);
			if(i !== -1) {
				p = $.vakata.array_remove(p, i);
			}
			this.element.find('.jstree-undetermined').removeClass('jstree-undetermined');
			for(i = 0, j = p.length; i < j; i++) {
				if(!m[p[i]].state.selected) {
					s = this.get_node(p[i], true);
					if(s && s.length) {
						s.children('a').children('.jstree-checkbox').addClass('jstree-undetermined');
					}
				}
			}
		};
		this.redraw_node = function(obj, deep, is_callback) {
			obj = parent.redraw_node.call(this, obj, deep, is_callback);
			if(obj) {
				var tmp = obj.getElementsByTagName('A')[0];
				tmp.insertBefore(_i.cloneNode(), tmp.childNodes[0]);
			}
			if(!is_callback && this.settings.checkbox.three_state) {
				if(this._data.checkbox.uto) { clearTimeout(this._data.checkbox.uto); }
				this._data.checkbox.uto = setTimeout($.proxy(this._undetermined, this), 50);
			}
			return obj;
		};
		this.activate_node = function (obj, e) {
			if(this.settings.checkbox.whole_node || $(e.target).hasClass('jstree-checkbox')) {
				e.ctrlKey = true;
			}
			return parent.activate_node.call(this, obj, e);
		};
		/**
		 * `show_checkboxes()`
		 */
		this.show_checkboxes = function () { this._data.core.themes.checkboxes = true; this.element.children("ul").removeClass("jstree-no-checkboxes"); };
		/**
		 * `hide_checkboxes()`
		 */
		this.hide_checkboxes = function () { this._data.core.themes.checkboxes = false; this.element.children("ul").addClass("jstree-no-checkboxes"); };
		/**
		 * `toggle_checkboxes()`
		 */
		this.toggle_checkboxes = function () { if(this._data.core.themes.checkboxes) { this.hide_checkboxes(); } else { this.show_checkboxes(); } };
	};

	// include the checkbox plugin by default
	//$.jstree.defaults.plugins.push("checkbox");
})(jQuery);
/**
 * ### Contextmenu plugin
 */
// TODO: move logic outside of function + check multiple move
(function ($) {
	$.jstree.defaults.contextmenu = {
		select_node : true,
		show_at_node : true,
		items : function (o) { // Could be an object directly
			return {
				"create" : {
					"separator_before"	: false,
					"separator_after"	: true,
					"_disabled"			: false, //(this.check("create_node", data.reference, {}, "last")),
					"label"				: "Create",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.create_node(obj, {}, "last", function (new_node) {
							setTimeout(function () { inst.edit(new_node); },0);
						});
					}
				},
				"rename" : {
					"separator_before"	: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("rename_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Rename",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						inst.edit(obj);
					}
				},
				"remove" : {
					"separator_before"	: false,
					"icon"				: false,
					"separator_after"	: false,
					"_disabled"			: false, //(this.check("delete_node", data.reference, this.get_parent(data.reference), "")),
					"label"				: "Delete",
					"action"			: function (data) {
						var inst = $.jstree.reference(data.reference),
							obj = inst.get_node(data.reference);
						if(inst.is_selected(obj)) {
							inst.delete_node(inst.get_selected());
						}
						else {
							inst.delete_node(obj);
						}
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
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								if(inst.is_selected(obj)) {
									inst.cut(inst.get_selected());
								}
								else {
									inst.cut(obj);
								}
							}
						},
						"copy" : {
							"separator_before"	: false,
							"icon"				: false,
							"separator_after"	: false,
							"label"				: "Copy",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								if(inst.is_selected(obj)) {
									inst.copy(inst.get_selected());
								}
								else {
									inst.copy(obj);
								}
							}
						},
						"paste" : {
							"separator_before"	: false,
							"icon"				: false,
							"_disabled"			: !(this.can_paste()),
							"separator_after"	: false,
							"label"				: "Paste",
							"action"			: function (data) {
								var inst = $.jstree.reference(data.reference),
									obj = inst.get_node(data.reference);
								inst.paste(obj);
							}
						}
					}
				}
			};
		}
	};

	$.jstree.plugins.contextmenu = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on("contextmenu.jstree", "a", $.proxy(function (e) {
						e.preventDefault();
						if(!this.is_loading(e.currentTarget)) {
							this.show_contextmenu(e.currentTarget, e.pageX, e.pageY);
						}
					}, this))
				.on("click.jstree", "a", $.proxy(function (e) {
						if(this._data.contextmenu.visible) {
							$.vakata.context.hide();
						}
					}, this));
			$(document).on("context_hide.vakata", $.proxy(function () { this._data.contextmenu.visible = false; }, this));
		};
		this.teardown = function () {
			if(this._data.contextmenu.visible) {
				$.vakata.context.hide();
			}
			parent.teardown.call(this);
		};

		this.show_contextmenu = function (obj, x, y) {
			obj = this.get_node(obj);
			if(!obj || obj.id === '#') { return false; }
			var s = this.settings.contextmenu,
				d = this.get_node(obj, true),
				a = d.children(".jstree-anchor"),
				o = false,
				i = false;
			if(s.show_at_node || typeof x === "undefined" || typeof y === "undefined") {
				o = a.offset();
				x = o.left;
				y = o.top + this._data.core.li_height;
			}
			if(this.settings.contextmenu.select_node && !this.is_selected(obj)) {
				this.deselect_all();
				this.select_node(obj);
			}

			i = s.items;
			if($.isFunction(i)) { i = i.call(this, obj); }

			$(document).one("context_show.vakata", $.proxy(function (e, data) {
				var cls = 'jstree-contextmenu jstree-' + this.get_theme() + '-contextmenu';
				$(data.element).addClass(cls);
			}, this));
			this._data.contextmenu.visible = true;
			$.vakata.context.show(a, { 'x' : x, 'y' : y }, i);
			this.trigger('show_contextmenu', { "node" : obj, "x" : x, "y" : y });
		};
	};

	// contextmenu helper
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

		$.vakata.context = {
			settings : {
				hide_onmouseleave	: 0,
				icons				: true
			},
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
			_parse : function (o, is_callback) {
				if(!o) { return false; }
				if(!is_callback) {
					vakata_context.html		= "";
					vakata_context.items	= [];
				}
				var str = "",
					sep = false,
					tmp;

				if(is_callback) { str += "<"+"ul>"; }
				$.each(o, function (i, val) {
					if(!val) { return true; }
					vakata_context.items.push(val);
					if(!sep && val.separator_before) {
						str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
					}
					sep = false;
					str += "<"+"li class='" + (val._class || "") + (val._disabled ? " vakata-contextmenu-disabled " : "") + "'>";
					str += "<"+"a href='#' rel='" + (vakata_context.items.length - 1) + "'>";
					if($.vakata.context.settings.icons) {
						str += "<"+"ins ";
						if(val.icon) {
							if(val.icon.indexOf("/") !== -1)	{ str += " style='background:url(\"" + val.icon + "\") center center no-repeat' "; }
							else								{ str += " class='" + val.icon + "' "; }
						}
						str += ">&#160;<"+"/ins><"+"span>&#160;<"+"/span>";
					}
					str += val.label + "<"+"/a>";
					if(val.submenu) {
						tmp = $.vakata.context._parse(val.submenu, true);
						if(tmp) { str += tmp; }
					}
					str += "<"+"/li>";
					if(val.separator_after) {
						str += "<"+"li class='vakata-context-separator'><"+"a href='#' " + ($.vakata.context.settings.icons ? '' : 'style="margin-left:0px;"') + ">&#160;<"+"/a><"+"/li>";
						sep = true;
					}
				});
				str  = str.replace(/<li class\='vakata-context-separator'\><\/li\>$/,"");
				if(is_callback) { str += "</ul>"; }
				if(!is_callback) { vakata_context.html = str; $.vakata.context._trigger("parse"); }
				return str.length > 10 ? str : false;
			},
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
						.find('a:eq(0)').focus().parent().addClass("vakata-context-hover");
					vakata_context.is_visible = true;
					$.vakata.context._trigger("show");
				}
			},
			hide : function () {
				if(vakata_context.is_visible) {
					vakata_context.element.hide().find("ul").hide().end().find(':focus').blur();
					vakata_context.is_visible = false;
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
			if(!$.jstree.no_css) {
				$('head').append('<style type="text/css">' + css_string + '</style>');
			}

			vakata_context.element = $("<ul class='vakata-context'></ul>");
			vakata_context.element
				.on("mouseenter", "li", function (e) {
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
						.parentsUntil(".vakata-context", "li").addBack().addClass("vakata-context-hover");
					$.vakata.context._show_submenu(this);
				})
				// тестово - дали не натоварва?
				.on("mouseleave", "li", function (e) {
					if($.contains(this, e.relatedTarget)) { return; }
					$(this).find(".vakata-context-hover").addBack().removeClass("vakata-context-hover");
				})
				.on("mouseleave", function (e) {
					$(this).find(".vakata-context-hover").removeClass("vakata-context-hover");
					if($.vakata.context.settings.hide_onmouseleave) {
						to = setTimeout(
							(function (t) {
								return function () { $.vakata.context.hide(); };
							})(this), $.vakata.context.settings.hide_onmouseleave);
					}
				})
				.on("click", "a", function (e) {
					e.preventDefault();
				})
				.on("mouseup", "a", function (e) {
					if(!$(this).blur().parent().hasClass("vakata-context-disabled") && $.vakata.context._execute($(this).attr("rel")) !== false) {
						$.vakata.context.hide();
					}
				})
				.on('keydown', 'a', function (e) {
						var o = null;
						switch(e.which) {
							case 13:
							case 32:
								e.type = "mouseup";
								e.preventDefault();
								$(e.currentTarget).trigger(e);
								break;
							case 37:
								if(vakata_context.is_visible) {
									vakata_context.element.find(".vakata-context-hover").last().parents("li:eq(0)").find("ul").hide().find(".vakata-context-hover").removeClass("vakata-context-hover").end().end().children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 38:
								if(vakata_context.is_visible) {
									o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").prevAll("li:not(.vakata-context-separator)").first();
									if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").last(); }
									o.addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 39:
								if(vakata_context.is_visible) {
									vakata_context.element.find(".vakata-context-hover").last().children("ul").show().children("li:not(.vakata-context-separator)").removeClass("vakata-context-hover").first().addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 40:
								if(vakata_context.is_visible) {
									o = vakata_context.element.find("ul:visible").addBack().last().children(".vakata-context-hover").removeClass("vakata-context-hover").nextAll("li:not(.vakata-context-separator)").first();
									if(!o.length) { o = vakata_context.element.find("ul:visible").addBack().last().children("li:not(.vakata-context-separator)").first(); }
									o.addClass("vakata-context-hover").children('a').focus();
									e.stopImmediatePropagation();
									e.preventDefault();
								}
								break;
							case 27:
								$.vakata.context.hide();
								e.preventDefault();
								break;
							default:
								//console.log(e.which);
								break;
						}
					})
				.appendTo("body");

			$(document)
				.on("mousedown", function (e) {
					if(vakata_context.is_visible && !$.contains(vakata_context.element[0], e.target)) { $.vakata.context.hide(); }
				})
				.on("context_show.vakata", function (e, data) {
					vakata_context.element.find("li:has(ul)").children("a").addClass("vakata-context-parent");
					if(right_to_left) {
						vakata_context.element.addClass("vakata-context-rtl").css("direction", "rtl");
					}
					// also apply a RTL class?
					vakata_context.element.find("ul").hide().end();
				});
		});
	})($);
	$.jstree.defaults.plugins.push("contextmenu");
})(jQuery);
/**
 * ### Drag'n'drop plugin
 */
(function ($) {
	$.jstree.defaults.dnd = {
		copy : true,
		open_timeout : 500
	};
	// TODO: now check works by checking for each node individually, how about max_children, unique, etc?
	// TODO: drop somewhere else - maybe demo only?
	$.jstree.plugins.dnd = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('mousedown', 'a', $.proxy(function (e) {
					var obj = this.get_node(e.target),
						mlt = this.is_selected(obj) ? this.get_selected().length : 1;
					if(obj && obj.id && obj.id !== "#" && e.which === 1) {
						this.element.trigger('mousedown.jstree');
						return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : this.get_node(obj,true), 'nodes' : mlt > 1 ? this.get_selected() : [obj] }, '<div id="jstree-dnd" class="jstree-' + this.get_theme() + '"><i class="jstree-icon jstree-er"></i>' + (mlt > 1 ? mlt + ' ' + this.get_string('nodes') : this.get_text(e.currentTarget, true)) + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
					}
				}, this));
		};
	};

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

				var ins = $.jstree.reference(data.event.target),
					ref = false,
					off = false,
					rel = false,
					l, t, h, p, i, o, ok, t1, t2;
				// if we are over an instance
				if(ins && ins._data && ins._data.dnd) {
					marker.attr('class', 'jstree-' + ins.get_theme());
					data.helper
						.children().attr('class', 'jstree-' + ins.get_theme())
						.find('.jstree-copy:eq(0)')[ data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? 'show' : 'hide' ]();


					// if are hovering the container itself add a new root node
					if(data.event.target === ins.element[0] || data.event.target === ins.get_container_ul()[0]) {
						ok = true;
						for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
							ok = ok && ins.check( (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? "copy_node" : "move_node"), data.data.nodes[t1], '#', 'last');
							if(!ok) { break; }
						}
						if(ok) {
							lastmv = { 'ins' : ins, 'par' : '#', 'pos' : 'last' };
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
										t = off.top - 5 + h + 0;
										p = ins.get_parent(ref);
										i = ref.parent().index() + 1;
										break;
								}
								/*!
								// TODO: moving inside, but the node is not yet loaded?
								// the check will work anyway, as when moving the node will be loaded first and checked again
								if(v === 'i' && !ins.is_loaded(p)) { }
								*/
								ok = true;
								for(t1 = 0, t2 = data.data.nodes.length; t1 < t2; t1++) {
									ok = ok && ins.check(( data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? "copy_node" : "move_node"),data.data.nodes[t1], p, i);
									if(!ok) { break; }
								}
								if(ok) {
									if(v === 'i' && ref.parent().is('.jstree-closed') && ins.settings.dnd.open_timeout) {
										opento = setTimeout((function (x, z) { return function () { x.open_node(z); }; })(ins, ref), ins.settings.dnd.open_timeout);
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
					lastmv.ins[ data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? 'copy_node' : 'move_node' ]
						(data.data.nodes, lastmv.par, lastmv.pos);
				}
			})
			.bind('keyup keydown', function (e, data) {
				data = $.vakata.dnd._get();
				if(data.data && data.data.jstree) {
					data.helper.find('.jstree-copy:eq(0)')[ data.data.origin.settings.dnd.copy && (e.metaKey || e.ctrlKey) ? 'show' : 'hide' ]();
				}
			});
	});

	// include the dnd plugin by default
	$.jstree.defaults.plugins.push("dnd");
})(jQuery);

// helpers
(function ($) {
	$.fn.vakata_reverse = [].reverse;
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
	$.vakata.dnd = {
		settings : {
			scroll_speed		: 10,
			scroll_proximity	: 20,
			helper_left			: 5,
			helper_top			: 10,
			threshold			: 5
		},
		_trigger : function (event_name, e) {
			var data = $.vakata.dnd._get();
			data.event = e;
			$(document).triggerHandler("dnd_" + event_name + ".vakata", data);
		},
		_get : function () {
			return {
				"data"		: vakata_dnd.data,
				"element"	: vakata_dnd.element,
				"helper"	: vakata_dnd.helper
			};
		},
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
				.parentsUntil("body").addBack().vakata_reverse()
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
			$.vakata.dnd._trigger("move", e);
		},
		stop : function (e) {
			if(vakata_dnd.is_drag) {
				$.vakata.dnd._trigger("stop", e);
			}
			$.vakata.dnd._clean();
		}
	};
})(jQuery);

/**
 * ### Search plugin
 */
(function ($) {
	$.jstree.defaults.search = {
		ajax : false,
		fuzzy : true,
		case_sensitive : false,
		show_only_matches : false
	};

	$.jstree.plugins.search = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this._data.search.str = "";
			this._data.search.dom = $();
			this._data.search.res = [];

			if(this.settings.search.show_only_matches || true) {
				this.element
					.on("search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
							data.nodes.parentsUntil(".jstree").addBack().show()
								.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
						}
					})
					.on("clear_search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").css("display","").filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
						}
					});
			}
		};
		this.search = function (str, skip_async) {
			if(str === false || $.trim(str) === "") {
				return this.clear_search();
			}
			var s = this.settings.search,
				a = s.ajax ? $.extend({}, s.ajax) : false,
				t = this,
				f = null,
				r = [],
				p = [], i, j;
			if(this._data.search.res.length) {
				this.clear_search();
			}
			if(!skip_async && a !== false) {
				if(!a.data) { a.data = {}; }
				a.data.str = str;
				return $.ajax(s.ajax).done($.proxy(function (d) {
					this._search_load(d, str);
				}, this));
			}
			this._data.search.str = str;
			this._data.search.dom = $();
			this._data.search.res = [];

			f = new $.vakata.search(str, true, { caseSensitive : s.case_sensitive, fuzzy : s.fuzzy });

			$.each(this._model.data, function (i, v) {
				if(v.text && f.search(v.text).isMatch) {
					r.push(i);
					p = p.concat(v.parents);
				}
			});
			if(r.length) {
				p = $.vakata.array_unique(p);
				this._search_open(p);
				for(i = 0, j = r.length; i < j; i++) {
					f = this.get_node(r[i], true);
					if(f) {
						this._data.search.dom = this._data.search.dom.add(f);
					}
				}
				this._data.search.res = r;
				this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
			}
			this.trigger('search', { nodes : this._data.search.dom, str : str, res : this._data.search.res });
		};
		this.clear_search = function () {
			this._data.search.dom.children(".jstree-anchor").removeClass("jstree-search");
			this.trigger('clear_search', { 'nodes' : this._data.search.dom, str : this._data.search.str, res : this._data.search.res });
			this._data.search.str = "";
			this._data.search.res = [];
			this._data.search.dom = $();
		};
		this._search_open = function (d) {
			var t = this;
			$.each(d.concat([]), function (i, v) {
				v = document.getElementById(v);
				if(v) {
					if(t.is_closed(v)) {
						t.open_node(v, function () { t._search_open(d); });
					}
				}
			});
		};
		this._search_load = function (d, str) {
			var res = true,
				t = this,
				m = t._model.data;
			$.each(d.concat([]), function (i, v) {
				if(m[v]) {
					if(!m[v].state.loaded) {
						t.load_node(v, function () { t._search_load(d, str); });
						res = false;
					}
				}
			});
			if(res) {
				this.search(str, true);
			}
		};
	};

	// include the json plugin by default
	$.jstree.defaults.plugins.push("search");
})(jQuery);

(function ($) {
	// from http://kiro.me/projects/fuse.html
	$.vakata.search = function(pattern, txt, options) {
		options = options || {};
		if(options.fuzzy !== false) {
			options.fuzzy = true;
		}
		pattern = options.caseSensitive ? pattern : pattern.toLowerCase();
		var MATCH_LOCATION	= options.location || 0,
			MATCH_DISTANCE	= options.distance || 100,
			MATCH_THRESHOLD	= options.threshold || 0.6,
			patternLen = pattern.length;
		if(patternLen > 32) {
			options.fuzzy = false;
		}
		if(options.fuzzy) {
			var matchmask = 1 << (patternLen - 1);
			var pattern_alphabet = (function () {
				var mask = {},
					i = 0;
				for (i = 0; i < patternLen; i++) {
					mask[pattern.charAt(i)] = 0;
				}
				for (i = 0; i < patternLen; i++) {
					mask[pattern.charAt(i)] |= 1 << (patternLen - i - 1);
				}
				return mask;
			})();
			var match_bitapScore = function (e, x) {
				var accuracy = e / patternLen,
					proximity = Math.abs(MATCH_LOCATION - x);
				if(!MATCH_DISTANCE) {
					return proximity ? 1.0 : accuracy;
				}
				return accuracy + (proximity / MATCH_DISTANCE);
			};
		}
		var search = function (text) {
			text = options.caseSensitive ? text : text.toLowerCase();
			if(pattern === text || text.indexOf(pattern) !== -1) {
				return {
					isMatch: true,
					score: 0
				};
			}
			if(!options.fuzzy) {
				return {
					isMatch: false,
					score: 1
				};
			}
			var i, j,
				textLen = text.length,
				scoreThreshold = MATCH_THRESHOLD,
				bestLoc = text.indexOf(pattern, MATCH_LOCATION),
				binMin, binMid,
				binMax = patternLen + textLen,
				lastRd, start, finish, rd, charMatch,
				score = 1,
				locations = [];
			if (bestLoc !== -1) {
				scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
				bestLoc = text.lastIndexOf(pattern, MATCH_LOCATION + patternLen);
				if (bestLoc !== -1) {
					scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
				}
			}
			bestLoc = -1;
			for (i = 0; i < patternLen; i++) {
				binMin = 0;
				binMid = binMax;
				while (binMin < binMid) {
					if (match_bitapScore(i, MATCH_LOCATION + binMid) <= scoreThreshold) {
						binMin = binMid;
					} else {
						binMax = binMid;
					}
					binMid = Math.floor((binMax - binMin) / 2 + binMin);
				}
				binMax = binMid;
				start = Math.max(1, MATCH_LOCATION - binMid + 1);
				finish = Math.min(MATCH_LOCATION + binMid, textLen) + patternLen;
				rd = new Array(finish + 2);
				rd[finish + 1] = (1 << i) - 1;
				for (j = finish; j >= start; j--) {
					charMatch = pattern_alphabet[text.charAt(j - 1)];
					if (i === 0) {
						rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
					} else {
						rd[j] = ((rd[j + 1] << 1) | 1) & charMatch | (((lastRd[j + 1] | lastRd[j]) << 1) | 1) | lastRd[j + 1];
					}
					if (rd[j] & matchmask) {
						score = match_bitapScore(i, j - 1);
						if (score <= scoreThreshold) {
							scoreThreshold = score;
							bestLoc = j - 1;
							locations.push(bestLoc);
							if (bestLoc > MATCH_LOCATION) {
								start = Math.max(1, 2 * MATCH_LOCATION - bestLoc);
							} else {
								break;
							}
						}
					}
				}
				if (match_bitapScore(i + 1, MATCH_LOCATION) > scoreThreshold) {
					break;
				}
				lastRd = rd;
			}
			return {
				isMatch: bestLoc >= 0,
				score: score
			};
		};
		return txt === true ? { 'search' : search } : search(txt);
	};
})(jQuery);
/**
 * ### Sort plugin
 */
(function ($) {
	$.jstree.defaults.sort = function (a, b) {
		return this.get_type(a) === this.get_type(b) ? (this.get_text(a) > this.get_text(b) ? 1 : -1) : this.get_type(a) >= this.get_type(b);
	};
	$.jstree.plugins.sort = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on("model.jstree", $.proxy(function (e, data) {
						this.sort(data.parent, true);
					}, this))
				.on("rename_node.jstree create_node.jstree", $.proxy(function (e, data) {
						this.sort(data.parent || data.node.parent, false);
						this.redraw_node(data.parent || data.node.parent, true);
					}, this))
				.on("move_node.jstree copy_node.jstree", $.proxy(function (e, data) {
						this.sort(data.parent, false);
						this.redraw_node(data.parent, true);
					}, this));
		};
		this.sort = function (obj, deep) {
			obj = this.get_node(obj);
			if(obj && obj.children && obj.children.length) {
				obj.children.sort($.proxy(this.settings.sort, this));
				if(deep) {
					for(var i = 0, j = obj.children_d.length; i < j; i++) {
						this.sort(obj.children_d[i], false);
					}
				}
			}
		};
	};

	// include the sort plugin by default
	$.jstree.defaults.plugins.push("sort");
})(jQuery);
/**
 * ### State plugin
 */
(function ($) {
	var to = false;

	$.jstree.defaults.state = {
		key		: 'jstree',
		events	: 'changed.jstree open_node.jstree close_node.jstree',
		ttl		: false
	};
	$.jstree.plugins.state = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on("ready.jstree", $.proxy(function (e, data) {
						this.element.one("restore_state.jstree set_state.jstree", $.proxy(function () {
							this.element.on(this.settings.state.events, $.proxy(function () {
								if(to) { clearTimeout(to); }
								to = setTimeout($.proxy(function () { this.save_state(); }, this), 100);
							}, this));
						}, this));
						this.restore_state();
					}, this));
		};
		this.save_state = function () {
			$.vakata.storage.set(this.settings.state.key, this.get_state(), this.settings.state.ttl);
		};
		this.restore_state = function () {
			var k = $.vakata.storage.get(this.settings.state.key);

			if(!!k) { this.set_state(k); }
			this.trigger('restore_state', { 'state' : k });
		};
		this.clear_state = function () {
			return $.vakata.storage.del(this.settings.state.key);
		};
	};

	// include the state plugin by default
	$.jstree.defaults.plugins.push("state");
})(jQuery);

(function ($) {
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
		encode : (JSON && JSON.stringify ? JSON.stringify : function (o) {
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
		}),
		decode : (JSON && JSON.parse ? JSON.parse : function (json) {
			return $.parseJSON(json);
		})
	};
})(jQuery);

(function ($, document, undefined) {
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
		if ($.vakata.cookie(key) !== null) {
			$.vakata.cookie(key, null, options);
			return true;
		}
		return false;
	};
})(jQuery, document);

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

/**
 * ### Types plugin
 */
(function ($) {
	$.jstree.defaults.types = {
		'#' : {},
		'default' : {}
	};

	$.jstree.plugins.types = function (options, parent) {
		this.init = function (el, options) {
			parent.init.call(this, el, options);
			this._model.data['#'].type = '#';
		};
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.on('model.jstree', $.proxy(function (e, data) {
						var m = this._model.data,
							dpc = data.nodes,
							t = this.settings.types,
							i, j, c = 'default';
						for(i = 0, j = dpc.length; i < j; i++) {
							c = 'default';
							if(m[dpc[i]].original && m[dpc[i]].original.type && t[m[dpc[i]].original.type]) {
								c = m[dpc[i]].original.type;
							}
							if(m[dpc[i]].data && m[dpc[i]].data.jstree && m[dpc[i]].data.jstree.type && t[m[dpc[i]].data.jstree.type]) {
								c = m[dpc[i]].data.jstree.type;
							}
							m[dpc[i]].type = c;
							if(m[dpc[i]].icon === true && t[c].icon) {
								m[dpc[i]].icon = t[c].icon;
							}
						}
					}, this));
		};
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var m = this._model.data, tmp, d;
			switch(chk) {
				case "create_node":
				case "move_node":
				case "copy_node":
					if(chk !== 'move_node' || $.inArray(obj.id, par.children) === -1) {
						tmp = this.get_rules(par);
						if(typeof tmp.max_children !== 'undefined' && tmp.max_children !== -1 && tmp.max_children === par.children.length) {
							return false;
						}
						if(typeof tmp.valid_children !== 'undefined' && tmp.valid_children !== -1 && $.inArray(obj.type, tmp.valid_children) === -1) {
							return false;
						}
						if(obj.children_d && obj.parents) {
							d = 0;
							for(var i = 0, j = obj.children_d.length; i < j; i++) {
								d = Math.max(d, m[obj.children_d[i]].parents.length);
							}
							d = d - obj.parents.length + 1;
						}
						if(d <= 0) { d = 1; }
						do {
							if(typeof tmp.max_depth !== 'undefined' && tmp.max_depth !== -1 && tmp.max_depth < d) {
								return false;
							}
							par = this.get_node(par.parent);
							tmp = this.get_rules(par);
							d++;
						} while(par);
					}
					break;
			}
			return true;
		};
		this.get_rules = function (obj) {
			obj = this.get_node(obj);
			if(!obj) { return false; }
			var tmp = this.get_type(obj, true);
			if(typeof tmp.max_depth === 'undefined') { tmp.max_depth = -1; }
			if(typeof tmp.max_children === 'undefined') { tmp.max_children = -1; }
			if(typeof tmp.valid_children === 'undefined') { tmp.valid_children = -1; }
			return tmp;
		};
		this.get_type = function (obj, rules) {
			obj = this.get_node(obj);
			return (!obj) ? false : ( rules ? $.extend({ 'type' : obj.type }, this.settings.types[obj.type]) : obj.type);
		};
		this.set_type = function (obj, type) {
			if($.isArray(obj)) {
				for(var t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_type(obj[t1], type);
				}
				return true;
			}
			var t = this.settings.types;
			obj = this.get_node(obj);
			if(!t[type] || !obj) { return false; }
			obj.type = type;
			if(t[type].icon && this.get_icon(obj) === true) {
				this.set_icon(obj, t[type].icon);
			}
			return true;
		};
	};
	// include the types plugin by default
	$.jstree.defaults.plugins.push("types");
})(jQuery);
/**
 * ### Unique plugin
 */
(function ($) {
	$.jstree.plugins.unique = function (options, parent) {
		this.check = function (chk, obj, par, pos) {
			if(parent.check.call(this, chk, obj, par, pos) === false) { return false; }
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			if(!par || !par.children) { return true; }
			var n = chk === "rename_node" ? pos : obj.text,
				c = [],
				m = this._model.data;
			for(var i = 0, j = par.children.length; i < j; i++) {
				c.push(m[par.children[i]].text);
			}
			switch(chk) {
				case "delete_node":
					return true;
				case "rename_node":
				case "copy_node":
					return ($.inArray(n, c) === -1);
				case "move_node":
					return (obj.parent === par.id || $.inArray(n, c) === -1);
			}
			return true;
		};
	};

	// include the unique plugin by default
	$.jstree.defaults.plugins.push("unique");
})(jQuery);

/**
 * ### Wholerow plugin
 */
(function ($) {
	var div = document.createElement('DIV');
	div.setAttribute('unselectable','on');
	div.className = 'jstree-wholerow';
	div.innerHTML = '&#160;';
	$.jstree.plugins.wholerow = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('loading', $.proxy(function () {
						div.style.height = this._data.core.li_height + 'px';
					}, this))
				.on('ready.jstree set_state.jstree', $.proxy(function () {
						this.hide_dots();
					}, this))
				.on("ready.jstree", $.proxy(function () {
						this.get_container_ul().addClass('jstree-wholerow-ul');
					}, this))
				.on("deselect_all.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
					}, this))
				.on("changed.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
						var tmp = false;
						for(var i = 0, j = data.selected.length; i < j; i++) {
							tmp = this.get_node(data.selected[i], true);
							if(tmp && tmp.length) {
								tmp.children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
							}
						}
					}, this))
				.on("open_node.jstree", $.proxy(function (e, data) {
						this.get_node(data.node, true).find('.jstree-clicked').parent().children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
					}, this))
				.on("hover_node.jstree dehover_node.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-hovered').removeClass('jstree-wholerow-hovered');
						if(e.type === "hover_node") {
							this.get_node(data.node, true).each(function () {
								$(this).children('.jstree-wholerow').addClass('jstree-wholerow-hovered');
							});
						}
					}, this))
				.on("contextmenu.jstree", ".jstree-wholerow", $.proxy(function (e) {
						//if(typeof this._data.contextmenu !== 'undefined') {
							e.preventDefault();
							$(e.currentTarget).closest("li").children("a:eq(0)").trigger('contextmenu',e);
						//}
					}, this))
				.on("click.jstree", ".jstree-wholerow", function (e) {
						e.stopImmediatePropagation();
						var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger(tmp).focus();
					})
				.on("click.jstree", ".jstree-leaf > .jstree-ocl", $.proxy(function (e) {
						e.stopImmediatePropagation();
						var tmp = $.Event('click', { metaKey : e.metaKey, ctrlKey : e.ctrlKey, altKey : e.altKey, shiftKey : e.shiftKey });
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger(tmp).focus();
					}, this))
				.on("mouseover.jstree", ".jstree-wholerow, .jstree-icon", $.proxy(function (e) {
						e.stopImmediatePropagation();
						//if($(e.currentTarget).closest('li').children(".jstree-clicked").length) {
						//	return false;
						//}
						this.hover_node(e.currentTarget);
						return false;
					}, this))
				.on("mouseleave.jstree", "li", $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		};
		this.teardown = function () {
			if(this.settings.wholerow) {
				this.element.find(".jstree-wholerow").remove();
				parent.teardown.call(this);
			}
		};
		this.redraw_node = function(obj, deep, callback) {
			obj = parent.redraw_node.call(this, obj, deep, callback);
			if(obj) {
				var tmp = div.cloneNode(true);
				//tmp.style.height = this._data.core.li_height + 'px';
				if($.inArray(obj.id, this._data.core.selected) !== -1) { tmp.className += ' jstree-wholerow-clicked'; }
				obj.insertBefore(tmp, obj.childNodes[0]);
			}
			return obj;
		};
	};
	// include the wholerow plugin by default
	//$.jstree.defaults.plugins.push("wholerow");
})(jQuery);
