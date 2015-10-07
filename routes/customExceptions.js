/**
 * Checks the MySQL exception and depending on error number sends a custom
 * message.
 */
exports.mySqlException = function(err, res) {
	if (err !== undefined || err.errno !== undefined) {
		if (err.errno === 1062) {
			// Unique key violations
			res
					.send({
//						'error' : 'User with mail id already exists. Please enter a new mail id.'
						'error' : 'Unique Constraint failed. Data already present in db.'
					});
		} else if (err.errno === 1452) {
			// for foreign key violations.
			res.send({
				'error' : 'Invalid user id.'
			});
		} else if (err.errno === 1292) {
			// for Incorrect date value
			res.send({
				'error' : 'Invalid Date. Please enter a valid date'
			});
		} else if (err.errno === 1366) {
			res.send({
				'error' : 'User id should be an integer value.'
			});
		} else if (err.errno === 1064) {
			console
					.log('Error in sql syntax. Please check the log for complete error.');
			res
					.send({
						'error' : 'Facing some technical issues. Please try again later.'
					});
		}

		else {
			res.send({
				'error' : 'Something is wrong. Please check the data entered.'
			});
		}
	}
}

/**
 * Custom error with the message passed
 */
exports.customException = function(msg, res) {
	if (msg !== undefined) {
		res.send({
			'error' : msg
		});
	} else {
		res.send({
			'error' : 'Something went wrong. Please try again'
		});
	}
}