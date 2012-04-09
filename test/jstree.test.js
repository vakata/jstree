/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
(function($) {

  /*
    ======== A Handy Little QUnit Reference ========
    http://docs.jquery.com/QUnit

    Test methods:
      expect(numAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      raises(block, [expected], [message])
  */

  module('jQuery#jstree', {
    setup: function() {
      this.elems = $('#qunit-fixture').children();
    }
  });

  test('is chainable', 1, function() {
    // Not a bad test to run on collection methods.
    strictEqual(this.elems.jstree(), this.elems, 'should be chaninable');
  });

  test('does return all', 1, function() {
    strictEqual(this.elems.jstree().text(), 'lame test markupnormal test markupawesome test markup', 'should return all nodes');
  });

  module('jQuery.jstree');

  test('is object', 1, function() {
    strictEqual(typeof $.jstree.VERSION, 'string', 'should be object');
  });

  module(':jstree selector', {
    setup: function() {
      this.elems = $('#qunit-fixture').children();
      this.elems.eq(2).jstree();
    }
  });

  test('is jstree', 1, function() {
    // Use deepEqual & .get() when comparing jQuery objects.
    deepEqual(this.elems.filter(':jstree').get(), this.elems.eq(2).get(), 'recognizes tree elements');
  });

}(jQuery));
