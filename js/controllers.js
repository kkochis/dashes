angular.module('dashES.controllers',[])

  // Primary App controller which takes care of default requests and
  // top navigation bar behavior
  .controller('DashESCtrl',
    ['$scope', 'appConfig', 'dashboardData', 
    function($scope, appConfig, dashboardData) {

      $scope.app_config = appConfig;
      $scope.app_config.es_host = 'http://localhost:9200';

  }])

  // Cluster Status
  .controller('ClusterStatusCtrl',
    ['$scope', 'dashboardData',
    function($scope, dashboardData) {

      $scope.cluster = dashboardData.get_health();

      $scope.$watch('cluster', function(cluster) {
        if (angular.isDefined(cluster)) {
          // Timed Out Label
          if (cluster.timed_out) {
            cluster.timed_out_label = "important";
          } else {
            cluster.timed_out_label = "success";
          }
          // Status Label
          if (cluster.status == "green") {
            cluster.status_label = "success";
          } else if (cluster.status == "red") {
            cluster.status_label = "important";
          } else if (cluster.status == "yellow") {
            cluster.status_label = "warning";
          }

          // Relocating Shards Label
          if (cluster.relocating_shards > 0) {
            cluster.relocating_shards_label = "warning";
          } else {
            cluster.relocating_shards_label = "success";
          }

          // Initializing Shards Label
          if (cluster.initializing_shards > 0) {
            cluster.initializing_shards_label = "important";
          } else {
            cluster.initializing_shards_label = "success";
          }

          // Unassigned Shards Label
          if (cluster.unassigned_shards > 0) {
            cluster.unassigned_shards_label = "important";
          } else {
            cluster.unassigned_shards_label = "success";
          }
        }
      });

  }])

  // Nodes Listing
  .controller('NodeListCtrl',
    ['$scope', '$filter', 'dashboardData', 
    function($scope, $filter, dashboardData) {

      $scope.routing = dashboardData.get_routing();
      $scope.node_stats = dashboardData.get_node_stats();
      $scope.nodes = [];

      $scope.$watch('[routing.routing_nodes.nodes, node_stats.nodes]', function (args) {
        // Turning the object into an array so Angular can sort it
        var routing_nodes = args[0];
        var node_stats = args[1];
        if (angular.isDefined(node_stats) && angular.isDefined(routing_nodes)) {
          var nodes = $.map(node_stats, function(k, v) {
              k.key = v;
              k.shard_count = 0;
              k.started_shard_count = 0;
              k.relocating_shard_count = 0;
              k.initializing_shard_count = 0;
              k.bad_initializing_shard_count = 0;

              // Getting the number of shards on each node
              if (routing_nodes[v]) {
                k.shard_count = routing_nodes[v].length;
                k.started_shard_count = $filter('filter')(routing_nodes[v], {"state" : "STARTED"}).length;
                k.relocating_shard_count = $filter('filter')(routing_nodes[v], {"state" : "RELOCATING"}).length;
                k.initializing_shard_count = $filter('filter')(routing_nodes[v], {"state" : "INITIALIZING"}).length;

                // Why not just use the filtering with an object? Because there seemse to be a bug
                // with null properties and the filtering so I have to do it the ol' fashioned way
                for (var i = $filter('filter')(routing_nodes[v], {"state" : "INITIALIZING"}).length - 1; i >= 0; i--){
                  if ($filter('filter')(routing_nodes[v], {"state" : "INITIALIZING"})[i].relocating_node == null) {
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
        }
      }, true);

  }])

  // Index Listing
  .controller('IndexListCtrl',
    ['$scope', 'dashboardData', 
    function($scope, dashboardData) {

      $scope.index_stats = dashboardData.get_indices();
      $scope.routing = dashboardData.get_routing();
      $scope.indices = [];

      $scope.$watch('[routing.routing_table, index_stats]', function (args) {
        // Turning the Index info into an array so Angualar can sort it and joining in some of the
        // index routing data
        var routing_table = args[0];
        var index_stats = args[1];
        if (angular.isDefined(routing_table) && angular.isDefined(index_stats)) {
          var indices = $.map(routing_table.indices, function(k, v) {
            k.key = v;
            k.stats = index_stats.indices[v]
            return [k];
          });
          $scope.indices = indices;

          //Call the sort method to start
          $scope.updateSort();
        }
      }, true);
      
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

  }]);
