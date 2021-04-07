<?php
if (isset($_GET['id'])) {
    header('Content-Type: application/json');
    echo json_encode([
        'id' => $_GET['id'] . '1',
        'text' => 'Node ' . $_GET['id'] . '1',
        'state' => [
            'loaded' => false
        ]
    ]);
    die();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>jsTree v.4</title>
    <link rel="stylesheet" href="./jstree.css">
    <style>
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    }
    </style>
</head>
<body>
    <div id="tree" style="width:500px; height:300px; border:1px solid red; overflow:auto;"></div>

    <script src="./jstree.js"></script>
    <script>
    var instance = new jsTree(
        {
            data: function (node, done) {
                fetch('index.php?id=' + (node ? node.get('id') : 0))
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (data) {
                        done(data);
                    });
            }
        },
        document.getElementById('tree')
    );

    // example "plugin"
    // jsTree.prototype.select = function () { };
    // jsTree.prototype.context = function (node) {
    //     if (Array.isArray(node)) {
    //         node.forEach(x => this.select(x));
    //         return this;
    //     }
    //     node = this.node(node);
    //     if (node) {
    //         this.setState(node, "selected", true);
    //     }
    //     this.redraw();
    //     return this;
    // };
    // document.getElementById('tree').addEventListener('contextmenu', function (e) {
    //     e.preventDefault();
    //     jsTree.instance(e.target).context(e.target);
    // });

    // example plugin using renders
    </script>
</body>
</html>
