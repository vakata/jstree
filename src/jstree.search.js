(function ($) {
	$.jstree.defaults.search = {
		ajax : false,
		search_method : "vakata_icontains",
		show_only_matches : true
	};

	$.jstree.plugins.search = function (options, parent) {
		this.init = function (el, options) {
			if(options.json) {
				options.json.progressive_unload = false;
				options.json.progressive_render = false;
			}
			parent.init.call(this, el, options);
		};
		this.bind = function () {
			parent.bind.call(this);

			this._data.search.str = "";
			this._data.search.res = $();

			if(this.settings.search.show_only_matches) {
				this.element
					.on("search.jstree", function (e, data) {
						$(this).children("ul").find("li").hide().removeClass("jstree-last");
						data.nodes.parentsUntil(".jstree").addBack().show()
							.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
					})
					.on("clear_search.jstree", function () {
						$(this).children("ul").find("li").css("display","").end().end().jstree("correct_node", -1, true);
					});
			}
		};
		this.search = function (str, skip_async) {
			if(str === false || $.trim(str) === "") {
				return this.clear_search();
			}
			var s = this.settings.search,
				t = this;

			// progressive render?
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
			this._data.search.res = this.element.find("a:" + (s.search_method) + "(" + str + ")");

			this._data.search.res.addClass("jstree-search").parent().parents(".jstree-closed").each(function () {
				t.open_node(this, false, 0);
			});
			this.trigger('search', { nodes : this._data.search.res, str : str });
		};
		this.clear_search = function (str) {
			this._data.search.res.removeClass("jstree-search");
			this.trigger('clear_search', { 'nodes' : this._data.search.res, str : this._data.search.str });
			this._data.search.str = "";
			this._data.search.res = $();
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
