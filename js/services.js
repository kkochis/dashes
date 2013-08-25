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
    ['$http', 'appConfigService', 
    function($http, appConfigService) {
      var app_config = appConfigService;

      var cluster_health = {
        data: {},
        get: function(callback) {
          $http.get(app_config.es_host+'/_cluster/health').success(function(data) {
            var self = this;
            self.data = data;
            callback(self.data);
          });
        }
      };
      
      return cluster_health;
  }]);