angular.module('dashES.services', [])
  // appConfigService user configuration options
  .factory('appConfig', [function() {
    var conf = {
      es_host: null,
      // Register all the http endpoints the app should be able to 
      // load via the dashboardData service.
      primary_endpoints: {
        health: '/_cluster/health',
        node_stats: '/_cluster/nodes/stats',
        indices: '/_stats?clear=true&docs=true&store=true&indexing=true',
        routing: '/_cluster/state?filter_indices=true&filter_blocks=true&filter_metadata=true&filter_nodes=true'
      }
    };
    return conf;
  }])

  // dashboardData Service returns an object consisting of promises 
  // for each of the http endpoints.
  .factory('dashboardData', 
    ['$http', '$q', 'appConfig', 
    function($http, $q, appConfig) {
      var app_config = appConfig;
      var dashes_data = {};

      for(var key in app_config.primary_endpoints) {
        var path = app_config.primary_endpoints[key];
        dashes_data['get_'+key] = (function (path, key) {
          var last_request_failed = true;
          var data = {};
          var promise = undefined;

          fn = function() {
            if(!promise || last_request_failed) {
              promise = $http.get(app_config.es_host+path).then(
                function(response) {
                  last_request_failed = false;
                  data = response.data;
                  return data;
                },
                function(response) {  // error
                  last_request_failed = true;
                  return $q.reject(response);
                }
              );
            }
            return promise;
          };
          return fn;
        })(path, key);
      }

      return dashes_data;
  }]);