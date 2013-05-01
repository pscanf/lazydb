var lazydb = require("./lazydb.js");
var fs = require("fs");
var crypto = require("crypto");

var hash = function (buffer) {
	var hash = crypto.createHash("sha256");
	hash.update(buffer);
	return hash.digest("hex");
};

var db;

var put_test = function (key, value, callback) {
	if (!callback) {
		callback = function () {};
	}
	db.put(key, value, function (err) {
		if (err) {
			console.log("Put error:");
			console.log(err);
			callback();
			return;
		}
		db.get(key, function (err, val) {
			if (err) {
				console.log("getValue error:");
				console.log(err);
				callback();
				return;
			}
			if (val.toString()!==value) {
				console.log("DB error: different values!!");
			}
			db.getKey(key, function (err, k) {
				if (err) {
					console.log("getKey error:");
					console.log(err);
					callback();
					return;
				}
				if (k.toString()!==key) {
					console.log("DB error: different keys!!");
				}
				callback();
			});
		});
	});
};

var get_keys_test = function (callback) {
	if (!callback) {
		callback = function () {};
	}
	db.getKeys(function (err, keys) {
		if (err) {
			console.log("getKeys error:");
			console.log(err);
			callback();
			return;
		}
		console.log(keys);
		callback();
	});
};

var del_test = function (key, callback) {
	if (!callback) {
		callback = function () {};
	}
	db.del(key, function (err) {
		if (err) {
			console.log("del error:");
			console.log(err);
			callback();
			return;
		}
		callback();
	});
};

var init_test = function () {
	put_test("1", "1", function () {
		put_test("2", "2", function () {
			get_keys_test(function () {
				del_test("2", function() {
					get_keys_test();
				});
			});
		});
	});
};

lazydb.open("./contacts", function (err, database) {
	if (err) {
		console.log(err);
	}
	db = database;
	init_test();
});
