var app = angular.module('flapperNews', ['ui.router']);

app.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

	$stateProvider
		.state('home', {
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			resolve: {
				postPromise: ['posts', function(posts) {
					return posts.getAll();
				}]
			}
		})
		.state('posts', {
			url: '/posts/{id}',
			templateUrl: '/posts.html',
			controller: 'PostsCtrl',
			resolve: {
				post: ['$stateParams', 'posts', function($stateParams, posts) {
					return posts.get($stateParams.id);
				}]
			}
		})
		.state('login', {
			url: '/login',
			templateUrl: '/login.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'authService', function($state, authService){
				if(authService.isLoggedIn()){
					$state.go('home');
				}
			}]
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'authService', function($state, authService){
				if(authService.isLoggedIn()){
					$state.go('home');
				}
			}]
		});

	$urlRouterProvider.otherwise('/home');

}]);


app.factory('posts', ['$http', 'authService', function($http, authService) {
	var o = {
		// initialize the posts as empty
		posts: []
	};

	o.getAll = function() {
		return $http.get('/posts').success(function(data) {
			angular.copy(data, o.posts);
		});
	};

	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(res) {
			return res.data;
		});
	};

	o.removePost = function(post) {
		return $http.delete('/posts/' + post._id + '/remove');
	};

	o.create = function(post) {
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer '+authService.getToken()}
		}).success(function(data){
			o.posts.push(data);
		});
	};

	o.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+authService.getToken()}
		}).success(function(data){
			post.upvotes += 1;
		});
	};

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer '+authService.getToken()}
		});
	};

	o.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+authService.getToken()}
		}).success(function(data){
			comment.upvotes += 1;
		});
	};

	return o;
}]);



app.controller('MainCtrl', ['$scope', 'posts', '$filter', function($scope, posts, $filter) {
	$scope.test = 'Hello world!';
	$scope.posts = posts.posts;

	$scope.addPost = function() {
		if(!$scope.title || $scope.title === '') {
		 return; 
		}

		var newPost = {
			title: $scope.title,
			link: $scope.link,
		};
		// Call the 'posts' Service and create a new post
		posts.create(newPost).success(function(comment) {
			$scope.posts.push({newPost});
		});



		$scope.title = '';
		$scope.link = '';
	};

	$scope.incrementUpvotes = function(post) {
		posts.upvote(post);
	};

	$scope.removePost = function(post) {
		posts.removePost(post);
	};

	var orderBy = $filter('orderBy');
	$scope.order = function(predicate, reverse) {
		$scope.posts = orderBy($scope.posts, predicate, reverse);
	};
	$scope.order('--upvotes', true);
}]);


app.controller('PostsCtrl', ['$scope', 'posts', 'post', function($scope, posts, post) {
	$scope.post = post;

	$scope.addComment = function(){
		if($scope.body === '') { return; }

		posts.addComment(post._id, {
			body: $scope.body,
			author: 'user',
		}).success(function(comment) {
			$scope.post.comments.push(comment);
		});
		$scope.body = '';
	};

	$scope.incrementUpvotes = function(comment) {
		posts.upvoteComment(post, comment);
	};

}]);


app.controller('NavCtrl', ['$scope','authService', function($scope, authService) {
	$scope.isLoggedIn = authService.isLoggedIn;
	$scope.currentUser = authService.currentUser;
	$scope.logOut = authService.logOut;
}]);  



app.factory('authService', ['$http', '$window', function($http, $window) {
	var authService = {};

	authService.saveToken = function (token){
		$window.localStorage['flapper-news-token'] = token;
	};

	authService.getToken = function (){
		return $window.localStorage['flapper-news-token'];
	};

	authService.isLoggedIn = function(){
		var token = authService.getToken();

		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	authService.currentUser = function(){
		if(authService.isLoggedIn()){
			var token = authService.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	authService.register = function(user){
		return $http.post('/register', user).success(function(data){
			authService.saveToken(data.token);
		});
	};

	authService.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			authService.saveToken(data.token);
		});
	};

	authService.logOut = function(){
		$window.localStorage.removeItem('flapper-news-token');
	};

	return authService;
}]);


app.controller('AuthCtrl', ['$scope', '$state', 'authService', function($scope, $state, authService) {
	$scope.user = {};

	$scope.register = function(){
		authService.register($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$state.go('home');
		});
	};

	$scope.logIn = function(){
		authService.logIn($scope.user).error(function(error){
			$scope.error = error;
		}).then(function(){
			$state.go('home');
		});
	};

}]);
