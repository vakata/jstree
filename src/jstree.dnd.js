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
						this.get_container().trigger('mousedown.jstree');
						return $.vakata.dnd.start(e, { 'jstree' : true, 'origin' : this, 'obj' : obj }, '<div id="jstree-dnd" class="' + (this.data.themes ? 'jstree-' + this.get_theme() : '') + '"><ins class="jstree-icon jstree-er">&#160;</ins>' + this.get_text(e.currentTarget, true) + '<ins class="jstree-copy" style="display:none;">+</ins></div>');
					}
				}, this));
		},
		// TODO: is check_timeout or is it OK as is?
		// TODO: drag foreign items / drop foreign items (pretty easy with dnd events, but need to move marker placement in a function)
		defaults : {
			copy_modifier : 'ctrl',
			open_timeout : 500
		}
	});

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

				var ins = $.jstree._reference(data.event.target),
					ref = false,
					off = false,
					rel = false,
					l, t, h, p, i, o;
				// if we are over an instance
				if(ins && ins.data && ins.data.dnd) {
					marker.attr('class', (ins.data.themes ? 'jstree-' + ins.get_theme() : ''));
					data.helper
						.children().attr('class', (ins.data.themes ? 'jstree-' + ins.get_theme() : ''))
						.find('.jstree-copy:eq(0)')[ data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'show' : 'hide' ]();


					// if are hovering the container itself add a new root node
					if(data.event.target === ins.get_container()[0] || data.event.target === ins.get_container_ul()[0]) {
						if(ins.check( (data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? "copy_node" : "move_node"), data.data.obj, -1, 'last')) {
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
								/*
								// TODO: moving inside, but the node is not yet loaded?
								// the check will work anyway, as when moving the node will be loaded first and checked again
								if(v === 'i' && !ins.is_loaded(p)) { }
								*/
								if(ins.check((data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? "copy_node" : "move_node"),data.data.obj, p, i)) {
									if(v === 'i' && ref.parent().is('.jstree-closed') && ins.get_settings(true).dnd.open_timeout) {
										opento = setTimeout((function (x, z) { return function () { x.open_node(z); }; })(ins, ref), ins.get_settings(true).dnd.open_timeout);
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
					lastmv.ins[ data.event[data.data.origin.get_settings().dnd.copy_modifier + "Key"] ? 'copy_node' : 'move_node' ]
						(data.data.obj, lastmv.par, lastmv.pos);
				}
			})
			.bind('keyup keydown', function (e, data) {
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
	// include the dnd plugin by default
	$.jstree.defaults.plugins.push("dnd");
})(jQuery);