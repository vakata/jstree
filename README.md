# Please use [the stable version][stable] until the docs for v.1.0.0 are ready.
[stable]: http://github.com/downloads/vakata/jstree/jstree_pre1.0_fix_1.zip
Older releases can be found on [google code][older]
[older]: http://code.google.com/p/jstree/downloads/list

# jstree

Tree view for jQuery. 

A list of useful pages:

 - http://www.jstree.com/
 - http://www.jstree.com/demo
 - http://www.jstree.com/documentation

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/vakata/jstree/v.1.0/dist/jstree.min.js
[max]: https://raw.github.com/vakata/jstree/v.1.0/dist/jstree.js

###In your web page:

```
<script src="libs/jquery/jquery.js"></script>
<script src="dist/jstree.min.js"></script>
<script>
jQuery(function($) {
  $('#container').jstree(
    /* put optional options for each plugin here, will extend the defaults */
    core : { /* core options go here */ },
    /* specify which plugins you want, you may omit this too */
    plugins : [ "themes", "html_data", "some-other-plugin" ]
  );
});
</script>
```

###Interacting with the tree:

```
/* METHOD ONE */
jQuery("some-selector-to-container-node-here")
  .jstree("operation_name" [, argument_1, argument_2, ...]);

/* METHOD TWO */
jQuery.jstree._reference(needle)
  .operation_name([ argument_1, argument_2, ...]);
```

###Events:
jsTree uses events to notify of any changes. All events fire on the tree container in the _jstree_ namespace and are named after the function that triggered them.

```
jQuery("some-container")
  .jstree({ /* configuration here */ })
  .bind("__ready.jstree", function (event, data) {
    alert("TREE IS LOADED");
    /* note the second parameter, read the docs on each event for its value */
  })
```

###Data:

TODO: a step by step guide to: HTML (no data plugin), HTML with plugin + AJAX, JSON, JSON + AJAX, XML, XML + AJAX, explain progressive render / unload

###States:

TODO: explain about passing states along with the data and the special data-jstree- attributes.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt](https://github.com/cowboy/grunt).

_Also, please don't edit files in the "dist" subdirectory as they are generated via grunt. You'll find source code in the "src" subdirectory!_

## License
Copyright (c) 2012 Ivan Bozhanov (http://vakata.com) 

Licensed under the MIT, GPL licenses.

 - http://www.opensource.org/licenses/mit-license.php
 - http://www.gnu.org/licenses/gpl.html
