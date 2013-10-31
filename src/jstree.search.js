/**
 * ### Search plugin
 */
(function ($) {
	$.jstree.defaults.search = {
		ajax : false,
		fuzzy : true,
		case_sensitive : false,
		show_only_matches : false
	};

	$.jstree.plugins.search = function (options, parent) {
		this.bind = function () {
			parent.bind.call(this);

			this._data.search.str = "";
			this._data.search.dom = $();
			this._data.search.res = [];

			if(this.settings.search.show_only_matches) {
				this.element
					.on("search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").hide().filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
							data.nodes.parentsUntil(".jstree").addBack().show()
								.filter("ul").each(function () { $(this).children("li:visible").eq(-1).addClass("jstree-last"); });
						}
					})
					.on("clear_search.jstree", function (e, data) {
						if(data.nodes.length) {
							$(this).find("li").css("display","").filter('.jstree-last').filter(function() { return this.nextSibling; }).removeClass('jstree-last');
						}
					});
			}
		};
		this.search = function (str, skip_async) {
			if(str === false || $.trim(str) === "") {
				return this.clear_search();
			}
			var s = this.settings.search,
				a = s.ajax ? $.extend({}, s.ajax) : false,
				t = this,
				f = null,
				r = [],
				p = [], i, j;
			if(this._data.search.res.length) {
				this.clear_search();
			}
			if(!skip_async && a !== false) {
				if(!a.data) { a.data = {}; }
				a.data.str = str;
				return $.ajax(s.ajax).done($.proxy(function (d) {
					this._search_load(d, str);
				}, this));
			}
			this._data.search.str = str;
			this._data.search.dom = $();
			this._data.search.res = [];

			f = new $.vakata.search(str, true, { caseSensitive : s.case_sensitive, fuzzy : s.fuzzy });

			$.each(this._model.data, function (i, v) {
				if(v.text && f.search(v.text).isMatch) {
					r.push(i);
					p = p.concat(v.parents);
				}
			});
			if(r.length) {
				p = $.vakata.array_unique(p);
				this._search_open(p);
				for(i = 0, j = r.length; i < j; i++) {
					f = this.get_node(r[i], true);
					if(f) {
						this._data.search.dom = this._data.search.dom.add(f);
					}
				}
				this._data.search.res = r;
				this._data.search.dom.children(".jstree-anchor").addClass('jstree-search');
			}
			this.trigger('search', { nodes : this._data.search.dom, str : str, res : this._data.search.res });
		};
		this.clear_search = function () {
			this._data.search.dom.children(".jstree-anchor").removeClass("jstree-search");
			this.trigger('clear_search', { 'nodes' : this._data.search.dom, str : this._data.search.str, res : this._data.search.res });
			this._data.search.str = "";
			this._data.search.res = [];
			this._data.search.dom = $();
		};
		this._search_open = function (d) {
			var t = this;
			$.each(d.concat([]), function (i, v) {
				v = document.getElementById(v);
				if(v) {
					if(t.is_closed(v)) {
						t.open_node(v, function () { t._search_open(d); });
					}
				}
			});
		};
		this._search_load = function (d, str) {
			var res = true,
				t = this,
				m = t._model.data;
			$.each(d.concat([]), function (i, v) {
				if(m[v]) {
					if(!m[v].state.loaded) {
						t.load_node(v, function () { t._search_load(d, str); });
						res = false;
					}
				}
			});
			if(res) {
				this.search(str, true);
			}
		};
	};

	// include the json plugin by default
	// $.jstree.defaults.plugins.push("search");
})(jQuery);

(function ($) {
	// from http://kiro.me/projects/fuse.html
	$.vakata.search = function(pattern, txt, options) {
		options = options || {};
		if(options.fuzzy !== false) {
			options.fuzzy = true;
		}
		pattern = options.caseSensitive ? pattern : pattern.toLowerCase();
		var MATCH_LOCATION	= options.location || 0,
			MATCH_DISTANCE	= options.distance || 100,
			MATCH_THRESHOLD	= options.threshold || 0.6,
			patternLen = pattern.length;
		if(patternLen > 32) {
			options.fuzzy = false;
		}
		if(options.fuzzy) {
			var matchmask = 1 << (patternLen - 1);
			var pattern_alphabet = (function () {
				var mask = {},
					i = 0;
				for (i = 0; i < patternLen; i++) {
					mask[pattern.charAt(i)] = 0;
				}
				for (i = 0; i < patternLen; i++) {
					mask[pattern.charAt(i)] |= 1 << (patternLen - i - 1);
				}
				return mask;
			})();
			var match_bitapScore = function (e, x) {
				var accuracy = e / patternLen,
					proximity = Math.abs(MATCH_LOCATION - x);
				if(!MATCH_DISTANCE) {
					return proximity ? 1.0 : accuracy;
				}
				return accuracy + (proximity / MATCH_DISTANCE);
			};
		}
		var search = function (text) {
			text = options.caseSensitive ? text : text.toLowerCase();
			if(pattern === text || text.indexOf(pattern) !== -1) {
				return {
					isMatch: true,
					score: 0
				};
			}
			if(!options.fuzzy) {
				return {
					isMatch: false,
					score: 1
				};
			}
			var i, j,
				textLen = text.length,
				scoreThreshold = MATCH_THRESHOLD,
				bestLoc = text.indexOf(pattern, MATCH_LOCATION),
				binMin, binMid,
				binMax = patternLen + textLen,
				lastRd, start, finish, rd, charMatch,
				score = 1,
				locations = [];
			if (bestLoc !== -1) {
				scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
				bestLoc = text.lastIndexOf(pattern, MATCH_LOCATION + patternLen);
				if (bestLoc !== -1) {
					scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
				}
			}
			bestLoc = -1;
			for (i = 0; i < patternLen; i++) {
				binMin = 0;
				binMid = binMax;
				while (binMin < binMid) {
					if (match_bitapScore(i, MATCH_LOCATION + binMid) <= scoreThreshold) {
						binMin = binMid;
					} else {
						binMax = binMid;
					}
					binMid = Math.floor((binMax - binMin) / 2 + binMin);
				}
				binMax = binMid;
				start = Math.max(1, MATCH_LOCATION - binMid + 1);
				finish = Math.min(MATCH_LOCATION + binMid, textLen) + patternLen;
				rd = new Array(finish + 2);
				rd[finish + 1] = (1 << i) - 1;
				for (j = finish; j >= start; j--) {
					charMatch = pattern_alphabet[text.charAt(j - 1)];
					if (i === 0) {
						rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
					} else {
						rd[j] = ((rd[j + 1] << 1) | 1) & charMatch | (((lastRd[j + 1] | lastRd[j]) << 1) | 1) | lastRd[j + 1];
					}
					if (rd[j] & matchmask) {
						score = match_bitapScore(i, j - 1);
						if (score <= scoreThreshold) {
							scoreThreshold = score;
							bestLoc = j - 1;
							locations.push(bestLoc);
							if (bestLoc > MATCH_LOCATION) {
								start = Math.max(1, 2 * MATCH_LOCATION - bestLoc);
							} else {
								break;
							}
						}
					}
				}
				if (match_bitapScore(i + 1, MATCH_LOCATION) > scoreThreshold) {
					break;
				}
				lastRd = rd;
			}
			return {
				isMatch: bestLoc >= 0,
				score: score
			};
		};
		return txt === true ? { 'search' : search } : search(txt);
	};
})(jQuery);