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
        $routeProvider.when('/tasks/', {
            templateUrl: 'components/tasks/tasks-list.html',
            controller: 'tasksListCtrl'
        });
    }])

    .controller('tasksListCtrl', ['$scope', '$filter', '$http', 'vertxEventBusService', 'uiGridConstants', 'servestrConfig', 'toaster', function ($scope, $filter, $http, vertxEventBusService, uiGridConstants, servestrConfig, toaster) {
        $scope.collection = 'task';
        $scope.itemsGridOptions = {};
        $scope.itemsGridOptions.enableColumnResizing = true;
        $scope.itemsGridOptions.enableFiltering = true;
        $scope.itemsGridOptions.enableGridMenu = true;
        $scope.itemsGridOptions.showGridFooter = true;
        $scope.itemsGridOptions.showColumnFooter = true;
        $scope.itemsGridOptions.multiSelect = true;
        $scope.itemsGridOptions.exporterMenuPdf = false;
        $scope.itemsGridOptions.importerDataAddCallback = function ( grid, newObjects ) {
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
                        title: 'Import error',
                        body: reason.message,
                        showCloseButton: true
                    });
                    console.warn('Error import: ' + reason.message);
                });
            $scope.refreshList;
            };
        };

        $scope.addItem = function () {
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
                    $scope.newItem = undefined;
                    angular.forEach($scope.itemsGridOptions.data, function (document, key) {
                        if (document._id === this.reply._id) {
                            this.newItem = document;
                        }
                        ;
                    }, $scope);
                    if (!$scope.newItem) {
                        $scope.newItem = {"_id": reply._id};
                        $scope.itemsGridOptions.data.push($scope.newItem);
                    }
                    ;
                    $scope.gridApi.cellNav.scrollToFocus($scope.newItem, $scope.itemsGridOptions.columnDefs[2]);
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

        $scope.deleteItem = function() {
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

            $scope.itemsGridOptions.columnDefs = [
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
                width: 200},
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
            angular.forEach($scope.itemsGridOptions.columnDefs, function (column, key) {
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

            angular.forEach($scope.itemsGridOptions.columnDefs, function (column, key) {
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

            $scope.itemsGridOptions.data = reply;

                    toaster.pop(
                    {
                        type: 'success',
                        title: 'Refresh success',
                        body: 'Success on refreshing list',
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
                angular.forEach($scope.itemsGridOptions.data, function (document, key) {
                    if (document._id === this.message.document._id) {
                        this.itemsGridOptions.data[key] = this.message.document;
                        this.$apply();
                    }
                    ;
                }, $scope);
            }
            ;
            if (action === 'insert') {
                $scope.newPossibleItem = undefined;
                angular.forEach($scope.itemsGridOptions.data, function (document, key) {
                    if (document._id === this.message._id) {
                        this.newPossibleItem = document;
                    }
                    ;
                }, $scope);
                if (!$scope.newPossibleItem) {
                    $scope.itemsGridOptions.data.push({"_id": message._id});
                }
                ;
            }
            ;
            if (action === 'delete') {
                var idList = message.query._id.$in;
                console.warn('query :' + angular.toJson(idList, true));
                $scope.itemsGridOptions.data = $filter('filter')($scope.itemsGridOptions.data, function(item) {
                    console.warn('if delete :' + item._id);
                    console.warn('indexOf :' + idList.indexOf(item._id));
                    return -1 === idList.indexOf(item._id)}
                );
            }
            ;
        };

        var afterItemEdit = function (rowEntity, colDef, newValue, oldValue) {
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

        $scope.itemsGridOptions.onRegisterApi = function (gridApi) {
            $scope.gridApi = gridApi;
            gridApi.edit.on.afterCellEdit($scope, afterItemEdit);
            $scope.loadColumns();
        };


        $scope.$on('vertx-eventbus.system.connected', $scope.refreshList);

        vertxEventBusService.on('servestr.news', processEvent);

    }]);