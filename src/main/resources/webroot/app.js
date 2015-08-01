'use strict';

// Declare app level module which depends on views, and components
angular.module('servestrApp', [
  'ngRoute',
  'servestrApp.services',
  'servestrApp.tasks',
  'knalli.angular-vertxbus',
  'toaster'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/home', {templateUrl: 'components/home/home.html'})
    .otherwise({redirectTo: '/services'});
}])
.constant("servestrConfig", {
    "timeout": 60000
});
