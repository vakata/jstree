(function ($) {
	$.vakata = {};
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
			if (bestLoc != -1) {
				scoreThreshold = Math.min(match_bitapScore(0, bestLoc), scoreThreshold);
				bestLoc = text.lastIndexOf(pattern, MATCH_LOCATION + patternLen);
				if (bestLoc != -1) {
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
				rd = Array(finish + 2);
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