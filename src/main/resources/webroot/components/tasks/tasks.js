'use strict';

angular.module('servestrApp.tasks', [
    'ngRoute',
    'ui.grid',
    'ui.grid.cellNav',
    'ui.grid.edit',
    'ui.grid.resizeColumns',
    'ui.grid.pinning',
    'ui.grid.selection',
    'ui.grid.moveColumns',
    'ui.grid.exporter',
    'ui.grid.importer',
    'knalli.angular-vertxbus',
    'toaster'
])
    .config(function(vertxEventBusProvider) {
        vertxEventBusProvider
        .enable()
        .useReconnect()
        .useUrlServer("https://" + location.hostname);//TODO openshift hack
    })
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/tasks', {
            templateUrl: 'components/tasks/tasks-list.html',
            controller: 'tasksListCtrl'
        });
    }])

    .controller('tasksListCtrl', ['$scope', '$filter', '$http', 'vertxEventBusService', 'uiGridConstants', 'servestrConfig', 'toaster', function ($scope, $filter, $http, vertxEventBusService, uiGridConstants, servestrConfig, toaster) {
        $scope.collection = 'task';
        $scope.servicesGridOptions = {};
        $scope.servicesGridOptions.enableColumnResizing = true;
        $scope.servicesGridOptions.enableFiltering = true;
        $scope.servicesGridOptions.enableGridMenu = true;
        $scope.servicesGridOptions.showGridFooter = true;
        $scope.servicesGridOptions.showColumnFooter = true;
        $scope.servicesGridOptions.multiSelect = true;
        $scope.servicesGridOptions.exporterMenuPdf = false;
        $scope.servicesGridOptions.importerDataAddCallback = function ( grid, newObjects ) {
            for(var index = 0; index < newObjects.length; ++index) {
            var document = newObjects[index];
            delete document._id;
            var message = {
                "action": "save",
                "collection": $scope.collection,
                "document": document
            };
            console.log('Send message: ', angular.toJson(message, true));
            vertxEventBusService.send('servestr.changemanager', angular.fromJson(angular.toJson(message, false)), servestrConfig.timeout)
                .then(function (reply) {
                })
                .catch(function (reason) {
                    toaster.pop(
                    {
                        type: 'error',
                        title: 'Import service error',
                        body: reason.message,
                        showCloseButton: true
                    });
                    console.warn('Error import service: ' + reason.message);
                });
            $scope.refreshList;
            };
        };

        $scope.addService = function () {
            var message = {
                "action": "insert",
                "collection": $scope.collection,
                "document": {}
            };
            console.log('Send message: ', angular.toJson(message, true));
            vertxEventBusService.send('servestr.changemanager', angular.fromJson(angular.toJson(message, false)), servestrConfig.timeout)
                .then(function (reply) {
                    console.log('get reply: ', angular.toJson(reply, true));
                    $scope.reply = reply;
                    $scope.newService = undefined;
                    angular.forEach($scope.servicesGridOptions.data, function (document, key) {
                        if (document._id === this.reply._id) {
                            this.newService = document;
                        }
                        ;
                    }, $scope);
                    if (!$scope.newService) {
                        $scope.newService = {"_id": reply._id};
                        $scope.servicesGridOptions.data.push($scope.newService);
                    }
                    ;
                    $scope.gridApi.cellNav.scrollToFocus($scope.newService, $scope.servicesGridOptions.columnDefs[2]);
                })
                .catch(function (reason) {
                    toaster.pop(
                    {
                        type: 'error',
                        title: 'Insert error',
                        body: reason.message,
                        showCloseButton: true
                    });
                    console.warn(reason.message);
                });
        };

        $scope.deleteService = function() {
            var _idValues = [];
            var selection = $scope.gridApi.selection.getSelectedRows();
            for (var i = 0; i < selection.length; i++) {
                _idValues.push(selection[i]["_id"]);
            };
            var message = {
                "action": "delete",
                "collection": $scope.collection,
                "query": {
                    "_id": {
                        "$in": _idValues
                    }
                }
            };
            console.log('Send delete message: ', angular.toJson(message, true));
            vertxEventBusService.send('servestr.changemanager', message, servestrConfig.timeout).then(function () {}).catch(function (reason) {
                    toaster.pop(
                    {
                        type: 'error',
                        title: 'Delete error',
                        body: reason.message,
                        showCloseButton: true
                    });
                console.warn(reason.message);
            });
        };

        $scope.clearFilters = function() {
            $scope.gridApi.core.clearAllFilters();
        };

        $scope.loadColumns = function() {

            $scope.servicesGridOptions.columnDefs = [
                {
                    name: '_id',
                    enableCellEdit: false,
                    displayName: '_id',
                    visible: false,
                    width: 200
                },
                {name: 'code', displayName: 'Код', width: 100},
                {
                    name: 'stype',
                    displayName: 'Тип',
                    width: 100
                },
                {name: 'manager', displayName: 'Ответственный',
                width: 200},
                {name: 'state', displayName: 'Состояние',
                width: 100},
                {name: 'substate', displayName: 'Подстатус дефекта\CR',
                width: 100},
                {name: 'description', displayName: 'Описание', cellTooltip: true,
                width: 500},
                {name: 'executor', displayName: 'Исполнитель',
                width: 200},
                {name: 'jira', displayName: 'JIRA DEF',
                width: 100},
                {name: 'environment', displayName: 'Environment',
                width: 200},
                {name: 'multi', displayName: 'Multi',
                width: 100},
                {name: 'severity', displayName: 'Severity',
                width: 100},
                {name: 'status', displayName: 'Status',
                width: 100},
                {name: 'summary', displayName: 'Summary', cellTooltip: true,
                width: 500},
                {name: 'creator', displayName: 'Creator',
                {
                    name: 'created​',
                    displayName: 'Created​',
                    type: 'date',
                    cellFilter: 'date:"yyyy-MM-dd"',
                    width: 100
                },
                {name: 'pad', displayName: ' ', enableCellEdit: false, enableFiltering: false, enableSorting: false, enableColumnResizing:false, enableGridMenu: false, width: 100}
            ];

            $scope.dateColumns = [];
            angular.forEach($scope.servicesGridOptions.columnDefs, function (column, key) {
                if(column.type === "date") {
                    this.push(column.name);
                    };
            }, $scope.dateColumns);

            var newFilter = function (searchTerm, cellValue, row, column) {
                if (angular.isUndefined(searchTerm) || searchTerm == null || searchTerm.trim() == '') {
                    return true;
                };
                var value = ((cellValue)?cellValue.toString():'').toUpperCase();
                var sTerms = searchTerm.trim().toUpperCase().split(" ");
                var result = false;
                for (var i = 0; i < sTerms.length; i++) {
                    var sTerm = (sTerms[i]).trim();
                    var isNot = false;
                    if (sTerm.charAt(0) == '!') {
                        isNot = true;
                        sTerm = sTerm.slice(1);
                    };
                    result = result || (isNot)?(value.indexOf(sTerm) == -1):(value.indexOf(sTerm) != -1);
                };
                return result;
            };

            angular.forEach($scope.servicesGridOptions.columnDefs, function (column, key) {
                column.filter = {
                    condition: newFilter,
                    flags: { caseSensitive: false }
                };
            }, null);

        };

        $scope.saveSettings = function() {
        };

        var processRefreshReply = function (reply) {
            console.log('A reply received: ', angular.toJson(reply, true));
            angular.forEach(reply, function (document, key) {
                for(var i = 0; i < this.dateColumns.length; i++) {
                    var name = this.dateColumns[i];
                    var stringValue = document[name];
                    if(stringValue != undefined && stringValue != null && stringValue.trim() != '') {
                        document[name] = new Date(stringValue);
                    };
                };
            }, $scope);

            $scope.servicesGridOptions.data = reply;

                    toaster.pop(
                    {
                        type: 'success',
                        title: 'Refresh success',
                        body: 'Success on refreshing service list',
                        timeout:5000,
                        showCloseButton: true
                    });

        };

        var processEvent = function (message) {
            if(message.collection != $scope.collection) return;
            console.log('Received a event: ', angular.toJson(message, true));
            var action = message.action;
            $scope.message = message;
            if (action === 'save') {
                for(var i = 0; i < $scope.dateColumns.length; i++) {
                    var name = $scope.dateColumns[i];
                    var stringValue = message.document[name];
                    if(stringValue != undefined && stringValue != null && stringValue != '') {
                        message.document[name] = new Date(stringValue);
                    };
                };
                angular.forEach($scope.servicesGridOptions.data, function (document, key) {
                    if (document._id === this.message.document._id) {
                        this.servicesGridOptions.data[key] = this.message.document;
                        this.$apply();
                    }
                    ;
                }, $scope);
            }
            ;
            if (action === 'insert') {
                $scope.newPossibleService = undefined;
                angular.forEach($scope.servicesGridOptions.data, function (document, key) {
                    if (document._id === this.message._id) {
                        this.newPossibleService = document;
                    }
                    ;
                }, $scope);
                if (!$scope.newPossibleService) {
                    $scope.servicesGridOptions.data.push({"_id": message._id});
                }
                ;
            }
            ;
            if (action === 'delete') {
                var idList = message.query._id.$in;
                console.warn('query :' + angular.toJson(idList, true));
                $scope.servicesGridOptions.data = $filter('filter')($scope.servicesGridOptions.data, function(item) {
                    console.warn('if delete :' + item._id);
                    console.warn('indexOf :' + idList.indexOf(item._id));
                    return -1 === idList.indexOf(item._id)}
                );
            }
            ;
        };

        var afterServiceEdit = function (rowEntity, colDef, newValue, oldValue) {
            if (newValue == oldValue) return;
            var message = {
                "action": "save",
                "collection": $scope.collection,
                "document": rowEntity
            };
            console.log('Send update message: ', angular.toJson(message, true));
            vertxEventBusService.send('servestr.changemanager', angular.fromJson(angular.toJson(message, false)), servestrConfig.timeout)
                .then(function (reply) {
                if(reply.error === true)
                    toaster.pop(
                    {
                        type: 'error',
                        title: 'Update error ',
                        body: reply.message,
                        showCloseButton: true
                    });
                })
                .catch(function (reason) {
                    toaster.pop(
                    {
                        type: 'error',
                        title: 'Update error ',
                        body: reason.message,
                        showCloseButton: true
                    });
                    console.warn(reason.message);
                });
        };

        $scope.refreshList = function () {
            var message = {"action": "find", "collection": $scope.collection, "batch_size": 10000};
            vertxEventBusService.send('servestr.changemanager', message, servestrConfig.timeout)
                .then(processRefreshReply)
                .catch(function (reason) {
                    toaster.pop(
                    {
                        type: 'error',
                        title: 'Refresh error',
                        body: reason.message,
                        showCloseButton: true
                    });
                });
        };

        $scope.servicesGridOptions.onRegisterApi = function (gridApi) {
            $scope.gridApi = gridApi;
            gridApi.edit.on.afterCellEdit($scope, afterServiceEdit);
            $scope.loadColumns();
        };


        $scope.$on('vertx-eventbus.system.connected', $scope.refreshList);

        vertxEventBusService.on('servestr.news', processEvent);

    }]);