/**
 * ### JSON data plugin
 */
(function ($) {
	$.jstree.defaults.json = {
		data	: false,
		ajax	: false,
		progressive_render : false, // get_json, data on each node
		progressive_unload : false
	};

	$.jstree.plugins.json = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);
			this.element
				.bind("ready.jstree", $.proxy(function () {
					this.element
						.bind("after_close.jstree", $.proxy(function (e, data) {
							var t = $(data.node);
							if(this.settings.json.progressive_unload && t.find('.jstree-clicked:eq(0)').length === 0) {
								t.data('jstree').children = this.get_json(t)[0].children;
								t.children("ul").remove();
							}
						}, this));
			}, this));
		};
		this.parse_json = function (node) {
			var s = this.settings.json;
			if(s.progressive_render && $.isArray(node.children) && !this._json_has_selected(node.children)) {
				if(!node.data) { node.data = {}; }
				if(!node.data.jstree) { node.data.jstree = {}; }
				node.data.jstree.children = node.children;
				node.children = true;
			}
			return parent.parse_json.call(this, node);
		};
		this._json_has_selected = function (data) {
			var r = false;
			for(var i = 0, j = data.length; i < j; i++) {
				if(data[i].data && data[i].data.jstree && data[i].data.jstree.selected) {
					r = true;
				}
				else if(data[i].children) {
					r = r || this._json_has_selected(data[i].children);
				}
				else {
					r = false;
				}
				if(r === true) { break; }
			}
			return r;
		};
		this._append_json_data = function (dom, data) {
			dom = this.get_node(dom);
			if(dom === -1) { dom = this.element; }
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
		};
		this._load_node = function (obj, callback) {
			var d = false,
				s = $.extend(true, {}, this.settings.json);
			obj = this.get_node(obj);
			if(!obj) { return false; }

			switch(!0) {
				// root node with data
				case (obj === -1 && this.get_container().data('jstree') && $.isArray(this.get_container().data('jstree').children)):
					d = this.element.data('jstree').children;
					this.get_container().data('jstree').children = null;
					return callback.call(this, this._append_json_data(obj, d));
				// normal node with data
				case (obj !== -1 && obj.length && obj.data('jstree') && $.isArray(obj.data('jstree').children)):
					d = obj.data('jstree').children;
					obj.data('jstree').children = null;
					return callback.call(this, this._append_json_data(obj, d));
				// no settings - use parent
				case (!s.data && !s.ajax):
					return parent._load_node.call(this, obj, callback);
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
						var s = this.settings.json.ajax;
						if($.isFunction(s.success)) {
							d = s.success.call(this, d, t, x) || d;
						}
						callback.call(this, this._append_json_data(obj, d));
					}, this);
					s.ajax.error = $.proxy(function (x, t, e) {
						var s = this.settings.json.ajax;
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
		};
	};
	// include the json plugin by default
	$.jstree.defaults.plugins.push("json");
})(jQuery);