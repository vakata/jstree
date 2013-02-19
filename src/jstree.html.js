/**
 * ### HTML data plugin
 */
(function ($) {
	$.jstree.defaults.html = {
		data	: false,
		ajax	: false
	};

	$.jstree.plugins.html = function (options, parent) {
		this.append_html_data = function (dom, data) {
			data = $(data);
			dom = this.get_node(dom);
			if(!data || !data.length || !data.is('ul, li')) {
				if(dom && dom !== -1 && dom.is('li')) {
					dom.removeClass('jstree-closed').addClass('jstree-leaf').children('ul').remove();
				}
				return true;
			}
			if(dom === -1) { dom = this.element; }
			if(!dom.length) { return false; }
			if(!dom.children('ul').length) { dom.append('<ul />'); }
			dom.children('ul').empty().append(data.is('ul') ? data.children('li') : data);
			return true;
		};
		this._load_node = function (obj, callback) {
			var d = false,
				s = $.extend(true, {}, this.settings.html);
			obj = this.get_node(obj);
			if(!obj) { return false; }

			switch(!0) {
				// no settings - use parent
				case (!s.data && !s.ajax):
					return parent._load_node.call(this, obj, callback);
				// data is function
				case ($.isFunction(s.data)):
					return s.data.call(this, obj, $.proxy(function (d) {
						return callback.call(this, this._append_html_data(obj, d));
					}, this));
				// data is set, ajax is not set, or both are set, but we are dealing with root node
				case ((!!s.data && !s.ajax) || (!!s.data && !!s.ajax && obj === -1)):
					return callback.call(this, this._append_html_data(obj, s.data));
				// data is not set, ajax is set, or both are set, but we are dealing with a normal node
				case ((!s.data && !!s.ajax) || (!!s.data && !!s.ajax && obj !== -1)):
					s.ajax.success = $.proxy(function (d, t, x) {
						var s = this.settings.html.ajax;
						if($.isFunction(s.success)) {
							d = s.success.call(this, d, t, x) || d;
						}
						callback.call(this, this._append_html_data(obj, d));
					}, this);
					s.ajax.error = $.proxy(function (x, t, e) {
						var s = this.settings.html.ajax;
						if($.isFunction(s.error)) {
							s.error.call(this, x, t, e);
						}
						callback.call(this, false);
					}, this);
					if(!s.ajax.dataType) { s.ajax.dataType = "html"; }
					if($.isFunction(s.ajax.url))	{ s.ajax.url	= s.ajax.url.call(this, obj); }
					if($.isFunction(s.ajax.data))	{ s.ajax.data	= s.ajax.data.call(this, obj); }
					return $.ajax(s.ajax);
			}
		};
	};
	// include the html plugin by default
	$.jstree.defaults.plugins.push("html");
})(jQuery);