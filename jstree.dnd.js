/* File: jstree.dnd.js 
Enables drag'n'drop.
*/
/* Group: jstree drag'n'drop plugin */

(function ($) {
	$.jstree.plugin("dnd", {
		__construct : function () {
			this.get_container()
				.delegate('a', 'mousedown', $.proxy(function (e) { 
					var obj = this.get_node(e.target);
					if(obj && obj !== -1 && obj.length && e.which === 1) { // TODO: think about e.which
						return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : obj }, '<div id="jstree-dnd" class="' + (this.data.themes ? 'jstree-' + this.get_theme() : '') + '"><ins class="jstree-icon jstree-er">&#160;</ins>' + this.get_text(e.currentTarget, true) + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
					}
				}, this));
		},
		defaults : {
			copy_modifier : 'ctrl'
		}
	});

	$(function() {
		// bind only once for all instances
		var lastmv = false,
			marker = $('<div id="jstree-marker">&#160;</div>').hide().appendTo('body');
		$(document)
			.bind('dnd_start.vakata', function (e, data) { 
				lastmv = false;
			})
			.bind('dnd_move.vakata', function (e, data) { 
				if(!data.data.jstree) { return; }

				// if we are hovering the marker image do nothing (can happen on "inside" drags)
				if(data.event.target.id && data.event.target.id === 'jstree-marker') {
					return;
				}

				var ins = $.jstree._reference(data.event.target),
					ref = false,
					off = false,
					rel = false,
					l, t, h, p, i;
				// if we are over an instance
				if(ins && ins.data && ins.data.dnd) {
					marker.attr('class', (ins.data.themes ? 'jstree-' + ins.get_theme() : ''));
					data.helper
						.children().attr('class', (ins.data.themes ? 'jstree-' + ins.get_theme() : ''))
						.find('.jstree-copy:eq(0)')[ data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'show' : 'hide' ]();


					// if are hovering the container itself add a new root node
					if(data.event.target === ins.get_container()[0] || data.event.target === ins.get_container_ul()[0]) {
						if(ins.check_move(data.data.obj, -1, 'last')) {
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
								l = off.left - 6;
								t = off.top - 5;
								p = ins.get_parent(ref);
								i = ref.parent().index();
							}
							else if(rel > h - h / 3) {
								l = off.left - 6;
								t = off.top - 5 + h + 2;
								p = ins.get_parent(ref);
								i = ref.parent().index() + 1;
							}
							else {
								l = off.left - 2;
								t = off.top - 5 + h / 2 + 1;
								p = ref.parent();
								i = 'last';
							}
							if(ins.check_move(data.data.obj, p, i)) {
								lastmv = { 'ins' : ins, 'par' : p, 'pos' : i };
								marker.css({ 'left' : l + 'px', 'top' : t + 'px' }).show();
								data.helper.find('.jstree-icon:eq(0)').removeClass('jstree-er').addClass('jstree-ok');
								return;
							}
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
				if(!data.data.jstree) { return; }
				marker.hide();
				if(lastmv) {
					lastmv.ins[ data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'copy_node' : 'move_node' ]
						(data.data.obj, lastmv.par, lastmv.pos);
				}
			})
			.bind('keyup keydown', function (e) {
				data = $.vakata.dnd._get();
				if(data.data && data.data.jstree) {
					data.helper.find('.jstree-copy:eq(0)')[ e[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'show' : 'hide' ]();
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
		$.vakata.css.add_sheet({ str : css_string, title : "jstree" });
	});
	// include the sort plugin by default
	$.jstree.defaults.plugins.push("dnd");
})(jQuery);


// TODO: open_timeout, check_timeout, check all options in order




/*

(function ($) { 
	return;

	$.jstree.plugin("dnd", {
		defaults : {
			copy_modifier	: "ctrl",
			check_timeout	: 100,
			open_timeout	: 500,
		},

			dnd_show : function () {
				if(!this.data.dnd.prepared) { return; }
				var o = ["before","inside","after"],
					r = false,
					rtl = this._get_settings().core.rtl,
					pos;
				if(this.data.dnd.w < this.data.core.li_height/3) { o = ["before","inside","after"]; }
				else if(this.data.dnd.w <= this.data.core.li_height*2/3) {
					o = this.data.dnd.w < this.data.core.li_height/2 ? ["inside","before","after"] : ["inside","after","before"];
				}
				else { o = ["after","inside","before"]; }
				$.each(o, $.proxy(function (i, val) { 
					if(this.data.dnd[val]) {
						$.vakata.dnd.helper.children("ins").attr("class","jstree-ok");
						r = val;
						return false;
					}
				}, this));
				if(r === false) { $.vakata.dnd.helper.children("ins").attr("class","jstree-invalid"); }
				
				pos = rtl ? (this.data.dnd.off.right - 18) : (this.data.dnd.off.left + 10);
				switch(r) {
					case "before":
						m.css({ "left" : pos + "px", "top" : (this.data.dnd.off.top - 6) + "px" }).show();
						if(ml) { ml.css({ "left" : (pos + 8) + "px", "top" : (this.data.dnd.off.top - 1) + "px" }).show(); }
						break;
					case "after":
						m.css({ "left" : pos + "px", "top" : (this.data.dnd.off.top + this.data.core.li_height - 6) + "px" }).show();
						if(ml) { ml.css({ "left" : (pos + 8) + "px", "top" : (this.data.dnd.off.top + this.data.core.li_height - 1) + "px" }).show(); }
						break;
					case "inside":
						m.css({ "left" : pos + ( rtl ? -4 : 4) + "px", "top" : (this.data.dnd.off.top + this.data.core.li_height/2 - 5) + "px" }).show();
						if(ml) { ml.hide(); }
						break;
					default:
						m.hide();
						if(ml) { ml.hide(); }
						break;
				}
				last_pos = r;
				return r;
			},
			dnd_open : function () {
				this.data.dnd.to2 = false;
				this.open_node(r, $.proxy(this.dnd_prepare,this), true);
			},
			dnd_finish : function (e) {
				if(this.data.dnd.foreign) {
					if(this.data.dnd.after || this.data.dnd.before || this.data.dnd.inside) {
						this._get_settings().dnd.drag_finish.call(this, { "o" : o, "r" : r, "p" : last_pos });
					}
				}
				else {
					this.dnd_prepare();
					this.move_node(o, r, last_pos, e[this._get_settings().dnd.copy_modifier + "Key"]);
				}
				o = false;
				r = false;
				m.hide();
				if(ml) { ml.hide(); }
			},
			dnd_enter : function (obj) {
				if(this.data.dnd.mto) { 
					clearTimeout(this.data.dnd.mto);
					this.data.dnd.mto = false;
				}
				var s = this._get_settings().dnd;
				this.data.dnd.prepared = false;
				r = this._get_node(obj);
				if(s.check_timeout) { 
					// do the calculations after a minimal timeout (users tend to drag quickly to the desired location)
					if(this.data.dnd.to1) { clearTimeout(this.data.dnd.to1); }
					this.data.dnd.to1 = setTimeout($.proxy(this.dnd_prepare, this), s.check_timeout); 
				}
				else { 
					this.dnd_prepare(); 
				}
				if(s.open_timeout) { 
					if(this.data.dnd.to2) { clearTimeout(this.data.dnd.to2); }
					if(r && r.length && r.hasClass("jstree-closed")) { 
						// if the node is closed - open it, then recalculate
						this.data.dnd.to2 = setTimeout($.proxy(this.dnd_open, this), s.open_timeout);
					}
				}
				else {
					if(r && r.length && r.hasClass("jstree-closed")) { 
						this.dnd_open();
					}
				}
			}
		}
	});
})(jQuery);
//*/