/**
 * ### XML data plugin
 */
(function ($) {
	var xsl = {
		'nest' : '' +
			'<' + '?xml version="1.0" encoding="utf-8" ?>' +
			'<'+'xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' +
			'<'+'xsl:output method="html" encoding="utf-8" omit-xml-declaration="yes" standalone="no" indent="no" media-type="text/html" />' +
			'<'+'xsl:template match="/">' +
			'	<'+'xsl:call-template name="nodes">' +
			'		<'+'xsl:with-param name="node" select="/root" />' +
			'	<'+'/xsl:call-template>' +
			'<'+'/xsl:template>' +
			'<'+'xsl:template name="nodes">' +
			'	<'+'xsl:param name="node" />' +
			'	<'+'ul>' +
			'	<'+'xsl:for-each select="$node/item">' +
			'		<'+'xsl:variable name="children" select="count(./item) &gt; 0" />' +
			'		<'+'li>' +
			'			<'+'xsl:for-each select="@*"><'+'xsl:attribute name="{name()}"><'+'xsl:value-of select="." /><'+'/xsl:attribute><'+'/xsl:for-each>' +
			'			<'+'a>' +
			'				<'+'xsl:for-each select="./content/@*"><'+'xsl:attribute name="{name()}"><'+'xsl:value-of select="." /><'+'/xsl:attribute><'+'/xsl:for-each>' +
			'				<'+'xsl:copy-of select="./content/child::node()" />' +
			'			<'+'/a>' +
			'			<'+'xsl:if test="$children"><'+'xsl:call-template name="nodes"><'+'xsl:with-param name="node" select="current()" /><'+'/xsl:call-template><'+'/xsl:if>' +
			'		<'+'/li>' +
			'	<'+'/xsl:for-each>' +
			'	<'+'/ul>' +
			'<'+'/xsl:template>' +
			'<'+'/xsl:stylesheet>',
		'flat' : '' +
			'<' + '?xml version="1.0" encoding="utf-8" ?>' +
			'<'+'xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' +
			'<'+'xsl:output method="html" encoding="utf-8" omit-xml-declaration="yes" standalone="no" indent="no" media-type="text/xml" />' +
			'<'+'xsl:template match="/">' +
			'	<'+'ul>' +
			'	<'+'xsl:for-each select="//item[not(@parent_id) or @parent_id=0 or not(@parent_id = //item/@id)]">' + /* the last `or` may be removed */
			'		<'+'xsl:call-template name="nodes">' +
			'			<'+'xsl:with-param name="node" select="." />' +
			'		<'+'/xsl:call-template>' +
			'	<'+'/xsl:for-each>' +
			'	<'+'/ul>' +
			'<'+'/xsl:template>' +
			'<'+'xsl:template name="nodes">' +
			'	<'+'xsl:param name="node" />' +
			'	<'+'xsl:variable name="children" select="count(//item[@parent_id=$node/attribute::id]) &gt; 0" />' +
			'	<'+'li>' +
			'		<'+'xsl:for-each select="@*">' +
			'			<'+'xsl:if test="name() != \'parent_id\'">' +
			'				<'+'xsl:attribute name="{name()}"><'+'xsl:value-of select="." /><'+'/xsl:attribute>' +
			'			<'+'/xsl:if>' +
			'		<'+'/xsl:for-each>' +
			'		<'+'a>' +
			'			<'+'xsl:for-each select="./content/@*"><'+'xsl:attribute name="{name()}"><'+'xsl:value-of select="." /><'+'/xsl:attribute><'+'/xsl:for-each>' +
			'			<'+'xsl:copy-of select="./content/child::node()" />' +
			'		<'+'/a>' +
			'		<'+'xsl:if test="$children">' +
			'		<'+'ul>' +
			'			<'+'xsl:for-each select="//item[@parent_id=$node/attribute::id]">' +
			'				<'+'xsl:call-template name="nodes">' +
			'					<'+'xsl:with-param name="node" select="." />' +
			'				<'+'/xsl:call-template>' +
			'			<'+'/xsl:for-each>' +
			'		<'+'/ul>' +
			'		<'+'/xsl:if>' +
			'	<'+'/li>' +
			'<'+'/xsl:template>' +
			'<'+'/xsl:stylesheet>'
	},
	escape_xml = function(string) {
		return string
			.toString()
			.replace(/&/g, '&amp;')
			.replace(/<'+'/g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	};

	$.jstree.defaults.xml = {
		xsl		: "flat",
		data	: false,
		ajax	: false
	};

	$.jstree.plugins.xml = function (options, parent) {
		this._append_xml_data = function (dom, data) {
			data = $.vakata.xslt(data, xsl[this.settings.xml.xsl]);
			if(data === false) { return false; }
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
			if(!dom.children('ul').length) { dom.append('<'+'ul />'); }
			dom.children('ul').empty().append(data.is('ul') ? data.children('li') : data);
			return true;
		};
		this._load_node = function (obj, callback) {
			var d = false,
				s = $.extend(true, {}, this.settings.xml);
			obj = this.get_node(obj);
			if(!obj) { return false; }
			switch(!0) {
				// no settings - use parent
				case (!s.data && !s.ajax):
					return parent._load_node.call(this, obj, callback);
				// data is function
				case ($.isFunction(s.data)):
					return s.data.call(this, obj, $.proxy(function (d) {
						return callback.call(this, this._append_xml_data(obj, d));
					}, this));
				// data is set, ajax is not set, or both are set, but we are dealing with root node
				case ((!!s.data && !s.ajax) || (!!s.data && !!s.ajax && obj === -1)):
					return callback.call(this, this._append_xml_data(obj, s.data));
				// data is not set, ajax is set, or both are set, but we are dealing with a normal node
				case ((!s.data && !!s.ajax) || (!!s.data && !!s.ajax && obj !== -1)):
					s.ajax.success = $.proxy(function (d, t, x) {
						var s = this.settings.xml.ajax;
						if($.isFunction(s.success)) {
							d = s.success.call(this, d, t, x) || d;
						}
						callback.call(this, this._append_xml_data(obj, d));
					}, this);
					s.ajax.error = $.proxy(function (x, t, e) {
						var s = this.settings.xml.ajax;
						if($.isFunction(s.error)) {
							s.error.call(this, x, t, e);
						}
						callback.call(this, false);
					}, this);
					if(!s.ajax.dataType) { s.ajax.dataType = "xml"; }
					if($.isFunction(s.ajax.url))	{ s.ajax.url	= s.ajax.url.call(this, obj); }
					if($.isFunction(s.ajax.data))	{ s.ajax.data	= s.ajax.data.call(this, obj); }
					return $.ajax(s.ajax);
			}
		};
		this.get_xml = function (mode, obj, is_callback) {
			var r = '';
			if(!mode) { mode = 'flat'; }
			if(typeof is_callback === 'undefined') {
				obj = this.get_json(obj);
				$.each(obj, $.proxy(function (i, v) {
					r += this.get_xml(mode, v, true);
				}, this));
				return '' +
					'<' + '?xml version="1.0" encoding="utf-8" ?>' +
					'<'+'root>' + r + '<'+'/root>';
			}
			r += '<'+'item';
			if(mode === 'flat' && is_callback !== true) {
				r += ' parent_id="' + escape_xml(is_callback) + '"';
			}
			if(obj.data && !$.isEmptyObject(obj.data)) {
				$.each(obj.data, function (i, v) {
					if(!$.isEmptyObject(v)) {
						r += ' data-' + i + '="' + escape_xml($.vakata.json.encode(v)) + '"';
					}
				});
			}
			$.each(obj.li_attr, function (i, v) {
				r += ' ' + i + '="' + escape_xml(v) + '"';
			});
			r += '>';
			r += '<'+'content';
			$.each(obj.a_attr, function (i, v) {
				r += ' ' + i + '="' + escape_xml(v) + '"';
			});
			r += '><'+'![CDATA[' + obj.title + ']]><'+'/content>';

			if(mode === 'flat') { r += '<'+'/item>'; }
			if(obj.children) {
				$.each(obj.children, $.proxy(function (i, v) {
					r += this.get_xml(mode, v, obj.li_attr && obj.li_attr.id ? obj.li_attr.id : true);
				}, this));
			}
			if(mode === 'nest') { r += '<'+'/item>'; }
			return r;
		};
	};

	// include the html plugin by default
	$.jstree.defaults.plugins.push("xml");

	// helpers
	$.vakata.xslt = function (xml, xsl) {
		var r = false, p, q, s, xm = $.parseXML(xml), xs = $.parseXML(xsl);

		// FF, Chrome, IE10
		if(typeof (XSLTProcessor) !== "undefined") {
			p = new XSLTProcessor();
			p.importStylesheet(xs);
			r = p.transformToFragment(xm, document);
			return $('<'+'div />').append(r).html();
		}
		// OLD IE
		if(typeof (xm.transformNode) !== "undefined") {
			return xm.transformNode(xs);
		}
		// IE9, IE10
		if(window.ActiveXObject) {
			try {
				r = new ActiveXObject("Msxml2.XSLTemplate");
				q = new ActiveXObject("Msxml2.DOMDocument");
				q.loadXML(xml);
				s = new ActiveXObject("Msxml2.FreeThreadedDOMDocument");
				s.loadXML(xsl);
				r.stylesheet = s;
				p = r.createProcessor();
				p.input = q;
				p.transform();
				r = p.output;
			}
			catch (e) { }
		}
		return r;
	};
})(jQuery);