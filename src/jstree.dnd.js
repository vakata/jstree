/**
 * ### Drag'n'drop plugin
 */
(function ($) {
	$.jstree.defaults.dnd = {
		copy : true,
		open_timeout : 500
	};
	$.jstree.plugins.dnd = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on('mousedown', 'a', $.proxy(function (e) {
					var obj = this.get_node(e.target); // TODO: how about multiple
					if(obj && obj !== -1 && obj.length && e.which === 1) { // TODO: think about e.which
						this.element.trigger('mousedown.jstree');
						return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : obj }, '<div id="jstree-dnd" class="jstree-' + this.get_theme() + '"><i class="jstree-icon jstree-er"></i>' + this.get_text(e.currentTarget, true) + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
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
					l, t, h, p, i, o;
				// if we are over an instance
				if(ins && ins._data && ins._data.dnd) {
					marker.attr('class', 'jstree-' + ins.get_theme());
					data.helper
						.children().attr('class', 'jstree-' + ins.get_theme())
						.find('.jstree-copy:eq(0)')[ data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? 'show' : 'hide' ]();


					// if are hovering the container itself add a new root node
					if(data.event.target === ins.element[0] || data.event.target === ins.get_container_ul()[0]) {
						if(ins.check( (data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? "copy_node" : "move_node"), data.data.obj, -1, 'last')) {
							lastmv = { 'ins' : ins, 'par' : -1, 'pos' : 'last' };
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
										t = off.top - 5 + h + 2;
										p = ins.get_parent(ref);
										i = ref.parent().index() + 1;
										break;
								}
								/*!
								// TODO: moving inside, but the node is not yet loaded?
								// the check will work anyway, as when moving the node will be loaded first and checked again
								if(v === 'i' && !ins.is_loaded(p)) { }
								*/
								if(ins.check(( data.data.origin.settings.dnd.copy && (data.event.metaKey || data.event.ctrlKey) ? "copy_node" : "move_node"),data.data.obj, p, i)) {
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
						(data.data.obj, lastmv.par, lastmv.pos);
				}
			})
			.bind('keyup keydown', function (e, data) {
				data = $.vakata.dnd._get();
				if(data.data && data.data.jstree) {
					data.helper.find('.jstree-copy:eq(0)')[ data.data.origin.settings.dnd.copy && (e.metaKey || e.ctrlKey) ? 'show' : 'hide' ]();
				}
			});

		// add DND CSS
		var css_string = '' +
				'#jstree-marker { position: absolute; top:0; left:0; margin:0; padding:0; border-right:0; border-top:5px solid transparent; border-bottom:5px solid transparent; border-left:5px solid; width:0; height:0; font-size:0; line-height:0; _border-top-color:pink; _border-botton-color:pink; _filter:chroma(color=pink); } ' +
				'#jstree-dnd { line-height:16px; margin:0; padding:4px; } ' +
				'#jstree-dnd .jstree-icon, #jstree-dnd .jstree-copy { display:inline-block; text-decoration:none; margin:0 2px 0 0; padding:0; width:16px; height:16px; } ' +
				'#jstree-dnd .jstree-ok { background:green; } ' +
				'#jstree-dnd .jstree-er { background:red; } ' +
				'#jstree-dnd .jstree-copy { margin:0 2px 0 2px; }';
		if(!$.jstree.no_css) {
			$('head').append('<style type="text/css">' + css_string + '</style>');
		}
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
