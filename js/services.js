angular.module('dashES.services', [])
  // appConfigService user configuration options
  .factory('appConfigService', [function() {
    var conf = {
      es_host: null
    };
    return conf;
  }])

  // clusterHealthService queries the cluster health API
  .factory('clusterHealthService', 
    ['$http', '$q', 'appConfigService', 
    function($http, $q, appConfigService) {
      var app_config = appConfigService;
      var data = {};
      var last_request_failed = true;
      var promise = undefined;
      
      var cluster_health = {
        get: function() {
          if(!promise || last_request_failed) {
            promise = $http.get(app_config.es_host+'/_cluster/health').then(
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
        }
      };
      
      return cluster_health;
  }]);