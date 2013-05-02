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

var init_db = function (dir) {

	/* Private properties */
	var db;

	/* Public properties */
	var lazydb = {};

	/* Private methods */

	var d_load_db = function () {
		var db = {};
		var files, subdir, basename, key_path, value_path;
		var subdirs = fs.readdirSync(dir);
		for (var i=0; i<subdirs.length; i++) {
			subdir = subdirs[i];
			if ( (/^[0-9a-f]{2}$/).test(subdir) ) {
				files = fs.readdirSync(dir + "/" + subdir);
				for (var j=0; j<files.length; j++) {
					if ( (/^[0-9a-f]{64}.key$/).test(files[j]) ) {
						basename = files[j].slice(0, 64);
						key_path = dir + "/" + subdir + "/" + basename + ".key";
						value_path = dir + "/" + subdir + "/" + basename + ".value";
						db[basename] = {};
						db[basename].key = fs.readFileSync(key_path);
						db[basename].value = fs.readFileSync(value_path);
					}
				}
			}
		}
		return db;
	};

	var d_put_kvp = function (key, value, callback) {
		var hk = hash(key);
		var key_path = dir + "/" + hk.slice(0,2) + "/" + hk + ".key";
		var value_path = dir + "/" + hk.slice(0,2) + "/" + hk + ".value";
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

	var d_del_kvp = function (key, callback) {
		var hk = hash(key);
		var key_path = dir + "/" + hk.slice(0,2) + "/" + hk + ".key";
		var value_path = dir + "/" + hk.slice(0,2) + "/" + hk + ".value";
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
	};

	/* Public methods */

	lazydb.get = function (key) {
		var hk = hash(key);
		if (db[hk]) {
			return db[hk].value;
		}
	};

	lazydb.lsk = function () {
		var keys = [];
		for (var kvp in db) {
			if (db.hasOwnProperty(kvp)) {
				keys.push(db[kvp].key);
			}
		}
		return keys;
	};

	lazydb.put = function (key, value, callback) {
		if ( !Buffer.isBuffer(key) || !Buffer.isBuffer(value) ) {
			callback(error[400]);
			return;
		}
		d_put_kvp(key, value, function (err) {
			if (err) {
				callback(err);
				return;
			}
			var hk = hash(key);
			db[hk] = {
				key: key,
				value: value
			};
			callback(false);
		});
	};

	lazydb.del = function (key, callback) {
		var hk = hash(key);
		if (!db[hk]) {
			callback(error[400]);
			return;
		}
		d_del_kvp(key, function (err) {
			if (err) {
				callback(err);
				return;
			}
			delete db[hk];
			callback(false);
		});
	};


	/* Init */
	db = d_load_db();
	return lazydb;
};

exports.open = function (dir) {
	if ( !fs.existsSync(dir) ) {
		fs.mkdirSync(dir);
		var hex = "0123456789abcdef";
		for (var i=0; i<16; i++) {
			for (var j=0; j<16; j++) {
				fs.mkdir(dir + "/" + hex[i] + hex[j]);
			}
		}
	}
	return init_db(dir);
};
