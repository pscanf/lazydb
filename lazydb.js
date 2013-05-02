/* Required modules */
var fs = require("fs");
var crypto = require("crypto");
var error = require("./error.js");

/* Utility function(s) */
var hash = function (buffer) {
	var hash = crypto.createHash("sha256");
	hash.update(buffer);
	return hash.digest("hex");
};

var init_db = function (dir, callback) {

	var db = {};

	/* Public properties */
	db.path = dir;

	/* Public methods (API Calls) */

	db.get = function (key, callback) {
		if (!Buffer.isBuffer(key)) {
			callback(error[400]);
			return;
		}
		var key_path = dir + "/" + hash(key) + ".key";
		var value_path = dir + "/" + hash(key) + ".value";
		fs.exists(key_path, function (exists) {
			if (!exists) {
				callback(error[400]);
				return;
			}
			fs.readFile(value_path, function (err, buffer) {
				if (err) {
					callback(error[500]);
					return;
				}
				callback(false, buffer);
			});
		});
	};

	db.put = function (key, value, callback) {
		if ( !Buffer.isBuffer(key) || !Buffer.isBuffer(value) ) {
			callback(error[400]);
			return;
		}
		var key_path = dir + "/" + hash(key) + ".key";
		var value_path = dir + "/" + hash(key) + ".value";
		fs.writeFile(value_path, value, function (err) {
			if (err) {
				callback(error[500]);
				return;
			}
			fs.writeFile(key_path, key, function (err) {
				if (err) {
					fs.unlink(value_path, function (err) {
						if (err) {
							console.log("Unable to delete value file " + value_path);
						}
						callback(error[500]);
						return;
					});
					return;
				}
				callback(false);
			});
		});
	};

	db.del = function (key, callback) {
		if (!Buffer.isBuffer(key)) {
			callback(error[400]);
			return;
		}
		var key_path = dir + "/" + hash(key) + ".key";
		var value_path = dir + "/" + hash(key) + ".value";
		fs.exists(key_path, function (exists) {
			if (!exists) {
				callback(error[400]);
				return;
			}
			fs.unlink(key_path, function (err) {
				if (err) {
					callback(error[500]);
					return;
				}
				fs.unlink(value_path, function (err) {
					if (err) {
						console.log("Unable to delete value file " + value_path);
					}
				});
				callback(false);
			});
		});
	};

	db.lsk = function (callback) {
		fs.readdir(dir, function (err, files) {
			if (err) {
				callback(error[500]);
				return;
			}
			var keys = [];
			var i = 0;
			var read_key = function () {
				if (i === files.length) {
					callback(false, keys);
					return;
				}
				if ( /^[0-9a-z]{64}.key$/.test(files[i]) ) {
					fs.readFile(dir + "/" + files[i], push_key);
				} else {
					i = i + 1;
					read_key(i);
				}
			};
			var push_key = function (err, key) {
				if (err) {
					callback(error[500]);
					return;
				}
				keys.push(key);
				i = i + 1;
				read_key(); 
			};
			read_key();
		});
	};

	callback(false, db);
};

exports.open = function (dir, callback) {
	fs.exists(dir, function (exists) {
		if (exists) {
			init_db(dir, callback);
		} else {
			fs.mkdir(dir, function (err) {
				if (err) {
					callback(error[500]);
					return;
				}
				init_db(dir, callback);
			});
		}
	});
};
