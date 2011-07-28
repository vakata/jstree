/* File: jstree.html.js 
This plugin makes it possible for jstree to use HTML data sources (other than the container's initial HTML).
*/
/* Group: jstree html plugin */
(function ($) {
	$.jstree.plugin("html", {
		defaults : {
			data	: false,
			ajax	: false
		},
		_fn : { 
			_append_html_data : function (dom, data) {
				data = $(data);
				if(!data || !data.length || !data.is('ul, li')) { return false; }
				dom = this.get_node(dom);
				if(dom === -1) { dom = this.get_container(); }
				if(!dom.length) { return false; }
				if(!dom.children('ul').length) { dom.append('<ul />'); }
				dom.children('ul').empty().append(data.is('ul') ? data.children('li') : data);
				return true;
			},
			_load_node : function (obj, callback) {
				var d = false,
					s = this.get_settings().html;
				obj = this.get_node(obj);
				if(!obj) { return false; }

				switch(!0) {
					// no settings - user original html
					case (!s.data && !s.ajax): 
						if(obj === -1) {
							this._append_html_data(-1, this.data.core.original_container_html.clone(true));
						}
						return callback.call(this, true);
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
							var s = this.get_settings().html.ajax;
							if($.isFunction(s.success)) {
								d = s.success.call(this, d, t, x) || d;
							}
							callback.call(this, this._append_html_data(obj, d));
						}, this);
						s.ajax.error = $.proxy(function (x, t, e) { 
							var s = this.get_settings().html.ajax;
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
			}
		}
	});
	// include the html plugin by default
	$.jstree.defaults.plugins.push("html");
})(jQuery);