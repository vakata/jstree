test('basic test', function() {
  expect(1);
  ok(true, 'this had better work.');
});

test('can access the DOM', function() {
  expect(1);
  var fixture = document.getElementById('qunit-fixture');
  equal(fixture.innerText || fixture.textContent, 'this had better work.', 'should be able to access the DOM.');
});

test('can pass a function or string as label to context menu item using _getLabel', function() {
  expect(2);
  var uniqueName = "$%(*$&#&(@dfd";
  var stringLabelMenu = {
		label: uniqueName
  };
  var funtionLabelMenu = {
		label: function() { return uniqueName; }
  };
  var result = $.vakata.context._getLabel(stringLabelMenu);
  equal(result, uniqueName, 'this had better work.','_getLabel does not accept funtions.');
  var result = $.vakata.context._getLabel(funtionLabelMenu);
  equal(result, uniqueName, 'this had better work.','_getLabel does not accept funtions.');
});