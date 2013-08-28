angular.module('dashES.modules', [])

  .directive('sortable', function () {
    return {
      scope: true,
      link: function(scope, element, attrs) {
        //Creating some variables for each headers data,
        //these are updated at the bottom of the directive with an $observe
        //since the value could contain {{ }} tags
        scope.my_sort_by = "";
        scope.my_sort_order = "asc";

        var updateIcons = function() {
          //Remove old sort order class
          element.removeClass("sort_asc").removeClass("sort_desc").removeClass("sort_selected");
          //If we are currently what is being sorted by
          if (scope.my_sort_by == scope.$parent.sort_by) {
            //Add the sorting class to this header
            if (scope.$parent.sort_order == "asc") {
              element.addClass("sort_asc");
            } else {
              element.addClass("sort_desc");
            }
            element.addClass("sort_selected");
          }
        }

        if (!scope.watching_sort) {
          //Watch for changes in the sort_by/sort_order
          //to update the classes on all sortable directives
          scope.$parent.$watch('sort_by', updateIcons);
          scope.$parent.$watch('sort_order', updateIcons);
          updateIcons();

          scope.watching_sort = true;
        }

        var clickedHeader = function() {
          //If we are already sorting by this, reverse the sort order
          if (scope.my_sort_by == scope.$parent.sort_by) {
            if (scope.$parent.sort_order == "asc") {
              scope.$parent.sort_order = "desc";
            } else {
              scope.$parent.sort_order = "asc";
            }
          } else {
            scope.$parent.sort_order = scope.my_sort_order;
          }
          //We are now the sort_by
          scope.$parent.sort_by = scope.my_sort_by;

          //Call the controller's updateSort function
          scope.$parent.updateSort();

          scope.$apply();
        }

        //Add a click event to this header
        element.on('click',clickedHeader);
        element.css("cursor","pointer");
        //element.css("position","relative");

        //Keep track of the sortable value and update if anything changes
        attrs.$observe('sortable', function(value) {
          var params = value.split("|");
          scope.my_sort_by = (params[0]) ? params[0] : "";
          scope.my_sort_order = (params[1]) ? params[1] : "asc";
          updateIcons();
        });

        //Add the arrows, which will be hidden by default
        //element.wrapInner('<div style="position: relative;"/>');
        element.append('<div class="up-arrow"></div><div class="down-arrow"></div>');
        if(element[0].tagName == 'TH') {
          var innerHtml = element.html();
          var replace = '<th><div style="position: relative;">' + innerHtml + '</div></th>';
          element.html(replace);
        } else if (element[0].tagName == 'TD') {
          var innerHtml = element.html();
          var replace = '<td><div style="position: relative;">' + innerHtml + '</div></td>';
          element.html(replace);
        }
      }
    }
  })
;