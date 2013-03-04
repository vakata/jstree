/**
 * ### Wholerow plugin
 */
(function ($) {
	$.jstree.plugins.wholerow = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('ready.jstree set_state.jstree', $.proxy(function () {
						this.hide_dots();
					}, this))
				.on("ready.jstree", $.proxy(function () {
						this.get_container_ul().addClass('jstree-wholerow-ul');
					}, this))
				.on("deselect_all.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
					}, this))
				.on("changed.jstree ", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-clicked').removeClass('jstree-wholerow-clicked');
						data.selected.children('.jstree-wholerow').addClass('jstree-wholerow-clicked');
					}, this))
				.on("hover_node.jstree dehover_node.jstree", $.proxy(function (e, data) {
						this.element.find('.jstree-wholerow-hovered').removeClass('jstree-wholerow-hovered');
						if(e.type === "hover_node") {
							data.node.each(function () {
								$(this).children('.jstree-wholerow').addClass('jstree-wholerow-hovered');
							});
						}
					}, this))
				.on("contextmenu.jstree", ".jstree-wholerow", $.proxy(function (e) {
						if(typeof this._data.contextmenu !== 'undefined') {
							e.preventDefault();
							$(e.currentTarget).closest("li").children("a:eq(0)").trigger('contextmenu',e);
						}
					}, this))
				.on("click.jstree", ".jstree-wholerow", function (e) {
						e.stopImmediatePropagation();
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger('click',e);
					})
				.on("click.jstree", ".jstree-leaf > .jstree-ocl", $.proxy(function (e) {
						e.stopImmediatePropagation();
						$(e.currentTarget).closest("li").children("a:eq(0)").trigger('click',e);
					}, this))
				.on("mouseover.jstree", "li", $.proxy(function (e) {
						e.stopImmediatePropagation();
						if($(e.currentTarget).closest('li').children(".jstree-hovered, .jstree-clicked").length) {
							return false;
						}
						this.hover_node(e.currentTarget);
						return false;
					}, this))
				.on("mouseleave.jstree", "li", $.proxy(function (e) {
						this.dehover_node(e.currentTarget);
					}, this));
		};
		this.teardown = function () {
			this.element.find(".jstree-wholerow").remove();
			parent.teardown.call(this);
		},
		this.clean_node = function(obj) {
			obj = parent.clean_node.call(this, obj);
			var t = this;
			return obj.each(function () {
				var o = $(this);
				if(!o.children(".jstree-wholerow").length) {
					o.prepend("<div class='jstree-wholerow' style='position:absolute; height:"+t._data.core.li_height+"px;' unselectable='on'>&#160;</div>");
				}
			});
		};
	};

	$(function () {
		var css_string = '' +
				'.jstree .jstree-wholerow-ul { position:relative; display:inline-block; min-width:100%; }' +
				'.jstree-wholerow-ul li > a, .jstree-wholerow-ul li > i { position:relative; }' +
				'.jstree-wholerow-ul .jstree-wholerow { width:100%; cursor:pointer; position:absolute; left:0; user-select:none;-webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }';
		if(!$.jstree.no_css) {
			$('head').append('<style type="text/css">' + css_string + '</style>');
		}
	});

	// include the wholerow plugin by default
	// $.jstree.defaults.plugins.push("wholerow");
})(jQuery);
