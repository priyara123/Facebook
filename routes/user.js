/*GET users listing*/
var exce = require('./customExceptions');
var mysql = require('./dbUtil'); 
var dbUtil = require('./dbUtil');
var currSession = {};
exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.profile = function(req, res) {
	console.log(req.session);
	if(req.session.username == null || req.session.username == undefined) {
		res.render('fbLogin');
	}
	else {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('profile');
	}
}
exports.logout = function(req, res) {
	var userid = req.session.username;
	if ((userid !== undefined && userid !== "")) {
		var data = { lastLogin : new Date()};
		var dbConn = mysql.getDbConn();
		if(dbConn === "empty") {
			mysql.waitPool({name:"logout", request: req, response: res});
		} 
		else {
			var query = dbConn.query("update users set ? where email = ? ", [ data, userid ], function(err, rows) {
				process.nextTick(function(){
						mysql.waitPool(null);
				});
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
					// If no sql specific exception then control comes to below statement.
					exce.customException('Something went wrong. Please try again later', res);
				} 
				else {
					if (rows.affectedRows > 0){
						console.log("signout successful");
						req.session.destroy(function(err){
							if(err){
								console.log(err);
							}
						});
						res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
						res.render('fbLogin');
					}	
					else 
						exce.customException('User already logged out.', res);
				}
				mysql.returnDbConn(dbConn);				
			});
		}
	}
};

function getPosts(req, res, userid) {
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name: "getPosts", request: req, response: res});
	}
	else {
		var query = dbConn.query("select pDesc, pDate from posts where postemail = ?", [userid], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {								
				req.session.userProfile.posts = rows;
				res.send({"Status": "Success"});
			}
			mysql.returnDbConn(dbConn);
		});
	}
}


function getNotifications(req, res, userid) {
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name: "getNotifications", request: req, response: res});
	}
	else {
		var query = dbConn.query("select email2 from notifications where notifemail = ?", [userid], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {								
				req.session.userProfile.notifications = rows;
				getPosts(req, res, userid);
			}
			mysql.returnDbConn(dbConn);
		});
	}
}

exports.viewProfile = function(req, res) {
	var userid = req.params.userId;
	console.log("userId for view profile = " + userid);
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"viewProfile", request: req, response: res});
	} 
	else {
		var query = dbConn.query("select email, firstName,lastName from users where email = ?", [userid], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				res.render('user', {firstname: rows[0].firstName, lastname: rows[0].lastName, username: rows[0].email});
				//console.log("Operation Success!");
				//console.log(rows);
			}
			mysql.returnDbConn(dbConn);
		});	
	}
}

exports.addPost = function(req, res) {
	var userid = req.session.username;
	console.log("desc = " + req.body.desc );
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"addPost", request: req, response: res});
	} 	
	else {
		var data = {
				postEmail: req.body.username,
				pDesc: req.body.desc,
				postEmail: userid,
				pDate: new Date() 
			};
		var query = dbConn.query("insert into posts set ? ", data, function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			mysql.returnDbConn(dbConn);
		});	
	}
}


/* view given user's friend's profile */
exports.viewFProfile = function(req, res) {	
	var userid = req.params.userId;
	console.log(req.session.username);
	if(req.session.username == undefined || req.session.username == null) {		
		res.render('fbLogin');
	}
	else {
		console.log("********Inside viewF**********");
		var dbConn = mysql.getDbConn();
		if(dbConn === "empty"){
			dbUtil.waitPool({name:"fViewProfile", request: req, response: res});
		} 
		else {
			var query = dbConn.query("select * from users where email = ?", [userid], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
				});
				
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
				} 
				else {
					req.session.fProfile = rows[0];
					currSession.fProfile = rows[0];
					getGroups(req, res, userid, true);				
				}
				mysql.returnDbConn(dbConn);
			});	
		}
	}	
}


exports.addFriend = function(req, res) {
	var frndname = req.body.frndname;
	var dbConn = mysql.getDbConn();
	console.log("add friend...");
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"addFriend", request: req, response: res});
	}
	
	else {
		console.log("frndname: " + frndname);
//		console.log("req.session.username: " + req.session.username);
		var sql = "INSERT INTO friends (email1, email2) VALUES ?";
		var values = [
		    [frndname, req.session.username],
		    [req.session.username, frndname]
		];
		var query = dbConn.query(sql, [values], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				res.json({"status" : "Success"});
				res.end();
				console.log("Operation Success!");
				//console.log(rows);
			}
			mysql.returnDbConn(dbConn);
		});
	}

}

function getFriends(req, res, userid, isFriend) {
	var dbConn = mysql.getDbConn();
//	console.log("Inside getFrnds");
//	console.log(req.session);
	if(dbConn === "empty"){
		dbUtil.waitPool({name: "findFriends", request: req, response: res});
	}
	else {
		var query = dbConn.query("select email, firstName, lastName from users where email in (select email2 from friends where email1 =?)", [userid], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {								
				if(isFriend) {
					req.session.fProfile.friends = rows;
					res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
					res.render('fProfile');
				}
				else {
					for(var i = 0; i < rows.length; i++) {
						rows[i].isFriend = "true";
					}					
					req.session.userProfile.friends = rows;
					getNotifications(req, res, userid);					
				}
			}
			mysql.returnDbConn(dbConn);
		});
	}
}


exports.userFriends = function(req, res) {
	var userid = req.session.username;
	console.log(req.session);
	getFriends(req, res, userid, false);
}
	

function getGroups(req, res, userId, isFriend) {
	var userid = userId;
//	console.log("Inside getGrps");
//	console.log(req.session);
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"findGroups", request: req, response: res});
	}
	else {
		var query = dbConn.query("select gname, gdesc from groups where groupId in (select groupId from UserGroups where email = ?)", [userid], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				mysql.returnDbConn(dbConn);
				
				if(isFriend) {
//					console.log("setting the frnds grps field.....");
					req.session.fProfile.groups = rows;
					getFriends(req, res, userid, true);
					//res.render('fProfile');
					//res.json(req.session);
					//res.end();
				}
				else {
//					console.log("setting the user grps field.....");
					req.session.userProfile.groups = rows;
					getFriends(req, res, userid, false);
					//res.json(req.session);
					//res.end();
					//console.log(currSession.userProfile.groups);
				}
			}
			mysql.returnDbConn(dbConn);
		});
	}
}

//exports.userGroups = function(req, res) {
//	var userid = req.session.username;
//	var dbConn = mysql.getDbConn();
//	console.log("fetching groups...");
//	if(dbConn === "empty"){
//		dbUtil.waitPool({name:"findGroups", request: req, response: res});
//	}
//	else {
//		var query = dbConn.query("select gname, gdesc from groups where groupId in (select groupId from UserGroups where email = ?)", [userid], function(err, rows) {
//			process.nextTick(function(){
//				mysql.waitPool(null);
//			});
//			if (err) {
//				console.log(err);
//				exce.mySqlException(err, res);
//			} 
//			else {
//				res.json({"status" : "Success", "groups": rows});
//				res.end();
//				console.log("Operation Success!");
//				console.log(rows);
//			}
//			mysql.returnDbConn(dbConn);
//		});
//	}
//}

exports.userGroups = function(req, res) {
	var userid = req.session.username;
	getGroups(req, res, userid, false);
}

/*Method to verify login*/
exports.login = function(req, res) {
	var userid = req.body.userid;
	var password = req.body.password;
	if((userid != "undefined" || userid != "") && (password != "undefined" || password != "")) {
		var dbConn = mysql.getDbConn();
		if(dbConn === "empty"){
			dbUtil.waitPool({name:"validateUser", request: req, response: res});
		} 
		else {
			var query = dbConn.query("select email,firstName,lastName,gender,dob,work,education from users where email = ? and password = ?", [userid, password], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
				});		
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
				} else {
					if(rows.length > 0) {
						req.session.username = userid;
						req.session.userProfile = rows[0];
						console.log("login rows");
						console.log(rows);
						getGroups(req, res, userid, false);
					}
					else
						res.status(500).send('Invalid credentials, please try again');
				}
				mysql.returnDbConn(dbConn);
			});
		}
	}
	else
		res.render('fbLogin');
}

/*Method to insert new user record after sign up*/
exports.signUp = function(req, res) {
//	console.log("signup request: " + req.body);
	var fname = req.body.firstname, 
	lname = req.body.lastname,
	email = req.body.email, 
	pswd = req.body.password;
	gender = req.body.gender,
	dob = req.body.dob;
	var data = {
			firstName : fname,
			lastName  : lname,
			email   : email,
			password   : pswd,
			gender  : gender,
			dob : dob
		};
		var dbConn = mysql.getDbConn();
		if(dbConn === "empty"){
			dbUtil.waitPool({name:"insertUser", request: req, response: res});
		} 
		else {
			var query = dbConn.query("insert into users set ? ", data, function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
				});
				
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
				} 
				else {
					res.send({"Status" : "Success"});
					//console.log("Operation Success!");
				}
				mysql.returnDbConn(dbConn);
			});
		}
	}