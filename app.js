
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , dbUtil = require('./routes/dbUtil')
  , session = require('client-sessions');
var app = express();

app.use(session({   	  
	cookieName: 'session',    
	secret: 'cmpe273_lab1',    
	duration: 30 * 60 * 1000,    
	activeDuration: 5 * 60 * 1000  
	}));

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.post('/signup', user.signUp);
app.post('/login', user.login);
app.get('/userFriends', user.userFriends);
app.get('/userGroups', user.userGroups);
app.post('/addFriend', user.addFriend);
app.post('/post', user.addPost);
app.post('/logout', user.logout);
app.post('/viewProfile', user.getGuestProfile);
app.post('/deleteFR', user.deleteRequest);
app.get('/viewProfile', routes.viewGuestProfile);
app.post('/search', user.search);
app.get('/getFeed', user.getFeed);
app.get('/profile', routes.profile);
app.post('/viewGroup', user.getGroup);
app.post('/joinGroup', user.joinGroup);
app.post('/leaveGroup', user.leaveGroup);
app.get('/viewGroup', routes.displayGroup);
app.get('/refreshProfile', user.refreshProfile);
app.post('/acceptRequest', user.acceptRequest);
app.get('/refreshGroup/:grpId', user.refreshGroup);
app.get('/home', routes.home);
app.post('/createGroup', user.createGroup);
app.post('/deleteGroup', user.deleteGroup);
app.get('/getData', function(req, res) {		
	res.json(req.session);
});
app.get('/user', function(req, res) {
//	console.log("/user: sending req.session");
//	console.log(req.session);
	res.json(req.session);
});


//app.get('/user/:userId/:firstname/:lastname', function(req, res){
//var userid = req.params.userId;
//res.render('user',{firstname: req.params.firstname, lastname: req.params.lastname, username: req.params.userId});
//});

dbUtil.initPool(100);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
