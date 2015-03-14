/**
 * ### Search plugin
 *
 * Adds search functionality to jsTree.
 */
/*globals jQuery, define, exports, require, document */
(function (factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define('jstree.search', ['jquery','jstree'], factory);
	}
	else if(typeof exports === 'object') {
		factory(require('jquery'), require('jstree'));
	}
	else {
		factory(jQuery, jQuery.jstree);
	}
}(function ($, jstree, undefined) {
	"use strict";

	if($.jstree.plugins.search) { return; }

	/**
	 * stores all defaults for the search plugin
	 * @name $.jstree.defaults.search
	 * @plugin search
	 */
	$.jstree.defaults.search = {
		/**
		 * a jQuery-like AJAX config, which jstree uses if a server should be queried for results.
		 *
		 * A `str` (which is the search string) parameter will be added with the request, an optional `inside` parameter will be added if the search is limited to a node id. The expected result is a JSON array with nodes that need to be opened so that matching nodes will be revealed.
		 * Leave this setting as `false` to not query the server. You can also set this to a function, which will be invoked in the instance's scope and receive 3 parameters - the search string, the callback to call with the array of nodes to load, and the optional node ID to limit the search to
		 * @name $.jstree.defaults.search.ajax
		 * @plugin search
		 */
		ajax : false,
		/**
		 * Indicates if the search should be fuzzy or not (should `chnd3` match `child node 3`). Default is `false`.
		 * @name $.jstree.defaults.search.fuzzy
		 * @plugin search
		 */
		fuzzy : false,
		/**
		 * Indicates if the search should be case sensitive. Default is `false`.
		 * @name $.jstree.defaults.search.case_sensitive
		 * @plugin search
		 */
		case_sensitive : false,
		/**
		 * Indicates if the tree should be filtered (by default) to show only matching nodes (keep in mind this can be a heavy on large trees in old browsers).
		 * This setting can be changed at runtime when calling the search method. Default is `false`.
		 * @name $.jstree.defaults.search.show_only_matches
		 * @plugin search
		 */
		show_only_matches : false,
		/**
		 * Indicates if all nodes opened to reveal the search result, should be closed when the search is cleared or a new search is performed. Default is `true`.
		 * @name $.jstree.defaults.search.close_opened_onclear
		 * @plugin search
		 */
		close_opened_onclear : true,
		/**
		 * Indicates if only leaf nodes should be included in search results. Default is `false`.
		 * @name $.jstree.defaults.search.search_leaves_only
		 * @plugin search
		 */
		search_leaves_only : false,
		/**
		 * If set to a function it wil be called in the instance's scope with two arguments - search string and node (where node will be every node in the structure, so use with caution).
		 * If the function returns a truthy value the node will be considered a match (it might not be displayed if search_only_leaves is set to true and the node is not a leaf). Default is `false`.
		 * @name $.jstree.defaults.search.search_callback
		 * @plugin search
		 */
		search_callback : false,
		/**
		 * Indicates if the search should be delayed/debounced. Value must be a number of milliseconds or `false`.
		 * Can improve performance when searching large data sets. Default is `false`.
		 * @name $.jstree.defaults.search.delay
		 * @plugin search
		 */
		delay: false
	};

	$.jstree.plugins.search = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this._data.search.str = "";
			this._data.search.dom = $();
			this._data.search.res = [];
			this._data.search.opn = [];
			this._data.search.som = false;

			this.element
				.on('before_open.jstree', $.proxy(function (e, data) {
						var i, j, f, r = this._data.search.res, s = [], o = $();
						if(r && r.length) {
							this._data.search.dom = $(this.element[0].querySelectorAll('#' + $.map(r, function (v) { return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex,'\\$&') : v.replace($.jstree.idregex,'\\$&'); }).join(', #')));
							this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
							if(this._data.search.som && this._data.search.res.length) {
								for(i = 0, j = r.length; i < j; i++) {
									s = s.concat(this.get_node(r[i]).parents);
								}
								s = $.vakata.array_remove_item($.vakata.array_unique(s),'#');
								o = s.length ? $(this.element[0].querySelectorAll('#' + $.map(s, function (v) { return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex,'\\$&') : v.replace($.jstree.idregex,'\\$&'); }).join(', #'))) : $();

								this.element.find(".jstree-node").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
								o = o.add(this._data.search.dom);
								o.parentsUntil(".jstree").addBack().show()
									.filter(".jstree-children").each(function () { $(this).children(".jstree-node:visible").eq(-1).addClass("jstree-last"); });
							}
						}
					}, this))
				.on("search.jstree", $.proxy(function (e, data) {
						if(this._data.search.som) {
							if(data.nodes.length) {
								this.element.find(".jstree-node").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
								data.nodes.parentsUntil(".jstree").addBack().show()
									.filter(".jstree-children").each(function () { $(this).children(".jstree-node:visible").eq(-1).addClass("jstree-last"); });
							}
						}
					}, this))
				.on("clear_search.jstree", $.proxy(function (e, data) {
						if(this._data.search.som && data.nodes.length) {
							this.element.find(".jstree-node").css("display","").filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
						}
					}, this));
		};
		/**
		 * used to search the tree nodes for a given string
		 * @name search(str [, skip_async])
		 * @param {String} str the search string
		 * @param {Boolean} skip_async if set to true server will not be queried even if configured
		 * @param {Boolean} show_only_matches if set to true only matching nodes will be shown (keep in mind this can be very slow on large trees or old browsers)
		 * @param {mixed} inside an optional node to whose children to limit the search
		 * @param {Boolean} append if set to true the results of this search are appended to the previous search
		 * @plugin search
		 * @trigger search.jstree
		 */
		this.search = function (str, skip_async, show_only_matches, inside, append) {
			var searchOptions = this.settings.search,
				search;

			search = $.proxy(this._search, this, str, skip_async, show_only_matches, inside, append);

			if (typeof searchOptions.delay === 'number') {
				this._debounce(search, searchOptions.delay)(); // debounced search
				return;
			}

			search(); // immediate search
		};

		/**
		 * Searches tree nodes for a given string. Used only internally.
		 * @private
		 * @name _search(str [, skip_async, show_only_matches, inside, append])
		 * @param {String} str the search string
		 * @param {Boolean} skip_async if set to true server will not be queried even if configured
		 * @param {Boolean} show_only_matches if set to true only matching nodes will be shown (keep in mind this can be very slow on large trees or old browsers)
		 * @param {Mixed} inside an optional node to whose children to limit the search
		 * @param {Boolean} append if set to true the results of this search are appended to the previous search
		 * @plugin search
		 */
		this._search = function (str, skip_async, show_only_matches, inside, append) {
			var searchOptions = this.settings.search,
				ajax = searchOptions.ajax || false,
				model = this._model.data,
				matches = [],
				parents = [],
				isMatch;

			if (str === false || $.trim(str.toString()) === '') {
				return this.clear_search();
			}

			if (this._data.search.res.length && !append) {
				this.clear_search();
			}

			if (show_only_matches === undefined) {
				show_only_matches = searchOptions.show_only_matches;
			}

			str = str.toString();
			inside = this.get_node(inside);
			inside = inside && inside.id ? inside.id : null;

			if (!skip_async && ajax !== false) {
				if ($.isFunction(ajax)) {
					return ajax.call(this, str, $.proxy(function (d) {
						if (d && d.d) {
							d = d.d;
						}
						this._load_nodes(!$.isArray(d) ? [] : $.vakata.array_unique(d), function () {
							this.search(str, true, show_only_matches, inside, append);
						}, true);
					}, this), inside);
				} else {
					ajax = $.extend({}, ajax);
					if (!ajax.data) {
						ajax.data = {};
					}
					ajax.data.str = str;
					if(inside) {
						a.data.inside = inside;
					}
					return $.ajax(ajax)
						.fail($.proxy(function () {
							this._data.core.last_error = {
								'error': 'ajax',
								'plugin': 'search',
								'id': 'search_01',
								'reason': 'Could not load search parents',
								'data': JSON.stringify(ajax)
							};
							this.settings.core.error.call(this, this._data.core.last_error);
						}, this))
						.done($.proxy(function (d) {
							if (d && d.d) {
								d = d.d;
							}
							this._load_nodes(!$.isArray(d) ? [] : $.vakata.array_unique(d), function () {
								this.search(str, true, show_only_matches, inside, append);
							}, true);
						}, this));
				}
			}

			this._data.search.str = str;
			this._data.search.dom = $();
			this._data.search.res = [];
			this._data.search.opn = [];
			this._data.search.som = show_only_matches;

			isMatch = this._isMatch(str, {
				caseSensitive: searchOptions.case_sensitive,
				fuzzy: searchOptions.fuzzy
			});

			$.each(model[inside ? inside : '#'].children_d, function (i, id) {
				var node = model[id];

				if (node.text && ((searchOptions.search_callback && searchOptions.search_callback.call(this, str, node)) ||
					(!searchOptions.search_callback && isMatch(node.text))) && (!searchOptions.search_leaves_only || (node.state.loaded && node.children.length === 0))) {

					matches.push(id);
					parents = parents.concat(node.parents);
				}
			});

			if (matches.length) {
				parents = $.vakata.array_unique(parents);
				this._search_open(parents);

				if (!append) {
					this._data.search.dom = $(this.element[0].querySelectorAll('#' + $.map(matches, function (v) {
						return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex, '\\$&') : v.replace($.jstree.idregex, '\\$&');
					}).join(', #')));
					this._data.search.res = matches;
				} else {
					this._data.search.dom = this._data.search.dom.add($(this.element[0].querySelectorAll('#' + $.map(matches, function (v) {
						return "0123456789".indexOf(v[0]) !== -1 ? '\\3' + v[0] + ' ' + v.substr(1).replace($.jstree.idregex,'\\$&') : v.replace($.jstree.idregex,'\\$&');
					}).join(', #'))));
					this._data.search.res = $.vakata.array_unique(this._data.search.res.concat(matches));
				}

				this._data.search.dom.children('.jstree-anchor').addClass('jstree-search');
			}

			/**
			 * triggered after search is complete
			 * @event
			 * @name search.jstree
			 * @param {jQuery} nodes a jQuery collection of matching nodes
			 * @param {String} str the search string
			 * @param {Array} res a collection of objects representing the matching nodes
			 * @plugin search
			 */
			this.trigger('search', {
				nodes: this._data.search.dom,
				str: str,
				res: this._data.search.res,
				show_only_matches: show_only_matches
			});
		};

		/**
		 * Finds the needle in a haystack where needle is user search query and haystack is jstree node's text property.
		 * Used only internally.
		 * @private
		 * @name _isMatch(needle, options)
		 * @param {String} needle User search query
		 * @param {Object} options Search options object
		 * @return {Boolean}
		 * @plugin search
		 */
		this._isMatch = function (needle, options) {
			var fuzzy = needle.length > 32 ? false : options.fuzzy,
				caseSensitive = options.caseSensitive;

			return function (haystack) {
				var charPos = -1; // remember position of last found character

				haystack = caseSensitive ? haystack : haystack.toLowerCase();

				if (needle === haystack || haystack.indexOf(needle) !== -1) {
					return true;
				}

				if (fuzzy) {
			        // consider each search character one at a time
			        for (var i = 0; i < needle.length; i++) {
			            var l = needle[i];

			            if (l === ' ') {
			            	continue; // ignore spaces
			            }

			            charPos = haystack.indexOf(l, charPos + 1); // search for character & update position to search from

			            if (charPos === -1) {
			            	return false;
			            }
			        }

					return true;
				}

				return false;
			};
		};

		/**
		 * Debounce function to delay search, from https://github.com/rhysbrettbowen/debounce. Used only internally.
		 * @private
		 * @name _debounce(func, wait)
		 * @param {Function} func A function to debounce
		 * @param {Number} wait Number of milliseconds to delay function call
		 * @return {Function} Function that will run after a specified `wait` period
		 * @plugin search
		 */
		this._debounce = function (func, wait) {
			// we need to save these in the closure
			var timeout, args, context, timestamp;

			return function () {
				// save details of latest call
				context = this;
				args = [].slice.call(arguments, 0);
				timestamp = new Date();

				// this is where the magic happens
				var later = function () {

					// how long ago was the last call
					var last = (new Date()) - timestamp;

					// if the latest call was less that the wait period ago
					// then we reset the timeout to wait for the difference
					if (last < wait) {
						timeout = setTimeout(later, wait - last);

					// or if not we can null out the timer and run the latest
					} else {
						timeout = null;
						func.apply(context, args);
					}
				};

				// we only need to set the timer now if one isn't already running
				if (!timeout) {
					timeout = setTimeout(later, wait);
				}
			};
		};
		/**
		 * used to clear the last search (removes classes and shows all nodes if filtering is on)
		 * @name clear_search()
		 * @plugin search
		 * @trigger clear_search.jstree
		 */
		this.clear_search = function () {
			this._data.search.dom.children(".jstree-anchor").removeClass("jstree-search");
			if(this.settings.search.close_opened_onclear) {
				this.close_node(this._data.search.opn, 0);
			}
			/**
			 * triggered after search is complete
			 * @event
			 * @name clear_search.jstree
			 * @param {jQuery} nodes a jQuery collection of matching nodes (the result from the last search)
			 * @param {String} str the search string (the last search string)
			 * @param {Array} res a collection of objects represeing the matching nodes (the result from the last search)
			 * @plugin search
			 */
			this.trigger('clear_search', { 'nodes' : this._data.search.dom, str : this._data.search.str, res : this._data.search.res });
			this._data.search.str = "";
			this._data.search.res = [];
			this._data.search.opn = [];
			this._data.search.dom = $();
		};
		/**
		 * opens nodes that need to be opened to reveal the search results. Used only internally.
		 * @private
		 * @name _search_open(d)
		 * @param {Array} d an array of node IDs
		 * @plugin search
		 */
		this._search_open = function (d) {
			var t = this;
			$.each(d.concat([]), function (i, v) {
				if(v === "#") { return true; }
				try { v = $('#' + v.replace($.jstree.idregex,'\\$&'), t.element); } catch(ignore) { }
				if(v && v.length) {
					if(t.is_closed(v)) {
						t._data.search.opn.push(v[0].id);
						t.open_node(v, function () { t._search_open(d); }, 0);
					}
				}
			});
		};
	};

	// include the search plugin by default
	// $.jstree.defaults.plugins.push("search");
}));
