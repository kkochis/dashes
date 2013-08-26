angular.module('dashES.controllers',[])

  // Primary App controller which takes care of default requests and
  // top navigation bar behavior
  .controller('DashESCtrl',
    ['$scope', 'appConfigService', 'clusterHealthService', 
    function($scope, appConfigService, clusterHealthService) {
  
      $scope.app_config = appConfigService;
      $scope.app_config.es_host = 'http://localhost:9200';
      $scope.cluster = clusterHealthService.get();

  }])

  // Cluster Status
  .controller('ClusterStatusCtrl',
    ['$scope', '$http', '$filter', 'appConfigService', 'clusterHealthService',
    function($scope, $http, $filter, appConfigService, clusterHealthService) {

      $scope.app_config = appConfigService;
      $scope.cluster = clusterHealthService.get();

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
        else {
          
        }
      });


      // I need to split out these into services still:
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
  }]);