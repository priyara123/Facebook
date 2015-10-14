/*GET users listing*/
var exce = require('./customExceptions');
var mysql = require('./dbUtil'); 
var dbUtil = require('./dbUtil');
var async = require('async');
var currSession = {};
exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.logout = function(req, res) {
	var userId = req.session.username;
	console.log("/logout: " + userId);
	if ((userId !== undefined && userId !== "")) {
		var data = { lastLogin : new Date()};
		var dbConn = mysql.getDbConn();
		if(dbConn === "empty") {
			mysql.waitPool({name:"logout", request: req, response: res});
		} 
		else {
			var query = dbConn.query("update users set ? where email = ? ", [ data, userId ], function(err, rows) {
				process.nextTick(function(){
						mysql.waitPool(null);
				});
				if (err) {
					console.log(err);
					//exce.mySqlException(err, res);					
				} 
				else {
					req.session.destroy(function(err){
						if(err){
							console.log(err);
						}
					});				
					res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
					res.render('fbLogin');
					if (rows.affectedRows > 0){
						console.log("/logout successful");						
					}	
					else 
						exce.customException('User already logged out.', res);
				}
				mysql.returnDbConn(dbConn);				
			});
		}
	}
};

exports.search = function(req, res) {
	var dbConn = mysql.getDbConn();
	var searchTerm = req.body.searchTerm;
	console.log("/search: " + searchTerm + "; curr user = " + req.session.username);
	if(dbConn == "empty") {
		dbUtil.waitPool({name: "search", request: req, response: res});
	}
	else {
		req.session.userProfile.searchResults = {};
		var query1 = dbConn.query("select email, firstName, lastName from users  where firstName like ? or lastName like ? or email like ? ",
				[ "%" + searchTerm + "%", "%" + searchTerm + "%", "%" + searchTerm + "%" ],function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {		
				console.log(rows);
				req.session.userProfile.searchResults.profiles = rows;				
			}
			mysql.returnDbConn(dbConn);
		});
		
		/*group search*/
		
		var query2 = dbConn.query("select groupId, gName from groups  where gname like ? ",
				[ "%" + searchTerm + "%" ],function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				console.log(rows);
				req.session.userProfile.searchResults.groups = rows;
				console.log("/search success " + searchTerm + "; curr user = " + req.session.username);
				res.send(req.session);
			}
			mysql.returnDbConn(dbConn);
		});
	}
}


/* fetches the feed if the current user has
 * any friends, else returns "no friends" 
 * as output */
exports.getFeed = function(req, res) {
	console.log("/getFeed curr user = " + req.session.username);
	if(req.session.userProfile.friends.length > 0) {
		var friends = req.session.userProfile.friends;						
		var dbConn = mysql.getDbConn();				
		var sql = "select u.email, p.postemail, usr.firstname, usr.lastname, p.pdesc, p.postid, p.pdate from " + 
				  "users u inner join friends f on f.email1 = u.email inner join users usr on usr.email = f.email2 " +
				  "inner join posts p on p.postemail = f.email2 where u.email = ? order by p.pdate desc";
		
		if(dbConn == "empty") {
			dbUtil.waitPool({name: "getFeed", request: req, response: res});
		}
		else {
			var query = dbConn.query(sql, [req.session.username], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
				});
				if(err) {
					console.log(err);
				}
				else {
					console.log("no of posts in this feed: " + rows.length);
					if(rows.length > 0) {
						req.session.userProfile.feed = rows;
						console.log("/getFeed success ; curr user = " + req.session.username);
						res.send(req.session);
					}
				}
			});
			mysql.returnDbConn(dbConn);
		}
	}
	else if(req.session.userProfile.friends.length == 0) {
		console.log(req.session.username + " has no friends. Cannot fetch feed");
		req.session.status = "no friends";
		res.send(req.session);
	}
	else {
		console.log(req.session.username + " something went wrong, check the code");
		res.session.status = "some error";
		res.send(req.session);
	}
}

//exports.getFeed = function(req, res) {
//	console.log("inside getfeed");	
//	var list = "";		
//	var sql = "";
//	var maxPostId;
//	var friends = req.session.userProfile.friends;
//	var posts = req.session.feed;
//	if(posts !== undefined)
//		maxPostId = posts[0].postid;	
//	for( var i = 0; i < friends.length - 1; i++) {
//		list += "'" + friends[i].email + "',"; 
//	}	
//	list += "'" + friends[friends.length-1].email + "'";	
//	if(posts !== undefined)
//		sql = "select postid, pdesc, pdate from posts where postemail in (" + list + ") and postid > ? order by postid desc";
//	else
//		sql = "select postemail, postid, pdesc, pdate from posts where postemail in (" + list + ") order by postid desc";
//	
//	console.log("list = " + list);
//	console.log("sql = " + sql);
//	console.log("feed = ");
//	console.log(req.session.feed);
//	var dbConn = mysql.getDbConn();
//	if(dbConn = "empty") {
//		dbUtil.waitPool({name: "getFeed", request: req, response: res});
//	}
//	else {
//		var query = dbConn.query(sql, maxPostId, function(err, rows) {
//			process.nextTick(function(){
//				mysql.waitPool(null);
//			});
//			if(err) {
//				console.log(err);
//			}
//			else {
//				console.log(rows);
//				if(rows.length > 0) {
//					req.session.feed = rows;
//					res.send(req.session);
//				}
//			}
//		});
//		mysql.returnDbConn(dbConn);
//	}
//}


function getPosts(req, res, userId) {
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name: "getPosts", request: req, response: res});
	}
	else {
		var query = dbConn.query("select pDesc, pDate from posts where postemail = ? order by pdate desc", [userId], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {								
				req.session.userProfile.posts = rows;
				console.log("/getPosts success " + req.session.username);
				req.session.status = "success";
				res.send(req.session);
			}
			mysql.returnDbConn(dbConn);
		});
	}
}


function getNotifications(req, res, userId, isRefreshCall) {
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name: "getNotifications", request: req, response: res});
	}
	else {
		var query = dbConn.query("select email2, nDesc from notifications where notifemail = ?", [userId], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {							
				if(isRefreshCall == true) {
					console.log("refreshing notifs for " + req.session.username);
					req.session.userProfile.notifications = rows;
					res.send(req.session);
				}
				else {
					req.session.userProfile.notifications = rows;
					getPosts(req, res, userId);
				}
			}
			mysql.returnDbConn(dbConn);
		});
	}
}

exports.viewProfile = function(req, res) {
	var userId = req.params.userId;
	console.log("/viewProfile for " + userId);
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"viewProfile", request: req, response: res});
	} 
	else {
		var query = dbConn.query("select email, firstName,lastName from users where email = ?", [userId], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				res.render('user', {firstname: rows[0].firstName, lastname: rows[0].lastName, username: rows[0].email});
				console.log("/viewProfile" + userId + " Success!");
			}
			mysql.returnDbConn(dbConn);
		});	
	}
}

exports.addPost = function(req, res) {
	var userId = req.session.username;
	console.log("/addPost for " + req.session.username + "; desc = " + req.body.desc );
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"addPost", request: req, response: res});
	} 	
	else {
		var data = {
				pDesc: req.body.desc,
				postEmail: userId,
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
			else {
				console.log("/addPost success " + req.session.username + "; desc = " + req.body.desc);
				res.send(req.session)
			}
			mysql.returnDbConn(dbConn);
		});	
	}
}
exports.deleteGroup = function(req, res) {	
	var gAdmin = req.session.username;
	var gName = req.body.gName;
	var grpId = req.body.grpId;
	console.log("/deleteGroup: " + gName + "curr user = " + gAdmin);
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"deleteGroup", request: req, response: res});
	} 		
	else {
				var query = dbConn.query("delete from usergroups where groupId = ? ", [grpId], function(err, rows) {
					process.nextTick(function(){
						mysql.waitPool(null);
				});			
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
				} 
				else {
					console.log("/deleteGroup: step1" + gName + " ; success; curr user = " + gAdmin);					
				}
				mysql.returnDbConn(dbConn);
			});

			var query = dbConn.query("delete from groups where groupId = ? ", [grpId], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
			});			
			if (err) {
				console.log(err);
				//exce.mySqlException(err, res);
			} 
			else {
				console.log("/deleteGroup: step2 " + gName + " ; success; curr user = " + gAdmin);
				req.session.status = "success";
				res.send(req.session);
			}
			mysql.returnDbConn(dbConn);
		});
	}
}

exports.joinGroup = function(req, res) {
	var userId = req.session.username;
	var grpId = req.body.grpId;
	var gName = req.body.gName;
	var dbConn = mysql.getDbConn();
	console.log("/joinGroup " + gName + "; curr user = " + userId);
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"joinGroup", request: req, response: res});
	} 		
	else {
		var data = {
				groupid: grpId,
				email: userId
			};
			var query = dbConn.query("insert into usergroups set ? ", data, function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
			});			
			if (err) {
				console.log(err);
				if(err.errno == 1062){
					req.session.status = "already member";
					res.send(req.session);
				}						
				else if(err.errno == 1452){
					req.session.status = "group doesn't exist";
					res.send(req.session);
				}						
//				exce.mySqlException(err, res);
			} 
			else {
				console.log("/joinGroup success " + gName + "; curr user = " + userId);
				req.session.status = "success";
				res.send(req.session);
			}
			mysql.returnDbConn(dbConn);
		});	
	}
}

exports.leaveGroup = function(req, res) {
	var userId = req.session.username;
	var grpId = req.body.grpId;
	var gName = req.body.gName;
	var gAdmin = req.body.gAdmin;
	var dbConn = mysql.getDbConn();
	console.log("/leaveGroup " + gName + "; curr user = " + userId + "; gadmin = " + gAdmin);
	
	if(gAdmin == userId) {
		req.session.status = "admin cannot leave";
		console.log("admin cannot leave");
		res.send(req.session);
	}		
	else if(dbConn === "empty"){
		dbUtil.waitPool({name:"leaveGroup", request: req, response: res});
	} 		
	else {		
			var query = dbConn.query("delete from usergroups where groupid = ? and email = ? ", [grpId, userId], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
			});			
			if (err) {
				console.log(err);				
//				exce.mySqlException(err, res);
			} 
			else {
				if(rows.affectedRows == 0){
					req.session.status = "not a member";
					res.send(req.session);
				}
				else {
					console.log("/leaveGroup success" + gName + "; curr user = " + userId);
					req.session.status = "success";
					res.send(req.session);
				}
			}
			mysql.returnDbConn(dbConn);
		});	
	}
}


exports.createGroup = function(req, res) {	
	var userId = req.session.username;
	var gName = req.body.gname;
	var gDesc = req.body.gdesc;
	var dbConn = mysql.getDbConn();
	console.log("/createGroup " + userId + "; desc = " + gDesc);
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"createGroup", request: req, response: res});
	} 		
	else {
		var data = {
				gAdmin: userId,
				gDesc: gDesc,
				gName: gName 
			};
		
			var query = dbConn.query("insert into groups set ? ", data, function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
			    });			
			    if (err) {
			    	console.log(err);
			      	exce.mySqlException(err, res);
			    } 
			    else {
			    	console.log("/createGroup step1 success " + data.gAdmin + "; desc = " + data.gDesc);
			    }
			});
			//test start
			setTimeout(function() {
				var sql = "select max(groupid),gadmin from groups";
			    var query = dbConn.query(sql, function(err, rows) {
			    	process.nextTick(function(){
			    		mysql.waitPool(null);
			      	});			
			      	if (err) {
			      		console.log(err);
			      		//exce.mySqlException(err, res);
			      	} 
			      	else {
			      		console.log("max grpid, admin is......");
			      		console.log(rows);							      					     
			      	}
			    });
			}, 6500);
			
			//test end
			
			setTimeout(function() {
				var sql = "insert into usergroups (select groupid,gadmin from groups where groupid in (select max(groupid) from groups))";
			    var query = dbConn.query(sql, function(err, rows) {
			    	process.nextTick(function(){
			    		mysql.waitPool(null);
			      	});			
			      	if (err) {
			      		console.log(err);
			      		//exce.mySqlException(err, res);
			      	} 
			      	else {
			      		console.log("/createGroup step2 success " + data.gAdmin + "; desc = " + data.gDesc);
			      		req.session.status = "success";							      					     
			      	}
			    });
			}, 600); 	
			res.send(req.session);
			mysql.returnDbConn(dbConn);
		}
}

function getGroupMembers(req, res, grpId) {
	var dbConn = mysql.getDbConn();	
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"getGroupMembers", request: req, response: res});
	} 
	else {
		var sql = "select g.gName, g.gDesc, g.gAdmin, usr.firstName as adminFirstName, usr.lastName as adminLastName, g.groupId, u.firstName, u.lastName, ug.email from groups g " + 
		"inner join usergroups ug on ug.groupId = g.groupId " +
		"inner join users usr on g.gAdmin =  usr.email " +
		"inner join users u on u.email = ug.email where g.groupId = ? order by u.firstName";
		
		var query = dbConn.query(sql, [grpId], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});			
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				//console.log(rows);				
				if(rows.length == 0) {
					console.log("grp doesn't exist");
					req.session.status = "group doesn't exist";
					res.send(req.session);
				}
				else {
					console.log("grpinfo for " + rows[0].gName);
					req.session.groupProfile = rows;
					req.session.status = "success";
					res.send(req.session);
				}
			}			
		});
		mysql.returnDbConn(dbConn);
	}	
}

exports.getGroup = function(req, res) {
	var grpId = req.body.grpId;
	getGroupMembers(req, res, grpId);
}

exports.refreshGroup = function(req, res) {
	var grpId = req.params.grpId;
	console.log(" grpid = " + grpId);
	getGroupMembers(req, res, grpId);
}


//exports.getGroupInfo = function(req, res) {
//	var grpId = req.body.grpId;
//	var dbConn = mysql.getDbConn();
//	if(dbConn === "empty"){
//		dbUtil.waitPool({name:"getGroupInfo", request: req, response: res});
//	} 
//	else {
//		var query = dbConn.query("select * from groups where groupid = ?", [grpId], function(err, rows) {
//			process.nextTick(function(){
//				mysql.waitPool(null);
//			});
//			
//			if (err) {
//				console.log(err);
//				exce.mySqlException(err, res);
//			} 
//			else {
//				req.session.groupInfo = rows[0];
//				getGroupMembers(req, res, grpId);				
//			}			
//		});
//		mysql.returnDbConn(dbConn);
//	}
//}

/* view a guest's profile */
exports.getGuestProfile = function(req, res) {	
	var userId = req.body.userId;
	var currUser = req.session.username;
	var isFriend = req.body.isFriend;
	console.log("/getGuestProfile: " + "frndname = " + userId + "; curr user = " + req.session.username);
	
	if(userId == currUser) {
		req.session.status = "current user";
		res.send(req.session);
	}
	else {
		var dbConn = mysql.getDbConn();
		if(dbConn === "empty"){
			dbUtil.waitPool({name:"getGuestProfile", request: req, response: res});
		} 
		else {
			var query = dbConn.query("select email, firstName, lastName, gender, dob, work, education from users where email = ?", [userId], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
				});
				
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
				} 
				else {
					req.session.fProfile = rows[0];
					req.session.fProfile.isFriend = isFriend;
					getGroups(req, res, userId, true);				
				}
				mysql.returnDbConn(dbConn);
			});	
		}
	}	
}

exports.addFriend = function(req, res) {
	var frndname = req.body.userId;
	var dbConn = mysql.getDbConn();
	console.log("/addFriend: " + " frndname = " + frndname + "; curr user = " + req.session.username);
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"addFriend", request: req, response: res});
	}
	
	else {
		var data = {
				notifEmail: frndname,
				email2: req.session.username,
				nDesc: "FR"
		};
		
		var query1 = dbConn.query("select count(*) as count from friends where email1 = ? and email2 = ?", [req.session.username, frndname], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				if(rows[0].count == 0) {					
					var query2 = dbConn.query("insert into notifications set ?", data, function(err, rows) {
						process.nextTick(function(){
							mysql.waitPool(null);
						});
						if (err){
							console.log(err);
							if(err.errno == 1062) {								
								res.status(500).send('Add Request already sent');
							}
						} 
						else {					
							req.session.status = "success";
							res.send(req.session);
							console.log("/addFriend success " + " frndname = " + frndname + "; curr user = " + req.session.username);
						}
						mysql.returnDbConn(dbConn);
					});				
				}
				else {
					console.log("Cannot send friend request. User already a friend");
					res.status(500).send('User is already a friend');
				}
			}
			mysql.returnDbConn(dbConn);
		});		
	}
}

exports.deleteRequest = function(req, res) {
	var frndName = req.body.frndName;
	var userId = req.session.username;
	var nDesc = req.body.nDesc;
	var dbConn = mysql.getDbConn();
	console.log("/deleteFR: " + frndName + "; curr user = " + userId + "; nDesc = " + nDesc);
	if(dbConn == "empty") {
		dbUtil.waitPool({name:"deleteRequest", request: req, response: res});
	}
	else {
		var sql = "delete from notifications where notifEmail = ? and email2 = ? and nDesc = ?";
		var query = dbConn.query(sql, [userId, frndName, nDesc], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if(err) {
				console.log(err);
			}
			else {
				//console.log(rows);
				if(rows.affectedRows > 0) {
					console.log("/deleteFR: " + frndName + "; curr user = " + userId);
					req.session.status = "success";
					res.send(req.session);
				}
			}
		});
		mysql.returnDbConn(dbConn);
	}
}

exports.acceptRequest = function(req, res) {
	var frndName = req.body.userId;
	var dbConn = mysql.getDbConn();
	console.log("/acceptRequest: " + " frndname = " + frndName + "; curr user = " + req.session.username);
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"acceptRequest", request: req, response: res});
	}	
	else {
		var sql = "insert into friends (email1, email2) values ?";
		var values = [
		    [frndName, req.session.username],
		    [req.session.username, frndName]
		];
		var query1 = dbConn.query(sql, [values], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				console.log("/acceptRequest step1 Success: " + " frndname = " + frndName + "; curr user = " + req.session.username);
			}
			mysql.returnDbConn(dbConn);
		});
		
		var query2 = dbConn.query("delete from notifications where notifEmail = ? and email2 = ? and nDesc = ?", [req.session.username, frndName, "FR"], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				console.log("/acceptRequest step2 Success: " + " frndname = " + frndName + "; curr user = " + req.session.username);
			}
			mysql.returnDbConn(dbConn);
		});
		var data = {
			notifEmail: frndName,
			email2: req.session.username,
			nDesc: "NOTIF"			
		};
		var query3 = dbConn.query("insert into notifications set ?", data, function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {
				console.log("/acceptRequest step3 Success: " + " frndname = " + frndName + "; curr user = " + req.session.username);
				req.session.status = "success";
				res.send(req.session);
			}
			mysql.returnDbConn(dbConn);
		});
	}
}

function getFriends(req, res, userId, isGuestProfile) {
	var dbConn = mysql.getDbConn();	
	if(dbConn === "empty"){
		dbUtil.waitPool({name: "getFriends", request: req, response: res});
	}
	else {
		var query = dbConn.query("select email, firstName, lastName from users where email in (select email2 from friends where email1 =?)", [userId], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {								
				if(isGuestProfile) {
					req.session.fProfile.friends = rows;
					res.send(req.session);
				}
				else {
					for(var i = 0; i < rows.length; i++) {
						rows[i].isFriend = true;
					}					
					req.session.userProfile.friends = rows;					
					getNotifications(req, res, userId, false);					
				}
			}
			mysql.returnDbConn(dbConn);
		});
	}
}

exports.userFriends = function(req, res) {
	var userId = req.session.username;
	console.log("/userFriends: curr user = " + req.session.username);
	getFriends(req, res, userId, false);
}

exports.refreshProfile = function(req, res) {
	var userId = req.session.username;
	req.session.fProfile = {};
	console.log("/refreshProfile: curr user = " + req.session.username);
	getGroups(req, res, userId, false);
}
	

function getGroups(req, res, userId, isGuestProfile) {
	var dbConn = mysql.getDbConn();
	if(dbConn === "empty"){
		dbUtil.waitPool({name:"getGroups", request: req, response: res});
	}
	else {
		var query = dbConn.query("select groupId, gName, gDesc, gAdmin from groups where groupId in (select groupId from UserGroups where email = ?)", [userId], function(err, rows) {
			process.nextTick(function(){
				mysql.waitPool(null);
			});
			if (err) {
				console.log(err);
				exce.mySqlException(err, res);
			} 
			else {				
				if(isGuestProfile) {
					req.session.fProfile.groups = rows;
					getFriends(req, res, userId, true);
				}
				else {
					req.session.userProfile.groups = rows;
				}
			}
			mysql.returnDbConn(dbConn);
		});
		if(!isGuestProfile) {
			var query = dbConn.query("select groupId, gName, gDesc, gAdmin from groups where gAdmin = ?", [userId], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
				});
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
				} 
				else {				
					req.session.userProfile.myGroups = rows;
					getFriends(req, res, userId, false);				
				}
				mysql.returnDbConn(dbConn);
			});
		}
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
	var userId = req.session.username;
	getGroups(req, res, userId, false);
}

/*Method to verify login*/
exports.login = function(req, res) {
	var userId = req.body.userId;
	var password = req.body.password;
	if((userId != "undefined" || userId != "") && (password != "undefined" || password != "")) {
		var dbConn = mysql.getDbConn();
		if(dbConn === "empty"){
			dbUtil.waitPool({name:"login", request: req, response: res});
		} 
		else {
			var query = dbConn.query("select email, firstname, lastname, gender, dob, work, education from users where email = ? and password = ?", [userId, password], function(err, rows) {
				process.nextTick(function(){
					mysql.waitPool(null);
				});		
				if (err) {
					console.log(err);
					exce.mySqlException(err, res);
				} else {
					if(rows.length > 0) {
						//console.log("req.session now...");
						//console.log(req.session);
						req.session.username = userId;
						req.session.userProfile = rows[0];
						//console.log("login rows");
						console.log("logged in as: " + req.session.username);
						getGroups(req, res, userId, false);
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
	var fname = req.body.firstname, 
	lname = req.body.lastname,
	email = req.body.email, 
	pswd = req.body.password;
	gender = req.body.gender,
	dob = req.body.dob;
	console.log("/signup: new user = " + email);
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
					if(err.errno == 1062) {	
						res.status(500).send("User email already exists. Please try again");
					}
					exce.mySqlException(err, res);
				} 
				else {
					req.session.username = email;
					req.session.userProfile = {};					
					req.session.userProfile.firstname = fname;
					req.session.userProfile.lastname = lname;
					req.session.userProfile.gender = gender;
					req.session.userProfile.dob = dob;
					req.session.userProfile.friends = [];
					console.log("/signup success: " + email);
					req.session.status = "success";
					res.send(req.session);
				}
				mysql.returnDbConn(dbConn);
			});
		}
	}