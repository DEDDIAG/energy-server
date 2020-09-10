var app = angular.module('lvsCharts', ['ngRoute', 'angular.filter', 'xeditable']);

app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.when('/house/', {
            templateUrl: 'templates/house_list.html',
            controller: 'HouseListController',
            name: 'HouseList'
        }).when('/house/:house_id', {
            templateUrl: 'templates/house_details.html',
            controller: 'HouseListController',
            name: 'HouseDetails'
        }).when('/item/:item_id', {
            templateUrl: 'templates/item_details.html',
            controller: 'ItemDetailController',
            name: 'ItemDetails'
        }).when('/item/:item_id/events/', {
            templateUrl: 'templates/item_events.html',
            controller: 'EventsController',
            name: 'ItemEvents'
        }).when('/item/:item_id/range/:start_date?/:stop_date?', {
            templateUrl: 'templates/item_range.html',
            controller: 'RangeController',
            name: 'ItemRange'
        }).when('/item/:item_id/annotation/:start_date?/:stop_date?', {
            templateUrl: 'templates/item_annotation.html',
            controller: 'AnnotationController',
            name: 'ItemAnnotation'
        }).otherwise({
            redirectTo: '/house'
        });
    }]);

app.factory('ApiClient', ['$q', function ($q) {
    var ApiClient = new SwaggerClient({
        url: '/api/swagger.json',
        usePromise: true
    })
    return ApiClient;
}]);


app.controller('navController', ['$scope', '$route', function ($scope, $route) {
    $scope.$route = $route;
}]);

//
app.controller('mainController', ['$rootScope', '$filter', 'ApiClient', '$route', '$location', function ($rootScope, $filter, ApiClient, $route, $location) {
    $rootScope.loadingQueue = 0;
    $rootScope.$route = $route;

    ApiClient.then(function (ApiClient) {
        $rootScope.loadingQueue++;
        $rootScope.$apply();
        ApiClient.items.get_items().then(function (items) {
            $rootScope.items = items.obj.map(function (itm) {
                itm.first_date = moment(itm.first_date);
                itm.last_date = moment(itm.last_date);
                itm.duration = moment.duration(itm.last_date - itm.first_date); // item duration
                return itm;
            });
            $rootScope.items = $filter('orderBy')(items.obj, ['house_id', 'label']);
        })
            .catch(function (error) {
                $rootScope.errorMsg = error.obj['message'];
            }).finally(function () {
            $rootScope.loadingQueue--;
            $rootScope.$apply();
        });
    });

    $rootScope.gotoHouse = function (house_id) {
        $location.path('/house/' + house_id)
    };

    $rootScope.gotoItem = function (item_id) {
        $location.path('/item/' + item_id)
    };

    $rootScope.gotoRange = function (item_id, start_date, stop_date) {
        if(start_date !== undefined && stop_date !== undefined) {
            $location.path('/item/' + item_id + '/range/' + start_date.format() + '/' + stop_date.format())
        } else {
            $location.path('/item/' + item_id + '/range/')
        }
    };

    $rootScope.gotoAnnotation = function (item_id, start_date, stop_date) {
        if(start_date !== undefined && stop_date !== undefined) {
            $location.path('/item/' + item_id + '/annotation/' + start_date.format() + '/' + stop_date.format())
        } else {
            $location.path('/item/' + item_id + '/annotation/')
        }
    };
}]);

app.controller('ItemDetailController', ['$rootScope', '$scope', '$filter', '$routeParams', 'ApiClient', '$route', function ($rootScope, $scope, $filter, $routeParams, ApiClient, $route) {
    $scope.get_selected_item = function () {
        if ($rootScope.items === undefined) {
            return
        }
        return $filter('where')($rootScope.items, {'item_id': $routeParams.item_id})[0]
    };


    $scope.loadAnnotation = function(start_date, stop_date) {
        ApiClient.then(function (ApiClient) {

            ApiClient.items.get_item_annotation_label({
                'item_id': $routeParams.item_id,
            })
                .then(function (request) {
                    $rootScope.annotation_labels = request.obj.reduce(function (map, obj) {
                        map[obj.id] = obj;
                        return map;
                    }, {});

                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                }).finally(function () {
                    $rootScope.$apply();
            });

            ApiClient.items.get_item_annotation(
                {
                    'item_id': $routeParams.item_id,
                    'start_date': start_date.toISOString(),
                    'stop_date': stop_date.toISOString()
                })
                .then(function (request) {

                    $scope.annotation_data = request.obj.reduce(function (map, obj) {
                        obj.start_date = moment(obj.start_date);
                        obj.stop_date = moment(obj.stop_date);
                        obj.duration  = moment.duration(obj.stop_date - obj.start_date);
                        map[obj.id] = obj
                        return map;
                    }, {});
                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                    console.log('get_item_annotation() failed with message: ' + error.statusText);
                }).finally(function () {
                    $rootScope.$apply();
            });
        });
    }

    $scope.labelCount = function(label_id) {
        var count =0;
        for(key in $scope.annotation_data) {
            if($scope.annotation_data[key].label_id == label_id) {
                count++;
            }
        }
        return count
    }

    $scope.deleteAnnotationLabel = function(label) {

         ApiClient.then(function (ApiClient) {
                 ApiClient.items.delete_item_annotation_label_alter(
                 {
                        item_id: label.item_id,
                        label_id: label.id,
                    }).then(function(response){
                        delete $scope.annotation_labels[label.id];
                    }) .catch(function (error) {
                        console.log(error);
                    }).finally(function () {
                        $scope.$apply();
                    });
         });
    }

    $scope.addAnnotationLabel = function() {

        $scope.inserted = {
            id: undefined,
            item_id: parseInt($routeParams.item_id),
            label_id: undefined,
            text: "",
            description: ""
        };
        $scope.annotation_labels[-1] = $scope.inserted;
    }

    $scope.saveNewAnnotationLabel = function(label) {

           ApiClient.then(function (ApiClient) {
            ApiClient.items.put_item_annotation_label({
                item_id: label.item_id,
                payload: {
                    text: label.text,
                    description: label.description
                }
            })
             .then(function(response){
                 console.log(response)
                 var item = $route.current.scope.get_selected_item()
                 // TODO: get just new annotation and not all
                 $scope.loadAnnotation(item.first_date, item.last_date)
            }) .catch(function (error) {
                console.log(error);
            }).finally(function () {
                $scope.$apply();
            })
        })
    }

    $scope.saveAnnotationLabel = function(label) {
        if(label.id === undefined) {
            $scope.saveNewAnnotationLabel(label)
        } else {
            console.log(label)
            $scope.updateAnnotationLabel(label)
        }
    }

    $scope.updateAnnotationLabel = function(label) {
        ApiClient.then(function (ApiClient) {
             console.log(label)
             ApiClient.items.post_item_annotation_label_alter({
                 item_id: label.item_id,
                 label_id: label.id,
                payload: {
                    text: label.text,
                    description: label.description
                },
             }).then(function(response){
                $scope.annotation_labels[label.id] = label;
            }) .catch(function (error) {
                console.log(error);
            }).finally(function () {
                $scope.$apply();
            });
        });
    }

}]);


app.controller('HouseListController', ['$scope', '$filter', '$routeParams', '$location', function ($scope, $filter, $routeParams, $location) {
    $scope.selected_house_id = $routeParams.house_id;



}]);

app.controller('RangeController', ['$rootScope', '$scope', '$filter', 'ApiClient', '$routeParams', function ($rootScope, $scope, $filter, ApiClient, $routeParams) {

    $scope.get_selected_item = function () {
        if ($rootScope.items === undefined) {
            return
        }
        return $filter('where')($rootScope.items, {'item_id': $routeParams.item_id})[0]
    };


    $scope.selectedDateRangeChanged = function (start_date, stop_date, label) {
        ApiClient.then(function (ApiClient) {
            $rootScope.loadingQueue++;
            ApiClient.items.get_item_values(
                {
                    'item_id': $routeParams.item_id,
                    'start_date': start_date.toISOString(),
                    'stop_date': stop_date.toISOString(),
                })
                .then(function (request) {
                    $scope.values_data = request.obj;
                    $scope.$broadcast('plotDataChanged');
                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                    console.log('get_item_values() failed with message: ' + error.statusText);
                    $rootScope.$apply();
                }).finally(function () {
                $rootScope.loadingQueue--;
                $rootScope.$apply();
            });

            $rootScope.loadingQueue++;
            $rootScope.$apply();
            ApiClient.items.get_item_energy(
                {
                    'item_id': $routeParams.item_id,
                    'start_date': start_date.toISOString(),
                    'stop_date': stop_date.toISOString(),
                })
                .then(function (request) {
                    $scope.energy = request.obj['energy'];
                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                    console.log('get_item_energy() failed with message: ' + error.statusText);
                }).finally(function () {
                $rootScope.loadingQueue--;
                $rootScope.$apply();
            });
        });
    };
}]);

app.controller('AnnotationController', ['$rootScope', '$scope', '$filter', 'ApiClient', '$routeParams','$timeout', function ($rootScope, $scope, $filter, ApiClient, $routeParams, $timeout) {

    $scope.annotation_data = []

    $scope.get_selected_item = function () {
        if ($rootScope.items === undefined) {
            return
        }
        return $filter('where')($rootScope.items, {'item_id': $routeParams.item_id})[0]
    };


    $scope.selectedDateRangeChanged = function (start_date, stop_date) {
        ApiClient.then(function (ApiClient) {

            $scope.loadAnnotation(start_date, stop_date);

            $rootScope.loadingQueue++;
            ApiClient.items.get_item_values(
                {
                    'item_id': $routeParams.item_id,
                    'start_date': start_date.toISOString(),
                    'stop_date': stop_date.toISOString(),
                })
                .then(function (request) {
                    $scope.values_data = request.obj;
                    $scope.$broadcast('plotDataChanged');
                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                    console.log('get_item_values() failed with message: ' + error.statusText);
                    $rootScope.$apply();
                }).finally(function () {
                $rootScope.loadingQueue--;
                $rootScope.$apply();
            });

            $rootScope.loadingQueue++;
            $rootScope.$apply();
            ApiClient.items.get_item_energy(
                {
                    'item_id': $routeParams.item_id,
                    'start_date': start_date.toISOString(),
                    'stop_date': stop_date.toISOString(),
                })
                .then(function (request) {
                    $scope.energy = request.obj['energy'];
                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                    console.log('get_item_energy() failed with message: ' + error.statusText);
                }).finally(function () {
                $rootScope.loadingQueue--;
                $rootScope.$apply();
            });
        });
    };


    $scope.loadAnnotation = function(start_date, stop_date) {
        ApiClient.then(function (ApiClient) {
            $rootScope.loadingQueue++;
            ApiClient.items.get_item_annotation_label({
                'item_id': $routeParams.item_id,
            })
                .then(function (request) {
                    $rootScope.annotation_labels = request.obj.reduce(function (map, obj) {
                        map[obj.id] = obj;
                        return map;
                    }, {});
                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                    console.log('get_item_annotation_label() failed with message: ' + error.statusText);
                    $rootScope.$apply();
                }).finally(function () {
                $rootScope.loadingQueue--;
                $rootScope.$broadcast('plotAnnotationDataChanged');
                $rootScope.$apply();
            });

            $rootScope.loadingQueue++;
            $rootScope.$apply();
            ApiClient.items.get_item_annotation(
                {
                    'item_id': $routeParams.item_id,
                    'start_date': start_date.toISOString(),
                    'stop_date': stop_date.toISOString(),
                })
                .then(function (request) {

                    $scope.annotation_data = request.obj.reduce(function (map, obj) {
                        obj.start_date = moment(obj.start_date);
                        obj.stop_date = moment(obj.stop_date);
                        map[obj.id] = obj
                        return map;
                    }, {});
                })
                .catch(function (error) {
                    $scope.errorMsg = error.statusText;
                    console.log('get_item_annotation() failed with message: ' + error.statusText);
                    $rootScope.$apply();
                }).finally(function () {
                $rootScope.loadingQueue--;
                $rootScope.$broadcast('plotAnnotationDataChanged');
                // $scope.$broadcast("plotDataChanged");
                $rootScope.$apply();
            });
        });
    }

    $scope.addAnnotation = function(start_date=undefined, stop_date= undefined) {
        var label_id = Object.keys($scope.annotation_labels)[0]
        $scope.inserted = {
            id: undefined,
            item_id: parseInt($routeParams.item_id),
            label_id: label_id,
            start_date: start_date,
            stop_date: stop_date
        };
        $scope.annotation_data[-1] = $scope.inserted;
    }

    $scope.saveNewAnnotation = function(annotation) {
        ApiClient.then(function (ApiClient) {
            $rootScope.loadingQueue++;
            $scope.$apply();
            ApiClient.items.put_item_annotation_put({
                item_id: annotation.item_id,
                payload: {
                    label_id: annotation.label_id,
                    start_date: annotation.start_date.toISOString(),
                    stop_date: annotation.stop_date.toISOString()
                }
            })
             .then(function(response){
                // TODO: get new annotation id
                 console.log(response)
                // $scope.annotation_data[annotation.id] = annotation
                 $scope.loadAnnotation(moment($routeParams.start_date), moment($routeParams.stop_date))
            }) .catch(function (error) {
                console.log(error);
            }).finally(function () {
                $rootScope.loadingQueue--;
                $scope.$apply();
            })
        })
    }

    $scope.updateAnnotation = function(annotation) {
        ApiClient.then(function (ApiClient) {
             annotation.start_date = moment(annotation.start_date)
             annotation.stop_date = moment(annotation.stop_date)

             $rootScope.loadingQueue++;
             $scope.$apply();
             ApiClient.items.post_item_annotation_alter({
                item_id: annotation.item_id,
                annotation_id: annotation.id,
                payload: {
                    label_id: annotation.label_id,
                    start_date: annotation.start_date.toISOString(),
                    stop_date: annotation.stop_date.toISOString()
                },
             }).then(function(response){
                $scope.annotation_data[annotation.id] = annotation;
                $rootScope.$broadcast('plotAnnotationDataChanged');
                $rootScope.$broadcast('plotDataChanged');
            }) .catch(function (error) {
                console.log(error);
            }).finally(function () {
                $rootScope.loadingQueue--;
                $scope.$apply();
            });
        });
    }

    $scope.saveAnnotation = function(annotation, annotation_id) {
        if(annotation_id === undefined) {
            $scope.saveNewAnnotation(annotation)
        } else {
            $scope.updateAnnotation(annotation)
        }
    }

    $scope.deleteAnnotation = function(annotation) {
         if(annotation.id === undefined) {
             delete $scope.annotation_data[-1];
             return;
         }

         ApiClient.then(function (ApiClient) {
                 $rootScope.loadingQueue++;
                 $scope.$apply();
                 ApiClient.items.delete_item_annotation_alter(
                 {
                        item_id: annotation.item_id,
                        annotation_id: annotation.id,
                    }).then(function(response){
                        delete $scope.annotation_data[annotation.id];
                        $rootScope.$broadcast('plotAnnotationDataChanged');
                    }) .catch(function (error) {
                        console.log(error);
                    }).finally(function () {
                        $rootScope.loadingQueue--;
                        $scope.$apply();
                    });
         });
    }
}]);

app.controller('EventsController', ['$rootScope', '$scope', '$filter', 'ApiClient', '$routeParams', '$timeout', function ($rootScope, $scope, $filter, ApiClient, $routeParams, $timeout) {

    $scope.get_selected_item = function () {
        if ($rootScope.items === undefined) {
            return
        }
        return $filter('where')($rootScope.items, {'item_id': $routeParams.item_id})[0]
    };

    // reset energy value
    $rootScope.energy = undefined;
    // request data
    ApiClient.then(function (ApiClient) {
        $rootScope.loadingQueue++;
        $rootScope.$apply();
        ApiClient.items.get_item_events({'item_id': $routeParams.item_id})
            .then(function (events) {
                $scope.events = events.obj.map(function (data) {
                    data.start_date = moment(data.start_date);
                    data.stop_date = moment(data.stop_date);
                    data.duration = moment.duration(data.stop_date - data.start_date); // event duration
                    return data;
                });
                $scope.events = events.obj;

                $scope.selectedEvent = ["0"];
                $scope.event_data = new Array(events.obj.length);
                if ($scope.event_data.length > 0) {
                    $scope.selectedEventChanged();
                }
                ;
            })
            .catch(function (error) {
                $scope.events = [];
                $scope.event_event_data = [];
                console.log('get_item_events() failed with message: ' + error.statusText);
            }).finally(function () {
            // lets make a event selectpicker
            $timeout(function () {
                $('#selectEvent').selectpicker();
            });
            $rootScope.loadingQueue--;
            $rootScope.$apply();
        });
    });

    $scope.selectedEventChanged = function () {
        ApiClient.then(function (ApiClient) {
            $.each($scope.selectedEvent, function (index, value) {
                if ($scope.event_data[value] !== undefined) {
                    $scope.$broadcast('plotDataChanged');
                    return
                }

                $scope.loadingQueue++;
                $rootScope.$apply();
                ApiClient.items.get_item_event_values(
                    {
                        'item_id': $routeParams.item_id,
                        'eid': $scope.events[value].eid
                    })
                    .then(function (request) {
                        $scope.event_data[value] = request.obj[0].values;
                        $scope.$broadcast('plotDataChanged');
                    })
                    .catch(function (error) {
                        console.log('get_item_event_values() failed with message: ' + error.statusText);
                        $scope.errorMsg = error.statusText;
                    }).finally(function () {
                    $scope.loadingQueue--;
                    $rootScope.$apply();
                });
            });
        });
    };
}]);

/*
    Plot directive
 */

app.directive('linePlot', function () {
    // Create a link function
    function linkFunc($scope, element, attrs) {

        //Set vertical height size
        $(element[0]).height('80vh');
        Plotly.newPlot(element[0], [], {});

        $scope.$on('plotAnnotationDataChanged', function () {
            $scope.annotations = [];
            $scope.pending_annotations = [];
            for(var key in $scope.annotation_data){
                var a = $scope.annotation_data[key]
                if(a.start_date != undefined && a.stop_date != undefined) {

                    let fillColor = (a.id == undefined) ? '#dd3900' : '#d3d3d3';
                    $scope.annotations.push({
                        type: 'rect',
                        xref: 'x',
                        yref: 'paper',
                        x0: a.start_date.format('YYYY-MM-DD HH:mm:ss'),
                        y0: 0,
                        x1: a.stop_date.format('YYYY-MM-DD HH:mm:ss'),
                        y1: 1,
                        fillcolor: fillColor,
                        opacity: 0.2,
                        line: {
                            width: 0
                        }
                    });
                } else {
                    // Pending Annotation start marker
                    $scope.pending_annotations.push({
                          x: a.start_date.format('YYYY-MM-DD HH:mm:ss'),
                          y: 5,
                          xref: 'x',
                          yref: 'y',
                          showarrow: true,
                          arrowhead: 7,
                          ax: 0,
                          ay: -40
                        });
                }
            }

            var layout = {
                'padding': '0',
                'margin': 0,
                'shapes': $scope.annotations,
                'annotations': $scope.pending_annotations
            };

            Plotly.relayout(element[0], layout)

        });

        $scope.$on('plotDataChanged', function () {
            $scope.d = [];

            // Events
            if ($scope.event_data !== undefined) {
                $.each($scope.selectedEvent, function (index, value) {
                    $scope.push({
                        y: $scope.event_data[value],
                        name: $scope.events[value].start_date.format('YYYY-MM-DD HH:mm:ss'),
                        line: {shape: 'hv'}
                    });
                });

            }
            // Range
            else if ($scope.values_data !== undefined) {
                $scope.d.push({
                    x: $scope.values_data['time'].map(function (time) {
                        // plotly does not respect timezones or DST
                        // therefore we format time using moment.js
                        return moment(time).format('YYYY-MM-DD HH:mm:ss')
                    }),
                    y: $scope.values_data['value'],
                    line: {shape: 'hv'}
                });
            } else {
                return
            }

            var selectorOptions = {
                buttons: [{
                    step: 'hour',
                    stepmode: 'backward',
                    count: 1,
                    label: '1h'
                }, {
                    step: 'hour',
                    stepmode: 'backward',
                    count: 6,
                    label: '6h'
                }, {
                    step: 'hour',
                    stepmode: 'todate',
                    count: 12,
                    label: '12h'
                }, {
                    step: 'day',
                    stepmode: 'backward',
                    count: 1,
                    label: '1d'
                }, {
                    step: 'week',
                    stepmode: 'backward',
                    count: 1,
                    label: '1w'
                }
                , {
                    step: 'all',
                }],
            };

            var layout = {
                padding: '0',
                margin: 0,
                shapes: $scope.annotations,
                annotations: $scope.pending_annotations,
                xaxis: {
                    rangeselector: selectorOptions,
                    rangeslider: {}
                },
                yaxis: {
                    fixedrange: true
                }
            };

            Plotly.react(element[0], $scope.d, layout);

            $(window).resize(function () {
                Plotly.Plots.resize(element[0]);
            });
        }, true);
    }

    // Return this function for linking ...
    return {
        restrict: 'A',
        link: linkFunc

    };
});

app.directive('lineAnnotationPlot', ['ApiClient','$rootScope', function(ApiClient, $rootScope) {
     function linkFunc($scope, element, attrs) {
         $(element[0]).on('plotly_click', function (obj, data) {
             if($scope.annotation_data[-1] == undefined || $scope.annotation_data[-1].id != undefined) {
                 return
             }
             clicked_date = data.points[0].x

             if ($scope.annotation_pending === undefined) {
                 $scope.annotation_pending = clicked_date
                 $scope.annotation_data[-1].start_date = moment(clicked_date)
                 $scope.$apply()
                 $rootScope.$broadcast('plotAnnotationDataChanged');
             } else {
                 if($scope.annotation_pending < clicked_date) {
                     start_date = $scope.annotation_pending;
                     stop_date = clicked_date;
                 } else {
                     start_date = clicked_date;
                     stop_date = $scope.annotation_pending;
                 }
                 $scope.addAnnotation(moment(start_date), moment(stop_date));
                 $scope.annotation_pending = undefined;

                 $scope.$apply();
                 $rootScope.$broadcast('plotAnnotationDataChanged');
             }
         });
     }

     return {
         restrict: 'A',
         link: linkFunc
     }

}])

/*
 Date Picker directive
 */
app.directive('datepicker', ['$routeParams', '$route', function ($routeParams, $route) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function ($scope, element, attrs, ctrl) {

            $(element).append('<i class="glyphicon glyphicon-calendar fa fa-calendar"></i>&nbsp; <span></span> <b class="caret"></b>');


            if ($routeParams.start_date !== undefined && $routeParams.start_date !== undefined) {
                startDate = moment($routeParams.start_date);
                endDate = moment($routeParams.stop_date);
            } else {
                startDate = moment().subtract(6, "h");
                endDate = moment();
            }

            dateFormat = 'DD/MM/YYYY H:mm:ss';

            function cb(start, end) {
                $route.updateParams({start_date: start.format(), stop_date: end.format()});
                $scope.selectedDateRangeChanged(start, end);
                $(element).find('span').html(start.format(dateFormat) + ' - ' + end.format(dateFormat));
            }

            $(element).daterangepicker({
                timePicker: true,
                timePickerSeconds: true,
                timePickerIncrement: 5,
                locale: {
                    format: dateFormat
                },
                timePicker24Hour: true,
                startDate: startDate,
                endDate: endDate,
            }, cb);

            cb(startDate, endDate);
        }
    };
}]);


/*
    Spinner Directive
 */
app.directive('spinner', function () {
    return {
        restrict: 'E',
        link: function ($scope, element, attrs, ctrl) {
            var spinner = new Spinner().spin()
            $(element).append(spinner.el)
        }
    }
});


/*
Returns min date in given array
 */

app.filter('minDate', ['$parse', function ($parse) {
    return function (input, expression) {
        return dateByMin(input, expression)
    };

    function dateByMin(array, exp) {
        var mappedArray = array.map(function (elm) {
            return $parse(exp)(elm);
        });
        return moment(Math.min.apply(Math, mappedArray));
    }
}]);


/*
Returns max date in given array
 */
app.filter('maxDate', ['$parse', function ($parse) {
    return function (input, expression) {
        return dateByMax(input, expression)
    };

    function dateByMax(array, exp) {
        var mappedArray = array.map(function (elm) {
            return $parse(exp)(elm);
        });
        return moment(Math.max.apply(Math, mappedArray));
    }
}]);


/*
Format moment.js date
 */
app.filter('formatDate', [function () {
    return function (input, format) {
        if (format === undefined) {
            format = "YYYY-MM-DD HH:mm:ss"
        }
        return input.format(format)
    };

}]);
