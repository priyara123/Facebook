
/*
 * GET home page.
 */

exports.index = function(req, res){
	if(req.session.username == null || req.session.username == undefined) {
		res.render('fbLogin');
	}
	else {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('profile');
	}
};

exports.home = function(req, res){
	if(req.session.username == null || req.session.username == undefined) {
		res.render('fbLogin');
	}
	else {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('home2');
	}
};

exports.displayGroup = function(req, res){
	if(req.session.username == null || req.session.username == undefined) {
		res.render('fbLogin');
	}
	else {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('viewGroup');
	}
};


exports.profile = function(req, res) {
	if(req.session.username == null || req.session.username == undefined) {
		res.render('fbLogin');
	}
	else {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('profile');
	}
};

exports.viewGuestProfile = function(req, res) {
	console.log("rendering requested guest profile; curr user = " + req.session.username);
	if(req.session.username == null || req.session.username == undefined) {
		res.render('fbLogin');
	}
	else {
		res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
		res.render('viewProfile');
	}
};
