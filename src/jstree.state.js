/**
 * ### State plugin
 *
 * Saves the state of the tree (selected nodes, opened nodes) on the user's computer using available options (localStorage, cookies, etc)
 */
/*globals jQuery, define, exports, require */
(function (factory) {
	"use strict";
	if (typeof define === 'function' && define.amd) {
		define('jstree.state', ['jquery','jstree'], factory);
	}
	else if(typeof exports === 'object') {
		factory(require('jquery'), require('jstree'));
	}
	else {
		factory(jQuery, jQuery.jstree);
	}
}(function ($, jstree, undefined) {
	"use strict";

	if($.jstree.plugins.state) { return; }

	var to = false;
	/**
	 * stores all defaults for the state plugin
	 * @name $.jstree.defaults.state
	 * @plugin state
	 */
	$.jstree.defaults.state = {
		/**
		 * A string for the key to use when saving the current tree (change if using multiple trees in your project). Defaults to `jstree`.
		 * @name $.jstree.defaults.state.key
		 * @plugin state
		 */
		key		: 'jstree',
		/**
		 * A space separated list of events that trigger a state save. Defaults to `changed.jstree open_node.jstree close_node.jstree`.
		 * @name $.jstree.defaults.state.events
		 * @plugin state
		 */
		events	: 'changed.jstree open_node.jstree close_node.jstree',
		ttl		: false
	};
	$.jstree.plugins.state = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this.element
				.on("ready.jstree", $.proxy(function (e, data) {
						this.element.one("restore_state.jstree set_state.jstree", $.proxy(function () {
							this.element.on(this.settings.state.events, $.proxy(function () {
								if(to) { clearTimeout(to); }
								to = setTimeout($.proxy(function () { this.save_state(); }, this), 100);
							}, this));
						}, this));
						this.restore_state();
					}, this));
		};
		/**
		 * save the state
		 * @name save_state()
		 * @plugin state
		 */
		this.save_state = function () {
			$.vakata.storage.set(this.settings.state.key, this.get_state(), this.settings.state.ttl);
		};
		/**
		 * restore the state from the user's computer
		 * @name restore_state()
		 * @plugin state
		 */
		this.restore_state = function () {
			var k = $.vakata.storage.get(this.settings.state.key);

			if(!!k) { this.set_state(k); }
			this.trigger('restore_state', { 'state' : k });
		};
		/**
		 * clear the state on the user's computer
		 * @name clear_state()
		 * @plugin state
		 */
		this.clear_state = function () {
			return $.vakata.storage.del(this.settings.state.key);
		};
	};

	(function ($, document, undefined) {
		var raw		= function (s) { return s; },
			decoded	= function (s) { return decodeURIComponent(s.replace(/\+/g, ' ')); },
			config = $.vakata.cookie = function (key, value, options) {
				var days, t, decode, cookies, i, l, parts, cookie;
				// write
				if (value !== undefined) {
					options = $.extend({}, config.defaults, options);

					if (value === null) {
						options.expires = -1;
					}

					if (typeof options.expires === 'number') {
						days = options.expires;
						t = options.expires = new Date();
						t.setDate(t.getDate() + days);
					}

					value = config.json ? $.vakata.json.encode(value) : String(value);
					value = [
						encodeURIComponent(key), '=', config.raw ? value : encodeURIComponent(value),
						options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
						options.path    ? '; path=' + options.path : '',
						options.domain  ? '; domain=' + options.domain : '',
						options.secure  ? '; secure' : ''
					].join('');
					document.cookie = value;
					return value;
				}
				// read
				decode = config.raw ? raw : decoded;
				cookies = document.cookie.split('; ');
				for (i = 0, l = cookies.length; i < l; i++) {
					parts = cookies[i].split('=');
					if (decode(parts.shift()) === key) {
						cookie = decode(parts.join('='));
						return config.json ? $.vakata.json.decode(cookie) : cookie;
					}
				}
				return null;
			};
		config.defaults = {};
		$.vakata.removeCookie = function (key, options) {
			if ($.vakata.cookie(key) !== null) {
				$.vakata.cookie(key, null, options);
				return true;
			}
			return false;
		};
	}(jQuery, document));

	(function ($, undefined) {
		var _storage = {},
			_storage_service = {jStorage:"{}"},
			_storage_elm = null,
			_storage_size = 0,
			json_encode = $.vakata.json.encode,
			json_decode = $.vakata.json.decode,
			_backend = false,
			_ttl_timeout = false;

		function _load_storage() {
			if(_storage_service.jStorage) {
				try {
					_storage = json_decode(String(_storage_service.jStorage));
				} catch(ex) { _storage_service.jStorage = "{}"; }
			} else {
				_storage_service.jStorage = "{}";
			}
			_storage_size = _storage_service.jStorage ? String(_storage_service.jStorage).length : 0;
		}

		function _save() {
			try {
				_storage_service.jStorage = json_encode(_storage);
				if(_backend === 'userDataBehavior') {
					_storage_elm.setAttribute("jStorage", _storage_service.jStorage);
					_storage_elm.save("jStorage");
				}
				if(_backend === 'cookie') {
					$.vakata.cookie('__vjstorage', _storage_service.jStorage, { 'expires' : 365 });
				}
				_storage_size = _storage_service.jStorage?String(_storage_service.jStorage).length:0;
			} catch(ignore) { /*! probably cache is full, nothing is saved this way*/ }
		}

		function _checkKey(key) {
			if(!key || (typeof key !== "string" && typeof key !== "number")){
				throw new TypeError('Key name must be string or numeric');
			}
			if(key === "__jstorage_meta") {
				throw new TypeError('Reserved key name');
			}
			return true;
		}

		function _handleTTL() {
			var curtime = +new Date(),
				i,
				TTL,
				nextExpire = Infinity,
				changed = false;

			if(_ttl_timeout !== false) {
				clearTimeout(_ttl_timeout);
			}
			if(!_storage.__jstorage_meta || typeof _storage.__jstorage_meta.TTL !== "object"){
				return;
			}
			TTL = _storage.__jstorage_meta.TTL;
			for(i in TTL) {
				if(TTL.hasOwnProperty(i)) {
					if(TTL[i] <= curtime) {
						delete TTL[i];
						delete _storage[i];
						changed = true;
					}
					else if(TTL[i] < nextExpire) {
						nextExpire = TTL[i];
					}
				}
			}

			// set next check
			if(nextExpire !== Infinity) {
				_ttl_timeout = setTimeout(_handleTTL, nextExpire - curtime);
			}
			// save changes
			if(changed) {
				_save();
			}
		}

		function _init() {
			var localStorageReallyWorks = false, data;
			//if(window.hasOwnProperty("localStorage")){
			if(Object.prototype.hasOwnProperty.call(window, "localStorage")){
				try {
					window.localStorage.setItem('_tmptest', 'tmpval');
					localStorageReallyWorks = true;
					window.localStorage.removeItem('_tmptest');
				} catch(ignore) {
					// Thanks be to iOS5 Private Browsing mode which throws
					// QUOTA_EXCEEDED_ERRROR DOM Exception 22.
				}
			}

			if(localStorageReallyWorks){
				try {
					if(window.localStorage) {
						_storage_service = window.localStorage;
						_backend = "localStorage";
					}
				} catch(ignore) {/*! Firefox fails when touching localStorage and cookies are disabled */}
			}
			//else if(window.hasOwnProperty("globalStorage")) {
			else if(Object.prototype.hasOwnProperty.call(window, "globalStorage")) {
				try {
					if(window.globalStorage) {
						_storage_service = window.globalStorage[window.location.hostname];
						_backend = "globalStorage";
					}
				} catch(ignore) {/*! Firefox fails when touching localStorage and cookies are disabled */}
			}
			else {
				_storage_elm = document.createElement('link');
				if(_storage_elm.addBehavior) {
					_storage_elm.style.behavior = 'url(#default#userData)';
					document.getElementsByTagName('head')[0].appendChild(_storage_elm);
					try {
						_storage_elm.load("jStorage");
						data = "{}";
						data = _storage_elm.getAttribute("jStorage");
						_storage_service.jStorage = data;
						_backend = "userDataBehavior";
					} catch(ignore) {}
				}
				if(
					!_backend && (
						!!$.vakata.cookie('__vjstorage') ||
						($.vakata.cookie('__vjstorage', '{}', { 'expires' : 365 }) && $.vakata.cookie('__vjstorage') === '{}')
					)
				) {
					_storage_elm = null;
					_storage_service.jStorage = $.vakata.cookie('__vjstorage');
					_backend = "cookie";
				}

				if(!_backend) {
					_storage_elm = null;
					return;
				}
			}
			_load_storage();
			_handleTTL();
		}

		/*!
			Variable: $.vakata.storage
			*object* holds all storage related functions and properties.
		*/
		$.vakata.storage = {
			/*!
				Variable: $.vakata.storage.version
				*string* the version of jstorage used HEAVILY MODIFIED
			*/
			version: "0.3.0",
			/*!
				Function: $.vakata.storage.set
				Set a key to a value

				Parameters:
					key - the key
					value - the value

				Returns:
					_value_
			*/
			set : function (key, value, ttl) {
				_checkKey(key);
				if(typeof value === "object") {
					value = json_decode(json_encode(value));
				}
				_storage[key] = value;
				_save();
				if(ttl && parseInt(ttl, 10)) {
					$.vakata.storage.setTTL(key, parseInt(ttl, 10));
				}
				return value;
			},
			/*!
				Function: $.vakata.storage.get
				Get a value by key.

				Parameters:
					key - the key
					def - the value to return if _key_ is not found

				Returns:
					The found value, _def_ if key not found or _null_ if _def_ is not supplied.
			*/
			get : function (key, def) {
				_checkKey(key);
				if(_storage.hasOwnProperty(key)){
					return _storage[key];
				}
				return def === undefined ? null : def;
			},
			/*!
				Function: $.vakata.storage.del
				Remove a key.

				Parameters:
					key - the key

				Returns:
					*boolean*
			*/
			del : function (key) {
				_checkKey(key);
				if(_storage.hasOwnProperty(key)) {
					delete _storage[key];

					if(_storage.__jstorage_meta && typeof _storage.__jstorage_meta.TTL === "object" && _storage.__jstorage_meta.TTL.hasOwnProperty(key)) {
						delete _storage.__jstorage_meta.TTL[key];
					}
					_save();
					return true;
				}
				return false;
			},

			setTTL: function(key, ttl){
				var curtime = +new Date();

				_checkKey(key);
				ttl = Number(ttl) || 0;
				if(_storage.hasOwnProperty(key)){
					if(!_storage.__jstorage_meta){
						_storage.__jstorage_meta = {};
					}
					if(!_storage.__jstorage_meta.TTL) {
						_storage.__jstorage_meta.TTL = {};
					}
					if(ttl > 0) {
						_storage.__jstorage_meta.TTL[key] = curtime + ttl;
					}
					else {
						delete _storage.__jstorage_meta.TTL[key];
					}
					_save();
					_handleTTL();
					return true;
				}
				return false;
			},
			getTTL: function(key){
				var curtime = +new Date(), ttl;
				_checkKey(key);
				if(_storage.hasOwnProperty(key) && _storage.__jstorage_meta.TTL && _storage.__jstorage_meta.TTL[key]) {
					ttl = _storage.__jstorage_meta.TTL[key] - curtime;
					return ttl || 0;
				}
				return 0;
			},

			/*!
				Function: $.vakata.storage.flush
				Empty the storage.

				Returns:
					_true_
			*/
			flush : function(){
				_storage = {};
				_save();
				// try{ window.localStorage.clear(); } catch(E8) { }
				return true;
			},
			/*!
				Function: $.vakata.storage.storageObj
				Get a read only copy of the whole storage.

				Returns:
					*object*
			*/
			storageObj : function(){
				return $.extend(true, {}, _storage);
			},
			/*!
				Function: $.vakata.storage.index
				Get an array of all the set keys in the storage.

				Returns:
					*array*
			*/
			index : function(){
				var index = [];
				$.each(_storage, function (i, v) { if(i !== "__jstorage_meta") { index.push(i); } });
				return index;
			},
			/*!
				Function: $.vakata.storage.storageSize
				Get the size of all items in the storage in bytes.

				Returns:
					*number*
			*/
			storageSize : function(){
				return _storage_size;
			},
			/*!
				Function: $.vakata.storage.currentBackend
				Get the current backend used.

				Returns:
					*string*
			*/
			currentBackend : function(){
				return _backend;
			},
			/*!
				Function: $.vakata.storage.storageAvailable
				See if storage functionality is available.

				Returns:
					*boolean*
			*/
			storageAvailable : function(){
				return !!_backend;
			}
		};
		_init();
	}(jQuery));

	// include the state plugin by default
	// $.jstree.defaults.plugins.push("state");
}));