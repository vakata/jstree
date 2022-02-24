/**
 * ### side button plugin
 *
 * add side button
 */
/*globals jQuery, define, exports, require */
(function (factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define('jstree.sort', ['jquery','./jstree.js'], factory);
	}
	else if(typeof exports === 'object') {
		factory(require('jquery'), require('./jstree.js'));
	}
	else {
		factory(jQuery, jQuery.jstree);
	}
}(function ($, jstree, undefined) {
	"use strict";

	if($.jstree.plugins.sidebutton) { return; }
	
	$.jstree.defaults.sidebutton = {
		/**
		 * Whether to always be displayed or not, if false, displayed on mouseover, default is `true`
		 * @name $.jstree.defaults.sidebutton.always_view
		 * @plugin sidebutton
		 */
		always_view : true,
		/**
		 * button align, default is `right`
		 * @name $.jstree.defaults.sidebutton.align
		 * @plugin sidebutton
		 */
		align : 'right',
		/**
		 * button className , default is `btn`
		 * @name $.jstree.defaults.sidebutton.styleClass
		 * @plugin sidebutton
		 */
		styleClass : 'btn',
		/**
		 * an object of actions, or a function that accepts a node and a callback function and calls the callback function with an object of actions available for that node (you can also return the items too).
		 *
		 * Each action consists of a key (a unique name) and a value which is an object with the following properties (only label and action are required). Once a menu item is activated the `action` function will be invoked with an object containing the following keys: item - the contextmenu item definition as seen below, reference - the DOM node that was used (the tree node), element - the contextmenu DOM element, position - an object with x/y properties indicating the position of the menu.
		 *
		 * * `btnKey` a string - button key
		 * * `label` - a string - the name of the action
		 * * `icon` - a string, can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class	 
		 * * `onClick` - a function, click event callback
		 * @name $.jstree.defaults.sidebutton.items
		 * @plugin sidebutton
		 */
		items :[
			/*
			{btnKey :'add', label :'추가', onClick : function (item){
				console.log('add',item)
			}},
			{btnKey :'del', label :'삭제', onClick : function (item){
				console.log('del',item)
			}}
			*/
		]
	};

	var $$idx =0;
	$.jstree.plugins.sidebutton = function (options, parent) {
		this.bind = function () {
			
			parent.bind.call(this);

			var _this = this; 
			this.element.addClass('jstree-sidebutton-plugin');
			
			this._data.sidebutton.allBtnInfo = {};

			var items = this.settings.sidebutton.items ||[];
			var alwaysView = this.settings.sidebutton.always_view;
			var align = this.settings.sidebutton.align;
			var styleClass = this.settings.sidebutton.styleClass;

			var strHtm = [];
			strHtm.push('<span class="jstree-sidebutton '+(alwaysView ? '' :'hide')+' '+(align !== 'left' ? 'align-right' :'')+'">');

			for(var i=0; i< items.length; i++){
				var item = items[i];
				var btnKey = item.btnKey; 
				this._data.sidebutton.allBtnInfo[btnKey] = item;

				
				if(item.icon) {
					strHtm.push("<i ");
					if(item.icon.indexOf("/") !== -1 || item.icon.indexOf(".") !== -1) { 
						strHtm.push(" style='background:url(\"" + item.icon + "\") center center no-repeat' "); 
					}else {
						strHtm.push(" class='" + item.icon + "' "); 
					}
					strHtm.push("></i> ");
				}
								
				strHtm.push('<span class="jstree-side-item '+styleClass+'" data-btn-key="'+btnKey+'">'+item.label+'</span>');
			}
			
			strHtm.push('</span></span><span style="clear:both;">');

			var widthCheckId= "widthCheckEl-"+( ++$$idx); 
			this.element.append('<span id="'+widthCheckId+'" class="jstree-'+(this.settings.core.themes.name ||'default')+'" style="visibility: hidden;">'+strHtm.join('')+'</span>');
			this._data.sidebutton.maxWidth = Math.ceil($('#'+widthCheckId +'>.jstree-sidebutton').outerWidth())+30; //31 = icon width + padding
			this._data.sidebutton.buttonHtml  = strHtm.join('');
					
			this.element.on('click.jstree','.jstree-side-item', function(e){
				var ele = $(this);
				var btnKey = ele.data('btn-key');
				var btnInfo = _this._data.sidebutton.allBtnInfo[btnKey]; 

				var obj = _this.get_node(e.target);

				if(btnInfo){
					btnInfo.onClick.call(this,  obj);
				}
			});

			if(!alwaysView){
				this.element.on('mouseover.jstree', '.jstree-node', function(e){
					e.stopPropagation();
					$(this).addClass('show-button');
				}).on('mouseout.jstree', '.jstree-node', function(e){
					$(this).removeClass('show-button');
				});
			}
			
		};

		this.redraw_node = function(obj, deep, callback, force_render) {

			obj = parent.redraw_node.apply(this, arguments);
			
			
			if(obj) {
				var i, j, tmp = null, icon = null;
				for(i = 0, j = obj.childNodes.length; i < j; i++) {
					if(obj.childNodes[i] && obj.childNodes[i].className && obj.childNodes[i].className.indexOf("jstree-anchor") !== -1) {
						tmp = obj.childNodes[i];
						break;
					}
				}
				if(tmp) {
					$(tmp).after(this._data.sidebutton.buttonHtml);
					$(tmp).css({'max-width' : 'calc(100% - '+this._data.sidebutton.maxWidth+'px)'});
					
				}
			}
			
			return obj;
		};
	};
}));