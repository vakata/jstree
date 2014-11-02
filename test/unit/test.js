$(function () {

test('basic test', function() {
  expect(1);
  ok(true, 'this had better work.');
});

test('can access the DOM', function() {
  expect(1);
  var fixture = document.getElementById('qunit-fixture');
  equal(fixture.innerText || fixture.textContent, 'this had better work.', 'should be able to access the DOM.');
});

test('set_text is triggered exactly once after save', function () {
  expect(1);

  // setup
  var $elem = $('#test');
  $elem.jstree({
    core: {
      check_callback: $.noop,
      destroy_callback: $.noop
    }
  });

  var instance = $elem.jstree(true);

  // only count triggers cause by blur
  var countTriggers = false;

  // test
  $elem.on('set_text.jstree', function(event, data) {
  	if (countTriggers) {
      ok(true, 'set_text triggered once.');
    }
  });

  instance.create_node(null, 'New node', undefined, function (new_node) {
    instance.edit(new_node);

    countTriggers = true;
    $(document.activeElement).trigger('blur');
    countTriggers = false;

    // teardown
    instance.delete_node(new_node);
  });

  // teardown
  $elem.jstree('destroy', true);
});

});