var app = angular.module('myApp', ['ngRoute']);

app.factory("services", ['$http', '$location', function($http,$location) {
	var serviceBase = '/services/'
	var obj = {};
	obj.getWords = function(){
		var test = ($http.get(serviceBase + 'words'));
		return $http.get(serviceBase + 'words');
	}
	obj.getWordsQ = function(){
		return $http.get(serviceBase + 'words').then(function (results) {
			alert(JSON.stringify(results));
			return results;
		});
	}
	obj.getWord = function(wordID){
		return $http.get(serviceBase + 'word?id=' + wordID);
	}

	obj.insertWord = function (word) {
		return $http.post(serviceBase + 'insertWord', word).then(function (results) {
			return results;
		});
	};

	obj.updateWord = function (id,word) {
		return $http.post(serviceBase + 'updateWord', {id:id, word:word}).then(function (status) {
			return status.data;
		});
	};

	obj.deleteWord = function (id) {
		return $http.delete(serviceBase + 'deleteWord?id=' + id).then(function (status) {
			return status.data;
		});
	};

	obj.sessionService = function() {
		// alert('session init');
		return {
			set:function(key,value) {
				// alert('setting');
				return sessionStorage.setItem(key,value);
			},
			get:function(key) {
				return sessionStorage.getItem(key);
			},
			destroy:function(key) {
				return sessionStorage.removeItem(key);
			}
		};
	};

	obj.login = function(user) {
		// alert(obj.sessionService().set('test', 'test'));
		// alert('init inner');
		// alert(JSON.stringify(user));
		return $http.post(serviceBase + 'login', user).then(function (status) {
			var uid = status.data;
			if (uid == 'success') {
				// alert('Success!');
				obj.sessionService().set('user', uid);
				$location.path('/');
				// alert(obj.sessionService().get('user'));
			} else {
				alert('Неверный пароль или имя');
			}
		});
	};

	obj.logout = function() {
		obj.sessionService().destroy('user');
	};

	obj.islogged = function() {
		if(obj.sessionService().get('user')) return true;
	};

	obj.questions = function(pQuestions) {
		return {
		getQuestion: function(id) {
				// alert('if init');
				var arrLenght = actualQuestions.length;
				if(id < arrLenght) {
					var q = actualQuestions[id], randomQuestion;
					var currQ = actualQuestions[id].word;
					function checkRandom() {
						randomInit = actualQuestions[Math.floor(Math.random() * (arrLenght - 0 + 1)) + 0];
						if (randomInit == undefined) {
							checkRandom();
						}
						randomQuestion = randomInit.word;
						if (randomQuestion == currQ) {
							checkRandom();
						}
					};
					function shuffle(array) {
						var currentIndex = array.length, temporaryValue, randomIndex ;
						while (0 !== currentIndex) {
						randomIndex = Math.floor(Math.random() * currentIndex);
						currentIndex -= 1;
						temporaryValue = array[currentIndex];
						array[currentIndex] = array[randomIndex];
						array[randomIndex] = temporaryValue;
						}
						return array;
					};
					checkRandom();
					var arr = [randomQuestion, actualQuestions[id].word]
					q.id = id;
					q.options = shuffle(arr);
					return q;
				} else {
					return false;
				}
			}
		};
	};

	return obj;
}]);

app.controller('listCtrl', function ($scope, services) {
	$scope.words = {};
	$scope.logged = services.islogged();
	$scope.logout = function () {
		services.logout();
	}
	services.getWords().then(function(data){
		$scope.words = data.data;
	});
	$scope.alphabet = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя".split("");
	// абвгдеёжзийклмнопрстуфхцчшщъыьэюя
	$scope.getMyCtrlScope = function() {
		return $scope;
	};
});

app.controller('quizCtrl', function ($scope, services) {
	$scope.logged = services.islogged();
	console.log('quiz ctrl');
});

app.directive('quiz', ['services', function(services) {
	return {
		restrict: 'AE',
		scope: {},
		templateUrl: 'partials/quiz-inner.html?1',
		link: function(scope,elem,attrs) {
			services.getWords().then(function(data){
				actualQuestions = data.data;
			});
			scope.start = function() {
				scope.totalQ = actualQuestions.length;
				$('.progress_bar').progressbar({ 
					value: 0,
					max: scope.totalQ
				});
				scope.id = 0;
				scope.quizOver = false;
				scope.inProgress = true;
				// alert('setting initQuestions');
				scope.getQuestion(actualQuestions);
			};
			scope.reset = function () {
				scope.inProgress = false;
				scope.score = 0;
			};
			scope.getQuestion = function() {
				var q = services.questions().getQuestion(scope.id);
				// alert(scope.totalQ);
				// alert(JSON.stringify(q));
				if (q) {
					scope.question = q.meaning;
					scope.options = q.options;
					scope.answer = q.word;
					scope.Qid = q.id;
					scope.answerMode = true;
				} else {
					scope.quizOver = true;
				}
			};
			scope.checkAnswer = function(event,option) {
				// alert('check init');
				var target = event.currentTarget, option;
				var ans = $(target).text();
				ans = ans.replace(/\s+/g, '');
				if (ans == scope.answer) {
					scope.score++;
					if (scope.score < scope.totalQ/2) {
						scope.message = 'Плохой результат';
					} else if (scope.score == scope.totalQ) {
						scope.message = 'Отлично!';
					} else {
						scope.message = 'Средний результат';
					}
					scope.correctAns = true;
					scope.answerMode = false;
					scope.nextQuestion();
				} else {
					scope.correctAns = false;
					scope.answerMode = false;
					scope.nextQuestion();
				}
			};

			scope.nextQuestion = function() {
				$('.progress_bar').progressbar({ 
					value: scope.Qid + 1
				});
				scope.id++;
				scope.getQuestion();
			};

			scope.reset();
		}
	}
}]);

app.filter('startsWithLetter', function () {
    return function (items, letter) {
        var filtered = [];
        var letterMatch = new RegExp(letter, 'i');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (letterMatch.test(item.word.substring(0, 1))) {
                filtered.push(item);
            }
        }
        return filtered;
    };
});

app.controller('editCtrl', function ($scope, $rootScope, $location, $routeParams, services, word) {
	var wordID = ($routeParams.wordID) ? parseInt($routeParams.wordID) : 0;
	$rootScope.title = (wordID > 0) ? 'Редактировать слово' : 'Добавить слово';
	$scope.buttonText = (wordID > 0) ? 'Обновить слово' : 'Добавить новое слово';
	var original = word.data;
	original._id = wordID;
	$scope.word = angular.copy(original);
	$scope.word._id = wordID;
	$scope.isClean = function() {
		return angular.equals(original, $scope.word);
	}

	$scope.deleteWord = function(word) {
		$location.path('/');
		if(confirm("Точно хотите удалить из словаря: "+$scope.word.word+"?")==true)
		services.deleteWord(wordID);
	};

	$scope.saveWord = function(word) {
		$location.path('/');
		if (wordID <= 0) {
			services.insertWord(word);
		}
		else {
			services.updateWord(wordID, word);
		}
	};
});

app.controller('loginCtrl', function ($scope, services) {
	$scope.user = {};
	$scope.checkUser = function(user) {
		services.login(user);
	};
});

app.config(['$routeProvider',
function($routeProvider) {
	$routeProvider.
	when('/', {
		title: 'Словарь',
		templateUrl: 'partials/words_list.html',
		controller: 'listCtrl'
	})
	.when('/login', {
		title: 'Авторизация',
		templateUrl: 'partials/login.html',
		controller: 'loginCtrl'
	})
	.when('/quiz', {
		title: 'Квиз',
		templateUrl: 'partials/quiz.html',
		controller: 'quizCtrl'
	})
	.when('/edit-word/:wordID', {
		title: 'Редактировать слово',
		templateUrl: 'partials/edit.html',
		controller: 'editCtrl',
		resolve: {
		word: function(services, $route){
		var wordID = $route.current.params.wordID;
		return services.getWord(wordID);
		}
		}
	})
	.otherwise({
	redirectTo: '/'
	});
}]);
app.run(['$location', '$rootScope', 'services', function($location, $rootScope, services) {
	// alert(services.islogged());
	var routepermission = ['/login'];
	var routepermissionSecond = ['/quiz'];
	// alert(routepermission.indexOf($location.path()));
	$rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
		$rootScope.title = current.$$route.title;
	});
	$rootScope.$on('$routeChangeStart', function(){
		if (routepermission.indexOf($location.path()) != '' && routepermissionSecond.indexOf($location.path()) != '' && !services.islogged()) {
			$location.path('/');
		}
	});
}]);