(function ($) {
	$.jstree.plugin("themeroller", {
        __construct: function () {
            var container = this.get_container();
            var settings = this.get_settings(true).themeroller;

            var styleNodes = function(event, data) {
                // Deselect nodes
                var nodes = $(container).find('a');
                nodes.removeClass('ui-state-active');

                nodes.each(function(){
                    if (typeof $(this).data('processed') === 'undefined') {
                        var data = $(this).find('[data-options]').data('options');
                        if (data && data.classes) {
                            $(this).addClass(data.classes);
                        }
                        $(this).data('processed', true);
                    }
                }).not(".ui-state-default").addClass("ui-state-default");

                // Ensure dots are applied
                $(container).children("ul").addClass(settings.dots ? "ui-widget-jstree-dots" : "ui-widget-jstree-no-dots");

                $(container).find('ins.jstree-icon.jstree-ocl').addClass('ui-icon ui-icon-bullet');

                var removeClasses = 'ui-icon-bullet ui-icon-jstree-leaf ui-icon-jstree-last ui-icon-carat-1-e ui-icon-carat-1-se';
                $(container).find('ins').each(function(){
                    var icon = 'ui-icon-bullet';

                    if ($(this).parent().hasClass('jstree-closed')) icon = 'ui-icon-carat-1-e';
                    if ($(this).parent().hasClass('jstree-open')) icon = 'ui-icon-carat-1-se';

                    $(this).removeClass(removeClasses).addClass(icon);

                });
                return true;
            };

            $(container).bind('__loaded.jstree', function(event, data){
                styleNodes(event, data);
                container.addClass("ui-widget");
                $(container).bind('open_node.jstree close_node.jstree create_node.jstree', styleNodes);
            });

            $(container).bind('select_node.jstree', function(event, data){
                $(container).find('a').removeClass('ui-state-active');
                $(data.rslt.obj).each(function(){
                    $(this).children('a').each(function(){
                        if($(this).hasClass('ui-state-active')) {
                            $(this).removeClass('ui-state-active');
                        } else {
                            $(this).addClass('ui-state-active');
                        }
                    });
                });

                return true;
            });

            $(container).bind('move_node.jstree', function(event, data){
                $(data.rslt.obj).children('a').removeClass('ui-state-active');
                return styleNodes();
            });

            $(document).bind('dnd_start.vakata', function() {
                $('#vakata-dnd').addClass('ui-widget ui-widget-content ui-state-default').find('.jstree-icon').addClass('ui-icon');
            });

            var icons = 'ui-icon-check ui-icon-crossthick';

            $(document).bind('dnd_move.vakata', function() {
                var icon = $('#vakata-dnd').find('.jstree-icon').removeClass(icons);
                if (icon.hasClass('jstree-ok')) {
                    icon.addClass('ui-icon-check');
                } else {
                    icon.addClass('ui-icon-crossthick');
                }
            });
        }
	});
})(jQuery);
