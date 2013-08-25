angular.module('dashES.controllers',[])

  .controller('DashESCtrl',
    ['$scope', 'appConfigService', 'clusterHealthService', 
    function($scope, appConfigService, clusterHealthService) {
      clusterHealthService.get(function(data) {
        $scope.books = data;
      });

      $scope.orderProp = 'author';
  }])

  .controller('ClusterStatusCtrl',
    ['$scope', 'appConfigService', 'clusterHealthService',
    function($scope, appConfigService, clusterHealthService) {
      
  }]);