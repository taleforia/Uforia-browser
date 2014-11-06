angular.module('uforia')

.controller('appCtrl', function(){

})

.controller('searchCtrl', function($rootScope, $scope, $http, $modal, types) {
  $scope.queryMatchesCount = 0;

  $scope.searchTypes = types;
  $scope.searchType = Object.keys(types)[0];
  var visualization = {};

  $scope.$watch('searchType', function(newVal, oldVal){
    changeType(newVal);
  });

  $scope.$watch('viewType', function(newVal, oldVal){
    changeScripts();
    $scope.search();
  });

  $scope.$watch('parameters', function(newVal, oldVal){
    var api_params = {};
    console.log(newVal);
    $http
      .post('api/count', formatParams())
      .success(function(data){
        $scope.queryMatchesCount = data.count;
      });
  }, true);

  //Load the right css for the right D3 visualization
  function changeType(type){

    switch(type){
      case "files":
        $scope.viewType = 'bubble';
      break;
      case "email":
        $scope.viewType = 'chord';
      break; 
      case "documents":
        $scope.viewType = 'bar_chart';
        //THIS should be moved to something seperate - bart 28-9-2014
        visualization.x = prompt("Order X axis by");
        visualization.y = prompt("Order Y axis by");

      break;
      default:
        $scope.searchType = 'email';
        $scope.viewType = 'chord';
      break;
    }
    $http
      .post("api/mapping_info", {type: type})
      .success(function(data){
        console.log(data);
        $scope.memeTypes = data;
      });

    $http
      .post("api/view_info?type=" + type, '')
      .success(function(data){
        $scope.viewTypes = data;
      });

    //Clear the visualization and search parameters
    removeSVG();
    if(type=='email')
      $scope.parameters = [{memeType: "Body", operator: "must", query: "blockbuster"},{memeType: "Bcc", operator: "must", query: "*frank*"}];
    else
      $scope.parameters = [{operator: "must"}];
  }

  $scope.search = function(){
    //Clear the old SVG
    removeSVG();
    hideMessage();
    
    getData(formatParams(), function(data){
      $('#d3_visualization').empty();
      if(data){
        render(data, openDetails, function(error){
          if(error)
            console.log(error); // TODO: show error to user
        });
      }
    });
  }

  //click on a item
  function openDetails(data){
    console.log(data);
    var modalInstance = $modal.open({
      templateUrl: 'views/modals/details',
      controller: 'detailsModalCtrl',
      size: 'lg',
      resolve: {
        files: model.getFileDetails({hashids: data.hashids, type:$scope.searchType}),
        addresses: function(){ return data.adressses; }
      }
    });

    modalInstance.result.then(function () {
      //closed
    }, function () {
      //dismissed
    });
    // var url = 'file_details?type=email&hashids=' + d.hashids.toString() + '&address1=' + d.date;
    // window.open(url, d.hashids.toString(),'height=768, width=1100, left=100, top=100, resizable=yes, scrollbars=yes, toolbar=no, menubar=no, location=no, directories=no, status=no, location=no');
  }

  function getData(params, cb){
    $http
      .post('/api/search', params)
      .success(function(data){
        console.log(data);
        cb(data);
      });
  }

  function formatParams(cb){
    var api_params = {
        'type' : $scope.searchType,
        'view' : $scope.viewType,
        'visualization' : visualization,
        'parameters' : {
            'must' : [],
            'must_not' : []
        },
        'filters' : {
            'must' : [],
            'must_not' : []
        }
    };

    //Get all the search parameters and add them to the query object.
    $scope.parameters.forEach(function(parameter){
      if(parameter.memetype && parameter.memetype.toLowerCase() == 'date'){
        api_params.filters[parameter.operator].push({'field' : parameter.memeType, 'start_date' : parameter.startDate.getTime(), 'end_date' :  parameter.endDate.getTime()});
      }
      else if(parameter.query && parameter.query.length > 0){
        api_params.parameters[parameter.operator].push({'field' : parameter.memeType, 'query' : parameter.query});
      }
    });
    return api_params;
  }

  //clear the d3 svg from the page
  function removeSVG(){
    $('#d3_visualization').empty();
  }

  function showMessage(message){
    $("#message").text(message);
    $("#message").attr("style", "visibility: visible")
  }

  function hideMessage(){
    $("#message").empty();
    $("#message").attr("style", "visibility: hidden")
  }

  function changeScripts(){
    $('#d3_script').replaceWith("<script src=\"javascripts/mimetypes/" + $scope.searchType + "_" + $scope.viewType + ".js\" type=\"text/javascript\" id=\"d3_script\"></script>");
    $('#d3_style').replaceWith("<link href=\"stylesheets/mimetypes/" + $scope.searchType + "_" + $scope.viewType +  ".css\" rel=\"stylesheet\" type=\"text/css\" id=\"d3_style\">");
  }

})

.controller('detailsModalCtrl', function($scope, $modalInstance, files, addresses){
  console.log(files);
  $scope.addresses = addresses;
  $scope.files = files;
  $scope.modalInstance = $modalInstance;
  $scope.selectedFile = files[0].hashid;

  $scope.openFile = function(hashid){
    files.forEach(function(file){
      if(file.hashid == hashid)
        $scope.showFile = file;
    })
  }
  $scope.openFile($scope.selectedFile);

})

.controller('adminCtrl', function(){

});