(function() {
    var mod = angular.module('authentication.login', []);

    mod.controller('AuthLoginController', AuthLoginController);

    function AuthLoginController($http, $scope, $state, $rootScope, $sessionStorage) {
        $scope.username = "";
        $scope.password = "";

        if ($rootScope.isLoggedIn) {
            $state.go('index');
            toastr.info('You\'re already logged in.');
        }

        $scope.login = function() {
            $http.post('/auth', { username: $scope.username, password: $scope.password })
                .success(function(data) {
                    $rootScope.user = [];
                    $sessionStorage.user = data;
                    $rootScope.user = data;
                    $rootScope.isLoggedIn = true;
                    $state.go('index');
                    toastr.success('Logged in successfully!');
                }).error(function(data) {
                    toastr.error('E-mailaddress and password did not match!')
                });
        };
    }

})();