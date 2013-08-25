function ClusterStatusCtrl($scope, $http, $filter) {

  $http.get('http://localhost:9200/_cluster/health').success(function(data) {
    $scope.cluster = data;

    // Timed Out Label
    if (data.timed_out) {
      $scope.cluster.timed_out_label = "important"
    } else if (!data.timed_out) {
      $scope.cluster.timed_out_label = "success"
    }

    // Status Label
    if (data.status == "green") {
      $scope.cluster.status_label = "success"
    } else if (data.status == "red") {
      $scope.cluster.status_label = "important"
    } else if (data.status == "yellow") {
      $scope.cluster.status_label = "warning"
    }

    // Relocating Shards Label
    if (data.relocating_shards > 0) {
      $scope.cluster.relocating_shards_label = "warning"
    } else {
      $scope.cluster.relocating_shards_label = "success"
    }

    // Initializing Shards Label
    if (data.initializing_shards > 0) {
      $scope.cluster.initializing_shards_label = "important"
    } else {
      $scope.cluster.initializing_shards_label = "success"
    }

    // Unassigned Shards Label
    if (data.unassigned_shards > 0) {
      $scope.cluster.unassigned_shards_label = "important"
    } else {
      $scope.cluster.unassigned_shards_label = "success"
    }

  });

  $http.get('http://localhost:9200/_stats?clear=true&docs=true&store=true&indexing=true').success(function(data) {
    $scope.indices = data.indices;

    $http.get('http://localhost:9200/_cluster/state?filter_indices=true&filter_blocks=true&filter_metadata=true&filter_nodes=true').success(function(data) {
      $scope.routing_nodes = data.routing_nodes.nodes;
      // Turning the Index info into an array so Angualar can sort it
      var indices = $.map(data.routing_table.indices, function(k, v) {
        k.key = v;
        k.stats = $scope.indices[v]
        return [k];
      });
      $scope.indices = indices;

      //Call the sort method to start
      $scope.updateSort();
      
      $http.get('http://localhost:9200/_cluster/nodes/stats').success(function(data) {
        // Turning the object into an array so Angular can sort it
        var nodes = $.map(data.nodes, function(k, v) {
            k.key = v;
            k.shard_count = 0;
            k.started_shard_count = 0;
            k.relocating_shard_count = 0;
            k.initializing_shard_count = 0;
            k.bad_initializing_shard_count = 0;
            
            // Getting the number of shards on each node
            if ($scope.routing_nodes[v]) {
              k.shard_count = $scope.routing_nodes[v].length;
              k.started_shard_count = $filter('filter')($scope.routing_nodes[v], {"state" : "STARTED"}).length;
              k.relocating_shard_count = $filter('filter')($scope.routing_nodes[v], {"state" : "RELOCATING"}).length;
              k.initializing_shard_count = $filter('filter')($scope.routing_nodes[v], {"state" : "INITIALIZING"}).length;

              // Why not just use the filtering with an object? Because there seemse to be a bug
              // with null properties and the filtering so I have to do it the ol' fashioned way
              for (var i = $filter('filter')($scope.routing_nodes[v], {"state" : "INITIALIZING"}).length - 1; i >= 0; i--){
                if ($filter('filter')($scope.routing_nodes[v], {"state" : "INITIALIZING"})[i].relocating_node == null) {
                  k.bad_initializing_shard_count++
                }
              }
            }

            if (k.bad_initializing_shard_count > 0) {
              k.initializing_class = 'important';
            } else if (k.initializing_shard_count > 0) {
              k.initializing_class = 'warning';
            }

            return [k];
        });
        $scope.nodes = nodes;
      });

    });

  });

    // Sorting variables
    $scope.sort_by = "index_name";
    $scope.sort_order = "asc";
    $scope.updateSort = function() {
        //console.log($scope.sort_by, $scope.sort_order);
        //console.log('Called updateSort()');
        $scope.indices = _.sortBy($scope.indices, function(index) {
            switch ($scope.sort_by){
                case 'index_name':
                    return index.key;
                case 'documents':
                    return index.stats.primaries.docs.count;
                case 'size':
                    return index.stats.primaries.store.size_in_bytes;
                case 'indexing':
                    return index.stats.primaries.indexing.index_current;
                default :
                    return index.key; // index_name is the default
            }
        });

        if ($scope.sort_order == 'desc') {
            $scope.indices = $scope.indices.reverse();
        }
    }

}

angular.module('DashES', [])
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

