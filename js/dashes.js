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

}

