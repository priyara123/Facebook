var mysql = require('mysql');
var queue = require('queue');
var pool = require('./enableConnPool');
var user = require('./user');
var poolQueue = new queue();
var waitQueue = new queue();

/* Method to get a single conn to the mysqldb */
function dbConnect() {
	var dbConn = mysql.createConnection({
		host     : 'localhost',
		user     : 'user',
		password : 'password',
		database: 'test'
	});	
	dbConn.connect();
	return dbConn;
}

/* Method to initialize the wait pool & conn pool */
function initPool(poolSize) {
	if (pool.enablePool && poolQueue != null) {
		poolQueue.start();
		console.log("creating db conn pool");
		while(poolSize > 0) {
			var conn = dbConnect();
			poolQueue.push(conn);
			poolSize--;
		}
	}
	else
		console.log("WARNING: CONN POOL NOT ENABLED");
	
	if(waitQueue !== null){
		waitQueue.start();
	}
}

/* Method to create a new conn and add it to pool queue */
function getConnection() {
	if(poolQueue.length > 0) {
		var dbConn = poolQueue.pop();
		return dbConn;
	}
}

/* Method to process diff user requests */
function processRequest(userRequest) {
	console.log("got user request " + userReq.name);
	switch(userReq.name){
		case "insertUser":
			user.signUp(userReq.request, userReq.response);
			break;
		case "validateUser":
			user.validateUser(userReq.request, userReq.response);
			break;
		case "viewProfile":
			user.viewProfile(userReq.request, userReq.response);
			break;
		case "logout":
			user.logout(userReq.request, userReq.response);
			break;
		case "addPost":
			user.addPost(userReq.request, userReq.response);
			break;
		case "getPosts":
			user.getPosts(userReq.request, userReq.response);
			break;
		case "findFriends":
			user.userFriends(userReq.request, userReq.response);
			break;
		case "findGroups":
			user.userGroups(userReq.request, userReq.response);
			break;
		case "fViewProfile":
			user.fViewProfile(userReq.request, userReq.response);
			break;
		case "search":
			user.search(userReq.request, userReq.response);
			break;
		case "isFriend":
			user.isFriend(userReq.request, userReq.response);
			break;
		case "searchMember":
			user.searchMember(userReq.request, userReq.response);
			break;
		case "acceptRequest":
			user.acceptRequest(userReq.request, userReq.response);
			break;
		case "insertEducation":
			user.insertEducation(userReq.request, userReq.response);
			break;
		case "updateExperience":
			user.updateExperience(userReq.request, userReq.response);
			break;
		case "insertExperience":
			user.insertExperience(userReq.request, userReq.response);
			break;
		case "insertSummary":
			user.insertSummary(userReq.request, userReq.response);
			break;
		case "getNotifications":
			user.getNotifications(userReq.request, userReq.response);
			break;
		case "acceptinvitation":
			user.acceptinvitation(userReq.request, userReq.response);
			break;
		case "rejectinvitation":
			user.rejectinvitation(userReq.request, userReq.response);
			break;
		case "removeconnection":
			user.removeconnection(userReq.request, userReq.response);
			break;
		case "getProfile":
			user.getProfile(userReq.request, userReq.response);
			break;
		case "getSummary":
			user.getSummary();
			break;
		case "getExperience":
			user.getExperience();
			break;
		case "getEducation":
			user.getEducation();
			break;
		}
}


/* Method to fetch pool size */
function getPoolSize(){
	if(poolQueue != null){		
		return poolQueue.length;
	}
}

/* Method to implement wait queues for user requests
 * Adds the requests to waitQueue when all the conns 
 * in the db pool are in use. */
function waitPool(userRequest){	
	if(!pool.enablePool) {
		return;
	}
//	if(poolQueue != null){
		if(poolQueue.length <= 0){
			//add user request to wait queue
			if(userRequest != null){
				console.log("All dbConns are being used, adding user to waitQueue");
				waitQueue.push(userRequest);
			}
		}
		else{
			//process request from wait queue
			if(waitQueue.length <= 0){
				return;
			}
			//waitQ is a stack from inside, so 
			//read it reverse to get queue version of it
			waitQueue.reverse();
			var userReq = waitQueue.pop();
			//reverse again after popping to maintain the original order of requests
			waitQueue.reverse();
			processRequest(userReq);
		}
	//}
}


/* Method to terminate the wait pool & conn pool*/
function terminateConnPool(){
	if(poolQueue !== null){
		poolQueue.stop();
	}
	if(waitQueue !== null){
		waitQueue.stop();
	}
}

/* Method to get a conn from the conn pool
 * If all the connections in the pool are being used,
 * it returns "empty" else, it returns a conn from the pool
 * using getConnection() method*/
function getDbConn(){
	var dbConn;
	if(pool.enablePool == true){
		if(getPoolSize() <= 0){
			console.log("Sending empty reply. curr pool size = " + poolQueue.length);
			dbConn = "empty";
		}
		else {
//			console.log("fetching conn from pool");
//			console.log("curr pool size = " + poolQueue.length);
			dbConn = getConnection();
		}
	}
	else {
		console.log("conn pooling not enabled, creating a new dbConn");
		dbConn = dbConnect();
	}
    return dbConn;
}
/* Method to add back the connection to pool*/
function addConnection(dbConn) {
	if(pool !== null){		
		poolQueue.push(dbConn);
	}
}

/* Method to recycle the conn pool
 * Returns the conn back to pool if pooling is enabled
 * if pooling is disabled, just ends the conn */
function returnDbConn(dbConn){
	if(pool.enablePool === true){
		//console.log("returning connection...");
		addConnection(dbConn);
	}
	else {
		dbConn.end();
	}
}
exports.initPool = initPool;
exports.getDbConn = getDbConn;
exports.returnDbConn = returnDbConn;
exports.waitPool = waitPool;
exports.getPoolSize = getPoolSize;