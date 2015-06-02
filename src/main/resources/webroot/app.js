'use strict';

// Declare app level module which depends on views, and components
angular.module('servestrApp', [
  'ngRoute',
  'servestrApp.services',
  'knalli.angular-vertxbus',
  'toaster'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/services'});
}]);
