
(function() {
    var mod = angular.module('cases.create', []);

    mod.controller('CasesCreateController', CasesCreateController);

    function CasesCreateController($scope, $http, $state) {
        $scope.cases = {};
        $scope.cases.isDeleted = false;
        var cases = {};

        $scope.formData = {};
        $http({
            method: 'GET',
            url: '/api/get_filtered_users'
        }).then(function successCallback(data) {
            // Check if error
            if (typeof data.data.error !== 'undefined') {
                $scope.error.push(data.data.error.message);
                $scope.isError = true;
            } else if (data.data.response.hits.total > 0) {
                $scope.formData.users = data.data.response.hits.hits;
                console.log(data.data.response.hits.hits);
                users = data.data.response.hits.hits;
            }
        }, function errorCallback(data) {
            toastr.error('Please try again later.', 'Something went wrong!');
        });

        // $http({
        //     method: 'GET',
        //     url: '/api/get_cases'
        // }).then(function successCallback(data) {
        //     // Check if error
        //     if (typeof data.data.error !== 'undefined') {
        //         $scope.error.push(data.data.error.message);
        //         $scope.isError = true;
        //     } else if (data.data.response.hits.total > 0) {
        //
        //         users = data.data.response.hits.hits;
        //     }
        // }, function errorCallback(data) {
        //     toastr.error('Please try again later.', 'Something went wrong!');
        // });
        //
        // angular.forEach(users, function(value, key){
        //     var u = value._source;
        //     // if(user.email == u.email){
        //         // addCase = false;
        //     // }
        // });

        $scope.save = function(cases){
            var addCase = true;
            console.log(cases);
            // Save user
            if(addCase) {
                var tempCase = angular.copy(cases);
                // delete tempCase.password2;
                $http.post('/api/save_case', tempCase)
                    .success(function (data) {
                            if (typeof data.error !== 'undefined') {
                                toastr.error(data.error.message);
                            }

                            if (typeof data.response !== 'undefined') {
                                if (data.response.created == true) {
                                    toastr.success('Case ' + tempCase.name +' has been added');
                                    $state.go('cases', {}, { reload: true });
                                }
                            }
                        }
                    );
            } else if (!addCase){
                toastr.error('An user with this email address already exists');
            } else {
                toastr.error('Unknown error');
            }
        };
    }
})();
