/**
 * ### Search plugin
 */
(function ($) {
	$.jstree.defaults.search = {
		ajax : false,
		case_sensitive : false,
		show_only_matches : true
	};

	$.jstree.plugins.search = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this._data.search.str = "";
			this._data.search.res = $();

			if(this.settings.search.show_only_matches) {
				this.element
					.on("search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).children("ul").find("li").hide().removeClass("jstree-last");
							data.nodes.parentsUntil(".jstree").addBack().show()
								.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
						}
					})
					.on("clear_search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).children("ul").find("li").css("display","").end().end().jstree("correct_node", -1, true);
						}
					});
			}
		};
		this.search = function (str, skip_async) {
			if(str === false || $.trim(str) === "") {
				return this.clear_search();
			}
			var s = this.settings.search,
				t = this;

			if(!skip_async && s.ajax !== false && this.get_container_ul().find("li.jstree-closed:not(:has(ul)):eq(0)").length > 0) {
				s.ajax.success = $.proxy(function (d, t, x) {
					var s = this.settings.search.ajax;
					if($.isFunction(s.success)) {
						d = s.success.call(this, d, t, x) || d;
					}
					this._search_open(d, str);
				}, this);
				s.ajax.error = $.proxy(function (x, t, e) {
					var s = this.settings.search.ajax;
					if($.isFunction(s.error)) {
						s.error.call(this, x, t, e);
					}
					// do stuff
				}, this);
				if(!s.ajax.dataType) {
					s.ajax.dataType = "json";
				}
				if($.isFunction(s.ajax.url)) {
					s.ajax.url	= s.ajax.url.call(this, str);
				}
				if($.isFunction(s.ajax.data)) {
					s.ajax.data	= s.ajax.data.call(this, str);
				}
				else {
					if(!s.ajax.data) { s.ajax.data = {}; }
					s.ajax.data.str = str;
				}
				$.ajax(s.ajax);
				return;
			}
			if(this._data.search.res.length) {
				this.clear_search();
			}
			this._data.search.str = str;
			this._data.search.res = this._search(str);

			this._data.search.res.addClass("jstree-search").parent().parentsUntil(".jstree", ".jstree-closed").each(function () {
				t.open_node(this, false, 0);
			});
			this.trigger('search', { nodes : this._data.search.res, str : str });
		};
		this.clear_search = function () {
			this._data.search.res.removeClass("jstree-search");
			this.trigger('clear_search', { 'nodes' : this._data.search.res, str : this._data.search.str });
			this._data.search.str = "";
			this._data.search.res = $();
		};
		this._search = function (str) {
			str = this.settings.search.case_sensitive ? str : str.toLowerCase();

			if(this.settings.json && this.settings.json.progressive_render) {
				this.get_container_ul().find("li.jstree-closed:not(:has(ul))").each($.proxy(function (i, v) {
					if(this._search_data(str, $(v).data('jstree'))) {
						this.open_node(v, false, 0);
					}
				}, this));
			}
			return this.element.find(".jstree-anchor:" + (this.settings.search.case_sensitive ? 'contains' : 'vakata_icontains') + "(" + str + ")");
		};
		this._search_data = function (str, d) {
			if(!d || !d.children || !$.isArray(d.children)) {
				return false;
			}
			var res = false;
			$.each(d.children, $.proxy(function (i, v) {
				var t = typeof v === "string" ? v : v.title,
					u;
				t = this.settings.search.case_sensitive ? t : t.toLowerCase();
				u = t.indexOf(str) !== -1 || this._search_data(str, v);
				if(u) {
					if(!d.data) {
						d.data = {};
					}
					if(!d.data.jstree) {
						d.data.jstree = {};
					}
					d.data.jstree.opened = true;
				}
				res = res || u;
			}, this));
			return res;
		};
		this._search_open = function (d, str) {
			var res = true,
				t = this;
			$.each(d.concat([]), function (i, v) {
				v = document.getElementById(v);
				if(v) {
					if(t.is_loaded(v)) {
						if(t.is_closed(v)) {
							t.open_node(v, false, 0);
						}
						$.vakata.array_remove(d, i);
					}
					else {
						if(!t.is_loading(v)) {
							t.open_node(v, $.proxy(function () { this._search_open(d, str); }, t), 0);
						}
						res = false;
					}
				}
			});
			if(res) {
				this.search(str, true);
			}
		};
	};

	// helper for case-insensitive search
	$.expr[':'].vakata_icontains = $.expr.createPseudo(function(search) {
		return function(a) {
			return (a.textContent || a.innerText || "").toLowerCase().indexOf(search.toLowerCase())>=0;
		};
	});

	// include the json plugin by default
	$.jstree.defaults.plugins.push("search");
})(jQuery);
