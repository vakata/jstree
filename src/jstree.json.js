/* File: jstree.json.js 
This plugin makes it possible for jstree to use JSON data sources.
*/
/* Group: jstree json plugin */
(function ($) {
	$.jstree.plugin("json", {
		__construct : function () {
			this.get_container()
				.bind("__after_close.jstree", $.proxy(function (e, data) {
						var t = $(data.rslt.obj);
						if(this.get_settings(true).json.progressive_unload) {
							t.data('jstree').children = this.get_json(t)[0].children;
							t.children("ul").remove();
						}
					}, this));
		},
		defaults : {
			data	: false,
			ajax	: false, 
			progressive_render : false, // get_json, data on each node
			progressive_unload : false
		},
		_fn : { 
			parse_json : function (node) {
				var s = this.get_settings(true).json;
				if($.isArray(node.children)) {
					if(s.progressive_render) {
						if(!node.data) { node.data = {}; }
						if(!node.data.jstree) { node.data.jstree = {}; }
						node.data.jstree.children = node.children;
						node.children = true;
					}
				}
				return this.__call_old(true, node);
			},
			_append_json_data : function (dom, data) {
				dom = this.get_node(dom);
				if(dom === -1) { dom = this.get_container(); }
				data = this.parse_json(data);
				if(!data || !dom.length) { return false; }
				if(!dom.children('ul').length) { dom.append('<ul />'); }
				dom.children('ul').empty().append(data.children('li'));
				return true;
			},
			_load_node : function (obj, callback) {
				var d = false,
					s = this.get_settings().json;
				obj = this.get_node(obj);
				if(!obj) { return false; }

				switch(!0) {
					// root node with data
					case (obj === -1 && this.get_container().data('jstree') && $.isArray(this.get_container().data('jstree').children)):
						d = this.get_container().data('jstree').children;
						this.get_container().data('jstree').children = null;
						return callback.call(this, this._append_json_data(obj, d));
					// normal node with data
					case (obj !== -1 && obj.length && obj.data('jstree') && $.isArray(obj.data('jstree').children)):
						d = obj.data('jstree').children;
						obj.data('jstree').children = null;
						return callback.call(this, this._append_json_data(obj, d));
					// no settings
					case (!s.data && !s.ajax): 
						throw "Neither data nor ajax settings supplied.";
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
							var s = this.get_settings().json.ajax;
							if($.isFunction(s.success)) {
								d = s.success.call(this, d, t, x) || d;
							}
							callback.call(this, this._append_json_data(obj, d));
						}, this);
						s.ajax.error = $.proxy(function (x, t, e) { 
							var s = this.get_settings().json.ajax;
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
			}
		}
	});
	// include the json plugin by default
	// $.jstree.defaults.plugins.push("json");
})(jQuery);