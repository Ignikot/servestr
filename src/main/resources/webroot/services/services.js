'use strict';

angular.module('servestrApp.services', [
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
        .useUrlServer("" + location.protocol + "//" + location.hostname + ':8433');//TODO openshift hack
    })
    .constant("servestrConfig", {
    "timeout": 60000
    })
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/services', {
            templateUrl: 'services/services-list.html',
            controller: 'servicesListCtrl'
        });
    }])

    .controller('servicesListCtrl', ['$scope', '$filter', '$http', 'vertxEventBusService', 'uiGridConstants', 'servestrConfig', 'toaster', function ($scope, $filter, $http, vertxEventBusService, uiGridConstants, servestrConfig, toaster) {
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
                "collection": "service",
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
                "collection": "service",
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
                "collection": "service",
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
                    displayName: 'Тип',/*
                    editableCellTemplate: 'ui-grid/dropdownEditor',
                    editDropdownOptionsArray: [
                        {id: 1, stype: 'Сервис'},
                        {id: 2, stype: 'Доработка'}
                    ],*/
                    width: 100
                },
                {name: 'cr', displayName: 'CR',
                 width: 100},
                {name: 'cr2', displayName: 'CR2',
                width: 100},
                {name: 'description', displayName: 'Описание', cellTooltip: true,
                width: 500},
                {name: 'info', displayName: 'Дополнительная информация', cellTooltip: true,
                width: 500},
                {name: 'priority', displayName: 'Приоритет',
                width: 100},
                {name: 'sprint', displayName: 'Спринт', type: 'number', width: 100},
                {name: 'fix', displayName: 'Номер фикса',
                width: 100},
                {name: 'developer_queue', displayName: 'Очередь разработчика',
                width: 100},
                {name: 'tester_queue', displayName: 'Очередь тестировщика',
                width: 100},
                {
                    name: 'plan_end_date',
                    displayName: 'Плановая дата окончания работ',
                    type: 'date',
                    cellFilter: 'date:"yyyy-MM-dd"',
                    width: 100
                },
                {name: 'release', displayName: 'Вошло в сборку',
                width: 100},
                {name: 'jira_done', displayName: 'Jira done',
                width: 100},
                /*{name: 'req', displayName: 'Требование',
                width: 100},*/
                {name: 'jira', displayName: 'JIRA',
                width: 100},
                {name: 'consumer', displayName: 'Потребитель',
                width: 100},
                {name: 'provider', displayName: 'Поставщик',
                width: 100},
                /*{name: 'architect_state', displayName: 'Статус архитектуры',
                width: 100},*/
                {name: 'passport_state', displayName: 'Статус паспорта',
                width: 100},
                {name: 'estimate_analize', displayName: 'Оценка на анализ',
                width: 100},
                {name: 'estimate_dev', displayName: 'Оценка на разработку',
                width: 100},
                {name: 'estimate_test', displayName: 'Оценка на тестирование',
                width: 100},
                {name: 'analist', displayName: 'Аналитик',
                width: 200},
                {
                    name: 'passport_date',
                    displayName: 'Дата паспорта',
                    type: 'date',
                    cellFilter: 'date:"yyyy-MM-dd"',
                    width: 100
                },
                /*{name: 'mapping_state', displayName: 'Статус мэпинга',
                width: 100},*/
                {name: 'developer_state', displayName: 'Статус разработки',
                width: 100},
                {
                    name: 'developer_date',
                    displayName: 'Дата разработки',
                    type: 'date',
                    cellFilter: 'date:"yyyy-MM-dd"',
                    width: 100
                },
                {name: 'developer', displayName: 'Разработчик',
                width: 200},
                {name: 'developer_jira', displayName: 'Задача разработчика в JIRA',
                width: 200},
                /*{name: 'method', displayName: 'Метод тестирования',
                width: 100},*/
                {name: 'test_state', displayName: 'Статус тестирования',
                width: 100},
                {
                    name: 'test_date',
                    displayName: 'Дата тестирования',
                    type: 'date',
                    cellFilter: 'date:"yyyy-MM-dd"',
                    width: 100
                },
                {name: 'test_info', displayName: 'Примечания по тестированию', cellTooltip: true,
                width: 500},
                {name: 'test_script_state', displayName: 'Статус разработки скрипта', width: 100},
                {name: 'test_script_author', displayName: 'Автор скрипта', width: 100},
                {name: 'tester', displayName: 'Тестировщик', width: 200},
                {name: 'test_group', displayName: 'Группа тестов', width: 200},
                {name: 'tester_coverage', displayName: 'Тестовое покрытие', width: 100},
                {name: 'bs_status', displayName: 'Статус бизнес сервиса', cellTooltip: true, width: 500},
                {name: 'wsdl', displayName: 'WSDL url', cellTooltip: true, width: 500},
                {name: 'service', displayName: 'Cервис', cellTooltip: true, width: 500}
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
                "collection": "service",
                "document": rowEntity
            };
            console.log('Send update message: ', angular.toJson(message, true));
            vertxEventBusService.send('servestr.changemanager', angular.fromJson(angular.toJson(message, false)), servestrConfig.timeout)
                .then(function () {
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
            var message = {"action": "find", "collection": "service", "batch_size": 10000};
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